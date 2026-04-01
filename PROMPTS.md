# PROMPTS.md — Prompt Control Layer

## Purpose

This document defines how prompts are designed, stored, versioned, approved, and used within the Anathem Regulatory Operations Platform.

Prompts are regulatory artefacts. They determine how the system translates structured knowledge base facts into compliance document language. If the MHRA, NHS Digital, or an NHS trust questions how a piece of generated content was produced, this system must be able to provide a complete, auditable answer — including the exact prompt used, the facts supplied to it, and the raw output before any human editing.

This document is prescriptive. All developers building features that involve AI generation must follow these rules without exception.

---

## Principles

### 1. Prompts are never hardcoded
No prompt text may appear in application code. All prompts live in the database in the `prompts` and `prompt_versions` tables. Application code references prompts by `prompt_key` only.

### 2. Prompts are versioned and immutable
When a prompt is updated, a new version is created. The previous version is retained permanently. A generated document records which prompt version was used to produce each section. This means any document can be fully reproduced or audited at any time.

### 3. Only approved prompts may generate content
A prompt in `suggested` status may be viewed and edited but may not be used to generate document content. An `admin` or `editor` must review and approve it first. Approval is a deliberate action — not automatic.

### 4. The generation log is the evidence base
Every call to the Claude API is recorded in `generation_log` with: the full prompt text as sent, the facts supplied, the model, the raw output, the user who triggered it, and timing information. This log is immutable.

### 5. Human review is always required
Raw generated content (`raw_generated_content`) is never the final content. It must pass through a human review step where it is accepted, edited, or rejected. The `approved_content` field holds the final approved text, which may differ from the raw output. The difference between the two is preserved.

---

## Prompt structure

Each prompt record in the database has:

| Field | Description |
|---|---|
| `prompt_key` | Unique identifier, e.g. `clinical-safety.intended-purpose.v1` |
| `display_name` | Human-readable name, e.g. "Intended Purpose — Clinical Safety Case" |
| `purpose` | Plain English description of what this prompt produces and why |
| `target_section` | The `document_section.section_key` this prompt is designed for |
| `input_fact_keys` | Array of fact keys this prompt expects as input variables |
| `output_format` | `prose` / `structured` / `table` / `list` |
| `status` | `suggested` / `approved` |
| `approved_by` | User ID of the approver |
| `approved_at` | Timestamp of approval |

Each prompt version record has:

| Field | Description |
|---|---|
| `version_number` | Monotonically increasing integer |
| `prompt_text` | The full prompt template, with `{{fact_key}}` placeholders |
| `system_context` | Optional system message (e.g. regulatory context, output constraints) |
| `change_notes` | Why this version was created — required |

---

## Prompt template syntax

Prompts use double-brace placeholder syntax for fact injection:

```
{{fact_key}}
```

Example prompt:

```
You are a regulatory writer producing a clinical safety case for {{organisation.name}},
an NHS trust deploying the Anathem {{module.display_name}} module.

Anathem is classified as a {{regulatory.mhra_classification}} Software as a Medical Device.
Its intended purpose is: {{clinical.intended_purpose}}

The data retention period agreed with this organisation is {{data.retention_period}}.

Write the "Intended Purpose" section of the clinical safety case in formal regulatory
language suitable for submission under DCB0129. The section should:
- Define the intended clinical purpose of the device
- Identify the intended user population
- Describe the clinical context of use
- State the data scope and retention in this deployment

Output format: prose paragraphs, formal register, 300-500 words.
Do not include headings. Do not include caveats about being an AI.
```

Before the prompt is sent to the Claude API, the system substitutes all `{{fact_key}}` placeholders with the resolved fact values for the target organisation. The substituted prompt text is stored in `generation_log.prompt_text_used`.

---

## Fact injection rules

When generating content for a specific organisation:

1. Collect all `input_fact_keys` from the selected prompt
2. For each key, resolve the fact value using the three-tier hierarchy:
   - Org-instance override (from `org_facts`) if it exists
   - Module-scoped fact (from `facts` where `tier = 'module'`) if the module is active
   - Global fact (from `facts` where `tier = 'global'`) as default
3. If any required fact key cannot be resolved, halt generation and surface an error: "Missing fact: {{fact_key}} — please complete the knowledge base before generating this section"
4. Supply resolved facts as a structured context block prepended to the prompt, plus inline via `{{placeholder}}` substitution
5. Log the complete resolved fact set in `generation_log.facts_supplied`

---

## The suggest → review → approve workflow

### Step 1: Suggestion
When the system needs a prompt for a document section or ingestion question that has no approved prompt:
- Claude generates a suggested prompt based on: the document type, section description, and relevant facts
- The suggested prompt is saved to the database with `status = 'suggested'`
- An in-app notification is sent to admins and editors: "New prompt suggestion requires review"
- The suggestion is visible in the Prompt Library with a "Pending Review" badge

