-- =====================================================================
--  Datafy Associates — Auth users, seed data & Row Level Security
--  Run AFTER supabase/schema.sql in the Supabase SQL Editor.
--  Idempotent: safe to re-run (uses ON CONFLICT).
-- =====================================================================

-- ---------------------------------------------------------------------
--  STEP 1 — Create auth users + matching profiles.
--
--  We insert directly into auth.users with a bcrypt-hashed password via
--  crypt()/gen_salt() (pgcrypto, enabled in schema.sql). This is the
--  most version-compatible way to create users from SQL.
-- ---------------------------------------------------------------------

do $$
declare
  v_admin    uuid;
  v_engineer uuid;
  v_client1  uuid;
  v_client2  uuid;
begin
  -- ---- Super Admin: admin@datafy.com ----
  select id into v_admin from auth.users where lower(email) = 'admin@datafy.com';
  if v_admin is null then
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', 'admin@datafy.com',
       crypt('Datafy#2026', gen_salt('bf')), now(),
      now(), now(),
      '{}'::jsonb, '{}'::jsonb, false
    )
    returning id into v_admin;
  end if;

  -- ---- Field Engineer: engineer@datafy.com ----
  select id into v_engineer from auth.users where lower(email) = 'engineer@datafy.com';
  if v_engineer is null then
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', 'engineer@datafy.com',
      crypt('Solar#2026', gen_salt('bf')), now(),
      now(), now(),
      '{}'::jsonb, '{}'::jsonb, false
    )
    returning id into v_engineer;
  end if;

  -- ---- Client Admin: client@nestle.com ----
  select id into v_client1 from auth.users where lower(email) = 'client@nestle.com';
  if v_client1 is null then
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', 'client@nestle.com',
      crypt('Nestle#2026', gen_salt('bf')), now(),
      now(), now(),
      '{}'::jsonb, '{}'::jsonb, false
    )
    returning id into v_client1;
  end if;

  -- ---- Client Viewer: viewer@jzs.com ----
  select id into v_client2 from auth.users where lower(email) = 'viewer@jzs.com';
  if v_client2 is null then
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated', 'viewer@jzs.com',
      crypt('Jzs#2026', gen_salt('bf')), now(),
      now(), now(),
      '{}'::jsonb, '{}'::jsonb, false
    )
    returning id into v_client2;
  end if;

  -- ---- Upsert profiles (1:1 with auth.users) ----
  insert into public.profiles (id, name, email, role, company, title, client_id, client_sub_role, restricted_project_id)
  values
    (v_admin,    'Badar Munir',    'admin@datafy.com',   'super_admin',    'Datafy Associate',          'Super Admin',       null,        null,             null),
    (v_engineer, 'Shahzad Hassan', 'engineer@datafy.com','field_engineer', 'Datafy Associate',          'Performance Engineer', null,      null,             null),
    (v_client1,  'Ahsan Khan',     'client@nestle.com',  'client',         'Nestlé Pakistan',           'Sustainability Lead','c-nestle', 'client_admin',   null),
    (v_client2,  'Imran Yousuf',   'viewer@jzs.com',     'client',         'JZS Farm',                  'Plant Operator',    'c-jzs',    'client_viewer',  'p-jzs-1')
  on conflict (id) do update set
    name            = excluded.name,
    role            = excluded.role,
    company         = excluded.company,
    title           = excluded.title,
    client_id       = excluded.client_id,
    client_sub_role = excluded.client_sub_role,
    restricted_project_id = excluded.restricted_project_id;
end $$;

-- ---------------------------------------------------------------------
--  STEP 2 — Auto-create a profile when a new auth.user signs up.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, company, title)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'client',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'title'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
--  STEP 3 — Seed the demo business data (clients, projects, etc.).
--  This reproduces the seed() data from lib/om.ts so the portal looks
--  identical to the localStorage version after migration.
-- ---------------------------------------------------------------------

