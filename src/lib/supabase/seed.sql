-- ============================================================
-- Anathem Governance Platform — Seed Data (UUID version)
-- Run in the Supabase SQL editor
-- ============================================================

-- ── Organisations ─────────────────────────────────────────────

insert into organisations (id, name, ods_code, region, status, created_at, updated_at) values
  ('f4448f60-cce7-5eca-8671-47d728964261', 'Berkshire Healthcare NHS Foundation Trust',            'RWX', 'South East',      'active', '2024-09-01T00:00:00Z', '2025-03-05T00:00:00Z'),
  ('08162fb2-0d45-516a-a3a5-45d7f84c6e90', 'Oxleas NHS Foundation Trust',                          'RQY', 'South East',      'active', '2024-11-01T00:00:00Z', '2025-03-10T00:00:00Z'),
  ('a19fa246-ad11-5586-9b75-44e429924c41', 'Central and North West London NHS Foundation Trust',   'RV3', 'London',          'active', '2025-01-15T00:00:00Z', '2025-03-20T00:00:00Z'),
  ('c1bc7431-68b9-5040-8fb1-b8823b76b072', 'Avon and Wiltshire Mental Health Partnership NHS Trust','RVN','South West',      'active', '2024-09-15T00:00:00Z', '2025-01-20T00:00:00Z'),
  ('e245b425-4e4d-575c-9f0e-c26707de78a8', 'Mersey Care NHS Foundation Trust',                     'RW4', 'North West',      'active', '2024-12-01T00:00:00Z', '2025-03-28T00:00:00Z'),
  ('c12a8b7d-ff33-59e5-9843-48cb9135945f', 'Norfolk and Suffolk NHS Foundation Trust',              'TAF', 'East of England', 'active', '2024-11-01T00:00:00Z', '2024-12-20T00:00:00Z')
on conflict (id) do nothing;

-- ── Org modules ───────────────────────────────────────────────
-- Module IDs already seeded in Supabase:
--   mental-health:       6ad66f24-3f5f-45cd-b476-b6f732aaf05a
--   police:              bca47a9d-a45f-40e8-bab2-397b25d94680
--   neurodevelopmental:  08551e1e-e4aa-4b37-b13c-5cf692981851
--   patient-crm:         07843da1-8764-4503-b78b-aaa479cea8e3

insert into org_modules (id, org_id, module_id, activated_at, deactivated_at) values
  ('f0d3afbf-eedd-50ad-87dc-8a09f967a29b', 'f4448f60-cce7-5eca-8671-47d728964261', '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2024-09-01T00:00:00Z', null),
  ('b71b5505-52be-5a2f-9da3-921b0c57f2ac', '08162fb2-0d45-516a-a3a5-45d7f84c6e90', '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2024-11-01T00:00:00Z', null),
  ('68542499-f279-510f-b2b7-a23ce2f59825', '08162fb2-0d45-516a-a3a5-45d7f84c6e90', '08551e1e-e4aa-4b37-b13c-5cf692981851', '2025-02-01T00:00:00Z', null),
  ('068323c7-18d7-5864-8052-e550a4506a0d', 'a19fa246-ad11-5586-9b75-44e429924c41', '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2025-01-15T00:00:00Z', null),
  ('0354d138-5efb-5285-9e6d-f5b0a63ee74e', 'a19fa246-ad11-5586-9b75-44e429924c41', 'bca47a9d-a45f-40e8-bab2-397b25d94680', '2025-01-15T00:00:00Z', null),
  ('33b2e182-039a-5bb5-adcf-040c442bd52b', 'c1bc7431-68b9-5040-8fb1-b8823b76b072', '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2024-09-15T00:00:00Z', null),
  ('1cd79db0-25b3-5fae-963d-31823a24422c', 'e245b425-4e4d-575c-9f0e-c26707de78a8', '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2024-12-01T00:00:00Z', null),
  ('aa7a2904-c894-5bab-a4e2-c919b3e0977e', 'e245b425-4e4d-575c-9f0e-c26707de78a8', '07843da1-8764-4503-b78b-aaa479cea8e3', '2024-12-01T00:00:00Z', null),
  ('30799173-513b-540b-884f-a5df332c4d29', 'c12a8b7d-ff33-59e5-9843-48cb9135945f', '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2024-11-01T00:00:00Z', null)
on conflict (id) do nothing;

-- ── Facts ─────────────────────────────────────────────────────

