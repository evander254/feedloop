-- Prevent duplicate responses/votes from the same logged-in user

create unique index if not exists idx_form_responses_unique
  on form_responses (form_id, submitted_by)
  where submitted_by is not null;

create unique index if not exists idx_survey_responses_unique
  on survey_responses (survey_id, submitted_by)
  where submitted_by is not null;

create unique index if not exists idx_poll_votes_unique
  on poll_votes (poll_id, voter_id)
  where voter_id is not null;
