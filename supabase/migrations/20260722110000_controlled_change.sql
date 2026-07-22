create table if not exists public.controlled_change_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  change_health_score smallint not null check (change_health_score between 0 and 100),
  pending_approvals integer not null default 0 check (pending_approvals >= 0),
  training_gaps integer not null default 0 check (training_gaps >= 0),
  overdue_reviews integer not null default 0 check (overdue_reviews >= 0),
  obsolete_exposure integer not null default 0 check (obsolete_exposure >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists controlled_change_snapshots_id_org_uidx
  on public.controlled_change_snapshots(id, organization_id);
create index if not exists controlled_change_snapshots_org_date_idx
  on public.controlled_change_snapshots(organization_id, submitted_at desc);

create table if not exists public.controlled_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  document_key text not null check (char_length(document_key) between 1 and 100),
  document_number text not null check (char_length(document_number) between 1 and 100),
  title text not null check (char_length(title) between 1 and 260),
  document_type text not null default 'work_instruction' check (document_type in ('procedure','work_instruction','drawing','form','specification','manual','external_standard','other')),
  department text not null default '' check (char_length(department) <= 160),
  process_name text not null default '' check (char_length(process_name) <= 200),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  revision text not null default 'A' check (char_length(revision) <= 40),
  document_status text not null default 'approved' check (document_status in ('draft','review','approved','superseded','obsolete','archived')),
  effective_date date,
  review_date date,
  external_controlled boolean not null default false,
  customer_controlled boolean not null default false,
  file_name text not null default '' check (char_length(file_name) <= 255),
  distribution_locations jsonb not null default '[]'::jsonb check (jsonb_typeof(distribution_locations) = 'array'),
  point_of_use_code text not null default '' check (char_length(point_of_use_code) <= 160),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint controlled_documents_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.controlled_change_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, document_number)
);

create unique index if not exists controlled_documents_id_org_uidx
  on public.controlled_documents(id, organization_id);
create index if not exists controlled_documents_org_status_idx
  on public.controlled_documents(organization_id, document_status, department, review_date);

create table if not exists public.controlled_change_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  document_id uuid,
  change_key text not null check (char_length(change_key) between 1 and 100),
  change_number text not null check (char_length(change_number) between 1 and 100),
  title text not null check (char_length(title) between 1 and 260),
  change_source text not null default 'improvement' check (change_source in ('ncr','capa','process_assurance','asset_reliability','customer','engineering','supplier','audit','improvement','regulatory')),
  reason text not null default '' check (char_length(reason) <= 6000),
  requestor text not null default '' check (char_length(requestor) <= 160),
  priority text not null default 'moderate' check (priority in ('low','moderate','high','critical')),
  change_status text not null default 'draft' check (change_status in ('draft','impact_review','approval','approved','implementation','released','rejected','cancelled')),
  requested_effective_date date,
  new_revision text not null default '' check (char_length(new_revision) <= 40),
  impact jsonb not null default '{}'::jsonb check (jsonb_typeof(impact) = 'object'),
  implementation jsonb not null default '{}'::jsonb check (jsonb_typeof(implementation) = 'object'),
  training jsonb not null default '{}'::jsonb check (jsonb_typeof(training) = 'object'),
  linked_records jsonb not null default '[]'::jsonb check (jsonb_typeof(linked_records) = 'array'),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint controlled_change_requests_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.controlled_change_snapshots(id, organization_id)
    on delete cascade,
  constraint controlled_change_requests_document_org_fkey
    foreign key (document_id, organization_id)
    references public.controlled_documents(id, organization_id)
    on delete set null,
  unique (snapshot_id, change_number)
);

create unique index if not exists controlled_change_requests_id_org_uidx
  on public.controlled_change_requests(id, organization_id);
create index if not exists controlled_change_requests_org_status_idx
  on public.controlled_change_requests(organization_id, change_status, priority, requested_effective_date);

create table if not exists public.controlled_change_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  change_request_id uuid not null,
  approval_key text not null check (char_length(approval_key) between 1 and 100),
  role_name text not null check (char_length(role_name) between 1 and 160),
  required boolean not null default true,
  decision text not null default 'pending' check (decision in ('pending','approved','rejected','not_required')),
  approver_name text not null default '' check (char_length(approver_name) <= 160),
  decision_at timestamptz,
  comments text not null default '' check (char_length(comments) <= 3000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint controlled_change_approvals_change_org_fkey
    foreign key (change_request_id, organization_id)
    references public.controlled_change_requests(id, organization_id)
    on delete cascade,
  unique (change_request_id, approval_key)
);

create index if not exists controlled_change_approvals_org_decision_idx
  on public.controlled_change_approvals(organization_id, decision, role_name);

create table if not exists public.controlled_change_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  document_id uuid,
  change_request_id uuid,
  entity_type text not null check (entity_type in ('document','change_request')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint controlled_change_evidence_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.controlled_change_snapshots(id, organization_id)
    on delete cascade,
  constraint controlled_change_evidence_document_org_fkey
    foreign key (document_id, organization_id)
    references public.controlled_documents(id, organization_id)
    on delete cascade,
  constraint controlled_change_evidence_change_org_fkey
    foreign key (change_request_id, organization_id)
    references public.controlled_change_requests(id, organization_id)
    on delete cascade,
  check ((entity_type = 'document' and document_id is not null) or (entity_type = 'change_request' and change_request_id is not null))
);

create index if not exists controlled_change_evidence_org_idx
  on public.controlled_change_evidence(organization_id, entity_type, created_at desc);

alter table public.controlled_change_snapshots enable row level security;
alter table public.controlled_documents enable row level security;
alter table public.controlled_change_requests enable row level security;
alter table public.controlled_change_approvals enable row level security;
alter table public.controlled_change_evidence enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['controlled_change_snapshots','controlled_documents','controlled_change_requests','controlled_change_approvals']
  loop
    execute format('drop policy if exists %I_select_member on public.%I', table_name, table_name);
    execute format('create policy %I_select_member on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name, table_name);
    execute format('drop policy if exists %I_insert_editor on public.%I', table_name, table_name);
    execute format('create policy %I_insert_editor on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
    execute format('drop policy if exists %I_update_editor on public.%I', table_name, table_name);
    execute format('create policy %I_update_editor on public.%I for update to authenticated using ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[]))) with check ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
  end loop;
end $$;

drop policy if exists controlled_change_evidence_select_member on public.controlled_change_evidence;
create policy controlled_change_evidence_select_member on public.controlled_change_evidence
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists controlled_change_evidence_insert_editor on public.controlled_change_evidence;
create policy controlled_change_evidence_insert_editor on public.controlled_change_evidence
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

revoke all on public.controlled_change_snapshots, public.controlled_documents, public.controlled_change_requests, public.controlled_change_approvals, public.controlled_change_evidence from anon, authenticated;
grant select, insert, update on public.controlled_change_snapshots, public.controlled_documents, public.controlled_change_requests, public.controlled_change_approvals to authenticated;
grant select, insert on public.controlled_change_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'controlled-change-evidence',
  'controlled-change-evidence',
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

drop policy if exists controlled_change_objects_select_member on storage.objects;
create policy controlled_change_objects_select_member on storage.objects
for select to authenticated
using (
  bucket_id = 'controlled-change-evidence'
  and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
);

drop policy if exists controlled_change_objects_insert_editor on storage.objects;
create policy controlled_change_objects_insert_editor on storage.objects
for insert to authenticated
with check (
  bucket_id = 'controlled-change-evidence'
  and (select private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner','admin','member']::public.organization_role[]
  ))
);
