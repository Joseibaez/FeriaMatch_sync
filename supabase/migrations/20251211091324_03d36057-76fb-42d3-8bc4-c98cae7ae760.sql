-- Fix: Restrict slots SELECT policy to hide candidate_id from unauthorized users
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read all slots" ON public.slots;

-- Admins can read all slots with full details
CREATE POLICY "Admins can read all slots"
ON public.slots
FOR SELECT
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Recruiters can read slots assigned to their company
CREATE POLICY "Recruiters can read company slots"
ON public.slots
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'recruiter'::user_role
  AND company_id = auth.uid()
);

-- Candidates can read their own booked slots
CREATE POLICY "Candidates can read own slots"
ON public.slots
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'candidate'::user_role
  AND candidate_id = auth.uid()
);

-- Create a view for slot availability (without exposing candidate_id)
CREATE OR REPLACE VIEW public.available_slots AS
SELECT 
  s.id,
  s.event_id,
  s.start_time,
  s.end_time,
  s.company_id,
  CASE WHEN s.candidate_id IS NULL THEN true ELSE false END as is_available,
  s.created_at
FROM public.slots s;

-- Grant access to authenticated users
GRANT SELECT ON public.available_slots TO authenticated;