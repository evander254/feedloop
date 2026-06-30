-- =============================================
-- Add location tracking to form_responses
-- =============================================

alter table form_responses
  add column if not exists location text;

-- index for fast location aggregation queries
create index if not exists idx_form_responses_location
  on form_responses (location);
