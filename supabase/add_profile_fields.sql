-- =============================================
-- Add additional profile fields
-- =============================================

alter table profiles
  add column if not exists phone text,
  add column if not exists organization text,
  add column if not exists job_title text,
  add column if not exists bio text;
