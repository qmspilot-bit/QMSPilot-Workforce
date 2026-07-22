create table if not exists public.northstar_intelligence_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique check (char_length(event_key) between 3 and 240),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_tool text not null check (char_length(source_tool) between 1 and 120),
  source_table text not null check (char_length(source_table) between 1 and 160),
  source_record_id uuid not null,
  source_record_key text not null default '' check (char_length(source_record_key) <= 180),
  source_path text not null default '' check (char_length(source_path) <= 300),
  event_type text not null check (char_length(event_type) between 1 and 160),
  event_title text not null check (char_length(event_title) between 1 and 320),
  summary text not null default '' check (char_length(summary) <= 12000),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low')),
  event_status text not null default 'new' check (event_status in ('new','routed','analyzing','awaiting_human','approved','contained','closed','dismissed')),
  organization_name text not null default '' check (char_length(organization_name) <= 180),
  site text not null default '' check (char_length(site) <= 180),
  department text not null default '' check (char_length(department) <= 180),
  customer_name text not null default '' check (char_length(customer_name) <= 240),
  supplier_name text not null default '' check (char_length(supplier_name) <= 240),
  asset_name text not null default '' check (char_length(asset_name) <= 240),
  order_number text not null default '' check (char_length(order_number) <= 180),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  due_date date,
  financial_exposure numeric(18,2) not null default 0,
  revenue_exposure numeric(18,2) not null default 0,
  requires_decision boolean not null default false,
  human_authority_required boolean not null default true,
  source_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(source_payload) = 'object'),
  routing_context jsonb not null default '{}'::jsonb check (jsonb_typeof(routing_context) = 'object'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  source_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists northstar_intelligence_events_id_org_uidx on public.northstar_intelligence_events(id, organization_id);
create index if not exists northstar_intelligence_events_org_status_idx on public.northstar_intelligence_events(organization_id, event_status, severity, created_at desc);
create index if not exists northstar_intelligence_events_org_source_idx on public.northstar_intelligence_events(organization_id, source_tool, source_record_key);

create table if not exists public.northstar_routing_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  rule_name text not null check (char_length(rule_name) between 1 and 220),
  source_tool text not null default '*' check (char_length(source_tool) <= 120),
  event_type text not null default '*' check (char_length(event_type) <= 160),
  minimum_severity text not null default 'low' check (minimum_severity in ('critical','high','medium','low')),
  agent_codes jsonb not null check (jsonb_typeof(agent_codes) = 'array'),
  assignment_reason text not null default '' check (char_length(assignment_reason) <= 2000),
  rule_priority integer not null default 100,
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists northstar_routing_rules_org_source_idx on public.northstar_routing_rules(organization_id, source_tool, enabled, rule_priority desc);

create table if not exists public.northstar_agent_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null,
  assignment_key text not null check (char_length(assignment_key) between 3 and 260),
  agent_code text not null check (agent_code in ('Pilot','Atlas','Forge','Sentinel','Vector','Beacon','Ledger','Nexus')),
  agent_role text not null default '' check (char_length(agent_role) <= 220),
  assignment_reason text not null default '' check (char_length(assignment_reason) <= 4000),
  priority text not null default 'normal' check (priority in ('urgent','high','normal','low')),
  assignment_status text not null default 'queued' check (assignment_status in ('queued','analyzing','recommendation_ready','awaiting_human','approved','rejected','blocked','closed')),
  due_at timestamptz,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_agent_assignments_event_org_fkey foreign key (event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete cascade,
  unique (organization_id, assignment_key),
  unique (event_id, agent_code)
);
create unique index if not exists northstar_agent_assignments_id_org_uidx on public.northstar_agent_assignments(id, organization_id);
create index if not exists northstar_agent_assignments_org_queue_idx on public.northstar_agent_assignments(organization_id, assignment_status, priority, assigned_at desc);

create table if not exists public.northstar_agent_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null,
  assignment_id uuid not null,
  agent_code text not null check (agent_code in ('Pilot','Atlas','Forge','Sentinel','Vector','Beacon','Ledger','Nexus')),
  recommendation_title text not null check (char_length(recommendation_title) between 1 and 320),
  executive_summary text not null default '' check (char_length(executive_summary) <= 12000),
  rationale text not null default '' check (char_length(rationale) <= 12000),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  recommended_actions jsonb not null default '[]'::jsonb check (jsonb_typeof(recommended_actions) = 'array'),
  confidence smallint not null default 50 check (confidence between 0 and 100),
  risk_level text not null default 'medium' check (risk_level in ('critical','high','medium','low')),
  recommendation_status text not null default 'pending_approval' check (recommendation_status in ('draft','pending_approval','approved','partially_approved','rejected','superseded')),
  model_mode text not null default 'rules' check (model_mode in ('rules','ai')),
  human_decision_note text not null default '' check (char_length(human_decision_note) <= 8000),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_agent_recommendations_event_org_fkey foreign key (event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete cascade,
  constraint northstar_agent_recommendations_assignment_org_fkey foreign key (assignment_id, organization_id) references public.northstar_agent_assignments(id, organization_id) on delete cascade
);
create unique index if not exists northstar_agent_recommendations_id_org_uidx on public.northstar_agent_recommendations(id, organization_id);
create index if not exists northstar_agent_recommendations_org_status_idx on public.northstar_agent_recommendations(organization_id, recommendation_status, risk_level, created_at desc);

create table if not exists public.northstar_workforce_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null,
  recommendation_id uuid,
  action_key text not null check (char_length(action_key) between 1 and 100),
  title text not null check (char_length(title) between 1 and 400),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  due_date date,
  priority text not null default 'normal' check (priority in ('urgent','high','normal','low')),
  action_status text not null default 'proposed' check (action_status in ('proposed','approved','in_progress','evidence_review','blocked','done','rejected')),
  target_tool text not null default '' check (char_length(target_tool) <= 160),
  target_record text not null default '' check (char_length(target_record) <= 180),
  verification_required text not null default '' check (char_length(verification_required) <= 8000),
  progress_note text not null default '' check (char_length(progress_note) <= 8000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  closure_note text not null default '' check (char_length(closure_note) <= 8000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_workforce_actions_event_org_fkey foreign key (event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete cascade,
  constraint northstar_workforce_actions_recommendation_org_fkey foreign key (recommendation_id, organization_id) references public.northstar_agent_recommendations(id, organization_id) on delete set null,
  unique (event_id, action_key)
);
create unique index if not exists northstar_workforce_actions_id_org_uidx on public.northstar_workforce_actions(id, organization_id);
create index if not exists northstar_workforce_actions_org_due_idx on public.northstar_workforce_actions(organization_id, action_status, priority, due_date);

create table if not exists public.northstar_writeback_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_id uuid not null,
  target_tool text not null check (char_length(target_tool) between 1 and 160),
  target_record text not null default '' check (char_length(target_record) <= 180),
  writeback_operation text not null default 'create_action' check (writeback_operation in ('create_action','update_action','link_record','request_review')),
  writeback_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(writeback_payload) = 'object'),
  writeback_status text not null default 'queued' check (writeback_status in ('queued','awaiting_human','executed','rejected','failed')),
  authorized_by uuid references auth.users(id) on delete set null,
  authorized_at timestamptz,
  executed_by uuid references auth.users(id) on delete set null,
  executed_at timestamptz,
  execution_note text not null default '' check (char_length(execution_note) <= 8000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_writeback_requests_action_org_fkey foreign key (action_id, organization_id) references public.northstar_workforce_actions(id, organization_id) on delete cascade,
  unique (action_id, target_tool, writeback_operation)
);
create index if not exists northstar_writeback_requests_org_status_idx on public.northstar_writeback_requests(organization_id, writeback_status, created_at desc);

create table if not exists public.northstar_executive_briefs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brief_type text not null default 'on_demand' check (brief_type in ('daily','tier_meeting','weekly','monthly','on_demand')),
  period_start date not null,
  period_end date not null,
  title text not null check (char_length(title) between 1 and 320),
  executive_summary text not null default '' check (char_length(executive_summary) <= 16000),
  decisions_required jsonb not null default '[]'::jsonb check (jsonb_typeof(decisions_required) = 'array'),
  priorities jsonb not null default '[]'::jsonb check (jsonb_typeof(priorities) = 'array'),
  watchlist jsonb not null default '[]'::jsonb check (jsonb_typeof(watchlist) = 'array'),
  value_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(value_summary) = 'object'),
  source_event_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(source_event_ids) = 'array'),
  confidence smallint not null default 50 check (confidence between 0 and 100),
  model_mode text not null default 'rules' check (model_mode in ('rules','ai')),
  brief_status text not null default 'draft' check (brief_status in ('draft','awaiting_review','approved','superseded')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '' check (char_length(review_note) <= 8000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists northstar_executive_briefs_org_period_idx on public.northstar_executive_briefs(organization_id, period_end desc, brief_status);

create table if not exists public.northstar_workforce_action_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_id uuid not null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique check (char_length(storage_path) <= 1200),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) <= 180),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  constraint northstar_workforce_action_evidence_action_org_fkey foreign key (action_id, organization_id) references public.northstar_workforce_actions(id, organization_id) on delete cascade
);
create index if not exists northstar_workforce_action_evidence_org_action_idx on public.northstar_workforce_action_evidence(organization_id, action_id, uploaded_at desc);

