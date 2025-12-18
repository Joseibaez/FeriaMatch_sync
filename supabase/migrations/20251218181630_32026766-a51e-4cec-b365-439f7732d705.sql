-- Public, privacy-safe aggregated booking counts for event agenda
-- Candidates cannot SELECT from bookings due to RLS, so we expose counts via a SECURITY DEFINER RPC.

CREATE OR REPLACE FUNCTION public.get_event_allocation_booking_counts(p_event_id uuid)
RETURNS TABLE(
  slot_allocation_id uuid,
  active_count integer,
  pending_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.slot_allocation_id,
    COUNT(*) FILTER (WHERE b.status IN ('pending','confirmed','accepted'))::int AS active_count,
    COUNT(*) FILTER (WHERE b.status = 'pending')::int AS pending_count
  FROM public.bookings b
  JOIN public.slot_allocations sa ON sa.id = b.slot_allocation_id
  JOIN public.slots s ON s.id = sa.slot_id
  WHERE s.event_id = p_event_id
  GROUP BY b.slot_allocation_id;
$$;

-- Allow authenticated clients to call it
GRANT EXECUTE ON FUNCTION public.get_event_allocation_booking_counts(uuid) TO authenticated;