import type { RubricCategoryKey } from "../schemas/report";
export const CATEGORY_POLICY_VERSION = "category-signals-v3.1.2";
// These are evidence questions, not a technology checklist. Role/stage modules
// define appropriate scope; every true answer requires a quoted source fact.
export const CATEGORY_SIGNALS: Record<RubricCategoryKey, readonly string[]> = {
  impact: [
    "A concrete project/process purpose or problem is identified (a named event search, classifier or returns workflow counts; a career goal alone does not).",
    "The document describes actual delivered behavior, functionality or process steps, beyond a tool/initiative name.",
    "The described work was implemented, configured, run or delivered, with scope attributable to the candidate or their stated team.",
    "The document describes checking a named behavior, a correction, or a relevant observed effect. At first-job/Junior, filter tests or stated manual scenarios count without detailed results or business metrics.",
    "An observed qualitative/quantitative outcome, correction or useful iteration is explicitly stated; do not invent success from running something.",
  ],
  ownership: [
    "The candidate describes a concrete personal action or responsibility in the relevant work; a duty list or title alone does not count.",
    "Personal scope is bounded (own component/tasks/configuration versus supplied/mentor/team work when applicable); it need not mention borrowed material if none is stated.",
    "The candidate personally implemented/configured/designed relevant work beyond merely copying or running supplied material; no-code and authored QA/process work count.",
    "A personal decision, correction or response to checking/feedback is described; do not assign someone else's action to the candidate.",
    "The extent of control appropriate to the selected stage is explicit: supported task ownership can count early; Mid requires independent delivery; Senior area responsibility; Lead direction through others. Merely entering a key and running a supplied lesson/template does not establish control of a task or its logic.",
  ],
  credibility: [
    "Relevant tools, methods or professional practices are explicitly named; Other/QA/no-code do not need programming technologies.",
    "The candidate actually applied a relevant method or ran/configured a relevant project, including supplied/guided work.",
    "Concrete implementation/configuration/practice details are attributable to the candidate's actual work beyond a stack list or supplied material. Names of steps in a copied template and entering a key are not enough; a personally configured rule, authored artifact or specifically performed scenario/practice is needed. Performing a scenario does not imply authoring it.",
    "Specific checking/verification is reported with its subject (filter tests, lesson questions, manual scenarios or code review count); performing checks does not prove authorship.",
    "A check, error, feedback or review is linked to a specific correction, result or iterative improvement in the relevant work.",
  ],
  architecture: [
    "Connected project/process steps or responsibilities are described; a technology list alone is not a flow.",
    "A specific interface, data, module or work-responsibility boundary is stated, appropriate to the role/stage.",
    "A concrete control/validation/testability/risk rule is described (QA risk design and Other process closure rules count).",
    "Handling of an error, conflict, duplicate, failure or relevant constraint is described; a safeguard name alone does not establish operational routing.",
    "A stated decision or correction is explicitly linked to a reason, check, constraint or observed problem; do not invent a rationale.",
  ],
  collaboration: [
    "A mentor, peer, team, product stakeholder or user explicitly participated in the relevant project/work (configuration/review counts; merely listing a contact does not).",
    "The topic of collaboration/review/alignment is named, such as an API contract, validation, duplicate rule or incorrect responses; no detailed feedback transcript is required early.",
    "The candidate's action and the other participant's involvement can be distinguished from the document; shared review/agreement counts without pretending sole authorship.",
    "A change or delivery through others is explicitly linked to feedback/alignment/coordination, appropriate to stage; mere attendance does not establish an effect.",
    "A concrete shared artifact, interface agreement, code review, acceptance condition, runbook review or repeated review cycle is described.",
  ],
  clarity: [
    "The role or career goal is explicit, independently of whether it is supported by the work.",
    "Relevant project/work entries are identifiable separately from courses/tools/general claims; one clear entry is enough.",
    "Described actions are attributable to the candidate/team/mentor using explicit wording, including daily tool use; do not require implementation for this communication check.",
    "Behavior, execution and checks/outcomes can be distinguished where present; a clear statement that checks/results are not described also counts. Ignore protected personal details.",
    "Scope, attribution or limits are explicit (guided/local work, no described project/checks, commercial scope or employer/time period); clarity is not the amount of experience.",
  ],
};
export const SIGNAL_POLICY = `# Evidence signals
Return five independent booleans per category in the supplied order, each with verbatim source quotations and IDs when true, evidence=[] when false. Missing/ambiguous evidence means false, not absent skill. Apply identical predicates to PL, EN and mixed sources. Do not choose a band, number or hiring decision. A source may support several signals only through the specific facts it states. Do not infer successful testing, scenario authorship, deployment, human routing or independence from a label.
Identify distinct document-specific concerns. minor: clarification/exposure detail without undermining the target evidence. important: missing/unclear core evidence for the selected goal after checking the whole CV. critical: explicit material contradiction or severe source-supported barrier, not absence of a higher level. Preserve material concerns; code caps points rather than suppressing severity.`;
export const SCOPE_POLICY = `# Document scope classification
Choose the highest scope directly established for ROLE-RELEVANT work, with a quote of actual activity/responsibility. Ignore title, years and target as scope proof. unclear: no concrete relevant project/work execution, only tools/claims/duties. educational_project: explicit course/tutorial/learning/first-job project work that was implemented/run/checked, without broader professional scope; an actual project is necessary, a certificate is not. supported_tasks: delivered tasks explicitly under support. independent_delivery: independent delivery of a bounded feature or workflow with concrete work/checks. area_tradeoffs: explicit ownership of a significant area/application/problem AND a stated choice/constraint/trade-off AND checks/outcomes; do not infer this from a single feature or Senior title. direction_through_others: explicit direction/coordination plus attributable work delivered/reviewed through others against an agreed goal, not merely peer discussion; people management is unnecessary.
A learning, portfolio or first-job personal/team project remains educational scope even when independently implemented and reviewed with a peer. In explicit first-job context, independent implementation of a personal project is not independent_delivery. That broader scope needs explicit responsibility for delivering or maintaining a solution for actual users, a client or an operating organization beyond the learning/portfolio setting. This is a scope distinction, not a requirement for commercial employment: volunteer, open-source and noncommercial operational responsibility may establish broader scope when stated. Do not assign Mid merely because a beginner implemented their own feature. Nontechnical prior leadership does not establish technical seniority for a new technical role. If adjacent broader scopes cannot be distinguished, choose the lower directly evidenced scope rather than guessing a higher label. Scope describes the document, not verified competence.`;