insert into public.northstar_routing_rules (rule_name, source_tool, minimum_severity, agent_codes, assignment_reason, rule_priority)
select * from (values
  ('Pilot enterprise coordination', '*', 'low', '["Pilot"]'::jsonb, 'Pilot receives every connected event for executive prioritization and cross-functional coordination.', 1000),
  ('Customer recovery team', 'customer-assurance', 'low', '["Beacon","Atlas","Forge","Sentinel","Vector","Ledger"]'::jsonb, 'Customer issues require relationship recovery, accountability, cause review, evidence control, recurrence analysis, and financial exposure.', 900),
  ('Delivery recovery team', 'delivery-assurance', 'low', '["Atlas","Forge","Beacon","Ledger"]'::jsonb, 'Delivery risk requires action control, constraint recovery, customer awareness, and financial prioritization.', 900),
  ('Measurement failure team', 'measurement-assurance', 'low', '["Atlas","Forge","Sentinel","Vector","Ledger"]'::jsonb, 'Measurement exposure requires containment ownership, technical cause review, evidence sufficiency, recurrence analysis, and product-impact valuation.', 900),
  ('Supplier risk team', 'supplier-assurance', 'low', '["Atlas","Forge","Sentinel","Ledger"]'::jsonb, 'Supplier risk requires accountable recovery, technical review, evidence control, and cost recovery.', 900),
  ('Asset reliability team', 'asset-reliability', 'low', '["Atlas","Forge","Ledger"]'::jsonb, 'Equipment risk requires accountable work, operational recovery, and downtime valuation.', 900),
  ('Workforce readiness team', 'workforce-readiness', 'low', '["Atlas","Sentinel","Vector"]'::jsonb, 'Capability gaps require ownership, qualification evidence, and systemic cross-training analysis.', 900),
  ('Controlled change team', 'controlled-change', 'low', '["Atlas","Forge","Sentinel"]'::jsonb, 'Change control requires implementation ownership, operational impact review, and release evidence.', 900),
  ('Process assurance team', 'process-assurance', 'low', '["Atlas","Forge","Sentinel","Vector"]'::jsonb, 'Process findings require action control, cause analysis, evidence verification, and recurrence prevention.', 900),
  ('Daily operations team', 'daily-operations', 'low', '["Atlas","Forge","Ledger"]'::jsonb, 'Daily operating risk requires accountability, recovery planning, and exposure prioritization.', 900),
  ('Value realization team', 'value-ledger', 'low', '["Ledger","Vector"]'::jsonb, 'Value events require financial discipline and improvement realization analysis.', 900)
) as defaults(rule_name, source_tool, minimum_severity, agent_codes, assignment_reason, rule_priority)
where not exists (select 1 from public.northstar_routing_rules where organization_id is null and rule_name = defaults.rule_name);

