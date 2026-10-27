-- ========================================================
-- NEOTA — Production-Ready Enterprise Database Schema
-- Idempotent Migration: Safe to run on both Fresh & Existing DBs
-- ========================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. PROFILES (Extends auth.users with strict RBAC)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'super_admin')),
  created_at timestamptz default now()
);

-- Trigger to create profile automatically on auth.users sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Safe Column Migration for Existing profiles table
alter table public.profiles add column if not exists status text default 'active' check (status in ('active', 'suspended', 'vip'));
alter table public.profiles add column if not exists tier text default 'free' check (tier in ('free', 'pro', 'royal'));

-- 2. EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  event_type text default 'Walima',
  event_date date default current_date,
  venue text,
  status text default 'Active' check (status in ('Active', 'Archived', 'Completed')),
  created_at timestamptz default now()
);

-- Safe Column Migration for Existing events table
alter table public.events add column if not exists pin text default '7860';
alter table public.events add column if not exists card_config jsonb default '{}'::jsonb;
alter table public.events add column if not exists expenses jsonb default '{}'::jsonb;
alter table public.events add column if not exists duas jsonb default '[]'::jsonb;
alter table public.events add column if not exists allow_pin_entry boolean default false;
alter table public.events add column if not exists reconciliation_tallies jsonb default '{}'::jsonb;
alter table public.events add column if not exists is_frozen boolean default false;
alter table public.events add column if not exists freeze_reason text default null;

-- 3. PEOPLE (Guests & Family Ledger Contacts)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  father_name text,
  phone text,
  address text,
  relation text default 'Relative',
  status text default 'Invited' check (status in ('Invited', 'Confirmed', 'Declined')),
  notes text,
  created_at timestamptz default now()
);

-- Safe Column Migration for Existing people table
alter table public.people add column if not exists events jsonb default '[]'::jsonb;

-- 4. INVITATIONS
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  event_id uuid not null references public.events on delete cascade,
  person_id uuid not null references public.people on delete cascade,
  status text default 'Invited',
  created_at timestamptz default now(),
  unique(event_id, person_id)
);

-- 5. NEOTA TRANSACTIONS (Gifts & Salamii)
create table if not exists public.neota_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  event_id uuid references public.events on delete cascade,
  person_id uuid references public.people on delete set null,
  direction text not null default 'received' check (direction in ('received', 'returned')),
  amount_pkr numeric not null default 0 check (amount_pkr >= 0),
  gift_type text not null default 'cash' check (gift_type in ('cash', 'gold', 'gift', 'other')),
  gift_description text,
  note text,
  created_at timestamptz default now()
);

-- Safe Column Migration for Existing neota_transactions table
alter table public.neota_transactions add column if not exists payment_method text default 'cash';
alter table public.neota_transactions add column if not exists recorded_by text;
alter table public.neota_transactions add column if not exists counter_name text;
alter table public.neota_transactions add column if not exists counter_token text;
alter table public.neota_transactions add column if not exists updated_by text;
alter table public.neota_transactions add column if not exists updated_at timestamptz;
alter table public.neota_transactions add column if not exists edit_history jsonb default '[]'::jsonb;

-- 6. VENDORS (Catering, Venue, Photo/Video, Decor)
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  event_id uuid references public.events on delete cascade,
  name text not null,
  category text,
  contact text,
  total_amount numeric default 0,
  advance_paid numeric default 0,
  status text default 'Unpaid' check (status in ('Paid', 'Partial', 'Unpaid')),
  notes text,
  created_at timestamptz default now()
);

-- 7. SEATING TABLES
create table if not exists public.seating_tables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  event_id uuid references public.events on delete cascade,
  number text,
  name text,
  category text,
  capacity integer default 10,
  guest_ids jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 8. DENOMINATIONS (Cash Drawer Breakdown Tally)
create table if not exists public.denominations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  event_id uuid not null references public.events on delete cascade,
  counts jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique(owner_id, event_id)
);

-- 9. COUNTER SECRET LINKS
create table if not exists public.counter_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  event_id uuid not null references public.events on delete cascade,
  assistant_name text not null,
  counter_title text default 'Counter 1',
  token text not null unique,
  active boolean default true,
  created_at timestamptz default now()
);

-- 10. PUBLIC RSVPS
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  name text not null,
  phone text,
  attending boolean default true,
  guest_count integer default 1,
  message text,
  created_at timestamptz default now()
);

-- 11. AUDIT EVENTS
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users on delete set null,
  action text not null,
  target text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 12. USER FEEDBACK, COMPLAINTS & REVIEWS
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  user_name text,
  user_email text,
  category text not null default 'review' check (category in ('complaint', 'suggestion', 'review', 'bug')),
  subject text not null,
  message text not null,
  rating integer default 5 check (rating >= 1 and rating <= 5),
  status text default 'Pending' check (status in ('Pending', 'In Progress', 'Resolved', 'Closed')),
  admin_notes text,
  created_at timestamptz default now()
);

