export type StepStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "blocked"
  | "not_applicable";

export interface EUStep {
  number: number;
  title: string;
  summary: string;
  what_to_do: string[];
  documents_to_review: { title: string; reference: string }[];
  documents_to_complete: string[];
  outputs: string[];
}

export const EU_STEPS: EUStep[] = [
  {
    number: 1,
    title: "Freeze the intended purpose and system boundary",
    summary: "Define exactly what the AVT device does, for whom, in which care setting, and what outputs are drafts versus medically relevant outputs.",
    what_to_do: [
      "Define each in-scope function: ambient voice capture, transcription, note generation/summarisation, document ingestion and OCR, extraction of information, SNOMED/clinical terminology coding, human review and approval, EHR integrations.",
      "Identify for whom and in which care setting each function is intended.",
      "Distinguish outputs that are merely drafts from those that are medically relevant.",
      "EU qualification/classification of software starts from intended purpose and claimed medical role.",
    ],
    documents_to_review: [
      { title: "MDR Regulation (EU) 2017/745", reference: "Scope, manufacturer obligations, Annex I, II, III, IV" },
      { title: "MDCG 2019-11 Rev.1", reference: "Qualification and classification of software" },
      { title: "MDCG 2021-24", reference: "Classification of medical devices" },
      { title: "Borderline and Classification Manual", reference: "" },
    ],
    documents_to_complete: [
      "Intended Purpose Statement",
      "Product Scope and Functional Boundary document",
      "Claims inventory",
      "In-scope / out-of-scope feature matrix",
    ],
    outputs: [
      "Signed intended purpose",
      "Approved claims list",
      "Clear module map showing what is part of the medical device",
    ],
  },
  {
    number: 2,
    title: "Confirm EU qualification and classification",
    summary: "Write the formal rationale for why the product is a medical device under MDR and what class it falls into in the EU.",
    what_to_do: [
      "Determine whether the software is only administrative support or provides information used for diagnosis or therapeutic decisions.",
      "Assess whether SNOMED coding output influences clinical interpretation, triage, reimbursement-linked care pathways, or downstream decisions — this affects whether a Class I argument holds.",
      "Document module-by-module classification rationale.",
      "Produce a decision log for any out-of-scope functionality.",
    ],
    documents_to_review: [
      { title: "MDCG 2019-11 Rev.1", reference: "Qualification and classification of software" },
      { title: "MDCG 2021-24", reference: "Classification of medical devices" },
      { title: "Borderline and Classification Manual", reference: "" },
    ],
    documents_to_complete: [
      "Qualification and Classification Memo",
      "Rule 11 analysis",
      "Module-by-module classification rationale",
      "Decision log for any out-of-scope functionality",
    ],
    outputs: [
      "Signed EU classification memo",
      "Final decision: Class I self-certified or notified-body route required",
    ],
  },
  {
    number: 3,
    title: "Set up the legal manufacturer, PRRC, and EU representation model",
    summary: "Confirm the legal manufacturer, whether you are established in the EU, and whether you need an authorised representative.",
    what_to_do: [
      "Confirm the legal manufacturer identity.",
      "Determine whether Anathem is established in the EU.",
      "If non-EU manufacturer, contract an authorised representative for EU market access.",
      "Appoint a Person Responsible for Regulatory Compliance (PRRC).",
      "Map importer and distributor roles if applicable.",
    ],
    documents_to_review: [
      { title: "MDR Article 10 and Article 11", reference: "" },
      { title: "MDCG 2019-7 Rev.1", reference: "PRRC guidance" },
      { title: "MDCG 2022-16", reference: "Authorised representatives" },
    ],
    documents_to_complete: [
      "Manufacturer details record",
      "PRRC appointment record",
      "Authorised Representative agreement (if non-EU)",
      "Importer/distributor role map (if applicable)",
    ],
    outputs: [
      "Confirmed EU legal manufacturer model",
      "PRRC appointed",
      "Authorised representative contracted if manufacturer is outside the EU",
    ],
  },
  {
    number: 4,
    title: "Build the quality management and design-control system",
    summary: "Set up the QMS that governs design, release, supplier control, CAPA, complaints, PMS, document control, and change control.",
    what_to_do: [
      "Establish a Quality Manual or QMS overview.",
      "Document design and development procedures.",
      "Implement document control, change control, and supplier management.",
      "Create CAPA, complaint handling, and release procedures.",
      "Ensure QMS covers risk management, clinical evaluation, and PMS obligations under MDR Article 10.",
    ],
    documents_to_review: [
      { title: "MDR Article 10", reference: "Manufacturer obligations" },
      { title: "Manufacturers factsheet", reference: "" },
      { title: "MDCG guidance hub", reference: "Supporting documents" },
    ],
    documents_to_complete: [
      "Quality Manual or QMS overview",
      "Design and development procedure",
      "Document control procedure",
      "Change control procedure",
      "Supplier management procedure",
      "CAPA procedure",
      "Complaint handling procedure",
      "Release procedure",
    ],
    outputs: [
      "Operational QMS",
      "Controlled design records",
      "Approved release and change governance",
    ],
  },
  {
    number: 5,
    title: "Create the Annex I safety-and-performance compliance map",
    summary: "Map the product to the General Safety and Performance Requirements (GSPRs) in Annex I of the MDR.",
    what_to_do: [
      "Work through every GSPR in MDR Annex I and assess applicability.",
      "For each applicable requirement, identify the evidence that demonstrates conformity.",
      "Build a cross-reference index linking each GSPR to its evidence source.",
      "This is the backbone of the technical file and one of the core EU deliverables.",
    ],
    documents_to_review: [
      { title: "MDR Annex I", reference: "General Safety and Performance Requirements" },
      { title: "Cybersecurity guidance", reference: "Annex I expectations" },
      { title: "AI Act interplay guidance", reference: "If AI models are used" },
    ],
    documents_to_complete: [
      "GSPR checklist / conformity matrix",
      "Evidence cross-reference index",
    ],
    outputs: [
      "Signed GSPR matrix with evidence links for every applicable requirement",
    ],
  },
  {
    number: 6,
    title: "Build the risk-management file for the AVT workflow",
    summary: "Develop a full risk file for the combined workflow: mobile capture, ambient speech, OCR, extraction, coding, user review, integration.",
    what_to_do: [
      "Identify key hazards: missed/hallucinated transcript content, wrong patient/encounter, OCR extraction errors, inaccurate SNOMED coding, source confusion between spoken content and document content, over-trust in draft outputs, unsafe downstream use without review, mobile-device privacy/security failures.",
      "Develop benefit-risk analysis for each significant hazard.",
      "Document risk controls and verify their effectiveness.",
      "Produce a residual risk acceptability statement.",
    ],
    documents_to_review: [
      { title: "MDR Annex I", reference: "Risk management obligations" },
      { title: "MDCG 2019-16 Rev.1", reference: "Cybersecurity guidance" },
      { title: "AI Act interplay guidance", reference: "Where AI risks exist" },
    ],
    documents_to_complete: [
      "Risk Management Plan",
      "Hazard Analysis / Hazard Log",
      "Benefit-risk analysis",
      "Risk control verification records",
      "Residual risk acceptability statement",
    ],
    outputs: [
      "Approved risk-management file",
      "Hazard log with mitigations and test evidence",
    ],
  },
  {
    number: 7,
    title: "Build the software lifecycle and verification package",
    summary: "Document the software lifecycle for the full AVT product and every major module: mobile capture, transcription, OCR, extraction, terminology coding, integrations, audit trail.",
    what_to_do: [
      "Define Software Development Plan covering all major modules.",
      "Produce Software Requirements Specification and Architecture/Design Description.",
      "Build traceability matrix linking requirements to risks and tests.",
      "Document Verification Plan, verification reports, Validation Plan, and validation report.",
      "Maintain defect/anomaly log and change-impact assessment template.",
    ],
    documents_to_review: [
      { title: "MDR Annex II", reference: "Technical documentation requirements" },
      { title: "MDCG 2020-3 Rev.1", reference: "Significant changes to software" },
    ],
    documents_to_complete: [
      "Software Development Plan",
      "Software Requirements Specification",
      "Architecture / Design Description",
      "Traceability matrix",
      "Verification Plan",
      "Verification reports",
      "Validation Plan",
      "Validation report",
      "Defect / anomaly log",
      "Change-impact assessment template",
    ],
    outputs: [
      "Controlled software design history",
      "Requirements-to-risk-to-test traceability",
      "Released software evidence pack",
    ],
  },
  {
    number: 8,
    title: "Build the clinical/performance evaluation package",
    summary: "Produce a clinical evaluation showing the device achieves its intended purpose safely and with adequate clinical benefit/performance.",
    what_to_do: [
      "Validate transcript accuracy in realistic clinical settings.",
      "Assess speaker separation/attribution if relevant.",
      "Measure OCR performance on expected document types.",
      "Validate extraction accuracy and SNOMED coding accuracy with safe failure behaviour.",
      "Evaluate effectiveness of human review in catching mistakes.",
      "Document known limitations: poor audio, noisy rooms, poor scans, abbreviations, accents, specialty language.",
    ],
    documents_to_review: [
      { title: "MDCG 2020-1", reference: "Clinical evaluation of medical device software" },
      { title: "MDR Annex XIV", reference: "Clinical evaluation obligations" },
      { title: "MDCG 2020-13", reference: "CER structure template" },
    ],
    documents_to_complete: [
      "Clinical Evaluation Plan",
      "Clinical Evaluation Report",
      "Performance validation protocols",
      "Performance validation reports",
      "Literature review and appraisal",
      "Equivalence rationale (if any)",
      "Known limitations statement",
    ],
    outputs: [
      "Signed CEP",
      "Signed CER",
      "Evidence that the product performs as claimed for transcription, OCR, extraction, and coding",
    ],
  },
  {
    number: 9,
    title: "Build the usability and human-oversight package",
    summary: "For this AVT workflow, human oversight is a core risk control — not just UX polish. The product must require review and approval before information is committed or relied on clinically.",
    what_to_do: [
      "Define review-and-approval gate before extracted facts, coding outputs, or transcripts are filed or exported.",
      "Conduct usability engineering including use specification and user interface risk analysis.",
      "Run summative usability study.",
      "Document the human oversight policy and review-and-approval workflow SOP.",
      "Address AI Act interplay requirements for human oversight where AI is involved.",
    ],
    documents_to_review: [
      { title: "MDR Annex I", reference: "Usability and information requirements" },
      { title: "AI Act interplay guidance", reference: "Human oversight expectations" },
    ],
    documents_to_complete: [
      "Usability Engineering Plan",
      "Use specification",
      "User interface risk analysis",
      "Summative usability study",
      "Human oversight policy",
      "Review-and-approval workflow SOP",
    ],
    outputs: [
      "Usability file",
      "Defined review gate before filing/exporting/coding outputs",
      "Evidence that users can detect and correct errors safely",
    ],
  },
  {
    number: 10,
    title: "Build the cybersecurity and mobile-device security file",
    summary: "Cover both general MDSW security and mobile-specific threats for this mobile-phone-enabled ambient voice product.",
    what_to_do: [
      "Address mobile-specific threats: local storage of sensitive data, insecure device state, account/session hijack, microphone permissions misuse, upload/export leakage.",
      "Cover cloud/API dependencies, audit logging, and tamper resistance.",
      "Conduct threat modelling covering mobile, cloud, OCR, extraction, coding, and access control.",
      "Plan vulnerability management, logging/monitoring, and business continuity.",
    ],
    documents_to_review: [
      { title: "MDCG 2019-16 Rev.1", reference: "Cybersecurity guidance" },
      { title: "MDR Annex I", reference: "Security requirements" },
    ],
    documents_to_complete: [
      "Cybersecurity Risk Assessment",
      "Threat model",
      "Security architecture",
      "Pen test / security assessment report",
      "Vulnerability management procedure",
      "Logging/monitoring specification",
      "Business continuity / backup / recovery plan",
    ],
    outputs: [
      "Approved cybersecurity file",
      "Threat model covering mobile, cloud, OCR, extraction, coding, and access control",
      "Security test evidence",
    ],
  },
  {
    number: 11,
    title: "Build the privacy and data-protection pack",
    summary: "An AVT product processing clinical conversations, documents, extracted facts, and SNOMED coding will process health data (special-category personal data under GDPR).",
    what_to_do: [
      "Identify lawful basis and Article 9 condition for processing special-category health data.",
      "Conduct a DPIA where risk is likely high.",
      "Document the controller/processor matrix including all third-party processors.",
      "Assess international transfer obligations if data leaves the EEA.",
      "Define data retention and deletion policy.",
    ],
    documents_to_review: [
      { title: "GDPR Article 9", reference: "Special-category data guidance" },
      { title: "EDPB general GDPR guidance hub", reference: "" },
    ],
    documents_to_complete: [
      "DPIA",
      "Record of Processing Activities",
      "Privacy notice",
      "Lawful basis analysis",
      "Article 9 condition analysis",
      "Controller/processor matrix",
      "Data retention and deletion policy",
      "International transfer assessment (if relevant)",
    ],
    outputs: [
      "Approved DPIA",
      "Published privacy notice",
      "Signed processor agreements and transfer controls where needed",
    ],
  },
  {
    number: 12,
    title: "Build the technical documentation file under Annex II and Annex III",
    summary: "This is the central EU dossier. Annex II covers technical documentation; Annex III covers PMS technical documentation.",
    what_to_do: [
      "Compile all technical documentation under a single controlled index.",
      "Ensure the dossier covers device description, intended purpose, GSPR matrix, design and manufacturing information, risk-management file, V&V evidence, clinical evaluation, labelling, and PMS documentation.",
      "For Class I devices, prepare for self-declaration; for higher classes, prepare for notified-body submission.",
    ],
    documents_to_review: [
      { title: "MDR Annex II", reference: "Technical documentation" },
      { title: "MDR Annex III", reference: "PMS technical documentation" },
      { title: "Class I and manufacturer factsheets", reference: "" },
    ],
    documents_to_complete: [
      "Technical Documentation Index",
      "Device description and specification",
      "Intended purpose and claims section",
      "GSPR matrix",
      "Design and manufacturing information",
      "Risk-management file",
      "Verification and validation evidence",
      "Clinical evaluation file",
      "Labelling/IFU",
      "PMS documentation",
    ],
    outputs: [
      "Complete technical file ready for self-declaration or notified-body review",
    ],
  },
  {
    number: 13,
    title: "Build labelling, IFU, language, and claims-control materials",
    summary: "Prepare the labelling and instructions for use, and localise as needed for each EU market.",
    what_to_do: [
      "Draft IFU explicitly describing: intended users and settings, what the product does and does not do, that transcripts/extractions/codes are subject to user review, document/audio quality limitations, supported mobile devices, contraindications or excluded workflows, interoperability assumptions.",
      "Build claims-approval file covering website, sales, and demo materials.",
      "Map language requirements by target Member State.",
    ],
    documents_to_review: [
      { title: "MDR Annex I Chapter III", reference: "Information requirements" },
      { title: "MDR language requirements tables", reference: "" },
    ],
    documents_to_complete: [
      "Labelling",
      "Instructions for Use (IFU)",
      "Website / sales / demo claims approval file",
      "Language matrix by target Member State",
    ],
    outputs: [
      "Approved label + IFU set",
      "Country language plan",
      "Claims-control signoff",
    ],
  },
  {
    number: 14,
    title: "Build PMS, PMCF, complaints, and vigilance processes",
    summary: "Before launch, set up post-market surveillance and decide whether PMCF is needed.",
    what_to_do: [
      "Define PMS plan tracking: correction rate on transcripts, extraction override rate, coding override rate, wrong-patient/wrong-document events, user-review completion rate, safety complaints linked to missed or hallucinated content.",
      "Decide whether Post-Market Clinical Follow-up (PMCF) is required and document the rationale.",
      "Set up complaint handling, vigilance, and trend reporting processes.",
    ],
    documents_to_review: [
      { title: "MDR Annex III", reference: "PMS technical documentation" },
      { title: "MDCG 2019-15 Rev.1", reference: "PMCF on Class I devices" },
    ],
    documents_to_complete: [
      "PMS Plan",
      "PMCF rationale / PMCF Plan (if needed)",
      "Complaint handling SOP",
      "Vigilance SOP",
      "Trend reporting process",
      "CAPA procedure",
    ],
    outputs: [
      "Approved PMS plan",
      "PMCF decision and documentation",
      "Complaint/vigilance workflow ready before launch",
    ],
  },
  {
    number: 15,
    title: "Do EU economic-operator and device registration in EUDAMED",
    summary: "Register the relevant actors and devices in EUDAMED. Non-EU manufacturers need an active authorised representative to register.",
    what_to_do: [
      "Register actor(s) in EUDAMED: manufacturer, authorised representative, importer as applicable.",
      "Submit UDI/device information including Basic UDI-DI and UDI-DI data.",
      "Upload declaration on information security responsibilities.",
      "Provide PRRC information and mandate summary document if non-EU manufacturer.",
    ],
    documents_to_review: [
      { title: "EUDAMED actor registration module guidance", reference: "" },
      { title: "UDI/device registration page and UDI overview", reference: "" },
    ],
    documents_to_complete: [
      "Actor registration package",
      "Declaration on information security responsibilities",
      "Mandate summary document (if non-EU manufacturer)",
      "PRRC information",
      "Basic UDI-DI / UDI-DI data",
      "Device registration information",
    ],
    outputs: [
      "SRN (Single Registration Number)",
      "Registered manufacturer / AR / importer as applicable",
      "Device UDI registration in EUDAMED",
    ],
  },
  {
    number: 16,
    title: "Prepare the conformity-assessment route and CE marking",
    summary: "If the product remains plain Class I, self-declare conformity, draw up the EU Declaration of Conformity, and affix the CE mark. If classification is higher, move into notified-body conformity assessment.",
    what_to_do: [
      "Confirm the conformity-assessment route based on final classification.",
      "For Class I: draft and sign the EU Declaration of Conformity; control CE mark artwork.",
      "For higher class or special Class I route: prepare and submit notified-body application pack.",
      "Ensure all Annex II technical documentation is complete and controlled before signing the DoC.",
    ],
    documents_to_review: [
      { title: "MDR Annex IV", reference: "Declaration of conformity" },
      { title: "Notified body overview", reference: "If classification requires it" },
    ],
    documents_to_complete: [
      "EU Declaration of Conformity",
      "CE marking artwork/control",
      "Notified body application pack (only if classification requires it)",
    ],
    outputs: [
      "Signed EU Declaration of Conformity",
      "CE mark lawfully applied",
      "NB certificate (if applicable)",
    ],
  },
];

export const STATUS_LABELS: Record<StepStatus, string> = {
  not_started:    "Not started",
  in_progress:    "In progress",
  complete:       "Complete",
  blocked:        "Blocked",
  not_applicable: "N/A",
};

export const STATUS_COLOURS: Record<StepStatus, string> = {
  not_started:    "bg-slate-100 text-slate-500",
  in_progress:    "bg-blue-100 text-blue-700",
  complete:       "bg-green-100 text-green-700",
  blocked:        "bg-red-100 text-red-700",
  not_applicable: "bg-slate-50 text-slate-400",
};

export const STATUS_DOT: Record<StepStatus, string> = {
  not_started:    "bg-slate-300",
  in_progress:    "bg-blue-500",
  complete:       "bg-green-500",
  blocked:        "bg-red-500",
  not_applicable: "bg-slate-200",
};
