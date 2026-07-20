using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using WeatherApi.Data;
using WeatherApi.Models;

namespace WeatherApi.Services;

/// <inheritdoc />
public sealed class RegionWeatherService : IRegionWeatherService
{
    private const string ForecastUrl = "https://api.open-meteo.com/v1/forecast";
    private const string AirQualityUrl = "https://air-quality-api.open-meteo.com/v1/air-quality";
    private const int ChunkSize = 200;
    private const string CacheKey = "live-regions-v1";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ICurrencyRatesService _currency;
    private readonly ILogger<RegionWeatherService> _logger;

    public RegionWeatherService(
        HttpClient http,
        IMemoryCache cache,
        ICurrencyRatesService currency,
        ILogger<RegionWeatherService> logger)
    {
        _http = http;
        _cache = cache;
        _currency = currency;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RegionWeather>> GetLiveRegionsAsync(string lang = "en", CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKey, out IReadOnlyList<RegionWeather>? cached) && cached is not null)
        {
            return Localize(cached, lang);
        }

        var rates = await _currency.GetRatesAsync(ct);
        var results = new List<RegionWeather>(Countries.All.Count);
        foreach (var chunk in Chunk(Countries.All, ChunkSize))
        {
            var (forecast, air) = await FetchChunkAsync(chunk, ct);
            results.AddRange(Merge(chunk, forecast, air, rates));
        }

        // Only cache a result that actually contains live data, so a blocked or
        // rate-limited (blank) response is not persisted for an hour.
        if (results.Any(r => r.WeatherCode >= 0 || r.Aqi >= 0))
        {
            _cache.Set(CacheKey, (IReadOnlyList<RegionWeather>)results, CacheTtl);
        }

        return Localize(results, lang);
    }

    /// <inheritdoc />
    public IReadOnlyList<RegionWeather> MergeRelayed(RegionMergeRequest request, string lang = "en") =>
        Localize(Merge(Countries.All, request.Forecast, request.Air, request.Rates), lang);

    /// <summary>
    /// Translates the canonical (English) summary and AQI category of each region
    /// into the requested language. The cache stays canonical/language-neutral;
    /// localization is applied per request. English is returned unchanged.
    /// </summary>
    private static IReadOnlyList<RegionWeather> Localize(IReadOnlyList<RegionWeather> regions, string lang)
    {
        if (Localizer.Normalize(lang) == "en")
        {
            return regions;
        }

        var localized = new List<RegionWeather>(regions.Count);
        foreach (var region in regions)
        {
            localized.Add(region with
            {
                Summary = Localizer.Translate(region.Summary, lang),
                AqiCategory = Localizer.Translate(region.AqiCategory, lang),
            });
        }

        return localized;
    }

    private async Task<(IReadOnlyList<ForecastResult> Forecast, IReadOnlyList<AirQualityResult> Air)>
        FetchChunkAsync(IReadOnlyList<CountryInfo> countries, CancellationToken ct)
    {
        var latitude = string.Join(",", countries.Select(c => c.Latitude.ToString(CultureInfo.InvariantCulture)));
        var longitude = string.Join(",", countries.Select(c => c.Longitude.ToString(CultureInfo.InvariantCulture)));

        var forecastUrl =
            $"{ForecastUrl}?latitude={latitude}&longitude={longitude}&current=temperature_2m,weather_code&timezone=auto";
        var airUrl = $"{AirQualityUrl}?latitude={latitude}&longitude={longitude}&current=us_aqi";

        var forecastTask = GetAsync<ForecastResult>(forecastUrl, ct);
        var airTask = GetAsync<AirQualityResult>(airUrl, ct);
        await Task.WhenAll(forecastTask, airTask);
        return (forecastTask.Result, airTask.Result);
    }

    /// <summary>
    /// GETs a JSON payload and normalises it to a list, retrying once. Any
    /// failure (including the sandbox's blocked outbound HTTPS) yields an empty
    /// list so one location's failure never blanks the others.
    /// </summary>
    private async Task<IReadOnlyList<T>> GetAsync<T>(string url, CancellationToken ct)
    {
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                var json = await _http.GetStringAsync(url, ct);
                return Normalize<T>(json);
            }
            catch (Exception ex) when (attempt < 1 && !ct.IsCancellationRequested)
            {
                _logger.LogDebug(ex, "Open-Meteo request failed (attempt {Attempt}); retrying.", attempt + 1);
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Open-Meteo request failed; returning empty result for this chunk.");
                return [];
            }
        }
    }

    /// <summary>Open-Meteo returns an array for many coordinates and a bare object for one.</summary>
    private static IReadOnlyList<T> Normalize<T>(string json)
    {
        using var document = JsonDocument.Parse(json);
        if (document.RootElement.ValueKind == JsonValueKind.Array)
        {
            return document.RootElement.Deserialize<List<T>>(JsonOptions) ?? [];
        }

        var single = document.RootElement.Deserialize<T>(JsonOptions);
        return single is null ? [] : [single];
    }

    /// <summary>
    /// Combines the country dataset with the forecast and air-quality results
    /// (index-aligned) into fully classified <see cref="RegionWeather"/> rows.
    /// Missing entries fall back to placeholder values.
    /// </summary>
    private static IReadOnlyList<RegionWeather> Merge(
        IReadOnlyList<CountryInfo> countries,
        IReadOnlyList<ForecastResult> forecast,
        IReadOnlyList<AirQualityResult> air,
        IReadOnlyDictionary<string, double> rates)
    {
        var regions = new List<RegionWeather>(countries.Count);
        for (var i = 0; i < countries.Count; i++)
        {
            var country = countries[i];
            var current = i < forecast.Count ? forecast[i]?.Current : null;
            var temperatureC = current is not null ? (int)Math.Round(current.Temperature2m) : 0;
            var weatherCode = current?.WeatherCode ?? -1;

            var usAqi = i < air.Count ? air[i]?.Current?.UsAqi : null;
            var aqi = usAqi is not null ? (int)Math.Round(usAqi.Value) : -1;

            var currencyRate = !string.IsNullOrEmpty(country.CurrencyCode)
                && rates.TryGetValue(country.CurrencyCode, out var rate)
                ? rate
                : -1;

            regions.Add(new RegionWeather
            {
                Country = country.Country,
                Capital = country.Capital,
                Code = country.Code,
                Flag = country.Flag,
                TimeZone = (i < forecast.Count ? forecast[i]?.Timezone : null) ?? "UTC",
                Latitude = country.Latitude,
                Longitude = country.Longitude,
                TemperatureC = temperatureC,
                TemperatureF = WeatherClassifier.ToFahrenheit(temperatureC),
                WeatherCode = weatherCode,
                Summary = WeatherClassifier.DescribeWeatherCode(weatherCode),
                Aqi = aqi,
                AqiCategory = WeatherClassifier.AqiCategory(aqi),
                CurrencyCode = country.CurrencyCode,
                CurrencySymbol = string.IsNullOrEmpty(country.CurrencySymbol)
                    ? country.CurrencyCode
                    : country.CurrencySymbol,
                CurrencyRate = currencyRate,
                EstablishedYear = country.EstablishedYear,
            });
        }

        return regions;
    }

    private static IEnumerable<IReadOnlyList<T>> Chunk<T>(IReadOnlyList<T> items, int size)
    {
        for (var i = 0; i < items.Count; i += size)
        {
            yield return items.Skip(i).Take(size).ToList();
        }
    }
}
