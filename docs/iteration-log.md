# Pipeline Iteration Log

This is technical evidence of development iterations. It is not the student's personal reflection.

| Date | Run | Result | Finding | Change |
|---|---|---|---|---|
| 2026-08-11 | `841b7a74-a369-4f52-a1f1-1da31bfc4aa8` | Failed during Harmony | Structured JSON was truncated by the output-token ceiling | Increased output allowance and added an explicit truncation error code |
| 2026-08-11 | `e6c5a43c-e4f3-4783-85ff-7951c8dcfdb8` | Completed | Agents misinterpreted animal alone-time capacity and allowed narrative priorities to override score order | Added shared field semantics, preference boundaries, descending-score rule, and Manager validation |
| 2026-08-11 | `b97f1c0d-36e9-4c9b-80f2-3ece0126d7c8` | Completed and approved | Correct live query, five cumulative handoffs, descending scores, correct alone-time semantics, and no Manager issues | Accepted as the first verified baseline run |

The baseline run dynamically queried 20 available dog records through the Supabase REST Data API. Scout, Harmony, PawBuilder, TailTalk, and ShelterLead all produced stored structured outputs. ShelterLead approved three 100-point candidates with no validation issues.
