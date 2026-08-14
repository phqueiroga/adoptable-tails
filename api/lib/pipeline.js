import {agents} from "../../agents/definitions.js";
import {validateHandoff} from "../../src/contracts.js";
import {sanitiseMakerFiles, validateMakerFiles} from "../../src/code-validator.js";
import {callResearcherWithTools, callStructured, createUsageTracker} from "./anthropic.js";
import {externalToolDefinitions, executeExternalTool} from "./external-tools.js";
import {saveRun} from "./storage.js";

const terminal = new Set(["approved", "revision_required", "rejected", "failed"]);
const makerSummary = (maker = {}) => ({
  product_type: maker.product_type,
  product_title: maker.product_title,
  implementation_summary: maker.implementation_summary,
  implemented_features: maker.implemented_features,
  evidence_trace: maker.evidence_trace,
  usage_instructions: maker.usage_instructions,
  acceptance_check: maker.acceptance_check,
  known_limitations: maker.known_limitations,
  build_status: maker.build_status,
});
export const heroMedia=(toolCalls=[])=>{for(const call of toolCalls){const place=call.result?.results?.find(item=>item.photo);if(place)return{hero_photo:{...place.photo,place_id:place.place_id,place_name:place.label}}}return{hero_photo:null}};

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
      const r = await callResearcherWithTools(agents.researcher, run.briefing, externalToolDefinitions, executeExternalTool, tracker);
      const v = validateHandoff("researcher", r.output);
      if (!v.valid) throw new Error(`RESEARCHER_CONTRACT:${v.errors.join("|")}`);
      run.tool_calls = r.tool_calls;
      run.outputs.researcher = r.output;
      run.media = heroMedia(r.tool_calls);
      run.handoffs.push({from: "researcher", to: "designer", validated: true, at: new Date().toISOString()});
      run.status = "designing";
      await saveRun(run);
      return run;
    }
    if (run.status === "designing") {
      const r = await callStructured(agents.designer, {briefing: run.briefing, researcher: run.outputs.researcher, available_media:run.media}, tracker);
      const v = validateHandoff("designer", r.output, run.outputs);
      if (!v.valid) throw new Error(`DESIGNER_CONTRACT:${v.errors.join("|")}`);
      run.outputs.designer = r.output;
      run.handoffs.push({from: "designer", to: "maker", validated: true, at: new Date().toISOString()});
      run.status = "building";
      await saveRun(run);
      return run;
    }
    if (run.status === "building") {
      const input = {briefing: run.briefing, researcher_evidence: run.outputs.researcher.evidence_items, available_media:run.media, designer: run.outputs.designer};
      let r, v, code, errors = [];
      for (let attempt = 0; attempt < 2; attempt++) {
        r = await callStructured(agents.maker, attempt === 0 ? input : {
          ...input,
          previous_attempt_rejected: errors,
          correction_instruction: "Rebuild a smaller version from scratch with semantic HTML, CSS and JavaScript. Avoid storage, network requests, parent-window access, Function, eval and inline event attributes.",
        }, tracker);
        r.output.files = sanitiseMakerFiles(r.output.files);
        v = validateHandoff("maker", r.output, {...run.outputs,media:run.media});
        code = validateMakerFiles(r.output.files);
        errors = [...v.errors, ...code.errors];
        if (!errors.length) break;
        run.validations.maker_attempts = attempt + 1;
      }
      run.validations.code = code;
      if (errors.length) throw new Error(`MAKER_VALIDATION:${errors.join("|")}`);
      run.outputs.maker = r.output;
      run.handoffs.push({from: "maker", to: "communicator", validated: true, at: new Date().toISOString()});
      run.status = "communicating";
      await saveRun(run);
      return run;
    }
    if (run.status === "communicating") {
      const r = await callStructured(agents.communicator, {briefing: run.briefing, designer: run.outputs.designer, maker: makerSummary(run.outputs.maker)}, tracker);
      const v = validateHandoff("communicator", r.output, run.outputs);
      if (!v.valid) throw new Error(`COMMUNICATOR_CONTRACT:${v.errors.join("|")}`);
      run.outputs.communicator = r.output;
      run.handoffs.push({from: "communicator", to: "manager", validated: true, at: new Date().toISOString()});
      run.status = "reviewing";
      await saveRun(run);
      return run;
    }
    if (run.status === "reviewing") {
      const r = await callStructured(agents.manager, {briefing: run.briefing, tool_calls: run.tool_calls, available_media:run.media, researcher:{research_brief:run.outputs.researcher.research_brief,evidence_items:run.outputs.researcher.evidence_items}, designer: run.outputs.designer, maker: makerSummary(run.outputs.maker), code_validation: run.validations.code, communicator: run.outputs.communicator, handoffs: run.handoffs}, tracker);
      const v = validateHandoff("manager", r.output, run.outputs);
      if (!v.valid) throw new Error(`MANAGER_CONTRACT:${v.errors.join("|")}`);
      run.outputs.manager = r.output;
      run.status = r.output.decision;
      run.completed_at = new Date().toISOString();
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
