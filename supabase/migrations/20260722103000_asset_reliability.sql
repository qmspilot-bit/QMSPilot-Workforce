create table if not exists public.asset_reliability_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  reliability_score smallint not null check (reliability_score between 0 and 100),
  uptime_percent numeric(6,2) not null default 100 check (uptime_percent between 0 and 100),
  pm_compliance_percent numeric(6,2) not null default 100 check (pm_compliance_percent between 0 and 100),
  downtime_hours numeric(12,2) not null default 0 check (downtime_hours >= 0),
  downtime_cost numeric(14,2) not null default 0 check (downtime_cost >= 0),
  open_work_orders integer not null default 0 check (open_work_orders >= 0),
  overdue_pm integer not null default 0 check (overdue_pm >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists asset_reliability_snapshots_id_org_uidx
  on public.asset_reliability_snapshots(id, organization_id);
create index if not exists asset_reliability_snapshots_org_date_idx
  on public.asset_reliability_snapshots(organization_id, submitted_at desc);

create table if not exists public.asset_reliability_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  asset_code text not null check (char_length(asset_code) between 1 and 80),
  asset_name text not null check (char_length(asset_name) between 1 and 200),
  category text not null default '' check (char_length(category) <= 120),
  department text not null default '' check (char_length(department) <= 160),
  production_area text not null default '' check (char_length(production_area) <= 160),
  manufacturer text not null default '' check (char_length(manufacturer) <= 160),
  model text not null default '' check (char_length(model) <= 160),
  serial_number text not null default '' check (char_length(serial_number) <= 160),
  install_date date,
  asset_owner text not null default '' check (char_length(asset_owner) <= 160),
  maintenance_owner text not null default '' check (char_length(maintenance_owner) <= 160),
  criticality text not null default 'moderate' check (criticality in ('low','moderate','high','business_critical')),
  operating_status text not null default 'available' check (operating_status in ('available','restricted','down','retired')),
  backup_available boolean not null default false,
  replacement_lead_days integer not null default 0 check (replacement_lead_days >= 0),
  hourly_capacity_value numeric(14,2) not null default 0 check (hourly_capacity_value >= 0),
  photo_name text not null default '' check (char_length(photo_name) <= 255),
  manual_names jsonb not null default '[]'::jsonb check (jsonb_typeof(manual_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asset_reliability_assets_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.asset_reliability_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, asset_code)
);

create unique index if not exists asset_reliability_assets_id_org_uidx
  on public.asset_reliability_assets(id, organization_id);
create index if not exists asset_reliability_assets_org_status_idx
  on public.asset_reliability_assets(organization_id, operating_status, criticality, department);

create table if not exists public.asset_reliability_pm_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  asset_id uuid not null,
  plan_key text not null check (char_length(plan_key) between 1 and 80),
  title text not null check (char_length(title) between 1 and 240),
  trigger_type text not null check (trigger_type in ('calendar','runtime','cycles','condition')),
  frequency_value numeric(12,2) not null default 1 check (frequency_value > 0),
  frequency_unit text not null default 'months' check (frequency_unit in ('days','weeks','months','hours','cycles','condition')),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  last_completed date,
  next_due date,
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  plan_status text not null default 'active' check (plan_status in ('active','inactive')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asset_reliability_pm_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.asset_reliability_snapshots(id, organization_id)
    on delete cascade,
  constraint asset_reliability_pm_asset_org_fkey
    foreign key (asset_id, organization_id)
    references public.asset_reliability_assets(id, organization_id)
    on delete cascade,
  unique (snapshot_id, asset_id, plan_key)
);

create unique index if not exists asset_reliability_pm_id_org_uidx
  on public.asset_reliability_pm_plans(id, organization_id);
create index if not exists asset_reliability_pm_org_due_idx
  on public.asset_reliability_pm_plans(organization_id, next_due, plan_status);

create table if not exists public.asset_reliability_work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  asset_id uuid not null,
  work_order_number text not null check (char_length(work_order_number) between 1 and 80),
  work_type text not null check (work_type in ('preventive','corrective','emergency','inspection')),
  priority text not null default 'moderate' check (priority in ('low','moderate','high','critical')),
  work_status text not null default 'open' check (work_status in ('open','in_progress','awaiting_parts','verification','closed')),
  description text not null default '' check (char_length(description) <= 6000),
  reported_by text not null default '' check (char_length(reported_by) <= 160),
  assigned_to text not null default '' check (char_length(assigned_to) <= 160),
  opened_at timestamptz,
  estimated_return timestamptz,
  failure_mode text not null default '' check (char_length(failure_mode) <= 2000),
  safety_risk boolean not null default false,
  quality_risk boolean not null default false,
  production_impact text not null default '' check (char_length(production_impact) <= 3000),
  customer_orders text not null default '' check (char_length(customer_orders) <= 2000),
  quantity_at_risk numeric(14,2) not null default 0 check (quantity_at_risk >= 0),
  downtime_start timestamptz,
  downtime_end timestamptz,
  downtime_hours numeric(12,2) not null default 0 check (downtime_hours >= 0),
  labor_hours numeric(12,2) not null default 0 check (labor_hours >= 0),
  parts_cost numeric(14,2) not null default 0 check (parts_cost >= 0),
  external_cost numeric(14,2) not null default 0 check (external_cost >= 0),
  estimated_total_cost numeric(14,2) not null default 0 check (estimated_total_cost >= 0),
  repair_action text not null default '' check (char_length(repair_action) <= 6000),
  root_cause text not null default '' check (char_length(root_cause) <= 6000),
  verification text not null default '' check (char_length(verification) <= 6000),
  maintenance_approved boolean not null default false,
  operations_approved boolean not null default false,
  quality_approved boolean not null default false,
  returned_to_service_at timestamptz,
  recommended_handoff text not null default '' check (char_length(recommended_handoff) <= 160),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asset_reliability_wo_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.asset_reliability_snapshots(id, organization_id)
    on delete cascade,
  constraint asset_reliability_wo_asset_org_fkey
    foreign key (asset_id, organization_id)
    references public.asset_reliability_assets(id, organization_id)
    on delete cascade,
  unique (snapshot_id, work_order_number)
);

