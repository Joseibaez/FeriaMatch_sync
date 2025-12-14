import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building, User, Briefcase, Clock, CalendarDays, CheckCircle, Loader2, Users, AlertCircle } from "lucide-react";
import { GoBackButton } from "@/components/navigation/GoBackButton";
import { getStringColor, getContrastTextColor } from "@/lib/colorUtils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
const MAX_CAPACITY = 2;

// Type for allocation with booking count
type AllocationWithBookings = Tables<"slot_allocations"> & {
  bookingCount: number;
  isBooked: boolean;
  bookingStatus: string | null; // 'pending' | 'confirmed' | 'rejected' | null
};

// Type for slot with allocations
type SlotWithAllocations = Tables<"slots"> & {
  allocations: AllocationWithBookings[];
};

// Public agenda page for a specific event - read-only view
const EventoAgenda = () => {
  const {
    eventId
  } = useParams<{
    eventId: string;
  }>();
  const {
    user,
    userRole
  } = useAuth();
  const queryClient = useQueryClient();

  // Fetch event details
  const {
    data: event,
    isLoading: eventLoading
  } = useQuery({
    queryKey: ["event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch user's existing bookings for this event with slot times and status for overlap check
  const {
    data: userBookingsData
  } = useQuery({
    queryKey: ["user-bookings-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get all user bookings
      const {
        data: bookings,
        error: bookingsError
      } = await supabase.from("bookings").select("id, slot_allocation_id, status").eq("user_id", user!.id);
      if (bookingsError) throw bookingsError;
      if (!bookings || bookings.length === 0) return {
        bookingIds: [],
        bookingsWithSlots: [],
        bookingStatuses: {}
      };

      // Get slot allocations for these bookings
      const allocationIds = bookings.map(b => b.slot_allocation_id);
      const {
        data: allocations,
        error: allocError
      } = await supabase.from("slot_allocations").select("id, slot_id").in("id", allocationIds);
      if (allocError) throw allocError;

      // Get slots for time ranges
      const slotIds = allocations?.map(a => a.slot_id) || [];
      const {
        data: slots,
        error: slotsError
      } = await supabase.from("slots").select("id, start_time, end_time").in("id", slotIds);
      if (slotsError) throw slotsError;

      // Create booking status map
      const bookingStatuses: Record<string, string> = {};
      bookings.forEach(booking => {
        bookingStatuses[booking.slot_allocation_id] = booking.status;
      });

      // Combine bookings with their slot times
      const bookingsWithSlots = bookings.map(booking => {
        const allocation = allocations?.find(a => a.id === booking.slot_allocation_id);
        const slot = slots?.find(s => s.id === allocation?.slot_id);
        return {
          bookingId: booking.id,
          allocationId: booking.slot_allocation_id,
          slotId: allocation?.slot_id,
          startTime: slot?.start_time,
          endTime: slot?.end_time,
          status: booking.status
        };
      });
      return {
        bookingIds: bookings.map(b => b.slot_allocation_id),
        bookingsWithSlots,
        bookingStatuses
      };
    }
  });
  const userBookings = userBookingsData?.bookingIds || [];
  const bookingStatuses = userBookingsData?.bookingStatuses || {};

  // Fetch slots with allocations and booking counts
  const {
    data: slots,
    isLoading: slotsLoading
  } = useQuery({
    queryKey: ["event-slots-agenda", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      // Fetch all slots for the event
      const {
        data: slotsData,
        error: slotsError
      } = await supabase.from("slots").select("*").eq("event_id", eventId!).order("start_time", {
        ascending: true
      });
      if (slotsError) throw slotsError;
      if (slotsData.length === 0) return [];

      // Fetch all allocations for these slots
      const slotIds = slotsData.map(s => s.id);
      const {
        data: allocationsData,
        error: allocationsError
      } = await supabase.from("slot_allocations").select("*").in("slot_id", slotIds).order("created_at", {
        ascending: true
      });
      if (allocationsError) throw allocationsError;

      // Fetch all bookings for these allocations to get counts (only count confirmed for capacity)
      const allocationIds = allocationsData?.map(a => a.id) || [];
      let bookingCounts: Record<string, number> = {};
      if (allocationIds.length > 0) {
        const {
          data: bookingsData,
          error: bookingsError
        } = await supabase.from("bookings").select("slot_allocation_id, status").in("slot_allocation_id", allocationIds).in("status", ["confirmed", "pending"]); // Count both confirmed and pending for capacity

        if (bookingsError) throw bookingsError;

        // Count bookings per allocation
        bookingCounts = (bookingsData || []).reduce((acc, booking) => {
          acc[booking.slot_allocation_id] = (acc[booking.slot_allocation_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Combine slots with their allocations and booking counts
      const slotsWithAllocations: SlotWithAllocations[] = slotsData.map(slot => ({
        ...slot,
        allocations: (allocationsData?.filter(a => a.slot_id === slot.id) || []).map(allocation => ({
          ...allocation,
          bookingCount: bookingCounts[allocation.id] || 0,
          isBooked: false,
          // Will be set later with user bookings
          bookingStatus: null
        }))
      }));
      return slotsWithAllocations;
    }
  });

  // Helper function to check if two time ranges overlap
  const checkTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    // Overlap if one starts before the other ends and vice versa
    return s1 < e2 && s2 < e1;
  };

  // Mutation for creating a booking request (status = 'pending')
  const bookMutation = useMutation({
    mutationFn: async (slotAllocationId: string) => {
      // First, get the slot time for the allocation being booked
      const {
        data: targetAllocation,
        error: allocError
      } = await supabase.from("slot_allocations").select("slot_id, company_name").eq("id", slotAllocationId).single();
      if (allocError) throw new Error("No se pudo obtener la asignación");
      const {
        data: targetSlot,
        error: slotError
      } = await supabase.from("slots").select("start_time, end_time").eq("id", targetAllocation.slot_id).single();
      if (slotError) throw new Error("No se pudo obtener el horario del slot");

      // Check for overlapping bookings (only check pending and confirmed)
      const existingBookings = userBookingsData?.bookingsWithSlots.filter(b => b.status === 'pending' || b.status === 'confirmed') || [];
      const hasOverlap = existingBookings.some(booking => {
        if (!booking.startTime || !booking.endTime) return false;
        return checkTimeOverlap(targetSlot.start_time, targetSlot.end_time, booking.startTime, booking.endTime);
      });
      if (hasOverlap) {
        throw new Error("OVERLAP");
      }

      // No overlap, proceed with booking request (status = 'pending')
      const {
        error
      } = await supabase.from("bookings").insert({
        user_id: user!.id,
        slot_allocation_id: slotAllocationId,
        status: 'pending' // NEW: Insert as pending instead of confirmed
      });
      if (error) throw error;

      // Return data needed for email
      return {
        companyName: targetAllocation.company_name,
        slotStart: targetSlot.start_time
      };
    },
    onSuccess: async data => {
      toast.success("Solicitud enviada. La empresa revisará tu solicitud.");
      queryClient.invalidateQueries({
        queryKey: ["user-bookings-full", user?.id]
      });
      queryClient.invalidateQueries({
        queryKey: ["event-slots-agenda", eventId]
      });

      // Send notification email to company
      try {
        // Get user profile for name, email and CV
        const {
          data: profile
        } = await supabase.from("profiles").select("full_name, email, cv_url").eq("id", user!.id).single();

        // Get company recruiter email
        const {
          data: companyProfiles
        } = await supabase.from("profiles").select("email").eq("company_name", data.companyName).limit(1);
        if (profile && event && data && companyProfiles && companyProfiles.length > 0) {
          const slotDate = new Date(data.slotStart);
          await supabase.functions.invoke("send-booking-email", {
            body: {
              type: "request_to_company",
              companyEmail: companyProfiles[0].email,
              candidateName: profile.full_name || "Candidato",
              candidateEmail: profile.email,
              candidateCvUrl: profile.cv_url,
              date: format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy", {
                locale: es
              }),
              time: format(slotDate, "HH:mm")
            }
          });
        }
      } catch (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't show error to user - booking request was successful
      }
    },
    onError: (error: Error) => {
      if (error.message === "OVERLAP") {
        toast.error("Ya tienes otra entrevista programada en este horario");
      } else if (error.message.includes("duplicate")) {
        toast.error("Ya tienes una solicitud con esta empresa");
      } else {
        toast.error("Error al enviar la solicitud");
      }
    }
  });

  // Mark allocations that user has already booked and their status
  const slotsWithBookingStatus = slots?.map(slot => ({
    ...slot,
    allocations: slot.allocations.map(allocation => ({
      ...allocation,
      isBooked: userBookings?.includes(allocation.id) || false,
      bookingStatus: bookingStatuses[allocation.id] || null
    }))
  }));
  const isLoading = eventLoading || slotsLoading;

  // Count slots with allocations
  const slotsWithCompanies = slots?.filter(s => s.allocations.length > 0).length || 0;
  const totalCompanies = slots?.reduce((acc, s) => acc + s.allocations.length, 0) || 0;
  return <div className="space-y-6">
      {/* Page header with back button */}
      <div className="flex flex-col gap-4">
        <GoBackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Agenda del Evento
          </h1>
          <p className="text-muted-foreground">
            Consulta los horarios y empresas participantes
          </p>
        </div>
      </div>

      {/* Event info card */}
      {eventLoading ? <Skeleton className="h-28 w-full" /> : event ? <Card className="border bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <CalendarDays className="h-4 w-4" />
                  {format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy", {
                locale: es
              })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {totalCompanies} empresa{totalCompanies !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline">
                  {slotsWithCompanies}/{slots?.length || 0} slots ocupados
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card> : <Card className="border bg-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Evento no encontrado</p>
          </CardContent>
        </Card>}

      {/* Slots list - Using same grid layout as Admin view */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({
        length: 6
      }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />) : slotsWithBookingStatus && slotsWithBookingStatus.length > 0 ? slotsWithBookingStatus.map(slot => <PublicSlotCard key={slot.id} slot={slot} canBook={!!user && userRole === 'candidate'} onBook={allocationId => bookMutation.mutate(allocationId)} isBooking={bookMutation.isPending} bookingAllocationId={bookMutation.variables} />) : <Card className="col-span-full border bg-card">
            <CardContent className="py-8 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No hay slots programados para este evento</p>
            </CardContent>
          </Card>}
      </div>

      {/* Footer count */}
      {slots && slots.length > 0 && <p className="text-center text-sm text-muted-foreground">
          Mostrando {slots.length} slot{slots.length !== 1 ? "s" : ""} con{" "}
          {totalCompanies} empresa{totalCompanies !== 1 ? "s" : ""} participante{totalCompanies !== 1 ? "s" : ""}
        </p>}
    </div>;
};

// Read-only slot card component for public agenda view
interface PublicSlotCardProps {
  slot: SlotWithAllocations;
  canBook: boolean;
  onBook: (allocationId: string) => void;
  isBooking: boolean;
  bookingAllocationId?: string;
}
const PublicSlotCard = ({
  slot,
  canBook,
  onBook,
  isBooking,
  bookingAllocationId
}: PublicSlotCardProps) => {
  const slotStart = new Date(slot.start_time);
  const slotEnd = new Date(slot.end_time);
  const hasAllocations = slot.allocations.length > 0;
  return <div className={`rounded-lg border p-3 transition-colors ${hasAllocations ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-accent/50"}`}>
      {/* Header: Time range */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">
            {format(slotStart, "HH:mm")} - {format(slotEnd, "HH:mm")}
          </p>
          {hasAllocations && <Badge variant="secondary" className="text-xs">
              {slot.allocations.length} empresa{slot.allocations.length > 1 ? "s" : ""}
            </Badge>}
        </div>
      </div>

      {/* Allocations list with deterministic pastel colors */}
      <div className="space-y-2">
        {hasAllocations ? <div className="space-y-1.5">
            {slot.allocations.map((allocation, index) => {
          const bgColor = getStringColor(allocation.company_name);
          const textColor = getContrastTextColor();
          const isCurrentlyBooking = isBooking && bookingAllocationId === allocation.id;
          const isFull = allocation.bookingCount >= MAX_CAPACITY;
          const spotsLeft = MAX_CAPACITY - allocation.bookingCount;
          return <div key={allocation.id} className={`rounded-md p-2 transition-colors ${index < slot.allocations.length - 1 ? "border-b border-border/30" : ""}`} style={{
            backgroundColor: bgColor
          }}>
                  {/* Company name and availability badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" style={{
                  color: textColor
                }} />
                      <span className="font-medium text-sm" style={{
                  color: textColor
                }}>
                        {allocation.company_name}
                      </span>
                    </div>

                    {/* Availability badge */}
                    <Badge variant="outline" className={`text-xs gap-1 ${isFull ? "bg-red-100 text-red-700 border-red-200" : "bg-background/80 border-border/50"}`}>
                      <Users className="h-3 w-3" />
                      {allocation.bookingCount}/{MAX_CAPACITY}
                    </Badge>
                  </div>

                  {/* Sector and Interviewer */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {allocation.sector && <Badge variant="outline" className="text-xs font-normal bg-background/60 border-border/40" style={{
                color: textColor
              }}>
                        <Briefcase className="mr-1 h-3 w-3" />
                        {allocation.sector}
                      </Badge>}
                    {allocation.interviewer_name && <span className="flex items-center gap-1 text-xs opacity-80" style={{
                color: textColor
              }}>
                        <User className="h-3 w-3" />
                        {allocation.interviewer_name}
                      </span>}
                  </div>

                  {/* Booking button - only for logged-in candidates */}
                  {canBook && <div className="mt-2 pt-2 border-t border-border/30">
                      {allocation.isBooked ?
              // User has a booking - show status
              allocation.bookingStatus === 'pending' ? <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Solicitud Pendiente
                          </Badge> : allocation.bookingStatus === 'confirmed' ? <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Confirmado
                          </Badge> : allocation.bookingStatus === 'rejected' ? <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 gap-1">
                            Rechazado
                          </Badge> : <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Reservado
                          </Badge> : isFull ? <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                          Completo
                        </Badge> : <Button size="sm" variant="secondary" onClick={() => onBook(allocation.id)} disabled={isCurrentlyBooking} className="h-7 text-xs px-3 gap-1 bg-primary">
{isCurrentlyBooking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Solicitar"}
                        </Button>}
                    </div>}
                </div>;
        })}
          </div> : <p className="text-xs text-muted-foreground italic">
            Disponible — sin empresas asignadas
          </p>}
      </div>

      {/* Allocation count badge */}
      {hasAllocations && <div className="mt-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {slot.allocations.length} empresa{slot.allocations.length > 1 ? "s" : ""} asignada{slot.allocations.length > 1 ? "s" : ""}
          </span>
        </div>}
    </div>;
};
export default EventoAgenda;