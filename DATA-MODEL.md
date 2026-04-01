# DATA-MODEL.md — Anathem Regulatory Operations Platform

## Overview

This document defines the complete database schema for the governance platform. The database is PostgreSQL, hosted on Supabase, with row-level security (RLS) enforced throughout.

All tables use UUID primary keys. All tables include `created_at` and `updated_at` timestamps. The audit log is append-only — no updates or deletes.

---

## Entities and relationships

```
organisations
    │
    ├── org_modules (active modules per org)
    │       └── modules
    │
    ├── org_facts (org-instance fact overrides)
    │       └── facts
    │
    └── document_instances
            └── document_types
                    └── document_sections
                            └── section_prompts → prompts
                                    └── prompt_versions

facts
    ├── fact_versions (history)
    ├── fact_document_refs (which doc sections reference this fact)
    └── fact_module_scope (which module a fact belongs to, if not global)

audit_log (append-only)

generation_log (append-only)

users (from auth provider — minimal local record)
```

---

## Table definitions

### `modules`

Anathem product modules. Seeded at setup — not user-editable.

```sql
CREATE TABLE modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key    TEXT NOT NULL UNIQUE,   -- e.g. 'mental-health', 'police'
  display_name  TEXT NOT NULL,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Seed values:
- `mental-health` | Mental Health
- `police` | Police
- `neurodevelopmental` | Neurodevelopmental
- `patient-crm` | Patient CRM

---

### `organisations`

NHS trusts or other deploying organisations.

```sql
CREATE TABLE organisations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  ods_code        TEXT UNIQUE,          -- NHS ODS code where applicable
  region          TEXT,
  status          TEXT NOT NULL DEFAULT 'active',   -- active | inactive | prospect
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `org_modules`

Which modules are active for each organisation. Many-to-many join.

```sql
CREATE TABLE org_modules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES modules(id),
  activated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_by    UUID REFERENCES users(id),
  deactivated_at  TIMESTAMPTZ,          -- NULL = currently active
  UNIQUE (org_id, module_id)
);
```

To get currently active modules for an org:
```sql
SELECT module_id FROM org_modules
WHERE org_id = $1 AND deactivated_at IS NULL;
```

---

### `facts`

The knowledge base. Each row is one atomic fact about Anathem.

```sql
CREATE TABLE facts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_key        TEXT NOT NULL UNIQUE,   -- e.g. 'data.retention_period'
  display_name    TEXT NOT NULL,
  description     TEXT,                  -- what this fact means and where it applies
  domain          TEXT NOT NULL,         -- clinical | technical | data | legal | evidence
  tier            TEXT NOT NULL,         -- global | module | org-instance
  module_id       UUID REFERENCES modules(id),   -- NULL if tier = 'global'
  value_type      TEXT NOT NULL,         -- string | number | boolean | date | enum
  enum_options    TEXT[],                -- if value_type = 'enum', the allowed values
  current_value   TEXT NOT NULL,         -- the current global/module default value
  is_required     BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Note on `current_value`:** For `tier = 'org-instance'`, this column holds the default. Actual org-specific values live in `org_facts`. Resolution order at document generation time: `org_facts` → `facts` (for module-scoped) → `facts` (global).

---

### `fact_versions`

Immutable history of every value a fact has held. Written on every update to `facts.current_value`.

```sql
CREATE TABLE fact_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id         UUID NOT NULL REFERENCES facts(id),
  version_number  INTEGER NOT NULL,
  value           TEXT NOT NULL,
  changed_by      UUID REFERENCES users(id),
  change_reason   TEXT,                  -- required field in the UI
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fact_id, version_number)
);
```

---

### `org_facts`

Org-instance overrides of global or module fact defaults.

```sql
CREATE TABLE org_facts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  fact_id         UUID NOT NULL REFERENCES facts(id),
  value           TEXT NOT NULL,
  set_by          UUID REFERENCES users(id),
  set_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, fact_id)
);
```

---

### `document_types`

Templates for each compliance document type. Maintained by admins.

```sql
CREATE TABLE document_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key        TEXT NOT NULL UNIQUE,   -- e.g. 'clinical-safety-case', 'avt-registry'
  display_name    TEXT NOT NULL,
  description     TEXT,
  framework       TEXT NOT NULL,   -- nhse | trust-ig | mhra | dcb0129 | dcb0160 | other
  version         TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `document_sections`

Sections within each document type. Each section maps to specific facts and a prompt.

```sql
CREATE TABLE document_sections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id    UUID NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
  section_key         TEXT NOT NULL,           -- e.g. 'intended-purpose', 'data-flows'
  display_name        TEXT NOT NULL,
  description         TEXT,
  order_index         INTEGER NOT NULL,
  required_fact_keys  TEXT[] NOT NULL DEFAULT '{}',   -- fact_key values this section depends on
  module_condition    TEXT,                    -- if set, section only included when this module is active
  default_prompt_id   UUID REFERENCES prompts(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_type_id, section_key)
);
```

