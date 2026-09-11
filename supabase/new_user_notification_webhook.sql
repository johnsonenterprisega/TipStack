-- ─── New User Signup Email Notification via Supabase Database Webhook ──────
-- You can run this in your Supabase SQL Editor or configure a Database Webhook
-- to receive instant alerts at johnsonenterprisega@gmail.com whenever a new user registers.

-- 1. Enable pg_net extension if you want Supabase to dispatch directly from the database
create extension if not exists "pg_net";

-- 2. Trigger function that posts to FormSubmit webhook on new user creation
create or replace function public.notify_owner_on_signup()
returns trigger language plpgsql security definer as $$
declare
  user_email text := new.email;
  user_name  text := coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', 'Hustler');
  subject_line text := '🎉 New TipStack Sign-Up: ' || user_name || ' (' || user_email || ')';
begin
  -- Perform non-blocking HTTP POST request to FormSubmit endpoint
  perform net.http_post(
    url := 'https://formsubmit.co/ajax/johnsonenterprisega@gmail.com',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
    body := jsonb_build_object(
      '_subject', subject_line,
      '_template', 'box',
      'App Name', 'TipStack',
      'New User Name', user_name,
      'User Email', user_email,
      'Registered At', now()::text,
      'Dashboard Link', 'https://supabase.com/dashboard/project/eosbtwubpzoogpvajyyk/auth/users'
    )
  );
  return new;
exception when others then
  -- Ensure user registration is never blocked if notification fails
  raise warning 'Failed to dispatch owner notification: %', SQLERRM;
  return new;
end;
$$;

-- 3. Attach trigger to auth.users table
drop trigger if exists on_auth_user_signup_notification on auth.users;
create trigger on_auth_user_signup_notification
  after insert on auth.users
  for each row execute procedure public.notify_owner_on_signup();
