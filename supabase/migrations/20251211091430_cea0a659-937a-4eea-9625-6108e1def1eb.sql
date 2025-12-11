-- Fix: Make the view use SECURITY INVOKER (default behavior, but explicit)
DROP VIEW IF EXISTS public.available_slots;

CREATE VIEW public.available_slots 
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.event_id,
  s.start_time,
  s.end_time,
  s.company_id,
  CASE WHEN s.candidate_id IS NULL THEN true ELSE false END as is_available,
  s.created_at
FROM public.slots s;

-- Grant access to authenticated users
GRANT SELECT ON public.available_slots TO authenticated;