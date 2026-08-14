export const attractionTypes = ["museum", "park", "heritage_site", "visitor_centre", "cultural_venue", "other"];

export const clientFields = [
  "organisation_name", "attraction_type", "destination", "engagement_problem",
  "target_audience", "existing_content", "visitor_outcome",
  "resources_and_constraints", "desired_duration_minutes", "desired_tone",
];

export function validateBriefing(value) {
  if (!value || typeof value !== "object") return {valid: false, errors: ["Briefing is required"]};
  const errors = [];
  for (const field of clientFields) {
    if (!(field in value) || value[field] === "" || value[field] == null) errors.push(`${field} is required`);
  }
  if (!attractionTypes.includes(value.attraction_type)) errors.push("attraction_type is invalid");
  if (!Number.isInteger(Number(value.desired_duration_minutes)) || Number(value.desired_duration_minutes) < 10 || Number(value.desired_duration_minutes) > 240) errors.push("desired_duration_minutes must be 10-240");
  for (const field of clientFields.filter((key) => key !== "desired_duration_minutes")) {
    if (typeof value[field] === "string" && value[field].length > 800) errors.push(`${field} is too long`);
  }
  return {valid: errors.length === 0, errors};
}

export function normaliseBriefing(value) {
  const supplied = (field) => String(value[field] ?? "").trim();
  return {
    organisation_name: supplied("organisation_name"),
    organisation_type: "attraction",
    attraction_type: supplied("attraction_type"),
    destination: supplied("destination"),
    engagement_problem: supplied("engagement_problem"),
    target_audience: supplied("target_audience"),
    existing_content: supplied("existing_content"),
    visitor_outcome: supplied("visitor_outcome"),
    desired_duration_minutes: Number(value.desired_duration_minutes),
    desired_tone: supplied("desired_tone"),
    available_resources: supplied("resources_and_constraints"),
    constraints: supplied("resources_and_constraints"),
    business_objective: "Not supplied — infer cautiously and label as an assumption.",
    accessibility_requirements: "Apply inclusive defaults: keyboard access, readable contrast, plain language and no colour-only meaning; record unknowns.",
    success_indicator: "Not supplied — propose a measurable indicator and label it as a recommendation.",
    inference_note: "The client supplied attraction content and constraints. Product selection and all strategy beyond these fields are agent decisions that must be labelled and grounded in evidence.",
  };
}