insert into facts (id, fact_key, display_name, description, tier, domain, value_type, current_value, module_id, created_at, updated_at, created_by) values
  ('739b15a9-75d5-507d-81cb-963e29e782d8', 'clinical.intended_purpose',     'Intended Purpose',               'The clinical intended purpose of the Anathem AVT system',              'global',       'clinical',  'string', 'Ambient voice transcription and clinical documentation support for NHS clinicians. Does not make clinical decisions.', null,                                   '2024-09-01T00:00:00Z', '2025-01-14T00:00:00Z', 'Sarah M.'),
  ('a789832c-1ce2-50ce-a6cf-bb54e5170859', 'clinical.risk_classification',  'Risk Classification',            'MHRA SaMD risk classification',                                         'global',       'clinical',  'string', 'Class IIa SaMD (MHRA)',                                                                                                  null,                                   '2024-09-01T00:00:00Z', '2024-09-01T00:00:00Z', 'James R.'),
  ('d486bc31-b00c-5732-a0ff-ac6e4181ab10', 'clinical.patient_safety_impact','Patient Safety Impact',          'Nature of patient safety impact — direct or indirect',                  'global',       'clinical',  'string', 'Indirect — supports documentation workflow only. No real-time clinical decision support.',                             null,                                   '2024-09-01T00:00:00Z', '2025-02-20T00:00:00Z', 'Sarah M.'),
  ('ff5cc83e-bb96-55ce-8146-42724b60cce9', 'data.retention_period',         'Data Retention Period',          'Standard patient data retention period',                                'global',       'data',      'string', '7 years post last patient contact',                                                                                     null,                                   '2024-09-01T00:00:00Z', '2025-03-10T00:00:00Z', 'James R.'),
  ('53ebf4c8-37de-525e-9bda-af8a420698b0', 'data.processing_location',      'Data Processing Location',       'Geographic location of all data processing and storage',                'global',       'data',      'string', 'United Kingdom only (Microsoft Azure UK South, UK West failover)',                                                       null,                                   '2024-09-01T00:00:00Z', '2024-11-05T00:00:00Z', 'Sarah M.'),
  ('4bd548e8-1f9e-56f1-ad8e-59dc288f9368', 'data.encryption_at_rest',       'Encryption at Rest',             'Encryption standard applied to stored data',                            'global',       'data',      'string', 'AES-256',                                                                                                               null,                                   '2024-09-01T00:00:00Z', '2024-09-01T00:00:00Z', 'Priya K.'),
  ('42bf3eb6-100a-53e2-9ef0-76a34cfea0bb', 'data.encryption_in_transit',    'Encryption in Transit',          'Encryption standard applied to data in transit',                        'global',       'data',      'string', 'TLS 1.3',                                                                                                               null,                                   '2024-09-01T00:00:00Z', '2024-09-01T00:00:00Z', 'Priya K.'),
  ('4ce08ec1-83e5-5b91-9b36-4d180b56d119', 'technical.hosting_provider',    'Hosting Provider',               'Primary cloud infrastructure provider',                                 'global',       'technical', 'string', 'Microsoft Azure UK South',                                                                                              null,                                   '2024-09-01T00:00:00Z', '2024-09-01T00:00:00Z', 'Priya K.'),
  ('1a6f5f65-60bd-54ec-9147-3ffe5732fbbf', 'technical.ai_model',            'AI Model',                       'AI model used for transcription and documentation generation',          'global',       'technical', 'string', 'claude-sonnet-4-20250514 (Anthropic)',                                                                                   null,                                   '2024-09-01T00:00:00Z', '2025-06-01T00:00:00Z', 'Priya K.'),
  ('92a35225-df64-51b1-a800-2dff7ce8e863', 'technical.uptime_sla',          'Uptime SLA',                     'Contractual uptime commitment',                                         'global',       'technical', 'string', '99.9% monthly uptime',                                                                                                  null,                                   '2024-10-01T00:00:00Z', '2024-10-01T00:00:00Z', 'James R.'),
  ('e6c28996-c1bc-5f4c-bb92-57caf273ed10', 'legal.mhra_registration',       'MHRA Registration',              'UKCA marking and MHRA registration details',                            'global',       'legal',     'string', 'UKCA marked, Class IIa, registration REG-2024-00441',                                                                   null,                                   '2024-12-01T00:00:00Z', '2024-12-01T00:00:00Z', 'James R.'),
  ('2f8680e5-285a-5618-b94f-736d04e5bb8a', 'legal.ico_registration',        'ICO Registration Number',        'Information Commissioner''s Office registration reference',              'global',       'legal',     'string', 'ZA123456',                                                                                                              null,                                   '2024-09-01T00:00:00Z', '2024-09-01T00:00:00Z', 'James R.'),
  ('b08095c3-33b6-51b2-af4c-843d8efdb22e', 'evidence.nhse_pilot',           'NHSE Pilot',                     'NHSE AVT Registry pilot participation details',                         'global',       'evidence',  'string', 'NHSE AVT Registry Pilot, Q3 2024, 12 participating trusts',                                                             null,                                   '2024-10-15T00:00:00Z', '2025-01-08T00:00:00Z', 'Sarah M.'),
  ('a6f70a6f-bbbc-5b7f-b442-8fdaa9cca9ca', 'evidence.dtac_status',          'DTAC Status',                    'Digital Technology Assessment Criteria compliance status',               'global',       'evidence',  'string', 'DTAC assessment complete — compliant (October 2024)',                                                                    null,                                   '2024-10-28T00:00:00Z', '2024-10-28T00:00:00Z', 'James R.'),
  ('9f0e5d5e-f83c-54a7-9d5a-7a7267097c7b', 'mental-health.session_consent_method', 'Session Consent Method', 'How patient consent is captured for session recording',                 'module',       'clinical',  'string', 'Verbal consent captured by clinician prior to session recording',                                                        '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2024-09-15T00:00:00Z', '2024-09-15T00:00:00Z', 'Sarah M.'),
  ('091a2060-74e7-5460-9a23-3379e3bf3580', 'mental-health.ehr_integrations',       'EHR Integrations',       'EHR systems integrated with the mental health module',                  'module',       'technical', 'string', 'EMIS Web, SystmOne',                                                                                                    '6ad66f24-3f5f-45cd-b476-b6f732aaf05a', '2024-09-15T00:00:00Z', '2025-01-20T00:00:00Z', 'Priya K.'),
  ('a10d97ab-be35-5346-9191-dd355811819c', 'police.custody_workflow',       'Custody Workflow',               'How the police module is used in custody settings',                     'module',       'clinical',  'string', 'Post-interview transcription only — no real-time recording in custody',                                                  'bca47a9d-a45f-40e8-bab2-397b25d94680', '2024-11-01T00:00:00Z', '2024-11-01T00:00:00Z', 'James R.'),
  ('2bb63220-715b-5e7d-90f8-935ec9899e72', 'neurodevelopmental.assessment_tools',  'Assessment Tools',       'Structured assessment tools supported by the neurodevelopmental module', 'module',      'clinical',  'string', 'ADOS-2, ADI-R, CARS-2',                                                                                                 '08551e1e-e4aa-4b37-b13c-5cf692981851', '2024-11-15T00:00:00Z', '2024-11-15T00:00:00Z', 'Sarah M.'),
  ('2d4aa9e4-283d-5a02-a6f0-711c75f5e915', 'data.retention_period',         'Data Retention Period (BHFT)',   'BHFT local retention policy override',                                  'org_instance', 'data',      'string', '8 years post last patient contact',                                                                                     null,                                   '2025-02-01T00:00:00Z', '2025-02-01T00:00:00Z', 'James R.'),
  ('73917e00-a567-5c78-abac-9f80b895f45d', 'technical.ehr_system',          'EHR System (Oxleas)',            'EHR system in use at Oxleas NHS FT',                                   'org_instance', 'technical', 'string', 'RiO (Servelec)',                                                                                                         null,                                   '2025-01-10T00:00:00Z', '2025-01-10T00:00:00Z', 'Priya K.')
