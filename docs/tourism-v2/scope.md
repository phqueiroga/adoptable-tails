# Experience Compass — attraction scope

## Client and problem

Experience Compass serves visitor attractions: museums, parks, heritage sites, visitor centres and cultural venues. The attraction supplies its visitor-engagement problem and real content. The agents decide how to transform it; the client does not select the product.

## Client briefing

| Field | Purpose |
|---|---|
| `organisation_name` | Attraction name |
| `attraction_type` | Museum, park, heritage site, visitor centre, cultural venue or other |
| `destination` | Attraction location |
| `engagement_problem` | What visitors currently miss or misunderstand |
| `target_audience` | Intended visitor segment |
| `existing_content` | Real stories, objects, events or areas available for use |
| `visitor_outcome` | What visitors should experience or learn |
| `resources_and_constraints` | Resources, accessibility needs and restrictions |
| `desired_duration_minutes` | Expected length |
| `desired_tone` | Intended emotional and editorial tone |

No visitor identity or sensitive data is required.

## Permitted products

The Designer selects exactly one and the Maker may not change it.

### Treasure hunt

- Evidence-backed clues or challenges connected to supplied attraction content
- Clear mission, feedback, progress and completion
- Accessible alternative where a physical interaction is unsuitable

### Interactive timeline

- Sourced events in chronological order
- Connections between people, objects, places and events
- User-controlled exploration, narrative introduction and conclusion
- Accessible keyboard and mobile interaction

## External API

Google Places is the sole custom external API. The Researcher searches for the named attraction and may retrieve its official name, address, category, coordinates, opening-hour data, ratings and accessibility fields. These fields ground the organisation but do not prove visitor behaviour or historical claims.

Anthropic web search may add historical or cultural evidence when relevant. The system does not use weather, routing, transport or itinerary APIs.

## Success definition

A successful run produces one sourced, accessible and working treasure hunt or interactive timeline, plus a launch plan and Manager decision supported by five validated handoffs.
