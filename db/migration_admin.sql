-- ═══════════════════════════════════════
-- AutoGestão — Admin Mode Migration
-- Run this AFTER migration_auth.sql
-- ═══════════════════════════════════════

-- 1. Add is_admin column to companies
alter table companies add column if not exists is_admin boolean default false;

-- 2. Create is_admin() function (security definer)
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from companies
    where owner_id = auth.uid()
    and is_admin = true
  );
$$ language sql security definer;

-- 3. Create admin_audit_log table
create table if not exists admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id),
  action text, -- 'impersonation_start', 'impersonation_end'
  target_company_id uuid references companies(id),
  target_company_name text,
  created_at timestamp default now()
);

alter table admin_audit_log enable row level security;

create policy "admin can insert audit log"
on admin_audit_log for insert
with check (is_admin());

create policy "admin can read audit log"
on admin_audit_log for select
using (is_admin());

-- ═══════════════════════════════════════
-- 4. Update RLS SELECT policies — add OR is_admin()
-- ═══════════════════════════════════════

-- COMPANIES
drop policy if exists "user sees own company" on companies;
create policy "user sees own company"
on companies for select
using (
  owner_id = auth.uid()
  OR is_admin()
);

-- CLIENTS
drop policy if exists "user sees own company data" on clients;
create policy "user sees own company data"
on clients for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- APPOINTMENTS
drop policy if exists "user sees own company data" on appointments;
create policy "user sees own company data"
on appointments for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- LEADS
drop policy if exists "user sees own company data" on leads;
create policy "user sees own company data"
on leads for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- PAYMENTS
drop policy if exists "user sees own company data" on payments;
create policy "user sees own company data"
on payments for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- SETTINGS
drop policy if exists "user sees own company data" on settings;
create policy "user sees own company data"
on settings for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- ═══════════════════════════════════════
-- 5. Admin also needs INSERT/UPDATE/DELETE on all tables
--    for impersonation to work (writes with impersonated company_id)
-- ═══════════════════════════════════════

-- CLIENTS
drop policy if exists "user inserts own company data" on clients;
create policy "user inserts own company data"
on clients for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user updates own company data" on clients;
create policy "user updates own company data"
on clients for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user deletes own company data" on clients;
create policy "user deletes own company data"
on clients for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- APPOINTMENTS
drop policy if exists "user inserts own company data" on appointments;
create policy "user inserts own company data"
on appointments for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user updates own company data" on appointments;
create policy "user updates own company data"
on appointments for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user deletes own company data" on appointments;
create policy "user deletes own company data"
on appointments for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- LEADS
drop policy if exists "user inserts own company data" on leads;
create policy "user inserts own company data"
on leads for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user updates own company data" on leads;
create policy "user updates own company data"
on leads for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user deletes own company data" on leads;
create policy "user deletes own company data"
on leads for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- PAYMENTS
drop policy if exists "user inserts own company data" on payments;
create policy "user inserts own company data"
on payments for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user updates own company data" on payments;
create policy "user updates own company data"
on payments for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user deletes own company data" on payments;
create policy "user deletes own company data"
on payments for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- SETTINGS
drop policy if exists "user inserts own company data" on settings;
create policy "user inserts own company data"
on settings for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user updates own company data" on settings;
create policy "user updates own company data"
on settings for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

drop policy if exists "user deletes own company data" on settings;
create policy "user deletes own company data"
on settings for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
  OR is_admin()
);

-- ═══════════════════════════════════════
-- DONE! Now create admin user:
-- 1. Create user in Supabase Auth
-- 2. insert into companies (owner_id, company_name, is_admin)
--    values ('UUID', 'Oribos', true);
-- ═══════════════════════════════════════