on conflict (id) do nothing;

-- ── Org facts (org-instance overrides) ────────────────────────

insert into org_facts (id, org_id, fact_id, value, updated_at) values
  ('330eb3f2-eaef-5b1a-a1a0-a9778305c1fa', 'f4448f60-cce7-5eca-8671-47d728964261', '2d4aa9e4-283d-5a02-a6f0-711c75f5e915', '8 years post last patient contact', '2025-02-01T00:00:00Z'),
  ('b574f94a-a808-50cd-b63c-83e1a2118e6a', '08162fb2-0d45-516a-a3a5-45d7f84c6e90', '73917e00-a567-5c78-abac-9f80b895f45d', 'RiO (Servelec)',                    '2025-01-10T00:00:00Z')
on conflict (id) do nothing;

-- ── Fact versions ─────────────────────────────────────────────

insert into fact_versions (id, fact_id, version_number, value, changed_by, changed_at, change_reason) values
  ('d6f661a1-d048-5888-b597-d4e9e6adc8de', '739b15a9-75d5-507d-81cb-963e29e782d8', 1, 'Ambient voice transcription tool for NHS clinical documentation.',                                                             'James R.', '2024-09-01T00:00:00Z', 'Initial value'),
  ('0988a8bc-470a-5170-8886-846ab8d08470', '739b15a9-75d5-507d-81cb-963e29e782d8', 2, 'Ambient voice transcription and clinical documentation support for NHS clinicians. Does not make clinical decisions.',          'Sarah M.', '2025-01-14T00:00:00Z', 'Clarified ''does not make clinical decisions'' per MHRA guidance feedback.'),
  ('efd95998-c9a2-5e4e-8ad3-03cc91f15f7c', 'd486bc31-b00c-5732-a0ff-ac6e4181ab10', 1, 'Indirect — documentation support only.',                                                                                       'Sarah M.', '2024-09-01T00:00:00Z', 'Initial value'),
  ('5bcfb1b5-40aa-536b-afdc-84f42c437189', 'd486bc31-b00c-5732-a0ff-ac6e4181ab10', 2, 'Indirect — supports documentation workflow only. No real-time clinical decision support.',                                      'Priya K.', '2025-02-20T00:00:00Z', 'Strengthened wording following DCB0129 review.'),
  ('e4a42595-40a4-5ea4-baae-bff98d40084b', 'ff5cc83e-bb96-55ce-8146-42724b60cce9', 1, '8 years',                                                                                                                      'James R.', '2024-09-01T00:00:00Z', 'Initial value'),
  ('3ef3f70d-0ba7-5f80-8ee9-238b23f2d2eb', 'ff5cc83e-bb96-55ce-8146-42724b60cce9', 2, '7 years post last patient contact',                                                                                            'James R.', '2025-03-10T00:00:00Z', 'Updated to align with NHS Records Management Code of Practice 2021.'),
  ('606ab747-4cb2-5b11-a6f3-d6f282a670b9', '53ebf4c8-37de-525e-9bda-af8a420698b0', 1, 'United Kingdom only (Microsoft Azure UK South)',                                                                                'Sarah M.', '2024-09-01T00:00:00Z', 'Initial value'),
  ('df385d9c-9caa-506d-b886-df1c39dfa46f', '53ebf4c8-37de-525e-9bda-af8a420698b0', 2, 'United Kingdom only (Microsoft Azure UK South, UK West failover)',                                                              'Sarah M.', '2024-11-05T00:00:00Z', 'Added failover region detail.'),
  ('d744f060-25be-5f55-827c-5b227d94e7d8', '1a6f5f65-60bd-54ec-9147-3ffe5732fbbf', 1, 'claude-3-5-sonnet-20241022 (Anthropic)',                                                                                       'Priya K.', '2024-09-01T00:00:00Z', 'Initial value'),
  ('30a9e223-ad4c-54e8-81f7-134882842001', '1a6f5f65-60bd-54ec-9147-3ffe5732fbbf', 2, 'claude-sonnet-4-20250514 (Anthropic)',                                                                                         'Priya K.', '2025-06-01T00:00:00Z', 'Model upgraded to claude-sonnet-4.'),
  ('5ae2c708-cdd0-5b3f-a504-446266d9e2b0', '091a2060-74e7-5460-9a23-3379e3bf3580', 1, 'EMIS Web',                                                                                                                     'Priya K.', '2024-09-15T00:00:00Z', 'Initial value'),
  ('085a6e0b-350f-5415-b805-cb335199b562', '091a2060-74e7-5460-9a23-3379e3bf3580', 2, 'EMIS Web, SystmOne',                                                                                                           'Priya K.', '2025-01-20T00:00:00Z', 'SystmOne integration completed.')
