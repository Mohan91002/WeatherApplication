# Dependencies & Requirements — WeatherApplication

Everything needed to build and run the two units: the **.NET 10 API** (backend)
and the **Angular 18 SPA** (frontend). Extracted from `backend/WeatherApplication.csproj`,
`backend/Tests/WeatherApplication.Tests.csproj`, and `frontend/package.json`.

---

## 1. Toolchain / prerequisites

| Tool | Required | Verified in this environment | Notes |
| ---- | -------- | ---------------------------- | ----- |
| **.NET SDK** | 10.0+ | `10.0.100` ✅ | Builds & runs the API and the xUnit tests. |
| **Node.js** | 18.19+ / 20+ / 22+ | `v24.12.0` ✅ | Runs the Angular CLI. Node 24 works fine. |
| **Angular CLI** | 18.2 (local, in `node_modules`) | present ✅ | Invoked via `node`, not a global `ng`. |
| **yarn** | 1.22+ *(optional)* | **not installed** ⚠️ | Not required — use the node launcher below. |
| **npm** | bundled with Node | `11.18.0` | Unreliable in this environment for some ops; deps are already vendored. |
| **Docker** | *(deploy only)* | — | For the container image (`Dockerfile`). |

> **Environment quirk:** `yarn`/global `ng` are not on `PATH`. The repo works
> around this with [`frontend/dev-serve.mjs`](frontend/dev-serve.mjs), which spawns
> the local Angular CLI directly through `node`. The preview launcher
> [`.claude/launch.json`](.claude/launch.json) uses it (`angular-dev` config).

---

## 2. Backend — .NET (NuGet)

### Runtime (`backend/WeatherApplication.csproj`, `net10.0`)
| Package | Version | Purpose |
| ------- | ------- | ------- |
| `Microsoft.AspNetCore.OpenApi` | `10.0.0` | OpenAPI document generation for the minimal API. |
| `Microsoft.OpenApi` | `2.7.6` | **Pinned** transitively-safe version. Overrides the vulnerable `2.0.0` pulled by the package above — fixes **NU1903 / GHSA-v5pm-xwqc-g5wc** (high; circular schema refs can terminate OpenAPI parsing). `2.7.5+` is the first patched 2.x release; staying on 2.x preserves API compatibility. |

Uses the ASP.NET Core shared framework (`Microsoft.NET.Sdk.Web`) for hosting,
DI, `HttpClient`, `MemoryCache`, CORS, etc. — no extra packages needed.

### Test (`backend/Tests/WeatherApplication.Tests.csproj`, `net10.0`)
| Package | Version | Purpose |
| ------- | ------- | ------- |
| `Microsoft.NET.Test.Sdk` | `17.12.0` | Test host/runner. |
| `xunit` | `2.9.2` | Test framework. |
| `xunit.runner.visualstudio` | `2.8.2` | VS/`dotnet test` adapter. |
| `Microsoft.AspNetCore.Mvc.Testing` | `10.0.0` | Boots the API in-memory via `WebApplicationFactory<Program>`. |

### Build / run
```bash
dotnet restore backend/WeatherApplication.csproj
dotnet build   backend/WeatherApplication.csproj -c Release
dotnet run     --project backend/WeatherApplication.csproj   # http://localhost:5135
dotnet test    backend/Tests/WeatherApplication.Tests.csproj
```

---

## 3. Frontend — Angular (npm, `frontend/package.json`)

### Runtime dependencies
| Package | Version | Purpose |
| ------- | ------- | ------- |
| `@angular/core`, `common`, `compiler`, `forms`, `router`, `animations` | `^18.2.0` | Angular 18 framework (standalone + signals). |
| `@angular/platform-browser`, `platform-browser-dynamic` | `^18.2.0` | Browser bootstrap. |
| `rxjs` | `~7.8.0` | Reactive streams (HTTP, state). |
| `tslib` | `^2.3.0` | TypeScript runtime helpers. |
| `zone.js` | `~0.14.10` | Angular change-detection zones. |

### Dev dependencies
| Package | Version | Purpose |
| ------- | ------- | ------- |
| `@angular/cli`, `@angular-devkit/build-angular`, `@angular/compiler-cli` | `^18.2.0` | Build/serve toolchain. |
| `typescript` | `~5.5.2` | Compiler. |
| `karma`, `karma-*`, `jasmine-core`, `@types/jasmine` | see file | Unit-test runner (Karma + Jasmine). |

### Install / build / run
```bash
cd frontend
npm install                         # or: yarn install  (deps already vendored here)
node dev-serve.mjs                  # ng serve on http://localhost:4200 (no global ng/yarn needed)
node node_modules/@angular/cli/bin/ng.js build   # production build → frontend/dist/
```

---

## 4. External runtime services (no API keys)

The **backend** calls these directly (results cached in-memory for 1 hour); on
egress failure the **browser** relays them and the backend still does all merging.

| Service | Host | Used for |
| ------- | ---- | -------- |
| Open-Meteo | `api.open-meteo.com` / `air-quality-api.open-meteo.com` | Live weather + air quality. |
| Exchange Rate API | `open.er-api.com` | Live USD-based FX rates. |
| flagcdn | `flagcdn.com` | Flag images (fetched by the browser). |
| Google Fonts | `fonts.googleapis.com` / `fonts.gstatic.com` | UI web fonts (frontend). |

> No secrets/keys are required. If keyed upstreams are ever added, store them in a
> secrets manager (see the deployment docs) — never in the client.

---

## 5. Deployment-only dependencies

| Dependency | Where | Purpose |
| ---------- | ----- | ------- |
| Docker | `cloud/Dockerfile`, `backend/.dockerignore` | Multi-stage API container (non-root, port 8080; build context `backend/`). |
| Terraform | `cloud/infra/*.tf` | Infrastructure-as-code (AWS topology). |

See [ARCHITECTURE.md](ARCHITECTURE.md) (vendor-neutral) and
[cloud/AWS_ARCHITECTURE.md](cloud/AWS_ARCHITECTURE.md) (AWS) for how these fit together.
