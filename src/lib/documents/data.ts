import type { DocumentInstance } from "./types";

export const PLACEHOLDER_DOCUMENTS: DocumentInstance[] = [
  // ── BHFT: DCB0129 — Approved ────────────────────────────────────────────
  {
    id: "doc-001",
    docTypeId: "dcb0129",
    docTypeName: "DCB0129 Clinical Risk Management Plan",
    docTypeCategory: "clinical-safety",
    orgId: "org-bhft",
    orgName: "Berkshire Healthcare NHS FT",
    activeModules: ["mental-health"],
    status: "approved",
    version: 3,
    createdBy: "Sarah M.",
    createdAt: "2024-10-01",
    updatedAt: "2025-01-14",
    sections: [
      {
        id: "s-001-1",
        title: "Clinical Risk Management System",
        factKeys: ["clinical.intended_purpose", "clinical.risk_classification"],
        promptId: "prompt-crms-intro",
        status: "approved",
        generatedAt: "2025-01-10",
        generatedBy: "Sarah M.",
        approvedBy: "Sarah M.",
        approvedAt: "2025-01-14",
        approvedContent: null,
        generatedContent: `The Anathem ambient voice transcription system is subject to a Clinical Risk Management System (CRMS) established in accordance with DCB0129 v2.4. This document constitutes the Clinical Risk Management Plan (CRMP) for deployment at Berkshire Healthcare NHS Foundation Trust.

The CRMS defines the processes by which clinical risks associated with the software are systematically identified, evaluated, controlled, and monitored throughout the deployment lifecycle. This plan applies to the Anathem Mental Health module deployed within Berkshire Healthcare's community mental health services.

The system is classified as Class IIa Software as a Medical Device (SaMD) under MHRA guidance. Its intended purpose is ambient voice transcription and clinical documentation support for NHS clinicians. The system does not make clinical decisions and does not directly interact with patients.`,
      },
      {
        id: "s-001-2",
        title: "Hazard Identification",
        factKeys: ["clinical.patient_safety_impact", "clinical.intended_purpose"],
        promptId: "prompt-hazard-id",
        status: "approved",
        generatedAt: "2025-01-10",
        generatedBy: "Sarah M.",
        approvedBy: "James R.",
        approvedAt: "2025-01-14",
        approvedContent: null,
        generatedContent: `Hazards were identified through structured review of the system's intended purpose, clinical workflows, and failure modes analysis conducted with clinical stakeholders at Berkshire Healthcare.

H-001: Transcription inaccuracy in clinical record. The system may produce transcriptions containing errors that, if not identified by the reviewing clinician, could result in inaccurate entries in the patient's electronic health record. Severity: Major (3). Probability: Remote (2). Initial Risk Level: Low.

H-002: System unavailability during clinical consultation. Network or service disruption may prevent use of the transcription service. The clinician reverts to manual documentation. Severity: Minor (2). Probability: Remote (2). Initial Risk Level: Negligible.

H-003: Inappropriate disclosure of sensitive clinical audio. Misconfiguration or security failure could result in unauthorised access to session audio or transcripts containing sensitive mental health information. Severity: Major (3). Probability: Improbable (1). Initial Risk Level: Low.`,
      },
      {
        id: "s-001-3",
        title: "Risk Estimation and Evaluation",
        factKeys: ["clinical.patient_safety_impact", "data.encryption_at_rest", "data.encryption_in_transit"],
        promptId: "prompt-risk-estimation",
        status: "approved",
        generatedAt: "2025-01-10",
        generatedBy: "Sarah M.",
        approvedBy: "Sarah M.",
        approvedAt: "2025-01-14",
        approvedContent: null,
        generatedContent: `Risk estimation has been conducted using the DCB0129 risk matrix. All identified hazards have been assessed against the Berkshire Healthcare clinical risk acceptance criteria.

H-001 has been assessed at Low risk prior to control. The mandatory clinician review step built into all Anathem workflows provides the primary control. No transcription is applied to the patient record without explicit clinician confirmation. This risk level is deemed acceptable with controls in place.

H-002 has been assessed at Negligible risk. Business continuity measures are in place and the clinical impact of temporary unavailability is limited to minor delay in documentation completion.

H-003 has been assessed at Low risk. Technical controls (AES-256 encryption at rest, TLS 1.3 in transit, role-based access control, processing exclusively within UK Azure infrastructure) reduce the probability to Improbable. Annual CREST-accredited penetration testing provides ongoing assurance.`,
      },
      {
        id: "s-001-4",
        title: "Risk Control Measures",
        factKeys: ["data.encryption_at_rest", "data.encryption_in_transit", "technical.hosting_provider"],
        promptId: "prompt-risk-controls",
        status: "approved",
        generatedAt: "2025-01-10",
        generatedBy: "Sarah M.",
        approvedBy: "James R.",
        approvedAt: "2025-01-14",
        approvedContent: null,
        generatedContent: `The following risk control measures have been implemented and verified:

C-001 (mitigates H-001): Mandatory clinician review and confirmation before any transcript is applied to the EHR. The system enforces a 'confirm before save' workflow with no bypass mechanism available to end users.

C-002 (mitigates H-001): Transcription confidence scoring is surfaced to the clinician. Segments with low confidence are visually highlighted for additional review attention.

C-003 (mitigates H-002): Offline-capable documentation fallback is provided within the clinical workflow. Clinicians are trained to proceed with manual documentation if the system is unavailable. This is covered in the deployment training programme.

C-004 (mitigates H-003): All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Processing occurs exclusively within UK-based Microsoft Azure infrastructure (UK South, with UK West failover). Access is restricted to authenticated clinicians via role-based access control with multi-factor authentication.`,
      },
      {
        id: "s-001-5",
        title: "Residual Risk Assessment",
        factKeys: ["clinical.patient_safety_impact"],
        promptId: "prompt-residual-risk",
        status: "approved",
        generatedAt: "2025-01-10",
        generatedBy: "Sarah M.",
        approvedBy: "Sarah M.",
        approvedAt: "2025-01-14",
        approvedContent: null,
        generatedContent: `Following implementation of risk control measures, the residual risk profile is as follows:

H-001 Residual Risk: Low. The combination of mandatory clinician review and confidence-score highlighting effectively mitigates the risk of undetected transcription errors entering the clinical record. The residual probability has been reduced from Remote to Improbable. This residual risk is accepted by the Clinical Risk Owner at Berkshire Healthcare NHS Foundation Trust.

H-002 Residual Risk: Negligible. No material change from initial assessment. The availability of manual documentation fallback ensures continuity of care.

H-003 Residual Risk: Low. Technical controls reduce the probability of inappropriate disclosure to Improbable. This residual risk is accepted by the Clinical Risk Owner, subject to annual penetration test results remaining satisfactory.

The overall residual risk profile is considered acceptable for deployment within Berkshire Healthcare NHS Foundation Trust's mental health services.`,
      },
      {
        id: "s-001-6",
        title: "Summary and Clinical Risk Acceptance",
        factKeys: ["clinical.intended_purpose", "clinical.risk_classification"],
        promptId: "prompt-crmp-summary",
        status: "approved",
        generatedAt: "2025-01-10",
        generatedBy: "Sarah M.",
        approvedBy: "Sarah M.",
        approvedAt: "2025-01-14",
        approvedContent: null,
        generatedContent: `The clinical risk assessment for the Anathem ambient voice transcription system at Berkshire Healthcare NHS Foundation Trust concludes that all identified hazards have been assessed, appropriate risk control measures applied, and residual risks determined to be at an acceptable level in accordance with DCB0129 v2.4.

This Clinical Risk Management Plan is accepted by the Clinical Risk Owner for Berkshire Healthcare NHS Foundation Trust. The system is approved for deployment within the Trust's community mental health services for the Mental Health module.

This document will be reviewed:
— Following any material change to the system software or infrastructure
— Following any significant clinical incident or near-miss involving the system
— At the scheduled annual review date (January 2026)
— If the Trust's active modules change

Document version: 3. Approved: 14 January 2025.`,
      },
    ],
  },

  // ── BHFT: IG Questionnaire — Submitted ──────────────────────────────────
  {
    id: "doc-002",
    docTypeId: "ig-questionnaire",
    docTypeName: "NHS IG Questionnaire",
    docTypeCategory: "ig",
    orgId: "org-bhft",
    orgName: "Berkshire Healthcare NHS FT",
    activeModules: ["mental-health"],
    status: "submitted",
    version: 2,
    createdBy: "James R.",
    createdAt: "2024-11-01",
    updatedAt: "2024-12-15",
    sections: [
      {
        id: "s-002-1",
        title: "Data Controller and Processor Details",
        factKeys: ["legal.ico_registration", "technical.hosting_provider"],
        promptId: "prompt-ig-controller",
        status: "approved",
        generatedAt: "2024-11-20",
        generatedBy: "James R.",
        approvedBy: "James R.",
        approvedAt: "2024-12-01",
        approvedContent: null,
        generatedContent: `Anathem Ltd acts as a Data Processor on behalf of Berkshire Healthcare NHS Foundation Trust (Data Controller) in relation to the processing of patient transcription data within the Anathem AVT system.

Anathem Ltd is registered with the Information Commissioner's Office under registration number ZA123456. The company is incorporated in England and Wales.

All data processing is performed within the United Kingdom. No data is transferred to third countries. Processing infrastructure is hosted on Microsoft Azure UK South, operated by Microsoft Limited (a sub-processor), under an appropriate Data Processing Agreement with standard contractual protections.`,
      },
      {
        id: "s-002-2",
        title: "Personal Data Processed",
        factKeys: ["clinical.intended_purpose", "data.processing_location"],
        promptId: "prompt-ig-data-processed",
        status: "approved",
        generatedAt: "2024-11-20",
        generatedBy: "James R.",
        approvedBy: "James R.",
        approvedAt: "2024-12-01",
        approvedContent: null,
        generatedContent: `The Anathem system processes the following categories of personal data on behalf of Berkshire Healthcare NHS Foundation Trust:

— Patient identifiers (NHS number, name, date of birth): processed to associate transcriptions with the correct patient record within the Trust's EHR system.
— Audio recordings of clinical consultations: processed transiently in real-time for transcription; audio is not retained beyond the active session.
— Transcribed clinical text: retained as part of the patient's electronic health record for the data retention period.
— Clinician identifiers: processed for audit trail, access control, and attribution purposes.

No special category data beyond clinical health data is processed. The lawful basis for processing is Article 9(2)(h) UK GDPR (medical diagnosis and treatment) and Schedule 1 Part 1(2) of the Data Protection Act 2018.`,
      },
      {
        id: "s-002-3",
        title: "Data Retention",
        factKeys: ["data.retention_period", "data.processing_location"],
        promptId: "prompt-ig-retention",
        status: "approved",
        generatedAt: "2024-11-20",
        generatedBy: "James R.",
        approvedBy: "James R.",
        approvedAt: "2024-12-01",
        approvedContent: null,
        generatedContent: `Patient transcription data is retained for 8 years post last patient contact, in accordance with Berkshire Healthcare NHS Foundation Trust's local data retention policy (exceeding the NHS Records Management Code of Practice 2021 minimum of 7 years for mental health records).

Data retention and deletion processes are automated, auditable, and enforced at the infrastructure level. Deletion is irreversible and logged to the system audit trail. Retention periods are configurable at the trust level by Anathem administrators, subject to approval.

All retained data is stored in encrypted form (AES-256 at rest) on Microsoft Azure UK South infrastructure. No data is retained in the United Kingdom outside of this environment.`,
      },
      {
        id: "s-002-4",
        title: "Technical Security Measures",
        factKeys: ["data.encryption_at_rest", "data.encryption_in_transit", "technical.hosting_provider", "evidence.dtac_status"],
        promptId: "prompt-ig-security",
        status: "approved",
        generatedAt: "2024-11-20",
        generatedBy: "James R.",
        approvedBy: "James R.",
        approvedAt: "2024-12-01",
        approvedContent: null,
        generatedContent: `Anathem implements the following technical and organisational security measures:

Encryption at rest: AES-256 (all stored patient data and clinical transcriptions)
Encryption in transit: TLS 1.3 (all data transmitted between client applications and Anathem infrastructure)
Hosting: Microsoft Azure UK South, ISO 27001 certified data centres
Access control: Role-based access control (RBAC) with mandatory multi-factor authentication for all clinical users
Penetration testing: Annual assessment by CREST-accredited third party; most recent assessment: Q4 2024 — no critical findings
Security monitoring: 24/7 SIEM with automated alerting and incident response procedures
Staff training: All Anathem staff with access to production data complete annual data security training to NHS IG Toolkit standard

DTAC assessment completed October 2024. Anathem is DTAC compliant across all five assessment domains.`,
      },
    ],
  },

  // ── BHFT: Clinical Safety Case — Pending Review ────────────────────────
  {
    id: "doc-003",
    docTypeId: "clinical-safety-case",
    docTypeName: "Clinical Safety Case",
    docTypeCategory: "clinical-safety",
    orgId: "org-bhft",
    orgName: "Berkshire Healthcare NHS FT",
    activeModules: ["mental-health"],
    status: "pending_review",
    version: 1,
    createdBy: "Priya K.",
    createdAt: "2025-02-01",
    updatedAt: "2025-03-05",
    sections: [
      {
        id: "s-003-1",
        title: "System Overview and Intended Use",
        factKeys: ["clinical.intended_purpose", "clinical.risk_classification", "mental-health.session_consent_method"],
        promptId: "prompt-safety-case-overview",
        status: "approved",
        generatedAt: "2025-03-01",
        generatedBy: "Priya K.",
        approvedBy: "Priya K.",
        approvedAt: "2025-03-05",
        approvedContent: null,
        generatedContent: `Anathem is a Software as a Medical Device (SaMD) providing ambient voice transcription and clinical documentation support for NHS clinicians. The system is classified as Class IIa under MHRA guidance. At Berkshire Healthcare NHS Foundation Trust, the system is deployed for the Mental Health module, supporting community mental health clinicians with session transcription and documentation.

The system is not intended to, and does not, make clinical decisions. All transcribed content requires explicit clinician review and confirmation before entry into the electronic health record. Patient verbal consent is captured by the clinician prior to each session in accordance with Berkshire Healthcare's consent procedures.`,
      },
      {
        id: "s-003-2",
        title: "Safety Claims",
        factKeys: ["clinical.patient_safety_impact"],
        promptId: "prompt-safety-claims",
        status: "draft",
        generatedAt: "2025-03-01",
        generatedBy: "Priya K.",
        approvedBy: undefined,
        approvedAt: undefined,
        approvedContent: null,
        generatedContent: `The following safety claims are made for the Anathem system as deployed at Berkshire Healthcare NHS Foundation Trust:

SC-001: The system will not apply any transcribed content to the patient's electronic health record without explicit clinician confirmation. This claim is supported by the enforced 'confirm before save' workflow and verified through integration testing.

SC-002: The system will not record or retain session audio beyond the duration of the active transcription session. This claim is supported by the system's data flow architecture and verified through technical audit.

SC-003: Access to patient transcription data is restricted to authenticated and authorised clinical staff of Berkshire Healthcare NHS Foundation Trust. This claim is supported by role-based access control and verified through penetration testing.`,
      },
      {
        id: "s-003-3",
        title: "Hazard Log Reference",
        factKeys: ["clinical.patient_safety_impact"],
        promptId: "prompt-hazard-log-ref",
        status: "draft",
        generatedAt: "2025-03-01",
        generatedBy: "Priya K.",
        approvedBy: undefined,
        approvedAt: undefined,
        approvedContent: null,
        generatedContent: `The Hazard Log for the Anathem system is maintained in accordance with DCB0129 Clinical Risk Management. The live hazard log is accessible to the Berkshire Healthcare Clinical Risk Owner via the Anathem Governance Platform and is updated following any system change or clinical incident.

Three hazards were identified in the initial hazard analysis (ref. DCB0129 CRMP v3, January 2025): transcription inaccuracy (H-001), system unavailability (H-002), and inappropriate data disclosure (H-003). All hazards have been assessed, risk controls applied, and residual risks accepted by the Clinical Risk Owner. No hazards are currently assessed above Low risk level.`,
      },
    ],
  },

  // ── OXLEAS: DCB0129 — Stale ────────────────────────────────────────────
  {
    id: "doc-004",
    docTypeId: "dcb0129",
    docTypeName: "DCB0129 Clinical Risk Management Plan",
    docTypeCategory: "clinical-safety",
    orgId: "org-oxleas",
    orgName: "Oxleas NHS FT",
    activeModules: ["mental-health", "neurodevelopmental"],
    status: "stale",
    version: 2,
    createdBy: "James R.",
    createdAt: "2024-11-15",
    updatedAt: "2025-03-10",
    staleFactKey: "data.retention_period",
    staleFactChangedAt: "2025-03-10",
    sections: [
      {
        id: "s-004-1",
        title: "Clinical Risk Management System",
        factKeys: ["clinical.intended_purpose", "clinical.risk_classification"],
        promptId: "prompt-crms-intro",
        status: "approved",
        generatedAt: "2024-12-01",
        generatedBy: "James R.",
        approvedBy: "James R.",
        approvedAt: "2024-12-10",
        approvedContent: null,
        generatedContent: `Clinical Risk Management Plan for Oxleas NHS Foundation Trust, covering the Mental Health and Neurodevelopmental modules of the Anathem ambient voice transcription system. Established in accordance with DCB0129 v2.4.`,
      },
      {
        id: "s-004-2",
        title: "Data Handling and Retention",
        factKeys: ["data.retention_period", "data.processing_location"],
        promptId: "prompt-data-handling",
        status: "approved",
        generatedAt: "2024-12-01",
        generatedBy: "James R.",
        approvedBy: "James R.",
        approvedAt: "2024-12-10",
        approvedContent: null,
        generatedContent: `Patient data is retained for 8 years post last patient contact. This section references the global data retention fact which has since been updated and requires review.`,
      },
    ],
  },

  // ── OXLEAS: IG Questionnaire — Approved ────────────────────────────────
  {
    id: "doc-005",
    docTypeId: "ig-questionnaire",
    docTypeName: "NHS IG Questionnaire",
    docTypeCategory: "ig",
    orgId: "org-oxleas",
    orgName: "Oxleas NHS FT",
    activeModules: ["mental-health", "neurodevelopmental"],
    status: "approved",
    version: 1,
    createdBy: "Priya K.",
    createdAt: "2025-01-05",
    updatedAt: "2025-02-01",
    sections: [
      {
        id: "s-005-1",
        title: "Data Controller and Processor Details",
        factKeys: ["legal.ico_registration"],
        promptId: "prompt-ig-controller",
        status: "approved",
        generatedAt: "2025-01-20",
        generatedBy: "Priya K.",
        approvedBy: "Priya K.",
        approvedAt: "2025-02-01",
        approvedContent: null,
        generatedContent: `Anathem Ltd (ICO reg. ZA123456) acts as Data Processor for Oxleas NHS Foundation Trust. All processing within the UK on Azure UK South infrastructure.`,
      },
    ],
  },

  // ── CNWL: DCB0129 — Draft ──────────────────────────────────────────────
  {
    id: "doc-006",
    docTypeId: "dcb0129",
    docTypeName: "DCB0129 Clinical Risk Management Plan",
    docTypeCategory: "clinical-safety",
    orgId: "org-cnwl",
    orgName: "Central and North West London NHS FT",
    activeModules: ["mental-health", "police"],
    status: "draft",
    version: 1,
    createdBy: "Sarah M.",
    createdAt: "2025-03-01",
    updatedAt: "2025-03-20",
    sections: [
      {
        id: "s-006-1",
        title: "Clinical Risk Management System",
        factKeys: ["clinical.intended_purpose"],
        promptId: "prompt-crms-intro",
        status: "draft",
        generatedAt: "2025-03-20",
        generatedBy: "Sarah M.",
        approvedContent: null,
        generatedContent: `Clinical Risk Management Plan for Central and North West London NHS Foundation Trust, covering the Mental Health and Police modules. In draft — sections require review before submission.`,
      },
    ],
  },

  // ── CNWL: NHSE AVT Registry Submission — Pending Review ────────────────
  {
    id: "doc-007",
    docTypeId: "nhse-avt",
    docTypeName: "NHSE AVT Registry Submission",
    docTypeCategory: "nhse",
    orgId: "org-cnwl",
    orgName: "Central and North West London NHS FT",
    activeModules: ["mental-health"],
    status: "pending_review",
    version: 1,
    createdBy: "James R.",
    createdAt: "2025-02-10",
    updatedAt: "2025-03-15",
    sections: [
      {
        id: "s-007-1",
        title: "Product Overview",
        factKeys: ["clinical.intended_purpose", "clinical.risk_classification", "evidence.nhse_pilot"],
        promptId: "prompt-nhse-overview",
        status: "approved",
        generatedAt: "2025-03-10",
        generatedBy: "James R.",
        approvedBy: "James R.",
        approvedAt: "2025-03-15",
        approvedContent: null,
        generatedContent: `Anathem provides ambient voice transcription and clinical documentation support for NHS clinicians. Class IIa SaMD. Participated in the NHSE AVT Registry Pilot (Q3 2024, 12 trusts).`,
      },
      {
        id: "s-007-2",
        title: "Clinical Evidence Base",
        factKeys: ["evidence.nhse_pilot", "evidence.dtac_status"],
        promptId: "prompt-nhse-evidence",
        status: "draft",
        generatedAt: "2025-03-10",
        generatedBy: "James R.",
        approvedContent: null,
        generatedContent: `Evidence base includes: NHSE AVT Registry Pilot (Q3 2024), DTAC compliance (October 2024). Additional clinical validation studies are ongoing.`,
      },
    ],
  },

  // ── Avon: IG Questionnaire — Submitted ────────────────────────────────
  {
    id: "doc-008",
    docTypeId: "ig-questionnaire",
    docTypeName: "NHS IG Questionnaire",
    docTypeCategory: "ig",
    orgId: "org-avon",
    orgName: "Avon and Wiltshire MHP NHS Trust",
    activeModules: ["mental-health"],
    status: "submitted",
    version: 3,
    createdBy: "Priya K.",
    createdAt: "2024-09-15",
    updatedAt: "2025-01-10",
    sections: [],
  },

  // ── Avon: DCB0160 — Approved ───────────────────────────────────────────
  {
    id: "doc-009",
    docTypeId: "dcb0160",
    docTypeName: "DCB0160 Deployment Assurance",
    docTypeCategory: "clinical-safety",
    orgId: "org-avon",
    orgName: "Avon and Wiltshire MHP NHS Trust",
    activeModules: ["mental-health"],
    status: "approved",
    version: 2,
    createdBy: "Sarah M.",
    createdAt: "2024-10-01",
    updatedAt: "2025-01-20",
    sections: [],
  },

  // ── Mersey: DCB0129 — Stale ────────────────────────────────────────────
  {
    id: "doc-010",
    docTypeId: "dcb0129",
    docTypeName: "DCB0129 Clinical Risk Management Plan",
    docTypeCategory: "clinical-safety",
    orgId: "org-mersey",
    orgName: "Mersey Care NHS FT",
    activeModules: ["mental-health", "patient-crm"],
    status: "stale",
    version: 1,
    createdBy: "James R.",
    createdAt: "2024-12-01",
    updatedAt: "2025-01-14",
    staleFactKey: "clinical.intended_purpose",
    staleFactChangedAt: "2025-01-14",
    sections: [],
  },

  // ── Mersey: IG Questionnaire — Draft ──────────────────────────────────
  {
    id: "doc-011",
    docTypeId: "ig-questionnaire",
    docTypeName: "NHS IG Questionnaire",
    docTypeCategory: "ig",
    orgId: "org-mersey",
    orgName: "Mersey Care NHS FT",
    activeModules: ["mental-health", "patient-crm"],
    status: "draft",
    version: 1,
    createdBy: "Priya K.",
    createdAt: "2025-03-15",
    updatedAt: "2025-03-28",
    sections: [],
  },

  // ── Norfolk: DCB0129 — Submitted ───────────────────────────────────────
  {
    id: "doc-012",
    docTypeId: "dcb0129",
    docTypeName: "DCB0129 Clinical Risk Management Plan",
    docTypeCategory: "clinical-safety",
    orgId: "org-norfolk",
    orgName: "Norfolk and Suffolk NHS FT",
    activeModules: ["mental-health"],
    status: "submitted",
    version: 1,
    createdBy: "Sarah M.",
    createdAt: "2024-11-01",
    updatedAt: "2024-12-20",
    sections: [],
  },

  // ── Norfolk: DCB0160 — Submitted ───────────────────────────────────────
  {
    id: "doc-013",
    docTypeId: "dcb0160",
    docTypeName: "DCB0160 Deployment Assurance",
    docTypeCategory: "clinical-safety",
    orgId: "org-norfolk",
    orgName: "Norfolk and Suffolk NHS FT",
    activeModules: ["mental-health"],
    status: "submitted",
    version: 1,
    createdBy: "Sarah M.",
    createdAt: "2024-11-01",
    updatedAt: "2024-12-20",
    sections: [],
  },
];
