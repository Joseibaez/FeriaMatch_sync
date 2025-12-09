import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Building, User, Briefcase, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

// Type for slot with allocations
type SlotWithAllocations = Tables<"slots"> & {
  allocations: Tables<"slot_allocations">[];
};

// Mi Agenda page - shows available slots with their companies (read-only view)
const MiAgenda = () => {
  // Fetch the first upcoming event
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["upcoming-event"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch slots for the event with their allocations
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["agenda-slots", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      // First fetch all slots for the event
      const { data: slotsData, error: slotsError } = await supabase
        .from("slots")
        .select("*")
        .eq("event_id", event!.id)
        .order("start_time", { ascending: true });

      if (slotsError) throw slotsError;

      // Then fetch all allocations for these slots
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
        allocations: allocationsData.filter((a) => a.slot_id === slot.id),
      }));

      return slotsWithAllocations;
    },
  });

  const isLoading = eventLoading || slotsLoading;

  // Count slots with allocations
  const slotsWithCompanies = slots?.filter((s) => s.allocations.length > 0).length || 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Mi Agenda
          </h1>
          <p className="text-muted-foreground">
            Consulta los horarios y empresas disponibles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default">
            <Calendar className="mr-2 h-4 w-4" />
            Ver calendario
          </Button>
        </div>
      </div>

      {/* Event info card */}
      {eventLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : event ? (
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>
                  {format(new Date(event.event_date), "d 'de' MMMM, yyyy", { locale: es })}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {slotsWithCompanies} slot{slotsWithCompanies !== 1 ? "s" : ""} con empresas
              </Badge>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border bg-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No hay eventos programados</p>
          </CardContent>
        </Card>
      )}

      {/* Slots list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : slots && slots.length > 0 ? (
          slots.map((slot) => (
            <AgendaSlotCard key={slot.id} slot={slot} />
          ))
        ) : (
          <Card className="border bg-card">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No hay slots disponibles para este evento</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer count */}
      {slots && slots.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {slots.length} slot{slots.length !== 1 ? "s" : ""} para el evento seleccionado
        </p>
      )}
    </div>
  );
};

// Read-only slot card component for agenda view
const AgendaSlotCard = ({ slot }: { slot: SlotWithAllocations }) => {
  const slotStart = new Date(slot.start_time);
  const slotEnd = new Date(slot.end_time);
  const hasAllocations = slot.allocations.length > 0;

  return (
    <Card
      className={`border transition-shadow hover:shadow-md ${
        hasAllocations ? "border-primary/30 bg-primary/5" : "bg-card"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Time block */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-20 flex-col items-center justify-center rounded-lg bg-primary/10 text-center">
              <Clock className="mb-1 h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {format(slotStart, "HH:mm")}
              </span>
            </div>

            {/* Slot details */}
            <div className="flex-1 space-y-2">
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

              {/* Allocations list or empty state */}
              {hasAllocations ? (
                <div className="space-y-2">
                  {slot.allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="rounded-md bg-background/80 border border-border/50 p-2.5"
                    >
                      {/* Company name */}
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-sm text-foreground">
                          {allocation.company_name}
                        </span>
                      </div>

                      {/* Sector and Interviewer */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {allocation.sector && (
                          <Badge variant="outline" className="text-xs font-normal">
                            <Briefcase className="mr-1 h-3 w-3" />
                            {allocation.sector}
                          </Badge>
                        )}
                        {allocation.interviewer_name && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {allocation.interviewer_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Disponible — sin empresas asignadas
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MiAgenda;
