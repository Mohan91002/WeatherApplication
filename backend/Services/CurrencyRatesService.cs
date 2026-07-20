using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;
using WeatherApi.Models;

namespace WeatherApi.Services;

/// <inheritdoc />
public sealed class CurrencyRatesService : ICurrencyRatesService
{
    // Free, no API key required. USD base, ~160 currencies.
    private const string RatesUrl = "https://open.er-api.com/v6/latest/USD";
    private const string CacheKey = "fx-rates-usd-v1";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CurrencyRatesService> _logger;

    public CurrencyRatesService(
        HttpClient http,
        IMemoryCache cache,
        ILogger<CurrencyRatesService> logger)
    {
        _http = http;
        _cache = cache;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, double>> GetRatesAsync(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKey, out IReadOnlyDictionary<string, double>? cached) && cached is not null)
        {
            return cached;
        }

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                var response = await _http.GetFromJsonAsync<ExchangeRatesResponse>(RatesUrl, ct);
                if (response is { Result: "success", Rates.Count: > 0 })
                {
                    _cache.Set(CacheKey, (IReadOnlyDictionary<string, double>)response.Rates, CacheTtl);
                    return response.Rates;
                }

                _logger.LogWarning("FX API returned no usable rates.");
                return EmptyRates;
            }
            catch (Exception ex) when (attempt < 1 && !ct.IsCancellationRequested)
            {
                _logger.LogDebug(ex, "FX request failed (attempt {Attempt}); retrying.", attempt + 1);
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "FX request failed; returning no rates.");
                return EmptyRates;
            }
        }
    }

    private static readonly IReadOnlyDictionary<string, double> EmptyRates =
        new Dictionary<string, double>();
}
