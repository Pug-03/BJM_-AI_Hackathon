# QA report

The QA loop (PROMPT.md section 12) runs at the end of every stage with three independent subagents:

- **A**: tests and screenshots
- **B**: design critic
- **C**: accessibility and performance

Scores are recorded exactly as the agents gave them.

Screenshots are written to `qa/screens/stage-<n>/<route>/<locale>-<theme>-<viewport>.png` by `ABLE_E2E_OTP=424242 pnpm exec playwright test --project=screens`. The folder is gitignored, so regenerate it locally.

| Stage | Loop | Polish | Type | Spacing | Colour | Responsive | Motion | UX | Copy | Consistency | Delight | Avg | Tests | axe | Lighthouse |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | – | – | – | – | – | – | – | – | – | – | – | lint/type/unit pass; e2e blocked (networkidle + overwritten build) | 1 serious (select placeholder) | invalid (dev build) |
| 1+2 | 2 | 5 | 7 | 5 | 6 | 5 | 7 | 6 | 7 | 7 | 3 | 5.8 | 50/50 e2e after fixes | 0 serious/critical | /en 90·100·100·100, CLS 0.08 ✗; /login 89·100·96·60 (noindex) |
| 3 (full) | 1 | 6 | 7 | 6 | 5 | 6 | 7 | 6 | 7 | 7 | 5 | 6.2 | 38/50 (ENOENT clash) → 58/58 after fixes | 0 serious/critical at 390; 1 serious after (avatar name mismatch) → fixed | /en 90·100·100·100; explore 90; login 92; judge 91; CLS 0 |
| 3 (full) | 2 | 7 | 7 | 6 | 8 | 7 | 6 | 7 | 7 | 7 | 5 | 6.7 | 57/58 (welcome pre-hydration race) → 58/58 after fixes | 0 serious/critical, 0 moderate | /en 91 (median of 90/92/91)·100·100·100; explore/login/judge 100; CLS 0 |
| 3 (full) | 3 (final) | 7 | 7 | 6 | 8 | 7 | 7 | 7 | 7 | 6 | 5 | 6.7 | 58/58 (78/78 incl. Stage 4 specs) | 0 violations (32/32 + 28 scans) | /en 91 (median 89/91/91)·100·100·100; explore/login/judge 100; CLS 0 |

## Notes per loop

**Stage 1, loop 1.**
- A dev server overwrote `.next` in the middle of the run, so the screenshots and Lighthouse numbers are invalid. QA builds now go to `.next-qa`.
- Real defects found and fixed:
  - `twMerge` dropped the button text colour, because the custom `text-body` and `text-small` utilities were treated as colours.
  - The key notice sat under the icon rail.
  - The select placeholder failed contrast.
  - The confirm dialog didn't return focus.
  - Touch targets were under 44px (chip remove, verified badge, logo).
  - Meta tags were streamed into the body.

**Stages 1 and 2, loop 2.** Stage 2 auth was built before this loop finished, so the loop covers both stages.
- Fixed after the loop:
  - CLS came from the key notice appearing after hydration. It is now a floating card outside the document flow.
  - Login focus was lost when switching steps and after a wrong code.
  - Each welcome card was an extra tab stop.
  - The OTP and input focus rings were below spec.
  - The E2E rate limit caused flaky tests.
  - The welcome radio ring had low contrast.
  - The ProgressPill overlapped content.
- Design critic fixes in progress: dark-mode surfaces, the hero product mock, the disabled button state, login and welcome hierarchy, the explore empty state, the mobile header menu, the sponsor strip, and input boundaries.

**Stage 3, full check, loop 1.**
- Agent A found:
  - /feed overflowed horizontally on phones (a grid item had no column template).
  - The judge banner wrapped, leaving a dangling "·".
  - The welcome header overflowed at 320px in TH.
  - Thai link text broke mid-word.
- Agent C found:
  - The hero waveform widened the page at 320px.
  - The judge banner's focus ring and Exit target were too small.
  - Footer links were narrower than 44px.
  - The 2px input focus ring never rendered (Tailwind v4 `outline-none` variable).
  - The LCP was delayed by the entrance animation and by the client-only notice.
- Agent B found:
  - Too much violet: the cover, avatars and chips.
  - Hero timing ran past the 320ms token.
  - The footer hairline was misaligned.
  - The hero axis drifted at tablet widths.
  - The TH headline wrapped badly.
  - The judge cards gave no sign they could be clicked.
  - The login logo appeared twice.
- All of the above are fixed. Axe now runs with reduced motion so it never measures mid-fade.

**Stage 3, full check, loop 2.**
- Agent A found:
  - Clicking Continue on /welcome before hydration did a native GET submit, losing the user's choice.
  - The banner text wrapped at 320px.
  - The Thai compound word "งานที่ใช่" split across lines.
  - The feed note referred to "Sample" badges that aren't shown in judge mode.
