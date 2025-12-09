-- Create slot_allocations table for one-to-many relationship between slots and companies
CREATE TABLE public.slot_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  sector TEXT,
  interviewer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.slot_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for slot_allocations
CREATE POLICY "Authenticated users can read all allocations"
ON public.slot_allocations
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert allocations"
ON public.slot_allocations
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Admins can update allocations"
ON public.slot_allocations
FOR UPDATE
USING (get_user_role(auth.uid()) = 'admin'::user_role)
WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Admins can delete allocations"
ON public.slot_allocations
FOR DELETE
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create index for efficient querying by slot_id
CREATE INDEX idx_slot_allocations_slot_id ON public.slot_allocations(slot_id);