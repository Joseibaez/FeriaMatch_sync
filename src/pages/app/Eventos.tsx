import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, Clock, Users, Building2, MoreVertical } from "lucide-react";

import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EmptyEventsState } from "@/components/events/EmptyEventsState";

// Helper to determine event status based on date
const getEventStatus = (eventDate: string): "activo" | "proximo" | "finalizado" => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseISO(eventDate);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return "activo";
  if (date > today) return "proximo";
  return "finalizado";
};

// Estado badge styling
const estadoBadge = {
  activo: { class: "bg-accent/10 text-accent border-accent/20", label: "Activo" },
  proximo: { class: "bg-primary/10 text-primary border-primary/20", label: "Próximo" },
  borrador: { class: "bg-muted text-muted-foreground border-border", label: "Borrador" },
  finalizado: { class: "bg-secondary text-secondary-foreground border-border", label: "Finalizado" },
};

// Format time from "HH:MM:SS" to "HH:MM"
const formatTime = (time: string) => time.slice(0, 5);

// Eventos page - Admin view for managing job fair events
const Eventos = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleCreateSuccess = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasEvents = events && events.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Eventos
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary">
              Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Crea y gestiona las ferias de empleo
          </p>
        </div>
        <Button variant="default" size="default" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      {/* Empty state or Events grid */}
      {!hasEvents ? (
        <EmptyEventsState onCreateClick={() => setIsCreateDialogOpen(true)} />
      ) : (
        <>
          {/* Events grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((evento) => {
              const status = getEventStatus(evento.event_date);
              const formattedDate = format(parseISO(evento.event_date), "d MMM yyyy", { locale: es });
              const timeRange = `${formatTime(evento.start_time)} - ${formatTime(evento.end_time)}`;

              return (
                <Card key={evento.id} className="border bg-card transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{evento.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formattedDate}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={estadoBadge[status].class}
                        >
                          {estadoBadge[status].label}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Event details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{timeRange}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground">{evento.slot_duration_minutes} min</span>
                        <span>/ slot</span>
                      </div>
                    </div>

                    {/* Stats placeholder - will be populated when we have slot data */}
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          <span className="font-semibold text-foreground">-</span>
                          <span className="text-muted-foreground"> empresas</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="text-sm">
                          <span className="font-semibold text-foreground">-</span>
                          <span className="text-muted-foreground"> candidatos</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/app/eventos/${evento.id}`)}
                      >
                        Configurar
                      </Button>
                      <Button variant="default" size="sm" className="flex-1">
                        Ver Agenda
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info card */}
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="font-semibold text-foreground">Gestión Centralizada</h3>
              <p className="max-w-sm text-sm text-muted-foreground mt-1">
                Como Admin, defines el horario global y la duración de slots. 
                Las empresas solo pueden ocupar los slots que tú configures.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default Eventos;