- Agent C: all targets passed. It also found:
  - The key notice covered primary buttons on small phones, and the footer "Judge mode" button on mobile.
  - The LCP cover image wasn't preloaded.
  - The switch hit area was 42px tall.
  - The banner focus ring was clipped at the top of the viewport.
- Agent B found:
  - The mic field grew when its text filled in, shifting the layout.
  - The hero order didn't match §5 (it should be headline → mock → CTA).
  - The cover read as a loading skeleton.
  - Avatars almost disappeared in dark mode.
  - The mobile footer was too long.
  - The /judge content didn't line up with the header grid.
  - Small text left orphans and broke at dashes.
  - Login used an undefined `outline` button variant.
  - The Thai headline meaning drifted from "Work that fits you."
- All of the above are fixed. The Thai headline is now "งานที่ใช่ สำหรับคุณ".

**Stage 3, full check, loop 3 (final; the 3-loop cap is reached).**
- Agent A: all commands pass and nothing overflows horizontally. Fixed afterwards:
  - `text-wrap: pretty` overrode `truncate`.
  - The footer didn't stretch to the bottom on short pages.
  - Two Thai words split mid-word.
- Agent C: every target passes except one. The key notice still covered first-view controls at 320 and 375. Fixed afterwards: below `md` the notice is now part of the normal page flow at the end of the page, and the hero cover is a real `<img fetchpriority=high>`.
- Agent B: average 6.7. **Still below the target of 9. Remaining issues:**
  - The footer's "Judge mode" button has no visible edge.
  - The hero subline uses off-scale text sizes.
  - The hero mock spacing and its axis at tablet widths.
  - The mic capsule squashes its text, plays while off-screen, and doesn't morph into the filled text.
  - The hero shifts before JavaScript loads.
  - The login card uses the sheet radius and off-scale padding, and its header isn't in the 1200px container.
  - The dark secondary button looks recessed inside raised cards.
  - The /judge layout is half empty and its heading gap is too tight.
  - Judge card copy and press token.
- Next step, at the owner's request: a focused design pass on landing, login and judge mode, held strictly to section 4, before Stage 4 continues.

**Design pass after Stage 3 (owner request: landing, login, judge mode; section 4 strictly).** Addresses all 10 loop-3 findings from Agent B:
- **Footer:**
  - Spacing is on scale (`gap-12`) and the bottom row is aligned (`md:items-center`).
  - "Judge mode" is a visible outlined paper pill, hidden on /judge itself.
- **Hero:**
  - The subline uses the H3 size at regular weight, not the off-scale 18/20px.
  - The entrance runs in CSS (`able-rise`), so it starts at first paint and keeps the headline → mock → CTA order.
  - The mock shares the copy's left edge below lg, and the 8px crowding is gone.
  - The mic capsule background grows from the mic button with its content fading in (no squashed text). It starts only when in view, and hands over to the text from the mic side.
- **Login:** the card uses the 20px card radius and on-scale padding (24/48). The header sits in the 1200px container, so the logo no longer jumps.
- **Dark mode:** the secondary button uses `--line` and icon discs use `--avatar`, so neither reads as a hole inside raised cards.
- **Judge:**
  - Focused 720px column with on-scale gaps (16/32).
  - Action-oriented card hints, plus a reassurance line about privacy and the 24h reset.
  - Shared `pressable` token.
- **Mobile landing header:** shows "Log in", since the hero already has the full-width "Get started".
- No new design scores yet. The next full A/B/C loop runs after Stage 7.

## Quick checks (section 12.1)

| Stage | lint | typecheck | unit | build | e2e | shots (390/820/1440, light, EN) | Notes |
|---|---|---|---|---|---|---|---|
| 4 | ✓ | ✓ | 22/22 | ✓ | 78/78 | onboarding-talent, profile-public, profile-me — no overflow | Fixed: an avatar added before the profile existed was lost; fast step navigation outran autosave (now flushed on step change); "Share" wrapped on its own line |
| 5 | ✓ | ✓ | 31/31 | ✓ | 80/80 (4 skipped) | onboarding-talent, profile-me — no overflow | Live AI not exercised: the QA server has no OpenAI/Anthropic keys, so e2e covers the "not set up here" explanations and the auth/consent gate on /api/ai/transcribe. Fixed: mic aria-labels collided with field labels in e2e selectors |
| 6 | ✓ | ✓ | 38/38 | ✓ | 104/104 (4 skipped) | explore, feed-talent, feed-employer, needs, saved-employer, org-public, onboarding-employer — no overflow | Fixed: client-module helpers called from server pages (moved to `src/lib`), a 1px grid overflow on mobile feed/org pages, and page transition rendering the new route twice during exit. Local explore shows leftover e2e test accounts (local DB only) |
| 7 | ✓ | ✓ | 41/41 | ✓ | 116/116 (4 skipped) | messages-inbox, messages-thread — no overflow | Two-browser chat (send, reply, read receipt) passes on the 5-second polling fallback; Supabase Realtime and Daily calls not exercised (no keys). Fixed: mobile thread sat under the bottom nav (z-index); voice-note button now uses a waveform icon so it isn't confused with the dictation mic |