on conflict (id) do nothing;

-- ── Document instances ────────────────────────────────────────
-- Document type IDs already seeded in Supabase:
--   clinical-safety-case: 980c7658-e7bf-49c0-ba68-3c3aaf7f15d0
--   avt-registry:         97a43f04-a805-418a-9081-b39820008a1a
--   ig-questionnaire:     2aa73652-278f-4975-ac17-ee7ab6dbbfd8
--   mhra-technical-file:  7581fc7f-8232-4532-8dbc-b6040b2885c4

insert into document_instances (id, org_id, document_type_id, status, stale_reason, created_at, updated_at, submitted_at, approved_at, generated_at) values
  ('4b395ad8-dd61-59a4-942c-29d28c48dc7e', 'f4448f60-cce7-5eca-8671-47d728964261', '980c7658-e7bf-49c0-ba68-3c3aaf7f15d0', 'pending_review', null,                                           '2024-09-15T00:00:00Z', '2025-03-05T00:00:00Z', null,                     null,                     '2025-03-01T00:00:00Z'),
  ('22692d6a-dacc-53b5-8c77-708471018f86', 'f4448f60-cce7-5eca-8671-47d728964261', '2aa73652-278f-4975-ac17-ee7ab6dbbfd8', 'approved',       null,                                           '2024-10-01T00:00:00Z', '2025-02-01T00:00:00Z', null,                     '2025-02-01T00:00:00Z',   '2025-01-20T00:00:00Z'),
  ('af3d34f8-1ce0-5375-8ddf-4e1b58f5dfa9', 'f4448f60-cce7-5eca-8671-47d728964261', '97a43f04-a805-418a-9081-b39820008a1a', 'submitted',      null,                                           '2024-11-01T00:00:00Z', '2025-01-15T00:00:00Z', '2025-01-15T00:00:00Z',   '2025-01-10T00:00:00Z',   '2024-12-20T00:00:00Z'),
  ('463660e5-586c-5107-939f-dc1ca99486c6', '08162fb2-0d45-516a-a3a5-45d7f84c6e90', '2aa73652-278f-4975-ac17-ee7ab6dbbfd8', 'stale',          'data.retention_period fact updated 10 Mar 2025','2024-11-15T00:00:00Z', '2025-03-10T00:00:00Z', null,                     '2025-01-20T00:00:00Z',   '2025-01-10T00:00:00Z'),
  ('55fc585a-2669-5b37-802d-c9d0d876e2fd', '08162fb2-0d45-516a-a3a5-45d7f84c6e90', '980c7658-e7bf-49c0-ba68-3c3aaf7f15d0', 'draft',          null,                                           '2025-01-01T00:00:00Z', '2025-02-01T00:00:00Z', null,                     null,                     null),
  ('9453f59c-7a69-5a0b-8d15-5c7afd6dc65a', 'a19fa246-ad11-5586-9b75-44e429924c41', '980c7658-e7bf-49c0-ba68-3c3aaf7f15d0', 'draft',          null,                                           '2025-01-20T00:00:00Z', '2025-03-15T00:00:00Z', null,                     null,                     null),
  ('ccbc29fc-24e4-5e2d-bae7-9a14a64a638b', 'a19fa246-ad11-5586-9b75-44e429924c41', '2aa73652-278f-4975-ac17-ee7ab6dbbfd8', 'pending_review', null,                                           '2025-02-01T00:00:00Z', '2025-03-20T00:00:00Z', null,                     null,                     '2025-03-10T00:00:00Z'),
  ('e96d987b-e102-5178-8ed4-6d902744a9ef', 'c1bc7431-68b9-5040-8fb1-b8823b76b072', '980c7658-e7bf-49c0-ba68-3c3aaf7f15d0', 'approved',       null,                                           '2024-09-20T00:00:00Z', '2025-01-10T00:00:00Z', null,                     '2025-01-10T00:00:00Z',   '2024-12-15T00:00:00Z'),
  ('306d5a2a-d48d-5292-a40b-43f3fff213ff', 'c1bc7431-68b9-5040-8fb1-b8823b76b072', '97a43f04-a805-418a-9081-b39820008a1a', 'submitted',      null,                                           '2024-10-01T00:00:00Z', '2024-12-01T00:00:00Z', '2024-12-01T00:00:00Z',   '2024-11-25T00:00:00Z',   '2024-11-10T00:00:00Z'),
  ('37fbe085-8016-5a7b-9851-f619580b17e2', 'e245b425-4e4d-575c-9f0e-c26707de78a8', '980c7658-e7bf-49c0-ba68-3c3aaf7f15d0', 'stale',          'clinical.patient_safety_impact fact updated',  '2024-12-10T00:00:00Z', '2025-03-28T00:00:00Z', null,                     null,                     '2025-02-01T00:00:00Z'),
  ('55c238b3-9363-5808-a2b1-ae3c7cceb5d3', 'e245b425-4e4d-575c-9f0e-c26707de78a8', '2aa73652-278f-4975-ac17-ee7ab6dbbfd8', 'approved',       null,                                           '2025-01-01T00:00:00Z', '2025-03-01T00:00:00Z', null,                     '2025-03-01T00:00:00Z',   '2025-02-15T00:00:00Z'),
  ('93355e8f-52af-5455-aa77-5036cc74eb2a', 'c12a8b7d-ff33-59e5-9843-48cb9135945f', '980c7658-e7bf-49c0-ba68-3c3aaf7f15d0', 'submitted',      null,                                           '2024-11-05T00:00:00Z', '2024-12-20T00:00:00Z', '2024-12-20T00:00:00Z',   '2024-12-15T00:00:00Z',   '2024-12-01T00:00:00Z'),
  ('215fa20b-4d7b-502a-aa66-850ec8ed430f', 'c12a8b7d-ff33-59e5-9843-48cb9135945f', '97a43f04-a805-418a-9081-b39820008a1a', 'submitted',      null,                                           '2024-11-10T00:00:00Z', '2024-12-18T00:00:00Z', '2024-12-18T00:00:00Z',   '2024-12-12T00:00:00Z',   '2024-11-28T00:00:00Z')
