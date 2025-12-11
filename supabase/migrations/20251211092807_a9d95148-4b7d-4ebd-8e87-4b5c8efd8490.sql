-- Fix 1: Allow public read access to available slots (for anon AND authenticated users)
-- Drop the restrictive candidate-only policy
DROP POLICY IF EXISTS "Candidates can read available slots" ON public.slots;

-- Create a permissive policy for viewing available slots (no role required)
CREATE POLICY "Anyone can read available slots"
ON public.slots
FOR SELECT
TO anon, authenticated
USING (candidate_id IS NULL);

-- Fix 2: Ensure profiles INSERT policy exists and works for new users
-- The existing policy should work, but let's ensure it's correct
DROP POLICY IF EXISTS "Allow insert for new users" ON public.profiles;

CREATE POLICY "Allow insert for new users"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix 3: Ensure SELECT on profiles works without role check
-- Drop and recreate to ensure no role dependency
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);