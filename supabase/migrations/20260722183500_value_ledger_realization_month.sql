alter table public.value_ledger_events
  alter column realization_start type text
  using case when realization_start is null then null else to_char(realization_start, 'YYYY-MM') end;

alter table public.value_ledger_events
  add constraint value_ledger_events_realization_start_month_check
  check (realization_start is null or realization_start ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
