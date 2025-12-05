-- 1. Create ENUM type for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'recruiter', 'candidate');

-- 2. Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'candidate',
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create events table (time configuration master)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create slots table (inventory)
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- 6. Security definer function to check user role (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- 7. RLS Policies for PROFILES
-- Read: All authenticated users can read all profiles
CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Update: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Insert: Allow trigger to insert profiles (service role)
CREATE POLICY "Allow insert for new users"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 8. RLS Policies for EVENTS
-- Read: All authenticated users can read events
CREATE POLICY "Authenticated users can read all events"
ON public.events FOR SELECT
TO authenticated
USING (true);

-- Insert/Update/Delete: Only admins
CREATE POLICY "Admins can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- 9. RLS Policies for SLOTS
-- Read: All authenticated users can read slots
CREATE POLICY "Authenticated users can read all slots"
ON public.slots FOR SELECT
TO authenticated
USING (true);

-- Admin: Full access to slots
CREATE POLICY "Admins can insert slots"
ON public.slots FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete slots"
ON public.slots FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Admin can update any slot
CREATE POLICY "Admins can update slots"
ON public.slots FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Recruiter: Can update slots assigned to them
CREATE POLICY "Recruiters can update their assigned slots"
ON public.slots FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'recruiter' 
  AND company_id = auth.uid()
)
WITH CHECK (
  public.get_user_role(auth.uid()) = 'recruiter' 
  AND company_id = auth.uid()
);

-- Candidate: Can book (set candidate_id) if slot is available
CREATE POLICY "Candidates can book available slots"
ON public.slots FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'candidate'
  AND (candidate_id IS NULL OR candidate_id = auth.uid())
)
WITH CHECK (
  public.get_user_role(auth.uid()) = 'candidate'
  AND (candidate_id = auth.uid() OR candidate_id IS NULL)
);

-- 10. Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'candidate')
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. Create indexes for performance
CREATE INDEX idx_slots_event_id ON public.slots(event_id);
CREATE INDEX idx_slots_company_id ON public.slots(company_id);
CREATE INDEX idx_slots_candidate_id ON public.slots(candidate_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);