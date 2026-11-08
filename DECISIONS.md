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

## Stage 5: Speak to fill

- **Providers:** `src/lib/ai/{types,openai,anthropic,index}.ts`.
  - Transcriber: `gpt-4o-transcribe`, falling back to `whisper-1`.
  - StructuredModel: Claude via `messages.parse` + `zodOutputFormat`, then re-validated with Zod and retried once.
  - Embedder: `text-embedding-3-small`.
  - Swapping a provider means editing `index.ts` only.
- **Audio is never stored.** `/api/ai/transcribe` reads the upload into memory, forwards it and discards it. Limits: 25 MB, audio MIME types only.
- **Every AI call goes through `aiGate`:** service configured, the latest `AI_PROCESSING` consent is granted, and a rate limit of 30 per hour per user.
  - Consent is asked inline the first time someone uses a mic or AI button. A dialog explains that OpenAI and Anthropic act as processors, and the answer is recorded as a ConsentRecord.
  - The step-5 checkbox stays in sync through an `able:ai-consent` event, so the autosave can't revoke it.
- **The voice-fill schema has no private fields** (DOB, gender, contacts, work setup). The prompt tells Claude to skip health, disability, religion, ethnicity, gender, age and pay information. Unit tests cover both.
- **The "Work setup I need" field has no mic** on purpose. It is sensitive, so it is not sent to AI providers (data minimization).
- **Voice-fill review:** each field can be ticked or unticked and edited. Nothing is applied until confirmed.
  - Applied fields show an "AI suggestion · Keep" label until kept or edited.
  - Mic dictation and "Write with AI" also show the label, with Undo (principle 5).
- **"Type instead" exists** for people who can't or prefer not to speak (accessibility).
- **Without keys,** every mic and AI button opens a popover explaining the feature isn't set up here and suggesting typing. It is never a dead button.
- **Mic placement:** dictation replaces the value in single-line inputs and appends in textareas. Mics are skipped on handle, year, URL, phone and contact values.

## Stage 6: Employer onboarding, hiring needs, matched feed

- **Scoring:** `src/lib/match.ts` (pure, unit-tested) implements the 0.55/0.25/0.10/0.10 formula.
  - Skill overlap is a Jaccard index with whole-word fuzzy matching ("Excel" matches "Microsoft Excel", but "Excellent" does not).
  - Age preference subtracts at most 0.05 from the sort key. It applies only to talent who show their age, and never removes anyone. The raw score is kept in `parts.raw`.
- **Similarity:** cosine between pgvector embeddings (`text-embedding-3-small`) when an OpenAI key and the vector columns exist.
  - Otherwise it uses character-trigram cosine, which works for Thai (no spaces) and English. `parts.method` records which one was used.
  - The seed and judge-mode entry compute scores. Profile and need edits recompute in `after()`.
- **Embedded text is public profile text only:** headline, bio, skills, education, special talents, languages and work preferences.
  - Processing public profile text with OpenAI and Anthropic for matching is part of the core service. It will be disclosed in the privacy policy (Stage 8).
- **"Why this match":** after the cards render, Claude writes one line per card, citing only the given facts. The line carries the "AI suggestion" label and is cached per need, talent and language.
  - It is invalidated when the matched skills change.
  - Without a key, or until the line arrives, a computed, non-AI summary shows instead ("Has 3 skills you need: … · Prefers remote work"). It is not labelled as AI because it isn't.
- **Employer feeds never show judge-sandbox talent.** Sandbox talent are scored only against sample organizations, for their own feed.
- **Filters reuse `talentFilterSchema` (strict)** for both the feed and `/explore`. Explore reads only whitelisted URL keys, so `?disability=…` is ignored.
- **Employer onboarding saves each step on Continue,** not field by field.
  - The registration number is private and sets `verifyRequestedAt`, which the Stage 9 admin queue will use.
  - There is no salary field. A "You can agree pay in chat" note appears instead.