-- ========================================================
-- INDEXES FOR SCALE & SPEED (Millions of Rows Support)
-- ========================================================
create index if not exists idx_events_owner on public.events(owner_id);
create index if not exists idx_events_pin on public.events(pin);
create index if not exists idx_events_owner_status on public.events(owner_id, status);
create index if not exists idx_people_owner on public.people(owner_id);
create index if not exists idx_people_name on public.people(name);
create index if not exists idx_people_events on public.people using gin(events);
create index if not exists idx_tx_owner on public.neota_transactions(owner_id);
create index if not exists idx_tx_event on public.neota_transactions(event_id);
create index if not exists idx_tx_person on public.neota_transactions(person_id);
create index if not exists idx_tx_composite on public.neota_transactions(event_id, direction, created_at desc);
create index if not exists idx_tx_counter_token on public.neota_transactions(counter_token);
create index if not exists idx_vendors_event on public.vendors(event_id);
create index if not exists idx_tables_event on public.seating_tables(event_id);
create index if not exists idx_counter_links_token on public.counter_links(token);
create index if not exists idx_rsvps_event on public.rsvps(event_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.people enable row level security;
alter table public.invitations enable row level security;
alter table public.neota_transactions enable row level security;
alter table public.vendors enable row level security;
alter table public.seating_tables enable row level security;
alter table public.denominations enable row level security;
alter table public.counter_links enable row level security;
alter table public.rsvps enable row level security;
alter table public.audit_events enable row level security;

-- ========================================================
-- ADMIN HELPER FUNCTION (Zero Client-Side Spoofing)
-- ========================================================
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

-- Profiles: Own user read/update + Super Admin full control
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id or public.is_admin());

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id or public.is_admin());

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles for select using (public.is_admin());

drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles for update using (public.is_admin());

-- Events: Own events or Super Admin Platform Oversight
drop policy if exists "own events" on public.events;
create policy "own events" on public.events for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

-- People: Own contacts or Super Admin Platform Oversight + Counter Operators
drop policy if exists "own people" on public.people;
create policy "own people" on public.people for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "counter insert people" on public.people;
create policy "counter insert people" on public.people for insert with check (
  owner_id is not null
);

drop policy if exists "own invitations" on public.invitations;
create policy "own invitations" on public.invitations for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

-- Transactions: Own transactions or Super Admin Platform Oversight
drop policy if exists "own transactions" on public.neota_transactions;
create policy "own transactions" on public.neota_transactions for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "own vendors" on public.vendors;
create policy "own vendors" on public.vendors for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "own tables" on public.seating_tables;
create policy "own tables" on public.seating_tables for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "own denominations" on public.denominations;
create policy "own denominations" on public.denominations for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

-- Counter Links: Own links or Super Admin Global Kill-Switch
drop policy if exists "own counter links" on public.counter_links;
create policy "own counter links" on public.counter_links for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());

-- Public Access Policies (Invited Guests & Public Cards)
drop policy if exists "public read event card" on public.events;
create policy "public read event card" on public.events for select using (true);

drop policy if exists "public insert rsvps" on public.rsvps;
create policy "public insert rsvps" on public.rsvps for insert with check (true);

drop policy if exists "own event rsvps read" on public.rsvps;
create policy "own event rsvps read" on public.rsvps for select using (
  exists (select 1 from public.events where id = rsvps.event_id and owner_id = auth.uid())
  or public.is_admin()
);

drop policy if exists "public verify counter link" on public.counter_links;
create policy "public verify counter link" on public.counter_links for select using (active = true);

-- Counter Operators: Insert & Select & Edit Transactions
drop policy if exists "counter insert transactions" on public.neota_transactions;
create policy "counter insert transactions" on public.neota_transactions for insert with check (
  owner_id is not null
);

drop policy if exists "counter update transactions" on public.neota_transactions;
create policy "counter update transactions" on public.neota_transactions for update using (
  owner_id = auth.uid()
  or public.is_admin()
  or
  (counter_token is not null and exists (
    select 1 from public.counter_links 
    where token = neota_transactions.counter_token and active = true
  ))
);

drop policy if exists "counter read event transactions" on public.neota_transactions;
create policy "counter read event transactions" on public.neota_transactions for select using (
  owner_id = auth.uid()
  or public.is_admin()
  or
  exists (
    select 1 from public.counter_links
    where event_id = neota_transactions.event_id and active = true
  )
);

-- Audit Events Logging & Admin Read Policy
drop policy if exists "public insert audit events" on public.audit_events;
create policy "public insert audit events" on public.audit_events for insert with check (true);

drop policy if exists "admins read audit" on public.audit_events;
create policy "admins read audit" on public.audit_events for select using (public.is_admin());

-- User Feedback Policies
alter table public.user_feedback enable row level security;

drop policy if exists "anyone can insert feedback" on public.user_feedback;
create policy "anyone can insert feedback" on public.user_feedback for insert with check (true);