on conflict (id) do nothing;

-- ── Prompts ───────────────────────────────────────────────────

insert into prompts (id, prompt_key, display_name, status, target_section, output_format, purpose, input_fact_keys, created_at, updated_at) values
  ('d923c58f-1883-5e9c-b723-c0d8050f2f46', 'clinical-safety.crms-intro',            'DCB0129 — CRMS Introduction',          'approved',  'Clinical Risk Management System',     'prose',      'Generates the opening Clinical Risk Management System section for a DCB0129 plan.',        '{"clinical.intended_purpose","clinical.risk_classification","clinical.patient_safety_impact"}', '2024-09-20T00:00:00Z', '2024-12-01T00:00:00Z'),
  ('e305da28-340c-5be9-9513-63fde2cfe1bf', 'clinical-safety.hazard-identification', 'DCB0129 — Hazard Identification',       'approved',  'Hazard Identification',               'structured', 'Produces the hazard identification section using structured hazard analysis.',            '{"clinical.intended_purpose","clinical.patient_safety_impact","mental-health.session_consent_method"}', '2024-09-20T00:00:00Z', '2024-09-20T00:00:00Z'),
  ('a1535fc0-f276-5b44-98d5-7eba3b7ddd03', 'clinical-safety.risk-estimation',       'DCB0129 — Risk Estimation',             'approved',  'Risk Estimation',                     'table',      'Generates risk estimation table with likelihood, severity, and risk rating per hazard.',   '{"clinical.intended_purpose","clinical.patient_safety_impact","clinical.risk_classification"}', '2024-09-20T00:00:00Z', '2024-09-20T00:00:00Z'),
  ('fa3c990f-1588-5254-b3f7-10aacd9b1c50', 'clinical-safety.risk-controls',         'DCB0129 — Risk Controls',               'approved',  'Risk Controls',                       'structured', 'Describes risk control measures for each identified hazard.',                            '{"clinical.intended_purpose","clinical.patient_safety_impact","clinical.risk_classification"}', '2024-10-01T00:00:00Z', '2024-10-01T00:00:00Z'),
  ('15715e8d-5106-5ef4-9a27-1f87cf432e21', 'ig.data-controller',                    'IG — Data Controller Statement',        'approved',  'Data Controller Responsibilities',     'prose',      'Generates the data controller and lawful basis statement for NHS IG questionnaires.',    '{"legal.ico_registration","data.processing_location"}', '2024-10-15T00:00:00Z', '2025-01-10T00:00:00Z'),
  ('060a0c59-7c00-5dbf-b493-25643f17f680', 'ig.retention',                          'IG — Data Retention',                   'approved',  'Data Retention and Deletion',         'prose',      'Generates the retention period and deletion process section.',                           '{"data.retention_period","data.processing_location"}', '2024-10-15T00:00:00Z', '2024-10-15T00:00:00Z'),
  ('80da23f5-44fd-59e1-a951-0c8cd51a5998', 'ig.security',                           'IG — Security Controls',                'approved',  'Security Controls',                   'prose',      'Describes encryption, access control, and certification status.',                        '{"data.encryption_at_rest","data.encryption_in_transit","technical.hosting_provider","technical.ai_model"}', '2024-10-15T00:00:00Z', '2024-10-15T00:00:00Z'),
  ('c937b1e5-7b8f-585c-a007-fe228dd1dc01', 'evidence.pilot',                        'Evidence — Pilot Summary',              'approved',  'Clinical Evidence',                   'prose',      'Summarises NHSE pilot participation and DTAC compliance status.',                        '{"evidence.nhse_pilot","evidence.dtac_status","clinical.risk_classification"}', '2024-11-01T00:00:00Z', '2025-01-20T00:00:00Z'),
  ('c4e5b33a-e4f1-5ec0-96d8-42d90f9876fa', 'ingestion.extraction',                  'Ingestion — Question Extraction',       'approved',  'Ingestion Pipeline',                  'structured', 'Extracts structured questions from uploaded trust documents.',                           '{}', '2024-12-01T00:00:00Z', '2024-12-01T00:00:00Z'),
  ('46c4cfdc-9c59-5001-9477-f8784eb257b6', 'nhse.product-overview',                 'NHSE — Product Overview',               'suggested', 'Product Overview',                    'prose',      'Generates the product overview section for NHSE AVT Registry submissions.',             '{"clinical.intended_purpose","clinical.risk_classification","technical.ai_model","evidence.nhse_pilot","evidence.dtac_status"}', '2025-02-15T00:00:00Z', '2025-02-15T00:00:00Z'),
  ('d961bc4c-8b1e-562a-9bd6-60ed81ec44fc', 'ingestion.answer-draft',                'Ingestion — Answer Drafting',           'suggested', 'Ingestion Pipeline',                  'prose',      'Drafts answers to extracted questions using resolved facts.',                            '{}', '2025-03-01T00:00:00Z', '2025-03-01T00:00:00Z'),
  ('7d66cf85-469e-5b3b-bdd7-d18f34ea3610', 'ig.third-party-processors',             'IG — Third Party Processors',           'rejected',  'Third-Party Processors',              'list',       'Generates list of sub-processors. Rejected — too generic, needs org-specific context.',  '{}', '2025-01-05T00:00:00Z', '2025-01-20T00:00:00Z')
