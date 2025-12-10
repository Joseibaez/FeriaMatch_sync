-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;

-- Create policy: Users can only read their own profile
CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy: Admins can read all profiles (for User Management feature)
CREATE POLICY "Admins can read all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);