---

### `prompts`

The prompt library. Prompts are versioned artefacts — never hardcoded in application logic.

```sql
CREATE TABLE prompts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key      TEXT NOT NULL UNIQUE,     -- e.g. 'clinical-safety.intended-purpose.v1'
  display_name    TEXT NOT NULL,
  purpose         TEXT NOT NULL,            -- human-readable description of what this prompt does
  target_section  TEXT,                     -- document_section.section_key it is designed for
  input_fact_keys TEXT[] NOT NULL,          -- which facts this prompt expects as input
  output_format   TEXT NOT NULL,            -- prose | structured | table | list
  status          TEXT NOT NULL DEFAULT 'suggested',   -- suggested | approved
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

See `PROMPTS.md` for the full prompt versioning model.

---

### `prompt_versions`

Every version of every prompt, immutably stored.

```sql
CREATE TABLE prompt_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id       UUID NOT NULL REFERENCES prompts(id),
  version_number  INTEGER NOT NULL,
  prompt_text     TEXT NOT NULL,           -- the full prompt template text
  system_context  TEXT,                    -- optional system message
  change_notes    TEXT,                    -- why this version was created
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version_number)
);
```

---

### `document_instances`

Specific generated documents for a specific organisation.

```sql
CREATE TABLE document_instances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id    UUID NOT NULL REFERENCES document_types(id),
  org_id              UUID NOT NULL REFERENCES organisations(id),
  status              TEXT NOT NULL DEFAULT 'draft',
                      -- draft | pending_review | approved | submitted | stale | superseded
  version_number      INTEGER NOT NULL DEFAULT 1,
  active_modules      TEXT[] NOT NULL,     -- snapshot of org's active modules at generation time
  fact_snapshot       JSONB NOT NULL,      -- snapshot of all resolved facts at generation time
  generated_at        TIMESTAMPTZ,
  generated_by        UUID REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  approved_by         UUID REFERENCES users(id),
  submitted_at        TIMESTAMPTZ,
  submitted_by        UUID REFERENCES users(id),
  submission_notes    TEXT,
  stale_reason        TEXT[],              -- fact_keys that caused this document to become stale
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `document_section_instances`

The content of each section within a generated document instance.

```sql
CREATE TABLE document_section_instances (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_instance_id    UUID NOT NULL REFERENCES document_instances(id) ON DELETE CASCADE,
  section_key             TEXT NOT NULL,
  display_name            TEXT NOT NULL,
  order_index             INTEGER NOT NULL,
  fact_keys_used          TEXT[] NOT NULL,
  prompt_id               UUID REFERENCES prompts(id),
  prompt_version_number   INTEGER,
  raw_generated_content   TEXT,            -- exact LLM output, never modified
  approved_content        TEXT,            -- content after human review (may differ from raw)
  status                  TEXT NOT NULL DEFAULT 'pending',
                          -- pending | generated | approved | manually_written
  reviewed_by             UUID REFERENCES users(id),
  reviewed_at             TIMESTAMPTZ,
  review_notes            TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `ingestion_jobs`

Tracks novel document uploads through the ingestion pipeline.

```sql
CREATE TABLE ingestion_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organisations(id),
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,           -- Supabase storage path
  file_type       TEXT NOT NULL,           -- pdf | docx
  status          TEXT NOT NULL DEFAULT 'uploaded',
                  -- uploaded | extracting | mapping | review | complete | failed
  extracted_questions JSONB,              -- output of extraction step
  error_message   TEXT,
  uploaded_by     UUID REFERENCES users(id),
  completed_at    TIMESTAMPTZ,
  document_instance_id UUID REFERENCES document_instances(id),  -- set on completion
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `ingestion_question_mappings`

Per-question mapping and review state within an ingestion job.

