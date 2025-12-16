-- ========================================
-- FIX 1: Update slot_allocations RLS policies for company privacy
-- ========================================

-- Drop the current overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read all allocations" ON public.slot_allocations;

-- Create separate SELECT policies by role
-- Admins can see all allocations
CREATE POLICY "Admins can read all allocations"
ON public.slot_allocations
FOR SELECT
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Candidates can see all allocations (to book slots)
CREATE POLICY "Candidates can read all allocations"
ON public.slot_allocations
FOR SELECT
USING (get_user_role(auth.uid()) = 'candidate'::user_role);

-- Recruiters can ONLY see their own company's allocations
CREATE POLICY "Recruiters can read own allocations"
ON public.slot_allocations
FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'recruiter'::user_role) 
  AND (company_name = get_user_company_name(auth.uid()))
);

-- ========================================
-- FIX 2: Add CASCADE delete constraints
-- ========================================

-- First, drop existing foreign key constraints if they exist (without CASCADE)
ALTER TABLE public.slot_allocations 
DROP CONSTRAINT IF EXISTS slot_allocations_slot_id_fkey;

ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_slot_allocation_id_fkey;

-- Re-add with CASCADE delete
ALTER TABLE public.slot_allocations
ADD CONSTRAINT slot_allocations_slot_id_fkey 
FOREIGN KEY (slot_id) REFERENCES public.slots(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_slot_allocation_id_fkey 
FOREIGN KEY (slot_allocation_id) REFERENCES public.slot_allocations(id) ON DELETE CASCADE;

-- ========================================
-- FIX 3: Create RPC function for bulk slot deletion
-- ========================================

CREATE OR REPLACE FUNCTION public.delete_event_slots(event_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Only allow admins to execute this function
  IF NOT (get_user_role(auth.uid()) = 'admin'::user_role) THEN
    RAISE EXCEPTION 'Only admins can delete event slots';
  END IF;

  -- Delete all slots for the event (cascades to allocations and bookings)
  DELETE FROM public.slots WHERE event_id = event_uuid;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;