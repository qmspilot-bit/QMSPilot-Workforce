alter type public.action_status
  add value if not exists 'implementation' after 'ready_for_review';

alter type public.action_status
  add value if not exists 'evidence_review' after 'implementation';

alter table public.work_items
  add column if not exists closure_review jsonb,
  add column if not exists closure_reviewed_at timestamptz,
  add column if not exists closure_review_requested_by uuid references auth.users(id) on delete set null,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references auth.users(id) on delete set null,
  add column if not exists closure_note text not null default '';

alter table public.work_items
  add constraint work_items_closure_review_object_check
  check (closure_review is null or jsonb_typeof(closure_review) = 'object');

alter table public.work_items
  add constraint work_items_closure_note_length_check
  check (char_length(closure_note) <= 4000);

alter table public.work_items
  add constraint work_items_closed_pair_check
  check ((closed_at is null and closed_by is null) or (closed_at is not null and closed_by is not null));

create unique index if not exists work_items_id_organization_uidx
  on public.work_items(id, organization_id);

create index if not exists work_items_closure_review_requested_by_idx
  on public.work_items(closure_review_requested_by)
  where closure_review_requested_by is not null;

create index if not exists work_items_closed_by_idx
  on public.work_items(closed_by)
  where closed_by is not null;

create table public.closure_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  work_item_id uuid not null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) between 1 and 1024),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 255),
  size_bytes bigint not null check (size_bytes between 1 and 15728640),
  evidence_note text not null default '' check (char_length(evidence_note) <= 2000),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  constraint closure_evidence_work_item_org_fkey
    foreign key (work_item_id, organization_id)
    references public.work_items(id, organization_id)
    on delete cascade
);

create index closure_evidence_work_item_uploaded_idx
  on public.closure_evidence(work_item_id, uploaded_at desc);
create index closure_evidence_organization_uploaded_idx
  on public.closure_evidence(organization_id, uploaded_at desc);
create index closure_evidence_uploaded_by_idx
  on public.closure_evidence(uploaded_by);

alter table public.audit_events
  drop constraint if exists audit_events_entity_type_check;

alter table public.audit_events
  add constraint audit_events_entity_type_check
  check (entity_type in ('work_item', 'decision', 'closure_evidence'));

create or replace function private.record_workflow_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  summary jsonb;
  event_name text;
  entity_name text;
begin
  event_name := case when tg_op = 'INSERT' then 'created' else 'updated' end;
  entity_name := case
    when tg_table_name = 'work_items' then 'work_item'
    when tg_table_name = 'closure_evidence' then 'closure_evidence'
    else 'decision'
  end;
  summary := case
    when tg_op = 'INSERT' then jsonb_build_object('new', to_jsonb(new))
    else jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  end;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    entity_type,
    entity_id,
    event_type,
    change_summary
  )
  values (
    new.organization_id,
    (select auth.uid()),
    entity_name,
    new.id,
    event_name,
    summary
  );

  return new;
end;
$$;

revoke all on function private.record_workflow_change() from public, anon, authenticated;

create trigger closure_evidence_audit
after insert on public.closure_evidence
for each row execute function private.record_workflow_change();

alter table public.closure_evidence enable row level security;

create policy closure_evidence_select_member on public.closure_evidence
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy closure_evidence_insert_editor on public.closure_evidence
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (select private.has_org_role(
    organization_id,
    array['owner', 'admin', 'member']::public.organization_role[]
  ))
);

revoke all on public.closure_evidence from anon, authenticated;
grant select, insert on public.closure_evidence to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'closure-evidence',
  'closure-evidence',
  false,
  15728640,
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
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy closure_evidence_objects_select_member
on storage.objects
for select
to authenticated
using (
  bucket_id = 'closure-evidence'
  and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
);

create policy closure_evidence_objects_insert_editor
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'closure-evidence'
  and (select private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner', 'admin', 'member']::public.organization_role[]
  ))
);
