-- Add views column to forms, surveys, and polls
alter table forms add column if not exists views integer not null default 0;
alter table surveys add column if not exists views integer not null default 0;
alter table polls add column if not exists views integer not null default 0;

-- Atomic increment function
create or replace function increment_views(_table text, _id uuid)
returns void as $$
begin
  if _table = 'forms' then
    update forms set views = views + 1 where id = _id;
  elsif _table = 'surveys' then
    update surveys set views = views + 1 where id = _id;
  elsif _table = 'polls' then
    update polls set views = views + 1 where id = _id;
  end if;
end;
$$ language plpgsql security definer;
