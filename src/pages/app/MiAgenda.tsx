import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Building, User, Briefcase, Clock, ArrowLeft, MapPin, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Type for slot with allocations
type SlotWithAllocations = Tables<"slots"> & {
  allocations: Tables<"slot_allocations">[];
};

type Event = Tables<"events">;

// Mi Agenda page - 2-step hierarchical flow
const MiAgenda = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch all available events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["company-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });

  if (selectedEvent) {
    return (
      <EventDetailView 
        event={selectedEvent} 
        onBack={() => setSelectedEvent(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Mi Agenda</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Mi Agenda
        </h1>
        <p className="text-muted-foreground">
          Selecciona un evento para ver y gestionar tus horarios
        </p>
      </div>

      {/* Events grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {eventsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))
        ) : events && events.length > 0 ? (
          events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onSelect={() => setSelectedEvent(event)} 
            />
          ))
        ) : (
          <Card className="col-span-full border bg-card">
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay eventos disponibles</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Event card component for the list view
const EventCard = ({ event, onSelect }: { event: Event; onSelect: () => void }) => {
  // Get slot count for this event
  const { data: slotCount } = useQuery({
    queryKey: ["event-slot-count", event.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("slots")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();

  return (
    <Card 
      className={`group border bg-card transition-all hover:shadow-md hover:border-primary/50 cursor-pointer ${
        isPast ? "opacity-60" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(eventDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </CardDescription>
          </div>
          {isPast && (
            <Badge variant="secondary" className="text-xs">
              Pasado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {slotCount || 0} slots
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-primary group-hover:bg-primary/10"
          >
            Ver Horarios
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Event detail view - shows slots for selected event
const EventDetailView = ({ event, onBack }: { event: Event; onBack: () => void }) => {
  // Fetch slots for the event with their allocations
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["agenda-slots", event.id],
    queryFn: async () => {
      // First fetch all slots for the event
      const { data: slotsData, error: slotsError } = await supabase
        .from("slots")
        .select("*")
        .eq("event_id", event.id)
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

  const slotsWithCompanies = slots?.filter((s) => s.allocations.length > 0).length || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button 
                onClick={onBack}
                className="hover:text-foreground transition-colors"
              >
                Mi Agenda
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{event.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="w-fit gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Eventos
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {event.title}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              <span className="text-border">•</span>
              {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
            </p>
          </div>
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
            {slotsWithCompanies} de {slots?.length || 0} slots con empresas
          </Badge>
        </div>
      </div>

      {/* Slots grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slotsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))
        ) : slots && slots.length > 0 ? (
          slots.map((slot) => (
            <AgendaSlotCard key={slot.id} slot={slot} />
          ))
        ) : (
          <Card className="col-span-full border bg-card">
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay slots disponibles para este evento</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer count */}
      {slots && slots.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {slots.length} slot{slots.length !== 1 ? "s" : ""} para este evento
        </p>
      )}
    </div>
  );
};

// Compact slot card component for grid view
const AgendaSlotCard = ({ slot }: { slot: SlotWithAllocations }) => {
  const slotStart = new Date(slot.start_time);
  const slotEnd = new Date(slot.end_time);
  const hasAllocations = slot.allocations.length > 0;

  return (
    <Card
      className={`border transition-shadow hover:shadow-sm ${
        hasAllocations ? "border-primary/30 bg-primary/5" : "bg-card"
      }`}
    >
      <CardContent className="p-4">
        {/* Time header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">
              {format(slotStart, "HH:mm")} - {format(slotEnd, "HH:mm")}
            </span>
          </div>
          {hasAllocations && (
            <Badge variant="secondary" className="text-xs">
              {slot.allocations.length}
            </Badge>
          )}
        </div>

        {/* Allocations or empty state */}
        {hasAllocations ? (
          <div className="space-y-2">
            {slot.allocations.slice(0, 2).map((allocation) => (
              <div
                key={allocation.id}
                className="rounded-md bg-background/80 border border-border/50 p-2"
              >
                <div className="flex items-center gap-1.5">
                  <Building className="h-3 w-3 text-primary" />
                  <span className="font-medium text-xs text-foreground truncate">
                    {allocation.company_name}
                  </span>
                </div>
                {allocation.sector && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Briefcase className="h-2.5 w-2.5" />
                    {allocation.sector}
                  </span>
                )}
              </div>
            ))}
            {slot.allocations.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{slot.allocations.length - 2} más
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Sin empresas asignadas
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MiAgenda;
