-- =============================================
-- Add updated_at tracking for draft saves
-- =============================================

alter table forms add column if not exists updated_at timestamptz default now();

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_forms_updated_at on forms;
create trigger set_forms_updated_at
  before update on forms
  for each row execute function set_updated_at();
