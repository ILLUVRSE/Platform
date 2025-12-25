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

- Food and GridStock live under `/food` and `/gridstock` inside the unified app.

## Environment

- `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` are required for `/news` auth and database access.
- `INTERNAL_API_TOKEN` is required for `/news/api/internal/*`.