### Step 2: Review
An admin or editor opens the suggested prompt and sees:
- The generated prompt text
- Which facts it references
- The target section it is designed for
- The output format
- A test generation panel: they can run the prompt against a test organisation to see example output before approving

### Step 3: Edit (optional)
Before approving, the reviewer may edit the prompt text. Edits are tracked — the reviewer sees a diff between the suggested text and their edited version. If they edit, the `change_notes` field is required.

### Step 4: Approve
The reviewer clicks Approve. The prompt status changes to `approved`. It is now available for document generation. The approval is recorded in the audit log.

### Rejection
If a suggested prompt is not fit for purpose, the reviewer may reject it with a reason. Rejected prompts are retained in the database (not deleted) and marked `rejected`. A rejection notification is sent.

---

## Prompt versioning workflow

When an approved prompt needs to be updated:

1. Editor opens the approved prompt in the Prompt Library
2. Clicks "Create New Version"
3. Edits the prompt text — sees a diff against the current approved version
4. Provides change notes (required — cannot submit without)
5. Saves — the new version enters `suggested` status
6. An admin reviews and approves the new version
7. On approval: the new version becomes active; the previous version is retained and marked as superseded
8. Any document instances that used the previous prompt version are flagged for review (not automatically marked stale, but flagged for human consideration)

**Version numbers never reset.** If a prompt has had three versions, the next version is always version 4.

---

## Prompt categories

Prompts are organised into categories matching the document domains:

| Category | Description |
|---|---|
| `clinical-safety` | DCB0129 / trust clinical safety case sections |
| `intended-purpose` | Intended purpose and intended user descriptions |
| `data-flows` | Data processing, storage, retention, transfer descriptions |
| `risk-management` | Hazard identification, risk assessment, mitigation |
| `evidence` | Clinical evidence summaries, validation descriptions |
| `avt-registry` | NHSE AVT Registry specific sections |
| `ig-questionnaire` | Information governance and DSPT-related questions |
| `ingestion-mapping` | Prompts used during novel document question extraction |
| `ingestion-drafting` | Prompts used to draft answers during ingestion |

---

## System prompt (global context)

All generation calls include a global system prompt prepended before the section-specific prompt. This provides regulatory context that should never need to change frequently:

```
You are a regulatory documentation assistant for Anathem, a UK-based Software as a
Medical Device (SaMD) company producing ambient voice technology for NHS clinical
documentation.

Your outputs will be used in formal regulatory submissions to NHS trusts, NHS England,
and the MHRA. You must:

- Write in formal, precise regulatory language
- Be factually accurate and never speculate or extrapolate beyond the facts provided
- Never include statements that are not supported by the facts supplied to you
- Never qualify your output with phrases like "as an AI" or "I should note"
- Never include placeholder text, instructions, or meta-commentary in your output
- If a required fact is missing or unclear, state explicitly what information is needed
  rather than making assumptions

The facts supplied to you are authoritative. Do not supplement them with general
knowledge about NHS systems, clinical practice, or regulatory requirements unless
you are specifically asked to do so.
```

This system prompt is stored as a special prompt record with `prompt_key = 'system.global-context'`. It follows the same versioning and approval rules as all other prompts.

---

## Audit requirements for generated content

Every piece of generated content in a submitted document must be traceable to:

1. The `generation_log` entry (generation_log.id)
2. The prompt used (prompt_id + version_number)
3. The facts supplied (generation_log.facts_supplied — full key-value snapshot)
4. The raw LLM output (generation_log.raw_output)
5. The approved content (document_section_instances.approved_content)
6. The reviewer who approved it (document_section_instances.reviewed_by)
7. The timestamp of approval (document_section_instances.reviewed_at)

This full chain must be accessible from any document instance via the audit UI. It is the evidence base for regulatory inspection.

---

## Prompt Library UI requirements

The Prompt Library screen must show:

- All prompts, filterable by: category, status (suggested/approved/rejected), target section, module
- For each prompt: name, purpose, status badge, version number, last updated, approved by
- Click to open: full prompt text, fact dependencies, version history, test generation panel
- Actions: Create new prompt | Edit (creates new version) | Approve | Reject | View generation history

**Test generation panel:** Allows reviewer to select a test organisation, resolve facts, and run the prompt against the Claude API to see example output — without creating a real generation log entry. Test runs are marked as `test = true` in the generation log and excluded from regulatory audit views.

---

## What Claude Code must never do

- Do not hardcode any prompt text in application code
- Do not call the Claude API without first fetching the prompt from the database
- Do not use a prompt with `status != 'approved'` for real document generation
- Do not skip logging to `generation_log`
- Do not modify `generation_log.raw_output` after it is written
- Do not allow `approved_content` to be set without a corresponding `reviewed_by` and `reviewed_at`
- Do not use the latest prompt version automatically if a document section already has an approved version — prompt version changes require explicit user action
