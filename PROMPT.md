# ABLE v2 — Master build prompt for Claude Code (start from an empty folder)
 
> How to use: create a new empty folder, save this file inside it as `PROMPT.md`, open Claude Code in that folder and say:
> **"Read PROMPT.md completely, then build ABLE stage by stage exactly as written. Do not skip the QA loop at the end of each stage."**
>
> Claude Code: work autonomously. Make reasonable decisions without asking, except where this file says ASK. Log every assumption in `DECISIONS.md`. Never delete or rewrite working code to "start fresh" mid-build — change things incrementally and keep the app runnable after every stage.
 
---
 
## 0. Context and hard constraints
 
- Hackathon: **BJM MediaX AI Innovation Hackathon 2026**, Track **Reach**. Judges are international and read English.
- **Full scope, production-ready.** Build every feature in this file — do not reduce scope, skip stages or ship placeholders for real features. Quality and completeness matter more than speed. The only things intentionally left for a later phase are named explicitly as "Phase 2" (national ID verification).
- Judging weights: Analysis 25%, **AI integration 35%**, **Feasibility 25%** (working prototype on real data, no hard-coded results), Communication 15%.
- The product must look and feel **production-grade and global** — the quality bar is a modern talent marketplace used worldwide: calm, clean, fast, mobile-first, obvious to use.
---
 
## 1. Product
 
**Name:** ABLE
**What it is:** a talent platform where people with disabilities show what they can do and employers find, follow and talk to them — built so everyone can use it, and designed so disability is never a label, a filter or a price tag.
**Tagline (EN):** Work that fits you.
**Tagline (TH):** งานที่ใช่ สำหรับทุกคน
**One-liner (README, pitch):** ABLE connects job seekers with disabilities to employers who want to hire them — with profiles that show real skills, AI matching, and built-in chat, voice and video calls.
 
Two sides:
- **Talent** (job seekers): build a rich profile like a freelancer page — photo, cover, bio, education, skills, portfolio posts, certificates, training, reviews and star ratings, contact channels.
- **Employers**: individuals, associations/NGOs, startups, private companies, government agencies. They describe who they're hiring for, scroll a matched feed of talent, follow/star people, and chat or call them.
**The standout feature — "Speak to fill":** every text field has a small mic button. Tap it, speak (Thai or English), and AI fills the field. On the profile-builder there's also "Fill my profile by voice": speak freely for a minute and AI splits what you said into the right fields (education, skills, experience, bio) for you to review.
 
### Non-negotiable principles (enforce in code, copy and data model)
1. **No discrimination, no "disabled vs normal" split.** The UI never says "normal people". Everyone is "talent" or "employer". There is no field, filter, sort or ranking by disability type, gender, religion or ethnicity.
2. **Equal pay.** Salary is agreed in chat between the two parties. The product never suggests a lower rate for anyone.
3. **Disability information is optional, private and self-described.** It lives in a private "Work setup I need" field (e.g. "screen reader", "remote work", "flexible hours"), hidden by default and shared only when the talent chooses to share it with a specific employer.
4. **Age:** store date of birth privately. Show age on the profile **only if the talent turns it on**. Employers may set an age *preference*, but it is a soft signal used only for talent who chose to show age — it never hides anyone from the feed.
5. **Human decides, AI assists.** Anything AI writes (bio drafts, voice-filled fields, match reasons) is shown as a suggestion with a small "AI suggestion" label until the person accepts or edits it.
6. **Privacy by design (Thailand PDPA + GDPR-style).** Consent, export, delete, cookie choices, and clear policy pages (section 9).
---
 
## 2. Tech stack (use exactly this unless something is broken — then note why in DECISIONS.md)
 
- **Next.js 15 (App Router) + TypeScript (strict) + React Server Components**, package manager `pnpm`.
- **Tailwind CSS v4** with the design tokens in section 4 as CSS variables. **shadcn/ui** (Radix-based) for accessible primitives: Dialog, Sheet, DropdownMenu, Tabs, Tooltip, Toast (Sonner), Popover, Command, Avatar, Switch, Select. Restyle them to the tokens — never leave the default shadcn look.
- **Motion** (`motion/react`, formerly Framer Motion) for all animation (section 5).
- **Auth: Better Auth** with **Google OAuth** + **Email OTP** (6-digit code) plugin. Email delivery via **Resend**. In development, when `RESEND_API_KEY` is missing, print the OTP to the server console and show a dev-only toast "Code printed in server log".
- **Database: Postgres** (Supabase or Neon) via **Prisma**. Local fallback: Postgres in Docker (`docker compose up db`) — document it.
- **File storage: Supabase Storage** (buckets: `avatars`, `covers`, `posts`, `certificates`, `chat`). Images resized client-side before upload (max 2560px, WebP), max 10 MB; certificates allow PDF. Private buckets use signed URLs.
- **Realtime chat: Supabase Realtime** (Postgres changes on `Message`), with a 5-second polling fallback.
- **Voice and video calls: Daily.co Prebuilt** (one room per conversation, created server-side, short-lived meeting tokens). If `DAILY_API_KEY` is missing, the call button explains it's unavailable in this environment — never a dead button.
- **AI:**
  - Speech-to-text: OpenAI `gpt-4o-transcribe` (fallback `whisper-1`), auto language (Thai/English).
  - Structuring, bio writing, match reasons, chat translation: **Anthropic Claude** via `@anthropic-ai/sdk`, model from env `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`). Always use tool/JSON output validated with **Zod**; retry once on invalid output.
  - Embeddings for matching: OpenAI `text-embedding-3-small`; store vectors with **pgvector** (`vector(1536)`).
  - All providers behind small interfaces in `src/lib/ai/*` so they can be swapped.
