# CLAUDE.md — Anathem Regulatory Operations Platform

## Purpose of this file

This file is the primary context document for Claude Code when working on the Anathem Regulatory Operations Platform (`apps/governance`). Read this file in full before writing any code. It describes what this system is, why it exists, its constraints, and the rules that govern how it must be built.

---

## What this system is

The Anathem Regulatory Operations Platform is an internal governance tool for Anathem, a regulated medical device company building ambient voice technology (AVT) for NHS clinical documentation.

Anathem must produce and maintain a large body of compliance documentation for:
- NHS England (NHSE AVT Registry submission)
- NHS trusts (per-organisation clinical safety cases, IG questionnaires, procurement responses)
- MHRA (SaMD technical file, post-market surveillance)
- NHS Digital Clinical Safety standards (DCB0129 hazard log, DCB0160 deployment assurance)

The core problem this system solves: **the same underlying facts about the Anathem product must be expressed differently across dozens of documents, for different organisations, at different times.** Without this system, that means manually re-entering the same information repeatedly, with no audit trail and high risk of inconsistency.

This system provides:
- A single structured knowledge base of facts about Anathem
- A document generation engine that populates templates from those facts
- An ingestion pipeline for novel trust documents (upload → AI maps and drafts answers)
- A prompt control layer with versioning and audit trail
- A change propagation system that flags stale documents when facts change
- A trust pipeline tracker showing document status per organisation

---

## What this system is NOT

- It is not a patient-facing system
- It is not a clinical tool
- It does not handle PHI (patient health information)
- It is not a replacement for human clinical safety review — all generated content requires human approval before use
- PMS (post-market surveillance) is deferred to Phase 2 and must not be built in Phase 1

---

## Monorepo position

This system is `apps/governance` within the `anathem-web` monorepo. It follows all conventions established in `apps/mental-health`, which is the reference implementation.

**Before writing any new feature, locate the equivalent pattern in `apps/mental-health` and mirror it.**

Key conventions that must be followed without exception:
- All API calls go through `/api/proxy` — never directly to backend URLs
- Auth tokens come from `sessionStorage` via `appendHeader` from `@anathem/auth/utils` — never hardcode tokens
- Route constants live in `src/config/routes.ts`
- API wrappers live in `src/resources/hooks/`
- Role gating uses `Guard` + `makeAuth` + `AppRoleView` from `@anathem/access`
- UI components come from `@anathem/shadcn`, `@anathem/ui`, `@anathem/sidebar` — do not introduce ad-hoc component libraries
- Generated files in `packages/resources/src/*/generated_endpoints/` must never be hand-edited
- New npm dependencies go in the app `package.json` only, using `workspace:*` for internal packages

---

## Tech stack

| Concern | Technology |
|---|---|
| Framework | Next.js App Router |
| Package manager | pnpm (workspace) |
| Task runner | Turborepo |
| Node | >=20.9.0 |
| Auth | Auth0 / Microsoft Entra ID (via `@anathem/auth`) |
| Data fetching | React Query (`@tanstack/react-query`) |
| Client state | Zustand (`src/stores/zustand/`) |
| UI components | `@anathem/shadcn`, `@anathem/ui`, `@anathem/sidebar` |
| Styling | Tailwind v4 + `cn` from `@anathem/ui/utils` |
| Icons | `lucide-react`, `@heroicons/react` |
| Forms | `@anathem/dynamic-form` |
| Charts | `@anathem/charts` |
| AI generation | Anthropic Claude API (claude-sonnet-4-20250514) |
| Database | Supabase (PostgreSQL) |

---

## Roles in this system

This system has three roles:

| Role | Access |
|---|---|
| `admin` | Full access — manage knowledge base, approve prompts, manage all orgs |
| `editor` | Create and edit facts, draft documents, run generation — cannot approve prompts |
| `viewer` | Read-only access to documents and trust pipeline |

Role gating follows the `makeAuth` + `Guard` pattern from `apps/mental-health`.

---

## Critical design rules

### 1. Human approval is always required before generated content is used
No AI-generated text may be marked as "approved" or included in a submitted document without a human review and explicit approval action. This is a regulatory requirement, not a preference.

### 2. Every generation event must be logged
When Claude generates text, the system must record: which prompt was used, which version, which facts were supplied, the raw output, the timestamp, and the user who triggered it. This log is immutable.

### 3. Prompts are versioned artefacts
Prompts live in the database as versioned records. They are never hardcoded in application logic. When a prompt is updated, the old version is retained. Generated documents record which prompt version produced them.

### 4. Facts have a three-tier hierarchy — always respect it
- **Global facts**: apply to all deployments of Anathem
- **Module facts**: apply only when a specific Anathem module is active
- **Org-instance facts**: per-organisation values that override global defaults

When generating a document for a specific organisation, always resolve facts in this order: org-instance → module (for active modules) → global. Never use a global fact when an org-instance override exists.

### 5. Documents become stale when their dependent facts change
When a fact is updated, all documents that reference that fact must be flagged as `stale`. A stale document must not be submitted until it has been reviewed and regenerated or manually confirmed.

### 6. The change log is append-only
No record in the change log may be deleted or modified. Every fact change, prompt version, and document generation event is permanently recorded.

---

## Module structure (Phase 1)

Anathem has the following product modules. Each module has its own scoped facts:

- `mental-health` — Mental health clinician product
- `police` — Police product
- `neurodevelopmental` — Autism and ADHD assessment (CAMHS)
- `patient-crm` — Patient CRM portal

An organisation may deploy one or more modules. Documents generated for that organisation must only include sections relevant to their active modules.

---

## App directory structure

```
apps/governance/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (mirrors mental-health)
│   │   ├── knowledge-base/         # Fact management
│   │   ├── documents/              # Document registry and generation
│   │   ├── organisations/          # Trust/org management and pipeline
│   │   ├── prompts/                # Prompt library management
│   │   ├── ingestion/              # Novel document upload and mapping
│   │   └── audit/                  # Audit log viewer
│   ├── components/                 # Feature components
│   ├── config/
│   │   └── routes.ts               # All path constants
│   ├── resources/
│   │   └── hooks/                  # React Query wrappers for all API calls
│   └── stores/
│       ├── context/                # Auth and user context
│       └── zustand/                # Client state stores
```

---

## Checklist before committing any new feature

- [ ] Routes registered in `src/config/routes.ts`
- [ ] API calls go through `/api/proxy` via generated client or hooks in `src/resources/hooks/`
- [ ] No hardcoded tokens or backend URLs
- [ ] Role gating uses `Guard` + `makeAuth`
- [ ] UI uses only `@anathem/shadcn`, `@anathem/ui`, `@anathem/sidebar`
- [ ] Generated content has a human approval step
- [ ] Generation events are logged
- [ ] Fact changes trigger stale flags on dependent documents
- [ ] No hand-edits to `packages/resources/src/*/generated_endpoints/`

---

## Related MD files

- `ARCHITECTURE.md` — full system design, data model, and module descriptions
- `DATA-MODEL.md` — database schema and entity relationships
- `PROMPTS.md` — prompt control layer design, versioning, and audit requirements
