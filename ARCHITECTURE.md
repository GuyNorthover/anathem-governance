# ARCHITECTURE.md — Anathem Regulatory Operations Platform

## Overview

This document is the canonical system design for the Anathem Regulatory Operations Platform (`apps/governance`). It describes all major system components, their responsibilities, how they interact, and the principles that govern their design.

This document is a living reference. When the system evolves, this document must be updated first. Code must reflect this document — not the other way around.

---

## System purpose

Anathem is a regulated Software as a Medical Device (SaMD) company. It must produce and maintain compliance documentation for multiple regulatory frameworks simultaneously:

| Framework | Key documents |
|---|---|
| NHSE AVT Registry | Product submission, evidence base, clinical safety summary |
| NHS trust procurement | IG questionnaires, clinical safety cases, data processing agreements |
| MHRA SaMD | Technical file, intended purpose, risk management file |
| DCB0129 / DCB0160 | Hazard log, clinical risk management plan, deployment assurance |

The same underlying product facts must be expressed differently across all of these. The governance platform maintains those facts once and generates or populates documents from them — with full version control, audit trail, and human approval gates throughout.

---

## Core modules (Phase 1)

### 1. Knowledge Base

The knowledge base is the single source of truth for all facts about Anathem. It is structured, versioned, and semantically tagged.

**Facts are not free-text blobs.** Each fact is an atomic, typed record with:
- A unique key (e.g. `data.retention_period`)
- A value (typed: string, number, boolean, date, enumerated list)
- A domain tag (see below)
- A tier (global / module / org-instance)
- A version history (every previous value retained)
- A list of document sections that reference this fact
- A list of related facts (relationships)
- Created by, last modified by, last modified at

**Domain tags:**
- `clinical` — clinical function, intended purpose, patient safety
- `technical` — architecture, integrations, infrastructure
- `data` — data flows, retention, storage, processing
- `legal` — regulatory status, certifications, contractual terms
- `evidence` — clinical evidence, validation studies, literature

**Three-tier fact hierarchy:**

```
global facts          Apply to all deployments of Anathem everywhere
    │
module facts          Apply only when a specific module is active for an org
    │                 (mental-health, police, neurodevelopmental, patient-crm)
    │
org-instance facts    Per-organisation values — override global defaults
```

When resolving a fact for a specific organisation + module combination, resolution order is:
1. Org-instance fact (highest priority — always wins)
2. Module fact (if the module is active for this org)
3. Global fact (fallback default)

This means: if BHFT has a specific data retention period configured, that value is used for all BHFT documents — regardless of the global default.

---

### 2. Document Registry

The document registry manages all compliance document types and their instances.

**Document types** are templates: they define the structure of a document, the sections it contains, and which facts each section depends on. Document types are maintained by admins.

**Document instances** are specific generated documents for a specific organisation. They have:
- A document type
- An organisation
- A set of active modules (inherited from the org at generation time)
- A snapshot of the fact values used at generation time
- A status: `draft` / `pending_review` / `approved` / `submitted` / `stale`
- A version number
- A complete generation log

**Stale detection:** When a fact is updated, the system queries all document instances that reference that fact. Each is marked `stale`. A stale document cannot be submitted until it has been reviewed and either regenerated or manually confirmed as still accurate.

**Document sections** each have:
- A title
- The facts it depends on (fact keys, resolved for the specific org)
- The prompt used to generate its content
- The generated content (raw LLM output)
- The approved content (after human review)
- Generation log entry

---

### 3. Document Ingestion Pipeline

This module handles novel trust documents — forms that Anathem has not seen before and that do not have a pre-built template.

**Flow:**

```
1. User uploads document (PDF or Word)
        │
2. System extracts all questions / sections using Claude
        │
3. For each question:
   a. Semantic search against knowledge base to find relevant facts
   b. Select best-fit prompt from prompt library (or flag as needing new prompt)
   c. Generate draft answer using selected prompt + resolved facts
        │
4. User reviews each question:
   - Sees: extracted question | matched facts | selected prompt | generated answer
   - Can: approve answer | edit answer | change fact mapping | change prompt
        │
5. On full approval: assembled document stored as a document instance
        │
6. Document instance linked to organisation, versioned, logged
```

**Key principle:** At step 4, the user always sees the full reasoning chain — not just the answer. They must be able to understand *why* the system produced that answer before approving it.

---

### 4. Prompt Control Layer

Prompts are first-class artefacts in this system. They are never hardcoded in application logic.

See `PROMPTS.md` for the full specification. Summary:

- Prompts live in the database as versioned records
- Each prompt has a purpose, target document section type, input fact keys, output format, and status (`suggested` / `approved`)
- Only approved prompts may be used in document generation
- When Claude suggests a new prompt, it enters the system as `suggested` — an admin or editor must review and approve it before it can be used
- Every generation event records: prompt ID, prompt version, facts supplied, raw output, timestamp, user
- Prompt versions are immutable once created — updates create new versions