- **Validation:** Zod everywhere (API input, AI output, forms with `react-hook-form` + `zodResolver`).
- **i18n:** `next-intl`, routes `/en/...` and `/th/...`. **English is the default.** All copy lives in `messages/en.json` and `messages/th.json` — no hard-coded strings in components.
- **Testing:** Vitest (unit), Playwright (e2e + screenshots across viewports), `@axe-core/playwright`, Lighthouse CI.
- **Quality:** ESLint (next + jsx-a11y), Prettier, `tsc --noEmit`, Husky pre-commit running lint + typecheck.
- `.env.example` documents every variable. The app must never white-screen when a key is missing: show a clear, dismissible one-line notice instead.
---
 
## 3. Information architecture
 
```
Public
/[locale]                         Landing (marketing + how it works + FAQ + sponsors)
/[locale]/explore                 Public talent directory (search + filters) — read-only when logged out
/[locale]/u/[handle]              Public talent profile
/[locale]/o/[handle]              Public employer profile
/[locale]/login                   Sign in / sign up (Google or Email OTP)
/[locale]/privacy  /terms  /cookies  /data-rights  /accessibility   Policy pages
 
Onboarding (after first sign-in)
/[locale]/welcome                 Choose: "I'm looking for work" / "I'm hiring"
/[locale]/onboarding/talent       5-step profile builder
/[locale]/onboarding/employer     4-step organization builder + hiring needs
 
App (signed in)
/[locale]/feed                    Employer: matched talent feed  |  Talent: matched opportunities + employers who viewed/followed
/[locale]/me                      My profile (edit-in-place, same layout as public profile)
/[locale]/me/edit/*               Full edit forms (sections)
/[locale]/needs                   Employer: hiring needs (positions) — create/edit
/[locale]/saved                   Employer: starred & followed talent; Talent: followed employers
/[locale]/messages                Inbox
/[locale]/messages/[id]           Conversation (text, images, files, voice note, voice call, video call)
/[locale]/notifications
/[locale]/settings                Account, language, privacy & sharing, notifications, delete account, export data
/[locale]/employer/quota          Section 33 calculator (Thailand)
 
Judge mode
/[locale]/judge                   Judge-mode entry (also opened as a dialog from the footer button)
```
 
**App shell:**
- Desktop (≥1024px): slim left icon rail (logo, Feed, Explore, Messages, Saved, Notifications; Settings and avatar at the bottom), main content max 1200px, optional right panel on feed/profile.
- Tablet (768–1023px): same rail collapsed to icons, content full width.
- Mobile (<768px): top bar (logo, search, notifications) + **floating pill bottom nav** (Feed, Explore, Messages, Profile) with safe-area insets (`env(safe-area-inset-bottom)`).
- Logged-out mobile bottom nav: Explore, Log in.
---
 
## 4. Visual design system
 
### 4.1 Direction
Quiet, confident, editorial-clean — **monochrome first, one brand colour used with discipline**. Lots of white space, soft surfaces, generous rounded shapes, real photography from users as the colour of the page. Think of a premium global marketplace: the content (people and their work) is the hero, the UI steps back. Do not copy any other product's logo, illustrations, copy or exact layouts; only match the level of polish.
 
The one memorable element: **the mic**. Every field's mic button opens a small inline "listening" capsule with a live waveform that morphs into the filled text. Spend the boldness there; keep everything else calm.
 
Avoid generic AI-page tells: no ALL-CAPS eyebrow labels, no gradient washes, no single highlighted word in headlines, no "→" glued to button text, no identical card grid with the same shadow everywhere, no fake stats.
 
### 4.2 Colour tokens (CSS variables; light is default, dark via `.dark` + `prefers-color-scheme`)
 
| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FFFFFF` | `#0F0E12` | Page background |
| `--mist` | `#F5F4F7` | `#18171C` | Surfaces, inputs, chips, app background behind cards |
| `--cloud` | `#ECEBF0` | `#232129` | Hover surfaces, skeletons |
| `--line` | `#E4E2EA` | `#2E2C35` | Hairlines, dividers, card borders |
| `--ink` | `#17151C` | `#F4F3F7` | Primary text **and primary buttons** (ink pill with paper text) |
| `--graphite` | `#5C5866` | `#A8A4B3` | Secondary text |
| `--muted` | `#8A8694` | `#7A7685` | Placeholders, meta (only for non-essential text; must still pass 4.5:1 where it carries meaning — use `--graphite` then) |
| `--brand` | `#6D28FF` | `#9B7BFF` | Links, selected tabs, focus ring, verified badge, active nav, mic "listening" state |
| `--brand-soft` | `#F0EAFF` | `#241B45` | Selected chips, brand-tinted backgrounds |
| `--star` | `#E8A100` | `#F5B731` | Star ratings only |
| `--success` | `#15803D` | `#4ADE80` | Success (always with icon + word) |
| `--danger` | `#DC2626` | `#F87171` | Errors, destructive (always with icon + word) |
 
