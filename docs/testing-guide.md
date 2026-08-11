# Adoptable Tails — quick test script

## A. Free check (every change)

```bash
npm test && npm run check
```

Expected: **6 tests pass** and no syntax errors. These checks do not call Claude.

## B. Live agent check (before demonstrations and submission)

```bash
npm run evaluate -- --all
```

This runs three intentionally different profiles. Each profile calls all five Claude agents, so use it deliberately.

| Try | What it challenges |
|---|---|
| Apartment dog | No garden, first-time adopter, alone-time and apartment suitability |
| Family with cat | Young children, existing cat, either species, hard welfare conflicts |
| Experienced active | High activity, young/large preferences, special-needs openness |

Expected for every try: **14/14 PASS** and a Supabase run ID. The dated JSON report is saved in `evaluation-results/`.

## C. Two-minute interface check

On both phone and laptop:

1. Complete all four questionnaire steps; also try Continue once with an unanswered question.
2. Confirm the waiting screen shows the five agents in the correct order.
3. Confirm results contain 1–3 ranked cards, live count/time, strengths, questions, AI disclaimer, and Manager approval.
4. Open “See how the five agents collaborated” and confirm Scout → Harmony → PawBuilder → TailTalk → ShelterLead.
5. Confirm no name, email, secret key, guarantee, or adoption approval appears.

## If anything fails

| Failure | Inspect first |
|---|---|
| Live count, timestamp, unsafe candidate | Scout / live query |
| Preference used as an exclusion | Harmony |
| Score, order, shortlist, invented evidence | PawBuilder |
| Unsupported claim, pressure, missing question | TailTalk |
| Incorrect approval or weak rejection reason | ShelterLead |
| Form, waiting screen, cards, phone layout | Public interface |

Record only: **date · scenario · run ID · failure · one change made · rerun result** in `docs/iteration-log.md`. A failed run followed by a documented improvement is useful assignment evidence.
