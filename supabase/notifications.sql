-- =========================
-- NOTIFICATIONS TABLE
-- =========================

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id),
    title text,
    message text,
    entity_type text,
    entity_id uuid,
    is_read boolean default false,
    created_at timestamptz default now()
);

create or replace function public.notify_form_response()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  form_owner uuid;
  form_title text;
begin
  select created_by, title into form_owner, form_title from forms where id = new.form_id;
  if form_owner is not null then
    insert into notifications (user_id, title, message, entity_type, entity_id)
    values (form_owner, 'New form response', 'Someone responded to "' || form_title || '"', 'form', new.form_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_form_response_insert on form_responses;
create trigger on_form_response_insert
  after insert on form_responses
  for each row execute function public.notify_form_response();

-- =========================
-- TRIGGER: survey response → notify survey owner
-- =========================

create or replace function public.notify_survey_response()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  survey_owner uuid;
  survey_title text;
begin
  select created_by, title into survey_owner, survey_title from surveys where id = new.survey_id;
  if survey_owner is not null then
    insert into notifications (user_id, title, message, entity_type, entity_id)
    values (survey_owner, 'New survey response', 'Someone responded to "' || survey_title || '"', 'survey', new.survey_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_survey_response_insert on survey_responses;
create trigger on_survey_response_insert
  after insert on survey_responses
  for each row execute function public.notify_survey_response();

-- =========================
-- TRIGGER: poll vote → notify poll owner
-- =========================

create or replace function public.notify_poll_vote()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  poll_owner uuid;
  poll_title text;
begin
  select created_by, title into poll_owner, poll_title from polls where id = new.poll_id;
  if poll_owner is not null then
    insert into notifications (user_id, title, message, entity_type, entity_id)
    values (poll_owner, 'New poll vote', 'Someone voted in "' || poll_title || '"', 'poll', new.poll_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_poll_vote_insert on poll_votes;
create trigger on_poll_vote_insert
  after insert on poll_votes
  for each row execute function public.notify_poll_vote();
