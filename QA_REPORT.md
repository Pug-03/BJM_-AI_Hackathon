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
