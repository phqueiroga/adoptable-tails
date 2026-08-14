# Five-Agent Handoff Contracts

The mandatory chain is unbroken:

```text
Researcher -> Designer -> Maker -> Communicator -> Manager
```

Every handoff is stored with the run ID, timestamp, agent name, model, input
references, structured output, and validation result. Later agents receive the
original briefing and the complete cumulative handoff relevant to their review.

## 1. Researcher

### Receives

- validated client briefing;
- access to Google Places and contextual web search;
- research limits: destination, themes, audience, and permitted claims.

### Must do

- invoke Google Places to identify and ground the named attraction;
- diagnose the engagement opportunity;
- evaluate relevance and coverage of returned entities;
- separate sourced facts, interpretations, gaps, and assumptions.

### Delivers to Designer

```text
research_question
opportunity_diagnosis
audience_needs[]
business_needs[]
source_queries[] { query, queried_at, result_count }
evidence_items[] { entity_id, label, fact, source_url, relevance }
experience_opportunities[]
constraints[]
unknowns[]
research_brief
```

### Handoff gate

At least one successful live query, at least three relevant evidence items,
source URLs for factual claims, and an explicit unknowns list.

## 2. Designer

### Receives

- client briefing;
- complete Researcher output and source references;
- definitions and boundaries of the two permitted products.

### Must do

- select exactly one product category and justify the selection;
- create an original experience concept for the specific evidence and problem;
- define journey, interactions, content requirements, accessibility, and success
  criteria without writing implementation code.

### Delivers to Maker

```text
selected_product { treasure_hunt | interactive_timeline }
selection_rationale
design_goal
experience_concept
visitor_journey[]
information_architecture[]
interaction_specification[]
required_evidence_ids[]
content_requirements[]
visual_direction
accessibility_requirements[]
functional_requirements[]
acceptance_criteria[]
known_tradeoffs[]
```

### Handoff gate

One category only, traceability to the research, requirements specific enough
to build and open enough to require Maker implementation judgement.

## 3. Maker

### Receives

- client briefing;
- Researcher evidence and source references;
- complete Designer specification and acceptance criteria;
- technical policy describing permitted browser capabilities.

### Must do

- make implementation decisions not resolved by the design;
- create the complete experience as HTML, CSS, and JavaScript;
- use only supplied evidence for factual content;
- implement interactions, progression, responsive behaviour, and accessibility;
- self-check the build against every acceptance criterion;
- report compromises rather than silently omitting requirements.

### Delivers to Communicator

```text
product_type
product_title
implementation_summary
files { html, css, javascript }
implemented_features[]
evidence_trace[] { interface_element, evidence_id }
usage_instructions[]
acceptance_check[] { criterion, result, evidence }
known_limitations[]
build_status { ready | incomplete | unsafe }
```

The tangible Maker output is the functioning webpage, not merely the JSON
metadata surrounding it.

### Handoff gate

Valid files, no unapproved network calls or secrets, functioning primary
interaction, source traceability, basic accessibility, and `build_status=ready`.

## 4. Communicator

### Receives

- client briefing and objectives;
- the functioning Maker webpage;
- implementation summary, instructions, and limitations;
- target audience and evidence-backed value proposition.

### Must do

- decide where and when the organisation should introduce the experience;
- connect the product to the real visitor journey;
- create audience-appropriate messages without promising unsupported outcomes;
- define an achievable launch and engagement measurement plan.

### Delivers to Manager

```text
value_proposition
audience_message
experience_name_and_tagline
visitor_touchpoints[]
channel_plan[]
launch_sequence[]
ready_to_use_copy[] { placement, copy, call_to_action }
engagement_metrics[] { metric, purpose, collection_method }
communication_risks[]
```

### Handoff gate

The communication must refer to features that actually exist, include at least
two visitor touchpoints, provide usable copy and metrics, and disclose relevant
limitations.

## 5. Manager

### Receives

- original briefing;
- all four preceding structured outputs;
- live-query evidence;
- webpage files and automated validation results;
- Communicator launch package.

### Must do

- validate the unbroken handoff and source traceability;
- determine whether the webpage solves the original engagement problem;
- check implementation against Designer acceptance criteria;
- check communication against the actual product;
- assess accessibility, ethics, feasibility, business value, and measurement;
- attribute every required correction to the appropriate stage.

### Delivers

```text
decision { approved | revision_required | rejected }
validation_checks[] { requirement, result, evidence }
issues[] { severity, responsible_agent, finding, required_change }
executive_summary
operational_plan[]
launch_conditions[]
success_metrics[]
risks[]
future_improvements[]
```

### Final gate

Only `approved` work is shown as launch-ready. `revision_required` and
`rejected` outputs remain visible as iteration evidence but are clearly marked
and must not be presented as approved client work.

## Testing implication

Tests will validate both content quality and the interface between stages:

- required fields and permitted values;
- source and evidence IDs preserved across handoffs;
- selected category unchanged after Designer;
- Designer criteria implemented or explicitly reported by Maker;
- Communicator claims matched to implemented features;
- Manager issues traceable to a specific stage;
- deliberately corrupted handoffs rejected.
