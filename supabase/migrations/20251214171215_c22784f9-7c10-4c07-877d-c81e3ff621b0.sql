-- Allow recruiters to update their own slot allocations (for stand_number, interviewer_name, etc.)
CREATE POLICY "Recruiters can update own allocations"
ON public.slot_allocations
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = 'recruiter'::user_role) 
  AND (company_name = get_user_company_name(auth.uid()))
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'recruiter'::user_role) 
  AND (company_name = get_user_company_name(auth.uid()))
);