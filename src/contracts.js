export const productTypes = ["treasure_hunt", "interactive_timeline"];
export const agentOrder = ["researcher", "designer", "maker", "communicator", "manager"];

const required = {
  researcher: ["research_question", "opportunity_diagnosis", "tool_decisions", "source_queries", "evidence_items", "unknowns", "research_brief"],
  designer: ["selected_product", "selection_rationale", "why_visit_now", "signature_moment", "supporting_moments", "experience_concept", "navigation_sections", "interaction_specification", "gamification_mechanics", "reward_strategy", "required_evidence_ids", "visual_direction", "acceptance_criteria"],
  maker: ["product_type", "product_title", "implementation_summary", "files", "implemented_features", "known_limitations", "build_status"],
  communicator: ["value_proposition", "audience_message", "experience_name_and_tagline", "visitor_touchpoints", "launch_sequence", "ready_to_use_copy", "communication_risks"],
  manager: ["decision", "validation_checks", "issues", "executive_summary", "launch_conditions", "risks"]
};

export function validateHandoff(stage, output, cumulative = {}) {
  const errors = [];
  if (!output || typeof output !== "object") return { valid: false, errors: ["Output must be an object"] };
  for (const field of required[stage] ?? []) if (!(field in output)) errors.push(`${stage}.${field} is required`);
  if (stage === "researcher") {
    if (!output.source_queries?.some((query) => query.source_query_id&&query.tool&&query.queried_at&&query.result_count>=0)) errors.push("Researcher must record a live external query");
    if (!output.source_queries?.some((query) => query.tool === "search_places")) errors.push("Researcher must ground the attraction with Google Places");
    if ((output.evidence_items?.length ?? 0) < 4) errors.push("Researcher requires at least four evidence items for the visitor microsite");
    const queryIds=new Set(output.source_queries?.map(query=>query.source_query_id)??[]);
    if (!output.evidence_items?.every((item) => item.entity_id&&item.source_url&&queryIds.has(item.source_query_id))) errors.push("Every evidence item must trace to a recorded source query");
  }
  if (stage === "designer") {
    if (!productTypes.includes(output.selected_product)) errors.push("Designer selected an invalid product");
    const evidenceIds=new Set(cumulative.researcher?.evidence_items?.map((item)=>item.entity_id)??[]);
    if (!output.required_evidence_ids?.every((id)=>evidenceIds.has(id))) errors.push("Designer referenced evidence IDs not supplied by Researcher");
    if ((output.navigation_sections?.length??0)<3) errors.push("Designer must define Discover, Experience and Reward navigation areas");
    if ((output.interaction_specification?.length??0)<4) errors.push("Designer must specify four interactive moments");
    if (!output.why_visit_now?.trim() || !output.signature_moment?.trim() || (output.supporting_moments?.length??0)<2) errors.push("Designer must define a compelling reason to visit now, signature moment and two supporting moments");
    if (output.reward_strategy?.type==="physical_proposal"&&output.reward_strategy?.operational_status!=="proposal_requires_approval") errors.push("Physical rewards must require organisation approval");
    const missions=Array.isArray(output.missions)?output.missions:[];
    if (missions.length<4) errors.push("Designer must declare four missions the platform can render and check");
    else if (!missions.slice(0,4).every((mission)=>mission?.question?.trim()&&mission?.answer?.trim()&&mission?.hint?.trim()&&mission?.title?.trim())) errors.push("Every mission needs a title, a question, a single correct answer and a hint");
    else if (missions.slice(0,4).some((mission)=>mission.answer.trim().length>60)) errors.push("Mission answers must be short and checkable (at most 60 characters), not open-ended reflections");
  }
  if (stage === "maker") {
    if (output.product_type !== cumulative.designer?.selected_product) errors.push("Maker changed the selected product");
    if (!output.files?.html || !output.files?.css || !output.files?.javascript) errors.push("Maker must deliver HTML, CSS and JavaScript");
    if (output.build_status !== "ready") errors.push("Maker build is not ready");
    if (cumulative.media?.hero_photo && (!output.files?.html?.includes("{{HERO_IMAGE}}") || !output.files?.html?.includes("{{HERO_ATTRIBUTION}}"))) errors.push("Maker must place the supplied hero image and attribution tokens");
    if (!output.files?.html?.includes("{{REWARD_BADGE}}")) errors.push("Maker must place the {{REWARD_BADGE}} token in the Reward view");
    if (!/<header[\s>]/i.test(output.files?.html||"") || !/<nav[\s>]/i.test(output.files?.html||"") || ((output.files?.html||"").match(/<section[\s>]/gi)?.length??0)<3) errors.push("Maker must deliver a rich microsite with a hero, navigation and three content sections");
    if (output.product_type === "interactive_timeline" && !/\bnext\b/i.test(output.files?.html||"")) errors.push("Timeline must include a visible Next control");
    if (!output.files?.html?.includes("{{MISSIONS}}")) errors.push("Maker must place the {{MISSIONS}} token in the Experience view instead of building its own mission mechanic");
    if (!/data-ec-reward\b/i.test(output.files?.html||"")) errors.push("Maker must mark the reward container with data-ec-reward so the platform can unlock it on completion");
  }
  if (stage === "manager" && !["approved", "revision_required", "rejected"].includes(output.decision)) errors.push("Manager decision is invalid");
  return { valid: errors.length === 0, errors };
}
