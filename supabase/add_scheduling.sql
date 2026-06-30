-- =============================================
-- Add scheduling and timed columns to forms and polls
-- =============================================

alter table forms
  add column if not exists publish_at timestamptz,
  add column if not exists closes_at timestamptz,
  add column if not exists is_timed boolean default false;

alter table polls
  add column if not exists publish_at timestamptz,
  add column if not exists is_timed boolean default false;