-- Clients --------------------------------------------------------------
insert into public.clients (id, company, contact_name, email, phone, billing_tier, status, created_at) values
  ('c-nestle', 'Nestlé Pakistan', 'Ahsan Khan', 'client@nestle.com', '+92 300 1234567', 'Enterprise', 'Active', '2021-03-01T00:00:00Z'),
  ('c-jzs',    'JZS Farm',        'Imran Yousuf', 'viewer@jzs.com',  '+92 321 7654321', 'Pro',        'Active', '2019-08-15T00:00:00Z'),
  ('c-qa',     'Quaid-e-Azam Solar Power', 'Bilal Ahmed', 'bilal@qasp.com.pk', '+92 333 9876543', 'Enterprise', 'Active', '2015-05-01T00:00:00Z')
on conflict (id) do nothing;

-- Client activity ------------------------------------------------------
insert into public.client_activity (client_id, ts, type, detail)
select * from (values
  ('c-nestle', '2026-06-20T08:14:00Z'::timestamptz, 'login',    'Logged in'),
  ('c-nestle', '2026-06-18T11:02:00Z'::timestamptz, 'download', 'Downloaded performance report'),
  ('c-jzs',    '2026-06-22T07:30:00Z'::timestamptz, 'login',    'Logged in'),
  ('c-jzs',    '2026-06-15T09:45:00Z'::timestamptz, 'view',     'Viewed drone inspection'),
  ('c-qa',     '2026-06-21T13:20:00Z'::timestamptz, 'login',    'Logged in')
) v
where not exists (select 1 from public.client_activity);

-- Projects -------------------------------------------------------------
insert into public.projects (
  id, client_id, name, address, lat, lng, size_kwp, panel_count,
  inverter_brand, inverter_model, has_battery, battery_system, grid_type,
  installed_at, warranty_expiry, site_contact_name, site_contact_phone,
  classification, status, string_zones, gallery, client_notes, maintenance_schedule
) values
  (
    'p-nestle-1', 'c-nestle', 'Nestlé Sheikhupura Rooftop',
    'Ferozewala, Sheikhupura, Punjab', 31.516, 74.0167, 450, 11250,
    'Huawei', 'SUN2000-100KTL', false, null, 'On-grid',
    '2021-03-15', '2031-03-15', 'Tariq Mehmood', '+92 300 5551122',
    'Industrial', 'Active',
    '[{"id":"sz-1","name":"String 1-12","panelCount":1320,"location":"Roof block A"},{"id":"sz-2","name":"String 13-24","panelCount":1320,"location":"Roof block B"}]'::jsonb,
    '[]'::jsonb,
    'Quarterly performance review scheduled with sustainability team.',
    '["Quarterly"]'::jsonb
  ),
  (
    'p-jzs-1', 'c-jzs', 'JZS Sahiwal Ground-Mount',
    'Sahiwal, Punjab', 30.6662, 73.0223, 20, 8224,
    'Sungrow', 'SG250HX', true, 'Tesla Powerpack 200 kWh', 'Hybrid',
    '2019-08-20', '2029-08-20', 'Imran Yousuf', '+92 321 7654321',
    'Commercial', 'Active',
    '[{"id":"sz-3","name":"Zone A","panelCount":4112,"location":"North array"},{"id":"sz-4","name":"Zone B","panelCount":4112,"location":"South array"}]'::jsonb,
    '[]'::jsonb,
    'Bird-deterrent netting installed in Zone B (May 2026).',
    '["Monthly"]'::jsonb
  ),
  (
    'p-qa-1', 'c-qa', 'QASP Phase-I 100MW',
    'Lal Suhanra, Bahawalpur', 29.3858, 71.6908, 100000, 411200,
    'Sungrow', 'SG2500HV', false, null, 'On-grid',
    '2015-05-01', '2025-05-01', 'Bilal Ahmed', '+92 333 9876543',
    'Industrial', 'Under Maintenance',
    '[{"id":"sz-5","name":"Block A","panelCount":102800,"location":"West field"},{"id":"sz-6","name":"Block B","panelCount":102800,"location":"East field"}]'::jsonb,
    '[]'::jsonb,
    'Inverter firmware upgrade underway for Block A.',
    '["Monthly","Half-yearly"]'::jsonb
  )
on conflict (id) do nothing;

