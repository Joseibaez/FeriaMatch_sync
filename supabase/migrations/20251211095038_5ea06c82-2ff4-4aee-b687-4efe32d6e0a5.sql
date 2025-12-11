-- Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add INSERT policy for profiles as safety net (in case trigger fails)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Allow insert for new users'
  ) THEN
    CREATE POLICY "Allow insert for new users" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;