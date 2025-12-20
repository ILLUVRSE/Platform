# GridStock

CNBC/Bloomberg-style market terminal app in the ILLUVRSE workspace.

## Dev

From repo root:

```bash
pnpm dev:gridstock
# or
pnpm --filter gridstock dev -- --port 4002
```

## Build

```bash
pnpm --filter gridstock build
```

## Notes

- Set `NEXT_PUBLIC_PLATFORM_URL` for platform bar links back to the web app.
- Use `GRIDSTOCK_UPSTREAM_URL` in the web app env to proxy `/gridstock`.
