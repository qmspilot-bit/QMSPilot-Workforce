create table if not exists public.measurement_assurance_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  assurance_date date not null,
  confidence_score smallint not null check (confidence_score between 0 and 100),
  calibration_compliance smallint not null check (calibration_compliance between 0 and 100),
  overdue_instruments integer not null default 0 check (overdue_instruments >= 0),
  quarantined_instruments integer not null default 0 check (quarantined_instruments >= 0),
  open_oot integer not null default 0 check (open_oot >= 0),
  critical_without_backup integer not null default 0 check (critical_without_backup >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists measurement_assurance_snapshots_id_org_uidx
  on public.measurement_assurance_snapshots(id, organization_id);
create index if not exists measurement_assurance_snapshots_org_date_idx
  on public.measurement_assurance_snapshots(organization_id, assurance_date desc, submitted_at desc);

create table if not exists public.measurement_assurance_instruments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  instrument_key text not null check (char_length(instrument_key) between 1 and 100),
  gage_id text not null check (char_length(gage_id) between 1 and 100),
  instrument_name text not null check (char_length(instrument_name) between 1 and 220),
  instrument_type text not null default '' check (char_length(instrument_type) <= 120),
  manufacturer text not null default '' check (char_length(manufacturer) <= 160),
  model text not null default '' check (char_length(model) <= 160),
  serial_number text not null default '' check (char_length(serial_number) <= 160),
  department text not null default '' check (char_length(department) <= 160),
  location_name text not null default '' check (char_length(location_name) <= 220),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  assigned_to text not null default '' check (char_length(assigned_to) <= 160),
  work_center text not null default '' check (char_length(work_center) <= 160),
  measurement_range text not null default '' check (char_length(measurement_range) <= 220),
  resolution text not null default '' check (char_length(resolution) <= 160),
  accuracy text not null default '' check (char_length(accuracy) <= 160),
  frequency_days integer not null default 365 check (frequency_days >= 0),
  calibration_method text not null default 'external' check (calibration_method in ('internal','external','verification_only')),
  vendor_name text not null default '' check (char_length(vendor_name) <= 200),
  last_calibration date,
  next_due date,
  instrument_status text not null default 'available' check (instrument_status in ('available','in_use','checked_out','due_soon','overdue','out_for_calibration','awaiting_certificate','quarantined','out_of_tolerance','restricted','lost','retired')),
  criticality text not null default 'moderate' check (criticality in ('low','moderate','high','business_critical')),
  backup_available boolean not null default true,
  product_process text not null default '' check (char_length(product_process) <= 3000),
  environmental_requirements text not null default '' check (char_length(environmental_requirements) <= 3000),
  restrictions text not null default '' check (char_length(restrictions) <= 3000),
  photo_name text not null default '' check (char_length(photo_name) <= 255),
  document_names jsonb not null default '[]'::jsonb check (jsonb_typeof(document_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  archived boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_assurance_instruments_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.measurement_assurance_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, instrument_key),
  unique (snapshot_id, gage_id)
);

create unique index if not exists measurement_assurance_instruments_id_org_uidx
  on public.measurement_assurance_instruments(id, organization_id);
create index if not exists measurement_assurance_instruments_org_status_idx
  on public.measurement_assurance_instruments(organization_id, instrument_status, next_due, criticality);
create index if not exists measurement_assurance_instruments_org_location_idx
  on public.measurement_assurance_instruments(organization_id, department, location_name);

create table if not exists public.measurement_assurance_calibrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  event_key text not null check (char_length(event_key) between 1 and 100),
  instrument_id uuid not null,
  calibration_date date not null,
  technician_name text not null default '' check (char_length(technician_name) <= 200),
  laboratory text not null default '' check (char_length(laboratory) <= 220),
  standard_traceability text not null default '' check (char_length(standard_traceability) <= 1000),
  environment text not null default '' check (char_length(environment) <= 1000),
  as_found text not null default '' check (char_length(as_found) <= 5000),
  adjustment text not null default '' check (char_length(adjustment) <= 5000),
  as_left text not null default '' check (char_length(as_left) <= 5000),
  result text not null check (result in ('pass','limited','fail')),
  certificate_number text not null default '' check (char_length(certificate_number) <= 160),
  certificate_names jsonb not null default '[]'::jsonb check (jsonb_typeof(certificate_names) = 'array'),
  release_authority text not null default '' check (char_length(release_authority) <= 160),
  next_due date,
  note text not null default '' check (char_length(note) <= 5000),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_assurance_calibrations_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.measurement_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint measurement_assurance_calibrations_instrument_org_fkey
    foreign key (instrument_id, organization_id)
    references public.measurement_assurance_instruments(id, organization_id)
    on delete cascade,
  unique (snapshot_id, event_key)
);
create index if not exists measurement_assurance_calibrations_org_date_idx
  on public.measurement_assurance_calibrations(organization_id, calibration_date desc, result);

