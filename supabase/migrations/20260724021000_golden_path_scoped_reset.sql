drop policy if exists northstar_intelligence_events_write on public.northstar_intelligence_events;

create policy northstar_intelligence_events_insert
on public.northstar_intelligence_events
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(
    organization_id,
    array['owner','admin','member']::public.organization_role[]
  ))
);

create policy northstar_intelligence_events_update
on public.northstar_intelligence_events
for update
to authenticated
using (
  (select private.has_org_role(
    organization_id,
    array['owner','admin','member']::public.organization_role[]
  ))
)
with check (
  created_by = (select auth.uid())
  and (select private.has_org_role(
    organization_id,
    array['owner','admin','member']::public.organization_role[]
  ))
);

create policy northstar_intelligence_events_delete_golden_path
on public.northstar_intelligence_events
for delete
to authenticated
using (
  (select private.has_org_role(
    organization_id,
    array['owner','admin','member']::public.organization_role[]
  ))
  and source_record_key = any(array[
    'GP-COMPLAINT-001','GP-NCR-001','GP-CAPA-001','GP-MEAS-001',
    'GP-SUP-001','GP-DEL-001','GP-WRK-001','GP-VALUE-001'
  ]::text[])
  and (
    source_payload->>'scenarioKey' = 'customer-recovery-v1'
    or routing_context->>'scenarioKey' = 'customer-recovery-v1'
  )
);

create policy northstar_external_quality_records_delete_golden_path
on public.northstar_external_quality_records
for delete
to authenticated
using (
  (select private.has_org_role(
    organization_id,
    array['owner','admin','member']::public.organization_role[]
  ))
  and source_record_key = any(array['GP-NCR-001','GP-CAPA-001']::text[])
  and payload->>'scenarioKey' = 'customer-recovery-v1'
);

grant delete on public.northstar_intelligence_events to authenticated;
grant delete on public.northstar_external_quality_records to authenticated;
