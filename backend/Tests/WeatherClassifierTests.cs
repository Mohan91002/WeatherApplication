using WeatherApi.Services;
using Xunit;

namespace WeatherApplication.Tests;

public class WeatherClassifierTests
{
    [Theory]
    [InlineData(0, "Clear sky")]
    [InlineData(2, "Partly cloudy")]
    [InlineData(3, "Overcast")]
    [InlineData(61, "Rain")]
    [InlineData(75, "Snow")]
    [InlineData(95, "Thunderstorm")]
    [InlineData(99, "Thunderstorm with hail")]
    [InlineData(-1, "Unavailable")]     // placeholder / no reading
    [InlineData(4242, "Unavailable")]   // unknown code
    public void DescribeWeatherCode_maps_known_and_unknown(int code, string expected)
    {
        Assert.Equal(expected, WeatherClassifier.DescribeWeatherCode(code));
    }

    [Theory]
    [InlineData(-1, "N/A")]
    [InlineData(0, "Good")]
    [InlineData(50, "Good")]
    [InlineData(51, "Moderate")]
    [InlineData(100, "Moderate")]
    [InlineData(101, "Unhealthy (sensitive)")]
    [InlineData(150, "Unhealthy (sensitive)")]
    [InlineData(151, "Unhealthy")]
    [InlineData(200, "Unhealthy")]
    [InlineData(201, "Very unhealthy")]
    [InlineData(300, "Very unhealthy")]
    [InlineData(301, "Hazardous")]
    [InlineData(999, "Hazardous")]
    public void AqiCategory_maps_epa_bands_at_boundaries(int aqi, string expected)
    {
        Assert.Equal(expected, WeatherClassifier.AqiCategory(aqi));
    }

    [Theory]
    [InlineData(0, 32)]
    [InlineData(100, 212)]
    [InlineData(-40, -40)]
    [InlineData(31, 88)]   // 87.8 -> 88
    [InlineData(-4, 25)]   // 24.8 -> 25
    [InlineData(37, 99)]   // 98.6 -> 99
    public void ToFahrenheit_converts_and_rounds(int celsius, int expected)
    {
        Assert.Equal(expected, WeatherClassifier.ToFahrenheit(celsius));
    }
}
