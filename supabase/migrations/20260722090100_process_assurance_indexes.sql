create index if not exists process_assurance_audits_created_by_idx
  on public.process_assurance_audits(created_by);
create index if not exists process_assurance_findings_audit_org_idx
  on public.process_assurance_findings(audit_id, organization_id);
create index if not exists process_assurance_findings_created_by_idx
  on public.process_assurance_findings(created_by);
create index if not exists process_assurance_evidence_audit_org_idx
  on public.process_assurance_evidence(audit_id, organization_id);
create index if not exists process_assurance_evidence_finding_org_idx
  on public.process_assurance_evidence(finding_id, organization_id);
create index if not exists process_assurance_evidence_organization_idx
  on public.process_assurance_evidence(organization_id);
create index if not exists process_assurance_evidence_uploaded_by_idx
  on public.process_assurance_evidence(uploaded_by);
