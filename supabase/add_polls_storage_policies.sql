-- Run in Supabase SQL editor
-- First ensure the polls bucket exists (create via Storage UI if not),
-- then run these policies.

drop policy if exists "polls_insert" on storage.objects;
drop policy if exists "polls_select" on storage.objects;
drop policy if exists "polls_delete" on storage.objects;

create policy "polls_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'polls');

create policy "polls_select"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'polls');

create policy "polls_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'polls');
