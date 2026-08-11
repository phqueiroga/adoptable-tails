# Adoptable Tails

Adoptable Tails is a student prototype that helps prospective adopters discover potentially compatible cats and dogs. It uses live pet data, transparent matching rules, and a five-agent AI workflow powered by Claude Haiku 4.5.

The system recommends animals for further consideration. It does not approve adopters, guarantee compatibility, or replace the judgement of shelters, veterinary professionals, or adopters.

## Initial scope

- Fictional organisation: Adoptable Tails Ireland
- Audience: prospective adopters in Ireland
- Animals: cats and dogs
- AI provider: Anthropic
- AI model: Claude Haiku 4.5
- Primary live-data source: Supabase
- Optional later data source: RescueGroups
- Public interface: GitHub Pages
- Protected backend: serverless API (provider to be confirmed)

## Five-agent workflow

1. **Scout — Researcher:** interprets the adopter questionnaire and retrieves current animal records.
2. **Harmony — Designer:** converts needs and constraints into a matching strategy.
3. **PawBuilder — Maker:** applies deterministic rules and produces a ranked shortlist.
4. **TailTalk — Communicator:** writes clear, responsible explanations.
5. **ShelterLead — Manager:** validates availability, evidence, welfare constraints, and unsupported claims.

## Matching principles

- Explicit welfare conflicts are hard exclusions.
- Preferences are ranked with deterministic weighted scoring.
- Missing data remains `unknown`; it is never treated as a positive match.
- The language model explains structured results but does not independently invent or calculate scores.
- Every recommendation must be traceable to questionnaire answers and current animal data.

## Security

Never place API keys in browser code or commit them to GitHub. Local secrets belong in `.env`; deployed secrets belong in protected hosting environment settings. Only `.env.example` is committed.

## Status

The project now includes a Supabase schema, a 40-animal fictional Irish seed inventory, a structured questionnaire, and a deterministic matching engine. The final demonstration will query the deployed Supabase database; RescueGroups can be added later without changing the matching workflow.

The five agent definitions and their assessment alignment are documented in
`docs/agent-designs.md`. The protected `match-agents` Edge Function implements
the cumulative Scout -> Harmony -> PawBuilder -> TailTalk -> ShelterLead flow.

## Local validation

```bash
npm test
npm run check
```

## Academic use

This repository is being developed for the Customer Engagement and Artificial Intelligence module at the National College of Ireland. AI-assisted work should be recorded in `docs/ai-usage-log.md` and reviewed by the student before submission.
