# Synoptic — World Weather Board

A full-stack weather dashboard that plots **253 countries and territories** as
live "synoptic stations" — each showing local time, temperature, sky conditions,
air quality, and a live currency exchange rate — over an **interactive world-map
backdrop** that pans and zooms to whichever station you hover.

It is built as a deliberate full-stack reference with one strict architectural
rule: **all business logic lives in the .NET backend; the Angular frontend is
presentation-only.**

---

## What it does

- **Live weather + air quality** for every country (via Open-Meteo) — fetched,
  chunked, retried, merged, and cached server-side (1-hour shared cache).
- **Live currency exchange rates** (open.er-api.com), USD-based, cached.
- **Server-side classification** — WMO code → description, AQI → category,
  °C → °F — never in the client.
- **Interactive world map** that pans/zooms to the hovered station.
- Sort (country / capital / AQI / year), search, favourites, India pinned first, infinite scroll.
- **Resilient by design** — if the backend can't reach the upstream APIs, the
  browser relays the raw responses back and the API *still* performs all
  merging / classification. The browser holds no domain logic.

---

## Languages & skills

| Area | Languages / technologies |
| ---- | ------------------------ |
| Backend | **C# (.NET 10)** — minimal APIs, DI, typed `HttpClient`, `IMemoryCache`, CORS |
| Frontend | **TypeScript**, **Angular 18** (standalone components, signals, `@if`/`@for`), **HTML**, **SCSS** |
| Infrastructure as code | **HCL / Terraform** |
| Containerization | **Docker** (multi-stage, non-root) |
| CI/CD | **YAML** — GitHub Actions with OIDC |
| Tooling & scripts | **JavaScript** (Node), **Bash** / **PowerShell** |

**Skills demonstrated:** REST API design · third-party API integration with
caching, retry & browser-relay fallback ·
responsive UI and interactive SVG data-visualization · unit + integration
testing (xUnit + `WebApplicationFactory`; Karma/Jasmine) · infrastructure-as-code ·
containerization · CI/CD with OIDC · AWS cloud architecture · security hardening
(locked CORS, private S3 + CloudFront OAC, non-root container, dependency-vulnerability
remediation).

---

## Project structure

```
WeatherApplication/
├── backend/                  # C# / .NET 10 API — ALL business logic
│   ├── Program.cs                 # host wiring: services, CORS, middleware
│   ├── Endpoints/                 # HTTP routes (WeatherEndpoints.cs)
│   ├── Models/                    # DTOs (WeatherForecast, CountryInfo, RegionWeather, …)
│   ├── Services/                  # weather/FX integration, classification
│   ├── Data/Countries.cs          # 253 countries/territories (name, capital, coords, currency, year)
│   ├── Properties/                # launchSettings.json
│   ├── appsettings*.json          # config
│   ├── WeatherApplication.http    # sample HTTP requests
│   ├── WeatherApplication.csproj
│   ├── .dockerignore              # backend build-context ignore (Docker context = backend/)
│   └── Tests/                     # xUnit unit + integration tests
├── frontend/                 # TypeScript / Angular 18 SPA — presentation only
│   ├── src/app/                   # components, services (map-focus, weather), models, shared
│   ├── dev-serve.mjs              # launches `ng serve` via Node (no global ng/yarn needed)
│   └── package.json
├── cloud/                    # deployment & infrastructure
│   ├── Dockerfile                 # API container (multi-stage, non-root; build context = backend/)
│   ├── infra/                     # Terraform: ECR, App Runner, S3, CloudFront, Route 53, ACM, CloudWatch
│   ├── deploy/                    # CI/CD setup notes + importable Jira backlog
│   ├── AWS_ARCHITECTURE.md        # AWS production topology (+ Mermaid diagram)
│   └── DEPLOY.md                  # deployment runbook + go-live checklist
├── ARCHITECTURE.md           # vendor-neutral architecture (proxy + containers) + Mermaid diagram
├── DEPENDENCIES.md           # full dependency & toolchain inventory
├── PROJECT_PLAN.md           # scope, estimates, cost
├── PROMPTS.md
├── CONTRIBUTING.md           # branch/PR workflow
└── .github/workflows/deploy.yml   # CI/CD (must live at repo root)
```

---

## Backend responsibilities

Everything that isn't purely visual is server-side:

| Concern | Where |
| ------- | ----- |
| Country list + coordinates + currency + founding year | `backend/Data/Countries.cs` → `GET /api/countries` |
| Live weather + air quality (fetch, chunk, retry, merge, cache) | `backend/Services/RegionWeatherService.cs` → `GET /api/regions` |
| Live exchange rates (USD base, cached) | `backend/Services/CurrencyRatesService.cs` |
| WMO code → description, AQI → category, °C → °F | `backend/Services/WeatherClassifier.cs` |
| Gradients, emoji, colours, layout, sorting, search, favourites, UI strings | `frontend/` (presentation only) |

### API endpoints

| Method | Route | Purpose |
| ------ | ----- | ------- |
| `GET`  | `/weatherforecast` | Mock 7-day forecast (starts Wednesday) |
| `GET`  | `/api/countries` | The country dataset |
| `GET`  | `/api/regions` | Live weather + air quality + currency, merged server-side |
| `POST` | `/api/regions/merge` | Fallback: merges raw Open-Meteo + FX results relayed by the browser |

---

## Getting started

**Prerequisites:** .NET SDK 10+, Node.js 18.19+ / 20+ / 22+. Full list in
[DEPENDENCIES.md](DEPENDENCIES.md).

### 1. Run the backend — http://localhost:5135
```bash
dotnet run --project backend/WeatherApplication.csproj
```
CORS is pre-configured for the Angular dev server at `http://localhost:4200`.

### 2. Run the frontend — http://localhost:4200
```bash
cd frontend
npm install            # install dependencies (yarn also works)
node dev-serve.mjs     # runs `ng serve` via Node — no global ng/yarn required
```
Then open <http://localhost:4200>. Both servers must be running; if the API is
down the UI shows a friendly error.

### Run the tests
```bash
# Backend — xUnit unit + integration tests
dotnet test backend/Tests/WeatherApplication.Tests.csproj

# Frontend — Karma/Jasmine
cd frontend && node node_modules/@angular/cli/bin/ng.js test --watch=false
```

---

## Deployment

The API ships as a container (→ ECR → **AWS App Runner**) and the SPA as static
assets (**S3 + CloudFront**). Build the image from the repo root:

```bash
docker build -f cloud/Dockerfile -t weatherapplication-api backend/
```

See [cloud/DEPLOY.md](cloud/DEPLOY.md) and [cloud/AWS_ARCHITECTURE.md](cloud/AWS_ARCHITECTURE.md)
for the full runbook and topology, or [ARCHITECTURE.md](ARCHITECTURE.md) for a
vendor-neutral (Docker Compose / Kubernetes) deployment.

---

## Documentation

| Doc | Covers |
| --- | ------ |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Toolchain + backend/frontend packages + external services |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Vendor-neutral architecture + diagram |
| [cloud/AWS_ARCHITECTURE.md](cloud/AWS_ARCHITECTURE.md) | AWS production topology + diagram |
| [cloud/DEPLOY.md](cloud/DEPLOY.md) | Deployment runbook + go-live checklist |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching / PR workflow |
| [PROJECT_PLAN.md](PROJECT_PLAN.md) | Scope, estimates, cost |

---

## Contributing

This repo uses a **feature-branch workflow** — branch off `main`, open a pull
request, let CI run, then merge. Details in [CONTRIBUTING.md](CONTRIBUTING.md).
