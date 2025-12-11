-- Allow recruiters to insert their own slot allocations (self-service booking)
CREATE POLICY "Recruiters can insert own allocations"
ON public.slot_allocations
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = 'recruiter'::user_role
  AND company_name = get_user_company_name(auth.uid())
);

-- Allow recruiters to delete their own allocations
CREATE POLICY "Recruiters can delete own allocations"
ON public.slot_allocations
FOR DELETE
USING (
  get_user_role(auth.uid()) = 'recruiter'::user_role
  AND company_name = get_user_company_name(auth.uid())
);