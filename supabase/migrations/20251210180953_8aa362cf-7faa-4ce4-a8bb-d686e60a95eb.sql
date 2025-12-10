-- Add stand_number column to slot_allocations
ALTER TABLE public.slot_allocations 
ADD COLUMN stand_number text;