-- Maintenance visit + defect ------------------------------------------
insert into public.visits (id, project_id, date, technician, cleaning_type, weather, pre_observation, post_observation, images, signature)
values (
  '11111111-1111-1111-1111-111111111111',
  'p-nestle-1', '2026-05-12', 'Shahzad Hassan', 'Wet cleaning', 'Sunny',
  'Moderate dust accumulation observed on block A.',
  'All panels cleaned. Post-clean IR readings nominal.',
  '[]'::jsonb, 'Shahzad Hassan'
)
on conflict (id) do nothing;

insert into public.defects (visit_id, category, description, status, opened_at, resolved_at)
select v.id, 'Soiling', 'Heavy soiling on panel A-204', 'Resolved',
       '2026-05-12T09:00:00Z', '2026-05-12T11:30:00Z'
from public.visits v
where v.id = '11111111-1111-1111-1111-111111111111'
  and not exists (select 1 from public.defects where visit_id = v.id);

-- Drone inspection + anomalies ----------------------------------------
insert into public.inspections (id, project_id, date, processed_images)
values (
  '22222222-2222-2222-2222-222222222222',
  'p-nestle-1', '2026-04-10', '[]'::jsonb
)
on conflict (id) do nothing;

insert into public.anomalies (inspection_id, panel_id, type, severity, status, detected_at, resolved_at, x, y, note)
select i.id, 'A-104', 'Hotspot', 'Critical', 'Open',  '2026-04-10', null,       32, 45, 'ΔT 22°C'
from public.inspections i
where i.id = '22222222-2222-2222-2222-222222222222'
  and not exists (select 1 from public.anomalies where inspection_id = i.id and panel_id = 'A-104');

insert into public.anomalies (inspection_id, panel_id, type, severity, status, detected_at, resolved_at, x, y)
select i.id, 'B-058', 'Soiling', 'Info', 'Resolved', '2026-04-10', '2026-05-12', 68, 60
from public.inspections i
where i.id = '22222222-2222-2222-2222-222222222222'
  and not exists (select 1 from public.anomalies where inspection_id = i.id and panel_id = 'B-058');

-- Documents ------------------------------------------------------------
insert into public.docs (project_id, name, type, url, uploaded_at, uploaded_by)
select 'p-nestle-1', 'Module Warranty 25yr.pdf', 'Warranty', '#', '2021-03-16T00:00:00Z', 'admin@datafy.com'
where not exists (select 1 from public.docs where name = 'Module Warranty 25yr.pdf');

insert into public.docs (project_id, name, type, url, uploaded_at, uploaded_by)
select 'p-nestle-1', 'Huawei SUN2000 Manual.pdf', 'Inverter manual', '#', '2021-03-16T00:00:00Z', 'admin@datafy.com'
where not exists (select 1 from public.docs where name = 'Huawei SUN2000 Manual.pdf');

-- Audit ----------------------------------------------------------------
insert into public.audit (ts, user_id, user_name, action, target)
select '2026-06-20T08:14:00Z'::timestamptz, 'om-client-1', 'Ahsan Khan', 'download', 'Performance report (p-nestle-1)'
where not exists (select 1 from public.audit);

-- =====================================================================
--  STEP 4 — Row Level Security
--  Now that data exists, lock every table down. Rules:
--   • super_admin   → full access to everything
--   • field_engineer→ full access to everything (can upload/edit)
--   • client        → can only read rows tied to their own client_id
--                     (or a single project if restricted_project_id set)
--  Authenticated writes always go through RLS; the service-role key
--  (server.ts) bypasses RLS for trusted admin/seed work.
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.clients           enable row level security;
alter table public.client_activity   enable row level security;
alter table public.projects          enable row level security;
alter table public.visits            enable row level security;
alter table public.defects           enable row level security;
alter table public.inspections       enable row level security;
alter table public.anomalies         enable row level security;
alter table public.performance       enable row level security;
alter table public.docs              enable row level security;
alter table public.audit             enable row level security;

-- Helper: is the current user staff (admin or engineer)?
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin','field_engineer')
  );
$$;

