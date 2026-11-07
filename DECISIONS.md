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
