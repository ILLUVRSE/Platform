# Infra (Terraform)

This directory provisions AWS core infra and Cloudflare DNS/TLS for ILLUVRSE.

## Prereqs
- Terraform 1.5+
- AWS credentials with permissions for VPC/RDS/S3/SQS/KMS/Secrets Manager
- Cloudflare API token with zone edit permissions

## State bootstrap
Create an S3 bucket and DynamoDB table for remote state. Example (run manually or via your bootstrap tooling):
- S3 bucket: `illuvrse-terraform-state`
- DynamoDB table: `illuvrse-terraform-locks`

Copy `backend.tf.example` to `backend.tf` in the environment folder and update the bucket/table names.

## Environments
- `environments/staging`
- `environments/prod`

Each environment uses shared modules under `modules/`.

## Usage
From the environment folder:
- `terraform init`
- `terraform plan -var-file=terraform.tfvars`
- `terraform apply -var-file=terraform.tfvars`

## Notes
- pgvector is enabled at the DB level via SQL migrations; Terraform provisions the DB only.
- Cloudflare should be the authoritative DNS. Update the registrar to use Cloudflare nameservers.
- Vercel uses `cname.vercel-dns.com` for custom domains; the Cloudflare module creates `@` and `www` CNAME records.
- Kernel signing uses an asymmetric KMS key; pass `KERNEL_KMS_KEY_ID` to the Kernel service.

## Core service deploys (ECS)
- ECS cluster, ECR repos, and an ALB are provisioned per environment.
- Staging subdomains: `kernel-staging`, `sentinel-staging`, `agent-staging`.
- The ALB is configured for HTTPS with ACM DNS validation via Cloudflare.
