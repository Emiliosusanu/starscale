-- ================================================
-- STARSCALE: Fix user_roles RLS Security
-- CRITICAL: This table has NO RLS protection!
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- NOTE: is_admin() function already exists in your database (Function 3)
-- The line below is safe to run - it will update if exists, create if not
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Policy: Only admins can SELECT user_roles
CREATE POLICY "user_roles_admin_select" ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 4. Policy: Only admins can INSERT user_roles
CREATE POLICY "user_roles_admin_insert" ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- 5. Policy: Only admins can UPDATE user_roles  
CREATE POLICY "user_roles_admin_update" ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Policy: Only admins can DELETE user_roles
CREATE POLICY "user_roles_admin_delete" ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ================================================
-- VERIFICATION: Run these after applying policies
-- ================================================
-- Check RLS is enabled:
-- SELECT relname, relrowsecurity 
-- FROM pg_class 
-- WHERE relname = 'user_roles';
-- (relrowsecurity should be 't' for true)
--
-- Check policies exist:
-- SELECT policyname, cmd, roles 
-- FROM pg_policies 
-- WHERE tablename = 'user_roles';
-- ================================================
