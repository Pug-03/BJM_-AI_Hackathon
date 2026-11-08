# ABLE — Work that fits you

ABLE connects job seekers with disabilities to employers who want to hire them. Profiles show real skills, AI does the matching, and chat, voice and video calls are built in.

It is built for the **BJM MediaX AI Innovation Hackathon 2026** (Track Reach).

**Principles we enforce in code:**
- There is no "disabled vs normal" split.
- Nothing filters or ranks people by disability, gender, religion, ethnicity or age.
- Pay is agreed in chat.
- Disability information is optional, private and self-described.
- Anything AI writes is labelled as a suggestion until a person accepts it.

## Quick start

```bash
pnpm i
cp env.example .env          # fill in what you have; everything is optional except DATABASE_URL
pnpm db:push                 # create tables (Supabase/Neon with pgvector, or local Postgres)
pnpm db:seed                 # 12 sample talent, 25 sample organizations, needs, reviews, chats, match scores
pnpm dev                     # http://localhost:3000
```

There are two ways to get a local database:

- **Docker:** `docker compose up db` (pgvector on port 5433). Then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/able`.
- **Postgres without pgvector:** run `node scripts/local-schema.mjs`, then `prisma db push --schema prisma/.local.prisma`. Matching falls back to lexical similarity.

**The app never white-screens when a key is missing.** A dismissible notice lists the missing services, and every affected button explains why it's unavailable.

**Judge mode** (`/judge`, the sign-in page, or the "Judge mode" button in the header or footer) works with only `DATABASE_URL` set. It creates an isolated sandbox with sample data that resets every 24 hours.

## Environment variables

Every variable is documented in `env.example`.

| Variable | Needed for |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Everything (Postgres; pgvector recommended) |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | Sessions and links |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `RESEND_API_KEY`, `EMAIL_FROM` | OTP and notification email. In dev without it, the code is printed in the server log |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | File storage (signed URLs for private buckets) and Realtime |
| `OPENAI_API_KEY` | Speech-to-text (`gpt-4o-transcribe`, falling back to `whisper-1`) and embeddings (`text-embedding-3-small`) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`) | Voice-fill structuring, "Write with AI", "Why this match", translation |
| `DAILY_API_KEY` | Voice and video calls |
| `QUOTA_LEVY_PER_PERSON_THB` | Section 34 levy estimate. It is never hard-coded |
| `CRON_SECRET` | `/api/cron/judge-reset` (Vercel Cron) |
| `ADMIN_EMAILS` | Comma-separated admin accounts, for `/admin` |
| `SENTRY_DSN` | Optional server error reporting |

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI[Next.js App Router UI<br/>React 19 · Tailwind v4 · Motion]
    Mic[Mic recorder<br/>MediaRecorder + AnalyserNode]
  end
  subgraph Vercel[Next.js server · Vercel]
    SA[Server actions<br/>Zod-validated, owner/participant checks]
    API[/api routes<br/>auth · upload · transcribe · export · cron/]
    AI[src/lib/ai/*<br/>provider interfaces]
    Match[src/lib/match*.ts<br/>scoring + recompute via after()]
  end
  subgraph Supabase
    PG[(Postgres + pgvector)]
    ST[(Storage buckets)]
    RT[Realtime broadcast]
  end
  OpenAI[[OpenAI<br/>STT + embeddings]]
  Claude[[Anthropic Claude<br/>structured JSON]]
  Daily[[Daily.co Prebuilt]]
  Resend[[Resend email]]

  UI --> SA --> PG
  Mic --> API --> AI
  AI --> OpenAI
  AI --> Claude
  SA --> Match --> PG
  API --> ST
  SA --> RT --> UI
  UI -. iframe .-> Daily
  SA --> Resend
```

- **Auth:** Better Auth (Google, plus email OTP with 6 digits, 10 minutes, 5 attempts). Sessions are httpOnly. Protected routes are gated in middleware.
- **Data:** Prisma. Private fields (DOB, gender, work-setup note, registration number, hidden contacts) are stripped on the server by `src/lib/privacy.ts`, which has unit and HTML tests.
- **Realtime:** Supabase broadcast "nudges" with empty payloads; clients re-fetch through authorized actions. Without Realtime, clients poll every 5 seconds.
- **Security:** CSP, HSTS, X-Frame-Options, Referrer-Policy and Permissions-Policy (`next.config.ts`). Rate limits cover OTP, AI, uploads, messages, reports and comments. Uploads are checked by file type (magic bytes). Logs contain no PII.

## AI, feature by feature

**Every AI call:**
- goes through `aiGate`, which checks the service is configured, the person has given consent, and the rate limit (30 per hour);
- returns Zod-validated JSON with one retry on invalid output;
- shows "AI suggestion" until a person keeps or edits the result.

**No AI output is hard-coded.**

| Feature | Where | Model |
|---|---|---|
| Speak to fill (mic on every text field) | `src/components/ai/mic-button.tsx`, `/api/ai/transcribe` | OpenAI STT. Audio is never stored |
| Fill my profile by voice (or type) | `voice-fill-slot.tsx`, `src/server/ai.ts#structureProfile` | STT, then Claude. The schema has no private fields; you review each field |
| Write with AI (bio, organization description) | `mic-field.tsx`, `draftBio` | Claude |
| Matching | `src/lib/match.ts`, `match-engine.ts` | Embeddings (pgvector cosine) × 0.55 + skill Jaccard × 0.25 + work fit × 0.10 + completeness × 0.10 |
| "Why this match" | `src/server/feed.ts#fetchReasons` | Claude, citing only matched facts. A computed (non-AI) summary shows without a key |
| Translate a message (TH↔EN), voice note to text | `messages.ts#translateMessage`, `message-item.tsx` | Claude / OpenAI STT |

## Testing and the QA loop

```bash
pnpm lint && pnpm typecheck && pnpm test     # ESLint (jsx-a11y), tsc strict, Vitest (unit: privacy, filters, matching, quota, AI schemas…)
pnpm build && pnpm start                     # production server
pnpm test:e2e                                # Playwright: auth, onboarding, judge, feed, messages (two browsers), settings, a11y (axe)
QA_QUICK=1 pnpm qa:shots                     # quick-check screenshots: 3 viewports, light, EN
pnpm qa:shots                                # full matrix: 12 viewports × light/dark × EN/TH → qa/screens/
```

- The process is described in `PROMPT.md` §12.
- Scores and findings for each stage are in `QA_REPORT.md`.
- Assumptions are in `DECISIONS.md`.

## Known limits

- Tier 3 identity verification is Phase 2. No ID numbers are collected.
- Sample content is fictional, labelled "Sample", and English only. Avatars are initials; no real people's photos are used.
- Live AI, Daily calls, Supabase Realtime and Resend were verified only for the "not set up here" paths in local QA. They need real keys (see `DEPLOY.md`).
- The CSP allows `'unsafe-inline'` scripts. There is no nonce pipeline in this prototype.

More docs: `DEMO.md` (3-minute demo script) · `DEPLOY.md` (Vercel + Supabase from scratch).