create or replace function private.northstar_severity_rank(value text)
returns integer
language sql
immutable
as $$
  select case value when 'critical' then 4 when 'high' then 3 when 'medium' then 2 else 1 end
$$;

create or replace function private.northstar_agent_role(value text)
returns text
language sql
immutable
as $$
  select case value
    when 'Pilot' then 'AI Chief of Staff and executive coordinator'
    when 'Atlas' then 'Accountability, ownership, deadlines, escalation, and closure'
    when 'Forge' then 'Root cause, technical recovery, and corrective-action quality'
    when 'Sentinel' then 'Evidence, compliance, release, and control sufficiency'
    when 'Vector' then 'Trends, recurrence, systemic prevention, and continuous improvement'
    when 'Beacon' then 'Customer intelligence, communication, and relationship recovery'
    when 'Ledger' then 'Operational cost, recovery, savings, revenue protection, and ROI'
    when 'Nexus' then 'Growth intelligence and commercial opportunity'
    else 'Northstar specialist'
  end
$$;

create or replace function private.northstar_route_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  event_row public.northstar_intelligence_events%rowtype;
  rule_row public.northstar_routing_rules%rowtype;
  agent_value text;
  assignment_priority text;
begin
  select * into event_row from public.northstar_intelligence_events where id = p_event_id;
  if not found then return; end if;
  assignment_priority := case event_row.severity when 'critical' then 'urgent' when 'high' then 'high' when 'medium' then 'normal' else 'low' end;

  for rule_row in
    select * from public.northstar_routing_rules
    where enabled
      and (organization_id is null or organization_id = event_row.organization_id)
      and (source_tool = '*' or source_tool = event_row.source_tool)
      and (event_type = '*' or event_type = event_row.event_type)
      and private.northstar_severity_rank(event_row.severity) >= private.northstar_severity_rank(minimum_severity)
    order by organization_id nulls last, rule_priority desc
  loop
    for agent_value in select jsonb_array_elements_text(rule_row.agent_codes)
    loop
      insert into public.northstar_agent_assignments (
        organization_id, event_id, assignment_key, agent_code, agent_role,
        assignment_reason, priority, assignment_status, due_at, created_by
      ) values (
        event_row.organization_id, event_row.id, event_row.id::text || ':' || lower(agent_value), agent_value,
        private.northstar_agent_role(agent_value), rule_row.assignment_reason, assignment_priority, 'queued',
        case assignment_priority when 'urgent' then now() + interval '1 day' when 'high' then now() + interval '3 days' else now() + interval '7 days' end,
        event_row.created_by
      )
      on conflict (event_id, agent_code) do update set
        assignment_reason = excluded.assignment_reason,
        priority = excluded.priority,
        due_at = excluded.due_at,
        assignment_status = case when northstar_agent_assignments.assignment_status in ('approved','rejected','closed') then northstar_agent_assignments.assignment_status else 'queued' end,
        updated_at = now();
    end loop;
  end loop;

  update public.northstar_intelligence_events
  set event_status = case when event_status = 'new' then 'routed' else event_status end,
      updated_at = now()
  where id = event_row.id;
