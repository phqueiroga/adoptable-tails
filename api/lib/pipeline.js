import {agents} from "../../agents/definitions.js";
import {validateHandoff} from "../../src/contracts.js";
import {sanitiseMakerFiles, validateMakerFiles} from "../../src/code-validator.js";
import {callStructured, createUsageTracker, ensureEvidenceTrace, ensureMinimumPlaceEvidence, reconcileToolQueries} from "./anthropic.js";
import {executeExternalTool} from "./external-tools.js";
import {saveRun} from "./storage.js";
import {testGeneratedPage} from "../../src/page-functional-test.js";

const terminal = new Set(["approved", "revision_required", "rejected", "failed"]);
const makerSummary = (maker = {}) => ({
  product_type: maker.product_type,
  product_title: maker.product_title,
  implementation_summary: maker.implementation_summary,
  implemented_features: maker.implemented_features,
  known_limitations: maker.known_limitations,
  build_status: maker.build_status,
});
export const heroMedia=(toolCalls=[])=>{for(const call of toolCalls){const place=call.result?.results?.find(item=>item.photo);if(place)return{hero_photo:{...place.photo,place_id:place.place_id,place_name:place.label}}}return{hero_photo:null}};
// Set only by the "revise" action in api/runs.js, and only for the run of stages it triggers —
// carries the Manager's own issues forward so the agent being redone fixes the named problem
// instead of blindly re-rolling and hoping for a different result.
export const revisionInput=(run)=>run.revision_feedback?{revision_feedback:run.revision_feedback}:{};

async function lookupAttraction(briefing) {
  const input={query:briefing.organisation_name,destination:briefing.destination,open_now:false,min_rating:0,page_size:3};
  const result=await executeExternalTool("search_places",input);
  return {id:"tool-1",name:"search_places",input,result};
}

export async function executeNextStage(run) {
  if (terminal.has(run.status)) return run;
  const tracker = createUsageTracker(run.usage);
  run.usage = tracker.state;
  run.usage_limits = tracker.limits;
  try {
    if (run.status === "queued") {
      run.status = "researching";
      await saveRun(run);
    }
    if (run.status === "researching") {
      const placeCall=await lookupAttraction(run.briefing);
      const r = await callStructured(agents.researcher, {briefing:run.briefing,google_places:{source_query_id:placeCall.id,...placeCall.result},...revisionInput(run)}, tracker);
      r.output=reconcileToolQueries(r.output,[placeCall]);
      r.output=ensureMinimumPlaceEvidence(ensureEvidenceTrace(r.output,[placeCall]),[placeCall]);
      const v = validateHandoff("researcher", r.output);
      if (!v.valid) throw new Error(`RESEARCHER_CONTRACT:${v.errors.join("|")}`);
      run.tool_calls = [placeCall];
      run.outputs.researcher = r.output;
      run.media = heroMedia(run.tool_calls);
      run.handoffs.push({from: "researcher", to: "designer", validated: true, at: new Date().toISOString()});
      run.status = "designing";
      await saveRun(run);
      return run;
    }
    if (run.status === "designing") {
      const r = await callStructured(agents.designer, {briefing: run.briefing, researcher: run.outputs.researcher, available_media:run.media, ...revisionInput(run)}, tracker);
      const v = validateHandoff("designer", r.output, run.outputs);
      if (!v.valid) throw new Error(`DESIGNER_CONTRACT:${v.errors.join("|")}`);
      run.outputs.designer = r.output;
      run.handoffs.push({from: "designer", to: "maker", validated: true, at: new Date().toISOString()});
      run.status = "building";
      await saveRun(run);
      return run;
    }
    if (run.status === "building") {
      const input = {briefing: run.briefing, researcher_evidence: run.outputs.researcher.evidence_items, available_media:run.media, designer: run.outputs.designer, ...revisionInput(run)};
      const r = await callStructured(agents.maker, input, tracker);
      r.output.files = sanitiseMakerFiles(r.output.files);
      const v = validateHandoff("maker", r.output, {...run.outputs,media:run.media});
      const code = validateMakerFiles(r.output.files);
      const functional = code.valid ? await testGeneratedPage(r.output.files, run.outputs.designer.selected_product, run.outputs.designer.missions, run.outputs.designer.visual_identity, run.outputs.designer.reward_strategy?.badge_presentable_in_person) : {valid:true,errors:[]};
      const errors = [...v.errors, ...code.errors, ...functional.errors];
      run.validations.code = code;
      run.validations.functional = functional;
      if (errors.length) throw new Error(`MAKER_VALIDATION:${errors.join("|")}`);
      run.outputs.maker = r.output;
      run.handoffs.push({from: "maker", to: "communicator", validated: true, at: new Date().toISOString()});
      run.status = "communicating";
      await saveRun(run);
      return run;
    }
    if (run.status === "communicating") {
      const r = await callStructured(agents.communicator, {briefing: run.briefing, reward_strategy:run.outputs.designer.reward_strategy, designer: run.outputs.designer, maker: makerSummary(run.outputs.maker), ...revisionInput(run)}, tracker);
      const v = validateHandoff("communicator", r.output, run.outputs);
      if (!v.valid) throw new Error(`COMMUNICATOR_CONTRACT:${v.errors.join("|")}`);
      run.outputs.communicator = r.output;
      run.handoffs.push({from: "communicator", to: "manager", validated: true, at: new Date().toISOString()});
      run.status = "reviewing";
      await saveRun(run);
      return run;
    }
    if (run.status === "reviewing") {
      const r = await callStructured(agents.manager, {briefing: run.briefing, tool_calls: run.tool_calls, available_media:run.media, researcher:{research_brief:run.outputs.researcher.research_brief,evidence_items:run.outputs.researcher.evidence_items}, designer: run.outputs.designer, maker: makerSummary(run.outputs.maker), code_validation: run.validations.code, functional_validation: run.validations.functional, communicator: run.outputs.communicator, handoffs: run.handoffs}, tracker);
      const v = validateHandoff("manager", r.output, run.outputs);
      if (!v.valid) throw new Error(`MANAGER_CONTRACT:${v.errors.join("|")}`);
      run.outputs.manager = r.output;
      run.status = r.output.decision;
      run.completed_at = new Date().toISOString();
      delete run.revision_feedback;
      await saveRun(run);
      return run;
    }
  } catch (error) {
    run.status = "failed";
    run.error = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    run.completed_at = new Date().toISOString();
    await saveRun(run);
    return run;
  }
}
