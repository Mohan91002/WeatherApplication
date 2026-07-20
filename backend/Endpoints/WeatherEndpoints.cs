using WeatherApi.Data;
using WeatherApi.Models;
using WeatherApi.Services;

namespace WeatherApi.Endpoints;

/// <summary>
/// Maps every HTTP endpoint the API exposes. Kept separate from
/// <c>Program.cs</c> so the wiring (services, middleware) and the routes read
/// independently.
/// </summary>
public static class WeatherEndpoints
{
    private static readonly string[] Summaries =
    [
        "Freezing", "Bracing", "Chilly", "Cool", "Mild",
        "Warm", "Balmy", "Hot", "Sweltering", "Scorching",
    ];

    public static IEndpointRouteBuilder MapWeatherEndpoints(this IEndpointRouteBuilder app)
    {
        // Liveness/readiness probe for the load balancer / App Runner health check.
        app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
            .WithName("Health");

        // Mock 5-day forecast (unchanged).
        app.MapGet("/weatherforecast", GetForecast)
            .WithName("GetWeatherForecast");

        // The country dataset, owned by the backend. Also used by the browser
        // fallback to know which coordinates to query.
        app.MapGet("/api/countries", () => Countries.All)
            .WithName("GetCountries");

        // Live weather + air quality for every country, fetched and merged
        // server-side and localized to ?lang= (weather descriptions + AQI
        // categories). Returns placeholder rows if the host cannot reach
        // Open-Meteo (the client then falls back to relaying the data itself).
        app.MapGet("/api/regions", async (IRegionWeatherService service, string? lang, CancellationToken ct) =>
                await service.GetLiveRegionsAsync(lang ?? "en", ct))
            .WithName("GetRegions");

        // Fallback: the browser relays raw Open-Meteo results and the backend
        // performs all merging/classification/localization. No business logic in
        // the client.
        app.MapPost("/api/regions/merge", (RegionMergeRequest body, IRegionWeatherService service, string? lang) =>
                service.MergeRelayed(body, lang ?? "en"))
            .WithName("MergeRegions");

        return app;
    }

    private static WeatherForecast[] GetForecast() =>
        Enumerable.Range(1, 5).Select(index =>
            new WeatherForecast(
                DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                Random.Shared.Next(-20, 55),
                Summaries[Random.Shared.Next(Summaries.Length)]))
        .ToArray();
}
