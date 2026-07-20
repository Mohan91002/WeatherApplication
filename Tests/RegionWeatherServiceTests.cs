using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using WeatherApi.Data;
using WeatherApi.Models;
using WeatherApi.Services;
using Xunit;

namespace WeatherApplication.Tests;

public class RegionWeatherServiceTests
{
    /// <summary>Currency service stub — MergeRelayed never calls it.</summary>
    private sealed class NoRates : ICurrencyRatesService
    {
        public Task<IReadOnlyDictionary<string, double>> GetRatesAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<string, double>>(new Dictionary<string, double>());
    }

    private static RegionWeatherService CreateService() => new(
        new HttpClient(),
        new MemoryCache(new MemoryCacheOptions()),
        new NoRates(),
        NullLogger<RegionWeatherService>.Instance);

    [Fact]
    public void MergeRelayed_classifies_the_first_station_from_relayed_data()
    {
        var service = CreateService();
        var request = new RegionMergeRequest
        {
            Forecast =
            [
                new ForecastResult
                {
                    Timezone = "Asia/Kabul",
                    Current = new ForecastCurrent { Temperature2m = 30.6, WeatherCode = 95 },
                },
            ],
            Air = [new AirQualityResult { Current = new AirQualityCurrent { UsAqi = 175 } }],
            Rates = new Dictionary<string, double> { ["AFN"] = 70.0 },
        };

        var result = service.MergeRelayed(request);

        Assert.Equal(Countries.All.Count, result.Count);

        // Countries.All[0] is Afghanistan (code af, currency AFN, established 1709).
        var afghanistan = result[0];
        Assert.Equal("Afghanistan", afghanistan.Country);
        Assert.Equal("Kabul", afghanistan.Capital);
        Assert.Equal(31, afghanistan.TemperatureC);            // 30.6 rounded
        Assert.Equal(88, afghanistan.TemperatureF);            // 31C -> 88F
        Assert.Equal(95, afghanistan.WeatherCode);
        Assert.Equal("Thunderstorm", afghanistan.Summary);
        Assert.Equal(175, afghanistan.Aqi);
        Assert.Equal("Unhealthy", afghanistan.AqiCategory);
        Assert.Equal("AFN", afghanistan.CurrencyCode);
        Assert.Equal(70.0, afghanistan.CurrencyRate);
        Assert.Equal(1709, afghanistan.EstablishedYear);
        Assert.Equal("Asia/Kabul", afghanistan.TimeZone);
    }

    [Fact]
    public void MergeRelayed_fills_placeholders_when_a_station_has_no_data()
    {
        var service = CreateService();

        // Provide data only for index 0; every other station must fall back safely.
        var request = new RegionMergeRequest
        {
            Forecast = [new ForecastResult { Current = new ForecastCurrent { Temperature2m = 10, WeatherCode = 1 } }],
            Air = [new AirQualityResult { Current = new AirQualityCurrent { UsAqi = 20 } }],
            Rates = new Dictionary<string, double>(),
        };

        var result = service.MergeRelayed(request);
        var missing = result[1]; // no relayed data for this station

        Assert.Equal(0, missing.TemperatureC);
        Assert.Equal(32, missing.TemperatureF);         // 0C -> 32F
        Assert.Equal(-1, missing.WeatherCode);
        Assert.Equal("Unavailable", missing.Summary);
        Assert.Equal(-1, missing.Aqi);
        Assert.Equal("N/A", missing.AqiCategory);
        Assert.Equal(-1, missing.CurrencyRate);          // no rate supplied
        Assert.Equal("UTC", missing.TimeZone);
        Assert.False(string.IsNullOrEmpty(missing.CurrencyCode)); // static country data still present
    }

    [Fact]
    public void MergeRelayed_localizes_summary_and_aqi_for_the_requested_language()
    {
        var service = CreateService();
        var request = new RegionMergeRequest
        {
            Forecast = [new ForecastResult { Current = new ForecastCurrent { Temperature2m = 30, WeatherCode = 95 } }],
            Air = [new AirQualityResult { Current = new AirQualityCurrent { UsAqi = 175 } }],
            Rates = new Dictionary<string, double>(),
        };

        var hindi = service.MergeRelayed(request, "hi")[0];
        Assert.Equal("आंधी-तूफान", hindi.Summary); // Thunderstorm
        Assert.Equal("अस्वस्थ", hindi.AqiCategory); // Unhealthy

        // Canonical numeric fields are unaffected by localization.
        Assert.Equal(95, hindi.WeatherCode);
        Assert.Equal(175, hindi.Aqi);
    }

    [Fact]
    public void MergeRelayed_leaves_currency_rate_unavailable_when_code_missing_from_rates()
    {
        var service = CreateService();
        var request = new RegionMergeRequest
        {
            Forecast = [new ForecastResult { Current = new ForecastCurrent { Temperature2m = 20, WeatherCode = 0 } }],
            Air = [new AirQualityResult { Current = new AirQualityCurrent { UsAqi = 10 } }],
            Rates = new Dictionary<string, double> { ["ZZZ"] = 5 }, // unrelated currency
        };

        var afghanistan = service.MergeRelayed(request)[0];

        Assert.Equal(-1, afghanistan.CurrencyRate);
    }
}
