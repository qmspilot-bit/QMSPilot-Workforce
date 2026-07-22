create table if not exists public.customer_assurance_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  assurance_date date not null,
  assurance_score smallint not null check (assurance_score between 0 and 100),
  open_complaints integer not null default 0 check (open_complaints >= 0),
  critical_complaints integer not null default 0 check (critical_complaints >= 0),
  overdue_commitments integer not null default 0 check (overdue_commitments >= 0),
  revenue_at_risk numeric(16,2) not null default 0 check (revenue_at_risk >= 0),
  warranty_cost numeric(16,2) not null default 0,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customer_assurance_snapshots_id_org_uidx on public.customer_assurance_snapshots(id, organization_id);
create index if not exists customer_assurance_snapshots_org_date_idx on public.customer_assurance_snapshots(organization_id, assurance_date desc, submitted_at desc);

create table if not exists public.customer_assurance_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  customer_key text not null check (char_length(customer_key) between 1 and 100),
  account_code text not null check (char_length(account_code) between 1 and 100),
  customer_name text not null check (char_length(customer_name) between 1 and 220),
  classification text not null default 'standard' check (classification in ('standard','strategic','business_critical')),
  account_status text not null default 'active' check (account_status in ('active','at_risk','recovery_active','inactive')),
  annual_revenue numeric(16,2) not null default 0 check (annual_revenue >= 0),
  internal_owner text not null default '' check (char_length(internal_owner) <= 160),
  quality_contact text not null default '' check (char_length(quality_contact) <= 220),
  operations_contact text not null default '' check (char_length(operations_contact) <= 220),
  executive_contact text not null default '' check (char_length(executive_contact) <= 220),
  locations text not null default '' check (char_length(locations) <= 3000),
  products_programs text not null default '' check (char_length(products_programs) <= 5000),
  customer_requirements text not null default '' check (char_length(customer_requirements) <= 8000),
  response_hours integer not null default 24 check (response_hours >= 0),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  archived boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_assurance_customers_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.customer_assurance_snapshots(id, organization_id) on delete cascade,
  unique (snapshot_id, customer_key),
  unique (snapshot_id, account_code)
);
create unique index if not exists customer_assurance_customers_id_org_uidx on public.customer_assurance_customers(id, organization_id);
create index if not exists customer_assurance_customers_org_status_idx on public.customer_assurance_customers(organization_id, account_status, classification);

create table if not exists public.customer_assurance_complaints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  complaint_key text not null check (char_length(complaint_key) between 1 and 100),
  customer_id uuid not null,
  complaint_number text not null check (char_length(complaint_number) between 1 and 100),
  complaint_date date not null,
  customer_contact text not null default '' check (char_length(customer_contact) <= 220),
  channel text not null default 'email' check (channel in ('email','phone','portal','sales','field_service','quality','other')),
  product_name text not null default '' check (char_length(product_name) <= 220),
  part_number text not null default '' check (char_length(part_number) <= 160),
  purchase_order text not null default '' check (char_length(purchase_order) <= 160),
  sales_order text not null default '' check (char_length(sales_order) <= 160),
  lot_serial text not null default '' check (char_length(lot_serial) <= 300),
  quantity_affected numeric(14,2) not null default 0 check (quantity_affected >= 0),
  description text not null check (char_length(description) <= 12000),
  discovery_point text not null default '' check (char_length(discovery_point) <= 500),
  customer_impact text not null default '' check (char_length(customer_impact) <= 8000),
  safety_risk boolean not null default false,
  regulatory_risk boolean not null default false,
  severity text not null default 'moderate' check (severity in ('low','moderate','high','critical')),
  revenue_exposure numeric(16,2) not null default 0 check (revenue_exposure >= 0),
  internal_owner text not null default '' check (char_length(internal_owner) <= 160),
  acknowledgment_due date,
  containment_due date,
  final_response_due date,
  complaint_status text not null default 'open' check (complaint_status in ('open','containment','investigating','corrective_action','effectiveness','customer_review','closed')),
  containment text not null default '' check (char_length(containment) <= 10000),
  containment_owner text not null default '' check (char_length(containment_owner) <= 160),
  containment_verified boolean not null default false,
  investigation_method text not null default '8D' check (char_length(investigation_method) <= 100),
  occurrence_cause text not null default '' check (char_length(occurrence_cause) <= 10000),
  escape_cause text not null default '' check (char_length(escape_cause) <= 10000),
  root_cause text not null default '' check (char_length(root_cause) <= 10000),
  corrective_action text not null default '' check (char_length(corrective_action) <= 12000),
  effectiveness text not null default '' check (char_length(effectiveness) <= 10000),
  linked_ncr text not null default '' check (char_length(linked_ncr) <= 160),
  linked_capa text not null default '' check (char_length(linked_capa) <= 160),
  linked_supplier text not null default '' check (char_length(linked_supplier) <= 160),
  linked_change text not null default '' check (char_length(linked_change) <= 160),
  linked_measurement text not null default '' check (char_length(linked_measurement) <= 160),
  linked_process_assurance text not null default '' check (char_length(linked_process_assurance) <= 160),
  response_summary text not null default '' check (char_length(response_summary) <= 12000),
  customer_accepted boolean not null default false,
  closure_authority text not null default '' check (char_length(closure_authority) <= 160),
  closed_at timestamptz,
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_assurance_complaints_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.customer_assurance_snapshots(id, organization_id) on delete cascade,
  constraint customer_assurance_complaints_customer_org_fkey foreign key (customer_id, organization_id) references public.customer_assurance_customers(id, organization_id) on delete cascade,
  unique (snapshot_id, complaint_key),
  unique (snapshot_id, complaint_number)
);
create unique index if not exists customer_assurance_complaints_id_org_uidx on public.customer_assurance_complaints(id, organization_id);
create index if not exists customer_assurance_complaints_org_status_idx on public.customer_assurance_complaints(organization_id, complaint_status, severity, final_response_due);