- **Swipe** (right to star, left to skip) is enabled only on coarse pointers. Every swipe action has a visible button, and Skip offers Undo.
- **Added beyond the minimum:**
  - `/o/[handle]` employer page.
  - `/saved` (starred and followed).
  - `/needs` manager: create, edit, open or close, delete.
- **`MatchScore` now has a relation to `TalentProfile`,** so the feed can filter in SQL. It needs `pnpm db:push` on Supabase.

## Stage 7: Messages and calls

- **Realtime uses Supabase broadcast "nudges".**
  - `POST /realtime/v1/api/broadcast` with the service key sends a nudge on `able-convo-{id}` or `able-user-{id}`.
  - The payload is empty: clients re-fetch through authorized server actions, so no message content travels over the public channel.
  - Without keys, clients poll every 5 s (10 s for the inbox). While subscribed, a slow 30 s safety poll keeps running.
  - This avoids exposing the `Message` table to Postgres-changes RLS.
- **Delivery states:**
  - Optimistic "sending" shows a clock icon.
  - "Sent" shows one check.
  - "Delivered" (the recipient's client fetched the thread) shows two checks.
  - "Read" shows two checks in violet with the text "Read" for screen readers.
  - A failed send shows "Not sent · Try again".
- **Typing indicator:** a `TypingState` row, touched at most every 3 s while typing and shown for 6 s.
- **Attachments:**
  - Must be `chat` bucket refs under the conversation's folder, which is enforced in `sendSchema` and `sendMessage`.
  - Images are converted to WebP on the client.
  - The private bucket is served through signed URLs or the local authorized route.
- **Voice notes:** record, stop, send, with a live waveform. They are stored like other chat files, since a voice note is a message the person chose to send.
  - "Show as text" transcribes on request, for deaf and hard-of-hearing users.
- **Translate** (Claude, TH↔EN) shows the original plus a translation labelled "Translated by AI". It passes through `aiGate`, which checks the viewer's AI consent.
- **Offers:**
  - Accept and Decline are available only to the recipient.
  - Counter sends a new offer and marks the original as COUNTERED.
  - Every response posts a system line.
  - The offer dialog states that ABLE never suggests a rate.
- **Calls:** Daily Prebuilt runs in a full-screen iframe layer.
  - Each conversation gets one private room (`able-{conversationId}`), recreated after it expires (2 h).
  - Meeting tokens are per user; voice calls start with the camera off.
  - Each call posts a card, and Join is available for 2 h.
  - Without `DAILY_API_KEY`, the call buttons open a popover explaining why.
- **Safety:**
  - Block works per conversation and is also written to `Block` (feeds and profile views respect it).
  - Reports go to `Report` for the Stage 9 admin queue.
  - The first message from an unverified organization shows a calm safety tip.
- **`/messages/latest`** redirects to the newest conversation. It is used for notification deep links and QA screenshots.

## Stage 8: Landing, policies, cookies, settings

- **Landing sections follow section 6.**
  - "Speak to fill" is a pre-recorded animation labelled "Demo" and makes no AI call. It loops only while on screen and is static when reduced motion is on.
  - "Why ABLE" is a divided list, not a card grid.
  - The Section 33 block links to the department's site (a text link, not a logo).
  - Sponsors appear in the mid-page thank-you section and in the footer, never in the header.
- **Policies** are plain-language EN and TH content in `messages/*.json` (`policy.*`), rendered by a single `PolicyPage`. Contact addresses are marked as placeholders.
- **Cookie banner:**
  - ABLE loads no analytics, and the banner says so.
  - The choice is stored in a necessary `able-cookies` cookie for one year.
  - "Cookie settings" in the footer reopens it.
  - It is fixed-position, so it causes no layout shift.
  - E2E presets the cookie via `tests/fixtures/consent.json`.
- **Settings:** account name, language and theme, profile visibility and show-age, who can message me (enforced in `startConversation` for new conversations), email preferences, AI and work-setup consents with history, Download (ZIP of `data.json` plus own uploaded files), and Delete.
  - Delete is confirmed by typing the handle (or the email when there is no profile).
  - It hard-deletes the user, their conversations and every file in them, anonymizes audit rows, removes their reports, and increments an `accounts_deleted` counter.
  - Withdrawing the work-setup consent deletes the note and its shares.
- **The Section 33 calculator** (`/employer/quota`) is public; the landing page links to it.
  - `requiredHires` is unit-tested with the spec's values.
  - The levy is shown only when `QUOTA_LEVY_PER_PERSON_THB` is set.

## Stage 9: Social and trust

- **`notify()` (`src/lib/notify.ts`)** handles every notification.
  - It always writes the in-app row and sends a realtime nudge.
  - Messages and offers also get an email (Resend), unless the person turned that off in Settings or is a sandbox user.
  - Message emails are throttled to one per 10 minutes. Emails never contain message text, only who and a link.
- **Reviews:**
  - Only an employer whose conversation includes an ACCEPTED offer can review, once per conversation (unique index plus a server check).
  - 1–5 stars as a radio group, plus optional text.
  - The talent's rating is recomputed.
- **Likes and comments:**
  - Counts are kept on the post.
  - The comment author, the post owner or an admin can delete a comment.
  - Comments are rate-limited (20 per 10 min).
- **Admin (`/admin`):** returns 404 unless `role=ADMIN`. Admins are set by `ADMIN_EMAILS` at account creation.
  - It handles organization verification (approve sets tier 2 and notifies), the reports queue, and suspend/restore.
  - Suspension ends sessions; `getCurrentUser` already refuses suspended users.
- **`/built-vs-planned`** is an honest status list. Tier 3 identity verification is Phase 2.
- **The Section 33 calculator** is public and is described under Stage 8.

## Stage 10: Production hardening

- **Boundaries:**
  - `[locale]/error.tsx` is a friendly bilingual boundary that shows a reference digest and no stack trace.
  - `global-error.tsx` is plain bilingual HTML.
  - `loading.tsx` skeletons cover the app group and public routes.
- **SEO:**
  - Per-page metadata; `sitemap.ts` covers public pages and public non-sandbox profiles in EN and TH.
  - `robots.ts` disallows private app routes.
  - Per-profile Open Graph images come from `next/og`. They use Latin text only, because the OG font has no Thai glyphs; non-Latin names fall back to a neutral line.
- **PWA:**
  - `manifest.ts`, plus icons generated with `ImageResponse`, so no binary assets live in the repo.
  - The middleware matcher excludes icon routes.
- **Security headers** are in `next.config.ts`.
  - The CSP allows `'unsafe-inline'` scripts, because the App Router injects inline bootstrap scripts and there is no nonce pipeline. Everything else is tight: frames are limited to Daily, and connections to self plus Supabase.
  - HSTS preload, `X-Frame-Options: DENY`, `nosniff`, and a strict referrer policy.
  - `Permissions-Policy` allows the mic for "Speak to fill" and delegates camera and mic to Daily.
- **Error reporting** is in `instrumentation.ts#onRequestError`.
  - It always writes a structured line with no PII.
  - With `SENTRY_DSN`, it also sends a minimal store-API event (no SDK dependency).
- **New indexes:** `MatchScore(talentId, score desc)` for the talent feed, `Message(conversationId, senderUserId, readAt)` for unread counts, and `Skip(employerUserId, needId)`.
- **Images:**
  - Bundled sample covers are inlined as SVG.
  - User uploads are already resized to WebP (max 2560px) on the client and served as signed URLs, so they stay as `<img>` (there's no `next/image` loader for signed URLs). This is documented as a known trade-off.
- **Rate limits verified** for OTP (Better Auth plus per-email), AI, uploads, messages, reports, comments, export, judge mode and "Why this match".
