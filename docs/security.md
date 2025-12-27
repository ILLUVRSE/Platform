# Security Checklist

## Secrets and Keys
- Store service tokens in AWS Secrets Manager.
- Kernel signing key must be KMS SIGN_VERIFY (asymmetric).
- Rotate keys quarterly; audit rotation events.

## Application Security
- Dependency scanning (SCA) in CI.
- WAF enabled at Cloudflare edge.
- Rate limiting for `/api/agent/*` and `/api/marketplace/*`.

## Data Protection
- TLS enforced end-to-end (Cloudflare + origin).
- S3 buckets encrypted with KMS.
- RDS encrypted at rest with KMS.

## Audit
- Kernel sign/verify events logged to `AuditLog`.
- Agent approvals persisted to Postgres.
- Export audit CSV for compliance review.
