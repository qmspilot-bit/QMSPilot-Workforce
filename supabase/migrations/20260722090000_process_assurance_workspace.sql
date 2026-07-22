create table if not exists public.process_assurance_audits (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique check (char_length(record_id) between 8 and 40),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_name text not null default '' check (char_length(organization_name) <= 160),
  site text not null check (char_length(site) between 1 and 160),
  department text not null default '' check (char_length(department) <= 160),
  process_name text not null check (char_length(process_name) between 1 and 240),
  shift_name text not null default '' check (char_length(shift_name) <= 80),
  auditor_name text not null check (char_length(auditor_name) between 1 and 160),
  audit_date date not null,
  audit_layer text not null check (audit_layer in ('layer-1','layer-2','layer-3')),
  standard_reference text not null default '' check (char_length(standard_reference) <= 500),
  leadership_note text not null default '' check (char_length(leadership_note) <= 2000),
  score smallint not null check (score between 0 and 100),
  answered_count smallint not null check (answered_count >= 0),
  applicable_count smallint not null check (applicable_count >= 0),
  finding_count smallint not null check (finding_count >= 0),
  high_risk_count smallint not null check (high_risk_count >= 0),
  assurance_status text not null check (assurance_status in ('Audit in progress','Leadership attention','Controlled with actions','Process assured')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists process_assurance_audits_id_org_uidx
  on public.process_assurance_audits(id, organization_id);
create index if not exists process_assurance_audits_org_date_idx
  on public.process_assurance_audits(organization_id, audit_date desc);
create index if not exists process_assurance_audits_process_idx
  on public.process_assurance_audits(organization_id, process_name, audit_date desc);

create table if not exists public.process_assurance_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid not null,
  question_id text not null check (char_length(question_id) between 1 and 40),
  category text not null default '' check (char_length(category) <= 160),
  requirement text not null check (char_length(requirement) between 1 and 2000),
  requirement_reference text not null default '' check (char_length(requirement_reference) <= 500),
  severity text not null check (severity in ('low','medium','high','critical')),
  observation text not null default '' check (char_length(observation) <= 4000),
  containment text not null check (char_length(containment) between 1 and 4000),
  owner_name text not null check (char_length(owner_name) between 1 and 160),
  due_date date not null,
  recommended_handoff text not null default '' check (char_length(recommended_handoff) <= 200),
  status text not null default 'open' check (status in ('open','in_progress','evidence_review','closed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint process_assurance_findings_audit_org_fkey
    foreign key (audit_id, organization_id)
    references public.process_assurance_audits(id, organization_id)
    on delete cascade,
  unique (audit_id, question_id)
);

create unique index if not exists process_assurance_findings_id_org_uidx
  on public.process_assurance_findings(id, organization_id);
create index if not exists process_assurance_findings_org_status_idx
  on public.process_assurance_findings(organization_id, status, due_date);

create table if not exists public.process_assurance_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid not null,
  finding_id uuid not null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 1024),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 255),
  size_bytes bigint not null check (size_bytes between 1 and 31457280),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  constraint process_assurance_evidence_audit_org_fkey
    foreign key (audit_id, organization_id)
    references public.process_assurance_audits(id, organization_id)
    on delete cascade,
  constraint process_assurance_evidence_finding_org_fkey
    foreign key (finding_id, organization_id)
    references public.process_assurance_findings(id, organization_id)
    on delete cascade
);

create index if not exists process_assurance_evidence_finding_idx
  on public.process_assurance_evidence(finding_id, uploaded_at desc);

alter table public.process_assurance_audits enable row level security;
alter table public.process_assurance_findings enable row level security;
alter table public.process_assurance_evidence enable row level security;

drop policy if exists process_assurance_audits_select_member on public.process_assurance_audits;
create policy process_assurance_audits_select_member on public.process_assurance_audits
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists process_assurance_audits_insert_editor on public.process_assurance_audits;
create policy process_assurance_audits_insert_editor on public.process_assurance_audits
for insert to authenticated with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

drop policy if exists process_assurance_audits_update_editor on public.process_assurance_audits;
create policy process_assurance_audits_update_editor on public.process_assurance_audits
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])))
with check ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

drop policy if exists process_assurance_findings_select_member on public.process_assurance_findings;
create policy process_assurance_findings_select_member on public.process_assurance_findings
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists process_assurance_findings_insert_editor on public.process_assurance_findings;
create policy process_assurance_findings_insert_editor on public.process_assurance_findings
for insert to authenticated with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

drop policy if exists process_assurance_findings_update_editor on public.process_assurance_findings;
create policy process_assurance_findings_update_editor on public.process_assurance_findings
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])))
with check ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

drop policy if exists process_assurance_evidence_select_member on public.process_assurance_evidence;
create policy process_assurance_evidence_select_member on public.process_assurance_evidence
for select to authenticated using ((select private.is_org_member(organization_id)));

drop policy if exists process_assurance_evidence_insert_editor on public.process_assurance_evidence;
create policy process_assurance_evidence_insert_editor on public.process_assurance_evidence
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))
);

revoke all on public.process_assurance_audits, public.process_assurance_findings, public.process_assurance_evidence from anon, authenticated;
grant select, insert, update on public.process_assurance_audits, public.process_assurance_findings to authenticated;
grant select, insert on public.process_assurance_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'process-assurance-evidence',
  'process-assurance-evidence',
  false,
  31457280,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists process_assurance_objects_select_member on storage.objects;
create policy process_assurance_objects_select_member on storage.objects
for select to authenticated
using (
  bucket_id = 'process-assurance-evidence'
  and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
);

drop policy if exists process_assurance_objects_insert_editor on storage.objects;
create policy process_assurance_objects_insert_editor on storage.objects
for insert to authenticated
with check (
  bucket_id = 'process-assurance-evidence'
  and (select private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner','admin','member']::public.organization_role[]
  ))
);

alter table public.audit_events drop constraint if exists audit_events_entity_type_check;
alter table public.audit_events add constraint audit_events_entity_type_check
check (entity_type in (
  'work_item','decision','closure_evidence',
  'process_assurance_audit','process_assurance_finding','process_assurance_evidence'
));

create or replace function private.record_process_assurance_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entity_name text;
  summary jsonb;
begin
  entity_name := case
    when tg_table_name = 'process_assurance_audits' then 'process_assurance_audit'
    when tg_table_name = 'process_assurance_findings' then 'process_assurance_finding'
    else 'process_assurance_evidence'
  end;
  summary := case
    when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old) - 'payload', 'new', to_jsonb(new) - 'payload')
    else jsonb_build_object('new', to_jsonb(new) - 'payload')
  end;
  insert into public.audit_events (
    organization_id, actor_user_id, entity_type, entity_id, event_type, change_summary
  ) values (
    new.organization_id,
    (select auth.uid()),
    entity_name,
    new.id,
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    summary
  );
  return new;
end;
$$;

revoke all on function private.record_process_assurance_change() from public, anon, authenticated;

drop trigger if exists process_assurance_audits_audit on public.process_assurance_audits;
create trigger process_assurance_audits_audit
after insert or update on public.process_assurance_audits
for each row execute function private.record_process_assurance_change();

drop trigger if exists process_assurance_findings_audit on public.process_assurance_findings;
create trigger process_assurance_findings_audit
after insert or update on public.process_assurance_findings
for each row execute function private.record_process_assurance_change();

drop trigger if exists process_assurance_evidence_audit on public.process_assurance_evidence;
create trigger process_assurance_evidence_audit
after insert on public.process_assurance_evidence
for each row execute function private.record_process_assurance_change();
