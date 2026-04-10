// ── EU MDR Template Definitions ──────────────────────────────────────────────
// All 93 EU MDR required documents with metadata and questions.

export type EUTemplateCategory =
  | "Regulatory Positioning"
  | "Economic Operators"
  | "Quality Management System"
  | "GSPR and Evidence"
  | "Risk Management"
  | "Software Lifecycle"
  | "Clinical and Performance"
  | "Usability and Human Oversight"
  | "Cybersecurity"
  | "Privacy and Data Governance"
  | "Technical Documentation"
  | "Labelling and PMS"
  | "Registration and Market Access";

export const EU_TEMPLATE_CATEGORIES: EUTemplateCategory[] = [
  "Regulatory Positioning",
  "Economic Operators",
  "Quality Management System",
  "GSPR and Evidence",
  "Risk Management",
  "Software Lifecycle",
  "Clinical and Performance",
  "Usability and Human Oversight",
  "Cybersecurity",
  "Privacy and Data Governance",
  "Technical Documentation",
  "Labelling and PMS",
  "Registration and Market Access",
];

export interface EUTemplate {
  slug: string;
  title: string;
  category: EUTemplateCategory;
  filename: string; // exact .docx filename in public/templates/eu-mdr/
  purpose: string;
  questions: string[];
}

