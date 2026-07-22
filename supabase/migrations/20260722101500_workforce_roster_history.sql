alter table public.workforce_readiness_people
  add column if not exists photo_name text not null default '' check (char_length(photo_name) <= 255),
  add column if not exists history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array');

create index if not exists workforce_readiness_people_status_idx
  on public.workforce_readiness_people(organization_id, employment_status, department, shift_name);
