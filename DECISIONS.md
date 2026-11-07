# Decisions and assumptions

Every assumption made while building ABLE, newest at the bottom of each stage.

## Stage 1: Foundation

- **Next.js 15.5 + React 19.1.** Pinned with `create-next-app@15` because the spec says Next.js 15, even though 16 is current.
- **Prisma 6, not 7.** Prisma 7 makes driver adapters and `prisma.config.ts` mandatory. Prisma 6 runs `Unsupported("vector(1536)")` + `postgresqlExtensions` with no adapter setup. The `package.json#prisma` seed key prints a deprecation warning. That's harmless.
- **shadcn/ui pattern without the CLI.** The components in `src/components/ui` follow shadcn's approach: copy-in components on Radix primitives, styled with `cva` + `tailwind-merge`. They import from the unified `radix-ui` package and are restyled to the section 4 tokens. Running the CLI first and then rewriting every file would only have added churn.
- **Dark mode.** `next-themes` with `attribute="class"` and `defaultTheme="system"`. It follows `prefers-color-scheme` until the user picks a theme, and the `.dark` class carries the dark tokens.
- **Button press feedback** uses a CSS `active:scale-[0.97]` transform, not a motion component. It works for both `<button>` and `asChild` links and still only animates `transform`. Every other animation uses `motion/react` and the named patterns in `src/lib/motion.ts`.
- **Accordion** reveals with opacity + translate, not a height animation, to keep the transform/opacity-only rule.
- **Dialogs** become bottom sheets under 768px (`sheetUp`, drag-to-dismiss on the handle). They are centered `dropIn` dialogs above that. `<Sheet>` is always a bottom sheet.
- **DatePicker** uses the native `<input type="date">`. Phones get the accessible platform picker, and screen readers and keyboards are fully supported without a custom calendar grid.
- **Styleguide page** (`/[locale]/styleguide`) is a noindex dev surface. It gives the QA screenshots and design critic every component in one place.
- **Schema additions beyond section 11** (all needed by later stages): Better Auth tables (`session`, `account`, `verification`, `rateLimit`), `User.emailVerified/updatedAt/suspendedAt`, `SetupShare` (talent shares private work-setup text with one employer), `MatchScore` (cached feed scores), `Skip`, `ProfileView`, `PostLike`, `PostComment`, `Block`, `TypingState`, `NotificationPrefs`, `AggregateCounter` (anonymized counts kept after deletion), `JudgeSandbox`, `isSample` flags, and image alt-text arrays for posts and portfolio.
- **`User.name` is non-null (`@default("")`).** Better Auth's core user schema requires `name`. The spec's `String?` would break its adapter.
- **`.env.example` is shipped as `env.example`.** This environment's permission settings block writing any `.env*` file. The content is identical: copy it to `.env`.
- **Local database.** Homebrew Postgres 16 on this machine has no pgvector, and compiling pgvector from source was blocked by the sandbox. `docker-compose.yml` runs `pgvector/pgvector:pg16` on **port 5433**, so it doesn't clash with a local Postgres on 5432.

## Stage 2: Auth

- **Session cookies** are signed with `BETTER_AUTH_SECRET`. Without it, the app derives a stable fallback from `DATABASE_URL` instead of crashing. Production must set the real secret.
- **Server actions return `{ ok, href }`.** Client code navigates with `window.location.assign`. A `redirect()` from inside a server action combined with next-intl produced "unexpected response" errors.
- **`getCurrentUser()` reads `headers()` before anything else.** This forces dynamic rendering, so signed-in pages are never prerendered as signed out at build time.
- **E2E mode.** `ABLE_E2E_OTP` makes OTP codes predictable and multiplies rate limits by 50. It only takes effect when the variable is set, and never on Vercel. Real limits are 6 OTP sends per minute per IP and 5 per email per 15 minutes.
- **Login stays `noindex`.** This is an intentional SEO exception, same as `/styleguide` and `/judge`.
- **Accepting Terms and Privacy** is recorded as a `ConsentRecord` when the account is created ("By continuing, you agree…").

## Stage 3: Judge mode and seed data

- **Sample data is fictional and flagged `isSample`.** It covers 12 talent profiles and 25 organizations, 5 of each type. The government agencies are invented and labelled "(sample agency)". The artwork in `public/sample` is generated abstract SVG (`scripts/gen-sample-art.mjs`), not real photos or logos.
- **Sample reviews** come from seeded conversations with an accepted offer, the same rule the app enforces for real reviews.
- **Each browser gets its own judge sandbox,** identified by the `able_judge_id` cookie. A sandbox is two `isSandbox` users (talent "Ploy Jaidee" and employer "Bright Path Co.") with 3 conversations each: a pending offer, a past call and a fresh message. Sandboxes are reset after 24 hours, both when a judge enters and by a daily Vercel Cron job (`/api/cron/judge-reset`).
- **Sandbox sign-in** uses Better Auth's server-only `createVerificationOTP` and then `signInEmailOTP`, so it works without Google or Resend keys.
- **Sandbox internals live in a `server-only` module.** They are never exported from a `"use server"` file, because every export from such a file becomes a public action.
- **Local testing without pgvector.** `scripts/local-schema.mjs` writes a copy of the schema without vector columns for a local Postgres that lacks pgvector. The real target remains Supabase with pgvector.
- **QA builds** go to `NEXT_DIST_DIR=.next-qa`, so a developer's `next dev` on `.next` can't break them.
- **QA process changed at the owner's request** (PROMPT.md section 12): a quick check after every stage, and the full A/B/C loop only after stages 3, 7, 8 and 11, with at most 3 loops each.
- **Sponsor logos moved out of the header** at the owner's request ("not at the top"). "Supported by" and the logos now sit in the footer, and Stage 8 adds a thank-you section in the middle of the landing page. PROMPT.md section 6.1 is updated to match.

## Stage 4: Talent onboarding and profile

- **Uploads:**
  - Supabase Storage in production.
  - Without Supabase keys, files go to `.uploads/` and are served by `/api/files`. This happens only outside production, or when `ABLE_LOCAL_UPLOADS=1` (used by the local QA server).
  - Real file types are sniffed from magic bytes on the server. The client resizes images to at most 2560px WebP.
  - Private buckets (`certificates`, `chat`) are authorized per request: owner, public certificate, or conversation participant. On Supabase they use signed URLs.
- **Privacy rules live in pure functions** (`src/lib/privacy.ts`), with unit tests and an HTML-level e2e test. Date of birth, gender and work-setup notes are removed from every non-owner payload, not just hidden in the UI. The identity tier is capped at 2 (Phase 2).
- **The filter schema is `.strict()`,** so disability, gender, religion, ethnicity, race and age keys are rejected (unit tests).
- **Autosave:** onboarding saves each step 700ms after the last change, and saves again on Back, Continue and Finish so fast navigation never loses data.
- **Work-setup text** is stored only while its processing consent is on.
- **Consents** (AI processing, work setup) are versioned `ConsentRecord` rows. A new row is written only when the value changes.
- **Brand icons:** lucide removed them, so Instagram and LinkedIn contacts use neutral icons (`AtSign`, `Briefcase`), labelled by name.
- **Explore is interim.** The searchable directory with filters is built with matching in Stage 6, which shares its filter schema.