drop policy if exists "users can read own feedback" on public.user_feedback;
create policy "users can read own feedback" on public.user_feedback for select using (
  auth.uid() = user_id or public.is_admin()
);

drop policy if exists "admins can update feedback" on public.user_feedback;
create policy "admins can update feedback" on public.user_feedback for update using (
  public.is_admin()
);

-- Safe Column Migration for Existing neota_transactions (Anti-Theft Audit)
alter table public.neota_transactions add column if not exists is_deleted boolean default false;
alter table public.neota_transactions add column if not exists void_reason text;
alter table public.neota_transactions add column if not exists voided_by text;
alter table public.neota_transactions add column if not exists voided_at timestamptz;

-- 13. SUBSCRIPTION PAYMENT PROOF REQUESTS & APPROVALS
create table if not exists public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  user_name text,
  user_email text,
  tier text not null check (tier in ('pro', 'royal')),
  amount_pkr numeric not null default 0,
  payment_method text not null default 'jazzcash', -- 'bank', 'raast', 'jazzcash', 'easypaisa'
  transaction_ref text not null,
  proof_screenshot text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users on delete set null
);

create index if not exists idx_sub_requests_user on public.subscription_requests(user_id);
create index if not exists idx_sub_requests_status on public.subscription_requests(status);

alter table public.subscription_requests enable row level security;

drop policy if exists "users read own requests" on public.subscription_requests;
create policy "users read own requests" on public.subscription_requests for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "users insert own requests" on public.subscription_requests;
create policy "users insert own requests" on public.subscription_requests for insert with check (auth.uid() = user_id);

drop policy if exists "admins update requests" on public.subscription_requests;
create policy "admins update requests" on public.subscription_requests for all using (public.is_admin()) with check (public.is_admin());

-- ========================================================
-- SYSTEM CONFIGURATION & MONETIZATION ENGINE
-- ========================================================
create table if not exists public.system_config (
  id text primary key default 'primary_config',
  billing_mode text default 'launch_free' check (billing_mode in ('launch_free', 'monetized_active')),
  maintenance_mode boolean default false,
  maintenance_message text default 'System is undergoing scheduled maintenance. Please check back shortly.',
  tiers jsonb default '{
    "free": { "name": "Free Starter", "price_pkr": 0, "guest_limit": 150, "counter_limit": 1, "features": ["Standard Ledger", "WhatsApp Slip Text"] },
    "pro": { "name": "Pro Host", "price_pkr": 3999, "guest_limit": 1000, "counter_limit": 5, "features": ["Urdu Voice AI", "Raast Dynamic QR", "Slip Photos", "Multiple Counters"] },
    "royal": { "name": "Royal VIP", "price_pkr": 9999, "guest_limit": -1, "counter_limit": -1, "features": ["Unlimited Counters", "Seating Planner", "Priority Support", "Dedicated Sync"] }
  }'::jsonb,
  payment_methods jsonb default '{
    "bank": { "enabled": true, "bank_name": "Meezan Bank Limited", "account_title": "Neota Systems", "iban": "PK00MEZN0000000000000000" },
    "raast": { "enabled": true, "raast_id": "03001234567", "title": "Neota Raast" },
    "jazzcash": { "enabled": true, "number": "03001234567", "title": "Neota Ledger" },
    "easypaisa": { "enabled": true, "number": "03001234567", "title": "Neota Ledger" },
    "instructions": "Please transfer the subscription fee and send a screenshot of the payment receipt on WhatsApp for instant VIP activation."
  }'::jsonb,
  broadcast_banner jsonb default '{
    "enabled": false,
    "message": "",
    "type": "info",
    "target": "all"
  }'::jsonb,
  updated_at timestamptz default now()
);

-- Safe column additions for existing system_config table
alter table public.system_config add column if not exists maintenance_mode boolean default false;
alter table public.system_config add column if not exists maintenance_message text default 'System is undergoing scheduled maintenance. Please check back shortly.';

-- Seed initial row if not exists
insert into public.system_config (id, billing_mode)
values ('primary_config', 'launch_free')
on conflict (id) do nothing;

alter table public.system_config enable row level security;
drop policy if exists "anyone can read system config" on public.system_config;
create policy "anyone can read system config" on public.system_config for select using (true);

drop policy if exists "admins can update system config" on public.system_config;
create policy "admins can update system config" on public.system_config for all using (public.is_admin()) with check (public.is_admin());

-- ========================================================
-- REALTIME REPLICATION PUBLICATION & REPLICA IDENTITY
-- Enables instant live dashboard sync across phones and counters
-- ========================================================
alter publication supabase_realtime add table public.neota_transactions;
alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.counter_links;
alter publication supabase_realtime add table public.system_config;
alter publication supabase_realtime add table public.subscription_requests;

alter table public.neota_transactions replica identity full;
alter table public.people replica identity full;
alter table public.events replica identity full;
alter table public.counter_links replica identity full;
alter table public.system_config replica identity full;
alter table public.subscription_requests replica identity full;



