create table if not exists public.daily_operations_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  operating_date date not null,
  health_score smallint not null check (health_score between 0 and 100),
  red_measures integer not null default 0 check (red_measures >= 0),
  open_actions integer not null default 0 check (open_actions >= 0),
  overdue_actions integer not null default 0 check (overdue_actions >= 0),
  customer_orders_at_risk integer not null default 0 check (customer_orders_at_risk >= 0),
  financial_exposure numeric(14,2) not null default 0 check (financial_exposure >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists daily_operations_snapshots_id_org_uidx
  on public.daily_operations_snapshots(id, organization_id);
create index if not exists daily_operations_snapshots_org_date_idx
  on public.daily_operations_snapshots(organization_id, operating_date desc, submitted_at desc);

create table if not exists public.daily_operations_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  metric_key text not null check (char_length(metric_key) between 1 and 100),
  category text not null check (category in ('safety','quality','delivery','cost','people')),
  metric_name text not null check (char_length(metric_name) between 1 and 220),
  target_value numeric(16,4) not null default 0,
  actual_value numeric(16,4) not null default 0,
  unit text not null default '' check (char_length(unit) <= 40),
  direction text not null default 'higher' check (direction in ('higher','lower')),
  status text not null check (status in ('green','yellow','red')),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  note text not null default '' check (char_length(note) <= 3000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_operations_metrics_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.daily_operations_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, metric_key)
);

create index if not exists daily_operations_metrics_org_status_idx
  on public.daily_operations_metrics(organization_id, category, status);

create table if not exists public.daily_operations_meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  meeting_key text not null check (char_length(meeting_key) between 1 and 100),
  tier text not null check (tier in ('tier_1','tier_2','tier_3')),
  meeting_date date not null,
  start_time time,
  leader_name text not null default '' check (char_length(leader_name) <= 160),
  attendees jsonb not null default '[]'::jsonb check (jsonb_typeof(attendees) = 'array'),
  department text not null default '' check (char_length(department) <= 160),
  line_name text not null default '' check (char_length(line_name) <= 200),
  shift_name text not null default '' check (char_length(shift_name) <= 80),
  meeting_status text not null default 'planned' check (meeting_status in ('planned','in_progress','completed','cancelled')),
  notes text not null default '' check (char_length(notes) <= 6000),
  decisions text not null default '' check (char_length(decisions) <= 6000),
  completed_at timestamptz,
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_operations_meetings_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.daily_operations_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, meeting_key)
);

create index if not exists daily_operations_meetings_org_tier_idx
  on public.daily_operations_meetings(organization_id, meeting_date desc, tier, meeting_status);

create table if not exists public.daily_operations_handoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  handoff_key text not null check (char_length(handoff_key) between 1 and 100),
  handoff_date date not null,
  from_shift text not null default '' check (char_length(from_shift) <= 80),
  to_shift text not null default '' check (char_length(to_shift) <= 80),
  outgoing_supervisor text not null default '' check (char_length(outgoing_supervisor) <= 160),
  incoming_supervisor text not null default '' check (char_length(incoming_supervisor) <= 160),
  production_completed text not null default '' check (char_length(production_completed) <= 6000),
  work_in_process text not null default '' check (char_length(work_in_process) <= 6000),
  equipment_condition text not null default '' check (char_length(equipment_condition) <= 6000),
  quality_holds text not null default '' check (char_length(quality_holds) <= 6000),
  material_shortages text not null default '' check (char_length(material_shortages) <= 6000),
  customer_priorities text not null default '' check (char_length(customer_priorities) <= 6000),
  safety_concerns text not null default '' check (char_length(safety_concerns) <= 6000),
  temporary_changes text not null default '' check (char_length(temporary_changes) <= 6000),
  open_actions text not null default '' check (char_length(open_actions) <= 6000),
  acknowledged boolean not null default false,
  acknowledged_by text not null default '' check (char_length(acknowledged_by) <= 160),
  acknowledged_at timestamptz,
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_operations_handoffs_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.daily_operations_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, handoff_key)
);

create unique index if not exists daily_operations_handoffs_id_org_uidx
  on public.daily_operations_handoffs(id, organization_id);
create index if not exists daily_operations_handoffs_org_ack_idx
  on public.daily_operations_handoffs(organization_id, handoff_date desc, acknowledged);

