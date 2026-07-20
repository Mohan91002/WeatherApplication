using System.Text.Json.Serialization;

namespace WeatherApi.Models;

/// <summary>One Open-Meteo forecast location result.</summary>
public record ForecastResult
{
    [JsonPropertyName("timezone")]
    public string? Timezone { get; init; }

    [JsonPropertyName("current")]
    public ForecastCurrent? Current { get; init; }
}

public record ForecastCurrent
{
    [JsonPropertyName("temperature_2m")]
    public double Temperature2m { get; init; }

    [JsonPropertyName("weather_code")]
    public int WeatherCode { get; init; }
}

/// <summary>One Open-Meteo air-quality location result.</summary>
public record AirQualityResult
{
    [JsonPropertyName("current")]
    public AirQualityCurrent? Current { get; init; }
}

public record AirQualityCurrent
{
    [JsonPropertyName("us_aqi")]
    public double? UsAqi { get; init; }
}

/// <summary>Live exchange rates from open.er-api.com (USD base).</summary>
public record ExchangeRatesResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; init; }

    [JsonPropertyName("base_code")]
    public string? BaseCode { get; init; }

    /// <summary>Currency code → units of that currency per 1 USD.</summary>
    [JsonPropertyName("rates")]
    public Dictionary<string, double>? Rates { get; init; }
}

/// <summary>
/// Raw Open-Meteo results (and live FX rates) relayed by the browser when the
/// backend host cannot reach those APIs directly. The forecast/air arrays are
/// aligned, by index, with the full country list returned by
/// <c>GET /api/countries</c>; rates are keyed by currency code.
/// </summary>
public record RegionMergeRequest
{
    public IReadOnlyList<ForecastResult> Forecast { get; init; } = [];
    public IReadOnlyList<AirQualityResult> Air { get; init; } = [];
    public IReadOnlyDictionary<string, double> Rates { get; init; } =
        new Dictionary<string, double>();
}
