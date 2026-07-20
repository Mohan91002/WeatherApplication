namespace WeatherApi.Services;

/// <summary>
/// Pure, side-effect-free classification of raw weather numbers into the domain
/// values the UI displays: a WMO weather-code description, a US AQI category and
/// the Fahrenheit conversion. Presentation (gradients, icons, colours) stays in
/// the frontend; this is the data layer that owns the categorisation.
/// </summary>
public static class WeatherClassifier
{
    private static readonly IReadOnlyDictionary<int, string> WeatherCodeDescriptions =
        new Dictionary<int, string>
        {
            [0] = "Clear sky",
            [1] = "Mainly clear",
            [2] = "Partly cloudy",
            [3] = "Overcast",
            [45] = "Fog",
            [48] = "Fog",
            [51] = "Drizzle",
            [53] = "Drizzle",
            [55] = "Drizzle",
            [56] = "Freezing drizzle",
            [57] = "Freezing drizzle",
            [61] = "Rain",
            [63] = "Rain",
            [65] = "Rain",
            [66] = "Freezing rain",
            [67] = "Freezing rain",
            [71] = "Snow",
            [73] = "Snow",
            [75] = "Snow",
            [77] = "Snow grains",
            [80] = "Rain showers",
            [81] = "Rain showers",
            [82] = "Rain showers",
            [85] = "Snow showers",
            [86] = "Snow showers",
            [95] = "Thunderstorm",
            [96] = "Thunderstorm with hail",
            [99] = "Thunderstorm with hail",
        };

    /// <summary>
    /// Maps a WMO weather interpretation code (as returned by Open-Meteo) to a
    /// short human-readable description.
    /// </summary>
    public static string DescribeWeatherCode(int code) =>
        WeatherCodeDescriptions.TryGetValue(code, out var description) ? description : "Unavailable";

    /// <summary>
    /// Maps a US Air Quality Index value to its official category label.
    /// Negative values represent an unavailable reading.
    /// </summary>
    public static string AqiCategory(int aqi) => aqi switch
    {
        < 0 => "N/A",
        <= 50 => "Good",
        <= 100 => "Moderate",
        <= 150 => "Unhealthy (sensitive)",
        <= 200 => "Unhealthy",
        <= 300 => "Very unhealthy",
        _ => "Hazardous",
    };

    /// <summary>Converts a Celsius temperature to whole-degree Fahrenheit.</summary>
    public static int ToFahrenheit(int celsius) => (int)Math.Round(celsius * 9.0 / 5.0 + 32);
}
