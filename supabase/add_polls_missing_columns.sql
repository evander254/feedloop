-- Run this in your Supabase SQL editor

alter table polls
  add column if not exists is_public boolean default false,
  add column if not exists is_timed boolean default false,
  add column if not exists start_date timestamptz,
  add column if not exists end_date timestamptz,
  add column if not exists publish_at timestamptz,
  add column if not exists closes_at timestamptz,
  add column if not exists organization_id uuid references organizations(id),
  add column if not exists created_at timestamptz default now(),
  add column if not exists created_by uuid references profiles(id);

alter table poll_options
  add column if not exists image_url text;