create table if not exists public.customer_assurance_communications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  communication_key text not null check (char_length(communication_key) between 1 and 100),
  complaint_id uuid not null,
  communication_at timestamptz not null,
  communication_type text not null default '' check (char_length(communication_type) <= 160),
  direction text not null default 'outbound' check (direction in ('outbound','inbound')),
  customer_contact text not null default '' check (char_length(customer_contact) <= 220),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  commitment_date date,
  summary text not null check (char_length(summary) <= 10000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_assurance_communications_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.customer_assurance_snapshots(id, organization_id) on delete cascade,
  constraint customer_assurance_communications_complaint_org_fkey foreign key (complaint_id, organization_id) references public.customer_assurance_complaints(id, organization_id) on delete cascade,
  unique (snapshot_id, communication_key)
);
create unique index if not exists customer_assurance_communications_id_org_uidx on public.customer_assurance_communications(id, organization_id);
create index if not exists customer_assurance_communications_org_time_idx on public.customer_assurance_communications(organization_id, communication_at desc);

create table if not exists public.customer_assurance_rmas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  rma_key text not null check (char_length(rma_key) between 1 and 100),
  complaint_id uuid not null,
  rma_number text not null check (char_length(rma_number) between 1 and 100),
  authorized_date date not null,
  expected_return date,
  carrier text not null default '' check (char_length(carrier) <= 160),
  tracking_number text not null default '' check (char_length(tracking_number) <= 220),
  received_date date,
  condition_received text not null default '' check (char_length(condition_received) <= 5000),
  warranty_decision text not null default 'pending' check (warranty_decision in ('pending','approved','denied','partial')),
  responsibility text not null default 'pending' check (responsibility in ('pending','company','customer','supplier','shared')),
  disposition text not null default 'pending' check (disposition in ('pending','repair','replace','rework','credit','no_fault_found','reject')),
  replacement_shipment date,
  replacement_tracking text not null default '' check (char_length(replacement_tracking) <= 220),
  repair_cost numeric(16,2) not null default 0,
  replacement_cost numeric(16,2) not null default 0,
  freight_cost numeric(16,2) not null default 0,
  sorting_cost numeric(16,2) not null default 0,
  field_service_cost numeric(16,2) not null default 0,
  chargeback numeric(16,2) not null default 0,
  credit_issued numeric(16,2) not null default 0,
  supplier_recovery numeric(16,2) not null default 0,
  approval_authority text not null default '' check (char_length(approval_authority) <= 160),
  rma_status text not null default 'open' check (rma_status in ('open','in_transit','received','evaluation','recovery_active','closed')),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_assurance_rmas_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.customer_assurance_snapshots(id, organization_id) on delete cascade,
  constraint customer_assurance_rmas_complaint_org_fkey foreign key (complaint_id, organization_id) references public.customer_assurance_complaints(id, organization_id) on delete cascade,
  unique (snapshot_id, rma_key),
  unique (snapshot_id, rma_number)
);
create unique index if not exists customer_assurance_rmas_id_org_uidx on public.customer_assurance_rmas(id, organization_id);
create index if not exists customer_assurance_rmas_org_status_idx on public.customer_assurance_rmas(organization_id, rma_status, authorized_date desc);

