-- Fix slot double-booking race condition
-- This ensures only one candidate can be assigned to each slot
CREATE UNIQUE INDEX idx_slots_single_candidate 
  ON public.slots (id) 
  WHERE candidate_id IS NOT NULL;