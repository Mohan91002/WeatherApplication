namespace WeatherApi.Models;

/// <summary>
/// A single day's mock weather forecast returned by <c>GET /weatherforecast</c>.
/// </summary>
public record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)Math.Round(TemperatureC * 9.0 / 5.0);
}
