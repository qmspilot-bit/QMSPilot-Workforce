create table if not exists public.delivery_assurance_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  assurance_date date not null,
  assurance_score smallint not null check (assurance_score between 0 and 100),
  active_orders integer not null default 0 check (active_orders >= 0),
  orders_at_risk integer not null default 0 check (orders_at_risk >= 0),
  late_orders integer not null default 0 check (late_orders >= 0),
  revenue_scheduled numeric(16,2) not null default 0 check (revenue_scheduled >= 0),
  revenue_at_risk numeric(16,2) not null default 0 check (revenue_at_risk >= 0),
  average_readiness smallint not null default 0 check (average_readiness between 0 and 100),
  open_blockers integer not null default 0 check (open_blockers >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists delivery_assurance_snapshots_id_org_uidx on public.delivery_assurance_snapshots(id, organization_id);
create index if not exists delivery_assurance_snapshots_org_date_idx on public.delivery_assurance_snapshots(organization_id, assurance_date desc, submitted_at desc);

create table if not exists public.delivery_assurance_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  order_key text not null check (char_length(order_key) between 1 and 100),
  order_number text not null check (char_length(order_number) between 1 and 120),
  customer_name text not null check (char_length(customer_name) between 1 and 220),
  customer_account_code text not null default '' check (char_length(customer_account_code) <= 120),
  part_number text not null default '' check (char_length(part_number) <= 180),
  description text not null default '' check (char_length(description) <= 5000),
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  order_value numeric(16,2) not null default 0 check (order_value >= 0),
  promise_date date not null,
  planned_start date,
  planned_completion date,
  actual_completion date,
  actual_shipment date,
  priority text not null default 'standard' check (priority in ('standard','expedite','customer_recovery','executive')),
  strategic boolean not null default false,
  production_area text not null default '' check (char_length(production_area) <= 180),
  work_center text not null default '' check (char_length(work_center) <= 180),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  current_operation text not null default '' check (char_length(current_operation) <= 500),
  percent_complete smallint not null default 0 check (percent_complete between 0 and 100),
  estimated_hours numeric(12,2) not null default 0 check (estimated_hours >= 0),
  remaining_hours numeric(12,2) not null default 0 check (remaining_hours >= 0),
  order_status text not null default 'planned' check (order_status in ('planned','released','in_progress','blocked','quality_hold','ready_to_ship','shipped','closed')),
  readiness_score smallint not null default 0 check (readiness_score between 0 and 100),
  readiness jsonb not null default '{}'::jsonb check (jsonb_typeof(readiness) = 'object'),
  required_qualifications text not null default '' check (char_length(required_qualifications) <= 5000),
  required_assets text not null default '' check (char_length(required_assets) <= 5000),
  required_measurements text not null default '' check (char_length(required_measurements) <= 5000),
  required_documents text not null default '' check (char_length(required_documents) <= 5000),
  material_requirements text not null default '' check (char_length(material_requirements) <= 5000),
  shipment_requirements text not null default '' check (char_length(shipment_requirements) <= 5000),
  recovery_owner text not null default '' check (char_length(recovery_owner) <= 180),
  recovery_plan text not null default '' check (char_length(recovery_plan) <= 10000),
  recovery_completion date,
  recovery_confidence smallint not null default 0 check (recovery_confidence between 0 and 100),
  overtime_hours numeric(12,2) not null default 0 check (overtime_hours >= 0),
  premium_freight numeric(16,2) not null default 0 check (premium_freight >= 0),
  actual_delay_cause text not null default '' check (char_length(actual_delay_cause) <= 5000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  archived boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_assurance_orders_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.delivery_assurance_snapshots(id, organization_id) on delete cascade,
  unique (snapshot_id, order_key),
  unique (snapshot_id, order_number)
);
create unique index if not exists delivery_assurance_orders_id_org_uidx on public.delivery_assurance_orders(id, organization_id);
create index if not exists delivery_assurance_orders_org_promise_idx on public.delivery_assurance_orders(organization_id, order_status, promise_date, priority);
create index if not exists delivery_assurance_orders_org_customer_idx on public.delivery_assurance_orders(organization_id, customer_name, strategic);

create table if not exists public.delivery_assurance_blockers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  blocker_key text not null check (char_length(blocker_key) between 1 and 100),
  order_id uuid not null,
  category text not null check (category in ('material','supplier','equipment','workforce','qualification','document','engineering','quality','measurement','customer','capacity','shipping')),
  description text not null check (char_length(description) <= 10000),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  opened_date date not null,
  due_date date,
  expected_resolution date,
  recovery_plan text not null default '' check (char_length(recovery_plan) <= 10000),
  customer_impact text not null default '' check (char_length(customer_impact) <= 8000),
  financial_exposure numeric(16,2) not null default 0 check (financial_exposure >= 0),
  escalation_tier text not null default 'tier_1' check (escalation_tier in ('tier_1','tier_2','tier_3')),
  linked_tool text not null default '' check (char_length(linked_tool) <= 120),
  linked_record text not null default '' check (char_length(linked_record) <= 180),
  blocker_status text not null default 'open' check (blocker_status in ('open','in_progress','blocked','verification','closed')),
  verification text not null default '' check (char_length(verification) <= 8000),
  closure_authority text not null default '' check (char_length(closure_authority) <= 180),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_assurance_blockers_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.delivery_assurance_snapshots(id, organization_id) on delete cascade,
  constraint delivery_assurance_blockers_order_org_fkey foreign key (order_id, organization_id) references public.delivery_assurance_orders(id, organization_id) on delete cascade,
  unique (snapshot_id, blocker_key)
);
create unique index if not exists delivery_assurance_blockers_id_org_uidx on public.delivery_assurance_blockers(id, organization_id);
create index if not exists delivery_assurance_blockers_org_due_idx on public.delivery_assurance_blockers(organization_id, blocker_status, escalation_tier, due_date);

