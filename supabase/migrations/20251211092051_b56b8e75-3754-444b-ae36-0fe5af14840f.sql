-- Fix: Allow candidates to see available slots (where candidate_id IS NULL)
-- This is needed for the available_slots view to work with security_invoker

CREATE POLICY "Candidates can read available slots"
ON public.slots
FOR SELECT
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'candidate'::user_role) 
  AND candidate_id IS NULL
);

-- Verify profiles UPDATE policy exists (recreate if missing)
-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);