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
