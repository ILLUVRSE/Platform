# ILLUVRSE Web

Unified platform app for marketing, Studio (/studio), and News (/news).

## Dev

From repo root:

```bash
pnpm dev
# or
pnpm --filter web dev
```

## Related apps

- Food and GridStock run as separate apps and can be proxied under `/food` and `/gridstock`.
- Set `FOOD_UPSTREAM_URL` and `GRIDSTOCK_UPSTREAM_URL` in the web app env when running them locally.

## Environment

- `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` are required for `/news` auth and database access.
- `INTERNAL_API_TOKEN` is required for `/news/api/internal/*`.
