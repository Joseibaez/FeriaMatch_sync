-- Add policy for recruiters to update bookings for their company's slot allocations
CREATE POLICY "Recruiters can update bookings for their company"
ON public.bookings
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = 'recruiter'::user_role) 
  AND EXISTS (
    SELECT 1 FROM slot_allocations sa
    WHERE sa.id = bookings.slot_allocation_id 
    AND sa.company_name = get_user_company_name(auth.uid())
  )
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'recruiter'::user_role) 
  AND EXISTS (
    SELECT 1 FROM slot_allocations sa
    WHERE sa.id = bookings.slot_allocation_id 
    AND sa.company_name = get_user_company_name(auth.uid())
  )
);