```sql
CREATE TABLE ingestion_question_mappings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_job_id    UUID NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
  question_index      INTEGER NOT NULL,
  question_text       TEXT NOT NULL,
  matched_fact_keys   TEXT[],              -- facts the system matched to this question
  prompt_id           UUID REFERENCES prompts(id),
  prompt_version_number INTEGER,
  raw_generated_content TEXT,
  approved_content    TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
                      -- pending | generated | approved | skipped
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `generation_log`

Immutable record of every AI generation event.

```sql
CREATE TABLE generation_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by        UUID REFERENCES users(id),
  triggered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  context_type        TEXT NOT NULL,       -- document_section | ingestion_question | prompt_suggestion
  context_id          UUID,               -- ID of the section or question being generated
  prompt_id           UUID REFERENCES prompts(id),
  prompt_version_number INTEGER,
  prompt_text_used    TEXT NOT NULL,       -- full prompt as sent (after variable substitution)
  facts_supplied      JSONB NOT NULL,      -- key-value of all facts passed to the prompt
  model               TEXT NOT NULL,       -- e.g. 'claude-sonnet-4-20250514'
  raw_output          TEXT NOT NULL,       -- exact model response
  tokens_input        INTEGER,
  tokens_output       INTEGER,
  duration_ms         INTEGER
);
```

---

### `audit_log`

Append-only record of all significant system events.

```sql
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  -- fact.created | fact.updated | fact.version_created
  -- document.created | document.generated | document.approved | document.submitted | document.stale
  -- prompt.created | prompt.updated | prompt.approved
  -- org.created | org.updated | org.module_changed
  -- ingestion.uploaded | ingestion.completed
  -- user.login | user.logout
  actor_id        UUID REFERENCES users(id),
  actor_email     TEXT,
  target_type     TEXT,                    -- facts | documents | prompts | organisations | users
  target_id       UUID,
  payload         JSONB NOT NULL,          -- event-specific data (old value, new value, etc.)
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent any updates or deletes on audit_log
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;
```

---

### `linked_files`

Links between knowledge base facts and source files in the Anathem codebase (GitHub).

```sql
CREATE TABLE linked_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id         UUID NOT NULL REFERENCES facts(id),
  file_path       TEXT NOT NULL,           -- path in the anathem-web repository
  description     TEXT,                   -- why this file relates to this fact
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `users`

Minimal local user record. Auth is handled by Auth0/Entra — this table stores role and display info only.

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         TEXT NOT NULL UNIQUE,    -- Auth0 or Entra subject ID
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'viewer',   -- admin | editor | viewer
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Key indexes

```sql
-- Fast fact lookup by key
CREATE INDEX idx_facts_key ON facts(fact_key);
CREATE INDEX idx_facts_domain ON facts(domain);
CREATE INDEX idx_facts_tier ON facts(tier);

-- Fast org-level queries
CREATE INDEX idx_org_facts_org ON org_facts(org_id);
CREATE INDEX idx_org_modules_org ON org_modules(org_id);

-- Document pipeline queries
CREATE INDEX idx_doc_instances_org ON document_instances(org_id);
CREATE INDEX idx_doc_instances_status ON document_instances(status);
CREATE INDEX idx_doc_instances_type ON document_instances(document_type_id);

-- Stale detection: which document instances reference a given fact_key
-- Uses GIN index on the fact_snapshot JSONB
CREATE INDEX idx_doc_instances_fact_snapshot ON document_instances USING GIN(fact_snapshot);

-- Audit log queries
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- Generation log queries
CREATE INDEX idx_generation_log_prompt ON generation_log(prompt_id);
CREATE INDEX idx_generation_log_triggered_by ON generation_log(triggered_by);
CREATE INDEX idx_generation_log_triggered_at ON generation_log(triggered_at DESC);

-- Ingestion
CREATE INDEX idx_ingestion_jobs_org ON ingestion_jobs(org_id);
CREATE INDEX idx_ingestion_jobs_status ON ingestion_jobs(status);
```

---

## Row-level security (Supabase RLS)

All tables have RLS enabled. Policies:

- `admin` role: full access to all tables
- `editor` role: read/write facts, documents, prompts, organisations, ingestion; cannot delete audit_log or generation_log
- `viewer` role: read-only on all tables except audit_log (no access)

RLS is enforced via the `users.role` value passed through the Supabase auth context. Implementation uses Supabase's built-in auth.uid() combined with a role lookup.

---

## Fact resolution function

This function resolves the correct value for a given fact in the context of a specific organisation and its active modules. Used at document generation time.

```sql
CREATE OR REPLACE FUNCTION resolve_fact(
  p_fact_key TEXT,
  p_org_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_fact_id UUID;
  v_org_value TEXT;
  v_global_value TEXT;
BEGIN
  -- Get the fact id
  SELECT id, current_value INTO v_fact_id, v_global_value
  FROM facts WHERE fact_key = p_fact_key;

  -- Check for org-instance override
  SELECT value INTO v_org_value
  FROM org_facts
  WHERE org_id = p_org_id AND fact_id = v_fact_id;

  -- Return org override if it exists, otherwise global default
  RETURN COALESCE(v_org_value, v_global_value);
END;
$$ LANGUAGE plpgsql;
```

---

## Document staleness detection

When a fact is updated, run this query to find all affected document instances:

```sql
-- Find document instances whose fact_snapshot contains the updated fact_key
SELECT id, org_id, document_type_id, status
FROM document_instances
WHERE
  status NOT IN ('submitted', 'superseded')
  AND fact_snapshot ? $1   -- $1 = the updated fact_key
```

Then update all returned instances to `status = 'stale'` and write to the audit log.
