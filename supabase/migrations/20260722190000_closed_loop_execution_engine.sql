create table if not exists public.northstar_external_quality_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_tool text not null check (source_tool in ('ncr','capa')),
  source_record_key text not null check (char_length(source_record_key) between 1 and 180),
  title text not null check (char_length(title) between 1 and 320),
  summary text not null default '' check (char_length(summary) <= 16000),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low')),
  record_status text not null default 'open' check (char_length(record_status) <= 120),
  organization_name text not null default '' check (char_length(organization_name) <= 180),
  site text not null default '' check (char_length(site) <= 180),
  department text not null default '' check (char_length(department) <= 180),
  customer_name text not null default '' check (char_length(customer_name) <= 240),
  supplier_name text not null default '' check (char_length(supplier_name) <= 240),
  product_name text not null default '' check (char_length(product_name) <= 320),
  part_number text not null default '' check (char_length(part_number) <= 180),
  order_number text not null default '' check (char_length(order_number) <= 180),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  due_date date,
  financial_exposure numeric(18,2) not null default 0,
  revenue_exposure numeric(18,2) not null default 0,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source_tool, source_record_key)
);
create unique index if not exists northstar_external_quality_records_id_org_uidx on public.northstar_external_quality_records(id, organization_id);
create index if not exists northstar_external_quality_records_org_source_idx on public.northstar_external_quality_records(organization_id, source_tool, severity, submitted_at desc);

create table if not exists public.northstar_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  canonical_key text not null check (char_length(canonical_key) between 1 and 260),
  display_name text not null check (char_length(display_name) between 1 and 320),
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, entity_type, canonical_key)
);
create unique index if not exists northstar_entities_id_org_uidx on public.northstar_entities(id, organization_id);
create index if not exists northstar_entities_org_type_idx on public.northstar_entities(organization_id, entity_type, display_name);

create table if not exists public.northstar_entity_aliases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null,
  alias_type text not null default 'name' check (char_length(alias_type) <= 80),
  alias_value text not null check (char_length(alias_value) between 1 and 320),
  normalized_alias text not null check (char_length(normalized_alias) between 1 and 320),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint northstar_entity_aliases_entity_org_fkey foreign key (entity_id, organization_id) references public.northstar_entities(id, organization_id) on delete cascade,
  unique (organization_id, alias_type, normalized_alias, entity_id)
);
create index if not exists northstar_entity_aliases_org_alias_idx on public.northstar_entity_aliases(organization_id, normalized_alias);

