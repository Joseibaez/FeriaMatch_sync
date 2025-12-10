-- Fix profiles table: Drop RESTRICTIVE policies and create PERMISSIVE ones
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Create PERMISSIVE SELECT policies (default behavior - OR logic)
-- Users can ONLY read their own profile
CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admins can read ALL profiles (for User Management dashboard)
CREATE POLICY "Admins can read all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin'::user_role);