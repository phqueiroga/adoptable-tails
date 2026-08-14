# Tourism Experience Studio - Scope Specification

## Organisation and customer

The product is an agentic digital studio for tourism organisations. Its clients
are museums, hotels, attractions, tour operators, destination organisations,
and cultural venues that have a customer-engagement problem but do not yet
know which digital experience would best address it.

The client supplies the problem, audience, objective, context, and constraints.
The client does **not** select the final product category. The Designer makes
that decision using the Researcher's live evidence.

## Client briefing

Every submission must contain the following fields.

| Field | Purpose |
|---|---|
| `organisation_name` | Identifies the fictional or real client |
| `organisation_type` | Hotel, tourism agency, or attraction |
| `attraction_type` | Museum, heritage site, park, visitor centre, or cultural venue when organisation type is attraction |
| `destination` | City, region, venue, or bounded visitor area |
| `engagement_problem` | The current customer problem to solve |
| `target_audience` | Visitor segment and relevant characteristics |
| `business_objective` | Desired organisational outcome |
| `visitor_outcome` | Desired value for the visitor |
| `desired_duration_minutes` | Expected experience length |
| `priority_interests` | Themes such as history, architecture, food, or culture |
| `accessibility_requirements` | Mobility, language, sensory, cognitive, or device needs |
| `available_resources` | Staff, signage, QR codes, venue access, or existing content |
| `constraints` | Geographic, operational, safety, budget, or content boundaries |
| `desired_tone` | For example playful, reflective, educational, or adventurous |
| `success_indicator` | Completion, dwell time, discovery, return visit, or another measure |
| `movement_allowed` | Whether the experience may involve movement between places |
| `starting_point` | Required when movement is allowed |
| `transport_modes` | Walking, public transport, and/or driving when movement is allowed |

No personal or sensitive visitor information is required.

## Permitted products

The Designer must select exactly one product. The Maker must build only the
selected product and may not silently switch categories.

### 1. Game - Treasure hunt

The finished webpage contains:

- a clear mission and narrative premise;
- 3-7 evidence-backed stages associated with real places or subjects;
- a challenge, optional hint, response mechanism, and feedback at each stage;
- progress and completion states;
- a final outcome connected to the client's engagement objective;
- accessible alternatives when physical movement or a specific interaction is
  not suitable.

### 2. Exploration - Personalised itinerary

The finished webpage contains:

- a short visitor preference input inside the experience;
- a generated or selectable sequence of 3-6 evidence-backed stops;
- reasons each stop suits the selected interests and available time;
- estimated experience duration and a clear sequence;
- alternative stops or paths when appropriate;
- a completion state and relevant next action.

The prototype is an itinerary experience, not a turn-by-turn navigation or
transport-booking service.

### 3. Storytelling - Interactive timeline

The finished webpage contains:

- 5-10 sourced events in chronological order;
- meaningful connections between people, places, and events;
- expandable detail or another form of user-controlled exploration;
- a narrative introduction and conclusion;
- at least one comparison, theme, or interpretive thread;
- accessible keyboard and mobile interaction.

## Scope boundaries

- The Researcher may use Anthropic web search, Google Places, Open-Meteo and
  Google Routes. It must call only sources relevant to the engagement problem
  and explain both calls and omissions.
- External facts are evidence about context, places, weather or travel, not
  proof of visitor behaviour or business performance.
- The product must expose sources and unknowns rather than invent missing facts.
- The Maker creates the complete HTML, CSS, and JavaScript experience.
- Generated code is validated and displayed within the GitHub Pages application;
  version 1 does not create a separate public URL for every generated experience.
- The system does not make bookings, collect payments, track precise visitor
  locations, or provide safety-critical navigation.

## Success definition

A successful run produces one working, sourced, accessible web experience that
responds to the original engagement problem, plus a launch strategy and a
Manager decision supported by recorded handoff evidence.
