create table if not exists public.value_ledger_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  ledger_date date not null,
  fiscal_year text not null default '' check (char_length(fiscal_year) <= 20),
  value_score smallint not null check (value_score between 0 and 100),
  actual_operational_loss numeric(18,2) not null default 0,
  verified_realized_value numeric(18,2) not null default 0,
  net_realized_value numeric(18,2) not null default 0,
  value_pipeline numeric(18,2) not null default 0,
  qmspilot_investment numeric(18,2) not null default 0,
  qmspilot_roi numeric(14,4) not null default 0,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists value_ledger_snapshots_id_org_uidx on public.value_ledger_snapshots(id, organization_id);
create index if not exists value_ledger_snapshots_org_date_idx on public.value_ledger_snapshots(organization_id, ledger_date desc, submitted_at desc);

create table if not exists public.value_ledger_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  rate_key text not null check (char_length(rate_key) between 1 and 100),
  rate_code text not null check (char_length(rate_code) between 1 and 100),
  rate_name text not null check (char_length(rate_name) between 1 and 220),
  category text not null default 'labor' check (category in ('labor','downtime','inspection','rework','sorting','freight','field_service','scrap','other')),
  site text not null default '' check (char_length(site) <= 160),
  department text not null default '' check (char_length(department) <= 160),
  unit_name text not null default '' check (char_length(unit_name) <= 120),
  amount numeric(18,4) not null default 0,
  effective_date date not null,
  source_name text not null default '' check (char_length(source_name) <= 5000),
  financial_owner text not null default '' check (char_length(financial_owner) <= 180),
  approval_status text not null default 'draft' check (approval_status in ('draft','under_review','approved','retired')),
  review_date date,
  note text not null default '' check (char_length(note) <= 5000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  archived boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint value_ledger_rates_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.value_ledger_snapshots(id, organization_id) on delete cascade,
  unique (snapshot_id, rate_key),
  unique (snapshot_id, rate_code)
);
create unique index if not exists value_ledger_rates_id_org_uidx on public.value_ledger_rates(id, organization_id);
create index if not exists value_ledger_rates_org_status_idx on public.value_ledger_rates(organization_id, approval_status, category, effective_date desc);

create table if not exists public.value_ledger_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  event_key text not null check (char_length(event_key) between 1 and 100),
  event_number text not null check (char_length(event_number) between 1 and 100),
  event_date date not null,
  title text not null check (char_length(title) between 1 and 300),
  event_type text not null check (event_type in ('actual_cost','recovered_cost','verified_savings','avoided_cost','revenue_protected')),
  loss_category text not null default 'internal_failure' check (loss_category in ('internal_failure','external_failure','supplier_failure','downtime','delivery','productivity','customer_retention','prevention','appraisal','other')),
  source_tool text not null default 'manual' check (char_length(source_tool) <= 120),
  source_record text not null default '' check (char_length(source_record) <= 180),
  site text not null default '' check (char_length(site) <= 160),
  department text not null default '' check (char_length(department) <= 160),
  customer_name text not null default '' check (char_length(customer_name) <= 220),
  supplier_name text not null default '' check (char_length(supplier_name) <= 220),
  product_name text not null default '' check (char_length(product_name) <= 300),
  asset_name text not null default '' check (char_length(asset_name) <= 300),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  financial_owner text not null default '' check (char_length(financial_owner) <= 180),
  approved_amount numeric(18,2) not null default 0,
  forecast_amount numeric(18,2) not null default 0,
  implementation_cost numeric(18,2) not null default 0,
  baseline_period text not null default '' check (char_length(baseline_period) <= 300),
  baseline_value numeric(18,4) not null default 0,
  current_value numeric(18,4) not null default 0,
  volume_adjustment text not null default '' check (char_length(volume_adjustment) <= 5000),
  calculation_basis text not null default '' check (char_length(calculation_basis) <= 10000),
  realization_start date,
  realization_months integer not null default 12 check (realization_months >= 0 and realization_months <= 120),
  event_status text not null default 'identified' check (event_status in ('identified','estimated','under_review','financially_validated','implemented','realization_in_progress','verified','rejected','closed')),
  validation_note text not null default '' check (char_length(validation_note) <= 10000),
  financial_reviewer text not null default '' check (char_length(financial_reviewer) <= 180),
  validation_date date,
  confidence smallint not null default 50 check (confidence between 0 and 100),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  archived boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint value_ledger_events_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.value_ledger_snapshots(id, organization_id) on delete cascade,
  unique (snapshot_id, event_key),
  unique (snapshot_id, event_number)
);
create unique index if not exists value_ledger_events_id_org_uidx on public.value_ledger_events(id, organization_id);
create index if not exists value_ledger_events_org_type_idx on public.value_ledger_events(organization_id, event_type, event_status, event_date desc);
create index if not exists value_ledger_events_org_source_idx on public.value_ledger_events(organization_id, source_tool, source_record);

