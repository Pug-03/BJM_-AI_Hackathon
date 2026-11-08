# Deploying ABLE (Vercel + Supabase)

These steps let someone else redeploy ABLE from scratch. Allow about 45 minutes.

## 1. Supabase

1. Create a project in the region closest to your users, e.g. Singapore.
2. **Database → Extensions:** enable `vector` (pgvector).
3. **Project Settings → Database:** copy two connection strings.
   - Pooled (port 6543, `?pgbouncer=true`) goes in `DATABASE_URL`.
   - Direct (port 5432) goes in `DIRECT_URL`.
4. **Storage:** create the buckets.
   - Public: `avatars`, `covers`, `posts`.
   - Private: `certificates`, `chat`, `verification` (identity and disability card uploads, deleted after review).

   The app serves private files only through short-lived signed URLs created with the service role. Do not add public read policies to `certificates`, `chat` or `verification`. Leave RLS on: the app never uses the anon key for storage.
5. **Realtime:** nothing to configure. The app uses broadcast channels (`able-convo-*`, `able-user-*`) sent through the REST API with the service key.
6. **Project Settings → API:** copy the URL, the `anon` key and the `service_role` key.

## 2. Schema and seed (from your machine)

```bash
pnpm i
DATABASE_URL="<direct url>" DIRECT_URL="<direct url>" pnpm db:push
DATABASE_URL="<direct url>" OPENAI_API_KEY="<key>" pnpm db:seed   # with the key, sample matches use embeddings
```

`db:seed` is idempotent. Run it again after schema changes.

## 3. Third-party keys

- **Google OAuth** (Google Cloud Console → Credentials → OAuth client, type "Web application"):
  - Authorized JavaScript origins: `https://<your-domain>`
  - Authorized redirect URI: `https://<your-domain>/api/auth/callback/google`
  - For local development, also add `http://localhost:3000` and `http://localhost:3000/api/auth/callback/google`.
- **Resend:** add and verify your sending domain (SPF and DKIM DNS records). Set `EMAIL_FROM="ABLE <no-reply@your-domain>"`.
- **OpenAI:** create an API key with access to `gpt-4o-transcribe`, `whisper-1` and `text-embedding-3-small`.
- **Anthropic:** create an API key. `ANTHROPIC_MODEL` defaults to `claude-sonnet-5-5`.
- **Daily.co:** create an API key in the dashboard. Rooms are created on demand (private, 2-hour expiry).

## 4. Vercel

1. Import the Git repo. Framework: Next.js. Install command: `pnpm i`.
2. **Environment variables** (Production and Preview). See `env.example` for every variable.
   - `DATABASE_URL`, `DIRECT_URL`
   - `BETTER_AUTH_SECRET`: a long random string, e.g. from `openssl rand -base64 48`
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`: `https://<your-domain>`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
   - `DAILY_API_KEY`
   - `CRON_SECRET`: a random string
   - `ADMIN_EMAILS`: your email
   - `QUOTA_LEVY_PER_PERSON_THB`: optional; confirm the current amount with the department
   - `SENTRY_DSN`: optional
   - **Never set `ABLE_E2E_OTP` in production.** It is also ignored on Vercel.
3. Deploy, then add your custom domain.
4. **Cron:** `vercel.json` already schedules `/api/cron/judge-reset` daily. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.

## 5. Verify (Stage 11 checklist)

- [ ] `/en` and `/th` load; the dismissible "missing keys" notice is gone.
- [ ] Google sign-in works (new user goes to `/welcome`; returning user goes to `/feed`).
- [ ] An email OTP arrives from your domain.
- [ ] Judge mode works for talent and for employer, and "Switch" works.
- [ ] Talent onboarding: photo upload, voice-fill (speak, review, add), "Write with AI".
- [ ] Employer onboarding: publishing a position fills the feed, with "Why this match" lines appearing.
- [ ] Two browsers: a message arrives without a refresh (Realtime), read receipts show, an offer can be accepted.
- [ ] A voice and video call connects between two devices.
- [ ] Settings → Download my data gives a ZIP; Delete account works.
- [ ] Run QA against production:

  ```bash
  BASE_URL=https://<your-domain> ABLE_E2E_OTP= pnpm test:e2e --project=desktop --grep-invert "speak|stage8 settings"
  ```

  Tests that need the fixed-OTP mode are skipped. Then run `BASE_URL=… pnpm qa:shots` and Lighthouse.

## Troubleshooting

- **"Database isn't set up" on sign-in:** `DATABASE_URL` is missing in that environment. Restart after adding it.
- **Google `redirect_uri_mismatch`:** the redirect URI must match `https://<domain>/api/auth/callback/google` exactly.
- **Uploads say "not available":** set the Supabase URL and service role key, and check that the buckets exist.
- **Matches without embeddings:** pgvector isn't enabled, or there's no OpenAI key. Matching falls back to lexical similarity; enable it, then edit a position to recompute.