export const EU_TEMPLATES: EUTemplate[] = [
  // ── Regulatory Positioning (8) ───────────────────────────────────────────
  {
    slug: "intended_purpose_statement",
    title: "Intended Purpose Statement",
    category: "Regulatory Positioning",
    filename: "Intended Purpose Statement.docx",
    purpose:
      "Define exactly what the product is intended to do, for whom, in what context, and how outputs will be used clinically.",
    questions: [
      "What is the exact intended medical purpose of the product?",
      "Which patient population, user groups and care settings are in scope?",
      "What inputs does the product use and what outputs does it provide?",
      "How are the outputs intended to be used in clinical decision-making or workflow?",
      "What contraindications, limitations, exclusions or warnings apply?",
      "What wording must remain aligned across the technical file, labelling, website and sales materials?",
    ],
  },
  {
    slug: "product_scope_and_functional_boundary_document",
    title: "Product Scope and Functional Boundary document",
    category: "Regulatory Positioning",
    filename: "Product Scope and Functional Boundary document.docx",
    purpose:
      "Describe the product boundary so reviewers can distinguish regulated functions from supporting ones.",
    questions: [
      "What components, modules, integrations and environments make up the product?",
      "Which functions are regulated medical-device functions and which are supporting or administrative only?",
      "Which external systems, users or third parties interact with the product?",
      "What interfaces or functions are explicitly excluded from scope?",
      "Where are the boundary conditions between the product and any third-party systems?",
      "What diagrams or appendices are needed to make the boundary unambiguous?",
    ],
  },
  {
    slug: "claims_inventory",
    title: "Claims inventory",
    category: "Regulatory Positioning",
    filename: "Claims inventory.docx",
    purpose:
      "List every internal and external product claim and identify its evidence basis.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "in_scope_out_of_scope_feature_matrix",
    title: "In-scope / out-of-scope feature matrix",
    category: "Regulatory Positioning",
    filename: "In-scope  -  out-of-scope feature matrix.docx",
    purpose:
      "Map each product feature to its regulatory status and rationale.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "qualification_and_classification_memo",
    title: "Qualification and Classification Memo",
    category: "Regulatory Positioning",
    filename: "Qualification and Classification Memo.docx",
    purpose:
      "Summarise the rationale for qualifying the software as a medical device and determining its class under EU MDR.",
    questions: [
      "What product and intended purpose are being assessed?",
      "Why does the software qualify, or not qualify, as medical device software?",
      "What claims, functions or outputs are relevant to qualification?",
      "Which classification rule or rules were considered and why?",
      "What proposed class is concluded and what evidence supports that conclusion?",
      "What open questions, assumptions or escalation points remain?",
    ],
  },
  {
    slug: "rule_11_analysis",
    title: "Rule 11 analysis",
    category: "Regulatory Positioning",
    filename: "Rule 11 analysis.docx",
    purpose:
      "Analyse which part of Rule 11 applies to the software and justify the resulting classification.",
    questions: [
      "What is the software's intended purpose and how does it process data?",
      "Does the software provide information for diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation?",
      "Is the software intended to be a decision-support tool, or does it take autonomous decisions?",
      "Which sub-rule of Rule 11 applies and why?",
      "What class results from the applicable sub-rule and what evidence supports that?",
      "What comparable classified devices or precedents support this conclusion?",
    ],
  },
  {
    slug: "module_by_module_classification_rationale",
    title: "Module-by-module classification rationale",
    category: "Regulatory Positioning",
    filename: "Module-by-module classification rationale.docx",
    purpose:
      "Apply Rule 11 analysis to each software module separately.",
    questions: [
      "What is the name and description of this module?",
      "What is the intended purpose of this module and what data does it process?",
      "Which Rule 11 sub-rule is applicable to this module and why?",
      "What classification results for this module?",
      "Does this module drive the overall device classification, and why?",
      "What evidence or decisions support this module-level conclusion?",
    ],
  },
  {
    slug: "decision_log_for_any_out_of_scope_functionality",
    title: "Decision log for any out-of-scope functionality",
    category: "Regulatory Positioning",
    filename: "Decision log for any out-of-scope functionality.docx",
    purpose:
      "Record decisions to exclude functions from the regulated device scope.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },

  // ── Economic Operators (4) ───────────────────────────────────────────────
  {
    slug: "manufacturer_details_record",
    title: "Manufacturer details record",
    category: "Economic Operators",
    filename: "Manufacturer details record.docx",
    purpose:
      "Capture the legal manufacturer identity and key organisational details.",
    questions: [
      "What is the full legal name, address and company registration number of the manufacturer?",
      "What is the SRN (Single Registration Number) or EUDAMED actor ID of the manufacturer?",
      "Who holds the PRRC role and what are their contact details?",
      "What regulatory contact points exist for different EU member state queries?",
      "What evidence confirms the manufacturer has sufficient resources and qualified personnel?",
    ],
  },
  {
    slug: "prrc_appointment_record",
    title: "PRRC appointment record",
    category: "Economic Operators",
    filename: "PRRC appointment record.docx",
    purpose:
      "Record the appointment, competence and responsibilities of the PRRC.",
    questions: [
      "Who is appointed as PRRC and what are their qualifications and experience?",
      "What is the scope of the PRRC appointment and what responsibilities are assigned?",
      "What training, procedures or systems does the PRRC rely on to discharge their responsibilities?",
      "How is the PRRC role covered during absences or transitions?",
      "What evidence of the appointment and competence is retained in the technical file?",
    ],
  },
  {
    slug: "authorised_representative_agreement_if_non_eu",
    title: "Authorised Representative agreement (if non-EU)",
    category: "Economic Operators",
    filename: "Authorised Representative agreement (if non-EU).docx",
    purpose:
      "Document the mandate and responsibilities agreed with the EU Authorised Representative.",
    questions: [
      "Who is appointed as Authorised Representative and in which member states?",
      "What responsibilities are explicitly assigned to the Authorised Representative under MDR Article 11?",
      "How does the manufacturer communicate device information and regulatory updates to the AR?",
      "What procedures govern escalation, complaints and vigilance reporting via the AR?",
      "What evidence of the mandate and appointment is included in the technical file?",
    ],
  },
  {
    slug: "importer_distributor_role_map_if_applicable",
    title: "Importer / distributor role map (if applicable)",
    category: "Economic Operators",
    filename: "Importer - distributor role map (if applicable).docx",
    purpose:
      "Identify the importers and distributors involved and map who holds which responsibilities.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },

  // ── Quality Management System (8) ────────────────────────────────────────
  {
    slug: "quality_manual_or_qms_overview",
    title: "Quality Manual or QMS overview",
    category: "Quality Management System",
    filename: "Quality Manual or QMS overview.docx",
    purpose:
      "Provide a high-level overview of the quality management system scope, structure and key processes.",
    questions: [
      "What is the scope of the QMS and which products and activities does it cover?",
      "What QMS standard or framework is the system based on and what is the certification status?",
      "What are the key QMS processes and how are they structured and linked?",
      "Who holds overall responsibility for the QMS and what governance structures are in place?",
      "What document control, change control and CAPA processes are in place?",
      "What evidence demonstrates QMS effectiveness and continual improvement?",
    ],
  },
  {
    slug: "design_and_development_procedure",
    title: "Design and development procedure",
    category: "Quality Management System",
    filename: "Design and development procedure.docx",
    purpose:
      "Define how design and development activities are planned, reviewed, verified and validated.",
    questions: [
      "What stages does the design and development process follow?",
      "How are design inputs defined, reviewed and approved?",
      "What design reviews are required, at what stages, and who participates?",
      "How are design outputs defined, documented and linked to inputs?",
      "How are design changes controlled, assessed for impact and re-verified?",
      "What records are produced at each stage and where are they stored?",
      "How does this procedure interact with risk management, verification and validation activities?",
    ],
  },
  {
    slug: "document_control_procedure",
    title: "Document control procedure",
    category: "Quality Management System",
    filename: "Document control procedure.docx",
    purpose:
      "Define how controlled documents are created, reviewed, approved, distributed and retired.",
    questions: [
      "What document types are within scope of this procedure?",
      "How are documents created, numbered and versioned?",
      "What review and approval steps are required before a document is released?",
      "How are current versions made available to users and how are obsolete versions controlled?",
      "How are external documents such as standards and regulations managed?",
      "What records are retained to demonstrate compliance with this procedure?",
      "How are emergency or urgent document releases handled?",
    ],
  },
  {
    slug: "change_control_procedure",
    title: "Change control procedure",
    category: "Quality Management System",
    filename: "Change control procedure.docx",
    purpose:
      "Define how changes are proposed, assessed, approved, implemented and documented.",
    questions: [
      "What types of change are within scope of this procedure?",
      "How is a change request initiated and what information must it contain?",
      "How is the impact of a proposed change assessed, including risk and regulatory impact?",
      "What approval steps are required before a change is implemented?",
      "How are post-implementation reviews conducted and documented?",
      "What records are produced and retained for each change?",
      "How does this procedure interact with CAPA and design change control?",
    ],
  },
  {
    slug: "supplier_management_procedure",
    title: "Supplier management procedure",
    category: "Quality Management System",
    filename: "Supplier management procedure.docx",
    purpose:
      "Define how suppliers are selected, qualified, monitored and managed.",
    questions: [
      "How are potential suppliers identified, evaluated and approved?",
      "What criteria are used to qualify suppliers and what evidence is required?",
      "How are supplier risks assessed and how is the approved supplier list maintained?",
      "How are supplier performance reviews conducted and what metrics are used?",
      "How are supplier changes and issues managed and escalated?",
      "What records are retained to demonstrate supplier qualification and monitoring?",
      "How are critical or sole-source suppliers handled differently?",
    ],
  },
  {
    slug: "capa_procedure",
    title: "CAPA procedure",
    category: "Quality Management System",
    filename: "CAPA procedure.docx",
    purpose:
      "Define how non-conformances, complaints, audit findings and other quality signals are investigated and corrected.",
    questions: [
      "What sources of quality signals trigger a CAPA investigation?",
      "How are issues classified by severity and priority?",
      "How is root cause analysis conducted and documented?",
      "What corrective and preventive actions are defined, assigned and tracked?",
      "How is effectiveness of completed actions verified?",
      "What records are produced and how long are they retained?",
      "How does CAPA feed into management review and continual improvement?",
    ],
  },
  {
    slug: "complaint_handling_procedure",
    title: "Complaint handling procedure",
    category: "Quality Management System",
    filename: "Complaint handling procedure.docx",
    purpose:
      "Define how complaints from users and patients are received, investigated and resolved.",
    questions: [
      "How are complaints received, logged and acknowledged?",
      "How are complaints triaged to determine if they constitute a reportable incident?",
      "How are complaint investigations conducted, including root cause analysis?",
      "What response and resolution steps are taken and how is the complainant informed?",
      "How are complaint trends analysed and fed back into risk management and design improvement?",
      "What records are produced and how long are they retained?",
      "How does this procedure interact with vigilance reporting and CAPA?",
    ],
  },
  {
    slug: "release_procedure",
    title: "Release procedure",
    category: "Quality Management System",
    filename: "Release procedure.docx",
    purpose:
      "Define how software releases are authorised, documented and deployed.",
    questions: [
      "What release types are within scope and what criteria must be met before release?",
      "How is a release package defined, assembled and verified?",
      "What authorisation steps are required and who can approve a release?",
      "How are releases communicated to users, distributors and relevant parties?",
      "What post-release monitoring is conducted and how are urgent issues escalated?",
      "What records are produced for each release and where are they stored?",
      "How are emergency or hotfix releases handled and documented?",
    ],
  },

  // ── GSPR and Evidence (2) ────────────────────────────────────────────────
  {
    slug: "gspr_checklist_conformity_matrix",
    title: "GSPR checklist / conformity matrix",
    category: "GSPR and Evidence",
    filename: "GSPR checklist  -  conformity matrix.docx",
    purpose:
      "Map each applicable GSPR requirement to evidence of conformity.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "evidence_cross_reference_index",
    title: "Evidence cross-reference index",
    category: "GSPR and Evidence",
    filename: "Evidence cross-reference index.docx",
    purpose:
      "Index the evidence set so reviewers can locate supporting records for each requirement.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },

  // ── Risk Management (5) ──────────────────────────────────────────────────
  {
    slug: "risk_management_plan",
    title: "Risk Management Plan",
    category: "Risk Management",
    filename: "Risk Management Plan.docx",
    purpose:
      "Set out the scope, responsibilities, methods and acceptance criteria for risk management throughout the product lifecycle.",
    questions: [
      "What is the scope of the risk management plan and which product lifecycle phases does it cover?",
      "Who is responsible for risk management activities and how is the risk management team structured?",
      "What risk management process and methodology will be followed?",
      "What risk acceptability criteria will be applied and what evidence supports them?",
      "How will risk management activities be planned, reviewed and updated?",
      "What records will be produced and how will they be maintained?",
    ],
  },
  {
    slug: "hazard_analysis_hazard_log",
    title: "Hazard Analysis / Hazard Log",
    category: "Risk Management",
    filename: "Hazard Analysis  -  Hazard Log.docx",
    purpose:
      "Record hazards, hazardous situations, harms, causes, controls and residual risks.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "benefit_risk_analysis",
    title: "Benefit-risk analysis",
    category: "Risk Management",
    filename: "Benefit-risk analysis.docx",
    purpose:
      "Explain why the expected benefits outweigh the residual risks for the intended use.",
    questions: [
      "What clinical and non-clinical benefits are claimed for the intended use?",
      "What evidence supports each claimed benefit?",
      "What are the residual risks after implementation of risk controls?",
      "How are benefits and residual risks compared and weighed?",
      "What conclusion is reached regarding overall benefit-risk acceptability?",
    ],
  },
  {
    slug: "risk_control_verification_records",
    title: "Risk control verification records",
    category: "Risk Management",
    filename: "Risk control verification records.docx",
    purpose:
      "Record how implemented risk controls were verified and whether they achieved the intended risk reduction.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "residual_risk_acceptability_statement",
    title: "Residual risk acceptability statement",
    category: "Risk Management",
    filename: "Residual risk acceptability statement.docx",
    purpose:
      "State whether residual risk is acceptable overall and under the risk management plan criteria.",
    questions: [
      "What risk acceptability criteria were applied?",
      "What is the overall residual risk profile after all controls?",
      "Is the overall residual risk acceptable against the defined criteria?",
      "What ongoing monitoring or review is required to maintain acceptability?",
    ],
  },

  // ── Software Lifecycle (10) ──────────────────────────────────────────────
  {
    slug: "software_development_plan",
    title: "Software Development Plan",
    category: "Software Lifecycle",
    filename: "Software Development Plan.docx",
    purpose:
      "Plan the software lifecycle activities, responsibilities, tools, methods and outputs.",
    questions: [
      "What is the software safety class and what development standard is being applied?",
      "What software development lifecycle model is used and how are phases defined?",
      "What development tools, infrastructure and configuration management systems are used?",
      "How are software requirements, design, implementation, verification and validation activities planned?",
      "Who is responsible for each lifecycle activity and how is the plan reviewed?",
      "What software development records are produced at each stage?",
    ],
  },
  {
    slug: "software_requirements_specification",
    title: "Software Requirements Specification",
    category: "Software Lifecycle",
    filename: "Software Requirements Specification.docx",
    purpose:
      "Define what the software must do, under what constraints, and how performance will be verified.",
    questions: [
      "What are the functional requirements for each module or feature?",
      "What are the performance, capacity and availability requirements?",
      "What safety requirements derive from the risk management process?",
      "What security, privacy and regulatory requirements must the software meet?",
      "What are the interface and integration requirements with external systems?",
      "How will each requirement be verified and what acceptance criteria apply?",
    ],
  },
  {
    slug: "architecture_design_description",
    title: "Architecture / Design Description",
    category: "Software Lifecycle",
    filename: "Architecture  -  Design Description.docx",
    purpose:
      "Describe the system architecture, components, interfaces, data flows and design decisions.",
    questions: [
      "What is the overall system architecture and how are components structured?",
      "How do components communicate and what are the key interfaces?",
      "What data flows exist between components and what data is processed at each stage?",
      "What design decisions were made and what rationale or alternatives were considered?",
      "How does the architecture address safety, security and performance requirements?",
      "What diagrams or appendices are required to make the architecture unambiguous?",
    ],
  },
  {
    slug: "traceability_matrix",
    title: "Traceability matrix",
    category: "Software Lifecycle",
    filename: "Traceability matrix.docx",
    purpose:
      "Trace requirements through design, implementation, verification and validation.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "verification_plan",
    title: "Verification Plan",
    category: "Software Lifecycle",
    filename: "Verification Plan.docx",
    purpose:
      "Define how the team will verify the software against requirements.",
    questions: [
      "What verification activities are planned and what is their scope?",
      "What verification methods will be used for each requirement type?",
      "What entry and exit criteria apply to each verification activity?",
      "Who is responsible for verification activities and what are the independence requirements?",
      "What records will be produced and what constitutes a verification pass?",
    ],
  },
  {
    slug: "verification_reports",
    title: "Verification reports",
    category: "Software Lifecycle",
    filename: "Verification reports.docx",
    purpose:
      "Record execution and results of verification activities.",
    questions: [
      "What verification activity does this report cover and what was its scope?",
      "What were the entry criteria and were they all met before testing began?",
      "What test cases, scripts or protocols were executed and what were the results?",
      "Were any deviations, anomalies or failures encountered and how were they resolved?",
      "What are the conclusions and has the software passed verification for the covered requirements?",
      "What records and evidence are retained to support this report?",
    ],
  },
  {
    slug: "validation_plan",
    title: "Validation Plan",
    category: "Software Lifecycle",
    filename: "Validation Plan.docx",
    purpose:
      "Define how the team will validate the software in its intended environment of use.",
    questions: [
      "What validation activities are planned and what is their scope?",
      "What are the validation objectives and acceptance criteria?",
      "Who will participate in validation and what are the independence requirements?",
      "How will the intended use environment be simulated or used?",
      "What records will be produced to demonstrate validation?",
    ],
  },
  {
    slug: "validation_report",
    title: "Validation report",
    category: "Software Lifecycle",
    filename: "Validation report.docx",
    purpose:
      "Record execution and results of validation activities.",
    questions: [
      "What validation activity does this report cover and what was its scope?",
      "What were the entry criteria and were they all met?",
      "What scenarios, tasks or protocols were executed and what were the results?",
      "Were any issues identified and how were they resolved?",
      "What are the validation conclusions and does the software meet its intended purpose?",
      "What records and evidence support this report?",
    ],
  },
  {
    slug: "defect_anomaly_log",
    title: "Defect / anomaly log",
    category: "Software Lifecycle",
    filename: "Defect  -  anomaly log.docx",
    purpose:
      "Record software defects and anomalies identified during development, verification and post-release.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "change_impact_assessment_template",
    title: "Change-impact assessment template",
    category: "Software Lifecycle",
    filename: "Change-impact assessment template.docx",
    purpose:
      "Assess the regulatory and safety impact of proposed changes to the software.",
    questions: [
      "What change is being assessed and what is its scope?",
      "What risk management, verification and validation activities are impacted by this change?",
      "Does this change constitute a significant change under MDR and what is the rationale?",
      "What re-verification, re-validation or re-review activities are required?",
      "What is the conclusion and recommended approval or rejection?",
    ],
  },

  // ── Clinical and Performance (7) ─────────────────────────────────────────
  {
    slug: "clinical_evaluation_plan",
    title: "Clinical Evaluation Plan",
    category: "Clinical and Performance",
    filename: "Clinical Evaluation Plan.docx",
    purpose:
      "Plan how clinical evidence will be identified, appraised and used to demonstrate safety and performance.",
    questions: [
      "What is the intended purpose and what clinical claims need to be substantiated?",
      "What clinical evidence sources will be used and how will they be identified?",
      "What are the inclusion and exclusion criteria for clinical evidence?",
      "How will evidence be appraised for quality, relevance and applicability?",
      "What are the acceptance criteria for demonstrating adequate clinical evidence?",
    ],
  },
  {
    slug: "clinical_evaluation_report",
    title: "Clinical Evaluation Report",
    category: "Clinical and Performance",
    filename: "Clinical Evaluation Report.docx",
    purpose:
      "Summarise the clinical evidence and conclude on safety, performance and benefit-risk.",
    questions: [
      "What is the intended purpose, target population and clinical claims being evaluated?",
      "What clinical evidence was identified and what was the search and selection methodology?",
      "What evidence was included and what were the key findings?",
      "How does the evidence support safety and performance in the intended use?",
      "What is the overall clinical evaluation conclusion and what gaps or residual uncertainties exist?",
    ],
  },
  {
    slug: "performance_validation_protocols",
    title: "Performance validation protocols",
    category: "Clinical and Performance",
    filename: "Performance validation protocols.docx",
    purpose:
      "Define repeatable protocols for validating claimed performance metrics.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "performance_validation_reports",
    title: "Performance validation reports",
    category: "Clinical and Performance",
    filename: "Performance validation reports.docx",
    purpose:
      "Record execution and results of performance validation activities.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "literature_review_and_appraisal",
    title: "Literature review and appraisal",
    category: "Clinical and Performance",
    filename: "Literature review and appraisal.docx",
    purpose:
      "Capture the literature search strategy, screening, appraisal and synthesis methodology.",
    questions: [
      "What search strategy was used and what databases, terms and date ranges were applied?",
      "What inclusion and exclusion criteria were applied to retrieved literature?",
      "What appraisal methodology was used to assess quality and relevance?",
      "What were the key findings and how do they support or challenge the intended purpose?",
      "What are the limitations of the literature review and what gaps remain?",
    ],
  },
  {
    slug: "equivalence_rationale_if_any",
    title: "Equivalence rationale (if any)",
    category: "Clinical and Performance",
    filename: "Equivalence rationale (if any).docx",
    purpose:
      "Justify why an equivalent device can be used to supplement clinical evidence.",
    questions: [
      "What device is proposed as equivalent and who is its manufacturer?",
      "How is the proposed equivalent device technically similar to Anathem?",
      "How is the proposed equivalent device biologically similar to Anathem?",
      "How is the proposed equivalent device clinically similar to Anathem?",
      "What differences exist between Anathem and the equivalent device and what is their impact?",
      "What access to technical documentation on the equivalent device is available?",
    ],
  },
  {
    slug: "known_limitations_statement",
    title: "Known limitations statement",
    category: "Clinical and Performance",
    filename: "Known limitations statement.docx",
    purpose:
      "Document known limitations of the product and how they are communicated to users.",
    questions: [
      "What known limitations of the product affect its safety or performance?",
      "How are known limitations communicated to users, in the IFU or training?",
      "How are known limitations reflected in the risk management file?",
      "How will known limitations be monitored and updated post-market?",
    ],
  },

  // ── Usability and Human Oversight (6) ────────────────────────────────────
  {
    slug: "usability_engineering_plan",
    title: "Usability Engineering Plan",
    category: "Usability and Human Oversight",
    filename: "Usability Engineering Plan.docx",
    purpose:
      "Plan usability engineering activities across the product lifecycle.",
    questions: [
      "What usability engineering standard and methodology will be applied?",
      "What usability activities are planned at each lifecycle stage?",
      "Who are the intended users and what are the use environments?",
      "How will usability risks be identified, evaluated and controlled?",
      "What records will be produced and what constitutes a usability pass?",
    ],
  },
  {
    slug: "use_specification",
    title: "Use specification",
    category: "Usability and Human Oversight",
    filename: "Use specification.docx",
    purpose:
      "Define intended users, use environments, operating principles and use-related hazards.",
    questions: [
      "Who are the intended users of the product and what are their characteristics?",
      "What are the intended use environments and how might use contexts vary?",
      "What are the key tasks users perform with the product?",
      "What use-related hazards and use errors have been identified?",
    ],
  },
  {
    slug: "user_interface_risk_analysis",
    title: "User interface risk analysis",
    category: "Usability and Human Oversight",
    filename: "User interface risk analysis.docx",
    purpose:
      "Identify use-related hazards and UI-related risk controls.",
    questions: [
      "What user interface elements and interactions are in scope?",
      "What use errors and use-related hazards have been identified?",
      "What risk controls have been applied to address use-related risks?",
      "How have risk controls been verified through formative or summative testing?",
      "What residual use-related risks remain and are they acceptable?",
      "How are use-related risks reflected in the overall risk management file?",
    ],
  },
  {
    slug: "summative_usability_study",
    title: "Summative usability study",
    category: "Usability and Human Oversight",
    filename: "Summative usability study.docx",
    purpose:
      "Document the method and results of the summative usability evaluation.",
    questions: [
      "What was the objective and scope of the summative usability study?",
      "Who participated in the study and how were they selected?",
      "What tasks were evaluated and what criteria defined pass or fail?",
      "What were the results and were any use errors or close calls observed?",
      "What are the conclusions and does the product meet its usability acceptance criteria?",
    ],
  },
  {
    slug: "human_oversight_policy",
    title: "Human oversight policy",
    category: "Usability and Human Oversight",
    filename: "Human oversight policy.docx",
    purpose:
      "Define the role of human review, override and escalation in clinical use of the product.",
    questions: [
      "What human oversight mechanisms are built into the product workflow?",
      "What clinical decisions must always be made or confirmed by a qualified human?",
      "How are clinicians trained on the importance and process of human oversight?",
      "How is the effectiveness of human oversight monitored post-deployment?",
      "How does this policy align with NHS clinical safety and liability requirements?",
    ],
  },
  {
    slug: "review_and_approval_workflow_sop",
    title: "Review-and-approval workflow SOP",
    category: "Usability and Human Oversight",
    filename: "Review-and-approval workflow SOP.docx",
    purpose:
      "Define how generated outputs are reviewed, approved, escalated and recorded.",
    questions: [
      "What outputs are subject to this review and approval workflow?",
      "What steps must a clinician complete to review, modify and approve an output?",
      "What criteria allow outputs to be approved without modification?",
      "How are outputs that are rejected or escalated handled?",
      "What records are produced for each review and approval decision?",
      "How long are review records retained and where are they stored?",
      "How does this workflow interact with clinical liability and governance frameworks?",
    ],
  },

  // ── Cybersecurity (7) ────────────────────────────────────────────────────
  {
    slug: "cybersecurity_risk_assessment",
    title: "Cybersecurity Risk Assessment",
    category: "Cybersecurity",
    filename: "Cybersecurity Risk Assessment.docx",
    purpose:
      "Assess cybersecurity risks, controls and residual cyber risks.",
    questions: [
      "What assets, data and systems are within scope of this assessment?",
      "What threat actors, attack vectors and threat scenarios have been identified?",
      "What cybersecurity controls are in place and how do they address identified threats?",
      "What residual cybersecurity risks remain after controls are applied?",
      "What is the overall cybersecurity risk conclusion and what actions are required?",
    ],
  },
  {
    slug: "threat_model",
    title: "Threat model",
    category: "Cybersecurity",
    filename: "Threat model.docx",
    purpose:
      "Describe assets, trust boundaries, threat actors, attack patterns and mitigations.",
    questions: [
      "What are the key assets to be protected and their data classification?",
      "What are the trust boundaries and entry points in the system architecture?",
      "What threat actors and their capabilities have been identified?",
      "What attack patterns or scenarios are considered most relevant?",
    ],
  },
  {
    slug: "security_architecture",
    title: "Security architecture",
    category: "Cybersecurity",
    filename: "Security architecture.docx",
    purpose:
      "Describe the security design, control layers and operating assumptions.",
    questions: [
      "What security principles and frameworks inform the architecture?",
      "What authentication, authorisation and access control mechanisms are used?",
      "How is data protected in transit and at rest?",
      "What logging, monitoring and detection capabilities are in place?",
      "How are third-party components and dependencies managed for security?",
    ],
  },
  {
    slug: "pen_test_security_assessment_report",
    title: "Pen test / security assessment report",
    category: "Cybersecurity",
    filename: "Pen test  -  security assessment report.docx",
    purpose:
      "Record security assessment scope, findings, evidence and remediation.",
    questions: [
      "What was the scope and methodology of the security assessment?",
      "Who conducted the assessment and what were their credentials?",
      "What vulnerabilities or findings were identified and how were they classified?",
      "What remediation actions were taken or planned for each finding?",
      "What is the overall security posture conclusion?",
      "What re-testing or follow-up activities are required?",
      "What limitations or exclusions applied to this assessment?",
    ],
  },
  {
    slug: "vulnerability_management_procedure",
    title: "Vulnerability management procedure",
    category: "Cybersecurity",
    filename: "Vulnerability management procedure.docx",
    purpose:
      "Define how vulnerabilities are identified, assessed, remediated and disclosed.",
    questions: [
      "How are vulnerabilities identified from internal and external sources?",
      "How are vulnerabilities assessed for severity and exploitability?",
      "What are the response times and escalation paths for different severity levels?",
      "How are vulnerabilities remediated, tested and released?",
      "How are users and regulators notified of significant vulnerabilities?",
      "What records are maintained and for how long?",
      "How does this procedure interact with post-market surveillance and CAPA?",
    ],
  },
  {
    slug: "logging_monitoring_specification",
    title: "Logging / monitoring specification",
    category: "Cybersecurity",
    filename: "Logging - monitoring specification.docx",
    purpose:
      "Specify what events are logged, how logs are protected and how monitoring is performed.",
    questions: [
      "What events must be logged and at what level of detail?",
      "How are logs protected against tampering, deletion or unauthorised access?",
      "What monitoring and alerting is in place and what thresholds trigger alerts?",
      "How are logs reviewed, retained and disposed of?",
      "How do logging and monitoring support incident detection and forensics?",
      "How does this specification meet NHS DSPT and relevant security standards?",
    ],
  },
  {
    slug: "business_continuity_backup_recovery_plan",
    title: "Business continuity / backup / recovery plan",
    category: "Cybersecurity",
    filename: "Business continuity  -  backup  -  recovery plan.docx",
    purpose:
      "Define how the service is maintained through disruption and how systems are recovered.",
    questions: [
      "What are the recovery time objectives and recovery point objectives for the service?",
      "What backup mechanisms are in place and how frequently are backups performed?",
      "What scenarios are covered by the business continuity plan?",
      "How is the continuity plan tested and how often?",
      "Who is responsible for invoking and executing the plan?",
      "What records are produced after an incident or recovery event?",
    ],
  },

  // ── Privacy and Data Governance (8) ─────────────────────────────────────
  {
    slug: "dpia",
    title: "DPIA",
    category: "Privacy and Data Governance",
    filename: "DPIA.docx",
    purpose:
      "Assess data protection risks and controls for the processing activities involving personal data.",
    questions: [
      "What personal data is processed and what is the purpose of processing?",
      "What is the lawful basis for processing and how is it documented?",
      "What risks to data subjects have been identified and what controls address them?",
      "Have the principles of data minimisation, purpose limitation and storage limitation been met?",
      "Have the rights of data subjects been addressed and how can they be exercised?",
      "What residual risks remain and are they acceptable?",
    ],
  },
  {
    slug: "record_of_processing_activities",
    title: "Record of Processing Activities",
    category: "Privacy and Data Governance",
    filename: "Record of Processing Activities.docx",
    purpose:
      "Record processing purposes, categories, recipients, transfers and retention periods.",
    questions: [
      "What processing activities are within scope of this record?",
      "What categories of personal data are processed for each activity?",
      "Who are the recipients and processors involved in each activity?",
      "Are any international data transfers involved and under what basis?",
      "What are the retention periods for each category of personal data?",
    ],
  },
  {
    slug: "privacy_notice",
    title: "Privacy notice",
    category: "Privacy and Data Governance",
    filename: "Privacy notice.docx",
    purpose:
      "Provide the core content needed for a user-facing privacy notice.",
    questions: [
      "What personal data is collected and why?",
      "Who is the data controller and how can they be contacted?",
      "What is the lawful basis for each type of processing?",
      "How long is personal data retained and how is it deleted?",
      "What are the rights of data subjects and how can they be exercised?",
      "How are significant changes to this notice communicated to users?",
    ],
  },
  {
    slug: "lawful_basis_analysis",
    title: "Lawful basis analysis",
    category: "Privacy and Data Governance",
    filename: "Lawful basis analysis.docx",
    purpose:
      "Identify the lawful basis or bases relied on for each processing activity.",
    questions: [
      "What processing activities require a lawful basis analysis?",
      "What lawful basis or bases are relied on for each processing activity?",
      "How is the lawful basis documented and communicated?",
      "What action is required if processing is challenged or consent is withdrawn?",
    ],
  },
  {
    slug: "article_9_condition_analysis",
    title: "Article 9 condition analysis",
    category: "Privacy and Data Governance",
    filename: "Article 9 condition analysis.docx",
    purpose:
      "Identify the applicable special category data condition where health data is processed.",
    questions: [
      "Does the product process special category data and under what circumstances?",
      "Which Article 9 condition is relied on for each instance of special category data processing?",
      "What additional safeguards are applied to special category data?",
      "How is the Article 9 condition documented and reviewed?",
    ],
  },
  {
    slug: "controller_processor_matrix",
    title: "Controller / processor matrix",
    category: "Privacy and Data Governance",
    filename: "Controller - processor matrix.docx",
    purpose:
      "Map controller and processor relationships for all data processing activities.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "data_retention_and_deletion_policy",
    title: "Data retention and deletion policy",
    category: "Privacy and Data Governance",
    filename: "Data retention and deletion policy.docx",
    purpose:
      "Define retention periods, deletion procedures and data minimisation practices.",
    questions: [
      "What categories of data are subject to this policy?",
      "What are the retention periods for each data category and what is their justification?",
      "How is data deleted or anonymised at end of retention and how is this evidenced?",
      "How are retention and deletion activities audited and reported?",
      "How does this policy interact with legal holds and regulatory obligations?",
    ],
  },
  {
    slug: "international_transfer_assessment_if_relevant",
    title: "International transfer assessment (if relevant)",
    category: "Privacy and Data Governance",
    filename: "International transfer assessment (if relevant).docx",
    purpose:
      "Assess and justify any international transfers of personal data.",
    questions: [
      "What personal data is transferred internationally and to which countries or entities?",
      "What transfer mechanism is relied on for each transfer?",
      "What supplementary safeguards are applied where transfer mechanisms alone are insufficient?",
      "What risk assessment supports the use of the chosen transfer mechanism?",
      "How are international transfers documented and reviewed?",
    ],
  },

  // ── Technical Documentation (10) ─────────────────────────────────────────
  {
    slug: "technical_documentation_index",
    title: "Technical Documentation Index",
    category: "Technical Documentation",
    filename: "Technical Documentation Index.docx",
    purpose:
      "Provide the top-level index for the technical documentation file.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "device_description_and_specification",
    title: "Device description and specification",
    category: "Technical Documentation",
    filename: "Device description and specification.docx",
    purpose:
      "Describe the device, variants, accessories, users, environments and key specifications.",
    questions: [
      "What is the device name, model, variants and intended purpose?",
      "What are the key technical specifications and performance characteristics?",
      "Who are the intended users and what are the intended use environments?",
      "What accessories, components or interoperable products are associated with the device?",
      "What distinguishes this device from similar products on the market?",
    ],
  },
  {
    slug: "intended_purpose_and_claims_section",
    title: "Intended purpose and claims section",
    category: "Technical Documentation",
    filename: "Intended purpose and claims section.docx",
    purpose:
      "Bring together the final intended purpose wording and approved claims for the technical file.",
    questions: [
      "What is the final intended purpose wording for inclusion in the technical file?",
      "What performance claims are made and what evidence substantiates each?",
      "What contraindications, warnings and precautions apply?",
      "What limitations of use must be communicated to users?",
      "What wording alignment is required with labelling, IFU and website materials?",
      "How has the intended purpose wording been reviewed and approved?",
    ],
  },
  {
    slug: "gspr_matrix",
    title: "GSPR matrix",
    category: "Technical Documentation",
    filename: "GSPR matrix.docx",
    purpose:
      "Provide the technical-file version of the GSPR mapping and evidence index.",
    questions: [
      "Which GSPR requirements are applicable to this device and why?",
      "For each applicable requirement, what is the conformity approach?",
      "What standards are applied and to what extent do they address each requirement?",
      "What evidence is available to demonstrate conformity with each requirement?",
      "What gaps or open items remain and what is the plan to address them?",
    ],
  },
  {
    slug: "design_and_manufacturing_information",
    title: "Design and manufacturing information",
    category: "Technical Documentation",
    filename: "Design and manufacturing information.docx",
    purpose:
      "Describe design outputs and any manufacturing or deployment processes.",
    questions: [
      "What design outputs exist and how are they documented and controlled?",
      "What deployment, configuration or manufacturing processes apply to this software device?",
      "How are design changes assessed, approved and implemented?",
      "How does the design information link to the device description and specifications?",
    ],
  },
  {
    slug: "risk_management_file",
    title: "Risk-management file",
    category: "Technical Documentation",
    filename: "Risk-management file.docx",
    purpose:
      "Compile the complete risk management records for the technical documentation file.",
    questions: [
      "What documents and records make up the risk management file?",
      "How is the risk management file structured and indexed?",
      "What evidence demonstrates that the risk management process was followed?",
      "What are the key conclusions of the risk management activities?",
      "How is the risk management file maintained and updated through the lifecycle?",
      "How does the risk management file link to the clinical evaluation and GSPR?",
    ],
  },
  {
    slug: "verification_and_validation_evidence",
    title: "Verification and validation evidence",
    category: "Technical Documentation",
    filename: "Verification and validation evidence.docx",
    purpose:
      "Compile the V&V evidence for the technical documentation file.",
    questions: [
      "What verification and validation records are included in this file?",
      "How is the V&V evidence structured and indexed?",
      "What traceability exists between requirements, test activities and results?",
      "What is the overall V&V conclusion for the device?",
      "How does the V&V evidence link to risk management and clinical evaluation?",
    ],
  },
  {
    slug: "clinical_evaluation_file",
    title: "Clinical evaluation file",
    category: "Technical Documentation",
    filename: "Clinical evaluation file.docx",
    purpose:
      "Compile the complete clinical evaluation records for the technical file.",
    questions: [
      "What documents and records make up the clinical evaluation file?",
      "How is the clinical evaluation file structured and indexed?",
      "What is the overall clinical evaluation conclusion?",
      "What post-market clinical follow-up is planned or underway?",
      "How does the clinical evidence support the benefit-risk conclusion?",
      "How are gaps and uncertainties addressed in the evaluation?",
      "How will the clinical evaluation file be updated at each periodic review?",
    ],
  },
  {
    slug: "labelling_ifu",
    title: "Labelling / IFU",
    category: "Technical Documentation",
    filename: "Labelling - IFU.docx",
    purpose:
      "Document the controlled labelling and IFU content for the technical file.",
    questions: [
      "What labelling elements are required under MDR Annex I Chapter III?",
      "Has the labelling content been reviewed and approved for regulatory compliance?",
      "What languages are required for the target markets?",
      "How is labelling version controlled and updated?",
      "How is labelling linked to the device description and intended purpose?",
    ],
  },
  {
    slug: "pms_documentation",
    title: "PMS documentation",
    category: "Technical Documentation",
    filename: "PMS documentation.docx",
    purpose:
      "Compile the post-market surveillance documentation for the technical file.",
    questions: [
      "What PMS documents are included and how are they indexed?",
      "What data sources are used for post-market surveillance?",
      "What is the review frequency and who is responsible for PMS activities?",
      "How are PMS findings fed back into risk management and design improvement?",
      "What reports are produced from PMS activities and when?",
    ],
  },

  // ── Labelling and PMS (8) ────────────────────────────────────────────────
  {
    slug: "labelling",
    title: "Labelling",
    category: "Labelling and PMS",
    filename: "Labelling.docx",
    purpose:
      "Provide the controlled content and review fields for labels attached to the device.",
    questions: [
      "What MDR Annex I Chapter III labelling requirements apply to this device?",
      "What is the approved label content including all mandatory elements?",
      "How has the label been reviewed and approved for regulatory compliance?",
      "How is label version controlled and updated when content changes?",
    ],
  },
  {
    slug: "instructions_for_use_ifu",
    title: "Instructions for Use (IFU)",
    category: "Labelling and PMS",
    filename: "Instructions for Use (IFU).docx",
    purpose:
      "Provide the controlled content for the Instructions for Use document.",
    questions: [
      "What is the intended user and what background knowledge can be assumed?",
      "What are the step-by-step instructions for safe and effective use?",
      "What warnings, contraindications and precautions must be included?",
      "How are known limitations and residual risks communicated in the IFU?",
      "How is the IFU reviewed, approved and version controlled?",
    ],
  },
  {
    slug: "website_sales_demo_claims_approval_file",
    title: "Website / sales / demo claims approval file",
    category: "Labelling and PMS",
    filename: "Website  -  sales  -  demo claims approval file.docx",
    purpose:
      "Record which public-facing claims are approved and by whom.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "language_matrix_by_target_member_state",
    title: "Language matrix by target Member State",
    category: "Labelling and PMS",
    filename: "Language matrix by target Member State.docx",
    purpose:
      "Track which languages are required for each target Member State.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "pms_plan",
    title: "PMS Plan",
    category: "Labelling and PMS",
    filename: "PMS Plan.docx",
    purpose:
      "Plan how post-market surveillance data will be collected, reviewed and acted on.",
    questions: [
      "What are the objectives and scope of the PMS plan?",
      "What data sources will be used for post-market surveillance?",
      "What are the review frequencies and thresholds for escalation?",
      "How will PMS findings feed into risk management and CAPA?",
      "What reports will be produced and what are the timelines?",
    ],
  },
  {
    slug: "pmcf_rationale_pmcf_plan_if_needed",
    title: "PMCF rationale / PMCF Plan (if needed)",
    category: "Labelling and PMS",
    filename: "PMCF rationale  -  PMCF Plan (if needed).docx",
    purpose:
      "Justify the approach to PMCF and plan any required studies.",
    questions: [
      "Is a PMCF study required and what is the justification for this conclusion?",
      "If PMCF is required, what is the planned study design and methodology?",
      "What outcomes and endpoints will the PMCF study measure?",
      "How will PMCF results feed into the clinical evaluation and risk management?",
    ],
  },
  {
    slug: "complaint_handling_sop",
    title: "Complaint handling SOP",
    category: "Labelling and PMS",
    filename: "Complaint handling SOP.docx",
    purpose:
      "Define the SOP for receiving, investigating and resolving post-market complaints.",
    questions: [
      "How are complaints received, logged and acknowledged under this SOP?",
      "How are complaints triaged to determine if they are reportable incidents or serious incidents?",
      "How are complaint investigations conducted and documented?",
      "How are complainants informed of outcomes and resolutions?",
      "How are complaint trends analysed and escalated to risk management?",
      "What records are produced and for how long are they retained?",
      "How does this SOP interact with the vigilance SOP and CAPA procedure?",
    ],
  },
  {
    slug: "vigilance_sop",
    title: "Vigilance SOP",
    category: "Labelling and PMS",
    filename: "Vigilance SOP.docx",
    purpose:
      "Define how serious incidents and FSCAs are detected, reported and managed.",
    questions: [
      "How are serious incidents and near-serious incidents identified and classified?",
      "What are the reporting timelines and obligations under MDR Article 87?",
      "How are initial reports prepared and submitted to the relevant competent authority?",
      "How are follow-up reports managed until the case is closed?",
      "How are Field Safety Corrective Actions initiated and communicated?",
    ],
  },

  // ── Registration and Market Access (9) ───────────────────────────────────
  {
    slug: "trend_reporting_process",
    title: "Trend reporting process",
    category: "Registration and Market Access",
    filename: "Trend reporting process.docx",
    purpose:
      "Define how trend data are collected, analysed, escalated and reported.",
    questions: [
      "What data sources feed into trend analysis and how are they collected?",
      "What statistical methods or thresholds are used to identify significant trends?",
      "How are identified trends escalated and actioned?",
      "What reports are produced and what is the review frequency?",
      "How do trend reports feed back into risk management and design improvement?",
      "How are trend reports submitted to competent authorities where required?",
      "How are trend reporting activities documented and retained?",
    ],
  },
  {
    slug: "actor_registration_package",
    title: "Actor registration package",
    category: "Registration and Market Access",
    filename: "Actor registration package.docx",
    purpose:
      "Collect the data and supporting records needed for actor registration in EUDAMED.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "declaration_on_information_security_responsibilities",
    title: "Declaration on information security responsibilities",
    category: "Registration and Market Access",
    filename: "Declaration on information security responsibilities.docx",
    purpose:
      "Record the responsibilities accepted by relevant parties for information security.",
    questions: [
      "Which parties are accepting information security responsibilities under this declaration?",
      "What specific responsibilities and obligations are accepted by each party?",
      "What security standards or frameworks are referenced in this declaration?",
      "How will compliance with accepted responsibilities be monitored and evidenced?",
      "How is this declaration reviewed and updated when responsibilities change?",
      "What are the consequences of non-compliance with accepted responsibilities?",
      "How does this declaration interact with DSPT and supplier agreements?",
    ],
  },
  {
    slug: "mandate_summary_document_if_non_eu_manufacturer",
    title: "Mandate summary document (if non-EU manufacturer)",
    category: "Registration and Market Access",
    filename: "Mandate summary document (if non-EU manufacturer).docx",
    purpose:
      "Summarise the Authorised Representative mandate and contact details.",
    questions: [
      "Who is the non-EU manufacturer and who is the appointed Authorised Representative?",
      "What is the scope of the mandate and which devices does it cover?",
      "What are the key obligations accepted by the Authorised Representative?",
      "How can the Authorised Representative be contacted by competent authorities?",
      "What evidence of the mandate is included in the technical file?",
    ],
  },
  {
    slug: "prrc_information",
    title: "PRRC information",
    category: "Registration and Market Access",
    filename: "PRRC information.docx",
    purpose:
      "Capture the PRRC identity, availability and competence information for EUDAMED registration.",
    questions: [
      "What is the full name, job title and contact details of the PRRC?",
      "What qualifications and experience does the PRRC have relevant to their regulatory responsibilities?",
      "How is the PRRC role covered during absences or transitions?",
      "What procedures and systems does the PRRC rely on to discharge their responsibilities?",
      "How is the PRRC appointment documented and retained?",
      "What training or continuing education does the PRRC undertake to maintain competence?",
    ],
  },
  {
    slug: "basic_udi_di_udi_di_data",
    title: "Basic UDI-DI / UDI-DI data",
    category: "Registration and Market Access",
    filename: "Basic UDI-DI  -  UDI-DI data.docx",
    purpose:
      "Capture the UDI data for device registration.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "device_registration_information",
    title: "Device registration information",
    category: "Registration and Market Access",
    filename: "Device registration information.docx",
    purpose:
      "Capture the device registration information for EUDAMED submission.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "eu_declaration_of_conformity",
    title: "EU Declaration of Conformity",
    category: "Registration and Market Access",
    filename: "EU Declaration of Conformity.docx",
    purpose:
      "Provide the formal declaration of conformity with EU MDR requirements.",
    questions: [
      "What is the manufacturer's full legal name, address and SRN?",
      "What device, variants and UDI-DI are covered by this declaration?",
      "What harmonised standards and common specifications have been applied?",
      "What notified body was involved and what is their identification number (if applicable)?",
      "What is the date of the declaration and who signed it?",
    ],
  },
  {
    slug: "ce_marking_artwork_control",
    title: "CE marking artwork / control",
    category: "Registration and Market Access",
    filename: "CE marking artwork - control.docx",
    purpose:
      "Control the CE marking artwork and record its approved usage.",
    questions: [
      "What rules, definitions, conventions or completion instructions apply to this table?",
      "What evidence or attachments should always be linked from this table?",
    ],
  },
  {
    slug: "notified_body_application_pack_only_if_classification_requires_it",
    title: "Notified body application pack (only if classification requires it)",
    category: "Registration and Market Access",
    filename: "Notified body application pack (only if classification requires it).docx",
    purpose:
      "Compile the application package for notified body review.",
    questions: [
      "What documents are included in the notified body application package?",
      "What is the device classification and why does it require notified body review?",
      "What application form and fees are required by the chosen notified body?",
      "What is the timeline for notified body review and what are the key milestones?",
      "What follow-up or response procedures apply once the application is submitted?",
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTemplatesByCategory(cat: EUTemplateCategory): EUTemplate[] {
  return EU_TEMPLATES.filter((t) => t.category === cat);
}

export function getTemplateBySlug(slug: string): EUTemplate | undefined {
  return EU_TEMPLATES.find((t) => t.slug === slug);
}

export const EU_TEMPLATE_COUNT = 93;
