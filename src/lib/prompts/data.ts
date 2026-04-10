import type { Prompt } from "./types";

export const PLACEHOLDER_PROMPTS: Prompt[] = [
  // ── Clinical Safety ────────────────────────────────────────────────────
  {
    id: "p-001",
    promptKey: "clinical-safety.crms-intro",
    displayName: "DCB0129 — CRMS Introduction",
    purpose: "Generates the opening Clinical Risk Management System section for a DCB0129 plan, establishing the regulatory framework and scope for a specific trust deployment.",
    targetSection: "Clinical Risk Management System",
    inputFactKeys: ["clinical.intended_purpose", "clinical.risk_classification", "clinical.patient_safety_impact"],
    outputFormat: "prose",
    category: "clinical-safety",
    status: "approved",
    approvedBy: "Sarah M.",
    approvedAt: "2024-10-15",
    currentVersion: 2,
    createdBy: "James R.",
    createdAt: "2024-09-20",
    updatedAt: "2024-12-01",
    versions: [
      {
        id: "pv-001-2",
        versionNumber: 2,
        changeNotes: "Strengthened reference to DCB0129 v2.4 and added explicit 'no clinical decisions' statement following MHRA feedback.",
        createdBy: "Sarah M.",
        createdAt: "2024-12-01",
        promptText: `You are a regulatory documentation specialist writing a DCB0129 Clinical Risk Management Plan for an NHS trust.

Organisation: {{organisation.name}} (ODS: {{organisation.ods_code}})
Active modules: {{organisation.active_modules}}
Intended purpose: {{clinical.intended_purpose}}
Risk classification: {{clinical.risk_classification}}
Patient safety impact: {{clinical.patient_safety_impact}}

Write the "Clinical Risk Management System" introductory section for this trust's DCB0129 CRMP. The section must:
1. State the regulatory framework (DCB0129 v2.4) and that this document is the CRMP
2. Identify the specific trust and which Anathem modules are in scope
3. Describe the scope of the CRMS throughout the deployment lifecycle
4. State the system's risk classification and intended purpose
5. Explicitly note that the system does not make clinical decisions and does not directly interact with patients

Output: 2–3 formal paragraphs. Regulatory language. No headings. No bullet points. Maximum 300 words.
Do not include caveats about being an AI. Do not speculate beyond the facts provided.`,
      },
      {
        id: "pv-001-1",
        versionNumber: 1,
        changeNotes: "Initial version.",
        createdBy: "James R.",
        createdAt: "2024-09-20",
        promptText: `Write the Clinical Risk Management System section for a DCB0129 plan for {{organisation.name}}.

System intended purpose: {{clinical.intended_purpose}}
Risk classification: {{clinical.risk_classification}}

Describe the CRMS framework and scope for this deployment.`,
      },
    ],
  },

  {
    id: "p-002",
    promptKey: "clinical-safety.hazard-identification",
    displayName: "DCB0129 — Hazard Identification",
    purpose: "Produces the hazard identification section using structured hazard analysis. Identifies hazards relevant to the specific trust's active modules and clinical context.",
    targetSection: "Hazard Identification",
    inputFactKeys: ["clinical.intended_purpose", "clinical.patient_safety_impact", "mental-health.session_consent_method"],
    outputFormat: "structured",
    category: "clinical-safety",
    status: "approved",
    approvedBy: "James R.",
    approvedAt: "2024-10-15",
    currentVersion: 1,
    createdBy: "James R.",
    createdAt: "2024-09-20",
    updatedAt: "2024-09-20",
    versions: [
      {
        id: "pv-002-1",
        versionNumber: 1,
        changeNotes: "Initial version.",
        createdBy: "James R.",
        createdAt: "2024-09-20",
        promptText: `You are writing the hazard identification section of a DCB0129 Clinical Risk Management Plan.

Organisation: {{organisation.name}}
Active modules: {{organisation.active_modules}}
Intended purpose: {{clinical.intended_purpose}}
Patient safety impact: {{clinical.patient_safety_impact}}

Identify the clinical hazards relevant to this deployment using structured hazard analysis methodology. For each hazard provide:
— Hazard ID (H-001, H-002, etc.)
— Plain description of the hazard and its potential clinical consequence
— Initial Severity (Minor / Moderate / Major / Catastrophic)
— Initial Probability (Improbable / Remote / Occasional / Probable / Frequent)
— Initial Risk Level (Negligible / Low / Medium / High / Unacceptable)

Address hazards arising from: transcription errors entering clinical records, system unavailability during consultations, inappropriate data disclosure, consent failures, and documentation workflow failures.

Output: One paragraph per hazard (2–3 sentences each) followed by the risk metadata. Formal language. No introductory paragraph.`,
      },
    ],
  },

  {
    id: "p-003",
    promptKey: "risk-management.risk-estimation",
    displayName: "DCB0129 — Risk Estimation and Evaluation",
    purpose: "Evaluates each identified hazard using the DCB0129 risk matrix, applying the trust's acceptance criteria and noting the effect of the technical controls already in place.",
    targetSection: "Risk Estimation and Evaluation",
    inputFactKeys: ["clinical.patient_safety_impact", "data.encryption_at_rest", "data.encryption_in_transit", "technical.hosting_provider"],
    outputFormat: "prose",
    category: "risk-management",
    status: "approved",
    approvedBy: "Sarah M.",
    approvedAt: "2024-10-15",
    currentVersion: 1,
    createdBy: "Sarah M.",
    createdAt: "2024-09-25",
    updatedAt: "2024-09-25",
    versions: [
      {
        id: "pv-003-1",
        versionNumber: 1,
        changeNotes: "Initial version.",
        createdBy: "Sarah M.",
        createdAt: "2024-09-25",
        promptText: `You are writing the risk estimation and evaluation section of a DCB0129 Clinical Risk Management Plan.

Organisation: {{organisation.name}}
Encryption at rest: {{data.encryption_at_rest}}
Encryption in transit: {{data.encryption_in_transit}}
Hosting provider: {{technical.hosting_provider}}
Patient safety impact: {{clinical.patient_safety_impact}}

For each identified hazard (H-001, H-002, H-003), evaluate the risk using the DCB0129 risk matrix. For each:
— State the initial risk level and whether it falls within the trust's acceptance criteria
— Describe which technical or procedural controls affect this evaluation
— State whether the risk is considered acceptable, with or without controls

The mandatory clinician review step (confirm-before-save) is the primary control for transcription accuracy hazards. Data security controls are: {{data.encryption_at_rest}} at rest, {{data.encryption_in_transit}} in transit, hosted on {{technical.hosting_provider}}.

Output: One paragraph per hazard. Formal regulatory language. No bullet points. No headings.`,
      },
    ],
  },

  {
    id: "p-004",
    promptKey: "risk-management.risk-controls",
    displayName: "DCB0129 — Risk Control Measures",
    purpose: "Documents the specific risk control measures implemented for each identified hazard, cross-referencing hazard IDs.",
    targetSection: "Risk Control Measures",
    inputFactKeys: ["data.encryption_at_rest", "data.encryption_in_transit", "technical.hosting_provider", "technical.uptime_sla"],
    outputFormat: "structured",
    category: "risk-management",
    status: "approved",
    approvedBy: "James R.",
    approvedAt: "2024-10-15",
    currentVersion: 1,
    createdBy: "James R.",
    createdAt: "2024-09-25",
    updatedAt: "2024-09-25",
    versions: [
      {
        id: "pv-004-1",
        versionNumber: 1,
        changeNotes: "Initial version.",
        createdBy: "James R.",
        createdAt: "2024-09-25",
        promptText: `Document the risk control measures for a DCB0129 Clinical Risk Management Plan.

Encryption at rest: {{data.encryption_at_rest}}
Encryption in transit: {{data.encryption_in_transit}}
Hosting: {{technical.hosting_provider}}
Uptime SLA: {{technical.uptime_sla}}

List the risk control measures, each numbered C-001, C-002, etc. For each control:
— State which hazard(s) it mitigates (reference H-001 etc.)
— Describe the control precisely
— State whether it is technical or procedural

Controls to document:
C-001: Mandatory confirm-before-save workflow (mitigates H-001)
C-002: Transcription confidence scoring (mitigates H-001)
C-003: Manual documentation fallback (mitigates H-002)
C-004: Encryption and infrastructure controls (mitigates H-003): {{data.encryption_at_rest}} at rest, {{data.encryption_in_transit}} in transit, hosted exclusively on {{technical.hosting_provider}}, RBAC with MFA.

Output: One short paragraph per control. Formal language.`,
      },
    ],
  },

  // ── IG Questionnaire ────────────────────────────────────────────────────
  {
    id: "p-005",
    promptKey: "ig-questionnaire.data-controller",
    displayName: "IG — Data Controller and Processor Details",
    purpose: "Generates the data controller and processor section for NHS IG questionnaires, establishing the legal relationship and ICO registration.",
    targetSection: "Data Controller and Processor Details",
    inputFactKeys: ["legal.ico_registration", "technical.hosting_provider", "data.processing_location"],
    outputFormat: "prose",
    category: "ig-questionnaire",
    status: "approved",
    approvedBy: "Sarah M.",
    approvedAt: "2024-11-10",
    currentVersion: 2,
    createdBy: "Priya K.",
    createdAt: "2024-10-01",
    updatedAt: "2025-01-05",
    versions: [
      {
        id: "pv-005-2",
        versionNumber: 2,
        changeNotes: "Added sub-processor clarification for Microsoft Azure following IG lead query at BHFT.",
        createdBy: "Priya K.",
        createdAt: "2025-01-05",
        promptText: `Write the data controller and processor details section for an NHS IG questionnaire.

Organisation: {{organisation.name}}
Anathem ICO registration: {{legal.ico_registration}}
Hosting provider: {{technical.hosting_provider}}
Data processing location: {{data.processing_location}}

Write a clear, factually accurate section that:
1. Establishes Anathem Ltd as Data Processor and the NHS trust as Data Controller
2. States Anathem's ICO registration number: {{legal.ico_registration}}
3. States that all processing occurs within: {{data.processing_location}}
4. Identifies {{technical.hosting_provider}} as a sub-processor with appropriate DPA protections
5. Confirms no transfers outside the UK

Output: 2–3 concise paragraphs suitable for an NHS IG questionnaire response. Plain English with technical accuracy. No bullet points.`,
      },
      {
        id: "pv-005-1",
        versionNumber: 1,
        changeNotes: "Initial version.",
        createdBy: "Priya K.",
        createdAt: "2024-10-01",
        promptText: `Write the data controller section for {{organisation.name}} IG questionnaire.
ICO registration: {{legal.ico_registration}}
Hosting: {{technical.hosting_provider}}`,
      },
    ],
  },

  {
    id: "p-006",
    promptKey: "ig-questionnaire.data-retention",
    displayName: "IG — Data Retention",
    purpose: "Describes the data retention period, policy basis, and deletion process for NHS IG questionnaires. Automatically resolves the org-instance retention period if set.",
    targetSection: "Data Retention",
    inputFactKeys: ["data.retention_period", "data.processing_location", "data.encryption_at_rest"],
    outputFormat: "prose",
    category: "ig-questionnaire",
    status: "approved",
    approvedBy: "James R.",
    approvedAt: "2024-11-10",
    currentVersion: 1,
    createdBy: "Priya K.",
    createdAt: "2024-10-01",
    updatedAt: "2024-10-01",
    versions: [
      {
        id: "pv-006-1",
        versionNumber: 1,
        changeNotes: "Initial version.",
        createdBy: "Priya K.",
        createdAt: "2024-10-01",
        promptText: `Write the data retention section for an NHS IG questionnaire.

Organisation: {{organisation.name}}
Agreed retention period: {{data.retention_period}}
Processing location: {{data.processing_location}}
Encryption at rest: {{data.encryption_at_rest}}

Write a clear response covering:
1. The agreed data retention period ({{data.retention_period}}) and its policy basis (NHS Records Management Code of Practice 2021, or trust-specific policy if applicable)
2. That all retained data is stored in encrypted form ({{data.encryption_at_rest}}) within {{data.processing_location}}
3. That deletion processes are automated, auditable, and irreversible
4. That retention periods are configurable per trust subject to approval

Output: 2 concise paragraphs. Plain English. Accurate to the agreed retention period for this organisation.`,
      },
    ],
  },

  {
    id: "p-007",
    promptKey: "ig-questionnaire.security-measures",
    displayName: "IG — Technical Security Measures",
    purpose: "Summarises all technical and organisational security measures for IG questionnaire responses, referencing DTAC compliance and encryption standards.",
    targetSection: "Technical Security Measures",
    inputFactKeys: ["data.encryption_at_rest", "data.encryption_in_transit", "technical.hosting_provider", "evidence.dtac_status"],
    outputFormat: "structured",
    category: "ig-questionnaire",
    status: "approved",
    approvedBy: "Sarah M.",
    approvedAt: "2024-11-10",
    currentVersion: 1,
    createdBy: "Priya K.",
    createdAt: "2024-10-05",
    updatedAt: "2024-10-05",
    versions: [
      {
        id: "pv-007-1",
        versionNumber: 1,
        changeNotes: "Initial version.",
        createdBy: "Priya K.",
        createdAt: "2024-10-05",
        promptText: `Write the technical security measures section for an NHS IG questionnaire.

Encryption at rest: {{data.encryption_at_rest}}
Encryption in transit: {{data.encryption_in_transit}}
Hosting: {{technical.hosting_provider}}
DTAC status: {{evidence.dtac_status}}

List all technical and organisational security controls. Include:
— Encryption: {{data.encryption_at_rest}} at rest, {{data.encryption_in_transit}} in transit
— Hosting: {{technical.hosting_provider}} (ISO 27001 certified)
— Access control: RBAC with mandatory MFA
— Penetration testing: Annual by CREST-accredited third party
— Security monitoring: 24/7 SIEM with automated alerting
— Staff training: Annual IG Toolkit standard
— DTAC: {{evidence.dtac_status}}

Output: A structured list with a brief explanatory sentence for each control. Suitable for inclusion in an NHS IG questionnaire.`,
      },
    ],
  },

  // ── Evidence ────────────────────────────────────────────────────────────
  {
    id: "p-008",
    promptKey: "evidence.clinical-pilot-summary",
    displayName: "Evidence — Clinical Pilot Summary",
    purpose: "Summarises the NHSE AVT Registry pilot evidence for inclusion in procurement responses, clinical safety cases, and registry submissions.",
    targetSection: "Clinical Evidence Base",
    inputFactKeys: ["evidence.nhse_pilot", "evidence.dtac_status", "clinical.risk_classification"],
    outputFormat: "prose",
    category: "evidence",
    status: "approved",
    approvedBy: "James R.",
    approvedAt: "2025-01-20",
    currentVersion: 1,
    createdBy: "Sarah M.",
    createdAt: "2025-01-10",
    updatedAt: "2025-01-10",
    versions: [
      {
        id: "pv-008-1",
        versionNumber: 1,
        changeNotes: "Initial version. Created post-pilot completion.",
        createdBy: "Sarah M.",
        createdAt: "2025-01-10",
        promptText: `Write a clinical evidence summary for inclusion in regulatory and procurement documents.

NHSE pilot details: {{evidence.nhse_pilot}}
DTAC status: {{evidence.dtac_status}}
Risk classification: {{clinical.risk_classification}}

Summarise the clinical evidence base for the Anathem system, covering:
1. The NHSE AVT Registry Pilot: {{evidence.nhse_pilot}}
2. DTAC compliance: {{evidence.dtac_status}}
3. The regulatory classification context: {{clinical.risk_classification}}

Write for a clinical or procurement audience. Be factually precise. Do not overstate the strength of evidence. Do not reference studies or data not included in the facts above.

Output: 1–2 paragraphs. Formal but accessible language. 150–250 words.`,
      },
    ],
  },

  // ── AVT Registry ────────────────────────────────────────────────────────
  {
    id: "p-009",
    promptKey: "avt-registry.product-overview",
    displayName: "NHSE AVT Registry — Product Overview",
    purpose: "Generates the product overview section for NHSE AVT Registry submissions, covering intended purpose, classification, and evidence.",
    targetSection: "Product Overview",
    inputFactKeys: ["clinical.intended_purpose", "clinical.risk_classification", "evidence.nhse_pilot", "evidence.dtac_status"],
    outputFormat: "prose",
    category: "avt-registry",
    status: "suggested",
    currentVersion: 1,
    createdBy: "System (Claude)",
    createdAt: "2025-03-18",
    updatedAt: "2025-03-18",
    versions: [
      {
        id: "pv-009-1",
        versionNumber: 1,
        changeNotes: "Auto-generated by Claude when NHSE AVT Registry submission was initiated for CNWL. Requires review before use.",
        createdBy: "System (Claude)",
        createdAt: "2025-03-18",
        promptText: `You are writing the Product Overview section for an NHSE Ambient Voice Technology (AVT) Registry submission.

Intended purpose: {{clinical.intended_purpose}}
Risk classification: {{clinical.risk_classification}}
NHSE pilot: {{evidence.nhse_pilot}}
DTAC status: {{evidence.dtac_status}}

Write a product overview section covering:
1. What the product does and its intended purpose: {{clinical.intended_purpose}}
2. The regulatory classification: {{clinical.risk_classification}}
3. Participation in the NHSE AVT Registry Pilot: {{evidence.nhse_pilot}}
4. DTAC compliance status: {{evidence.dtac_status}}
5. Key clinical safety features (mandatory clinician review, no autonomous clinical decisions)

Target audience: NHSE digital health assessment team. Formal language. Factually precise.

Output: 3 paragraphs. 300–400 words. Do not speculate beyond the supplied facts.`,
      },
    ],
  },

  // ── Ingestion ───────────────────────────────────────────────────────────
  {
    id: "p-010",
    promptKey: "ingestion-mapping.question-extraction",
    displayName: "Ingestion — Question Extraction",
    purpose: "Extracts all questions and section headings from an uploaded trust document (PDF or Word), returning a structured list for mapping to knowledge base facts.",
    targetSection: "N/A — Ingestion pipeline",
    inputFactKeys: [],
    outputFormat: "structured",
    category: "ingestion-mapping",
    status: "approved",
    approvedBy: "Priya K.",
    approvedAt: "2025-02-01",
    currentVersion: 1,
    createdBy: "Priya K.",
    createdAt: "2025-01-20",
    updatedAt: "2025-01-20",
    versions: [
      {
        id: "pv-010-1",
        versionNumber: 1,
        changeNotes: "Initial version for ingestion pipeline.",
        createdBy: "Priya K.",
        createdAt: "2025-01-20",
        promptText: `You are extracting the questions and sections from an NHS trust document that Anathem must respond to.

The document text is provided below. Extract every distinct question, sub-question, and section heading that requires a written response.

For each item, return:
— item_number: sequential integer
— type: "question" | "section_heading" | "checkbox" | "table_row"
— text: the exact question or heading text as written
— context: any surrounding context that helps understand what is being asked (e.g. the section it appears in)
— estimated_fact_domains: which knowledge base domains are likely relevant ("clinical", "technical", "data", "legal", "evidence")

Return as a JSON array. Do not paraphrase. Do not skip items. Do not add commentary outside the JSON.

Document text:
{{document_text}}`,
      },
    ],
  },

  {
    id: "p-011",
    promptKey: "ingestion-drafting.answer-draft",
    displayName: "Ingestion — Draft Answer",
    purpose: "Drafts a response to a specific question extracted from an uploaded trust document, using resolved facts from the knowledge base.",
    targetSection: "N/A — Ingestion pipeline",
    inputFactKeys: ["clinical.intended_purpose", "data.retention_period", "data.processing_location"],
    outputFormat: "prose",
    category: "ingestion-drafting",
    status: "suggested",
    currentVersion: 1,
    createdBy: "System (Claude)",
    createdAt: "2025-03-22",
    updatedAt: "2025-03-22",
    versions: [
      {
        id: "pv-011-1",
        versionNumber: 1,
        changeNotes: "Auto-suggested during ingestion of Mersey Care IG pack. Fact mapping may need refinement before approval.",
        createdBy: "System (Claude)",
        createdAt: "2025-03-22",
        promptText: `You are drafting a response to a question from an NHS trust's information governance questionnaire.

Question being answered: {{question_text}}
Organisation: {{organisation.name}}

Relevant facts resolved for this organisation:
— Intended purpose: {{clinical.intended_purpose}}
— Data retention period: {{data.retention_period}}
— Processing location: {{data.processing_location}}

Draft a clear, accurate response to the question using only the facts provided above.

Rules:
— Be factually precise. Do not speculate.
— Write in the first person as Anathem ("Anathem processes…", "We retain…")
— Match the register of the question (formal for compliance questions, plain English for general enquiries)
— If the supplied facts do not fully answer the question, state what additional information is needed
— Do not include caveats about being an AI

Output: A direct answer to the question. 50–200 words depending on question complexity.`,
      },
    ],
  },

  // ── Rejected ────────────────────────────────────────────────────────────
  {
    id: "p-012",
    promptKey: "ig-questionnaire.third-party-processors",
    displayName: "IG — Third-Party Data Processors",
    purpose: "Lists third-party sub-processors used in the Anathem platform for IG questionnaire responses.",
    targetSection: "Third-Party Processors",
    inputFactKeys: ["technical.hosting_provider", "technical.ai_model"],
    outputFormat: "table",
    category: "ig-questionnaire",
    status: "rejected",
    rejectedBy: "James R.",
    rejectedAt: "2025-02-10",
    rejectionReason: "Too vague on DPA details and GDPR Article 28 compliance. Rewrite needed to include contractual basis for each sub-processor and confirm SCCs are not applicable (UK-only processing). Raise new version with legal input.",
    currentVersion: 1,
    createdBy: "System (Claude)",
    createdAt: "2025-02-05",
    updatedAt: "2025-02-10",
    versions: [
      {
        id: "pv-012-1",
        versionNumber: 1,
        changeNotes: "Auto-suggested during BHFT IG questionnaire generation.",
        createdBy: "System (Claude)",
        createdAt: "2025-02-05",
        promptText: `List the third-party data processors used by Anathem.

Hosting provider: {{technical.hosting_provider}}
AI model provider: {{technical.ai_model}}

Generate a table of sub-processors including the hosting provider and AI provider, with a brief description of the data they process and the safeguards in place.`,
      },
    ],
  },
];
