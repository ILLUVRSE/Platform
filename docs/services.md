# Service Builds

Use `Dockerfile.service` to build service images with build args.

Examples:

```
docker build -f Dockerfile.service \
  --build-arg SERVICE_NAME=@illuvrse/kernel \
  --build-arg SERVICE_PATH=apps/kernel \
  --build-arg SERVICE_ENTRY=apps/kernel/dist/index.js \
  -t illuvrse/kernel:latest .
```

```
docker build -f Dockerfile.service \
  --build-arg SERVICE_NAME=@illuvrse/agent-manager-service \
  --build-arg SERVICE_PATH=apps/agent-manager \
  --build-arg SERVICE_ENTRY=apps/agent-manager/dist/index.js \
  -t illuvrse/agent-manager:latest .
```

Repeat for `@illuvrse/sentinel`, `@illuvrse/marketplace`, `@illuvrse/finance`, and `@illuvrse/artifact-publisher`.
Use the same pattern for `@illuvrse/memory` with `apps/memory` and `apps/memory/dist/index.js`.
Use the same pattern for `@illuvrse/world-state` with `apps/world-state` and `apps/world-state/dist/index.js`.
Use the same pattern for `@illuvrse/avatar-registry` with `apps/avatar-registry` and `apps/avatar-registry/dist/index.js`.
Use the same pattern for `@illuvrse/voice` with `apps/voice` and `apps/voice/dist/index.js`.
