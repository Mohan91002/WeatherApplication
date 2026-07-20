using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace WeatherApplication.Tests;

public class EndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public EndpointsTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Health_returns_ok()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetWeatherForecast_returns_five_days()
    {
        var client = _factory.CreateClient();

        var forecast = await client.GetFromJsonAsync<List<JsonElement>>("/weatherforecast");

        Assert.NotNull(forecast);
        Assert.Equal(5, forecast!.Count);
        Assert.True(forecast[0].TryGetProperty("temperatureF", out _));
    }

    [Fact]
    public async Task GetCountries_returns_the_full_dataset()
    {
        var client = _factory.CreateClient();

        var countries = await client.GetFromJsonAsync<List<JsonElement>>("/api/countries");

        Assert.NotNull(countries);
        Assert.Equal(253, countries!.Count);
        Assert.Contains(countries, c => c.GetProperty("country").GetString() == "India");
    }

    [Fact]
    public async Task PostRegionsMerge_classifies_relayed_data()
    {
        var client = _factory.CreateClient();
        var body = new
        {
            forecast = new[]
            {
                new { timezone = "Asia/Kabul", current = new { temperature_2m = 30.6, weather_code = 95 } },
            },
            air = new[] { new { current = new { us_aqi = 175 } } },
            rates = new Dictionary<string, double> { ["AFN"] = 70 },
        };

        var response = await client.PostAsJsonAsync("/api/regions/merge", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var regions = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
        Assert.NotNull(regions);
        Assert.Equal(253, regions!.Count);

        var afghanistan = regions[0];
        Assert.Equal("Thunderstorm", afghanistan.GetProperty("summary").GetString());
        Assert.Equal(88, afghanistan.GetProperty("temperatureF").GetInt32());
        Assert.Equal("Unhealthy", afghanistan.GetProperty("aqiCategory").GetString());
        Assert.Equal(70, afghanistan.GetProperty("currencyRate").GetDouble());
        Assert.Equal(1709, afghanistan.GetProperty("establishedYear").GetInt32());
    }

    [Fact]
    public async Task PostRegionsMerge_localizes_summary_when_lang_is_requested()
    {
        var client = _factory.CreateClient();
        var body = new
        {
            forecast = new[]
            {
                new { timezone = "Asia/Kabul", current = new { temperature_2m = 30.6, weather_code = 95 } },
            },
            air = new[] { new { current = new { us_aqi = 175 } } },
            rates = new Dictionary<string, double>(),
        };

        var response = await client.PostAsJsonAsync("/api/regions/merge?lang=hi", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var regions = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
        Assert.NotNull(regions);
        var afghanistan = regions![0];
        Assert.Equal("आंधी-तूफान", afghanistan.GetProperty("summary").GetString()); // Thunderstorm
        Assert.Equal("अस्वस्थ", afghanistan.GetProperty("aqiCategory").GetString()); // Unhealthy
        // Numeric fields remain canonical.
        Assert.Equal(95, afghanistan.GetProperty("weatherCode").GetInt32());
    }
}