Rules: text ≥ 4.5:1 contrast; UI boundaries ≥ 3:1; never rely on colour alone (status = icon + word). Brand violet is used sparingly — never as large backgrounds except the small "Verified" badge and selected states.
 
### 4.3 Typography
- **Geist** (Latin) + **Noto Sans Thai** (Thai) via `next/font/google`; font stack `Geist, "Noto Sans Thai", system-ui, sans-serif`. One family voice across both languages.
- Scale (desktop / mobile): Display 64/40, H1 44/32, H2 32/26, H3 22/20, Body 16/16 (line-height 1.6; Thai 1.7), Small 14, Caption 13. Weights: 400, 500, 600 (headlines 600, tight tracking −0.02em on Display/H1 for Latin only).
- Sentence case everywhere. Line length ≤ 72 characters for body text.
### 4.4 Shape, spacing, elevation
- 4px base grid; common steps 8, 12, 16, 24, 32, 48, 64, 96.
- Radii by hierarchy (not one radius for everything): buttons & chips **999px (pill)**, inputs 14px, cards 20px, sheets/dialogs 28px, avatars full circle, images inside cards 16px.
- Elevation: borders (`1px var(--line)`) do most of the work. Shadows only for floating layers: `0 8px 30px rgba(23,21,28,.08)` for popovers/bottom nav, `0 24px 60px rgba(23,21,28,.14)` for dialogs.
- Buttons: Primary = ink pill (paper text, 44px tall, 48px on mobile); Secondary = mist pill with ink text; Ghost = text button; Destructive = danger outline. Icon buttons are 44×44 minimum with `aria-label`.
- Icons: **Lucide**, 1.75px stroke, 20px default. No emoji in UI.
### 4.5 Components to build (in `src/components/ui` + `src/components/able`)
Button, IconButton, Input + `MicInput`, Textarea + `MicTextarea`, Select, DatePicker, ChipInput (skills), Avatar (with upload + crop), CoverImage (with upload + reposition), Tabs, Card, StatRow, RatingStars (display + input), VerifiedBadge (tiers, section 7.6), ProgressPill ("Finish your profile 4/6" floating pill), EmptyState, Skeletons, Toast, ConfirmDialog, Sheet (mobile), BottomNav, IconRail, LanguageSwitch, ThemeSwitch, ConsentBanner, SponsorStrip, JudgeModeDialog, MessageBubble, Composer (text, attach, voice note), CallButton, MatchCard (feed), TalentCard, EmployerCard, PostCard, ReviewCard, CertificateCard.
 
---
 
## 5. Motion system (smooth everywhere, never janky)
 
Use `motion/react`. Animate **only `transform` and `opacity`** (GPU-friendly). Target 60fps on a mid-range phone. Durations 160–320ms; easing `cubic-bezier(0.22, 1, 0.36, 1)` ("smooth-out") for entrances, springs `{ type: "spring", stiffness: 380, damping: 32 }` for interactive elements.
 
Named patterns (implement once in `src/lib/motion.ts`, reuse everywhere):
- `pageTransition`: route change crossfade + 8px rise (AnimatePresence in the app layout, keyed by pathname). Tab switches inside a page slide **left/right** in the direction of the selected tab.
- `dropIn`: dialogs, toasts and dropdowns drop from 12px above with a slight scale 0.98→1.
- `sheetUp`: mobile sheets and the bottom-nav sub-menus slide up from the bottom; drag-to-dismiss.
- `zoomIn`: opening a photo/portfolio post zooms from its thumbnail into a lightbox (shared layout animation with `layoutId`); closing zooms back.
- `stagger`: feed cards and profile sections enter with a 40ms stagger on first load only (not on every scroll).
- `swipe`: on mobile feed, a card can be swiped **right to star** and **left to skip** with spring physics, plus visible buttons that do the same (swipe is never the only way).
- `pressable`: buttons scale to 0.97 on press.
- `mic`: listening capsule expands from the mic button, waveform bars animate from real audio levels (Web Audio `AnalyserNode`), then the capsule morphs into the filled text.
- Landing hero: one orchestrated entrance sequence (headline, then the live product mock, then the CTA) — not scattered effects on every section.
- Skeletons shimmer subtly; optimistic UI for follow/star/send so actions feel instant.
- **`prefers-reduced-motion: reduce`** → replace movement with simple opacity fades (one global hook `useReducedMotion`).
---
 
## 6. Landing page (`/[locale]`)
 