on conflict (id) do nothing;

-- ── Prompt versions ────────────────────────────────────────────

insert into prompt_versions (id, prompt_id, version_number, prompt_text, created_at) values
  ('b6e2888c-84d2-5234-92e0-cb7aec9d5fe1', 'd923c58f-1883-5e9c-b723-c0d8050f2f46', 1,
   'Write the Clinical Risk Management System section for a DCB0129 plan for {{organisation.name}}.

System intended purpose: {{clinical.intended_purpose}}
Risk classification: {{clinical.risk_classification}}

Describe the CRMS framework and scope for this deployment.',
   '2024-09-20T00:00:00Z'),

  ('ad414084-73d5-507f-9fb7-d69558f8dbd9', 'd923c58f-1883-5e9c-b723-c0d8050f2f46', 2,
   'You are a regulatory documentation specialist writing a DCB0129 Clinical Risk Management Plan for an NHS trust.

Organisation: {{organisation.name}} (ODS: {{organisation.ods_code}})
Active modules: {{organisation.active_modules}}
Intended purpose: {{clinical.intended_purpose}}
Risk classification: {{clinical.risk_classification}}
Patient safety impact: {{clinical.patient_safety_impact}}

Write the "Clinical Risk Management System" introductory section for this trust''s DCB0129 CRMP. The section must:
1. State the regulatory framework (DCB0129 v2.4) and that this document is the CRMP
2. Identify the specific trust and which Anathem modules are in scope
3. Describe the scope of the CRMS throughout the deployment lifecycle
4. State the system''s risk classification and intended purpose
5. Explicitly note that the system does not make clinical decisions and does not directly interact with patients

Output: 2–3 formal paragraphs. Regulatory language. No headings. No bullet points. Maximum 300 words.
Do not include caveats about being an AI. Do not speculate beyond the facts provided.',
   '2024-12-01T00:00:00Z'),

  ('5192012e-1ebf-578d-b148-9df43b81ee92', 'e305da28-340c-5be9-9513-63fde2cfe1bf', 1,
   'You are a clinical safety specialist completing a DCB0129 hazard identification for Anathem AVT deployed at {{organisation.name}}.

Intended purpose: {{clinical.intended_purpose}}
Patient safety impact: {{clinical.patient_safety_impact}}
Active modules: {{organisation.active_modules}}
Consent method (mental health): {{mental-health.session_consent_method}}

Identify the top 5 clinical hazards for this deployment. For each hazard provide:
- Hazard ID (H-01 through H-05)
- Hazard description (one sentence)
- Potential clinical harm
- Hazard category (transcription accuracy / consent / EHR integration / workflow / data)

Format as a structured list. Use precise clinical language. Base hazards on the actual intended purpose — do not invent hazards unrelated to ambient voice transcription.',
   '2024-09-20T00:00:00Z'),

  ('1877dcf9-ea9e-5fcb-b1a9-50f0cc90e5ce', '15715e8d-5106-5ef4-9a27-1f87cf432e21', 1,
   'Generate the Data Controller responsibilities section for an NHS IG questionnaire for {{organisation.name}}.

Data controller: The NHS Trust
Data processor: Anathem Ltd
Lawful basis (Art 6): Article 6(1)(e) — public task
Lawful basis (Art 9): Article 9(2)(h) — medical diagnosis and healthcare
ICO registration: {{legal.ico_registration}}

Write 2 paragraphs covering: (1) who is the Data Controller and the legal basis for processing, (2) the Data Processor relationship and what contractual protections are in place. Formal NHS IG tone.',
   '2024-10-15T00:00:00Z'),

  ('5bc19e36-1ebf-5b38-9a25-c8e1f13093ed', '15715e8d-5106-5ef4-9a27-1f87cf432e21', 2,
   'You are completing an NHS IG questionnaire on behalf of {{organisation.name}} regarding the Anathem ambient voice technology deployment.

Organisation: {{organisation.name}} (ODS: {{organisation.ods_code}})
ICO registration: {{legal.ico_registration}}
Data processing location: {{data.processing_location}}

Generate the Data Controller Responsibilities section. Cover:
1. Who acts as Data Controller (the NHS Trust) and why
2. Lawful basis under UK GDPR Article 6 (public task) and Article 9 (healthcare)
3. Role of Anathem Ltd as Data Processor and the DPA in place
4. Data residency confirmation

3 paragraphs. Formal IG language. Reference UK GDPR directly.',
   '2025-01-10T00:00:00Z'),

  ('cc41ccb8-af50-5450-8e16-52b6e174c330', '060a0c59-7c00-5dbf-b493-25643f17f680', 1,
   'Generate the data retention and deletion section for an NHS IG questionnaire for {{organisation.name}}.

Retention period: {{data.retention_period}}
Deletion method: Cryptographic erasure of AES-256 keys
Processing location: {{data.processing_location}}

Describe: (1) the retention period and its regulatory basis, (2) how deletion is carried out and confirmed, (3) that deletion events are logged in the Anathem audit trail.',
   '2024-10-15T00:00:00Z'),

  ('dea48f7a-1410-5ef6-a933-c94725df911d', '80da23f5-44fd-59e1-a951-0c8cd51a5998', 1,
   'Generate the security controls section for an NHS IG questionnaire for {{organisation.name}}.

Encryption at rest: {{data.encryption_at_rest}}
Encryption in transit: {{data.encryption_in_transit}}
Hosting: {{technical.hosting_provider}}
AI model: {{technical.ai_model}}

Cover: encryption standards, access controls (role-based, MFA), infrastructure security, and certifications (ISO 27001, Cyber Essentials Plus, NHS DSPT). Formal security language.',
   '2024-10-15T00:00:00Z'),

  ('d61ee62e-b485-519d-bd12-d0d8775b4fc6', 'c937b1e5-7b8f-585c-a007-fe228dd1dc01', 1,
   'Generate the clinical evidence section for an NHS submission for {{organisation.name}}.

NHSE pilot: {{evidence.nhse_pilot}}
DTAC status: {{evidence.dtac_status}}
Risk classification: {{clinical.risk_classification}}

Summarise: (1) participation in the NHSE AVT Registry pilot, (2) DTAC compliance result, (3) how evidence was gathered. 2 paragraphs.',
   '2024-11-01T00:00:00Z'),

  ('c401703c-82f7-5817-9818-137621f302a6', '46c4cfdc-9c59-5001-9477-f8784eb257b6', 1,
   'Generate the product overview section for an NHSE AVT Registry submission for {{organisation.name}}.

Intended purpose: {{clinical.intended_purpose}}
Risk classification: {{clinical.risk_classification}}
AI model: {{technical.ai_model}}
NHSE pilot: {{evidence.nhse_pilot}}
DTAC: {{evidence.dtac_status}}

Write a clear, factual product overview suitable for NHSE reviewers. 3–4 paragraphs.',
   '2025-02-15T00:00:00Z'),

  ('0eff9767-99f3-52db-a432-6865a2efe836', 'd961bc4c-8b1e-562a-9bd6-60ed81ec44fc', 1,
   'Draft an answer to the following question from a trust IG questionnaire or procurement document.

Question: {{question_text}}
Mapped facts:
{{mapped_facts}}

Write a factual, concise answer using only the facts provided. NHS IG tone. 1–3 paragraphs. Do not speculate.',
   '2025-03-01T00:00:00Z')