end;
$$;

create or replace function private.northstar_upsert_snapshot_event(p_source_table text, p_row jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  event_id uuid;
  org_id uuid;
  user_id uuid;
  source_id uuid;
  source_key text;
  source_tool text;
  source_path text;
  label text;
  severity text := 'medium';
  event_title text;
  event_summary text;
  financial_value numeric := 0;
  revenue_value numeric := 0;
  metrics jsonb := coalesce(p_row->'payload'->'metrics', '{}'::jsonb);
  event_key_value text;
  submitted_at_value timestamptz;
begin
  org_id := (p_row->>'organization_id')::uuid;
  user_id := (p_row->>'created_by')::uuid;
  source_id := (p_row->>'id')::uuid;
  source_key := coalesce(nullif(p_row->>'record_id',''), source_id::text);
  submitted_at_value := coalesce(nullif(p_row->>'submitted_at','')::timestamptz, nullif(p_row->>'updated_at','')::timestamptz, now());

  source_tool := case p_source_table
    when 'process_assurance_audits' then 'process-assurance'
    else replace(replace(p_source_table, '_snapshots', ''), '_', '-')
  end;
  source_path := case source_tool
    when 'asset-reliability' then '/tools/asset-reliability'
    when 'controlled-change' then '/tools/controlled-change'
    when 'customer-assurance' then '/tools/customer-assurance'
    when 'daily-operations' then '/tools/daily-operations'
    when 'delivery-assurance' then '/tools/delivery-assurance'
    when 'measurement-assurance' then '/tools/measurement-assurance'
    when 'process-assurance' then '/tools/process-assurance'
    when 'supplier-assurance' then '/tools/supplier-assurance'
    when 'value-ledger' then '/tools/value-ledger'
    when 'workforce-readiness' then '/tools/workforce-readiness'
    else '/toolbox'
  end;
  label := initcap(replace(source_tool, '-', ' '));
  event_key_value := p_source_table || ':' || source_id::text;

  case p_source_table
    when 'customer_assurance_snapshots' then
      severity := case when coalesce((p_row->>'critical_complaints')::integer,0) > 0 then 'critical' when coalesce((p_row->>'overdue_commitments')::integer,0) > 0 or coalesce((p_row->>'open_complaints')::integer,0) > 0 then 'high' else 'low' end;
      revenue_value := coalesce((p_row->>'revenue_at_risk')::numeric,0);
      financial_value := coalesce((p_row->>'warranty_cost')::numeric,0);
      event_summary := format('%s open complaints, %s critical, %s overdue commitments, %s revenue at risk.', coalesce(p_row->>'open_complaints','0'), coalesce(p_row->>'critical_complaints','0'), coalesce(p_row->>'overdue_commitments','0'), coalesce(p_row->>'revenue_at_risk','0'));
    when 'delivery_assurance_snapshots' then
      severity := case when coalesce((p_row->>'late_orders')::integer,0) > 0 then 'critical' when coalesce((p_row->>'orders_at_risk')::integer,0) > 0 then 'high' else 'low' end;
      revenue_value := coalesce((p_row->>'revenue_at_risk')::numeric,0);
      event_summary := format('%s active orders, %s at risk, %s late, %s average readiness.', coalesce(p_row->>'active_orders','0'), coalesce(p_row->>'orders_at_risk','0'), coalesce(p_row->>'late_orders','0'), coalesce(p_row->>'average_readiness','0'));
    when 'measurement_assurance_snapshots' then
      severity := case when coalesce((p_row->>'open_oot')::integer,0) > 0 or coalesce((p_row->>'critical_without_backup')::integer,0) > 0 then 'critical' when coalesce((p_row->>'overdue_instruments')::integer,0) > 0 or coalesce((p_row->>'quarantined_instruments')::integer,0) > 0 then 'high' else 'low' end;
      event_summary := format('%s overdue instruments, %s quarantined, %s open out-of-tolerance reviews, %s critical without backup.', coalesce(p_row->>'overdue_instruments','0'), coalesce(p_row->>'quarantined_instruments','0'), coalesce(p_row->>'open_oot','0'), coalesce(p_row->>'critical_without_backup','0'));
    when 'supplier_assurance_snapshots' then
      severity := case when coalesce((p_row->>'high_risk_suppliers')::integer,0) > 0 or coalesce((p_row->>'overdue_scars')::integer,0) > 0 then 'high' when coalesce((p_row->>'open_issues')::integer,0) > 0 then 'medium' else 'low' end;
      financial_value := coalesce((p_row->>'supplier_copq')::numeric,0);
      event_summary := format('%s high-risk suppliers, %s open issues, %s open SCARs, %s overdue SCARs.', coalesce(p_row->>'high_risk_suppliers','0'), coalesce(p_row->>'open_issues','0'), coalesce(p_row->>'open_scars','0'), coalesce(p_row->>'overdue_scars','0'));
    when 'asset_reliability_snapshots' then
      severity := case when coalesce((p_row->>'downtime_hours')::numeric,0) > 8 then 'critical' when coalesce((p_row->>'open_work_orders')::integer,0) > 0 or coalesce((p_row->>'overdue_pm')::integer,0) > 0 then 'high' else 'low' end;
      financial_value := coalesce((p_row->>'downtime_cost')::numeric,0);
      event_summary := format('%s downtime hours, %s downtime cost, %s open work orders, %s overdue PM.', coalesce(p_row->>'downtime_hours','0'), coalesce(p_row->>'downtime_cost','0'), coalesce(p_row->>'open_work_orders','0'), coalesce(p_row->>'overdue_pm','0'));
    when 'workforce_readiness_snapshots' then
      severity := case when coalesce((p_row->>'critical_skill_gaps')::integer,0) > 0 then 'critical' when coalesce((p_row->>'single_point_dependencies')::integer,0) > 0 or coalesce((p_row->>'expiring_qualifications')::integer,0) > 0 then 'high' else 'low' end;
      event_summary := format('%s critical skill gaps, %s single-point dependencies, %s expiring qualifications.', coalesce(p_row->>'critical_skill_gaps','0'), coalesce(p_row->>'single_point_dependencies','0'), coalesce(p_row->>'expiring_qualifications','0'));
    when 'controlled_change_snapshots' then
      severity := case when coalesce((p_row->>'obsolete_exposure')::integer,0) > 0 or coalesce((p_row->>'overdue_reviews')::integer,0) > 0 then 'high' when coalesce((p_row->>'pending_approvals')::integer,0) > 0 or coalesce((p_row->>'training_gaps')::integer,0) > 0 then 'medium' else 'low' end;
      event_summary := format('%s pending approvals, %s training gaps, %s overdue reviews, %s obsolete exposures.', coalesce(p_row->>'pending_approvals','0'), coalesce(p_row->>'training_gaps','0'), coalesce(p_row->>'overdue_reviews','0'), coalesce(p_row->>'obsolete_exposure','0'));
    when 'process_assurance_audits' then
      severity := case when coalesce((p_row->>'high_risk_count')::integer,0) > 0 then 'critical' when coalesce((p_row->>'finding_count')::integer,0) > 0 then 'high' else 'low' end;
      event_summary := format('%s process audit score with %s findings and %s high-risk findings.', coalesce(p_row->>'score','0'), coalesce(p_row->>'finding_count','0'), coalesce(p_row->>'high_risk_count','0'));
    when 'daily_operations_snapshots' then
      severity := case when coalesce((p_row->>'red_measures')::integer,0) >= 2 or coalesce((p_row->>'overdue_actions')::integer,0) > 0 then 'critical' when coalesce((p_row->>'red_measures')::integer,0) > 0 or coalesce((p_row->>'customer_orders_at_risk')::integer,0) > 0 then 'high' else 'low' end;
      financial_value := coalesce((p_row->>'financial_exposure')::numeric,0);
      event_summary := format('%s operating health, %s red measures, %s open actions, %s overdue, %s customer orders at risk.', coalesce(p_row->>'health_score','0'), coalesce(p_row->>'red_measures','0'), coalesce(p_row->>'open_actions','0'), coalesce(p_row->>'overdue_actions','0'), coalesce(p_row->>'customer_orders_at_risk','0'));
    when 'value_ledger_snapshots' then
      severity := case when coalesce((p_row->>'actual_operational_loss')::numeric,0) >= 100000 then 'high' when coalesce((p_row->>'value_pipeline')::numeric,0) > 0 then 'medium' else 'low' end;
      financial_value := coalesce((p_row->>'actual_operational_loss')::numeric,0);
      event_summary := format('%s operational loss, %s verified realized value, %s net value, %s value pipeline, %s ROI.', coalesce(p_row->>'actual_operational_loss','0'), coalesce(p_row->>'verified_realized_value','0'), coalesce(p_row->>'net_realized_value','0'), coalesce(p_row->>'value_pipeline','0'), coalesce(p_row->>'qmspilot_roi','0'));
    else
      event_summary := label || ' submitted to Northstar.';
  end case;

  event_title := label || ' · ' || source_key;

  insert into public.northstar_intelligence_events (
    event_key, organization_id, source_tool, source_table, source_record_id, source_record_key, source_path,
    event_type, event_title, summary, severity, event_status, organization_name, site, department,
    customer_name, supplier_name, asset_name, order_number, owner_name, due_date, financial_exposure,
    revenue_exposure, requires_decision, human_authority_required, source_payload, routing_context,
    evidence_refs, created_by, source_submitted_at, updated_at
  ) values (
    event_key_value, org_id, source_tool, p_source_table, source_id, source_key, source_path,
    source_tool || '-submitted', event_title, event_summary, severity, 'new', coalesce(p_row->>'organization_name',''),
    coalesce(p_row->>'site',''), coalesce(p_row->>'department',''), coalesce(p_row->'payload'->'setup'->>'customer',''),
    coalesce(p_row->'payload'->'setup'->>'supplier',''), coalesce(p_row->'payload'->'setup'->>'asset',''),
    coalesce(p_row->'payload'->'setup'->>'orderNumber',''), coalesce(p_row->'payload'->'setup'->>'owner',''), null,
    financial_value, revenue_value, severity in ('critical','high'), true, coalesce(p_row->'payload','{}'::jsonb),
    jsonb_build_object('metrics', metrics, 'governance', coalesce(p_row->'payload'->'governance','{}'::jsonb)),
    case when jsonb_typeof(coalesce(p_row->'payload'->'evidence','[]'::jsonb)) = 'array' then coalesce(p_row->'payload'->'evidence','[]'::jsonb) else '[]'::jsonb end,
    user_id, submitted_at_value, now()
  )
  on conflict (event_key) do update set
    event_title = excluded.event_title,
    summary = excluded.summary,
    severity = excluded.severity,
    organization_name = excluded.organization_name,
    site = excluded.site,
    department = excluded.department,
    financial_exposure = excluded.financial_exposure,
    revenue_exposure = excluded.revenue_exposure,
    requires_decision = excluded.requires_decision,
    source_payload = excluded.source_payload,
    routing_context = excluded.routing_context,
    evidence_refs = excluded.evidence_refs,
    source_submitted_at = excluded.source_submitted_at,
    event_status = case when northstar_intelligence_events.event_status in ('closed','dismissed') then northstar_intelligence_events.event_status else 'new' end,
    updated_at = now()
  returning id into event_id;

  perform private.northstar_route_event(event_id);
  return event_id;
end;
$$;

create or replace function private.northstar_snapshot_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.northstar_upsert_snapshot_event(TG_TABLE_NAME, to_jsonb(NEW));
  return NEW;
end;
$$;

do $$
declare
  source_table text;
begin
  foreach source_table in array array[
    'asset_reliability_snapshots','controlled_change_snapshots','customer_assurance_snapshots',
    'daily_operations_snapshots','delivery_assurance_snapshots','measurement_assurance_snapshots',
    'process_assurance_audits','supplier_assurance_snapshots','value_ledger_snapshots','workforce_readiness_snapshots'
  ]
  loop
    execute format('drop trigger if exists northstar_intelligence_bus_trigger on public.%I', source_table);
    execute format('create trigger northstar_intelligence_bus_trigger after insert or update on public.%I for each row execute function private.northstar_snapshot_trigger()', source_table);
  end loop;
end $$;

do $$
declare
  source_table text;
  row_data jsonb;
begin
  foreach source_table in array array[
    'asset_reliability_snapshots','controlled_change_snapshots','customer_assurance_snapshots',
    'daily_operations_snapshots','delivery_assurance_snapshots','measurement_assurance_snapshots',
    'process_assurance_audits','supplier_assurance_snapshots','value_ledger_snapshots','workforce_readiness_snapshots'
  ]
  loop
    for row_data in execute format('select to_jsonb(t) from public.%I t', source_table)
    loop
      perform private.northstar_upsert_snapshot_event(source_table, row_data);
    end loop;
  end loop;
end $$;

alter table public.northstar_intelligence_events enable row level security;
alter table public.northstar_routing_rules enable row level security;
alter table public.northstar_agent_assignments enable row level security;
alter table public.northstar_agent_recommendations enable row level security;
alter table public.northstar_workforce_actions enable row level security;
alter table public.northstar_writeback_requests enable row level security;
alter table public.northstar_executive_briefs enable row level security;
alter table public.northstar_workforce_action_evidence enable row level security;

create policy northstar_intelligence_events_select on public.northstar_intelligence_events for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_intelligence_events_write on public.northstar_intelligence_events for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy northstar_routing_rules_select on public.northstar_routing_rules for select to authenticated using (organization_id is null or (select private.is_org_member(organization_id)));
create policy northstar_routing_rules_write on public.northstar_routing_rules for all to authenticated using (organization_id is not null and (select private.has_org_role(organization_id, array['owner','admin']::public.organization_role[]))) with check (organization_id is not null and created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin']::public.organization_role[])));
create policy northstar_agent_assignments_select on public.northstar_agent_assignments for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_agent_assignments_write on public.northstar_agent_assignments for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy northstar_agent_recommendations_select on public.northstar_agent_recommendations for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_agent_recommendations_write on public.northstar_agent_recommendations for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy northstar_workforce_actions_select on public.northstar_workforce_actions for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_workforce_actions_write on public.northstar_workforce_actions for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy northstar_writeback_requests_select on public.northstar_writeback_requests for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_writeback_requests_write on public.northstar_writeback_requests for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy northstar_executive_briefs_select on public.northstar_executive_briefs for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_executive_briefs_write on public.northstar_executive_briefs for all to authenticated using ((select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[]))) with check (created_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));
create policy northstar_workforce_action_evidence_select on public.northstar_workforce_action_evidence for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_workforce_action_evidence_insert on public.northstar_workforce_action_evidence for insert to authenticated with check (uploaded_by = (select auth.uid()) and (select private.has_org_role(organization_id, array['owner','admin','member']::public.organization_role[])));

revoke all on public.northstar_intelligence_events, public.northstar_routing_rules, public.northstar_agent_assignments, public.northstar_agent_recommendations, public.northstar_workforce_actions, public.northstar_writeback_requests, public.northstar_executive_briefs, public.northstar_workforce_action_evidence from anon, authenticated;
grant select, insert, update on public.northstar_intelligence_events, public.northstar_routing_rules, public.northstar_agent_assignments, public.northstar_agent_recommendations, public.northstar_workforce_actions, public.northstar_writeback_requests, public.northstar_executive_briefs to authenticated;
grant select, insert on public.northstar_workforce_action_evidence to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('workforce-operations-evidence','workforce-operations-evidence',false,41943040,array['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy workforce_operations_storage_select on storage.objects for select to authenticated using (bucket_id = 'workforce-operations-evidence' and (select private.is_org_member((storage.foldername(name))[1]::uuid)));
create policy workforce_operations_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'workforce-operations-evidence' and (select private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','admin','member']::public.organization_role[])));