create unique index if not exists asset_reliability_wo_id_org_uidx
  on public.asset_reliability_work_orders(id, organization_id);
create index if not exists asset_reliability_wo_org_status_idx
  on public.asset_reliability_work_orders(organization_id, work_status, priority, opened_at desc);

create table if not exists public.asset_reliability_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  asset_id uuid,
  work_order_id uuid,
  entity_type text not null check (entity_type in ('asset','work_order')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint asset_reliability_evidence_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.asset_reliability_snapshots(id, organization_id)
    on delete cascade,
  constraint asset_reliability_evidence_asset_org_fkey
    foreign key (asset_id, organization_id)
    references public.asset_reliability_assets(id, organization_id)
    on delete cascade,
  constraint asset_reliability_evidence_wo_org_fkey
    foreign key (work_order_id, organization_id)
    references public.asset_reliability_work_orders(id, organization_id)
    on delete cascade,
  check ((entity_type = 'asset' and asset_id is not null) or (entity_type = 'work_order' and work_order_id is not null))
);

create index if not exists asset_reliability_evidence_org_idx
  on public.asset_reliability_evidence(organization_id, entity_type, created_at desc);

alter table public.asset_reliability_snapshots enable row level security;
alter table public.asset_reliability_assets enable row level security;
alter table public.asset_reliability_pm_plans enable row level security;
alter table public.asset_reliability_work_orders enable row level security;
alter table public.asset_reliability_evidence enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['asset_reliability_snapshots','asset_reliability_assets','asset_reliability_pm_plans','asset_reliability_work_orders']
  loop
    execute format('drop policy if exists %I_select_member on public.%I', table_name, table_name);
    execute format('create policy %I_select_member on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name, table_name);
    execute format('drop policy if exists %I_insert_editor on public.%I', table_name, table_name);
    execute format('create policy %I_insert_editor on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
    execute format('drop policy if exists %I_update_editor on public.%I', table_name, table_name);
    execute format('create policy %I_update_editor on public.%I for update to authenticated using ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[]))) with check ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
  end loop;
end $$;

drop policy if exists asset_reliability_evidence_select_member on public.asset_reliability_evidence;
create policy asset_reliability_evidence_select_member on public.asset_reliability_evidence
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists asset_reliability_evidence_insert_editor on public.asset_reliability_evidence;
create policy asset_reliability_evidence_insert_editor on public.asset_reliability_evidence
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

revoke all on public.asset_reliability_snapshots, public.asset_reliability_assets, public.asset_reliability_pm_plans, public.asset_reliability_work_orders, public.asset_reliability_evidence from anon, authenticated;
grant select, insert, update on public.asset_reliability_snapshots, public.asset_reliability_assets, public.asset_reliability_pm_plans, public.asset_reliability_work_orders to authenticated;
grant select, insert on public.asset_reliability_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asset-reliability-evidence',
  'asset-reliability-evidence',
  false,
  31457280,
  array[
    'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv','text/plain','image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists asset_reliability_objects_select_member on storage.objects;
create policy asset_reliability_objects_select_member on storage.objects
for select to authenticated
using (
  bucket_id = 'asset-reliability-evidence'
  and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
);

drop policy if exists asset_reliability_objects_insert_editor on storage.objects;
create policy asset_reliability_objects_insert_editor on storage.objects
for insert to authenticated
with check (
  bucket_id = 'asset-reliability-evidence'
  and (select private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner','admin','member']::public.organization_role[]
  ))
);