create table if not exists public.daily_operations_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  action_key text not null check (char_length(action_key) between 1 and 100),
  action_title text not null check (char_length(action_title) between 1 and 500),
  category text not null check (category in ('safety','quality','delivery','cost','people')),
  priority text not null default 'moderate' check (priority in ('low','moderate','high','critical')),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  due_date date,
  action_status text not null default 'open' check (action_status in ('open','in_progress','blocked','verification','closed')),
  escalation_tier text not null default 'tier_1' check (escalation_tier in ('tier_1','tier_2','tier_3')),
  department text not null default '' check (char_length(department) <= 160),
  customer_order text not null default '' check (char_length(customer_order) <= 200),
  financial_exposure numeric(14,2) not null default 0 check (financial_exposure >= 0),
  source_name text not null default '' check (char_length(source_name) <= 240),
  linked_tool text not null default '' check (char_length(linked_tool) <= 100),
  linked_record text not null default '' check (char_length(linked_record) <= 160),
  verification text not null default '' check (char_length(verification) <= 6000),
  completion_authority text not null default '' check (char_length(completion_authority) <= 160),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_operations_actions_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.daily_operations_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, action_key)
);

create unique index if not exists daily_operations_actions_id_org_uidx
  on public.daily_operations_actions(id, organization_id);
create index if not exists daily_operations_actions_org_due_idx
  on public.daily_operations_actions(organization_id, action_status, priority, due_date);

create table if not exists public.daily_operations_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  handoff_id uuid,
  action_id uuid,
  entity_type text not null check (entity_type in ('handoff','action')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint daily_operations_evidence_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.daily_operations_snapshots(id, organization_id)
    on delete cascade,
  constraint daily_operations_evidence_handoff_org_fkey
    foreign key (handoff_id, organization_id)
    references public.daily_operations_handoffs(id, organization_id)
    on delete cascade,
  constraint daily_operations_evidence_action_org_fkey
    foreign key (action_id, organization_id)
    references public.daily_operations_actions(id, organization_id)
    on delete cascade,
  check ((entity_type = 'handoff' and handoff_id is not null) or (entity_type = 'action' and action_id is not null))
);

create index if not exists daily_operations_evidence_org_idx
  on public.daily_operations_evidence(organization_id, entity_type, created_at desc);

alter table public.daily_operations_snapshots enable row level security;
alter table public.daily_operations_metrics enable row level security;
alter table public.daily_operations_meetings enable row level security;
alter table public.daily_operations_handoffs enable row level security;
alter table public.daily_operations_actions enable row level security;
alter table public.daily_operations_evidence enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['daily_operations_snapshots','daily_operations_metrics','daily_operations_meetings','daily_operations_handoffs','daily_operations_actions']
  loop
    execute format('drop policy if exists %I_select_member on public.%I', table_name, table_name);
    execute format('create policy %I_select_member on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name, table_name);
    execute format('drop policy if exists %I_insert_editor on public.%I', table_name, table_name);
    execute format('create policy %I_insert_editor on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
    execute format('drop policy if exists %I_update_editor on public.%I', table_name, table_name);
    execute format('create policy %I_update_editor on public.%I for update to authenticated using ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[]))) with check ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
  end loop;
end $$;

drop policy if exists daily_operations_evidence_select_member on public.daily_operations_evidence;
create policy daily_operations_evidence_select_member on public.daily_operations_evidence
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists daily_operations_evidence_insert_editor on public.daily_operations_evidence;
create policy daily_operations_evidence_insert_editor on public.daily_operations_evidence
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

revoke all on public.daily_operations_snapshots, public.daily_operations_metrics, public.daily_operations_meetings, public.daily_operations_handoffs, public.daily_operations_actions, public.daily_operations_evidence from anon, authenticated;
grant select, insert, update on public.daily_operations_snapshots, public.daily_operations_metrics, public.daily_operations_meetings, public.daily_operations_handoffs, public.daily_operations_actions to authenticated;
grant select, insert on public.daily_operations_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'daily-operations-evidence',
  'daily-operations-evidence',
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

drop policy if exists daily_operations_objects_select_member on storage.objects;
create policy daily_operations_objects_select_member on storage.objects
for select to authenticated
using (
  bucket_id = 'daily-operations-evidence'
  and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
);

drop policy if exists daily_operations_objects_insert_editor on storage.objects;
create policy daily_operations_objects_insert_editor on storage.objects
for insert to authenticated
with check (
  bucket_id = 'daily-operations-evidence'
  and (select private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner','admin','member']::public.organization_role[]
  ))
);
