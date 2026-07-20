# Weather Forecast — .NET API + Angular Frontend

A full-stack sample with a strict split: **all business logic lives in the .NET
backend**, and the Angular frontend is presentation-only.

- **Backend** — .NET 10 minimal API. Owns the country dataset (incl. currency),
  the Open-Meteo integration, the live FX-rate integration, and all
  weather/AQI classification.
- **Frontend** — Angular 18 standalone app (`frontend/`) with a "Synoptic"
  weather-station design: each country is plotted as a station model (name,
  capital, founding year, local time + zone, live temp/air/currency), with a
  live world-extremes header over an **interactive world-map backdrop** that
  pans/zooms to whichever card you hover (and parallax-follows the cursor). Sort
  by country, capital, AQI or year. **Auto-localizes to the browser's language**
  (en, hi, es, fr, ar, zh, ja — with a switcher and Arabic RTL); the UI strings
  live in the frontend, the weather/AQI terms come localized from the backend.
  It renders what the API returns and holds no domain logic.

```
WeatherApplication/
├── Program.cs                 # host wiring: services, CORS, middleware
├── Endpoints/
│   └── WeatherEndpoints.cs     # all HTTP routes
├── Models/                     # WeatherForecast, CountryInfo, RegionWeather, Open-Meteo DTOs
├── Data/
│   └── Countries.cs            # 253 rows: 245 countries/territories + India's 8 union territories (name, capital, flag, coords, currency, founding year)
├── Services/
│   ├── WeatherClassifier.cs    # WMO code → description, AQI → category, °C → °F
│   ├── Localizer.cs            # weather/AQI term translations (7 languages)
│   ├── CurrencyRatesService.cs # live USD-based FX rates (open.er-api.com) + in-memory cache
│   └── RegionWeatherService.cs # Open-Meteo fetch (chunk/retry/merge) + FX rates + localization + cache
├── WeatherApplication.csproj
├── appsettings*.json
├── Properties/launchSettings.json
└── frontend/                   # Angular 18 SPA (presentation only)
    └── src/app/
        ├── components/         # outlook, station cards, interactive world map
        ├── services/i18n.service.ts      # auto-locale detection + UI translations + RTL
        ├── services/map-focus.service.ts # shares the hovered location with the map
        ├── services/weather.service.ts  # calls the .NET API (+ thin fallback relay)
        ├── shared/weather-visuals.ts     # gradients, emoji, AQI/temp colours, sky-cover (pure UI)
        └── models/                       # DTO shapes returned by the API
```

## Documentation

| Doc | What it covers |
| --- | -------------- |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Full toolchain, backend NuGet + frontend npm packages, external services, install/run commands. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Vendor-neutral architecture (proxy + containers; Docker Compose / Kubernetes) — no cloud lock-in. |
| [AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md) | AWS production topology (CloudFront + S3 + App Runner + ECR). |
| [DEPLOY.md](DEPLOY.md) | Deployment runbook + go-live checklist. |
| [PROJECT_PLAN.md](PROJECT_PLAN.md) | Scope, estimates, cost. |

## Backend responsibilities

Everything that isn't purely visual is server-side:

| Concern | Where |
| ------- | ----- |
| Country list + coordinates + currency (code/symbol) + founding year | `Data/Countries.cs` → `GET /api/countries` |
| Live weather + air quality (fetch, chunk, retry, merge, cache) | `Services/RegionWeatherService.cs` → `GET /api/regions` |
| Live exchange rates (USD base, cached) | `Services/CurrencyRatesService.cs` |
| WMO code → description, AQI → category, °C → °F | `Services/WeatherClassifier.cs` |
| Localized weather/AQI terms (en/hi/es/fr/ar/zh/ja) via `?lang=` | `Services/Localizer.cs` → `GET /api/regions`, `POST /api/regions/merge` |
| Gradients, weather emoji, AQI colours, currency formatting, UI-string localization, layout, sorting, search, favourites | Angular frontend (`services/i18n.service.ts`) |

### Endpoints

| Method | Route | Purpose |
| ------ | ----- | ------- |
| `GET`  | `/weatherforecast` | Mock 5-day forecast |
| `GET`  | `/api/countries` | The country dataset |
| `GET`  | `/api/regions` | Live weather + air quality + currency rate for every country, merged server-side |
| `POST` | `/api/regions/merge` | Fallback: merges raw Open-Meteo + FX results relayed by the browser (see below) |

### Live data & the browser fallback

The backend fetches Open-Meteo and the FX API directly and caches the results
in memory for an hour (shared across clients, keeps us within the upstream rate
limits). If the backend host cannot reach those APIs — some corporate networks
intercept or block outbound HTTPS — `GET /api/regions` returns placeholder rows.
The client detects that and falls back: it fetches the coordinates from
`/api/countries`, calls Open-Meteo **and** the FX API from the browser, and POSTs
the raw results back to `/api/regions/merge` so the backend still performs
**all** merging and classification. The browser is only a network relay; it
holds no business logic. In a normal deployment (backend has internet) the
fallback never fires.

Exchange rates are live USD-based values from [open.er-api.com](https://open.er-api.com)
(no API key). Each card shows the currency symbol and `$1 = <symbol><rate>`;
currencies the FX API doesn't cover (a handful of the 245) show "rate
unavailable".

## Prerequisites

| Tool | Version |
| ---- | ------- |
| .NET SDK | 10+ |
| Node.js  | 18.19+ / 20+ / 22+ |
| yarn     | 1.22+ (npm is broken in this environment) |

## 1. Run the backend (port 5135)

```bash
dotnet run
```

API: <http://localhost:5135/api/regions>
CORS is pre-configured to allow the Angular dev server at `http://localhost:4200`.

## 2. Run the frontend (port 4200)

```bash
cd frontend
yarn install
yarn start
```

Open <http://localhost:4200>. The dashboard shows a live card per country
(temperature, conditions, local time, and colour-coded air quality), with India
pinned first, favourites, search and infinite scroll.

## Notes

- Both servers must be running. If the API is down, the UI shows a friendly
  error message.
- The frontend uses Angular signals, standalone components, and the modern
  `@if` / `@for` control-flow syntax.
