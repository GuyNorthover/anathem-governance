-- ============================================================
-- Anathem Governance Platform — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Facts ────────────────────────────────────────────────────

create table if not exists facts (
  id           text primary key,
  key          text not null unique,
  label        text not null,
  tier         text not null check (tier in ('global', 'module', 'org_instance')),
  domain       text not null check (domain in ('clinical', 'technical', 'data', 'legal', 'evidence')),
  value_type   text not null check (value_type in ('string', 'boolean', 'number', 'date', 'url')),
  current_value text not null,
  module_id    text,
  org_id       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   text not null
);

create table if not exists fact_versions (
  id          text primary key,
  fact_id     text not null references facts(id) on delete cascade,
  version     int not null,
  value       text not null,
  changed_by  text not null,
  changed_at  timestamptz not null,
  reason      text not null,
  unique (fact_id, version)
);

-- ── Organisations ─────────────────────────────────────────────

create table if not exists organisations (
  id             text primary key,
  name           text not null,
  ods_code       text not null unique,
  region         text not null,
  status         text not null default 'active' check (status in ('active', 'inactive', 'onboarding')),
  active_modules text[] not null default '{}',
  created_at     timestamptz not null default now()
);

create table if not exists org_contacts (
  id         text primary key,
  org_id     text not null references organisations(id) on delete cascade,
  name       text not null,
  role       text not null,
  email      text not null,
  is_primary boolean not null default false
);

-- ── Documents ─────────────────────────────────────────────────

create table if not exists documents (
  id               text primary key,
  title            text not null,
  org_id           text references organisations(id),
  category         text not null,
  status           text not null check (status in ('draft', 'pending_review', 'approved', 'submitted', 'stale')),
  framework        text not null,
  modules          text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  stale_reason     text,
  changed_fact_key text
);

create table if not exists document_sections (
  id             text primary key,
  document_id    text not null references documents(id) on delete cascade,
  title          text not null,
  status         text not null check (status in ('draft', 'pending_review', 'approved')),
  generated_at   timestamptz,
  approved_at    timestamptz,
  approved_by    text,
  content        text,
  fact_keys_used text[] not null default '{}',
  sort_order     int not null default 0
);

-- ── Prompts ───────────────────────────────────────────────────

create table if not exists prompts (
  id             text primary key,
  key            text not null unique,
  title          text not null,
  category       text not null,
  status         text not null check (status in ('approved', 'suggested', 'rejected')),
  target_section text not null,
  output_format  text not null check (output_format in ('prose', 'list', 'table', 'structured')),
  purpose        text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists prompt_versions (
  id               text primary key,
  prompt_id        text not null references prompts(id) on delete cascade,
  version          int not null,
  body             text not null,
  fact_keys_used   text[] not null default '{}',
  created_by       text not null,
  created_at       timestamptz not null default now(),
  rejection_reason text,
  unique (prompt_id, version)
);

-- ── Audit log (append-only) ───────────────────────────────────

create table if not exists audit_events (
  id           text primary key,
  type         text not null,
  category     text not null,
  actor        text not null,
  actor_role   text not null,
  timestamp    timestamptz not null,
  summary      text not null,
  detail       jsonb not null default '{}',
  related_id   text,
  related_type text
);

-- Prevent any updates or deletes on audit_events
create or replace function audit_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'audit_events is append-only and cannot be modified';
end;
$$;

drop trigger if exists audit_no_update on audit_events;
create trigger audit_no_update before update on audit_events
  for each row execute function audit_immutable();

drop trigger if exists audit_no_delete on audit_events;
create trigger audit_no_delete before delete on audit_events
  for each row execute function audit_immutable();

-- ── Ingestion ─────────────────────────────────────────────────

create table if not exists ingestion_jobs (
  id               text primary key,
  filename         text not null,
  document_type    text not null,
  org_id           text references organisations(id),
  status           text not null check (status in ('uploading', 'processing', 'mapping', 'review', 'complete', 'failed')),
  uploaded_at      timestamptz not null default now(),
  processed_at     timestamptz,
  uploaded_by      text not null,
  total_questions  int not null default 0,
  drafted_count    int not null default 0,
  approved_count   int not null default 0,
  failure_reason   text
);

create table if not exists ingestion_questions (
  id                  text primary key,
  job_id              text not null references ingestion_jobs(id) on delete cascade,
  index_order         int not null,
  section_label       text,
  question_ref        text,
  question_text       text not null,
  status              text not null check (status in ('pending', 'drafted', 'approved', 'rejected')),
  mapped_fact_keys    text[] not null default '{}',
  mapped_fact_values  jsonb not null default '{}',
  prompt_key          text,
  draft_answer        text,
  approved_answer     text,
  review_note         text
);

-- ── Row Level Security ────────────────────────────────────────
-- Enable RLS — anon key has read access; service role has full access.
-- Extend these policies once auth is wired up.

alter table facts                enable row level security;
alter table fact_versions        enable row level security;
alter table organisations        enable row level security;
alter table org_contacts         enable row level security;
alter table documents            enable row level security;
alter table document_sections    enable row level security;
alter table prompts              enable row level security;
alter table prompt_versions      enable row level security;
alter table audit_events         enable row level security;
alter table ingestion_jobs       enable row level security;
alter table ingestion_questions  enable row level security;

-- Permissive read + write for anon (tighten once auth is live)
do $$
declare t text;
begin
  foreach t in array array[
    'facts','fact_versions','organisations','org_contacts',
    'documents','document_sections','prompts','prompt_versions',
    'audit_events','ingestion_jobs','ingestion_questions'
  ] loop
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all to anon using (true) with check (true)', t);
  end loop;
end $$;