-- Helper: the client_id of the current user (null if staff).
create or replace function public.current_client_id()
returns text language sql stable security definer set search_path = public as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- Helper: the restricted project id (for client_viewers), else null.
create or replace function public.current_restricted_project()
returns text language sql stable security definer set search_path = public as $$
  select restricted_project_id from public.profiles where id = auth.uid();
$$;

-- ---- profiles: everyone can read their own or (staff) all ----
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (public.is_staff() or id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (public.is_staff() or id = auth.uid());

-- ---- clients: staff see all; clients see only their own row ----
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select using (
    public.is_staff() or id = public.current_client_id()
  );

drop policy if exists clients_modify on public.clients;
create policy clients_modify on public.clients
  for all using (public.is_staff()) with check (public.is_staff());

-- ---- client_activity ----
drop policy if exists client_activity_select on public.client_activity;
create policy client_activity_select on public.client_activity
  for select using (
    public.is_staff() or client_id = public.current_client_id()
  );

drop policy if exists client_activity_modify on public.client_activity;
create policy client_activity_modify on public.client_activity
  for all using (public.is_staff()) with check (public.is_staff());

-- ---- projects: clients see only their own (or restricted) project ----
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select using (
    public.is_staff()
    or client_id = public.current_client_id()
    or id = public.current_restricted_project()
  );

drop policy if exists projects_modify on public.projects;
create policy projects_modify on public.projects
  for all using (public.is_staff()) with check (public.is_staff());

-- ---- visits / defects / inspections / anomalies / performance / docs:
--      readable if the parent project is visible; writable by staff ----

drop policy if exists visits_select on public.visits;
create policy visits_select on public.visits
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.projects p
      where p.id = visits.project_id
        and (p.client_id = public.current_client_id()
             or p.id = public.current_restricted_project())
    )
  );

drop policy if exists visits_modify on public.visits;
create policy visits_modify on public.visits
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists defects_select on public.defects;
create policy defects_select on public.defects
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.visits v
      join public.projects p on p.id = v.project_id
      where v.id = defects.visit_id
        and (p.client_id = public.current_client_id()
             or p.id = public.current_restricted_project())
    )
  );

drop policy if exists defects_modify on public.defects;
create policy defects_modify on public.defects
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists inspections_select on public.inspections;
create policy inspections_select on public.inspections
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.projects p
      where p.id = inspections.project_id
        and (p.client_id = public.current_client_id()
             or p.id = public.current_restricted_project())
    )
  );

drop policy if exists inspections_modify on public.inspections;
create policy inspections_modify on public.inspections
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists anomalies_select on public.anomalies;
create policy anomalies_select on public.anomalies
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.inspections i
      join public.projects p on p.id = i.project_id
      where i.id = anomalies.inspection_id
        and (p.client_id = public.current_client_id()
             or p.id = public.current_restricted_project())
    )
  );

drop policy if exists anomalies_modify on public.anomalies;
create policy anomalies_modify on public.anomalies
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists performance_select on public.performance;
create policy performance_select on public.performance
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.projects p
      where p.id = performance.project_id
        and (p.client_id = public.current_client_id()
             or p.id = public.current_restricted_project())
    )
  );

drop policy if exists performance_modify on public.performance;
create policy performance_modify on public.performance
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists docs_select on public.docs;
create policy docs_select on public.docs
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.projects p
      where p.id = docs.project_id
        and (p.client_id = public.current_client_id()
             or p.id = public.current_restricted_project())
    )
  );

drop policy if exists docs_modify on public.docs;
create policy docs_modify on public.docs
  for all using (public.is_staff()) with check (public.is_staff());

-- ---- audit: staff can read everything; anyone can insert their own ----
drop policy if exists audit_select on public.audit;
create policy audit_select on public.audit
  for select using (public.is_staff());

drop policy if exists audit_insert on public.audit;
create policy audit_insert on public.audit
  for insert with check (true);

-- =====================================================================
--  DONE. Your Supabase project now has:
--   ✓ 4 demo users with hashed passwords in Auth
--   ✓ profiles linked to each user
--   ✓ all the demo business data (clients/projects/visits/…)
--   ✓ Row Level Security enforcing role-based access
--  Tell the assistant once you've run both scripts successfully.
-- =====================================================================
