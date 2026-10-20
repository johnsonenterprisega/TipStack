-- StackUp: Account Deletion Security Definer Function
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- This allows authenticated users to permanently delete their own account and cascade all associated data.

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Explicitly clean up all user records from application tables
  delete from public.shifts where user_id = current_user_id;
  delete from public.jobs where user_id = current_user_id;
  delete from public.goals where user_id = current_user_id;
  delete from public.user_achievements where user_id = current_user_id;
  delete from public.profiles where id = current_user_id;

  -- 2. Delete the user from auth.users (cascades any remaining auth records)
  delete from auth.users where id = current_user_id;
end;
$$;

-- Grant execution permission to authenticated users
grant execute on function public.delete_user_account() to authenticated;
