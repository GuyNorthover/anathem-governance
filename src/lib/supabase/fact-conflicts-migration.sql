-- Fact Conflicts table
-- Created when a document import proposes a different value for an existing fact
-- Human must resolve: keep existing, use proposed, or type a custom value

create table if not exists fact_conflicts (
  id text primary key,
  fact_key text not null,
  fact_id text references facts(id) on delete cascade,
  existing_value text not null,
  proposed_value text not null,
  source_document text,
  source_type text not null default 'document_seed',
  status text not null default 'pending',
    -- pending | resolved_keep_existing | resolved_use_new | resolved_manual
  resolved_value text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table fact_conflicts enable row level security;
create policy "anon_all" on fact_conflicts for all using (true) with check (true);

create index if not exists fact_conflicts_status_idx on fact_conflicts(status);
create index if not exists fact_conflicts_fact_key_idx on fact_conflicts(fact_key);
