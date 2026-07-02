-- =============================================
-- Publish scheduled forms & send notifications
-- =============================================

create or replace function public.publish_scheduled_forms()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  f record;
begin
  for f in
    select id, title, created_by
    from forms
    where status = 'draft'
      and publish_at is not null
      and publish_at <= now()
  loop
    update forms set status = 'published', updated_at = now() where id = f.id;

    if f.created_by is not null then
      insert into notifications (user_id, title, message, entity_type, entity_id)
      values (
        f.created_by,
        'Form published',
        'Your form "' || coalesce(f.title, 'Untitled') || '" has been published.',
        'form',
        f.id
      );
    end if;
  end loop;
end;
$$;