1. **Header:** logo (wordmark "ABLE" + simple mark), links (How it works, For employers, FAQ), language switch, theme switch, "Log in" (ghost) and "Get started" (ink pill). **Top-right corner, small: "Supported by" + sponsor logos** from `src/config/sponsors.ts` (see 6.9).
2. **Hero:** left — headline "Work that fits you.", one-sentence subline ("Show what you can do. Get found by employers who want to hire you."), primary "Get started", secondary "I'm hiring". Right — a live-feeling product mock: a talent profile card (photo, name, verified badge, skills, stars) beside an employer chat bubble, with the mic capsule animating once. All sample content clearly labelled "Example".
3. **Two paths (tabs: "For talent" / "For employers")** with 4 steps each (a real sequence, so numbered):
   - Talent: Sign in with Google or email → Build your profile (speak or type) → Add your work, certificates and training → Chat and interview with employers.
   - Employers: Sign in → Tell us who you're hiring → Browse your matched feed and star people → Chat, call and agree terms.
4. **"Speak to fill" showcase:** short looping demo of the mic filling a form (pre-recorded animation, labelled as a demo), and a line that it understands Thai and English.
5. **Why ABLE (3–4 short points, not a card grid of identical boxes):** real skills first; verified people and organizations; built-in chat, voice and video; your data, your choice.
6. **For employers in Thailand:** short block on the Section 33 quota (1 employee with a disability per 100 staff, +1 when the remainder exceeds 50) with a link to the calculator. Source link to the Department of Empowerment of Persons with Disabilities.
7. **How to use (guide):** an accordion "How do I…?" with 6 short how-tos: create a profile, use the mic, add certificates, find talent, start a chat or call, delete my data.
8. **FAQ (Q&A):** 8 questions in an accordion: Is ABLE free? Do I have to say I have a disability? (No.) Who can see my phone number? How are employers verified? How does AI use my data? Can I use it on my phone? Which languages? How do I delete my account?
9. **Sponsors thank-you section:** "Thank you to our supporters for making ABLE possible." with the logos from `src/config/sponsors.ts`. **Use neutral placeholder logos labelled "Sponsor logo" until real files are added to `/public/sponsors/` — do not invent or download any real organization's or government's logo.**
10. **Footer:** product links, policy links (Privacy, Terms, Cookies, Your data rights, Accessibility), language, © 2026 ABLE, PDPA line "Personal data handled under Thailand’s PDPA B.E. 2562." and, **at the very bottom, a clearly visible but secondary button: "Judge mode"** (section 8).
---
 
## 7. Flows in detail
 
### 7.1 Sign in (`/login`)
Centered card on mist background, logo above: "Welcome to ABLE" + "Sign in or create an account".
- "Continue with Google" (Google G icon) and "Continue with email".
- Email: enter email → 6-digit OTP screen (auto-advance boxes, paste support, resend after 30s countdown, 10-minute expiry, max 5 attempts, rate limit per IP/email).
- Footer text: "By continuing, you agree to ABLE’s Terms and Privacy Policy." (links).
- After first sign-in → `/welcome`. Returning users → `/feed`.
### 7.2 Welcome (`/welcome`)
Two large choice cards: **"I’m looking for work"** and **"I’m hiring"**, each with one line of description. A user can later add the other role from Settings (one account, two roles is allowed but MVP: one primary role).
 
