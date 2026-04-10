import type { IngestionJob, ExtractedQuestion } from "./types";

// ── Jobs ─────────────────────────────────────────────────────────────────────

export const PLACEHOLDER_INGESTION_JOBS: IngestionJob[] = [
  {
    id: "job-001",
    filename: "Leeds_Teaching_Hospitals_IG_Questionnaire_v4.pdf",
    documentType: "NHS IG Questionnaire",
    orgId: "org-leeds",
    orgName: "Leeds Teaching Hospitals NHS Trust",
    status: "review",
    uploadedAt: "2025-03-18T09:12:00Z",
    processedAt: "2025-03-18T09:15:34Z",
    uploadedBy: "Priya K.",
    totalQuestions: 12,
    draftedCount: 12,
    approvedCount: 7,
  },
  {
    id: "job-002",
    filename: "KingsCollege_Procurement_Response_2025.docx",
    documentType: "Procurement Response",
    orgId: "org-kch",
    orgName: "King's College Hospital NHS FT",
    status: "complete",
    uploadedAt: "2025-03-10T14:00:00Z",
    processedAt: "2025-03-10T14:03:12Z",
    uploadedBy: "James R.",
    totalQuestions: 9,
    draftedCount: 9,
    approvedCount: 9,
  },
  {
    id: "job-003",
    filename: "Manchester_NHSE_AVT_Registry_Addendum.pdf",
    documentType: "NHSE AVT Registry",
    orgId: "org-mft",
    orgName: "Manchester University NHS FT",
    status: "mapping",
    uploadedAt: "2025-03-20T11:45:00Z",
    processedAt: "2025-03-20T11:47:00Z",
    uploadedBy: "Sarah M.",
    totalQuestions: 15,
    draftedCount: 6,
    approvedCount: 0,
  },
  {
    id: "job-004",
    filename: "Sheffield_ClinicalSafety_Supplemental_Q.pdf",
    documentType: "Clinical Safety Supplement",
    orgId: "org-sth",
    orgName: "Sheffield Teaching Hospitals NHS FT",
    status: "failed",
    uploadedAt: "2025-03-19T16:22:00Z",
    uploadedBy: "James R.",
    totalQuestions: 0,
    draftedCount: 0,
    approvedCount: 0,
    failureReason: "Document could not be parsed — scanned PDF without OCR layer. Please upload a text-based PDF or DOCX.",
  },
  {
    id: "job-005",
    filename: "Oxleas_NHS_FT_IG_v2_Supplemental.docx",
    documentType: "NHS IG Questionnaire",
    orgId: "org-oxleas",
    orgName: "Oxleas NHS FT",
    status: "processing",
    uploadedAt: "2025-03-21T08:50:00Z",
    uploadedBy: "Priya K.",
    totalQuestions: 0,
    draftedCount: 0,
    approvedCount: 0,
  },
];

// ── Extracted questions for job-001 (Leeds IG Questionnaire — in review) ─────