create table if not exists public.measurement_assurance_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  event_key text not null check (char_length(event_key) between 1 and 100),
  instrument_id uuid not null,
  verification_date date not null,
  method text not null default '' check (char_length(method) <= 500),
  reference_standard text not null default '' check (char_length(reference_standard) <= 500),
  acceptance_criteria text not null default '' check (char_length(acceptance_criteria) <= 1000),
  result text not null check (result in ('pass','fail')),
  performed_by text not null default '' check (char_length(performed_by) <= 160),
  note text not null default '' check (char_length(note) <= 5000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_assurance_verifications_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.measurement_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint measurement_assurance_verifications_instrument_org_fkey
    foreign key (instrument_id, organization_id)
    references public.measurement_assurance_instruments(id, organization_id)
    on delete cascade,
  unique (snapshot_id, event_key)
);
create index if not exists measurement_assurance_verifications_org_date_idx
  on public.measurement_assurance_verifications(organization_id, verification_date desc, result);

create table if not exists public.measurement_assurance_custody (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  event_key text not null check (char_length(event_key) between 1 and 100),
  instrument_id uuid not null,
  transaction_at timestamptz not null,
  from_location text not null default '' check (char_length(from_location) <= 220),
  to_location text not null default '' check (char_length(to_location) <= 220),
  recipient text not null default '' check (char_length(recipient) <= 160),
  job_work_order text not null default '' check (char_length(job_work_order) <= 200),
  condition text not null default '' check (char_length(condition) <= 1000),
  expected_return date,
  note text not null default '' check (char_length(note) <= 3000),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_assurance_custody_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.measurement_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint measurement_assurance_custody_instrument_org_fkey
    foreign key (instrument_id, organization_id)
    references public.measurement_assurance_instruments(id, organization_id)
    on delete cascade,
  unique (snapshot_id, event_key)
);
create index if not exists measurement_assurance_custody_org_time_idx
  on public.measurement_assurance_custody(organization_id, transaction_at desc, to_location);

create table if not exists public.measurement_assurance_oot (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  event_key text not null check (char_length(event_key) between 1 and 100),
  instrument_id uuid not null,
  discovered_date date not null,
  source_name text not null default '' check (char_length(source_name) <= 500),
  last_known_acceptable date,
  risk_start_date date,
  affected_jobs text not null default '' check (char_length(affected_jobs) <= 5000),
  affected_lots text not null default '' check (char_length(affected_lots) <= 5000),
  affected_customers text not null default '' check (char_length(affected_customers) <= 5000),
  severity text not null default 'high' check (severity in ('low','moderate','high','critical')),
  containment text not null default '' check (char_length(containment) <= 8000),
  reinspection_plan text not null default '' check (char_length(reinspection_plan) <= 8000),
  product_decision text not null default '' check (char_length(product_decision) <= 8000),
  equipment_disposition text not null default 'quarantined' check (equipment_disposition in ('quarantined','repair','limited','released','retired')),
  linked_ncr text not null default '' check (char_length(linked_ncr) <= 160),
  linked_capa text not null default '' check (char_length(linked_capa) <= 160),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  event_status text not null default 'open' check (event_status in ('open','investigating','reinspection','verification','closed')),
  closure_authority text not null default '' check (char_length(closure_authority) <= 160),
  effectiveness text not null default '' check (char_length(effectiveness) <= 8000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_assurance_oot_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.measurement_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint measurement_assurance_oot_instrument_org_fkey
    foreign key (instrument_id, organization_id)
    references public.measurement_assurance_instruments(id, organization_id)
    on delete cascade,
  unique (snapshot_id, event_key)
);
create index if not exists measurement_assurance_oot_org_status_idx
  on public.measurement_assurance_oot(organization_id, event_status, severity, discovered_date desc);

create table if not exists public.measurement_assurance_msa (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  event_key text not null check (char_length(event_key) between 1 and 100),
  instrument_id uuid not null,
  study_date date not null,
  study_type text not null check (study_type in ('gage_rr','bias','linearity','stability','attribute_agreement')),
  characteristic text not null default '' check (char_length(characteristic) <= 500),
  tolerance text not null default '' check (char_length(tolerance) <= 300),
  operators integer not null default 0 check (operators >= 0),
  parts integer not null default 0 check (parts >= 0),
  trials integer not null default 0 check (trials >= 0),
  percent_grr numeric(8,3) not null default 0 check (percent_grr >= 0),
  ndc integer not null default 0 check (ndc >= 0),
  result text not null default 'pending' check (result in ('pending','acceptable','conditional','unacceptable')),
  conclusion text not null default '' check (char_length(conclusion) <= 8000),
  required_action text not null default '' check (char_length(required_action) <= 8000),
  technical_approver text not null default '' check (char_length(technical_approver) <= 160),
  review_date date,
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint measurement_assurance_msa_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.measurement_assurance_snapshots(id, organization_id)
    on delete cascade,
  constraint measurement_assurance_msa_instrument_org_fkey
    foreign key (instrument_id, organization_id)
    references public.measurement_assurance_instruments(id, organization_id)
    on delete cascade,
  unique (snapshot_id, event_key)
);
create index if not exists measurement_assurance_msa_org_review_idx
  on public.measurement_assurance_msa(organization_id, result, review_date);

create table if not exists public.measurement_assurance_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  entity_type text not null check (entity_type in ('instrument','calibration','verification','oot','msa')),
  entity_key text not null check (char_length(entity_key) between 1 and 100),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint measurement_assurance_evidence_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.measurement_assurance_snapshots(id, organization_id)
    on delete cascade
);
create index if not exists measurement_assurance_evidence_org_entity_idx
  on public.measurement_assurance_evidence(organization_id, entity_type, entity_key, created_at desc);