### 7.3 Talent onboarding (`/onboarding/talent`) — 5 steps, progress bar, back/next, autosave every field
At the top of step 1: a highlighted option **"Fill my profile by voice"** (speak up to 2 minutes; AI drafts all fields; user reviews each with accept/edit). Every text field also has its own mic.
1. **Basics:** profile photo (upload + circular crop), first name, last name, nickname/display name, handle (unique, suggested from name), date of birth (private) + toggle "Show my age on my profile" (off by default), gender (optional, private, "prefer not to say" default — never shown publicly, never filterable), country (default Thailand) + province/state (Thai provinces list when TH; free text elsewhere).
2. **About:** headline (e.g. "Customer support specialist"), bio (with "Write with AI" → drafts from what they've entered/said; user edits), languages spoken, work preference (remote / on-site / hybrid), availability (full-time / part-time / freelance / project).
3. **Education & skills:** education entries (level, school, field, year), skills (chip input with suggestions), special talents ("ความสามารถพิเศษ").
4. **Proof of work:** certificates of employment, training certificates (file upload PDF/image + issuer + date), portfolio items (images + title + description + link).
5. **Contact & privacy:** phone, email (prefilled), LINE ID, Instagram, TikTok, Facebook, LinkedIn, website; each with visibility: **Public / Only employers I chat with / Hidden** (default: Only employers I chat with). Optional private "Work setup I need" text (hidden by default) with a clear explanation. Consent checkboxes (section 9).
Finish → confetti-free, calm success screen → "View my profile".
### 7.4 Talent profile page (`/u/[handle]` and `/me`) — freelancer-style
Layout (desktop): **cover image** full width on top (16:5, upload + drag to reposition), then a two-column area: left column profile block, right column tabs content.
- Profile block: large avatar overlapping the cover, display name + VerifiedBadge, @handle, followers count, headline, location (province, country), age (if shown), languages, social icons (only those visible to the viewer), stats row (**Rating ★ x.x (n reviews)**, Completed jobs, Rehired, Response time), buttons: **Follow**, **Message**, **Star** (employers) / **Share profile**, **Edit** (owner).
- Skills chips (+N more expands).
- Tabs: **Posts** (work posts + photo posts in a masonry grid; owner sees "+ New post"), **Portfolio**, **Certificates & training**, **Reviews** (star breakdown + review cards; only employers who had a confirmed job/conversation can leave one), **About** (bio, education, special talents, availability, work preference).
- Owner view: floating **ProgressPill "Finish your profile 4/6"** expanding into a checklist.
- Mobile: single column, cover then avatar, sticky bottom action bar (Message, Follow).
- Posts: text + up to 10 images, like and comment (comments MVP optional), share link.
### 7.5 Employer onboarding (`/onboarding/employer`) — 4 steps
1. **Who are you?** Organization type: Individual / Association or NGO / Startup / Private company / Government agency. Name, logo, cover, handle, country/province, website, size (employees count), registration number (optional; used for verification, never shown publicly).
2. **About:** description (with mic + "Write with AI"), industry, contact channels with the same visibility controls.
3. **Hiring needs (first position):** job title, skills needed (chips), work mode, location, employment type, education level preferred (optional), age range preference (optional, soft — see principle 4), "Accessible workplace setup we can offer" (optional checklist: remote, flexible hours, screen-reader friendly tools, step-free access, sign-language-friendly communication, other). Salary is **not** required — note "You can agree pay in chat."
4. **Review & publish** → matched feed.
Thailand only: show the Section 33 calculator card in the employer dashboard.
### 7.6 Verification badge (`VerifiedBadge`)
- Tier 1 **Email verified** (automatic after OTP/Google).
- Tier 2 **Organization verified** (employer submits registration number; admin approves in a minimal `/admin` page; seeded for demo).
- Tier 3 **Identity verified** (national ID / government ID check) — **Phase 2, not built**: show it in the badge legend and on `/built-vs-planned` as "Coming next". Never collect ID numbers in this MVP.
- Badge: small violet check-circle next to the name with a tooltip/popover explaining exactly what was verified.
### 7.7 Feed (`/feed`)
- **Employer feed:** a vertical, Facebook-style scroll of **MatchCards** for the selected hiring need (switcher at top for multiple positions). Each card: avatar, cover thumbnail, name + badge, headline, location, top skills (matched ones highlighted with brand-soft background + check icon), rating, **"Why this match"** (one AI-written line citing the matched skills/education/work mode — no invented claims), actions **Star**, **Follow**, **Message**, **Skip**. Infinite scroll with skeletons. Filters sheet: skills, location, work mode, availability, education level, "has certificates", rating. **No disability, gender, religion or ethnicity filters exist.**
- **Talent feed:** employers and positions that match their profile, plus "Employers who viewed / starred you" (if they allow), with Follow and Message.
- Matching (server, `src/lib/match.ts`): score = 0.55 × embedding similarity (profile text ↔ need text) + 0.25 × skill overlap (Jaccard) + 0.10 × work-mode/location fit + 0.10 × profile completeness. Age preference only re-orders among talent who show age, never removes anyone. Cache scores per need; recompute on profile/need update (background job via route + `after()`).
### 7.8 Messages (`/messages`, `/messages/[id]`)
- Inbox list (avatar, name, badge, last message, time, unread dot) + conversation pane (two-pane on desktop, single pane with slide transition on mobile).
- Composer: text (with mic for dictation), attach images/files (certificates, CV), voice note (record/stop/send, waveform), emoji not required.
- Header actions: **Voice call** and **Video call** (Daily Prebuilt in a modal/full-screen sheet; both sides get a call invitation card in the thread with Join button), view profile, block, report.
- Read receipts, typing indicator, delivery states, optimistic send, image lightbox with zoom.
- **Translate** button on each message (Claude; TH↔EN) for global use — shows original + translation, labelled "Translated by AI".
- Salary/terms are discussed here; offer a simple "Send offer" message type (role, pay, currency, start date, notes) that the other side can Accept / Decline / Counter. This is a message card, not a contract.
- Safety: first message from an unverified organization shows a calm safety tip; block and report available everywhere.
### 7.9 Settings
Account (name, email, connected Google), language (EN/TH), theme, privacy & visibility (per contact channel; profile public/private; show age; who can message me), notifications, **Download my data** (JSON + files zip), **Delete my account** (confirm by typing handle; hard-deletes personal data within the request; keeps anonymized aggregates only), consent history.
 
### 7.10 Section 33 calculator (Thailand)
`requiredHires(n) = n < 100 ? 0 : Math.floor(n / 100) + (n % 100 > 50 ? 1 : 0)`; unit tests: 99→0, 100→1, 150→1, 151→2, 250→2, 251→3, 320→3. Show current hires → gap. Section 34/35 explained in text only; levy amount comes from env `QUOTA_LEVY_PER_PERSON_THB` with a note to verify with the authority; **never hard-code a levy amount.**
 
---
 
## 8. Judge mode (for the hackathon judges)
 
- Footer button **"Judge mode"** (also `/judge`). Opens a dialog: "Try ABLE as a judge? We’ll sign you in to a demo account filled with sample data. Nothing you do affects real users." Two options: **"Try as talent"** / **"Try as an employer"**, plus Cancel.
- On choose: server creates (or reuses) an isolated **sandbox** account for that browser (cookie `able_judge_id`), seeded with a complete profile, posts, certificates, reviews, followers, 3 conversations (one with an offer card, one with a past call card), and a populated feed. Sign in automatically.
- A slim top banner while in judge mode: "Judge mode — sample data. Switch to employer/talent · Exit". Switching role swaps to the other seeded sandbox account.
- Judge sandboxes are flagged `isSandbox = true`, invisible to real users, reset every 24 hours (cron route or on-entry check).
- Judge mode works even without Google/Resend keys (it's the demo safety net). AI features still call the real APIs.
---
 
## 9. Privacy, PDPA and security
 
- **Cookie banner** on first visit: Necessary (always on), Analytics (off by default), with "Accept all", "Reject optional", "Choose". No analytics scripts load before consent. (MVP can ship with no analytics at all — then the banner states that.)
- **Consent records** (`ConsentRecord`): terms & privacy acceptance, optional "Work setup I need" processing consent, AI processing consent (voice and text sent to AI providers), each with version + timestamp; withdrawable in Settings.
- **Policy pages** (EN + TH, plain language): Privacy Policy (what we collect, why, legal basis, AI providers as processors, retention, rights, contact `privacy@able.example` placeholder), Terms, Cookies, Your data rights (access, correct, delete, export, withdraw consent, complain to the PDPC), Accessibility statement.
- **Data minimization:** no national ID collected; DOB and gender private; contact channels respect visibility; voice audio is deleted right after transcription (not stored).
- **Security:** Better Auth sessions (httpOnly, secure, SameSite=Lax), CSRF protection, rate limits on auth/OTP/AI/upload/message routes, file type sniffing and size limits, signed URLs for private files, Row-Level authorization checks in every server action/route (owner or participant only), HTML sanitization of user text, no PII in logs, audit log for sensitive actions.
---
 
## 10. Accessibility — done right in the code, without special "modes"
 
Users who are blind or low-vision already use their phone's screen reader (VoiceOver / TalkBack) and zoom; colour-blind users need meaning not carried by colour alone. So **do not build custom accessibility modes** (no high-contrast toggle, no text-size widget, no custom read-aloud). Instead make the code itself fully readable and operable:
- Semantic HTML: one `<h1>` per page, ordered headings, landmarks (`header`, `nav`, `main`, `footer`), real `<button>`/`<a>`/`<input>` with `<label>`.
- Every icon button has an `aria-label`; images have meaningful `alt` (user uploads: ask for an optional caption, used as alt); decorative images `alt=""`.
- Forms: errors linked with `aria-describedby`, announced politely; required fields marked in text.
- Live regions for: mic states ("Listening", "Filled bio"), toasts, new messages, OTP errors.
- Full keyboard support, visible focus ring (`--brand`, 2px + 2px offset), focus trapped in dialogs and returned on close, swipe gestures always have button equivalents.
- Touch targets ≥ 44×44, works at 200% browser zoom and with large system font sizes, no horizontal scroll at 320px.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- `lang` attribute per locale.
- These are verified automatically by axe in the QA loop (section 12).
---
 
## 11. Data model (Prisma, minimum)
 
```prisma
model User { id String @id @default(cuid()) email String @unique name String? image String? role Role? locale String @default("en") isSandbox Boolean @default(false) createdAt DateTime @default(now()) talent TalentProfile? org OrgProfile? sessions Session[] accounts Account[] consents ConsentRecord[] }
enum Role { TALENT EMPLOYER ADMIN }
 
model TalentProfile {
  id String @id @default(cuid()) userId String @unique user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  handle String @unique firstName String lastName String displayName String
  avatarUrl String? coverUrl String? coverOffsetY Int @default(50)
  headline String? bio String? dob DateTime? showAge Boolean @default(false)
  gender String? // private, never public, never filterable
  country String @default("TH") province String?
  languages String[] workMode WorkMode @default(ANY) availability Availability[]
  specialTalents String? workSetupNeeds String? // private
  skills Skill[] educations Education[] certificates Certificate[] portfolio PortfolioItem[] posts Post[]
  contacts ContactChannel[] reviews Review[] @relation("ReviewTarget")
  embedding Unsupported("vector(1536)")?
  ratingAvg Float @default(0) ratingCount Int @default(0) completedJobs Int @default(0) rehires Int @default(0)
  verifyTier Int @default(1) isPublic Boolean @default(true) updatedAt DateTime @updatedAt
}
model OrgProfile {
  id String @id @default(cuid()) userId String @unique user User @relation(fields:[userId], references:[id], onDelete: Cascade)
  handle String @unique type OrgType name String logoUrl String? coverUrl String? description String?
  industry String? country String @default("TH") province String? website String? employeeCount Int?
  registrationNo String? // private, for verification
  verifyTier Int @default(1) contacts ContactChannel[] needs HiringNeed[] updatedAt DateTime @updatedAt
}
enum OrgType { INDIVIDUAL ASSOCIATION STARTUP PRIVATE_COMPANY GOVERNMENT }
enum WorkMode { REMOTE ONSITE HYBRID ANY }
enum Availability { FULL_TIME PART_TIME FREELANCE PROJECT }
 
model HiringNeed { id String @id @default(cuid()) orgId String org OrgProfile @relation(fields:[orgId], references:[id], onDelete: Cascade) title String skills String[] workMode WorkMode location String? employmentType Availability educationLevel String? ageMin Int? ageMax Int? offeredSetup String[] description String? embedding Unsupported("vector(1536)")? isOpen Boolean @default(true) createdAt DateTime @default(now()) }
model Skill { id String @id @default(cuid()) talentId String talent TalentProfile @relation(fields:[talentId], references:[id], onDelete: Cascade) name String level String? }
model Education { id String @id @default(cuid()) talentId String talent TalentProfile @relation(fields:[talentId], references:[id], onDelete: Cascade) level String school String field String? yearEnd Int? }
model Certificate { id String @id @default(cuid()) talentId String talent TalentProfile @relation(fields:[talentId], references:[id], onDelete: Cascade) kind CertKind title String issuer String? issuedAt DateTime? fileUrl String isPublic Boolean @default(true) }
enum CertKind { EMPLOYMENT TRAINING OTHER }
model PortfolioItem { id String @id @default(cuid()) talentId String talent TalentProfile @relation(fields:[talentId], references:[id], onDelete: Cascade) title String description String? images String[] link String? createdAt DateTime @default(now()) }
model Post { id String @id @default(cuid()) talentId String talent TalentProfile @relation(fields:[talentId], references:[id], onDelete: Cascade) kind PostKind text String? images String[] likeCount Int @default(0) createdAt DateTime @default(now()) }
enum PostKind { WORK PHOTO }
model ContactChannel { id String @id @default(cuid()) talentId String? talent TalentProfile? @relation(fields:[talentId], references:[id], onDelete: Cascade) orgId String? org OrgProfile? @relation(fields:[orgId], references:[id], onDelete: Cascade) kind ContactKind value String visibility Visibility @default(CHAT_ONLY) }
enum ContactKind { PHONE EMAIL LINE INSTAGRAM TIKTOK FACEBOOK LINKEDIN WEBSITE }
enum Visibility { PUBLIC CHAT_ONLY HIDDEN }
model Follow { followerId String followeeUserId String createdAt DateTime @default(now()) @@id([followerId, followeeUserId]) }
model Star { employerUserId String talentId String needId String? createdAt DateTime @default(now()) @@id([employerUserId, talentId]) }
model Review { id String @id @default(cuid()) targetId String target TalentProfile @relation("ReviewTarget", fields:[targetId], references:[id], onDelete: Cascade) authorUserId String conversationId String rating Int text String? createdAt DateTime @default(now()) @@unique([authorUserId, targetId, conversationId]) }
model Conversation { id String @id @default(cuid()) talentUserId String employerUserId String lastMessageAt DateTime @default(now()) messages Message[] blockedBy String? @@unique([talentUserId, employerUserId]) }
model Message { id String @id @default(cuid()) conversationId String conversation Conversation @relation(fields:[conversationId], references:[id], onDelete: Cascade) senderUserId String kind MsgKind text String? attachments Json? offer Json? callRoom String? readAt DateTime? createdAt DateTime @default(now()) }
enum MsgKind { TEXT IMAGE FILE VOICE_NOTE OFFER CALL SYSTEM }
model Notification { id String @id @default(cuid()) userId String kind String payload Json readAt DateTime? createdAt DateTime @default(now()) }
model Report { id String @id @default(cuid()) reporterUserId String targetUserId String reason String details String? createdAt DateTime @default(now()) }
model ConsentRecord { id String @id @default(cuid()) userId String user User @relation(fields:[userId], references:[id], onDelete: Cascade) kind String version String granted Boolean createdAt DateTime @default(now()) }
model AuditLog { id String @id @default(cuid()) actorUserId String? action String meta Json createdAt DateTime @default(now()) }
```
(Add Better Auth's own tables via its Prisma adapter generator.)
 
---
 
## 12. The QA loop — run at the END OF EVERY STAGE (mandatory)
 
After finishing each stage in section 13, run this loop. **Use subagents** (Claude Code Task/agent tool) so review is independent from the builder:
 
1. **Agent A — QA engineer:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, then Playwright e2e for everything built so far, and Playwright **screenshots of every page touched in this stage** at these viewports:
   - Phones: 320×568, 375×667, 390×844, 393×852, 430×932
   - Tablets: 768×1024, 820×1180, 1024×768, 1024×1366
   - Desktop: 1280×800, 1440×900, 1920×1080
   - Both light and dark theme, EN and TH.
   Reports failures with file:line.
2. **Agent B — design critic (use the frontend-design skill if available):** looks at the screenshots and scores 1–10 with one-line reasons: Visual polish · Typography · Spacing & alignment · Colour use · Responsiveness (no overflow, no clipped text, tap targets) · Motion smoothness (check for layout shift, jank, reduced-motion) · UX clarity (can a first-time user finish the flow?) · Copy quality (sentence case, plain words, consistent action names) · Consistency with section 4 tokens · Delight (the mic moment). It must be strict: a 10 means a senior designer at a world-class product company would ship it unchanged.
3. **Agent C — accessibility & performance:** axe on every route (0 serious/critical), keyboard walkthrough of the stage's flows, Lighthouse mobile (targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90), checks CLS < 0.05 and that animations use transform/opacity only.
4. **Builder fixes everything reported**, then **re-run 1–3**. Repeat until: all tests pass, axe clean, Lighthouse targets met, **every design score ≥ 9 (aim for 10)**. Maximum **5 loops per stage** — if still below target, write the remaining issues to `QA_REPORT.md` and continue (don't stall the build).
5. Append the stage's final score table and screenshots path to `QA_REPORT.md`:
   `| Stage | Loop | Polish | Type | Spacing | Colour | Responsive | Motion | UX | Copy | Consistency | Delight | Avg | Tests | axe | Lighthouse |`
Scores must be honest — never inflate a score to exit the loop.
 
---
 
## 13. Build order (commit after every stage, keep the app runnable)
 
**All stages are mandatory, in this order:**
1. **Foundation:** scaffold, tokens, fonts, i18n (EN default, TH), theme, app shell (icon rail / bottom nav), motion library, UI components, `.env.example`, Prisma schema, seed script skeleton. → QA loop.
2. **Auth:** Better Auth with Google + Email OTP, `/login`, `/welcome`, session handling, route protection. → QA loop.
3. **Judge mode + seed data:** sandbox accounts, 12 realistic sample talent (diverse, fictional, labelled "Sample"), 5 sample organizations of each type, needs, posts, reviews, conversations. → QA loop. (Do this early: it guarantees a demo even if later stages slip.)
4. **Talent onboarding + profile page** (including uploads, cover, posts, certificates, reviews display, ProgressPill, contact visibility). → QA loop.
5. **"Speak to fill"** — `MicInput`/`MicTextarea` everywhere + "Fill my profile by voice" (transcribe → Claude structures into fields with Zod → review UI with accept/edit per field, AI label) + "Write with AI" bio. → QA loop.
6. **Employer onboarding + hiring needs + matched feed** (embeddings, scoring, "Why this match", star/follow/skip, filters, swipe on mobile). → QA loop.
7. **Messages** (realtime text, images/files, voice notes, read receipts, offer cards, translate, block/report) + **voice/video calls** (Daily). → QA loop.
8. **Landing page** (all of section 6, sponsors strip with placeholders, how-to guide, FAQ, footer judge button) + policy pages + cookie banner + settings (export/delete). → QA loop.
9. **Social & trust features:** notifications page (in-app, realtime) + email notifications for new messages/offers (Resend, user can turn off), review-writing flow (only after a conversation with an accepted offer; 1–5 stars + text; one per conversation), comments and likes on posts, `/admin` (verification approvals, reports queue, user suspension), Section 33 calculator page, `/built-vs-planned` page. → QA loop.
10. **Production hardening:** error boundaries and friendly error/404/500 pages, loading states on every route, SEO (metadata, Open Graph images per profile, sitemap, robots), PWA manifest + icons (installable on phones), image optimization (`next/image`, responsive sizes), caching strategy, Sentry error monitoring (optional key), structured server logs without PII, database indexes for feed/search/messages, rate limits verified, security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy). → QA loop.
11. **Deployment:** deploy to **Vercel** (app) + **Supabase** (Postgres with pgvector, Storage, Realtime). Document every step in `DEPLOY.md`: env vars, Google OAuth redirect URIs for the production domain, Resend domain verification, Supabase bucket policies, running migrations and seed, setting up the judge-sandbox reset cron (Vercel Cron). Run the full QA loop against the deployed URL, including real Google sign-in, real OTP email, real file upload, realtime chat between two browsers, and a real voice/video call. → final QA loop.
Nothing in this list is optional. If a stage reveals a problem in an earlier stage, fix it there and re-run that stage's QA loop.
 
---
 
## 14. Final acceptance (before declaring done)
 
- [ ] `pnpm i && pnpm db:push && pnpm db:seed && pnpm dev` works from a clean clone; README explains setup, env vars, architecture (Mermaid diagram), AI usage per feature, known limits, and how to run the QA loop.
- [ ] Judge mode works with no Google/Resend keys.
- [ ] Every page passes the QA loop thresholds on all listed viewports, light/dark, EN/TH.
- [ ] No hard-coded AI output anywhere; all sample data is labelled "Sample".
- [ ] No disability/gender/religion/ethnicity filter or ranking exists anywhere (add a test that the filter schema rejects those keys).
- [ ] Private fields (DOB, gender, work-setup needs, registration number, hidden contacts) never leave the server for unauthorized viewers (add API tests).
- [ ] Deployed production URL works end to end on a real phone, iPad and desktop (Safari, Chrome, Firefox); `DEPLOY.md` lets someone else redeploy from scratch.
- [ ] `QA_REPORT.md` shows the final scores per stage; `DECISIONS.md` lists assumptions; `DEMO.md` has a 3-minute demo script: Judge mode → talent profile → speak to fill → switch to employer → feed with "Why this match" → star → chat → offer card → start a call.
Start with Stage 1 now. After each stage, print: what works, the QA score table, and what's next.
 