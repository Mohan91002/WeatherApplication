# GitHub Actions — Secrets & Variables Checklist

The `deploy` workflow (`.github/workflows/deploy.yml`) authenticates to AWS with
**OIDC** (no long-lived keys) and reads the following. Set them in
**GitHub → repo → Settings → Secrets and variables → Actions**.

## Secrets (Settings → Secrets)
| Secret | Example | How to get it |
| ------ | ------- | ------------- |
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/gh-weatherapplication-deploy` | Create the OIDC deploy role (below); copy its ARN |

## Variables (Settings → Variables)
| Variable | Example | Source |
| -------- | ------- | ------ |
| `AWS_REGION` | `us-east-1` | Your chosen region (match Terraform `aws_region`) |
| `ECR_REPOSITORY` | `weatherapplication-api` | Terraform output `ecr_repository_url` (repo name = last path segment) |
| `APPRUNNER_SERVICE_ARN` | `arn:aws:apprunner:us-east-1:123456789012:service/weatherapplication-api/abc123` | `aws apprunner list-services` or the App Runner console |
| `SPA_BUCKET` | `weatherapplication-spa` | Terraform output `spa_bucket` |
| `CLOUDFRONT_ID` | `E1A2B3C4D5E6F7` | Terraform output `cloudfront_id` |
| `API_BASE_URL` | `https://abc123.us-east-1.awsapprunner.com` | Terraform output `api_url` (leave empty for same-origin) |

> After `terraform apply`, run `terraform output` to read `ecr_repository_url`,
> `api_url`, `spa_bucket`, `cloudfront_id`, `cloudfront_domain` and paste them in.

---

## One-time: create the GitHub OIDC deploy role

1. **Add GitHub as an OIDC identity provider** (once per AWS account):
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. **Create a role** trusting your repo (replace `ORG/REPO`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
       "Action": "sts:AssumeRoleWithWebIdentity",
       "Condition": {
         "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
         "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:ref:refs/heads/main" }
       }
     }]
   }
   ```

3. **Attach a least-privilege deploy policy** (scope resources to your account/region):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Sid": "Ecr", "Effect": "Allow",
         "Action": ["ecr:GetAuthorizationToken","ecr:BatchCheckLayerAvailability","ecr:InitiateLayerUpload","ecr:UploadLayerPart","ecr:CompleteLayerUpload","ecr:PutImage","ecr:BatchGetImage"],
         "Resource": "*" },
       { "Sid": "AppRunner", "Effect": "Allow",
         "Action": ["apprunner:StartDeployment","apprunner:DescribeService"],
         "Resource": "arn:aws:apprunner:*:123456789012:service/weatherapplication-api/*" },
       { "Sid": "SpaDeploy", "Effect": "Allow",
         "Action": ["s3:PutObject","s3:DeleteObject","s3:ListBucket"],
         "Resource": ["arn:aws:s3:::weatherapplication-spa","arn:aws:s3:::weatherapplication-spa/*"] },
       { "Sid": "Cdn", "Effect": "Allow",
         "Action": ["cloudfront:CreateInvalidation"],
         "Resource": "*" }
     ]
   }
   ```
   > Tighten `Resource: "*"` (ECR/CloudFront) to specific ARNs once created.

4. Copy the role ARN → set it as the `AWS_ROLE_ARN` secret.

---

## Order of operations (first deploy)
1. `cd infra && cp terraform.tfvars.example terraform.tfvars` → fill values.
2. `terraform init && terraform apply` → creates ECR, App Runner, S3, CloudFront…
3. Seed the first image (App Runner needs one present) — see `DEPLOY.md`.
4. Set the GitHub secrets/vars above from `terraform output`.
5. Push to `main` → the pipeline tests, builds, and deploys automatically.

## Verify the pipeline
- Actions run is green (backend-test, frontend-test, deploy).
- `GET <api_url>/health` → 200.
- SPA loads at the CloudFront domain and calls the API (no CORS errors in console).
