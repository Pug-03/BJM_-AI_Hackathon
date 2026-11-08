#!/usr/bin/env bash
# Vercel build: prepares the database on production builds, then builds the app.
# Works with Supabase (DATABASE_URL + DIRECT_URL) or Vercel's Neon integration
# (DATABASE_URL + DATABASE_URL_UNPOOLED).
set -euo pipefail
export DIRECT_URL="${DIRECT_URL:-${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}}"
if [ -n "${DATABASE_URL:-}" ] && [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "Syncing schema…"
  pnpm exec prisma db push --skip-generate
  # Seeding takes several minutes; it only runs when the sample data is missing
  # or SEED_ON_BUILD=1 is set.
  if [ "${SEED_ON_BUILD:-}" = "1" ] || ! pnpm exec tsx scripts/has-samples.ts; then
    echo "Seeding sample data…"
    pnpm exec tsx prisma/seed.ts
  fi
fi
pnpm exec next build
