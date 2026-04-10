-- ============================================================
-- EU MDR Template Library — Migration
-- Run in Supabase SQL Editor after the base schema.sql
-- ============================================================

-- eu_document_instances: tracks which templates have been populated for which org
create table if not exists eu_document_instances (
  id             text primary key,
  template_slug  text not null,
  template_title text not null,
  category       text not null,
  org_id         uuid references organisations(id),
  status         text not null default 'draft'
                   check (status in ('draft', 'pending_review', 'approved', 'submitted')),
  generated_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  notes          text
);

-- eu_document_sections: one row per question/answer pair
create table if not exists eu_document_sections (
  id             text primary key,
  instance_id    text not null references eu_document_instances(id) on delete cascade,
  question_text  text not null,
  answer         text,
  status         text not null default 'draft'
                   check (status in ('draft', 'approved')),
  fact_keys_used text[] not null default '{}',
  generated_at   timestamptz,
  approved_at    timestamptz,
  approved_by    text,
  sort_order     int  not null default 0
);

-- ── Row-level security ────────────────────────────────────────────────────────
-- Permissive for anon while auth is being wired up; tighten once Auth0 is live.

alter table eu_document_instances enable row level security;
alter table eu_document_sections   enable row level security;

drop policy if exists "anon_all" on eu_document_instances;
create policy "anon_all" on eu_document_instances
  for all to anon using (true) with check (true);

drop policy if exists "anon_all" on eu_document_sections;
create policy "anon_all" on eu_document_sections
  for all to anon using (true) with check (true);
