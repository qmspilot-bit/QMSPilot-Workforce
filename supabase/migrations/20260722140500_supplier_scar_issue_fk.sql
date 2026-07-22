alter table public.supplier_assurance_scars
  drop constraint if exists supplier_assurance_scars_issue_org_fkey;

alter table public.supplier_assurance_scars
  add constraint supplier_assurance_scars_issue_org_fkey
  foreign key (linked_issue_id, organization_id)
  references public.supplier_assurance_issues(id, organization_id);
