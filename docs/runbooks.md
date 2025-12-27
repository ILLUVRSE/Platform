# Ops Runbooks

## Kernel signing failure
- Check KMS key access (`KERNEL_KMS_KEY_ID`).
- Verify service token and CloudWatch logs.
- Fallback: switch to local signing for staging.

## Agent backlog
- Check SQS depth and AgentManager metrics.
- Scale ECS task count for AgentManager worker.
- Confirm job status updates are flowing to `/stream`.

## World state issues
- Verify `WORLD_STATE_URL` reachable.
- Check `/healthz` and `/snapshot`.
- Use `/moderate/remove` to clear stuck entities.

## Finance / delivery mismatch
- Verify Finance receipt signature.
- Confirm ArtifactPublisher delivery proof is generated.
- Inspect audit logs for matching sha256.

## Staging deploy (core services)
- Run the "Deploy Staging (Kernel/Sentinel/AgentManager)" GitHub Actions workflow.
- Confirm ECS services are stable and `/healthz` returns 200 for each subdomain.
