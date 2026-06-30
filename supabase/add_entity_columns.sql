-- Add entity tracking columns to existing notifications table
alter table notifications add column if not exists entity_type text;
alter table notifications add column if not exists entity_id uuid;
