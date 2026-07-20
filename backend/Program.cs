using WeatherApi.Endpoints;
using WeatherApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Backend owns the live weather integration: an in-memory cache (shared across
// clients, keeps us within Open-Meteo's rate limits) and a typed HttpClient.
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<IRegionWeatherService, RegionWeatherService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(20);
});
builder.Services.AddHttpClient<ICurrencyRatesService, CurrencyRatesService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(20);
});

// Allowed SPA origins. Defaults to the Angular dev server; in production set
// Cors:AllowedOrigins (e.g. env Cors__AllowedOrigins__0=https://app.example.com).
const string AngularDevCors = "AngularDevCors";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:4200"];
builder.Services.AddCors(options =>
{
    options.AddPolicy(AngularDevCors, policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(AngularDevCors);

app.MapWeatherEndpoints();

app.Run();

// Exposed so the test project can boot the app in-memory via WebApplicationFactory.
public partial class Program;
