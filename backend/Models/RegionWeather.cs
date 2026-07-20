namespace WeatherApi.Models;

/// <summary>
/// Live weather and air quality for a country's capital. Temperatures and AQI
/// are real values sourced from the Open-Meteo APIs and merged server-side.
/// </summary>
public record RegionWeather
{
    public required string Country { get; init; }
    public required string Capital { get; init; }

    /// <summary>ISO 3166-1 alpha-2 code (lower-case), used for flag images.</summary>
    public required string Code { get; init; }

    /// <summary>Flag emoji, used as a fallback when the flag image fails to load.</summary>
    public required string Flag { get; init; }

    public required string TimeZone { get; init; }
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public int TemperatureC { get; init; }
    public int TemperatureF { get; init; }
    public int WeatherCode { get; init; }
    public required string Summary { get; init; }

    /// <summary>US Air Quality Index (-1 when unavailable).</summary>
    public int Aqi { get; init; }

    /// <summary>Official US AQI category label (e.g. "Good", "Unhealthy").</summary>
    public required string AqiCategory { get; init; }

    /// <summary>ISO 4217 currency code (e.g. "INR"); empty when unknown.</summary>
    public required string CurrencyCode { get; init; }

    /// <summary>Currency symbol (e.g. "₹"); falls back to the code when unknown.</summary>
    public required string CurrencySymbol { get; init; }

    /// <summary>Live exchange rate: units of this currency per 1 USD (-1 when unavailable).</summary>
    public double CurrencyRate { get; init; }

    /// <summary>Year the country/state was founded (0 when unknown).</summary>
    public int EstablishedYear { get; init; }

    /// <summary>Official (or primary) language(s) of the country/territory.</summary>
    public required string OfficialLanguage { get; init; }
}