---

### 5. Change Propagation

When any fact in the knowledge base changes:

1. The new value is written as a new version (old value retained)
2. The change is recorded in the audit log with: old value, new value, changed by, timestamp, reason
3. All document instances that reference this fact key are queried
4. Each is marked `stale`
5. The user who made the change sees a summary: "This change affects N documents across M organisations"
6. Affected document owners are notified (in-app notification; email in Phase 2)

**GitHub / MD file integration (Phase 1):** When a commit to the Anathem codebase touches a file that is linked to a knowledge base fact, a review flag is raised in the governance system. This is a webhook-triggered notification, not automatic propagation. A human reviews whether the code change requires a fact update.

Full automatic bi-directional sync between the codebase and the knowledge base is deferred to Phase 2.

---

### 6. Organisation & Trust Pipeline

Each organisation (NHS trust or other deploying body) has a record containing:

- Organisation name, ODS code, region
- Active Anathem modules
- Org-instance facts (overrides of global/module defaults)
- Assigned contacts
- Document pipeline: all document instances for this org, with status
- Submission history

**Pipeline view:** The pipeline shows, per organisation, which documents are current / stale / in review / submitted / expired. This is the primary operational view for managing trust relationships.

**Module activation:** When a module is activated or deactivated for an organisation, all documents for that org are re-evaluated for staleness, since module-scoped facts may now apply or no longer apply.

---

### 7. Audit Log

The audit log is append-only and immutable. It records every significant event in the system:

- Fact created / updated (with old and new values)
- Document instance created / generated / approved / submitted / marked stale
- Prompt created / updated / approved
- Generation event (prompt + facts + output)
- User login / logout
- Organisation created / updated / module changed

The audit log is the evidence base for regulatory inspection. It must never be truncated, edited, or deleted. In Phase 2, it will feed directly into PMS periodic reports.

---

## Data flow diagrams

### New document generation

```
User selects: Organisation + Document Type
        │
System resolves facts:
  global facts
  + module facts (for org's active modules)
  + org-instance facts (overrides)
        │
For each document section:
  fetch approved prompt for this section type
  supply resolved facts as context
  call Claude API
  store raw output + generation log
        │
Present draft to user for section-by-section review
        │
User approves / edits each section
        │
Document instance saved as status: approved
        │
User submits to trust → status: submitted
```

### Fact update propagation

```
User updates fact value
        │
System writes new version (old retained)
        │
Audit log entry created
        │
Query: which document instances reference this fact key?
        │
All matching instances → status: stale
        │
User sees: "X documents now stale across Y orgs"
        │
For each stale document:
  owner notified
  document locked from submission until reviewed
```

### Novel document ingestion

```
User uploads PDF / Word document
        │
Claude extracts questions and section structure
        │
For each question:
  semantic search → relevant facts
  prompt library lookup → best-fit prompt
  Claude generates draft answer
        │
User review interface:
  question | matched facts | prompt used | draft answer
  [Approve] [Edit] [Re-map facts] [Change prompt]
        │
All sections approved
        │
Document instance created and stored
```

---

## Integration points

### Anthropic Claude API
- Model: `claude-sonnet-4-20250514`
- Used for: document section generation, novel document question extraction, fact-to-question mapping, prompt suggestion
- All calls are logged with input, output, model, timestamp
- API key stored in environment variables — never in code

### Supabase
- PostgreSQL database for all structured data
- Row-level security (RLS) enforced for multi-user access
- Realtime subscriptions for stale document notifications
- Storage bucket for uploaded documents (encrypted at rest)

### GitHub (Phase 1 — webhook only)
- Incoming webhook from anathem-web repository
- On push to main: check changed files against linked-file registry
- If match found: raise review flag in governance system
- No outbound writes to the repository from this system in Phase 1

### Microsoft Entra ID / Auth0
- Authentication via `@anathem/auth` — same as all other Anathem apps
- No custom auth logic in `apps/governance`

---

## Phase 2 scope (not to be built in Phase 1)

- Post-market surveillance (PMS) module: incident logging, PSUR generation, trend monitoring
- Automatic bi-directional sync between knowledge base and GitHub MD files
- Email notifications for stale documents and review reminders
- Client-facing document portal (allowing trusts to submit questionnaires directly)
- API access for external systems

---

## Anathem product modules (reference)

| Module ID | Display name | Description |
|---|---|---|
| `mental-health` | Mental Health | Clinician-facing AVT for mental health consultations |
| `police` | Police | AVT for police custody and interview workflows |
| `neurodevelopmental` | Neurodevelopmental | CAMHS autism and ADHD assessment support |
| `patient-crm` | Patient CRM | Patient-facing portal and CRM integration |

Each module has its own scoped facts in the knowledge base. A new module requires: a module record, its scoped facts, and document section templates that conditionally include module-specific content.
