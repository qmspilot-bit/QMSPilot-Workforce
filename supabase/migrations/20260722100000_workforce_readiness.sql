create table if not exists public.workforce_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 48),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  readiness_score smallint not null check (readiness_score between 0 and 100),
  critical_skill_gaps smallint not null default 0 check (critical_skill_gaps >= 0),
  single_point_dependencies smallint not null default 0 check (single_point_dependencies >= 0),
  expiring_qualifications smallint not null default 0 check (expiring_qualifications >= 0),
  training_in_progress smallint not null default 0 check (training_in_progress >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workforce_readiness_snapshots_id_org_uidx
  on public.workforce_readiness_snapshots(id, organization_id);
create index if not exists workforce_readiness_snapshots_org_date_idx
  on public.workforce_readiness_snapshots(organization_id, submitted_at desc);
create index if not exists workforce_readiness_snapshots_created_by_idx
  on public.workforce_readiness_snapshots(created_by);

create table if not exists public.workforce_readiness_people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  employee_code text not null check (char_length(employee_code) between 1 and 60),
  full_name text not null check (char_length(full_name) between 1 and 160),
  department text not null default '' check (char_length(department) <= 160),
  role_name text not null default '' check (char_length(role_name) <= 160),
  shift_name text not null default '' check (char_length(shift_name) <= 80),
  supervisor_name text not null default '' check (char_length(supervisor_name) <= 160),
  employment_status text not null default 'active' check (employment_status in ('active','leave','inactive')),
  hire_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workforce_readiness_people_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.workforce_readiness_snapshots(id, organization_id)
    on delete cascade,
  unique (snapshot_id, employee_code)
);

create unique index if not exists workforce_readiness_people_id_org_uidx
  on public.workforce_readiness_people(id, organization_id);
create index if not exists workforce_readiness_people_org_dept_idx
  on public.workforce_readiness_people(organization_id, department, shift_name);
create index if not exists workforce_readiness_people_created_by_idx
  on public.workforce_readiness_people(created_by);
create index if not exists workforce_readiness_people_snapshot_org_idx
  on public.workforce_readiness_people(snapshot_id, organization_id);

create table if not exists public.workforce_readiness_qualifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid not null,
  person_id uuid not null,
  capability_key text not null check (char_length(capability_key) between 1 and 100),
  capability_name text not null check (char_length(capability_name) between 1 and 200),
  capability_category text not null default '' check (char_length(capability_category) <= 160),
  critical boolean not null default false,
  qualification_level smallint not null check (qualification_level between 0 and 5),
  qualification_status text not null check (qualification_status in ('not_assigned','training_required','in_training','qualified_supervised','fully_qualified','trainer')),
  evaluator_name text not null default '' check (char_length(evaluator_name) <= 160),
  effective_date date,
  review_date date,
  restriction_note text not null default '' check (char_length(restriction_note) <= 2000),
  evidence_note text not null default '' check (char_length(evidence_note) <= 2000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workforce_readiness_qualifications_snapshot_org_fkey
    foreign key (snapshot_id, organization_id)
    references public.workforce_readiness_snapshots(id, organization_id)
    on delete cascade,
  constraint workforce_readiness_qualifications_person_org_fkey
    foreign key (person_id, organization_id)
    references public.workforce_readiness_people(id, organization_id)
    on delete cascade,
  unique (snapshot_id, person_id, capability_key)
);

create index if not exists workforce_readiness_qualifications_org_status_idx
  on public.workforce_readiness_qualifications(organization_id, qualification_status, review_date);
create index if not exists workforce_readiness_qualifications_person_org_idx
  on public.workforce_readiness_qualifications(person_id, organization_id);
create index if not exists workforce_readiness_qualifications_snapshot_org_idx
  on public.workforce_readiness_qualifications(snapshot_id, organization_id);
create index if not exists workforce_readiness_qualifications_created_by_idx
  on public.workforce_readiness_qualifications(created_by);

alter table public.workforce_readiness_snapshots enable row level security;
alter table public.workforce_readiness_people enable row level security;
alter table public.workforce_readiness_qualifications enable row level security;

create policy workforce_readiness_snapshots_select_member on public.workforce_readiness_snapshots
for select to authenticated using ((select private.is_org_member(organization_id)));
create policy workforce_readiness_snapshots_insert_editor on public.workforce_readiness_snapshots
for insert to authenticated with check (
  created_by = (select auth.uid()) and
  (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);
create policy workforce_readiness_snapshots_update_editor on public.workforce_readiness_snapshots
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])))
with check ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

create policy workforce_readiness_people_select_member on public.workforce_readiness_people
for select to authenticated using ((select private.is_org_member(organization_id)));
create policy workforce_readiness_people_insert_editor on public.workforce_readiness_people
for insert to authenticated with check (
  created_by = (select auth.uid()) and
  (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);
create policy workforce_readiness_people_update_editor on public.workforce_readiness_people
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])))
with check ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

create policy workforce_readiness_qualifications_select_member on public.workforce_readiness_qualifications
for select to authenticated using ((select private.is_org_member(organization_id)));
create policy workforce_readiness_qualifications_insert_editor on public.workforce_readiness_qualifications
for insert to authenticated with check (
  created_by = (select auth.uid()) and
  (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);
create policy workforce_readiness_qualifications_update_editor on public.workforce_readiness_qualifications
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])))
with check ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

revoke all on public.workforce_readiness_snapshots, public.workforce_readiness_people, public.workforce_readiness_qualifications from anon, authenticated;
grant select, insert, update on public.workforce_readiness_snapshots, public.workforce_readiness_people, public.workforce_readiness_qualifications to authenticated;