create table if not exists public.northstar_event_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null,
  entity_id uuid not null,
  entity_role text not null default 'involved' check (char_length(entity_role) <= 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint northstar_event_entities_event_org_fkey foreign key (event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete cascade,
  constraint northstar_event_entities_entity_org_fkey foreign key (entity_id, organization_id) references public.northstar_entities(id, organization_id) on delete cascade,
  unique (event_id, entity_id, entity_role)
);
create index if not exists northstar_event_entities_org_entity_idx on public.northstar_event_entities(organization_id, entity_id, created_at desc);

create table if not exists public.northstar_entity_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  left_entity_id uuid not null,
  right_entity_id uuid not null,
  relationship_type text not null check (char_length(relationship_type) between 1 and 120),
  source_event_id uuid not null,
  confidence smallint not null default 100 check (confidence between 0 and 100),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_entity_relationships_left_org_fkey foreign key (left_entity_id, organization_id) references public.northstar_entities(id, organization_id) on delete cascade,
  constraint northstar_entity_relationships_right_org_fkey foreign key (right_entity_id, organization_id) references public.northstar_entities(id, organization_id) on delete cascade,
  constraint northstar_entity_relationships_event_org_fkey foreign key (source_event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete cascade,
  check (left_entity_id <> right_entity_id),
  unique (organization_id, left_entity_id, right_entity_id, relationship_type, source_event_id)
);
create index if not exists northstar_entity_relationships_org_left_idx on public.northstar_entity_relationships(organization_id, left_entity_id, relationship_type);
create index if not exists northstar_entity_relationships_org_right_idx on public.northstar_entity_relationships(organization_id, right_entity_id, relationship_type);

create table if not exists public.northstar_tool_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_action_id uuid not null,
  source_event_id uuid not null,
  target_tool text not null check (char_length(target_tool) between 1 and 160),
  target_record text not null default '' check (char_length(target_record) <= 180),
  title text not null check (char_length(title) between 1 and 400),
  owner_name text not null default '' check (char_length(owner_name) <= 180),
  due_date date,
  priority text not null default 'normal' check (priority in ('urgent','high','normal','low')),
  action_status text not null default 'approved' check (action_status in ('approved','in_progress','evidence_review','blocked','done','rejected')),
  verification_required text not null default '' check (char_length(verification_required) <= 8000),
  progress_note text not null default '' check (char_length(progress_note) <= 8000),
  evidence_names jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_names) = 'array'),
  written_by uuid not null references auth.users(id) on delete restrict,
  written_at timestamptz not null default now(),
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  closure_note text not null default '' check (char_length(closure_note) <= 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint northstar_tool_actions_source_action_org_fkey foreign key (source_action_id, organization_id) references public.northstar_workforce_actions(id, organization_id) on delete cascade,
  constraint northstar_tool_actions_source_event_org_fkey foreign key (source_event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete cascade,
  unique (source_action_id, target_tool, target_record)
);
create unique index if not exists northstar_tool_actions_id_org_uidx on public.northstar_tool_actions(id, organization_id);
create index if not exists northstar_tool_actions_org_target_idx on public.northstar_tool_actions(organization_id, target_tool, target_record, action_status, due_date);
create unique index if not exists northstar_writeback_requests_id_org_uidx on public.northstar_writeback_requests(id, organization_id);

create table if not exists public.northstar_closed_loop_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid,
  action_id uuid,
  tool_action_id uuid,
  writeback_id uuid,
  audit_type text not null check (char_length(audit_type) between 1 and 120),
  detail text not null default '' check (char_length(detail) <= 12000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  performed_by uuid references auth.users(id) on delete set null,
  performed_at timestamptz not null default now(),
  constraint northstar_closed_loop_audit_event_org_fkey foreign key (event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete cascade,
  constraint northstar_closed_loop_audit_action_org_fkey foreign key (action_id, organization_id) references public.northstar_workforce_actions(id, organization_id) on delete cascade,
  constraint northstar_closed_loop_audit_tool_action_org_fkey foreign key (tool_action_id, organization_id) references public.northstar_tool_actions(id, organization_id) on delete cascade,
  constraint northstar_closed_loop_audit_writeback_org_fkey foreign key (writeback_id, organization_id) references public.northstar_writeback_requests(id, organization_id) on delete cascade
);
create index if not exists northstar_closed_loop_audit_org_time_idx on public.northstar_closed_loop_audit(organization_id, performed_at desc);

create table if not exists public.northstar_operating_rhythms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  timezone_name text not null default 'America/Chicago' check (char_length(timezone_name) <= 100),
  daily_enabled boolean not null default true,
  daily_local_time time not null default '07:00',
  weekly_enabled boolean not null default true,
  weekly_day smallint not null default 1 check (weekly_day between 0 and 6),
  weekly_local_time time not null default '07:30',
  atlas_overdue_enabled boolean not null default true,
  pilot_brief_enabled boolean not null default true,
  last_daily_run timestamptz,
  last_weekly_run timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.northstar_operating_rhythm_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rhythm_id uuid references public.northstar_operating_rhythms(id) on delete set null,
  run_type text not null check (run_type in ('daily','weekly','manual')),
  run_date date not null default current_date,
  run_status text not null default 'completed' check (run_status in ('started','completed','partial','failed')),
  source_event_count integer not null default 0,
  overdue_action_count integer not null default 0,
  brief_id uuid references public.northstar_executive_briefs(id) on delete set null,
  atlas_event_id uuid,
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  error_message text not null default '' check (char_length(error_message) <= 8000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint northstar_operating_rhythm_runs_atlas_event_org_fkey foreign key (atlas_event_id, organization_id) references public.northstar_intelligence_events(id, organization_id) on delete set null,
  unique (organization_id, run_type, run_date)
);
create index if not exists northstar_operating_rhythm_runs_org_date_idx on public.northstar_operating_rhythm_runs(organization_id, run_date desc, run_type);

insert into public.northstar_routing_rules (rule_name, source_tool, event_type, minimum_severity, agent_codes, assignment_reason, rule_priority)
select * from (values
  ('NCR closed-loop response team','ncr','*','low','["Atlas","Forge","Sentinel","Vector","Ledger"]'::jsonb,'Nonconformance requires containment ownership, technical cause review, evidence control, recurrence prevention, and cost intelligence.',950),
  ('CAPA closed-loop response team','capa','*','low','["Atlas","Forge","Sentinel","Vector","Ledger"]'::jsonb,'Corrective action requires owned execution, cause quality, evidence sufficiency, systemic prevention, and value verification.',950),
  ('Operating rhythm accountability','operating-rhythm','*','low','["Atlas"]'::jsonb,'The operating rhythm routes overdue and blocked work to Atlas while Pilot retains executive coordination.',925)
) as defaults(rule_name,source_tool,event_type,minimum_severity,agent_codes,assignment_reason,rule_priority)
where not exists (select 1 from public.northstar_routing_rules r where r.organization_id is null and r.rule_name = defaults.rule_name);

create or replace function private.northstar_normalize_entity_key(value text)
returns text language sql immutable as $$
  select trim(both '-' from lower(regexp_replace(coalesce(value,''), '[^a-zA-Z0-9]+', '-', 'g')))
$$;

create or replace function private.northstar_upsert_entity(p_organization_id uuid,p_entity_type text,p_key text,p_display_name text,p_attributes jsonb,p_created_by uuid)
returns uuid language plpgsql security definer set search_path = public, private as $$
declare result_id uuid; normalized_key text := private.northstar_normalize_entity_key(p_key);
begin
  if normalized_key = '' or coalesce(trim(p_display_name),'') = '' then return null; end if;
  insert into public.northstar_entities (organization_id,entity_type,canonical_key,display_name,attributes,created_by,last_seen_at,updated_at)
  values (p_organization_id,p_entity_type,normalized_key,trim(p_display_name),coalesce(p_attributes,'{}'::jsonb),p_created_by,now(),now())
  on conflict (organization_id,entity_type,canonical_key) do update set display_name=excluded.display_name,attributes=northstar_entities.attributes||excluded.attributes,last_seen_at=now(),updated_at=now()
  returning id into result_id;
  insert into public.northstar_entity_aliases (organization_id,entity_id,alias_type,alias_value,normalized_alias,created_by)
  values (p_organization_id,result_id,'name',trim(p_display_name),private.northstar_normalize_entity_key(p_display_name),p_created_by) on conflict do nothing;
  return result_id;
end;
$$;

create or replace function private.northstar_link_event_entity(p_event_id uuid,p_entity_id uuid,p_role text,p_created_by uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare org_id uuid;
begin
  if p_entity_id is null then return; end if;
  select organization_id into org_id from public.northstar_intelligence_events where id=p_event_id;
  if org_id is null then return; end if;
  insert into public.northstar_event_entities (organization_id,event_id,entity_id,entity_role,created_by)
  values (org_id,p_event_id,p_entity_id,p_role,p_created_by) on conflict (event_id,entity_id,entity_role) do nothing;
end;
$$;

create or replace function private.northstar_sync_event_entities(p_event_id uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare event_row public.northstar_intelligence_events%rowtype; source_entity uuid; related_entity uuid; record_payload jsonb; setup_payload jsonb; value_text text;
begin
  select * into event_row from public.northstar_intelligence_events where id=p_event_id;
  if not found then return; end if;
  record_payload:=coalesce(event_row.source_payload->'record',event_row.source_payload,'{}'::jsonb);
  setup_payload:=coalesce(event_row.source_payload->'setup','{}'::jsonb);
  source_entity:=private.northstar_upsert_entity(event_row.organization_id,'record',event_row.source_tool||':'||event_row.source_record_key,event_row.source_record_key||' · '||initcap(replace(event_row.source_tool,'-',' ')),jsonb_build_object('sourceTool',event_row.source_tool,'sourcePath',event_row.source_path),event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,source_entity,'source_record',event_row.created_by);

  value_text:=coalesce(nullif(event_row.site,''),nullif(setup_payload->>'site',''),nullif(record_payload->>'site',''));
  related_entity:=private.northstar_upsert_entity(event_row.organization_id,'site',value_text,value_text,'{}'::jsonb,event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,related_entity,'site',event_row.created_by);
  if source_entity is not null and related_entity is not null and source_entity<>related_entity then insert into public.northstar_entity_relationships (organization_id,left_entity_id,right_entity_id,relationship_type,source_event_id,evidence,created_by) values (event_row.organization_id,source_entity,related_entity,'occurs_at',event_row.id,jsonb_build_object('source',event_row.source_record_key),event_row.created_by) on conflict do nothing; end if;

  value_text:=coalesce(nullif(event_row.customer_name,''),nullif(setup_payload->>'customer',''),nullif(record_payload->>'customer',''),nullif(record_payload->>'customerName',''));
  related_entity:=private.northstar_upsert_entity(event_row.organization_id,'customer',value_text,value_text,'{}'::jsonb,event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,related_entity,'customer',event_row.created_by);
  if source_entity is not null and related_entity is not null then insert into public.northstar_entity_relationships (organization_id,left_entity_id,right_entity_id,relationship_type,source_event_id,evidence,created_by) values (event_row.organization_id,source_entity,related_entity,'affects_customer',event_row.id,jsonb_build_object('source',event_row.source_record_key),event_row.created_by) on conflict do nothing; end if;

  value_text:=coalesce(nullif(event_row.supplier_name,''),nullif(setup_payload->>'supplier',''),nullif(record_payload->>'supplier',''),nullif(record_payload->>'supplierName',''));
  related_entity:=private.northstar_upsert_entity(event_row.organization_id,'supplier',value_text,value_text,'{}'::jsonb,event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,related_entity,'supplier',event_row.created_by);
  if source_entity is not null and related_entity is not null then insert into public.northstar_entity_relationships (organization_id,left_entity_id,right_entity_id,relationship_type,source_event_id,evidence,created_by) values (event_row.organization_id,source_entity,related_entity,'involves_supplier',event_row.id,jsonb_build_object('source',event_row.source_record_key),event_row.created_by) on conflict do nothing; end if;

  value_text:=coalesce(nullif(event_row.asset_name,''),nullif(setup_payload->>'asset',''),nullif(record_payload->>'asset',''),nullif(record_payload->>'equipment',''));
  related_entity:=private.northstar_upsert_entity(event_row.organization_id,'asset',value_text,value_text,'{}'::jsonb,event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,related_entity,'asset',event_row.created_by);
  if source_entity is not null and related_entity is not null then insert into public.northstar_entity_relationships (organization_id,left_entity_id,right_entity_id,relationship_type,source_event_id,evidence,created_by) values (event_row.organization_id,source_entity,related_entity,'involves_asset',event_row.id,jsonb_build_object('source',event_row.source_record_key),event_row.created_by) on conflict do nothing; end if;

  value_text:=coalesce(nullif(event_row.order_number,''),nullif(setup_payload->>'orderNumber',''),nullif(record_payload->>'orderNumber',''),nullif(record_payload->>'salesOrder',''),nullif(record_payload->>'workOrder',''));
  related_entity:=private.northstar_upsert_entity(event_row.organization_id,'order',value_text,value_text,'{}'::jsonb,event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,related_entity,'order',event_row.created_by);
  if source_entity is not null and related_entity is not null then insert into public.northstar_entity_relationships (organization_id,left_entity_id,right_entity_id,relationship_type,source_event_id,evidence,created_by) values (event_row.organization_id,source_entity,related_entity,'affects_order',event_row.id,jsonb_build_object('source',event_row.source_record_key),event_row.created_by) on conflict do nothing; end if;

  value_text:=coalesce(nullif(setup_payload->>'product',''),nullif(record_payload->>'product',''),nullif(record_payload->>'productName',''),nullif(record_payload->>'partNumber',''));
  related_entity:=private.northstar_upsert_entity(event_row.organization_id,'product',value_text,value_text,jsonb_build_object('partNumber',coalesce(record_payload->>'partNumber','')),event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,related_entity,'product',event_row.created_by);
  if source_entity is not null and related_entity is not null then insert into public.northstar_entity_relationships (organization_id,left_entity_id,right_entity_id,relationship_type,source_event_id,evidence,created_by) values (event_row.organization_id,source_entity,related_entity,'affects_product',event_row.id,jsonb_build_object('source',event_row.source_record_key),event_row.created_by) on conflict do nothing; end if;

  value_text:=coalesce(nullif(event_row.owner_name,''),nullif(setup_payload->>'owner',''),nullif(record_payload->>'owner',''),nullif(record_payload->>'capaOwner',''));
  related_entity:=private.northstar_upsert_entity(event_row.organization_id,'person',value_text,value_text,'{}'::jsonb,event_row.created_by);
  perform private.northstar_link_event_entity(event_row.id,related_entity,'owner',event_row.created_by);
  if source_entity is not null and related_entity is not null then insert into public.northstar_entity_relationships (organization_id,left_entity_id,right_entity_id,relationship_type,source_event_id,evidence,created_by) values (event_row.organization_id,source_entity,related_entity,'owned_by',event_row.id,jsonb_build_object('source',event_row.source_record_key),event_row.created_by) on conflict do nothing; end if;
end;
$$;

create or replace function private.northstar_entity_graph_trigger()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin perform private.northstar_sync_event_entities(new.id); return new; end;
$$;
drop trigger if exists northstar_entity_graph_trigger on public.northstar_intelligence_events;
create trigger northstar_entity_graph_trigger after insert or update of source_payload,customer_name,supplier_name,asset_name,order_number,owner_name,site on public.northstar_intelligence_events for each row execute function private.northstar_entity_graph_trigger();

create or replace function private.northstar_external_quality_event_trigger()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare event_id uuid; event_key_value text := 'external-quality:'||new.id::text;
begin
  insert into public.northstar_intelligence_events (event_key,organization_id,source_tool,source_table,source_record_id,source_record_key,source_path,event_type,event_title,summary,severity,event_status,organization_name,site,department,customer_name,supplier_name,order_number,owner_name,due_date,financial_exposure,revenue_exposure,requires_decision,human_authority_required,source_payload,routing_context,evidence_refs,created_by,source_submitted_at,updated_at)
  values (event_key_value,new.organization_id,new.source_tool,'northstar_external_quality_records',new.id,new.source_record_key,case new.source_tool when 'ncr' then '/tools/ncr' else '/tools/capa' end,new.source_tool||'-submitted',new.title,new.summary,new.severity,'new',new.organization_name,new.site,new.department,new.customer_name,new.supplier_name,new.order_number,new.owner_name,new.due_date,new.financial_exposure,new.revenue_exposure,new.severity in ('critical','high'),true,new.payload,jsonb_build_object('recordStatus',new.record_status,'partNumber',new.part_number,'productName',new.product_name),coalesce(new.payload->'evidence','[]'::jsonb),new.created_by,new.submitted_at,now())
  on conflict (event_key) do update set event_title=excluded.event_title,summary=excluded.summary,severity=excluded.severity,organization_name=excluded.organization_name,site=excluded.site,department=excluded.department,customer_name=excluded.customer_name,supplier_name=excluded.supplier_name,order_number=excluded.order_number,owner_name=excluded.owner_name,due_date=excluded.due_date,financial_exposure=excluded.financial_exposure,revenue_exposure=excluded.revenue_exposure,requires_decision=excluded.requires_decision,source_payload=excluded.source_payload,routing_context=excluded.routing_context,event_status=case when northstar_intelligence_events.event_status in ('closed','dismissed') then northstar_intelligence_events.event_status else 'new' end,source_submitted_at=excluded.source_submitted_at,updated_at=now()
  returning id into event_id;
  perform private.northstar_route_event(event_id);
  return new;
end;
$$;
drop trigger if exists northstar_external_quality_event_trigger on public.northstar_external_quality_records;
create trigger northstar_external_quality_event_trigger after insert or update on public.northstar_external_quality_records for each row execute function private.northstar_external_quality_event_trigger();

create or replace function private.northstar_native_writeback_trigger()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare action_row public.northstar_workforce_actions%rowtype; tool_action_id uuid;
begin
  if new.writeback_status='executed' and old.writeback_status is distinct from 'executed' then
    select * into action_row from public.northstar_workforce_actions where id=new.action_id and organization_id=new.organization_id;
    if found then
      insert into public.northstar_tool_actions (organization_id,source_action_id,source_event_id,target_tool,target_record,title,owner_name,due_date,priority,action_status,verification_required,progress_note,evidence_names,written_by,written_at,updated_at)
      values (new.organization_id,action_row.id,action_row.event_id,new.target_tool,new.target_record,action_row.title,action_row.owner_name,action_row.due_date,action_row.priority,'approved',action_row.verification_required,coalesce(new.execution_note,''),action_row.evidence_names,coalesce(new.executed_by,action_row.created_by),coalesce(new.executed_at,now()),now())
      on conflict (source_action_id,target_tool,target_record) do update set title=excluded.title,owner_name=excluded.owner_name,due_date=excluded.due_date,priority=excluded.priority,verification_required=excluded.verification_required,progress_note=excluded.progress_note,written_by=excluded.written_by,written_at=excluded.written_at,updated_at=now()
      returning id into tool_action_id;
      update public.northstar_workforce_actions set action_status=case when action_status='approved' then 'in_progress' else action_status end,updated_at=now() where id=action_row.id;
      insert into public.northstar_closed_loop_audit (organization_id,event_id,action_id,tool_action_id,writeback_id,audit_type,detail,metadata,performed_by)
      values (new.organization_id,action_row.event_id,action_row.id,tool_action_id,new.id,'native_writeback_executed',format('Approved action written into %s record %s.',new.target_tool,coalesce(nullif(new.target_record,''),'unassigned')),jsonb_build_object('targetTool',new.target_tool,'targetRecord',new.target_record,'operation',new.writeback_operation),coalesce(new.executed_by,action_row.created_by));
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists northstar_native_writeback_trigger on public.northstar_writeback_requests;
create trigger northstar_native_writeback_trigger after update of writeback_status on public.northstar_writeback_requests for each row execute function private.northstar_native_writeback_trigger();

create or replace function private.northstar_tool_action_sync_trigger()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  update public.northstar_workforce_actions set action_status=new.action_status,progress_note=new.progress_note,evidence_names=new.evidence_names,closed_by=new.closed_by,closed_at=new.closed_at,closure_note=new.closure_note,updated_at=now() where id=new.source_action_id and organization_id=new.organization_id;
  insert into public.northstar_closed_loop_audit (organization_id,event_id,action_id,tool_action_id,audit_type,detail,metadata,performed_by)
  values (new.organization_id,new.source_event_id,new.source_action_id,new.id,'target_tool_action_updated',format('%s action in %s is now %s.',new.title,new.target_tool,new.action_status),jsonb_build_object('targetRecord',new.target_record,'progressNote',new.progress_note,'evidenceNames',new.evidence_names),coalesce(new.closed_by,new.written_by));
  if new.action_status='done' and not exists (select 1 from public.northstar_workforce_actions where event_id=new.source_event_id and action_status not in ('done','rejected')) then update public.northstar_intelligence_events set event_status='closed',updated_at=now() where id=new.source_event_id and event_status not in ('dismissed'); else update public.northstar_intelligence_events set updated_at=now() where id=new.source_event_id; end if;
  return new;
end;
$$;
drop trigger if exists northstar_tool_action_sync_trigger on public.northstar_tool_actions;
create trigger northstar_tool_action_sync_trigger after update of action_status,progress_note,evidence_names,closed_at on public.northstar_tool_actions for each row execute function private.northstar_tool_action_sync_trigger();

do $$ declare event_row record; begin for event_row in select id from public.northstar_intelligence_events loop perform private.northstar_sync_event_entities(event_row.id); end loop; end $$;

insert into public.northstar_operating_rhythms (organization_id,created_by)
select o.id,(select om.user_id from public.organization_members om where om.organization_id=o.id order by om.created_at limit 1) from public.organizations o on conflict (organization_id) do nothing;

alter table public.northstar_external_quality_records enable row level security;
alter table public.northstar_entities enable row level security;
alter table public.northstar_entity_aliases enable row level security;
alter table public.northstar_event_entities enable row level security;
alter table public.northstar_entity_relationships enable row level security;
alter table public.northstar_tool_actions enable row level security;
alter table public.northstar_closed_loop_audit enable row level security;
alter table public.northstar_operating_rhythms enable row level security;
alter table public.northstar_operating_rhythm_runs enable row level security;

create policy northstar_external_quality_records_select on public.northstar_external_quality_records for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_external_quality_records_insert on public.northstar_external_quality_records for insert to authenticated with check (created_by=(select auth.uid()) and (select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_external_quality_records_update on public.northstar_external_quality_records for update to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_entities_select on public.northstar_entities for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_entities_write on public.northstar_entities for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_entity_aliases_select on public.northstar_entity_aliases for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_entity_aliases_write on public.northstar_entity_aliases for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_event_entities_select on public.northstar_event_entities for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_event_entities_write on public.northstar_event_entities for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_entity_relationships_select on public.northstar_entity_relationships for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_entity_relationships_write on public.northstar_entity_relationships for all to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_tool_actions_select on public.northstar_tool_actions for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_tool_actions_update on public.northstar_tool_actions for update to authenticated using ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));
create policy northstar_closed_loop_audit_select on public.northstar_closed_loop_audit for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_operating_rhythms_select on public.northstar_operating_rhythms for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_operating_rhythms_update on public.northstar_operating_rhythms for update to authenticated using ((select private.has_org_role(organization_id,array['owner','admin']::public.organization_role[]))) with check ((select private.has_org_role(organization_id,array['owner','admin']::public.organization_role[])));
create policy northstar_operating_rhythm_runs_select on public.northstar_operating_rhythm_runs for select to authenticated using ((select private.is_org_member(organization_id)));
create policy northstar_operating_rhythm_runs_insert on public.northstar_operating_rhythm_runs for insert to authenticated with check ((select private.has_org_role(organization_id,array['owner','admin','member']::public.organization_role[])));

revoke all on public.northstar_external_quality_records,public.northstar_entities,public.northstar_entity_aliases,public.northstar_event_entities,public.northstar_entity_relationships,public.northstar_tool_actions,public.northstar_closed_loop_audit,public.northstar_operating_rhythms,public.northstar_operating_rhythm_runs from anon,authenticated;
grant select,insert,update on public.northstar_external_quality_records to authenticated;
grant select on public.northstar_entities,public.northstar_entity_aliases,public.northstar_event_entities,public.northstar_entity_relationships,public.northstar_closed_loop_audit to authenticated;
grant select,update on public.northstar_tool_actions to authenticated;
grant select,update on public.northstar_operating_rhythms to authenticated;
grant select,insert on public.northstar_operating_rhythm_runs to authenticated;
