-- Business Case Reference Library: completed cases from other trusts used for learning
create table if not exists bc_reference_cases (
  id           text primary key,
  org_name     text not null,
  filename     text not null,
  uploaded_at  timestamptz not null default now(),
  uploaded_by  text not null default 'admin',
  status       text not null default 'processing' check (status in ('processing', 'analysed', 'failed')),
  structure    jsonb,   -- extracted section hierarchy
  full_text    text,    -- full extracted text for generation use
  section_count int,
  error_message text
);

-- Business Case Projects: a trust's active business case development
create table if not exists bc_projects (
  id                   text primary key,
  org_name             text not null,
  template_filename    text not null,
  template_structure   jsonb,  -- sections found in the blank template
  status               text not null default 'drafting' check (status in ('drafting', 'needs_data', 'completing', 'complete')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  reference_case_ids   text[] not null default '{}'
);

-- Sections within a project
create table if not exists bc_sections (
  id                        text primary key,
  project_id                text not null references bc_projects(id) on delete cascade,
  section_key               text not null,
  title                     text not null,
  template_guidance         text,   -- original guidance from the blank template
  draft_content             text,   -- AI-drafted content from reference cases
  final_content             text,   -- completed content after user provides data
  status                    text not null default 'drafted' check (status in ('drafted', 'needs_data', 'complete')),
  sort_order                int not null default 0,
  data_requests             jsonb not null default '[]'
  -- data_requests is array of: { field, label, description, type, required, provided_value }
);

-- RLS
alter table bc_reference_cases enable row level security;
alter table bc_projects        enable row level security;
alter table bc_sections        enable row level security;

drop policy if exists "anon_all" on bc_reference_cases;
create policy "anon_all" on bc_reference_cases for all to anon using (true) with check (true);
drop policy if exists "anon_all" on bc_projects;
create policy "anon_all" on bc_projects for all to anon using (true) with check (true);
drop policy if exists "anon_all" on bc_sections;
create policy "anon_all" on bc_sections for all to anon using (true) with check (true);
