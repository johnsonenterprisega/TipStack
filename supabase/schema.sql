-- StackUp — Supabase Database Schema
-- Run this in your Supabase SQL Editor at: https://app.supabase.com

-- ─── Enable UUID Extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Auto-created when a user signs up via trigger below
create table if not exists public.profiles (
  id                    uuid references auth.users on delete cascade primary key,
  username              text,
  avatar_url            text,
  subscription_tier     text not null default 'free' check (subscription_tier in ('free', 'pro')),
  pay_period_start_day  integer not null default 3, -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  pay_day               integer not null default 5, -- 0=Sun..6=Sat (Default Friday)
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- RLS: Users can only see/edit their own profile
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger: auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Jobs / Workplaces ────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  name            text not null,
  role            text,
  hourly_wage     numeric(8,2) not null default 0,
  tip_out_percent numeric(5,2) not null default 0,
  color           text not null default '#00C9A7',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.jobs enable row level security;
create policy "Users manage own jobs" on public.jobs for all using (auth.uid() = user_id);

create index jobs_user_id_idx on public.jobs(user_id);

-- ─── Shifts ───────────────────────────────────────────────────────────────────
create table if not exists public.shifts (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  job_id          uuid references public.jobs(id) on delete set null,
  date            date not null,
  start_time      time,
  end_time        time,
  hours_worked    numeric(5,2) not null default 0,
  cash_tips       numeric(10,2) not null default 0,
  credit_tips     numeric(10,2) not null default 0,
  tip_out_amount  numeric(10,2) not null default 0,
  net_tips        numeric(10,2) generated always as (cash_tips + credit_tips - tip_out_amount) stored,
  total_earnings  numeric(10,2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.shifts enable row level security;
create policy "Users manage own shifts" on public.shifts for all using (auth.uid() = user_id);

create index shifts_user_id_date_idx on public.shifts(user_id, date desc);
create index shifts_job_id_idx on public.shifts(job_id);

-- ─── Achievements Catalog ─────────────────────────────────────────────────────
create table if not exists public.achievements (
  id              uuid default uuid_generate_v4() primary key,
  name            text not null unique,
  description     text not null,
  icon            text not null,
  criteria_type   text not null,
  criteria_value  numeric not null,
  tier            text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum'))
);

-- Achievements are public (read-only)
alter table public.achievements enable row level security;
create policy "Anyone can view achievements" on public.achievements for select using (true);

-- ─── User Achievements ────────────────────────────────────────────────────────
create table if not exists public.user_achievements (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  achievement_id  uuid references public.achievements(id) on delete cascade not null,
  earned_at       timestamptz not null default now(),
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "Users manage own achievements" on public.user_achievements for all using (auth.uid() = user_id);

-- ─── Goals ────────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  type            text not null check (type in ('daily','weekly','monthly')),
  target_amount   numeric(10,2) not null,
  period_label    text not null,
  start_date      date not null,
  end_date        date not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.goals enable row level security;
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id);

create index goals_user_id_idx on public.goals(user_id);

-- ─── Seed Default Achievements ────────────────────────────────────────────────
insert into public.achievements (name, description, icon, criteria_type, criteria_value, tier)
values
  ('First Shift!',     'Log your very first shift.',                  '🎉', 'shift_count',    1,     'bronze'),
  ('$100 Day!',        'Earn $100+ in a single shift.',               '💯', 'single_shift',   100,   'bronze'),
  ('$200 Day!',        'Earn $200+ in a single shift.',               '🔥', 'single_shift',   200,   'silver'),
  ('$500 Day!',        'Earn $500+ in a single shift. On fire!',      '🌋', 'single_shift',   500,   'gold'),
  ('Hat Trick',        'Log shifts 3 days in a row.',                 '🔥', 'streak',         3,     'bronze'),
  ('Week Warrior',     'Log shifts 7 days in a row.',                 '⚔️', 'streak',         7,     'silver'),
  ('Iron Grinder',     'Log shifts 30 days in a row. Unstoppable!',   '💎', 'streak',         30,    'platinum'),
  ('Grand Hustle',     'Earn $1,000 in total tips.',                  '💰', 'total_earnings', 1000,  'bronze'),
  ('Stack Builder',    'Earn $5,000 in total tips.',                  '🏦', 'total_earnings', 5000,  'silver'),
  ('Ten Grand Club',   'Earn $10,000 in total tips.',                 '🏆', 'total_earnings', 10000, 'gold'),
  ('Tip Tycoon',       'Earn $50,000 in total tips. Legendary!',      '👑', 'total_earnings', 50000, 'platinum'),
  ('Getting Started',  'Log 10 shifts.',                              '📅', 'shift_count',    10,    'bronze'),
  ('Regular',          'Log 50 shifts.',                              '📆', 'shift_count',    50,    'silver'),
  ('Centurion',        'Log 100 shifts.',                             '🎖️', 'shift_count',    100,   'gold')
on conflict (name) do nothing;
