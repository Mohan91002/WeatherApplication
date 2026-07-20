using WeatherApi.Models;

namespace WeatherApi.Services;

/// <summary>
/// Owns the live weather + air-quality integration for every country: fetching
/// from Open-Meteo, merging with the country dataset, and classifying the
/// results. All of this is backend logic; the frontend only renders it.
/// </summary>
public interface IRegionWeatherService
{
    /// <summary>
    /// Returns cached live weather + air quality if still fresh, otherwise
    /// fetches it from Open-Meteo (chunked) and caches the result. Returns
    /// entries with placeholder values (temperature 0, AQI -1) when the host
    /// cannot reach Open-Meteo — the caller can detect this and fall back.
    /// </summary>
    Task<IReadOnlyList<RegionWeather>> GetLiveRegionsAsync(string lang = "en", CancellationToken ct = default);

    /// <summary>
    /// Merges raw Open-Meteo results — relayed by the browser when the backend
    /// host cannot reach Open-Meteo — against the full country dataset. The
    /// arrays are index-aligned with <see cref="Data.Countries.All"/>.
    /// </summary>
    IReadOnlyList<RegionWeather> MergeRelayed(RegionMergeRequest request, string lang = "en");
}