create table if not exists public.value_ledger_realizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  realization_key text not null check (char_length(realization_key) between 1 and 100),
  event_id uuid not null,
  period_month date not null,
  forecast_amount numeric(18,2) not null default 0,
  actual_amount numeric(18,2) not null default 0,
  realization_status text not null default 'forecast' check (realization_status in ('forecast','reported','under_review','verified','rejected')),
  benefit_owner text not null default '' check (char_length(benefit_owner) <= 180),
  financial_reviewer text not null default '' check (char_length(financial_reviewer) <= 180),
  verification_note text not null default '' check (char_length(verification_note) <= 10000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint value_ledger_realizations_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.value_ledger_snapshots(id, organization_id) on delete cascade,
  constraint value_ledger_realizations_event_org_fkey foreign key (event_id, organization_id) references public.value_ledger_events(id, organization_id) on delete cascade,
  unique (snapshot_id, realization_key),
  unique (snapshot_id, event_id, period_month)
);
create unique index if not exists value_ledger_realizations_id_org_uidx on public.value_ledger_realizations(id, organization_id);
create index if not exists value_ledger_realizations_org_period_idx on public.value_ledger_realizations(organization_id, period_month desc, realization_status);

create table if not exists public.value_ledger_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  rate_id uuid,
  event_id uuid,
  realization_id uuid,
  entity_type text not null check (entity_type in ('rate','event','realization')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) <= 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  constraint value_ledger_evidence_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.value_ledger_snapshots(id, organization_id) on delete cascade,
  constraint value_ledger_evidence_rate_org_fkey foreign key (rate_id, organization_id) references public.value_ledger_rates(id, organization_id) on delete cascade,
  constraint value_ledger_evidence_event_org_fkey foreign key (event_id, organization_id) references public.value_ledger_events(id, organization_id) on delete cascade,
  constraint value_ledger_evidence_realization_org_fkey foreign key (realization_id, organization_id) references public.value_ledger_realizations(id, organization_id) on delete cascade,
  check ((entity_type = 'rate' and rate_id is not null) or (entity_type = 'event' and event_id is not null) or (entity_type = 'realization' and realization_id is not null))
);
create index if not exists value_ledger_evidence_org_entity_idx on public.value_ledger_evidence(organization_id, entity_type, uploaded_at desc);

alter table public.value_ledger_snapshots enable row level security;
alter table public.value_ledger_rates enable row level security;
alter table public.value_ledger_events enable row level security;
alter table public.value_ledger_realizations enable row level security;
alter table public.value_ledger_evidence enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['value_ledger_snapshots','value_ledger_rates','value_ledger_events','value_ledger_realizations']
  loop
    execute format('drop policy if exists %I_select_member on public.%I', table_name, table_name);
    execute format('create policy %I_select_member on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name, table_name);
    execute format('drop policy if exists %I_insert_editor on public.%I', table_name, table_name);
    execute format('create policy %I_insert_editor on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
    execute format('drop policy if exists %I_update_editor on public.%I', table_name, table_name);
    execute format('create policy %I_update_editor on public.%I for update to authenticated using ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[]))) with check ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
  end loop;
end $$;

drop policy if exists value_ledger_evidence_select_member on public.value_ledger_evidence;
create policy value_ledger_evidence_select_member on public.value_ledger_evidence for select to authenticated using ((select private.is_org_member(organization_id)));
drop policy if exists value_ledger_evidence_insert_editor on public.value_ledger_evidence;
create policy value_ledger_evidence_insert_editor on public.value_ledger_evidence for insert to authenticated with check (uploaded_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

revoke all on public.value_ledger_snapshots, public.value_ledger_rates, public.value_ledger_events, public.value_ledger_realizations, public.value_ledger_evidence from anon, authenticated;
grant select, insert, update on public.value_ledger_snapshots, public.value_ledger_rates, public.value_ledger_events, public.value_ledger_realizations to authenticated;
grant select, insert on public.value_ledger_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('value-ledger-evidence','value-ledger-evidence',false,41943040,array['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists value_ledger_storage_select on storage.objects;
create policy value_ledger_storage_select on storage.objects for select to authenticated using (bucket_id = 'value-ledger-evidence' and (select private.is_org_member((storage.foldername(name))[1]::uuid)));
drop policy if exists value_ledger_storage_insert on storage.objects;
create policy value_ledger_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'value-ledger-evidence' and (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','admin','member']::public.organization_role[])));