export const PLACEHOLDER_QUESTIONS: Record<string, ExtractedQuestion[]> = {
  "job-001": [
    {
      id: "q-001-01",
      jobId: "job-001",
      index: 0,
      sectionLabel: "Section 1: Data Controller Responsibilities",
      questionRef: "Q1.1",
      questionText:
        "Who is the named Data Controller for the AI-assisted documentation product, and what is their legal basis for processing clinical data under UK GDPR Article 6 and Article 9?",
      status: "approved",
      mappedFactKeys: ["data.controller_entity", "data.lawful_basis_article6", "data.lawful_basis_article9"],
      mappedFactValues: {
        "data.controller_entity": "The individual NHS Trust acts as Data Controller for patient data processed within its environment. Anathem Ltd acts as Data Processor.",
        "data.lawful_basis_article6": "Article 6(1)(e) — processing necessary for the performance of a task carried out in the public interest.",
        "data.lawful_basis_article9": "Article 9(2)(h) — processing necessary for the purposes of preventive or occupational medicine, medical diagnosis, and provision of health care.",
      },
      promptKey: "ig-data-controller",
      draftAnswer:
        "The NHS Trust is the Data Controller for all patient data processed in connection with the Anathem ambient voice technology. Anathem Ltd operates as a Data Processor under a Data Processing Agreement. The lawful basis for processing under UK GDPR Article 6 is Article 6(1)(e) — processing necessary for the performance of a task in the public interest. Special category data (clinical recordings) is processed under Article 9(2)(h), which covers medical diagnosis and the provision of health care or treatment.",
      approvedAnswer:
        "The NHS Trust is the Data Controller for all patient data processed in connection with the Anathem ambient voice technology. Anathem Ltd operates as a Data Processor under a Data Processing Agreement. The lawful basis for processing under UK GDPR Article 6 is Article 6(1)(e) — processing necessary for the performance of a task in the public interest. Special category data (clinical recordings) is processed under Article 9(2)(h), which covers medical diagnosis and the provision of health care or treatment.",
    },
    {
      id: "q-001-02",
      jobId: "job-001",
      index: 1,
      sectionLabel: "Section 1: Data Controller Responsibilities",
      questionRef: "Q1.2",
      questionText:
        "Has a Data Protection Impact Assessment (DPIA) been completed for this technology? If yes, please provide the date of completion and confirm whether it has been reviewed by your DPO.",
      status: "approved",
      mappedFactKeys: ["data.dpia_completed", "data.dpia_date", "data.dpo_reviewed"],
      mappedFactValues: {
        "data.dpia_completed": "Yes",
        "data.dpia_date": "2024-08-14",
        "data.dpo_reviewed": "Yes — reviewed and signed off by Anathem DPO on 2024-08-21",
      },
      promptKey: "ig-data-controller",
      draftAnswer:
        "Yes, a full Data Protection Impact Assessment has been completed. The DPIA was finalised on 14 August 2024 and reviewed and signed off by Anathem's Data Protection Officer on 21 August 2024. The DPIA covers data flows, retention periods, consent mechanisms, and third-party processor relationships. It is reviewed annually and updated whenever a material change occurs to data processing activities.",
      approvedAnswer:
        "Yes, a full Data Protection Impact Assessment has been completed. The DPIA was finalised on 14 August 2024 and reviewed and signed off by Anathem's Data Protection Officer on 21 August 2024. The DPIA covers data flows, retention periods, consent mechanisms, and third-party processor relationships. It is reviewed annually and updated whenever a material change occurs to data processing activities.",
    },
    {
      id: "q-001-03",
      jobId: "job-001",
      index: 2,
      sectionLabel: "Section 2: Data Retention and Deletion",
      questionRef: "Q2.1",
      questionText:
        "What is the retention period for patient audio recordings and transcripts? How is data deletion confirmed and documented?",
      status: "approved",
      mappedFactKeys: ["data.retention_period", "data.deletion_method", "data.deletion_log"],
      mappedFactValues: {
        "data.retention_period": "7 years post last patient contact",
        "data.deletion_method": "Cryptographic erasure of AES-256 encryption keys, rendering data irrecoverable",
        "data.deletion_log": "Automated deletion events are logged in the Anathem audit trail with timestamp, record type, and confirming user",
      },
      promptKey: "ig-retention",
      draftAnswer:
        "Patient audio recordings and transcripts are retained for 7 years following the last patient contact, in line with NHS Records Management Code of Practice 2021. Deletion is performed via cryptographic erasure — the AES-256 encryption keys used to protect each recording are destroyed, rendering the underlying data irrecoverable without physical deletion of the ciphertext. Every deletion event is automatically recorded in Anathem's immutable audit log, capturing the timestamp, data category, and the identity of the system or user that triggered deletion.",
      approvedAnswer:
        "Patient audio recordings and transcripts are retained for 7 years following the last patient contact, in line with NHS Records Management Code of Practice 2021. Deletion is performed via cryptographic erasure — the AES-256 encryption keys used to protect each recording are destroyed, rendering the underlying data irrecoverable without physical deletion of the ciphertext. Every deletion event is automatically recorded in Anathem's immutable audit log, capturing the timestamp, data category, and the identity of the system or user that triggered deletion.",
    },
    {
      id: "q-001-04",
      jobId: "job-001",
      index: 3,
      sectionLabel: "Section 2: Data Retention and Deletion",
      questionRef: "Q2.2",
      questionText:
        "Does data leave the UK at any point during processing or storage? If yes, what safeguards are in place?",
      status: "approved",
      mappedFactKeys: ["data.data_residency", "data.international_transfers", "data.transfer_safeguards"],
      mappedFactValues: {
        "data.data_residency": "All data processed and stored within UK data centres (AWS eu-west-2, London region)",
        "data.international_transfers": "No international transfers of patient data",
        "data.transfer_safeguards": "N/A — no international transfers",
      },
      promptKey: "ig-data-controller",
      draftAnswer:
        "No patient data leaves the United Kingdom at any point. All processing and storage occurs within AWS eu-west-2 (London region). Anathem does not transfer patient data internationally and has no sub-processors outside the UK. Model inference is performed on UK infrastructure. No adequacy decisions or Standard Contractual Clauses are required.",
      approvedAnswer:
        "No patient data leaves the United Kingdom at any point. All processing and storage occurs within AWS eu-west-2 (London region). Anathem does not transfer patient data internationally and has no sub-processors outside the UK. Model inference is performed on UK infrastructure. No adequacy decisions or Standard Contractual Clauses are required.",
    },
    {
      id: "q-001-05",
      jobId: "job-001",
      index: 4,
      sectionLabel: "Section 3: Security Controls",
      questionRef: "Q3.1",
      questionText:
        "What encryption standards are applied to data at rest and in transit? Please specify protocols and key management approach.",
      status: "approved",
      mappedFactKeys: ["security.encryption_at_rest", "security.encryption_in_transit", "security.key_management"],
      mappedFactValues: {
        "security.encryption_at_rest": "AES-256",
        "security.encryption_in_transit": "TLS 1.3",
        "security.key_management": "AWS KMS with automatic annual key rotation; keys are unique per customer tenant",
      },
      promptKey: "ig-security",
      draftAnswer:
        "Data at rest is encrypted using AES-256. Data in transit is protected by TLS 1.3. Encryption keys are managed via AWS Key Management Service (KMS) with automatic annual key rotation. Each NHS Trust tenant has its own dedicated encryption keys, ensuring cryptographic isolation between organisations. Anathem staff cannot access tenant data without an explicit, logged break-glass procedure.",
      approvedAnswer:
        "Data at rest is encrypted using AES-256. Data in transit is protected by TLS 1.3. Encryption keys are managed via AWS Key Management Service (KMS) with automatic annual key rotation. Each NHS Trust tenant has its own dedicated encryption keys, ensuring cryptographic isolation between organisations. Anathem staff cannot access tenant data without an explicit, logged break-glass procedure.",
    },
    {
      id: "q-001-06",
      jobId: "job-001",
      index: 5,
      sectionLabel: "Section 3: Security Controls",
      questionRef: "Q3.2",
      questionText:
        "Is the product covered by a recognised security certification or standard (e.g. ISO 27001, Cyber Essentials Plus, NHS DSPT)? Please provide certificate numbers and expiry dates.",
      status: "approved",
      mappedFactKeys: ["security.iso27001_status", "security.cyber_essentials_status", "security.dspt_status"],
      mappedFactValues: {
        "security.iso27001_status": "ISO 27001:2022 certified — certificate GB-2024-ISO27001-04412, valid until 2026-09-30",
        "security.cyber_essentials_status": "Cyber Essentials Plus — certificate CE-2024-07821, valid until 2025-10-15",
        "security.dspt_status": "NHS DSPT — Standards Met, submission date 2024-06-30",
      },
      promptKey: "ig-security",
      draftAnswer:
        "Anathem holds the following security certifications: ISO 27001:2022 (certificate GB-2024-ISO27001-04412, valid to 30 September 2026); Cyber Essentials Plus (certificate CE-2024-07821, valid to 15 October 2025); and NHS Data Security and Protection Toolkit (DSPT) at Standards Met level, most recently submitted 30 June 2024. Copies of current certificates are available on request.",
      approvedAnswer:
        "Anathem holds the following security certifications: ISO 27001:2022 (certificate GB-2024-ISO27001-04412, valid to 30 September 2026); Cyber Essentials Plus (certificate CE-2024-07821, valid to 15 October 2025); and NHS Data Security and Protection Toolkit (DSPT) at Standards Met level, most recently submitted 30 June 2024. Copies of current certificates are available on request.",
    },
    {
      id: "q-001-07",
      jobId: "job-001",
      index: 6,
      sectionLabel: "Section 4: Clinical Safety",
      questionRef: "Q4.1",
      questionText:
        "Has a Clinical Safety Case been produced in accordance with DCB0129? Who is the named Clinical Safety Officer and what are their qualifications?",
      status: "drafted",
      mappedFactKeys: ["clinical.dcb0129_status", "clinical.cso_name", "clinical.cso_qualifications"],
      mappedFactValues: {
        "clinical.dcb0129_status": "DCB0129 Clinical Safety Case — v2.1, approved 2024-11-15",
        "clinical.cso_name": "Dr. Helen Marsh",
        "clinical.cso_qualifications": "MBChB, MRCGP — registered with GMC (7654321), clinical informatics lead",
      },
      promptKey: "ig-data-controller",
      draftAnswer:
        "Yes. A Clinical Safety Case has been produced in accordance with DCB0129 (Clinical Risk Management: its Application in the Manufacture of Health IT Systems). The current version is v2.1, approved on 15 November 2024. The named Clinical Safety Officer is Dr. Helen Marsh (MBChB, MRCGP), GMC registration number 7654321. Dr. Marsh holds the role of Clinical Informatics Lead at Anathem and is responsible for maintaining the hazard log, overseeing residual risk acceptance, and signing off safety case updates.",
    },
    {
      id: "q-001-08",
      jobId: "job-001",
      index: 7,
      sectionLabel: "Section 4: Clinical Safety",
      questionRef: "Q4.2",
      questionText:
        "What is the highest residual clinical risk rating in your current hazard log, and how is this mitigated?",
      status: "drafted",
      mappedFactKeys: ["clinical.highest_residual_risk", "clinical.risk_mitigation_summary"],
      mappedFactValues: {
        "clinical.highest_residual_risk": "3 — Moderate (likelihood: Unlikely; severity: Significant)",
        "clinical.risk_mitigation_summary": "Mandatory clinician review of all AI-generated notes before they enter the patient record; real-time accuracy confidence indicators; clinician override at all stages",
      },
      promptKey: "ig-data-controller",
      draftAnswer:
        "The highest residual risk rating in the current DCB0129 hazard log is 3 (Moderate), reflecting a combination of Unlikely likelihood and Significant severity. This relates to the hazard of a clinically inaccurate transcription being inadvertently accepted into a patient record. Mitigations include: mandatory clinician review of all AI-generated notes before EHR entry; real-time confidence indicators flagging low-certainty passages; structured prompts that direct clinicians to verify clinical terminology; and a complete audit trail of any note modifications. No hazard with a residual risk rating above Moderate has been accepted.",
    },
    {
      id: "q-001-09",
      jobId: "job-001",
      index: 8,
      sectionLabel: "Section 5: Transparency and Patient Rights",
      questionRef: "Q5.1",
      questionText:
        "How are patients informed that AI is being used in their clinical consultation? Is verbal consent obtained and recorded?",
      status: "drafted",
      mappedFactKeys: ["clinical.patient_notification_method", "clinical.consent_mechanism"],
      mappedFactValues: {
        "clinical.patient_notification_method": "Visual in-room signage, verbal explanation by clinician at start of consultation, and patient information leaflet available in 12 languages",
        "clinical.consent_mechanism": "Verbal opt-in recorded by clinician in Anathem system; patient may withdraw at any point and recording is immediately stopped and deleted",
      },
      promptKey: "ig-data-controller",
      draftAnswer:
        "Patients are informed of AI-assisted documentation through three mechanisms: permanent visual signage displayed in consultation rooms; a verbal explanation provided by the clinician at the start of the appointment; and a patient information leaflet available in 12 languages. Consent is obtained verbally and recorded in the Anathem system by the clinician before recording begins. Patients may withdraw consent at any point during the consultation, at which point recording is immediately stopped and any captured data is deleted. Consent status is logged and visible to the clinician throughout the session.",
    },
    {
      id: "q-001-10",
      jobId: "job-001",
      index: 9,
      sectionLabel: "Section 5: Transparency and Patient Rights",
      questionRef: "Q5.2",
      questionText:
        "What mechanisms exist for patients to access, correct, or request deletion of data held about them?",
      status: "drafted",
      mappedFactKeys: ["data.subject_access_process", "data.rectification_process", "data.erasure_process"],
      mappedFactValues: {
        "data.subject_access_process": "SAR submitted to NHS Trust IG team; Anathem provides data extract within 5 working days of Trust request",
        "data.rectification_process": "Clinician may amend transcription at any point; patient may request amendment via Trust IG team",
        "data.erasure_process": "Right to erasure fulfilled within 30 days; cryptographic erasure with audit log entry",
      },
      promptKey: "ig-retention",
      draftAnswer:
        "Subject Access Requests are submitted through the NHS Trust's existing IG team process. Upon receipt of a Trust request, Anathem provides a full data extract within 5 working days. For rectification, clinicians may amend transcriptions directly, and patients may request correction through the Trust IG team. The right to erasure is fulfilled within 30 calendar days via cryptographic erasure of the patient's encryption keys. All erasure events are recorded in Anathem's immutable audit log.",
    },
    {
      id: "q-001-11",
      jobId: "job-001",
      index: 10,
      sectionLabel: "Section 6: Third-Party Processors",
      questionRef: "Q6.1",
      questionText:
        "Please list all third-party sub-processors that have access to patient data and describe the contractual protections in place.",
      status: "drafted",
      mappedFactKeys: ["data.sub_processors", "data.dpa_in_place"],
      mappedFactValues: {
        "data.sub_processors": "AWS (infrastructure, UK region only) — no other sub-processors have access to identifiable patient data",
        "data.dpa_in_place": "Data Processing Agreement in place with AWS under AWS GDPR DPA; no patient data shared with AI model providers",
      },
      promptKey: "ig-data-controller",
      draftAnswer:
        "The only sub-processor with access to patient data is Amazon Web Services (AWS), which provides cloud infrastructure within the UK (eu-west-2, London). A Data Processing Agreement is in place with AWS under the AWS GDPR DPA. No patient data is shared with AI model providers or any other third party — model inference is performed using Anathem's own deployed models on UK infrastructure. A full list of sub-processors is maintained in Anathem's ROPA and is available on request.",
    },
    {
      id: "q-001-12",
      jobId: "job-001",
      index: 11,
      sectionLabel: "Section 6: Third-Party Processors",
      questionRef: "Q6.2",
      questionText:
        "What is the process for notifying the Trust of a data breach? What is the expected notification timeline?",
      status: "pending",
      mappedFactKeys: ["data.breach_notification_timeline", "data.breach_escalation_process"],
      mappedFactValues: {
        "data.breach_notification_timeline": "72 hours from detection to ICO; NHS Trust notified within 24 hours of Anathem becoming aware",
        "data.breach_escalation_process": "Anathem DPO notified immediately; Trust IG lead contacted by phone and email within 24 hours; written incident report within 48 hours",
      },
      promptKey: "ig-data-controller",
    },
  ],
};