on conflict (id) do nothing;

-- ── Audit log ─────────────────────────────────────────────────

insert into audit_log (id, event_type, actor_id, payload, created_at) values
  ('d4471617-d795-510f-a8cf-f7a71fa50466', 'fact.updated',             null, '{"actor":"James R.","actor_role":"editor","category":"knowledge-base","summary":"Updated data.retention_period — global fact changed from 8 years to 7 years post last patient contact","fact_key":"data.retention_period","old_value":"8 years","new_value":"7 years post last patient contact","reason":"Updated to align with NHS Records Management Code of Practice 2021","dependent_documents_flagged":2}', '2025-03-10T09:14:00Z'),
  ('2ac74795-52e7-5c6d-98ea-5d4996a498c2', 'document.stale_flagged',  null, '{"actor":"System","actor_role":"system","category":"document","summary":"2 documents marked stale following update to data.retention_period","fact_key":"data.retention_period"}',                                                                                                                                                                                                                    '2025-03-10T09:14:00Z'),
  ('201838f4-babe-5755-a807-5815e34b094d', 'generation.completed',    null, '{"actor":"Priya K.","actor_role":"editor","category":"generation","summary":"Generated section Safety Claims for BHFT Clinical Safety Case using prompt clinical-safety.crms-intro v2","section":"Safety Claims","prompt_key":"clinical-safety.crms-intro","prompt_version":2}',                                                                                                                              '2025-03-05T14:32:00Z'),
  ('82a3d2e1-ecfc-5bdd-bdba-7304c47b3472', 'document.section_approved','system','{"actor":"Priya K.","actor_role":"editor","category":"document","summary":"Approved section System Overview and Intended Use in BHFT Clinical Safety Case","section":"System Overview and Intended Use"}',                                                                                                                                                                                             '2025-03-05T14:03:00Z'),
  ('9b3d5bba-360d-5d72-8a00-27714bd63dec', 'prompt.version_created',  null, '{"actor":"Priya K.","actor_role":"editor","category":"prompt","summary":"Created new version v3 of ig.data-controller — pending approval","prompt_key":"ig.data-controller","version":3}',                                                                                                                                                                                                           '2025-03-01T10:00:00Z'),
  ('0f84db8d-d9f8-5067-9ced-6e0ed26c94f5', 'fact.created',            null, '{"actor":"James R.","actor_role":"editor","category":"knowledge-base","summary":"Created org-instance fact data.retention_period for Berkshire Healthcare NHS FT","fact_key":"data.retention_period","tier":"org_instance","org":"Berkshire Healthcare NHS FT"}',                                                                                                                                     '2025-02-01T11:22:00Z'),
  ('3828a959-96eb-5082-9117-da13b2c8e419', 'document.approved',       null, '{"actor":"James R.","actor_role":"editor","category":"document","summary":"Document approved: NHS IG Questionnaire for Oxleas NHS FT v1"}',                                                                                                                                                                                                                                                         '2025-02-01T13:10:00Z'),
  ('93acdd53-b01f-5f70-beae-eb60b04940c1', 'org.module_changed',      null, '{"actor":"Sarah M.","actor_role":"admin","category":"organisation","summary":"Neurodevelopmental module activated for Oxleas NHS FT","org":"Oxleas NHS FT","module":"neurodevelopmental","action":"activated"}',                                                                                                                                                                                      '2025-02-01T09:00:00Z'),
  ('47006be6-4e2d-5975-a3ce-9134bea9e456', 'fact.updated',            null, '{"actor":"Priya K.","actor_role":"editor","category":"knowledge-base","summary":"Updated mental-health.ehr_integrations — added SystmOne integration","fact_key":"mental-health.ehr_integrations","old_value":"EMIS Web","new_value":"EMIS Web, SystmOne"}',                                                                                                                                         '2025-01-20T10:45:00Z'),
  ('bade44d5-907e-5c7b-90eb-bfa99996efc1', 'prompt.approved',         null, '{"actor":"Sarah M.","actor_role":"admin","category":"prompt","summary":"Approved prompt ig.data-controller v2","prompt_key":"ig.data-controller","version":2}',                                                                                                                                                                                                                                     '2025-01-10T14:00:00Z'),
  ('9a1e3e4d-3b0e-5f48-9f6e-5e5bd1cc23b5', 'document.submitted',     null, '{"actor":"James R.","actor_role":"editor","category":"document","summary":"Document submitted: NHSE AVT Registry Submission for BHFT"}',                                                                                                                                                                                                                                                            '2025-01-15T11:30:00Z'),
  ('a7759459-00dd-5f96-ab59-55b853f0d0e4', 'fact.updated',            null, '{"actor":"Priya K.","actor_role":"editor","category":"knowledge-base","summary":"Updated clinical.patient_safety_impact — strengthened wording following DCB0129 review","fact_key":"clinical.patient_safety_impact"}',                                                                                                                                                                             '2025-02-20T09:00:00Z'),
  ('a624621d-c085-5c47-a0dd-6634b2215c42', 'org.created',             null, '{"actor":"Sarah M.","actor_role":"admin","category":"organisation","summary":"Organisation created: Central and North West London NHS Foundation Trust","ods_code":"RV3"}',                                                                                                                                                                                                                          '2025-01-15T08:00:00Z'),
  ('4f4905ad-8c9a-577e-b29c-89adc55e163d', 'fact.updated',            null, '{"actor":"Sarah M.","actor_role":"editor","category":"knowledge-base","summary":"Updated clinical.intended_purpose — clarified does not make clinical decisions","fact_key":"clinical.intended_purpose"}',                                                                                                                                                                                          '2025-01-14T09:00:00Z'),
  ('26aef2fa-5cff-5c7d-8beb-0a04319cdd06', 'prompt.rejected',         null, '{"actor":"Sarah M.","actor_role":"admin","category":"prompt","summary":"Rejected prompt ig.third-party-processors v1 — too generic","prompt_key":"ig.third-party-processors","reason":"Prompt output is too generic — does not account for org-specific processor context. Needs redesign."}',                                                                                                       '2025-01-20T15:00:00Z'),
  ('87c638e3-9d2b-5fed-bc5f-a3b8e227eee5', 'document.approved',      null, '{"actor":"Priya K.","actor_role":"editor","category":"document","summary":"Document approved: Clinical Safety Case for Avon and Wiltshire MHP"}',                                                                                                                                                                                                                                                   '2025-01-10T11:00:00Z'),
  ('2e487576-9b7b-5a08-8f2a-77d57efcea3c', 'auth.login',              null, '{"actor":"James R.","actor_role":"editor","category":"auth","summary":"User login: James R."}',                                                                                                                                                                                                                                                                                                    '2025-03-28T08:45:00Z')
