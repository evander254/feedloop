-- Enable UUID Extension
create extension if not exists "uuid-ossp";

-- =========================
-- ORGANIZATIONS
-- =========================

create table organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    logo_url text,
    email text,
    phone text,
    country text,
    website text,
    subscription_plan text default 'free',
    status text default 'active',
    created_at timestamptz default now()
);

-- =========================
-- PROFILES
-- =========================

create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    organization_id uuid references organizations(id),
    full_name text,
    email text,
    role text default 'field_officer',
    avatar_url text,
    created_at timestamptz default now()
);

-- =========================
-- PROJECTS
-- =========================

create table projects (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade,
    name text not null,
    description text,
    project_type text,
    status text default 'active',
    start_date date,
    end_date date,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- =========================
-- FORMS
-- =========================

create table forms (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects(id) on delete cascade,
    title text not null,
    description text,
    is_public boolean default false,
    status text default 'draft',
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- =========================
-- FORM FIELDS
-- =========================

create table form_fields (
    id uuid primary key default uuid_generate_v4(),
    form_id uuid references forms(id) on delete cascade,
    field_label text not null,
    field_type text not null,
    placeholder text,
    options jsonb,
    is_required boolean default false,
    sort_order integer default 0
);

-- =========================
-- FORM RESPONSES
-- =========================

create table form_responses (
    id uuid primary key default uuid_generate_v4(),
    form_id uuid references forms(id) on delete cascade,
    submitted_by uuid references profiles(id),
    gps_latitude numeric,
    gps_longitude numeric,
    submitted_at timestamptz default now()
);

-- =========================
-- RESPONSE ANSWERS
-- =========================

create table response_answers (
    id uuid primary key default uuid_generate_v4(),
    response_id uuid references form_responses(id) on delete cascade,
    field_id uuid references form_fields(id),
    answer text
);

-- =========================
-- BENEFICIARIES
-- =========================

create table beneficiaries (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id),
    full_name text,
    gender text,
    age integer,
    phone text,
    county text,
    sub_county text,
    village text,
    household_size integer,
    notes text,
    created_at timestamptz default now()
);

-- =========================
-- BENEFICIARY PROJECTS
-- =========================

create table beneficiary_projects (
    id uuid primary key default uuid_generate_v4(),
    beneficiary_id uuid references beneficiaries(id),
    project_id uuid references projects(id),
    enrolled_at timestamptz default now()
);

-- =========================
-- SURVEYS
-- =========================

create table surveys (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    is_public boolean default false,
    status text default 'draft',
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

create table survey_fields (
    id uuid primary key default uuid_generate_v4(),
    survey_id uuid references surveys(id) on delete cascade,
    field_label text not null,
    field_type text not null,
    placeholder text,
    options jsonb,
    is_required boolean default false,
    sort_order integer default 0
);

create table survey_responses (
    id uuid primary key default uuid_generate_v4(),
    survey_id uuid references surveys(id) on delete cascade,
    submitted_by uuid references profiles(id),
    submitted_at timestamptz default now()
);

create table survey_response_answers (
    id uuid primary key default uuid_generate_v4(),
    response_id uuid references survey_responses(id) on delete cascade,
    field_id uuid references survey_fields(id),
    answer text
);

-- =========================
-- POLLS
-- =========================

create table polls (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects(id),
    title text not null,
    description text,
    allow_multiple boolean default false,
    is_public boolean default true,
    start_date timestamptz,
    end_date timestamptz,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- =========================
-- POLL OPTIONS
-- =========================

create table poll_options (
    id uuid primary key default uuid_generate_v4(),
    poll_id uuid references polls(id) on delete cascade,
    option_text text not null
);

-- =========================
-- POLL VOTES
-- =========================

create table poll_votes (
    id uuid primary key default uuid_generate_v4(),
    poll_id uuid references polls(id),
    option_id uuid references poll_options(id),
    voter_id uuid references profiles(id),
    voted_at timestamptz default now()
);

-- =========================
-- FILES
-- =========================

create table uploaded_files (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id),
    file_name text,
    file_url text,
    file_type text,
    uploaded_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- =========================
-- NOTIFICATIONS
-- =========================

create table notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references profiles(id),
    title text,
    message text,
    is_read boolean default false,
    created_at timestamptz default now()
);

-- =========================
-- SUBSCRIPTIONS
-- =========================

create table subscriptions (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id),
    plan_name text,
    amount numeric(10,2),
    status text,
    start_date date,
    end_date date,
    created_at timestamptz default now()
);

-- =========================
-- MPESA PAYMENTS
-- =========================

create table mpesa_payments (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id),
    amount numeric(10,2),
    phone_number text,
    checkout_request_id text,
    mpesa_receipt_number text,
    status text,
    created_at timestamptz default now()
);

-- =========================
-- AUDIT LOGS
-- =========================

create table audit_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references profiles(id),
    action text,
    entity_type text,
    entity_id uuid,
    created_at timestamptz default now()
);
