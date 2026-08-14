export const organisationTypes = ["hotel", "tourism_agency", "attraction"];
export const attractionTypes = ["museum", "park", "heritage_site", "visitor_centre", "cultural_venue", "other", "not_applicable"];
export const transportModes = ["walking", "driving", "public_transport"];

export const briefingFields = [
  "organisation_name", "organisation_type", "destination", "engagement_problem",
  "target_audience", "business_objective", "visitor_outcome",
  "desired_duration_minutes", "priority_interests", "accessibility_requirements",
  "available_resources", "constraints", "desired_tone", "success_indicator"
];
export const clientFields = ["organisation_name","organisation_type","destination","engagement_problem","target_audience","visitor_outcome","resources_and_constraints","desired_duration_minutes","desired_tone","movement_allowed"];

export function validateBriefing(value) {
  if (!value || typeof value !== "object") return { valid: false, errors: ["Briefing is required"] };
  const errors = [];
  for (const field of clientFields) {
    if (!(field in value) || value[field] === "" || value[field] == null) errors.push(`${field} is required`);
  }
  if (!organisationTypes.includes(value.organisation_type)) errors.push("organisation_type is invalid");
  if(!["yes","no"].includes(value.movement_allowed))errors.push("movement_allowed must be yes or no");
  if(value.organisation_type==="attraction"&&!attractionTypes.slice(0,-1).includes(value.attraction_type))errors.push("attraction_type is required for attractions");
  const modes=Array.isArray(value.transport_modes)?value.transport_modes:value.transport_modes?[value.transport_modes]:[];
  if(value.movement_allowed==="yes"&&(!modes.length||modes.some(mode=>!transportModes.includes(mode))))errors.push("at least one valid transport mode is required when movement is allowed");
  if(value.movement_allowed==="yes"&&!String(value.starting_point??"").trim())errors.push("starting_point is required when movement is allowed");
  if (!Number.isInteger(Number(value.desired_duration_minutes)) || Number(value.desired_duration_minutes) < 10 || Number(value.desired_duration_minutes) > 240) errors.push("desired_duration_minutes must be 10-240");
  for (const field of clientFields.filter((key) => !["desired_duration_minutes", "organisation_type"].includes(key))) {
    if (typeof value[field] === "string" && value[field].length > 800) errors.push(`${field} is too long`);
  }
  return { valid: errors.length === 0, errors };
}

export function normaliseBriefing(value) {
  const supplied=(field)=>String(value[field]??"").trim();
  const modes=Array.isArray(value.transport_modes)?value.transport_modes:value.transport_modes?[value.transport_modes]:[];
  return {organisation_name:supplied("organisation_name"),organisation_type:supplied("organisation_type"),attraction_type:value.organisation_type==="attraction"?supplied("attraction_type"):"not_applicable",destination:supplied("destination"),engagement_problem:supplied("engagement_problem"),target_audience:supplied("target_audience"),visitor_outcome:supplied("visitor_outcome"),desired_duration_minutes:Number(value.desired_duration_minutes),desired_tone:supplied("desired_tone"),movement_allowed:value.movement_allowed==="yes",starting_point:value.movement_allowed==="yes"?supplied("starting_point"):"not_applicable",transport_modes:value.movement_allowed==="yes"?modes:[],available_resources:supplied("resources_and_constraints"),constraints:supplied("resources_and_constraints"),business_objective:"Not supplied — infer cautiously and label as an assumption.",priority_interests:"Not supplied — recommend from external evidence and label as a recommendation.",accessibility_requirements:"Apply inclusive defaults: keyboard access, readable contrast, plain language and no colour-only meaning; record unknowns.",success_indicator:"Not supplied — propose a measurable indicator and label as a recommendation.",inference_note:"Only the explicit client fields were supplied. Weather relevance and research-tool selection are Researcher decisions; all strategy beyond these fields is an agent inference or recommendation."};
}
