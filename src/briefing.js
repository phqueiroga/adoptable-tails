export const organisationTypes = ["museum", "hotel", "attraction", "tour_operator", "destination_organisation", "cultural_venue"];

export const briefingFields = [
  "organisation_name", "organisation_type", "destination", "engagement_problem",
  "target_audience", "business_objective", "visitor_outcome",
  "desired_duration_minutes", "priority_interests", "accessibility_requirements",
  "available_resources", "constraints", "desired_tone", "success_indicator"
];
export const clientFields = ["organisation_name","organisation_type","destination","engagement_problem","target_audience","visitor_outcome","resources_and_constraints","desired_duration_minutes","desired_tone"];

export function validateBriefing(value) {
  if (!value || typeof value !== "object") return { valid: false, errors: ["Briefing is required"] };
  const errors = [];
  for (const field of clientFields) {
    if (!(field in value) || value[field] === "" || value[field] == null) errors.push(`${field} is required`);
  }
  if (!organisationTypes.includes(value.organisation_type)) errors.push("organisation_type is invalid");
  if (!Number.isInteger(Number(value.desired_duration_minutes)) || Number(value.desired_duration_minutes) < 10 || Number(value.desired_duration_minutes) > 240) errors.push("desired_duration_minutes must be 10-240");
  for (const field of clientFields.filter((key) => !["desired_duration_minutes", "organisation_type"].includes(key))) {
    if (typeof value[field] === "string" && value[field].length > 800) errors.push(`${field} is too long`);
  }
  return { valid: errors.length === 0, errors };
}

export function normaliseBriefing(value) {
  const supplied=(field)=>String(value[field]??"").trim();
  return {organisation_name:supplied("organisation_name"),organisation_type:supplied("organisation_type"),destination:supplied("destination"),engagement_problem:supplied("engagement_problem"),target_audience:supplied("target_audience"),visitor_outcome:supplied("visitor_outcome"),desired_duration_minutes:Number(value.desired_duration_minutes),desired_tone:supplied("desired_tone"),available_resources:supplied("resources_and_constraints"),constraints:supplied("resources_and_constraints"),business_objective:"Not supplied — infer cautiously and label as an assumption.",priority_interests:"Not supplied — recommend from external evidence and label as a recommendation.",accessibility_requirements:"Apply inclusive defaults: keyboard access, readable contrast, plain language and no colour-only meaning; record unknowns.",success_indicator:"Not supplied — propose a measurable indicator and label as a recommendation.",inference_note:"Only organisation, destination, problem, audience, visitor outcome, resources/constraints, duration and tone were supplied. All other details are agent inferences or recommendations."};
}
