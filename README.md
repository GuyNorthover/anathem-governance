# Anathem Governance

Internal regulatory operations platform for Anathem — a regulated medical device company building ambient voice technology (AVT) for NHS clinical documentation.

## What this is

This app (`apps/governance`) provides:

- **Knowledge base** — a single structured store of facts about the Anathem product
- **Document generation** — templates populated from facts, with AI-assisted drafting via Claude
- **Trust pipeline** — per-organisation document status tracker
- **Ingestion** — upload novel trust documents and AI-map them to known facts
- **Prompt library** — versioned prompt management with full audit trail
- **Audit log** — immutable record of every generation event and fact change

## Who uses it

Internal Anathem staff only. Three roles: `admin`, `editor`, `viewer`.

## Where to start

- `CLAUDE.md` — build conventions and critical design rules
- `ARCHITECTURE.md` — system design and module descriptions
- `DATA-MODEL.md` — database schema
- `PROMPTS.md` — prompt control layer design
- `ANATHEM-INTEGRATION.md` — monorepo integration guide

## Tech stack

Next.js App Router · Supabase · React Query · Tailwind v4 · Auth0/Entra ID
