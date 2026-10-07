-- ==============================================================================
-- StackUp: Android VIP Waitlist Table & RLS Policies
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/eosbtwubpzoogpvajyyk/sql)
-- ==============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.android_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT,
    city TEXT,
    source TEXT DEFAULT 'marketing_landing_page',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.android_waitlist ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anyone (anonymous visitors) on the landing page to submit their email
DROP POLICY IF EXISTS "Allow public insert to android_waitlist" ON public.android_waitlist;
CREATE POLICY "Allow public insert to android_waitlist"
ON public.android_waitlist
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Policy: Allow authenticated dashboard admins to view the submissions
DROP POLICY IF EXISTS "Allow authenticated read on android_waitlist" ON public.android_waitlist;
CREATE POLICY "Allow authenticated read on android_waitlist"
ON public.android_waitlist
FOR SELECT
TO authenticated
USING (true);

-- 5. Create an index for quick lookups and email uniqueness
CREATE INDEX IF NOT EXISTS idx_android_waitlist_email ON public.android_waitlist (email);
CREATE INDEX IF NOT EXISTS idx_android_waitlist_created_at ON public.android_waitlist (created_at DESC);
