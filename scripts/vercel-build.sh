#!/usr/bin/env bash
# Vercel build: prepares the database on production builds, then builds the app.
# Works with Supabase (DATABASE_URL + DIRECT_URL) or Vercel's Neon integration
# (DATABASE_URL + DATABASE_URL_UNPOOLED).
set -euo pipefail
export DIRECT_URL="${DIRECT_URL:-${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}}"
if [ -n "${DATABASE_URL:-}" ] && [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Syncing schema and sample data…"
  pnpm exec prisma db push --skip-generate
  pnpm exec tsx prisma/seed.ts
fi
pnpm exec next build
