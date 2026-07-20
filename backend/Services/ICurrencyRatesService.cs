namespace WeatherApi.Services;

/// <summary>
/// Provides live foreign-exchange rates (units of a currency per 1 USD),
/// fetched from a public API and cached. Backend-owned, like the weather
/// integration.
/// </summary>
public interface ICurrencyRatesService
{
    /// <summary>
    /// Returns cached rates if still fresh, otherwise fetches them. Keyed by ISO
    /// 4217 currency code; the value is how many units of that currency equal
    /// 1 USD. Returns an empty map if the host cannot reach the FX API.
    /// </summary>
    Task<IReadOnlyDictionary<string, double>> GetRatesAsync(CancellationToken ct = default);
}
