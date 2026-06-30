-- =========================
-- SURVEYS
-- =========================

create table if not exists surveys (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    is_public boolean default false,
    status text default 'draft',
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

create table if not exists survey_fields (
    id uuid primary key default uuid_generate_v4(),
    survey_id uuid references surveys(id) on delete cascade,
    field_label text not null,
    field_type text not null,
    placeholder text,
    options jsonb,
    is_required boolean default false,
    sort_order integer default 0
);

create table if not exists survey_responses (
    id uuid primary key default uuid_generate_v4(),
    survey_id uuid references surveys(id) on delete cascade,
    submitted_by uuid references profiles(id),
    submitted_at timestamptz default now()
);

create table if not exists survey_response_answers (
    id uuid primary key default uuid_generate_v4(),
    response_id uuid references survey_responses(id) on delete cascade,
    field_id uuid references survey_fields(id),
    answer text
);

-- =========================
-- POLLS (add created_by)
-- =========================

alter table polls add column if not exists created_by uuid references profiles(id);
