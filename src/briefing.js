export const organisationTypes = ["museum", "hotel", "attraction", "tour_operator", "destination_organisation", "cultural_venue"];

export const briefingFields = [
  "organisation_name", "organisation_type", "destination", "engagement_problem",
  "target_audience", "business_objective", "visitor_outcome",
  "desired_duration_minutes", "priority_interests", "accessibility_requirements",
  "available_resources", "constraints", "desired_tone", "success_indicator"
];

export function validateBriefing(value) {
  if (!value || typeof value !== "object") return { valid: false, errors: ["Briefing is required"] };
  const errors = [];
  for (const field of briefingFields) {
    if (!(field in value) || value[field] === "" || value[field] == null) errors.push(`${field} is required`);
  }
  if (!organisationTypes.includes(value.organisation_type)) errors.push("organisation_type is invalid");
  if (!Number.isInteger(Number(value.desired_duration_minutes)) || Number(value.desired_duration_minutes) < 10 || Number(value.desired_duration_minutes) > 240) errors.push("desired_duration_minutes must be 10-240");
  for (const field of briefingFields.filter((key) => !["desired_duration_minutes", "organisation_type"].includes(key))) {
    if (typeof value[field] === "string" && value[field].length > 800) errors.push(`${field} is too long`);
  }
  return { valid: errors.length === 0, errors };
}

export function normaliseBriefing(value) {
  return Object.fromEntries(briefingFields.map((field) => [field, field === "desired_duration_minutes" ? Number(value[field]) : String(value[field]).trim()]));
}
