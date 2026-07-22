create or replace function private.northstar_global_route_event_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.northstar_route_event(new.id);
  return new;
end;
$$;

drop trigger if exists northstar_global_route_event_trigger on public.northstar_intelligence_events;
create trigger northstar_global_route_event_trigger
after insert or update of severity, source_tool, event_type
on public.northstar_intelligence_events
for each row execute function private.northstar_global_route_event_trigger();
