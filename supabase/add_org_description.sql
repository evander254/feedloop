-- =============================================
-- Add description to organizations
-- =============================================

alter table organizations
  add column if not exists description text;

-- Create logos storage bucket via SQL function
-- (Run this in Supabase SQL editor if the bucket doesn't exist)
-- select storage.create_bucket('logos', true);
