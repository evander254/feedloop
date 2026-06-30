-- Backfill: add rows to profiles for auth.users that don't have one yet
insert into profiles (id, email, full_name)
select
  au.id,
  au.email,
  au.raw_user_meta_data ->> 'full_name' as full_name
from auth.users au
left join profiles p on p.id = au.id
where p.id is null;