alter table public.measurement_assurance_snapshots enable row level security;
alter table public.measurement_assurance_instruments enable row level security;
alter table public.measurement_assurance_calibrations enable row level security;
alter table public.measurement_assurance_verifications enable row level security;
alter table public.measurement_assurance_custody enable row level security;
alter table public.measurement_assurance_oot enable row level security;
alter table public.measurement_assurance_msa enable row level security;
alter table public.measurement_assurance_evidence enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['measurement_assurance_snapshots','measurement_assurance_instruments','measurement_assurance_calibrations','measurement_assurance_verifications','measurement_assurance_custody','measurement_assurance_oot','measurement_assurance_msa']
  loop
    execute format('drop policy if exists %I_select_member on public.%I', table_name, table_name);
    execute format('create policy %I_select_member on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name, table_name);
    execute format('drop policy if exists %I_insert_editor on public.%I', table_name, table_name);
    execute format('create policy %I_insert_editor on public.%I for insert to authenticated with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
    execute format('drop policy if exists %I_update_editor on public.%I', table_name, table_name);
    execute format('create policy %I_update_editor on public.%I for update to authenticated using ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[]))) with check ((select private.has_org_role(organization_id, array[''owner'',''admin'',''member'']::public.organization_role[])))', table_name, table_name);
  end loop;
end $$;

drop policy if exists measurement_assurance_evidence_select_member on public.measurement_assurance_evidence;
create policy measurement_assurance_evidence_select_member on public.measurement_assurance_evidence
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists measurement_assurance_evidence_insert_editor on public.measurement_assurance_evidence;
create policy measurement_assurance_evidence_insert_editor on public.measurement_assurance_evidence
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

revoke all on public.measurement_assurance_snapshots, public.measurement_assurance_instruments, public.measurement_assurance_calibrations, public.measurement_assurance_verifications, public.measurement_assurance_custody, public.measurement_assurance_oot, public.measurement_assurance_msa, public.measurement_assurance_evidence from anon, authenticated;
grant select, insert, update on public.measurement_assurance_snapshots, public.measurement_assurance_instruments, public.measurement_assurance_calibrations, public.measurement_assurance_verifications, public.measurement_assurance_custody, public.measurement_assurance_oot, public.measurement_assurance_msa to authenticated;
grant select, insert on public.measurement_assurance_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'measurement-assurance-evidence',
  'measurement-assurance-evidence',
  false,
  41943040,
  array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','text/plain','image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists measurement_assurance_storage_select_member on storage.objects;
create policy measurement_assurance_storage_select_member on storage.objects
for select to authenticated using (
  bucket_id = 'measurement-assurance-evidence'
  and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
);

drop policy if exists measurement_assurance_storage_insert_editor on storage.objects;
create policy measurement_assurance_storage_insert_editor on storage.objects
for insert to authenticated with check (
  bucket_id = 'measurement-assurance-evidence'
  and (select private.has_org_role(((storage.foldername(name))[1])::uuid, array['owner','admin','member']::public.organization_role[]))
);
