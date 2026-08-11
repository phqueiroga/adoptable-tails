# Animal Data Dictionary

Unknown values are stored as `null` and must remain unknown throughout scoring and explanation.

| Field | Meaning | Matching use |
|---|---|---|
| `status` | Current availability | Hard exclusion unless `available` |
| `species` | Cat or dog | Hard exclusion when a species is selected |
| `age_group` | Baby, young, adult, or senior | Weighted preference |
| `size` | Small, medium, or large | Weighted preference |
| `activity_level` | Low, medium, or high | Weighted compatibility |
| `apartment_suitable` | Recorded home suitability | Weighted compatibility |
| `garden_required` | Secure private garden is required | Hard exclusion without a garden |
| `good_with_children` | Recorded child compatibility | Hard exclusion on explicit conflict |
| `good_with_dogs` | Recorded dog compatibility | Hard exclusion on explicit conflict |
| `good_with_cats` | Recorded cat compatibility | Hard exclusion on explicit conflict |
| `max_alone_hours` | Recorded maximum routine alone time | Weighted compatibility |
| `experience_required` | Minimum suggested experience | Weighted compatibility |
| `special_needs` | Ongoing medical or behavioural needs | Hard exclusion when adopter opts out |
| `source_url` | Traceable original listing | Evidence and customer handoff |
| `updated_at` | Last record change | Availability and freshness validation |
