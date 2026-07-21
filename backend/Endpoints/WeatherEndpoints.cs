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
    public static IEndpointRouteBuilder MapWeatherEndpoints(this IEndpointRouteBuilder app)
    {
        // Liveness/readiness probe for the load balancer / App Runner health check.
        app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
            .WithName("Health");

        // The country dataset, owned by the backend. Also used by the browser
        // fallback to know which coordinates to query.
        app.MapGet("/api/countries", () => Countries.All)
            .WithName("GetCountries");

        // Live weather + air quality for every country, fetched and merged
        // server-side. Returns placeholder rows if the host cannot reach
        // Open-Meteo (the client then falls back to relaying the data itself).
        app.MapGet("/api/regions", async (IRegionWeatherService service, CancellationToken ct) =>
                await service.GetLiveRegionsAsync(ct))
            .WithName("GetRegions");

        // Fallback: the browser relays raw Open-Meteo results and the backend
        // performs all merging and classification. No business logic in the client.
        app.MapPost("/api/regions/merge", (RegionMergeRequest body, IRegionWeatherService service) =>
                service.MergeRelayed(body))
            .WithName("MergeRegions");

        return app;
    }
}
