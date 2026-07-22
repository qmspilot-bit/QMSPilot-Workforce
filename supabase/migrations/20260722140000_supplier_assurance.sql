create table if not exists public.supplier_assurance_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  assurance_score smallint not null check (assurance_score between 0 and 100),
  high_risk_suppliers integer not null default 0 check (high_risk_suppliers >= 0),
  single_source_dependencies integer not null default 0 check (single_source_dependencies >= 0),
  open_issues integer not null default 0 check (open_issues >= 0),
  open_scars integer not null default 0 check (open_scars >= 0),
  overdue_scars integer not null default 0 check (overdue_scars >= 0),
  supplier_copq numeric(14,2) not null default 0 check (supplier_copq >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists supplier_assurance_snapshots_id_org_uidx
  on public.supplier_assurance_snapshots(id, organization_id);
create index if not exists supplier_assurance_snapshots_org_date_idx
  on public.supplier_assurance_snapshots(organization_id, submitted_at desc);

create table if not exists public.supplier_assurance_suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  supplier_key text not null check (char_length(supplier_key) between 1 and 100),
  supplier_code text not null check (char_length(supplier_code) between 1 and 100),
  supplier_name text not null check (char_length(supplier_name) between 1 and 240),
  supplier_status text not null default 'evaluation' check (supplier_status in ('prospective','evaluation','approved','conditional','probation','suspended','disqualified')),
  criticality text not null default 'moderate' check (criticality in ('low','moderate','high','business_critical')),
  commodity text not null default '' check (char_length(commodity) <= 200),
  supplied_products jsonb not null default '[]'::jsonb check (jsonb_typeof(supplied_products) = 'array'),
  sites jsonb not null default '[]'::jsonb check (jsonb_typeof(sites) = 'array'),
  contacts jsonb not null default '[]'::jsonb check (jsonb_typeof(contacts) = 'array'),
  quality_owner text not null default '' check (char_length(quality_owner) <= 160),
  purchasing_owner text not null default '' check (char_length(purchasing_owner) <= 160),
  single_source boolean not null default false,
  replacement_lead_days integer not null default 0 check (replacement_lead_days >= 0),
  customer_approved boolean not null default false,
  certificate_type text not null default '' check (char_length(certificate_type) <= 160),
  certificate_number text not null default '' check (char_length(certificate_number) <= 160),
  certificate_expiration date,
  certification_status text not null default 'not_verified' check (certification_status in ('not_verified','verified','expired','waived')),
  qualification jsonb not null default '{}'::jsonb check (jsonb_typeof(qualification) = 'object'),
  scorecard jsonb not null default '{}'::jsonb check (jsonb_typeof(scorecard) = 'object'),
  approval_decision text not null default 'evaluation' check (approval_decision in ('prospective','evaluation','approved','conditional','probation','suspended','disqualified')),
  approval_authority text not null default '' check (char_length(approval_authority) <= 160),
  approval_date date,
  approval_reason text not null default '' check (char_length(approval_reason) <= 4000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_assurance_suppliers_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.supplier_assurance_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, supplier_code)
);

create unique index if not exists supplier_assurance_suppliers_id_org_uidx
  on public.supplier_assurance_suppliers(id, organization_id);
create index if not exists supplier_assurance_suppliers_org_status_idx
  on public.supplier_assurance_suppliers(organization_id, supplier_status, criticality, commodity);
create index if not exists supplier_assurance_suppliers_cert_idx
  on public.supplier_assurance_suppliers(organization_id, certificate_expiration);

create table if not exists public.supplier_assurance_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  supplier_id uuid not null,
  issue_key text not null check (char_length(issue_key) between 1 and 100),
  issue_number text not null check (char_length(issue_number) between 1 and 100),
  issue_status text not null default 'open' check (issue_status in ('open','contained','awaiting_supplier','verification','closed')),
  po_number text not null default '' check (char_length(po_number) <= 120),
  part_number text not null default '' check (char_length(part_number) <= 160),
  lot_number text not null default '' check (char_length(lot_number) <= 160),
  quantity_received numeric(14,2) not null default 0 check (quantity_received >= 0),
  quantity_rejected numeric(14,2) not null default 0 check (quantity_rejected >= 0),
  description text not null default '' check (char_length(description) <= 6000),
  containment text not null default '' check (char_length(containment) <= 6000),
  production_impact text not null default '' check (char_length(production_impact) <= 4000),
  customer_exposure text not null default '' check (char_length(customer_exposure) <= 4000),
  disposition text not null default '' check (char_length(disposition) <= 4000),
  replacement_date date,
  copq numeric(14,2) not null default 0 check (copq >= 0),
  reported_by text not null default '' check (char_length(reported_by) <= 160),
  ncr_handoff boolean not null default false,
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_assurance_issues_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.supplier_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint supplier_assurance_issues_supplier_org_fkey
    foreign key (supplier_id, organization_id)
    references public.supplier_assurance_suppliers(id, organization_id)
    on delete cascade,
  unique (snapshot_id, issue_number)
);

create unique index if not exists supplier_assurance_issues_id_org_uidx
  on public.supplier_assurance_issues(id, organization_id);
create index if not exists supplier_assurance_issues_org_status_idx
  on public.supplier_assurance_issues(organization_id, issue_status, created_at desc);

