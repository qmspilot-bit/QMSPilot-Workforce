create index if not exists closure_evidence_work_item_organization_uploaded_idx
  on public.closure_evidence(work_item_id, organization_id, uploaded_at desc);
