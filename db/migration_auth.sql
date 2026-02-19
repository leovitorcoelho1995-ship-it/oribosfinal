-- ═══════════════════════════════════════
-- AutoGestão — Complete Schema + Auth + RLS
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════

-- 1. Create companies table
create table if not exists companies (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade unique,
  company_name text not null,
  whatsapp_number text,
  plan text default 'basic',
  created_at timestamp default now()
);

-- 2. Create clients table
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  whatsapp text,
  email text,
  tags text[],
  status text default 'active',
  notes text,
  created_at timestamp default now()
);

-- 3. Create appointments table
create table if not exists appointments (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  title text not null,
  date date not null,
  time time not null,
  professional text,
  status text default 'scheduled',
  notes text,
  created_at timestamp default now()
);

-- 4. Create leads table
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  whatsapp text,
  email text,
  source text,
  stage text default 'novo',
  value numeric default 0,
  notes text,
  assigned_to text,
  created_at timestamp default now()
);

-- 5. Create payments table
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  description text not null,
  amount numeric not null,
  due_date date not null,
  paid_date date,
  status text default 'pending',
  created_at timestamp default now()
);

-- 6. Create settings table
create table if not exists settings (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade unique not null,
  whatsapp_number text,
  business_hours_start time default '08:00',
  business_hours_end time default '18:00',
  welcome_message text default 'Olá! Como posso ajudar?',
  reminder_message text default 'Lembramos seu agendamento amanhã às {time}.',
  followup_message text default 'Olá {name}, tudo bem? Podemos conversar?',
  cobr_message_1 text default 'Olá {name}, seu pagamento vence em breve.',
  cobr_message_2 text default 'Olá {name}, seu pagamento está vencido.',
  cobr_message_3 text default 'Olá {name}, urgente: pagamento em aberto.'
);

-- ═══════════════════════════════════════
-- 7. Enable RLS on ALL tables
-- ═══════════════════════════════════════

alter table companies enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table leads enable row level security;
alter table payments enable row level security;
alter table settings enable row level security;

-- ═══════════════════════════════════════
-- 8. RLS Policies — COMPANIES
-- ═══════════════════════════════════════

create policy "user sees own company"
on companies for select
using (owner_id = auth.uid());

create policy "user updates own company"
on companies for update
using (owner_id = auth.uid());

-- ═══════════════════════════════════════
-- 9. RLS Policies — CLIENTS
-- ═══════════════════════════════════════

create policy "user sees own company data"
on clients for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user inserts own company data"
on clients for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user updates own company data"
on clients for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user deletes own company data"
on clients for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

-- ═══════════════════════════════════════
-- 10. RLS Policies — APPOINTMENTS
-- ═══════════════════════════════════════

create policy "user sees own company data"
on appointments for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user inserts own company data"
on appointments for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user updates own company data"
on appointments for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user deletes own company data"
on appointments for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

-- ═══════════════════════════════════════
-- 11. RLS Policies — LEADS
-- ═══════════════════════════════════════

create policy "user sees own company data"
on leads for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user inserts own company data"
on leads for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user updates own company data"
on leads for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user deletes own company data"
on leads for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

-- ═══════════════════════════════════════
-- 12. RLS Policies — PAYMENTS
-- ═══════════════════════════════════════

create policy "user sees own company data"
on payments for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user inserts own company data"
on payments for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user updates own company data"
on payments for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user deletes own company data"
on payments for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

-- ═══════════════════════════════════════
-- 13. RLS Policies — SETTINGS
-- ═══════════════════════════════════════

create policy "user sees own company data"
on settings for select
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user inserts own company data"
on settings for insert
with check (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user updates own company data"
on settings for update
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

create policy "user deletes own company data"
on settings for delete
using (
  company_id = (select id from companies where owner_id = auth.uid())
);

-- ═══════════════════════════════════════
-- DONE! Now:
-- 1. Create a user in Supabase Auth dashboard
-- 2. Then run:
--
-- insert into companies (owner_id, company_name)
-- values ('USER_UUID_HERE', 'Minha Empresa');
-- ═══════════════════════════════════════
