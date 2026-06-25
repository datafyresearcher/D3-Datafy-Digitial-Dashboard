-- =====================================================================
--  Datafy Associates — Supabase schema
--  Run this entire script in the Supabase Dashboard:
--    SQL Editor → "New query" → paste → Run
--  Safe to re-run: idempotent (uses IF NOT EXISTS / ON CONFLICT).
-- =====================================================================

-- ---------------------------------------------------------------------
--  Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";          -- uuid generators
create extension if not exists "pgcrypto";           -- gen_random_uuid()

-- ---------------------------------------------------------------------
--  Helper: updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
--  PROFILES  (1:1 with auth.users — the user-facing identity)
-- =====================================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null,
  email           text not null,
  role            text not null default 'client'
                  check (role in ('super_admin','field_engineer','client')),
  company         text,
  title           text,
  client_id       text,                 -- links to clients.id when role='client'
  client_sub_role text check (client_sub_role in ('client_admin','client_viewer')),
  restricted_project_id text,           -- single project a client_viewer may see
  last_login      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create unique index if not exists profiles_email_uidx on public.profiles (lower(email));

-- =====================================================================
--  CLIENTS
-- =====================================================================
create table if not exists public.clients (
  id           text primary key,                       -- e.g. 'c-nestle'
  company      text not null,
  contact_name text not null,
  email        text not null,
  phone        text,
  billing_tier text not null default 'Basic'
               check (billing_tier in ('Basic','Pro','Enterprise')),
  status       text not null default 'Active'
               check (status in ('Active','Suspended','Archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_clients_touch on public.clients;
create trigger trg_clients_touch
  before update on public.clients
  for each row execute function public.touch_updated_at();

-- =====================================================================
--  CLIENT ACTIVITY  (1:many with clients)
-- =====================================================================
create table if not exists public.client_activity (
  id          uuid primary key default gen_random_uuid(),
  client_id   text not null references public.clients(id) on delete cascade,
  ts          timestamptz not null default now(),
  type        text check (type in ('login','view','download','upload','edit','create')),
  detail      text
);
create index if not exists idx_client_activity_client on public.client_activity(client_id);

-- =====================================================================
--  PROJECTS
-- =====================================================================
create table if not exists public.projects (
  id              text primary key,                    -- e.g. 'p-nestle-1'
  client_id       text not null references public.clients(id) on delete cascade,
  name            text not null,
  address         text not null,
  lat             numeric(9,6) not null,
  lng             numeric(9,6) not null,
  size_kwp        numeric(12,2) not null default 0,
  panel_count     integer not null default 0,
  inverter_brand  text,
  inverter_model  text,
  has_battery     boolean not null default false,
  battery_system  text,
  grid_type       text check (grid_type in ('On-grid','Off-grid','Hybrid')),
  installed_at    date,
  warranty_expiry date,
  site_contact_name  text,
  site_contact_phone text,
  classification  text check (classification in ('Residential','Commercial','Industrial')),
  status          text not null default 'Active'
                  check (status in ('Active','Under Maintenance','Decommissioned')),
  string_zones        jsonb not null default '[]'::jsonb,
  gallery             jsonb not null default '[]'::jsonb,
  client_notes        text not null default '',
  maintenance_schedule jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_projects_touch on public.projects;
create trigger trg_projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

create index if not exists idx_projects_client on public.projects(client_id);

-- =====================================================================
--  MAINTENANCE VISITS  (+ nested defects as a child table)
-- =====================================================================
create table if not exists public.visits (
  id              uuid primary key default gen_random_uuid(),
  project_id      text not null references public.projects(id) on delete cascade,
  date            date not null,
  technician      text not null,
  cleaning_type   text check (cleaning_type in ('Dry cleaning','Wet cleaning','Robotic cleaning','None')),
  weather         text check (weather in ('Sunny','Cloudy','Overcast','Rainy')),
  pre_observation text not null default '',
  post_observation text not null default '',
  images          jsonb not null default '[]'::jsonb,   -- VisitImage[]
  signature       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_visits_touch on public.visits;
create trigger trg_visits_touch
  before update on public.visits
  for each row execute function public.touch_updated_at();

create index if not exists idx_visits_project on public.visits(project_id);

create table if not exists public.defects (
  id          uuid primary key default gen_random_uuid(),
  visit_id    uuid not null references public.visits(id) on delete cascade,
  category    text check (category in ('Physical damage','Soiling','Loose connection','Other')),
  description text not null default '',
  status      text not null default 'Open' check (status in ('Open','Resolved')),
  opened_at   timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_defects_visit on public.defects(visit_id);

-- =====================================================================
--  DRONE INSPECTIONS  (+ nested anomalies as a child table)
-- =====================================================================
create table if not exists public.inspections (
  id              uuid primary key default gen_random_uuid(),
  project_id      text not null references public.projects(id) on delete cascade,
  date            date not null,
  orthomosaic_url text,
  rgb_url         text,
  thermal_url     text,
  report_pdf_url  text,
  processed_images jsonb not null default '[]'::jsonb,
  layout_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_inspections_touch on public.inspections;
create trigger trg_inspections_touch
  before update on public.inspections
  for each row execute function public.touch_updated_at();

create index if not exists idx_inspections_project on public.inspections(project_id);

create table if not exists public.anomalies (
  id           uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  panel_id     text not null,
  type         text check (type in ('Hotspot','Crack','Delamination','Soiling','Bird droppings')),
  severity     text check (severity in ('Critical','Warning','Info')),
  status       text not null default 'Open' check (status in ('Open','Resolved')),
  detected_at  date not null,
  resolved_at  date,
  x            numeric(5,2),        -- layout pin position (percent 0-100)
  y            numeric(5,2),
  note         text
);
create index if not exists idx_anomalies_inspection on public.anomalies(inspection_id);

-- =====================================================================
--  PERFORMANCE  (daily energy per project)
-- =====================================================================
create table if not exists public.performance (
  id            uuid primary key default gen_random_uuid(),
  project_id    text not null references public.projects(id) on delete cascade,
  date          date not null,
  energy_kwh    numeric(12,2) not null,
  expected_kwh  numeric(12,2) not null
);
create index if not exists idx_perf_project on public.performance(project_id);
create index if not exists idx_perf_proj_date on public.performance(project_id, date);
-- one reading per project per day
create unique index if not exists uq_perf_project_date
  on public.performance(project_id, date);

-- =====================================================================
--  DOCUMENT VAULT
-- =====================================================================
create table if not exists public.docs (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null references public.projects(id) on delete cascade,
  name        text not null,
  type        text check (type in ('Warranty','Contract','Inverter manual','Grid connection','Report','Other')),
  url         text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by text
);
create index if not exists idx_docs_project on public.docs(project_id);

-- =====================================================================
--  AUDIT LOG
-- =====================================================================
create table if not exists public.audit (
  id        uuid primary key default gen_random_uuid(),
  ts        timestamptz not null default now(),
  user_id   text,
  user_name text,
  action    text check (action in ('upload','edit','download','create','delete')),
  target    text
);
create index if not exists idx_audit_ts on public.audit(ts desc);

-- =====================================================================
--  DONE — schema created.
--  Next: run supabase/seed-and-auth.sql to create the demo users,
--  profiles, demo data, and enable Row Level Security.
-- =====================================================================
