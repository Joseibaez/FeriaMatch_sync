-- Create bookings table for candidate reservations
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_allocation_id UUID NOT NULL REFERENCES public.slot_allocations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate bookings: same user cannot book same allocation twice
  UNIQUE (user_id, slot_allocation_id)
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Candidates can create their own bookings
CREATE POLICY "Candidates can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND get_user_role(auth.uid()) = 'candidate'::user_role
);

-- Candidates can delete their own bookings
CREATE POLICY "Candidates can delete own bookings"
ON public.bookings
FOR DELETE
USING (
  auth.uid() = user_id 
  AND get_user_role(auth.uid()) = 'candidate'::user_role
);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Admins can manage all bookings
CREATE POLICY "Admins can delete any booking"
ON public.bookings
FOR DELETE
USING (get_user_role(auth.uid()) = 'admin'::user_role);