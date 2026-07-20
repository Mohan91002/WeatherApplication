# Deployment Runbook — WeatherApplication

Deploys the **.NET API** (container → ECR → App Runner) and the **Angular SPA**
(S3 + CloudFront). See [PROJECT_PLAN.md](../PROJECT_PLAN.md) for cost/estimates.

## Files
| File | Purpose |
| ---- | ------- |
| `Dockerfile`, `backend/.dockerignore` | Build the API container (non-root, port 8080; context `backend/`) |
| `infra/*.tf` | Terraform: ECR, App Runner, S3, CloudFront, Route 53, ACM, CloudWatch |
| `../.github/workflows/deploy.yml` | CI/CD: test → build/push image → deploy API → sync SPA |
| `deploy/jira-backlog.csv` | Importable backlog (Jira: **System → External System Import → CSV**) |

## One-time setup
1. **Terraform provision** (creates ECR before the API can deploy):
   ```bash
   cd cloud/infra
   terraform init
   terraform apply -var="spa_origin=https://YOUR_SPA_DOMAIN"      # or the CloudFront domain
   ```
   Note the outputs: `ecr_repository_url`, `api_url`, `spa_bucket`, `cloudfront_id`, `cloudfront_domain`.
2. **Seed the first image** (App Runner needs an image present):
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <ecr_registry>
   docker build -f cloud/Dockerfile -t <ecr_repository_url>:latest backend/
   docker push <ecr_repository_url>:latest
   ```
3. **GitHub OIDC role** + set repo **vars/secrets** listed at the top of `deploy.yml`
   (`AWS_ROLE_ARN`, `AWS_REGION`, `ECR_REPOSITORY`, `APPRUNNER_SERVICE_ARN`,
   `SPA_BUCKET`, `CLOUDFRONT_ID`).
4. Point the SPA at the API: set `API_BASE_URL` (the app currently hardcodes
   `http://localhost:5135` in `weather.service.ts` — parameterise it via an
   Angular environment/build define before the prod build).

## Continuous deploy
Push to `main` → the workflow runs backend tests, frontend build+tests, builds &
pushes the image, triggers App Runner, syncs the SPA to S3, and invalidates
CloudFront.

## Go-live checklist
- [ ] API `/health` returns 200; App Runner health check green.
- [ ] **CORS**: `Cors__AllowedOrigins__0` = the real SPA origin (set by Terraform `spa_origin`).
- [ ] `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` (set in the image/App Runner) so HTTPS redirect doesn't loop behind TLS termination.
- [ ] SPA `API_BASE_URL` points at the App Runner URL (not localhost).
- [ ] Custom domain: `domain_name` + `hosted_zone_id` set → ACM validated, Route 53 alias live.
- [ ] CloudWatch alarms on 5xx and p95 latency; log retention set.
- [ ] Autoscaling min 1 / max 3 (App Runner concurrency).
- [ ] Lighthouse/a11y pass.

## Optional scale/security add-ons
- **ElastiCache (Redis)** for a shared cache when running >1 instance.
- **WAF** on CloudFront for edge protection/rate-limiting.
- **Secrets Manager** if you later add keyed upstream APIs.

## Resource hygiene (local dev)
Stop dev servers before building; run one build at a time; delete stale
`backend/bin backend/obj frontend/dist frontend/.angular` when regenerating; stop preview
servers after verifying — keeps RAM low.

## Rename the project folder (`WebApplication` → `WeatherApplication`)
The project, assembly, namespaces, `launch.json`, README and tests are already
`WeatherApplication`; only the top-level **folder** is still named
`WebApplication`. Renaming it is optional and purely cosmetic — no code
references the folder name, so the app builds/runs identically either way.

It **cannot** be renamed while an editor/agent session, terminal, or dev server
has it open (Windows won't rename a directory that is a process's current
directory — you'll get *"The process cannot access the file because it is being
used by another process"*). Do it externally:

1. Close any editor/terminal/Claude session open in the folder; stop the dev
   servers; if OneDrive is mid-sync, pause it.
2. Rename it — Explorer (right-click → **Rename** → `WeatherApplication`), or a
   terminal that is **not** inside the folder:
   ```powershell
   Set-Location "C:\Users\<you>\OneDrive - Accenture\Skill Dev\Claude"
   Rename-Item "WebApplication" "WeatherApplication"
   ```
3. Reopen the project from `...\Claude\WeatherApplication`. Nothing else changes.
