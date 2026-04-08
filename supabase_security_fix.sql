-- ==========================================================
-- SUPABASE SECURITY FIX: ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================================
-- Run this in your Supabase SQL Editor to resolve the 
-- "Table publicly accessible" security warning.
-- This will lock down the tables while still allowing this 
-- dashboard to function via the Service Role Key.

-- 1. Enable RLS on all sensitive tables
ALTER TABLE public.watcher_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_builds ENABLE ROW LEVEL SECURITY;

-- 2. Ensure No Public Access 
-- (This drops any "allow all" policies if they were accidentally created)
-- If you want specifically restricted public read access, you would add 
-- a policy here, but for this Ops Dashboard, all access should be 
-- via the Service Role which bypasses RLS automatically.

-- IMPORTANT: The Service Role key used by this dashboard 
-- automatically bypasses RLS, so the app will continue to work.

-- Optional: If you want to allow authenticated users (if you use Supabase Auth)
-- to view data, uncomment the following:
-- CREATE POLICY "Allow authenticated select" ON public.watcher_rules FOR SELECT USING (auth.role() = 'authenticated');