create table if not exists public.customer_assurance_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  customer_id uuid,
  complaint_id uuid,
  communication_id uuid,
  rma_id uuid,
  entity_type text not null check (entity_type in ('customer','complaint','communication','rma')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) <= 1000),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 160),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  constraint customer_assurance_evidence_snapshot_org_fkey foreign key (snapshot_id, organization_id) references public.customer_assurance_snapshots(id, organization_id) on delete cascade,
  constraint customer_assurance_evidence_customer_org_fkey foreign key (customer_id, organization_id) references public.customer_assurance_customers(id, organization_id) on delete cascade,
  constraint customer_assurance_evidence_complaint_org_fkey foreign key (complaint_id, organization_id) references public.customer_assurance_complaints(id, organization_id) on delete cascade,
  constraint customer_assurance_evidence_communication_org_fkey foreign key (communication_id, organization_id) references public.customer_assurance_communications(id, organization_id) on delete cascade,
  constraint customer_assurance_evidence_rma_org_fkey foreign key (rma_id, organization_id) references public.customer_assurance_rmas(id, organization_id) on delete cascade
);
create index if not exists customer_assurance_evidence_org_entity_idx on public.customer_assurance_evidence(organization_id, entity_type, uploaded_at desc);

alter table public.customer_assurance_snapshots enable row level security;
alter table public.customer_assurance_customers enable row level security;
alter table public.customer_assurance_complaints enable row level security;
alter table public.customer_assurance_communications enable row level security;
alter table public.customer_assurance_rmas enable row level security;
alter table public.customer_assurance_evidence enable row level security;

create policy customer_assurance_snapshots_select on public.customer_assurance_snapshots for select to authenticated using ((select private.is_org_member(organization_id)));
create policy customer_assurance_snapshots_write on public.customer_assurance_snapshots for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy customer_assurance_customers_select on public.customer_assurance_customers for select to authenticated using ((select private.is_org_member(organization_id)));
create policy customer_assurance_customers_write on public.customer_assurance_customers for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy customer_assurance_complaints_select on public.customer_assurance_complaints for select to authenticated using ((select private.is_org_member(organization_id)));
create policy customer_assurance_complaints_write on public.customer_assurance_complaints for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy customer_assurance_communications_select on public.customer_assurance_communications for select to authenticated using ((select private.is_org_member(organization_id)));
create policy customer_assurance_communications_write on public.customer_assurance_communications for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy customer_assurance_rmas_select on public.customer_assurance_rmas for select to authenticated using ((select private.is_org_member(organization_id)));
create policy customer_assurance_rmas_write on public.customer_assurance_rmas for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy customer_assurance_evidence_select on public.customer_assurance_evidence for select to authenticated using ((select private.is_org_member(organization_id)));
create policy customer_assurance_evidence_insert on public.customer_assurance_evidence for insert to authenticated with check (uploaded_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

revoke all on public.customer_assurance_snapshots, public.customer_assurance_customers, public.customer_assurance_complaints, public.customer_assurance_communications, public.customer_assurance_rmas, public.customer_assurance_evidence from anon, authenticated;
grant select, insert, update on public.customer_assurance_snapshots, public.customer_assurance_customers, public.customer_assurance_complaints, public.customer_assurance_communications, public.customer_assurance_rmas to authenticated;
grant select, insert on public.customer_assurance_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-assurance-evidence','customer-assurance-evidence',false,41943040,array['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy customer_assurance_storage_select on storage.objects for select to authenticated using (bucket_id = 'customer-assurance-evidence' and (select private.is_org_member((storage.foldername(name))[1]::uuid)));
create policy customer_assurance_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'customer-assurance-evidence' and (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','admin','member']::public.organization_role[])));
