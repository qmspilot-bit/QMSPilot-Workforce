create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.organization_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.action_status as enum ('proposed', 'approved', 'in_progress', 'blocked', 'done');
create type public.decision_status as enum ('pending', 'approved', 'deferred');
create type public.action_priority as enum ('urgent', 'high', 'normal', 'low');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  assignment_title text not null check (char_length(assignment_title) between 1 and 120),
  business_context text not null default '' check (char_length(business_context) <= 400),
  source_text text,
  source_filename text check (source_filename is null or char_length(source_filename) <= 255),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null,
  action_key text not null check (char_length(action_key) between 1 and 80),
  title text not null check (char_length(title) between 1 and 300),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  status public.action_status not null default 'proposed',
  priority public.action_priority not null default 'normal',
  due_date date,
  progress_note text not null default '' check (char_length(progress_note) <= 2000),
  recommended_agent text not null check (recommended_agent in ('Pilot', 'Atlas', 'Nexus', 'Forge')),
  rationale text not null default '',
  verification text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_items_analysis_org_fkey
    foreign key (analysis_id, organization_id)
    references public.analyses(id, organization_id)
    on delete cascade,
  unique (analysis_id, action_key)
);

create table public.decision_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null,
  decision_key text not null check (char_length(decision_key) between 1 and 500),
  position integer not null check (position >= 0),
  status public.decision_status not null default 'pending',
  note text not null default '' check (char_length(note) <= 4000),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint decisions_analysis_org_fkey
    foreign key (analysis_id, organization_id)
    references public.analyses(id, organization_id)
    on delete cascade,
  unique (analysis_id, decision_key)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('work_item', 'decision')),
  entity_id uuid not null,
  event_type text not null check (event_type in ('created', 'updated')),
  change_summary jsonb not null check (jsonb_typeof(change_summary) = 'object'),
  created_at timestamptz not null default now()
);

create index organizations_created_by_idx on public.organizations(created_by);
create index organization_members_user_id_idx on public.organization_members(user_id);
create index organization_members_role_idx on public.organization_members(organization_id, role);
create index organization_members_created_by_idx on public.organization_members(created_by);
create index analyses_organization_created_idx on public.analyses(organization_id, created_at desc);
create index analyses_created_by_idx on public.analyses(created_by);
create index work_items_organization_status_idx on public.work_items(organization_id, status);
create index work_items_analysis_id_idx on public.work_items(analysis_id);
create index work_items_analysis_org_idx on public.work_items(analysis_id, organization_id);
create index work_items_created_by_idx on public.work_items(created_by);
create index decision_records_organization_status_idx on public.decision_records(organization_id, status);
create index decision_records_analysis_id_idx on public.decision_records(analysis_id);
create index decision_records_analysis_org_idx on public.decision_records(analysis_id, organization_id);
create index decision_records_created_by_idx on public.decision_records(created_by);
create index decision_records_decided_by_idx on public.decision_records(decided_by);
create index audit_events_organization_created_idx on public.audit_events(organization_id, created_at desc);
create index audit_events_actor_user_id_idx on public.audit_events(actor_user_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger analyses_set_updated_at before update on public.analyses
for each row execute function private.set_updated_at();
create trigger work_items_set_updated_at before update on public.work_items
for each row execute function private.set_updated_at();
create trigger decision_records_set_updated_at before update on public.decision_records
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
declare
  new_organization_id uuid;
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  if not exists (
    select 1
    from public.organization_members membership
    where membership.user_id = new.id
  ) then
    insert into public.organizations (name, slug, created_by)
    values (
      'QMSPilot',
      'qmspilot-' || left(replace(new.id::text, '-', ''), 12),
      new.id
    )
    returning id into new_organization_id;

    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      created_by
    )
    values (
      new_organization_id,
      new.id,
      'owner',
      new.id
    );
  end if;

  return new;
end;
$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_org_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.role = any(allowed_roles)
    );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid, public.organization_role[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.organization_role[]) to authenticated;

create or replace function private.prevent_tenant_reassignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'Organization reassignment is not permitted.';
  end if;
  if tg_table_name in ('work_items', 'decision_records')
     and new.analysis_id is distinct from old.analysis_id then
    raise exception 'Analysis reassignment is not permitted.';
  end if;
  return new;
end;
$$;
revoke all on function private.prevent_tenant_reassignment() from public, anon, authenticated;

create trigger analyses_prevent_tenant_reassignment
before update on public.analyses
for each row execute function private.prevent_tenant_reassignment();
create trigger work_items_prevent_tenant_reassignment
before update on public.work_items
for each row execute function private.prevent_tenant_reassignment();
create trigger decisions_prevent_tenant_reassignment
before update on public.decision_records
for each row execute function private.prevent_tenant_reassignment();

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
  entity_name := case when tg_table_name = 'work_items' then 'work_item' else 'decision' end;
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

create trigger work_items_audit
after insert or update on public.work_items
for each row execute function private.record_workflow_change();
create trigger decisions_audit
after insert or update on public.decision_records
for each row execute function private.record_workflow_change();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.analyses enable row level security;
alter table public.work_items enable row level security;
alter table public.decision_records enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy organizations_select_member on public.organizations
for select to authenticated using ((select private.is_org_member(id)));

create policy organization_members_select_member on public.organization_members
for select to authenticated using ((select private.is_org_member(organization_id)));

create policy organization_members_insert_admin on public.organization_members
for insert to authenticated
with check ((select private.has_org_role(organization_id, array['owner', 'admin']::public.organization_role[])));

create policy organization_members_update_owner on public.organization_members
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner']::public.organization_role[])))
with check ((select private.has_org_role(organization_id, array['owner']::public.organization_role[])));

create policy organization_members_delete_owner on public.organization_members
for delete to authenticated
using (
  user_id <> (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner']::public.organization_role[]))
);

create policy analyses_select_member on public.analyses
for select to authenticated using ((select private.is_org_member(organization_id)));

create policy analyses_insert_editor on public.analyses
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'member']::public.organization_role[]))
);

create policy analyses_update_creator on public.analyses
for update to authenticated
using (
  created_by = (select auth.uid())
  and (select private.is_org_member(organization_id))
)
with check (
  created_by = (select auth.uid())
  and (select private.is_org_member(organization_id))
);

create policy work_items_select_member on public.work_items
for select to authenticated using ((select private.is_org_member(organization_id)));

create policy work_items_insert_editor on public.work_items
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'member']::public.organization_role[]))
);

create policy work_items_update_editor on public.work_items
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin', 'member']::public.organization_role[])))
with check ((select private.has_org_role(organization_id, array['owner', 'admin', 'member']::public.organization_role[])));

create policy decisions_select_member on public.decision_records
for select to authenticated using ((select private.is_org_member(organization_id)));

create policy decisions_insert_editor on public.decision_records
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'member']::public.organization_role[]))
);

create policy decisions_update_editor on public.decision_records
for update to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin', 'member']::public.organization_role[])))
with check (
  (decided_by is null or decided_by = (select auth.uid()))
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'member']::public.organization_role[]))
);

create policy audit_events_select_member on public.audit_events
for select to authenticated using ((select private.is_org_member(organization_id)));

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant select on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update on public.analyses to authenticated;
grant select, insert, update on public.work_items to authenticated;
grant select, insert, update on public.decision_records to authenticated;
grant select on public.audit_events to authenticated;
grant usage, select on sequence public.audit_events_id_seq to authenticated;