create table if not exists public.supplier_assurance_scars (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  supplier_id uuid not null,
  linked_issue_id uuid,
  scar_key text not null check (char_length(scar_key) between 1 and 100),
  scar_number text not null check (char_length(scar_number) between 1 and 100),
  title text not null check (char_length(title) between 1 and 260),
  problem_statement text not null default '' check (char_length(problem_statement) <= 6000),
  scar_status text not null default 'draft' check (scar_status in ('draft','issued','response_received','verification','closed')),
  supplier_contact text not null default '' check (char_length(supplier_contact) <= 200),
  containment_due date,
  response_due date,
  containment text not null default '' check (char_length(containment) <= 6000),
  root_cause text not null default '' check (char_length(root_cause) <= 6000),
  corrective_action text not null default '' check (char_length(corrective_action) <= 6000),
  verification text not null default '' check (char_length(verification) <= 6000),
  effectiveness_review_date date,
  effectiveness_accepted boolean not null default false,
  closure_authority text not null default '' check (char_length(closure_authority) <= 160),
  closed_at timestamptz,
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_assurance_scars_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.supplier_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint supplier_assurance_scars_supplier_org_fkey
    foreign key (supplier_id, organization_id)
    references public.supplier_assurance_suppliers(id, organization_id)
    on delete cascade,
  constraint supplier_assurance_scars_issue_org_fkey
    foreign key (linked_issue_id, organization_id)
    references public.supplier_assurance_issues(id, organization_id)
    on delete set null,
  unique (snapshot_id, scar_number)
);

create unique index if not exists supplier_assurance_scars_id_org_uidx
  on public.supplier_assurance_scars(id, organization_id);
create index if not exists supplier_assurance_scars_org_due_idx
  on public.supplier_assurance_scars(organization_id, scar_status, response_due, effectiveness_review_date);

create table if not exists public.supplier_assurance_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  supplier_id uuid,
  issue_id uuid,
  scar_id uuid,
  entity_type text not null check (entity_type in ('supplier','issue','scar')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint supplier_assurance_evidence_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.supplier_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint supplier_assurance_evidence_supplier_org_fkey
    foreign key (supplier_id, organization_id)
    references public.supplier_assurance_suppliers(id, organization_id)
    on delete cascade,
  constraint supplier_assurance_evidence_issue_org_fkey
    foreign key (issue_id, organization_id)
    references public.supplier_assurance_issues(id, organization_id)
    on delete cascade,
  constraint supplier_assurance_evidence_scar_org_fkey
    foreign key (scar_id, organization_id)
    references public.supplier_assurance_scars(id, organization_id)
    on delete cascade,
  check (
    (entity_type = 'supplier' and supplier_id is not null)
    or (entity_type = 'issue' and issue_id is not null)
    or (entity_type = 'scar' and scar_id is not null)
  )
);

create index if not exists supplier_assurance_evidence_org_idx
  on public.supplier_assurance_evidence(organization_id, entity_type, created_at desc);

alter table public.supplier_assurance_snapshots enable row level security;
alter table public.supplier_assurance_suppliers enable row level security;
alter table public.supplier_assurance_issues enable row level security;
alter table public.supplier_assurance_scars enable row level security;
alter table public.supplier_assurance_evidence enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['supplier_assurance_snapshots','supplier_assurance_suppliers','supplier_assurance_issues','supplier_assurance_scars']
  loop
    execute format('drop policy if exists %I_select_member on public.%I', table_name, table_name);
    execute format('create policy %I_select_member on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name, table_name);
    execute format('drop policy if exists %I_insert_editor on public.%I', table_name, table_name);
    execute format('create policy %I_insert_editor on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
    execute format('drop policy if exists %I_update_editor on public.%I', table_name, table_name);
    execute format('create policy %I_update_editor on public.%I for update to authenticated using ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[]))) with check ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
  end loop;
end $$;

drop policy if exists supplier_assurance_evidence_select_member on public.supplier_assurance_evidence;
create policy supplier_assurance_evidence_select_member on public.supplier_assurance_evidence
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists supplier_assurance_evidence_insert_editor on public.supplier_assurance_evidence;
create policy supplier_assurance_evidence_insert_editor on public.supplier_assurance_evidence
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

revoke all on public.supplier_assurance_snapshots, public.supplier_assurance_suppliers, public.supplier_assurance_issues, public.supplier_assurance_scars, public.supplier_assurance_evidence from anon, authenticated;
grant select, insert, update on public.supplier_assurance_snapshots, public.supplier_assurance_suppliers, public.supplier_assurance_issues, public.supplier_assurance_scars to authenticated;
grant select, insert on public.supplier_assurance_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'supplier-assurance-evidence',
  'supplier-assurance-evidence',
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

drop policy if exists supplier_assurance_objects_select_member on storage.objects;
create policy supplier_assurance_objects_select_member on storage.objects
for select to authenticated
using (
  bucket_id = 'supplier-assurance-evidence'
  and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
);

drop policy if exists supplier_assurance_objects_insert_editor on storage.objects;
create policy supplier_assurance_objects_insert_editor on storage.objects
for insert to authenticated
with check (
  bucket_id = 'supplier-assurance-evidence'
  and (select private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner','admin','member']::public.organization_role[]
  ))
);
