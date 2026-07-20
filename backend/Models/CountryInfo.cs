namespace WeatherApi.Models;

/// <summary>
/// A world country with the representative coordinates used to fetch live
/// weather and air quality from Open-Meteo. Sourced from the
/// mledoze/countries dataset.
/// </summary>
/// <param name="Country">Display name of the country.</param>
/// <param name="Capital">Capital city.</param>
/// <param name="Code">ISO 3166-1 alpha-2 code (lower-case), used for flag images.</param>
/// <param name="Flag">Flag emoji, used as a fallback when the flag image fails to load.</param>
/// <param name="Latitude">Representative latitude.</param>
/// <param name="Longitude">Representative longitude.</param>
/// <param name="CurrencyCode">ISO 4217 currency code (e.g. "INR"); empty when unknown.</param>
/// <param name="CurrencySymbol">Currency symbol (e.g. "₹"); falls back to the code when unknown.</param>
/// <param name="EstablishedYear">Year the country/state was founded (Wikidata inception); 0 when unknown.</param>
public record CountryInfo(
    string Country,
    string Capital,
    string Code,
    string Flag,
    double Latitude,
    double Longitude,
    string CurrencyCode,
    string CurrencySymbol,
    int EstablishedYear)
{
    /// <summary>Official (or primary) language(s) of the country/territory.</summary>
    public string OfficialLanguage { get; init; } = "";
}