## Stage 7 full QA loop

| Stage | Loop | Polish | Type | Spacing | Colour | Responsive | Motion | UX | Copy | Consistency | Delight | Avg | Tests | axe | Lighthouse |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 1 | 7 | 7 | 6 | 6 | 6 | 7 | 6 | 8 | 6 | 6 | 6.5 | 116/116 | 0 on 136 route runs; 4 serious in one open-menu state | /en 89, explore 88, org 90, login 100, judge 100 (A 100, BP 100, SEO 100; login/judge SEO 60 from intentional noindex); CLS 0 |

**Loop 1 fixes.** Screenshots: `qa/screens/stage-*`.

- Design (Agent B):
  - E2E accounts are sandboxed, so test data no longer appears in Explore.
  - Org page: the logo was stacked behind the cover, and the badge was detached from a two-line name.
  - The violet sample cover was replaced with a neutral one, and covers are dimmed in dark mode.
  - Selected chips now use `--brand-soft` (section 4.2).
  - Talent cards: one chip row, and the Sample badge sits on the cover.
  - Needs rows stack below `lg`, and the Select value truncates.
  - Onboarding: the age switch sits under the date of birth, Province is paired with Country, and the step-nav offset is gone.
  - Thread: "Translate" now sits on the time row, sent bubbles are softer in dark mode, and the voice-note button has a tooltip.
  - Talent feed is paged (8, then "Show more").
- Accessibility (Agent C):
  - Thread menus are non-modal, which fixes `aria-hidden-focus`.
  - Dialogs opened from state or a menu now return focus to their opener (`dialog.tsx` focus tracking).
  - The composer textarea has a visible focus ring.
  - Highlighted menu items use brand-soft with an inset ring.
  - The native date-picker icon gets a focus ring.
- Performance (Agent C):
  - The hero cover is now CSS, so the headline is the LCP element.
  - The first-row Explore covers load eagerly.
- Found while fixing: on mobile, the new landing "Speak to fill" grid overflowed to 578px, which shifted the whole layout viewport. Fixed with `grid-cols-[minmax(0,1fr)]`.
- **Loop 2** runs as part of the Stage 8 full check, which re-shoots and re-scores every page, including all Stage 7 pages.

| 8 | ✓ | ✓ | 50/50 | ✓ | 135/136 (1 flaky under load, passes on rerun; wait raised) | landing, privacy, settings, quota — no overflow | Cookie banner, policies, settings export/delete covered by `stage8.spec.ts` |

## Stage 8 full QA loop

| Stage | Loop | Polish | Type | Spacing | Colour | Responsive | Motion | UX | Copy | Consistency | Delight | Avg | Tests | axe | Lighthouse |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | 1 | 7 | 7 | 7 | 6.5 | 7 | 7 | 6 | 8 | 6 | 6 | 6.8 | 136/136 | 0 violations in 208 scans (160 page + 48 interactive states) | /en 100, explore 86, org 88, privacy 100, quota 100, login/judge 100 (SEO 60 = intentional noindex); A 100, BP 100; CLS 0 |

**Loop 1 fixes.**

- Design:
  - The duplicate "Sample" pill and the "+N" off-by-one were left over from a Stage 7 fix that only partly applied; both are fixed now.
  - A debug profile is now sandboxed.
  - The landing quota block uses a dark-mode surface.
  - The messages height accounts for the judge banner (`--banner-h`).
  - Meta rows have separators.
  - The starred state is softer, and Follow is labelled.
  - Post thumbnails are dimmed in dark mode.
  - "Step x of y" is hidden on desktop.
  - Org page: every meta row has an icon, and a zero follower count is hidden.
  - The mic capsule now grows by clip-path, so the end caps aren't squashed, and the hero replays when you scroll back to it.
  - New closing headline.
  - Quota shows "—" before input.
  - Settings shows "Demo account" and a chevron on the consent history.
- Accessibility: in the cookie banner, "Choose" moves focus to the analytics switch, and closing returns focus to the opener or `#main`.
- Performance: bundled sample covers are inlined as SVG (`CoverArt`), so they're never the LCP image. Re-measured: explore 100, org 100.
| 9 | ✓ | ✓ | 50/50 | ✓ | 151/152 + rerun 8/8 (case-sensitive selector fixed) | quota, notifications, built-vs-planned — no overflow | Review flow tested end to end across two browsers (offer → accept → one review → notification); admin 404 for non-admins; likes/comments |
