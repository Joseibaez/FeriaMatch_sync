-- Update the handle_new_user function to accept role from user metadata
-- Only 'candidate' or 'recruiter' roles can be self-assigned; 'admin' is ignored
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selected_role text;
  final_role app_role;
BEGIN
  -- Get the role from metadata, default to 'candidate'
  selected_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'candidate');
  
  -- Only allow 'candidate' or 'recruiter' to be self-assigned
  -- 'admin' must be manually assigned by existing admin
  IF selected_role = 'recruiter' THEN
    final_role := 'recruiter'::app_role;
  ELSE
    final_role := 'candidate'::app_role;
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'company_name'
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role);
  
  RETURN NEW;
END;
$$;