export const productTypes = ["treasure_hunt", "interactive_timeline"];
export const agentOrder = ["researcher", "designer", "maker", "communicator", "manager"];

const required = {
  researcher: ["research_question", "opportunity_diagnosis", "audience_needs", "business_needs", "tool_decisions", "source_queries", "evidence_items", "experience_opportunities", "constraints", "unknowns", "research_brief"],
  designer: ["selected_product", "selection_rationale", "design_goal", "experience_concept", "visitor_journey", "information_architecture", "interaction_specification", "required_evidence_ids", "content_requirements", "visual_direction", "accessibility_requirements", "functional_requirements", "acceptance_criteria", "known_tradeoffs"],
  maker: ["product_type", "product_title", "implementation_summary", "files", "implemented_features", "evidence_trace", "usage_instructions", "acceptance_check", "known_limitations", "build_status"],
  communicator: ["value_proposition", "audience_message", "experience_name_and_tagline", "visitor_touchpoints", "channel_plan", "launch_sequence", "ready_to_use_copy", "engagement_metrics", "communication_risks"],
  manager: ["decision", "validation_checks", "issues", "executive_summary", "operational_plan", "launch_conditions", "success_metrics", "risks", "future_improvements"]
};

export function validateHandoff(stage, output, cumulative = {}) {
  const errors = [];
  if (!output || typeof output !== "object") return { valid: false, errors: ["Output must be an object"] };
  for (const field of required[stage] ?? []) if (!(field in output)) errors.push(`${stage}.${field} is required`);
  if (stage === "researcher") {
    if (!output.source_queries?.some((query) => query.source_query_id&&query.tool&&query.queried_at&&query.result_count>=0)) errors.push("Researcher must record a live external query");
    if (!output.source_queries?.some((query) => query.tool === "search_places")) errors.push("Researcher must ground the attraction with Google Places");
    if ((output.evidence_items?.length ?? 0) < 2) errors.push("Researcher requires at least two evidence items");
    const queryIds=new Set(output.source_queries?.map(query=>query.source_query_id)??[]);
    if (!output.evidence_items?.every((item) => item.entity_id&&item.source_url&&queryIds.has(item.source_query_id))) errors.push("Every evidence item must trace to a recorded source query");
  }
  if (stage === "designer") {
    if (!productTypes.includes(output.selected_product)) errors.push("Designer selected an invalid product");
    const evidenceIds=new Set(cumulative.researcher?.evidence_items?.map((item)=>item.entity_id)??[]);
    if (!output.required_evidence_ids?.every((id)=>evidenceIds.has(id))) errors.push("Designer referenced evidence IDs not supplied by Researcher");
  }
  if (stage === "maker") {
    if (output.product_type !== cumulative.designer?.selected_product) errors.push("Maker changed the selected product");
    if (!output.files?.html || !output.files?.css || !output.files?.javascript) errors.push("Maker must deliver HTML, CSS and JavaScript");
    if (output.build_status !== "ready") errors.push("Maker build is not ready");
  }
  if (stage === "manager" && !["approved", "revision_required", "rejected"].includes(output.decision)) errors.push("Manager decision is invalid");
  return { valid: errors.length === 0, errors };
}
