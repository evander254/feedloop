-- Run in Supabase SQL editor to allow authenticated users to upload organization logos.

drop policy if exists "logos_insert" on storage.objects;
drop policy if exists "logos_select" on storage.objects;
drop policy if exists "logos_delete" on storage.objects;

create policy "logos_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'logos');

create policy "logos_select"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'logos');

create policy "logos_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'logos');