on conflict (id) do nothing;

-- ── Ingestion jobs ────────────────────────────────────────────

insert into ingestion_jobs (id, file_name, file_path, org_id, status, uploaded_by, error_message, created_at) values
  ('4fda3771-9f5c-52f8-958a-2f978bee5d06', 'Leeds_Teaching_Hospitals_IG_Questionnaire_v4.pdf', 'ingestion/job-001/Leeds_Teaching_Hospitals_IG_Questionnaire_v4.pdf', null,                                   'review',     'Priya K.', null,                                                                                             '2025-03-18T09:12:00Z'),
  ('89d8cb6f-a8ad-523b-8085-14cc5087944e', 'KingsCollege_Procurement_Response_2025.docx',       'ingestion/job-002/KingsCollege_Procurement_Response_2025.docx',       null,                                   'complete',   'James R.', null,                                                                                             '2025-03-10T14:00:00Z'),
  ('346efeb2-9e01-5a0e-831a-f8fb8a7e970d', 'Manchester_NHSE_AVT_Registry_Addendum.pdf',          'ingestion/job-003/Manchester_NHSE_AVT_Registry_Addendum.pdf',          null,                                   'mapping',    'Sarah M.', null,                                                                                             '2025-03-20T11:45:00Z'),
  ('921270e5-c358-52e2-a4ab-0b1a28fbef4a', 'Sheffield_ClinicalSafety_Supplemental_Q.pdf',        'ingestion/job-004/Sheffield_ClinicalSafety_Supplemental_Q.pdf',        null,                                   'failed',     'James R.', 'Document could not be parsed — scanned PDF without OCR layer. Please upload a text-based PDF or DOCX.', '2025-03-19T16:22:00Z'),
  ('e28d4ed1-dfeb-5b61-98e8-5d13a90ea4f0', 'Oxleas_NHS_FT_IG_v2_Supplemental.docx',             'ingestion/job-005/Oxleas_NHS_FT_IG_v2_Supplemental.docx',             '08162fb2-0d45-516a-a3a5-45d7f84c6e90', 'processing', 'Priya K.', null,                                                                                             '2025-03-21T08:50:00Z')
on conflict (id) do nothing;
