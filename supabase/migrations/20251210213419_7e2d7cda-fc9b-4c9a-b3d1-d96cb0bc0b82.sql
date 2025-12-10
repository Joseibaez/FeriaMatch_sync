-- Create a security definer function to get the recruiter's company name
CREATE OR REPLACE FUNCTION public.get_user_company_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_name FROM public.profiles WHERE id = _user_id
$$;

-- Create policy: Recruiters can view bookings for slot_allocations that belong to their company
CREATE POLICY "Recruiters can view bookings for their company slots"
ON public.bookings
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'recruiter'::user_role
  AND EXISTS (
    SELECT 1 
    FROM public.slot_allocations sa
    WHERE sa.id = bookings.slot_allocation_id
      AND sa.company_name = public.get_user_company_name(auth.uid())
  )
);

-- Also allow recruiters to read candidate profiles for their bookings
-- This requires a new policy on profiles
CREATE POLICY "Recruiters can read candidate profiles for their bookings"
ON public.profiles
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'recruiter'::user_role
  AND EXISTS (
    SELECT 1 
    FROM public.bookings b
    INNER JOIN public.slot_allocations sa ON sa.id = b.slot_allocation_id
    WHERE b.user_id = profiles.id
      AND sa.company_name = public.get_user_company_name(auth.uid())
  )
);