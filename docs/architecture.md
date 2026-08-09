# Architecture

## Intended request flow

```text
Adopter questionnaire (GitHub Pages)
                  |
                  v
Protected serverless API
        |                   |
        v                   v
Live pet-data adapter   Claude Haiku 4.5
        |
        +-- RescueGroups
        `-- Supabase fallback
                  |
                  v
Deterministic exclusions and scoring
                  |
                  v
Five-agent explanation and validation workflow
                  |
                  v
Three transparent recommendations
```

## Trust boundary

The GitHub Pages frontend is public and must contain no credentials. The serverless API owns provider credentials, validates request payloads, limits usage, queries the live data source, and returns only the fields required by the interface.

## Data-source interface

Both live-data connectors should implement the same conceptual operations:

- list currently available animals;
- filter by species and geographic criteria;
- fetch a current record before final recommendation;
- normalise provider fields into the project animal schema;
- preserve missing values as unknown;
- expose the source listing URL and retrieval time.

## Decision responsibilities

The deterministic application layer owns exclusions and compatibility scores. Claude receives structured evidence and produces role-specific analysis and explanations. ShelterLead verifies that the final text is supported by the supplied evidence and that the animal remains available.
