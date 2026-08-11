# Pipeline Iteration Log

This is technical evidence of development iterations. It is not the student's personal reflection.

| Date | Run | Result | Finding | Change |
|---|---|---|---|---|
| 2026-08-11 | `841b7a74-a369-4f52-a1f1-1da31bfc4aa8` | Failed during Harmony | Structured JSON was truncated by the output-token ceiling | Increased output allowance and added an explicit truncation error code |
| 2026-08-11 | `e6c5a43c-e4f3-4783-85ff-7951c8dcfdb8` | Completed | Agents misinterpreted animal alone-time capacity and allowed narrative priorities to override score order | Added shared field semantics, preference boundaries, descending-score rule, and Manager validation |
| 2026-08-11 | `b97f1c0d-36e9-4c9b-80f2-3ece0126d7c8` | Completed and approved | Correct live query, five cumulative handoffs, descending scores, correct alone-time semantics, and no Manager issues | Accepted as the first verified baseline run |
| 2026-08-11 | `f5621c0a-5e62-44be-8906-7fc39f18b33c` | Rejected by Manager | Mobile request was long-running; PawBuilder also allowed a dog with 5-hour capacity for a 6-hour requirement | Added immediate run IDs with resumable polling and made insufficient/unknown alone time a deterministic exclusion |
| 2026-08-11 | `5dee0256-eee9-4bed-9fe1-fe97087f00c2` | 11/14; rejected | Stress profile found unsupported “broad compatibility” wording and Manager incorrectly expected more than the three-animal deliverable | Made synthetic descriptions evidence-neutral and clarified Manager boundaries for shortlist size and recorded fields |
| 2026-08-11 | `25aa63d2-a240-444a-9527-75c50a146469` | 14/14; approved | Hardest profile returned Mara, Theo and Skye with preserved 100-point scores, full handoffs and zero Manager issues | Accepted as verified mobile-architecture and synthetic-coverage regression run |

The baseline run dynamically queried 20 available dog records through the Supabase REST Data API. Scout, Harmony, PawBuilder, TailTalk, and ShelterLead all produced stored structured outputs. ShelterLead approved three 100-point candidates with no validation issues.

The later stress run queried 23 available dogs. Its profile combined an apartment, no garden, children under eight, an existing dog and cat, first-time experience, and 10 hours alone. This deliberately tests every dog-related hard constraint at once. Three synthetic records spanning low, medium and high activity remained eligible; approval does not imply universal suitability and all unknown behaviour still requires shelter verification.
