create table if not exists public.northstar_validation_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_key text not null check (char_length(scenario_key) between 3 and 160),
  scenario_version text not null default '1.0' check (char_length(scenario_version) <= 40),
  scenario_name text not null check (char_length(scenario_name) between 3 and 320),
  design_partner_name text not null default '' check (char_length(design_partner_name) <= 240),
  site text not null default '' check (char_length(site) <= 180),
  facilitator_name text not null default '' check (char_length(facilitator_name) <= 180),
  session_status text not null default 'planning' check (session_status in ('planning','in_progress','validation_complete','approved','blocked','archived')),
  run_number integer not null default 1 check (run_number > 0),
  started_at timestamptz,
  completed_at timestamptz,
  scenario_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(scenario_payload) = 'object'),
  result_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(result_summary) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  approval_note text not null default '' check (char_length(approval_note) <= 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, scenario_key)
);
create unique index if not exists northstar_validation_sessions_id_org_uidx on public.northstar_validation_sessions(id, organization_id);
create index if not exists northstar_validation_sessions_org_status_idx on public.northstar_validation_sessions(organization_id, session_status, updated_at desc);

create table if not exists public.northstar_validation_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null,
  step_key text not null check (char_length(step_key) between 2 and 120),
  sequence_number integer not null check (sequence_number > 0),
  phase text not null check (char_length(phase) between 1 and 120),
  title text not null check (char_length(title) between 1 and 320),
  objective text not null default '' check (char_length(objective) <= 8000),
  expected_result text not null default '' check (char_length(expected_result) <= 8000),
  evidence_required text not null default '' check (char_length(evidence_required) <= 8000),
  linked_route text not null default '' check (char_length(linked_route) <= 300),
  responsible_role text not null default '' check (char_length(responsible_role) <= 180),
  gate_type text not null default 'human' check (gate_type in ('system','human','security','reporting')),
  step_status text not null default 'not_started' check (step_status in ('not_started','in_progress','passed','failed','blocked','not_applicable')),
  actual_result text not null default '' check (char_length(actual_result) <= 12000),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  defect_count integer not null default 0 check (defect_count >= 0),
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_validation_steps_session_org_fkey foreign key (session_id, organization_id) references public.northstar_validation_sessions(id, organization_id) on delete cascade,
  unique (session_id, step_key),
  unique (session_id, sequence_number)
);
create unique index if not exists northstar_validation_steps_id_org_uidx on public.northstar_validation_steps(id, organization_id);
create index if not exists northstar_validation_steps_session_order_idx on public.northstar_validation_steps(session_id, sequence_number);

create table if not exists public.northstar_validation_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null,
  step_id uuid,
  finding_key text not null check (char_length(finding_key) between 3 and 120),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low')),
  category text not null default 'functional' check (category in ('functional','security','data','usability','integration','reporting')),
  finding_status text not null default 'open' check (finding_status in ('open','triaged','in_progress','ready_for_retest','closed','deferred')),
  title text not null check (char_length(title) between 1 and 320),
  description text not null default '' check (char_length(description) <= 12000),
  affected_route text not null default '' check (char_length(affected_route) <= 300),
  reproduction_steps text not null default '' check (char_length(reproduction_steps) <= 12000),
  expected_result text not null default '' check (char_length(expected_result) <= 8000),
  actual_result text not null default '' check (char_length(actual_result) <= 8000),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  due_date date,
  resolution_note text not null default '' check (char_length(resolution_note) <= 12000),
  linked_event_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_validation_findings_session_org_fkey foreign key (session_id, organization_id) references public.northstar_validation_sessions(id, organization_id) on delete cascade,
  constraint northstar_validation_findings_step_org_fkey foreign key (step_id, organization_id) references public.northstar_validation_steps(id, organization_id) on delete set null,
  constraint northstar_validation_findings_event_org_fkey foreign key (linked_event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete set null,
  unique (session_id, finding_key)
);
create index if not exists northstar_validation_findings_session_status_idx on public.northstar_validation_findings(session_id, finding_status, severity, created_at desc);

create table if not exists public.northstar_validation_signoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null,
  signoff_role text not null check (char_length(signoff_role) between 2 and 180),
  signer_name text not null default '' check (char_length(signer_name) <= 180),
  decision text not null default 'pending' check (decision in ('pending','approved','approved_with_conditions','rejected')),
  note text not null default '' check (char_length(note) <= 8000),
  signed_by uuid references auth.users(id) on delete set null,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_validation_signoffs_session_org_fkey foreign key (session_id, organization_id) references public.northstar_validation_sessions(id, organization_id) on delete cascade,
  unique (session_id, signoff_role)
);
create index if not exists northstar_validation_signoffs_session_idx on public.northstar_validation_signoffs(session_id, decision);

create or replace function private.northstar_validation_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists northstar_validation_sessions_touch on public.northstar_validation_sessions;
create trigger northstar_validation_sessions_touch before update on public.northstar_validation_sessions for each row execute function private.northstar_validation_touch_updated_at();
drop trigger if exists northstar_validation_steps_touch on public.northstar_validation_steps;
create trigger northstar_validation_steps_touch before update on public.northstar_validation_steps for each row execute function private.northstar_validation_touch_updated_at();
drop trigger if exists northstar_validation_findings_touch on public.northstar_validation_findings;
create trigger northstar_validation_findings_touch before update on public.northstar_validation_findings for each row execute function private.northstar_validation_touch_updated_at();
drop trigger if exists northstar_validation_signoffs_touch on public.northstar_validation_signoffs;
create trigger northstar_validation_signoffs_touch before update on public.northstar_validation_signoffs for each row execute function private.northstar_validation_touch_updated_at();

alter table public.northstar_validation_sessions enable row level security;
alter table public.northstar_validation_steps enable row level security;
alter table public.northstar_validation_findings enable row level security;
alter table public.northstar_validation_signoffs enable row level security;

create policy northstar_validation_sessions_select on public.northstar_validation_sessions for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_validation_sessions_write on public.northstar_validation_sessions for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check (created_by=(select auth.uid()) and (select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_validation_steps_select on public.northstar_validation_steps for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_validation_steps_write on public.northstar_validation_steps for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_validation_findings_select on public.northstar_validation_findings for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_validation_findings_write on public.northstar_validation_findings for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check (created_by=(select auth.uid()) and (select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_validation_signoffs_select on public.northstar_validation_signoffs for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_validation_signoffs_write on public.northstar_validation_signoffs for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));

revoke all on public.northstar_validation_sessions,public.northstar_validation_steps,public.northstar_validation_findings,public.northstar_validation_signoffs from anon,authenticated;
grant select,insert,update,delete on public.northstar_validation_sessions,public.northstar_validation_steps,public.northstar_validation_findings,public.northstar_validation_signoffs to authenticated;