create table if not exists public.delivery_assurance_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  operation_key text not null check (char_length(operation_key) between 1 and 100),
  order_id uuid not null,
  sequence_number integer not null default 10 check (sequence_number >= 0),
  operation_name text not null check (char_length(operation_name) between 1 and 300),
  work_center text not null default '' check (char_length(work_center) <= 180),
  planned_start date,
  planned_finish date,
  actual_start date,
  actual_finish date,
  estimated_hours numeric(12,2) not null default 0 check (estimated_hours >= 0),
  actual_hours numeric(12,2) not null default 0 check (actual_hours >= 0),
  quantity_complete numeric(14,2) not null default 0 check (quantity_complete >= 0),
  quantity_rejected numeric(14,2) not null default 0 check (quantity_rejected >= 0),
  employee_team text not null default '' check (char_length(employee_team) <= 300),
  equipment_used text not null default '' check (char_length(equipment_used) <= 500),
  inspection_required boolean not null default false,
  inspection_result text not null default 'pending' check (inspection_result in ('pending','accepted','rejected','not_applicable')),
  operation_status text not null default 'not_started' check (operation_status in ('not_started','ready','in_progress','blocked','inspection','complete')),
  note text not null default '' check (char_length(note) <= 8000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_assurance_operations_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.delivery_assurance_snapshots(id, organization_id) on delete cascade,
  constraint delivery_assurance_operations_order_org_fkey foreign key (order_id, organization_id) references public.delivery_assurance_orders(id, organization_id) on delete cascade,
  unique (snapshot_id, operation_key)
);
create unique index if not exists delivery_assurance_operations_id_org_uidx on public.delivery_assurance_operations(id, organization_id);
create index if not exists delivery_assurance_operations_org_status_idx on public.delivery_assurance_operations(organization_id, operation_status, work_center, planned_finish);

create table if not exists public.delivery_assurance_shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  shipment_key text not null check (char_length(shipment_key) between 1 and 100),
  order_id uuid not null,
  required_quantity_complete boolean not null default false,
  final_inspection_accepted boolean not null default false,
  ncr_disposition_complete boolean not null default false,
  deviations_approved boolean not null default false,
  certificates_complete boolean not null default false,
  customer_documentation_complete boolean not null default false,
  packaging_verified boolean not null default false,
  shipping_photos_complete boolean not null default false,
  labels_verified boolean not null default false,
  carrier_scheduled boolean not null default false,
  release_status text not null default 'not_ready' check (release_status in ('not_ready','ready','released','held')),
  release_authority text not null default '' check (char_length(release_authority) <= 180),
  release_date date,
  carrier text not null default '' check (char_length(carrier) <= 180),
  tracking_number text not null default '' check (char_length(tracking_number) <= 240),
  shipment_date date,
  note text not null default '' check (char_length(note) <= 8000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_assurance_shipments_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.delivery_assurance_snapshots(id, organization_id) on delete cascade,
  constraint delivery_assurance_shipments_order_org_fkey foreign key (order_id, organization_id) references public.delivery_assurance_orders(id, organization_id) on delete cascade,
  unique (snapshot_id, shipment_key),
  unique (snapshot_id, order_id)
);
create unique index if not exists delivery_assurance_shipments_id_org_uidx on public.delivery_assurance_shipments(id, organization_id);
create index if not exists delivery_assurance_shipments_org_release_idx on public.delivery_assurance_shipments(organization_id, release_status, shipment_date);

