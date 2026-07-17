alter type public.action_status
  add value if not exists 'ready_for_review' after 'in_progress';

alter table public.work_items
  add column if not exists work_product jsonb,
  add column if not exists work_product_generated_at timestamptz,
  add column if not exists work_product_reviewed_at timestamptz,
  add column if not exists work_product_reviewed_by uuid references auth.users(id) on delete set null;

alter table public.work_items
  add constraint work_items_work_product_object_check
  check (work_product is null or jsonb_typeof(work_product) = 'object');

create index work_items_work_product_reviewed_by_idx
  on public.work_items(work_product_reviewed_by)
  where work_product_reviewed_by is not null;
