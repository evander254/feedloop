-- =============================================
-- Add organization_id to forms and polls
-- =============================================

alter table forms
  add column if not exists organization_id uuid references organizations(id);

alter table polls
  add column if not exists organization_id uuid references organizations(id);

create index if not exists idx_forms_organization_id on forms (organization_id);
create index if not exists idx_polls_organization_id on polls (organization_id);