create table if not exists public.delivery_assurance_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  order_id uuid,
  blocker_id uuid,
  operation_id uuid,
  shipment_id uuid,
  entity_type text not null check (entity_type in ('order','blocker','operation','shipment')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) <= 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  constraint delivery_assurance_evidence_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.delivery_assurance_snapshots(id, organization_id) on delete cascade,
  constraint delivery_assurance_evidence_order_org_fkey foreign key (order_id, organization_id) references public.delivery_assurance_orders(id, organization_id) on delete cascade,
  constraint delivery_assurance_evidence_blocker_org_fkey foreign key (blocker_id, organization_id) references public.delivery_assurance_blockers(id, organization_id) on delete cascade,
  constraint delivery_assurance_evidence_operation_org_fkey foreign key (operation_id, organization_id) references public.delivery_assurance_operations(id, organization_id) on delete cascade,
  constraint delivery_assurance_evidence_shipment_org_fkey foreign key (shipment_id, organization_id) references public.delivery_assurance_shipments(id, organization_id) on delete cascade,
  check ((entity_type = 'order' and order_id is not null) or (entity_type = 'blocker' and blocker_id is not null) or (entity_type = 'operation' and operation_id is not null) or (entity_type = 'shipment' and shipment_id is not null))
);
create index if not exists delivery_assurance_evidence_org_entity_idx on public.delivery_assurance_evidence(organization_id, entity_type, uploaded_at desc);

alter table public.delivery_assurance_snapshots enable row level security;
alter table public.delivery_assurance_orders enable row level security;
alter table public.delivery_assurance_blockers enable row level security;
alter table public.delivery_assurance_operations enable row level security;
alter table public.delivery_assurance_shipments enable row level security;
alter table public.delivery_assurance_evidence enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['delivery_assurance_snapshots','delivery_assurance_orders','delivery_assurance_blockers','delivery_assurance_operations','delivery_assurance_shipments']
  loop
    execute format('drop policy if exists %I_select_member on public.%I', table_name, table_name);
    execute format('create policy %I_select_member on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name, table_name);
    execute format('drop policy if exists %I_insert_editor on public.%I', table_name, table_name);
    execute format('create policy %I_insert_editor on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
    execute format('drop policy if exists %I_update_editor on public.%I', table_name, table_name);
    execute format('create policy %I_update_editor on public.%I for update to authenticated using ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[]))) with check ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
  end loop;
end $$;

drop policy if exists delivery_assurance_evidence_select_member on public.delivery_assurance_evidence;
create policy delivery_assurance_evidence_select_member on public.delivery_assurance_evidence for select to authenticated using ((select private.is_org_member(organization_id)));
drop policy if exists delivery_assurance_evidence_insert_editor on public.delivery_assurance_evidence;
create policy delivery_assurance_evidence_insert_editor on public.delivery_assurance_evidence for insert to authenticated with check (uploaded_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

revoke all on public.delivery_assurance_snapshots, public.delivery_assurance_orders, public.delivery_assurance_blockers, public.delivery_assurance_operations, public.delivery_assurance_shipments, public.delivery_assurance_evidence from anon, authenticated;
grant select, insert, update on public.delivery_assurance_snapshots, public.delivery_assurance_orders, public.delivery_assurance_blockers, public.delivery_assurance_operations, public.delivery_assurance_shipments to authenticated;
grant select, insert on public.delivery_assurance_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('delivery-assurance-evidence','delivery-assurance-evidence',false,41943040,array['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists delivery_assurance_storage_select on storage.objects;
create policy delivery_assurance_storage_select on storage.objects for select to authenticated using (bucket_id = 'delivery-assurance-evidence' and (select private.is_org_member((storage.foldername(name))[1]::uuid)));
drop policy if exists delivery_assurance_storage_insert on storage.objects;
create policy delivery_assurance_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'delivery-assurance-evidence' and (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','admin','member']::public.organization_role[])));
