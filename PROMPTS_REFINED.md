# Build Prompts — WeatherApplication

The application-building prompts behind this app, grouped by area and ordered by
build priority — a sequence you could follow to recreate it. Operational steps
(run, stop, commit, push) and later-removed experiments (multi-language i18n and
the 7-day outlook) are intentionally left out.

## Backend & data — build first

- Keep all business logic in the .NET backend, cleanly separated from a presentation-only frontend.
- Build a countries dataset — name, capital, ISO code, flag, coordinates — including India's union territories.
- Integrate live weather and air quality from Open-Meteo: fetch, merge, and cache server-side, with a browser-relay fallback for when the API host can't reach upstream.
- Enrich each country with its currency (code + symbol) and a live exchange rate.
- Add each country's founding / established year.

## Frontend — the station board

- Scaffold an Angular SPA that only renders what the API returns — no business logic in the client.
- Apply a distinctive, weather-themed design system: equal-sized station cards, five per row, fully responsive.
- On each card, show local time (IST/GST-style time-zone labels), temperature, air quality, currency, and established year.
- Add sorting (country / capital / AQI / year) and a search box with a magnifier icon.
- Brand the board as "World Weather" with a weather logo.

## Interactive world map

- Add an interactive world-map backdrop (equirectangular land outline) that pans and zooms to the hovered country's region — anchoring it in the open area above the cards, and holding a centred world view when nothing is hovered.

## Quality & structure

- Add automated tests on both sides — xUnit for the backend, Karma/Jasmine for the frontend.
- Organise the repo into `backend/`, `frontend/`, and `cloud/`, with a README covering the project, skills, and languages.

## Deployment

- Containerize the API with a multi-stage, non-root Dockerfile.
- Define the AWS architecture: S3 + CloudFront for the SPA, ECR + App Runner for the API, plus Route 53, ACM, and CloudWatch.
- Add CI/CD (GitHub Actions with OIDC) and Terraform infrastructure — including a `tfvars` example and secrets checklist — documented in DEPLOY.md.
