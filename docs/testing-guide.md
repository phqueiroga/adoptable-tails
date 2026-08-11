# Short testing guide

Use this cycle throughout development: **run → inspect failures → record the gap → change one thing → rerun the same scenario**. Keep the before-and-after run IDs as evidence in the iteration log.

## 1. Free checks after every change

```bash
npm test
npm run check
```

These verify deterministic matching, unknown-data handling, ranking limits, JavaScript syntax, and the evaluation rules. They do not call Claude and cost nothing.

## 2. Five-minute customer journey check

Open the public URL on both a laptop and phone, then confirm:

1. All 12 questions can be answered and Back/Continue preserve selections.
2. Missing answers show a clear error rather than submitting.
3. The waiting screen names all five agents and explains the expected delay.
4. Results show 1–3 cards, a live record count and timestamp, balanced strengths and questions, and a non-binding AI notice.
5. “See how the five agents collaborated” shows Scout → Harmony → PawBuilder → TailTalk → ShelterLead.
6. The Manager result says Approved. If it does not, no recommendations should be trusted.
7. No name, email, secret key, or adoption approval is requested or displayed.

Record browser, device, scenario, outcome, run ID, gap found, and action taken in `docs/iteration-log.md`.

## 3. Live agent evaluation

One scenario runs five Claude calls, so run it intentionally:

```bash
npm run evaluate -- --list
npm run evaluate -- apartment-dog
```

For a broader comparison across three profiles:

```bash
npm run evaluate -- --all
```

The script checks 14 requirements across the live source, all five agents, score integrity, handoff IDs, balanced communication, manager approval, and audit evidence. It prints PASS/FAIL results and saves a dated JSON report in `evaluation-results/`.

## 4. What each scenario challenges

| Scenario | Main risk tested |
|---|---|
| `apartment-dog` | Apartment suitability, garden restriction, first-time owner, alone-time interpretation |
| `family-with-cat` | Child safety, existing-cat conflict, “either” species, preferences not becoming exclusions |
| `experienced-active` | High activity, experienced care, large/young preferences, openness to special needs |

## 5. How to handle a failure

- **Scout failure:** wrong live count, stale timestamp, unsafe candidate ID, or missing unknowns → inspect live query and Researcher prompt.
- **Harmony failure:** preferences treated as hard exclusions or unclear card requirements → refine the design rules.
- **PawBuilder failure:** score changed, order changed, more than three results, or invented evidence → fix deterministic handoff and Maker prompt.
- **TailTalk failure:** unsupported claim, pressure language, missing questions, or adoption guarantee → tighten communication constraints.
- **ShelterLead failure:** approves any issue above or fails to explain rejection → strengthen validation checks and rerun the identical profile.
- **Interface failure:** request, progress, rendering, accessibility, or mobile issue → fix the public page and repeat the customer journey.

A failed live run is useful assignment evidence when the gap, correction, and successful rerun are documented.
