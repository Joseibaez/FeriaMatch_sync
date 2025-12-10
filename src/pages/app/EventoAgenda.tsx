import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building, User, Briefcase, Clock, CalendarDays, CheckCircle, Loader2 } from "lucide-react";
import { GoBackButton } from "@/components/navigation/GoBackButton";
import { getStringColor, getContrastTextColor } from "@/lib/colorUtils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

// Type for slot with allocations and user bookings
type SlotWithAllocations = Tables<"slots"> & {
  allocations: (Tables<"slot_allocations"> & { isBooked?: boolean })[];
};

// Public agenda page for a specific event - read-only view
const EventoAgenda = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch user's existing bookings for this event
  const { data: userBookings } = useQuery({
    queryKey: ["user-bookings", eventId, user?.id],
    enabled: !!eventId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("slot_allocation_id")
        .eq("user_id", user!.id);

      if (error) throw error;
      return data?.map((b) => b.slot_allocation_id) || [];
    },
  });

  // Fetch slots for this specific event with their allocations
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["event-slots-agenda", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      // Fetch all slots for the event
      const { data: slotsData, error: slotsError } = await supabase
        .from("slots")
        .select("*")
        .eq("event_id", eventId!)
        .order("start_time", { ascending: true });

      if (slotsError) throw slotsError;

      if (slotsData.length === 0) return [];

      // Fetch all allocations for these slots
      const slotIds = slotsData.map((s) => s.id);
      const { data: allocationsData, error: allocationsError } = await supabase
        .from("slot_allocations")
        .select("*")
        .in("slot_id", slotIds)
        .order("created_at", { ascending: true });

      if (allocationsError) throw allocationsError;

      // Combine slots with their allocations
      const slotsWithAllocations: SlotWithAllocations[] = slotsData.map((slot) => ({
        ...slot,
        allocations: allocationsData?.filter((a) => a.slot_id === slot.id) || [],
      }));

      return slotsWithAllocations;
    },
  });

  // Mutation for creating a booking
  const bookMutation = useMutation({
    mutationFn: async (slotAllocationId: string) => {
      const { error } = await supabase
        .from("bookings")
        .insert({
          user_id: user!.id,
          slot_allocation_id: slotAllocationId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva confirmada");
      queryClient.invalidateQueries({ queryKey: ["user-bookings", eventId, user?.id] });
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Ya tienes una reserva con esta empresa");
      } else {
        toast.error("Error al realizar la reserva");
      }
    },
  });

  // Mark allocations that user has already booked
  const slotsWithBookingStatus = slots?.map((slot) => ({
    ...slot,
    allocations: slot.allocations.map((allocation) => ({
      ...allocation,
      isBooked: userBookings?.includes(allocation.id) || false,
    })),
  }));

  const isLoading = eventLoading || slotsLoading;

  // Count slots with allocations
  const slotsWithCompanies = slots?.filter((s) => s.allocations.length > 0).length || 0;
  const totalCompanies = slots?.reduce((acc, s) => acc + s.allocations.length, 0) || 0;

  return (
    <div className="space-y-6">
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
      {eventLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : event ? (
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <CalendarDays className="h-4 w-4" />
                  {format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
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
        </Card>
      ) : (
        <Card className="border bg-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Evento no encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Slots list - Using same grid layout as Admin view */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : slotsWithBookingStatus && slotsWithBookingStatus.length > 0 ? (
          slotsWithBookingStatus.map((slot) => (
            <PublicSlotCard 
              key={slot.id} 
              slot={slot} 
              canBook={!!user && userRole === 'candidate'}
              onBook={(allocationId) => bookMutation.mutate(allocationId)}
              isBooking={bookMutation.isPending}
              bookingAllocationId={bookMutation.variables}
            />
          ))
        ) : (
          <Card className="col-span-full border bg-card">
            <CardContent className="py-8 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No hay slots programados para este evento</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer count */}
      {slots && slots.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {slots.length} slot{slots.length !== 1 ? "s" : ""} con{" "}
          {totalCompanies} empresa{totalCompanies !== 1 ? "s" : ""} participante{totalCompanies !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

// Read-only slot card component for public agenda view
// Mirrors the Admin SlotCard design but without edit/delete actions
interface PublicSlotCardProps {
  slot: SlotWithAllocations;
  canBook: boolean;
  onBook: (allocationId: string) => void;
  isBooking: boolean;
  bookingAllocationId?: string;
}

const PublicSlotCard = ({ slot, canBook, onBook, isBooking, bookingAllocationId }: PublicSlotCardProps) => {
  const slotStart = new Date(slot.start_time);
  const slotEnd = new Date(slot.end_time);
  const hasAllocations = slot.allocations.length > 0;

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        hasAllocations
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:bg-accent/50"
      }`}
    >
      {/* Header: Time range (no actions in public view) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">
            {format(slotStart, "HH:mm")} - {format(slotEnd, "HH:mm")}
          </p>
          {hasAllocations && (
            <Badge variant="secondary" className="text-xs">
              {slot.allocations.length} empresa{slot.allocations.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Allocations list with deterministic pastel colors */}
      <div className="space-y-2">
        {hasAllocations ? (
          <div className="space-y-1.5">
            {slot.allocations.map((allocation, index) => {
              // Generate deterministic pastel color from company name
              const bgColor = getStringColor(allocation.company_name);
              const textColor = getContrastTextColor();
              const isCurrentlyBooking = isBooking && bookingAllocationId === allocation.id;
              
              return (
                <div
                  key={allocation.id}
                  className={`rounded-md p-2 transition-colors ${
                    index < slot.allocations.length - 1 ? "border-b border-border/30" : ""
                  }`}
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Company name */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" style={{ color: textColor }} />
                      <span 
                        className="font-medium text-sm"
                        style={{ color: textColor }}
                      >
                        {allocation.company_name}
                      </span>
                    </div>

                    {/* Booking button - only for logged-in candidates */}
                    {canBook && (
                      allocation.isBooked ? (
                        <Badge 
                          variant="secondary" 
                          className="bg-green-100 text-green-800 border-green-200 gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Reservado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-xs px-2 bg-background/80 hover:bg-background"
                          onClick={() => onBook(allocation.id)}
                          disabled={isCurrentlyBooking}
                        >
                          {isCurrentlyBooking ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Reservar"
                          )}
                        </Button>
                      )
                    )}
                  </div>

                  {/* Sector and Interviewer */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {allocation.sector && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-normal bg-background/60 border-border/40"
                        style={{ color: textColor }}
                      >
                        <Briefcase className="mr-1 h-3 w-3" />
                        {allocation.sector}
                      </Badge>
                    )}
                    {allocation.interviewer_name && (
                      <span 
                        className="flex items-center gap-1 text-xs opacity-80"
                        style={{ color: textColor }}
                      >
                        <User className="h-3 w-3" />
                        {allocation.interviewer_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Disponible — sin empresas asignadas
          </p>
        )}
      </div>

      {/* Allocation count badge */}
      {hasAllocations && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {slot.allocations.length} empresa{slot.allocations.length > 1 ? "s" : ""} asignada{slot.allocations.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
};

export default EventoAgenda;
