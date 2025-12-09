import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GoBackButton } from "@/components/navigation/GoBackButton";
import { Calendar, Clock, Settings } from "lucide-react";

const EventoDetalle = () => {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <GoBackButton />
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Evento no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = format(parseISO(event.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const timeRange = `${event.start_time.slice(0, 5)} - ${event.end_time.slice(0, 5)}`;

  return (
    <div className="space-y-6">
      <GoBackButton />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {event.title}
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary">
              <Settings className="mr-1 h-3 w-3" />
              Configuración
            </Badge>
          </div>
          <p className="text-muted-foreground capitalize">{formattedDate}</p>
        </div>
      </div>

      {/* Event details */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">
              {format(parseISO(event.event_date), "d MMM yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duración por Slot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{event.slot_duration_minutes} minutos</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future configuration options */}
      <Card className="border-dashed border-2 bg-muted/20">
        <CardContent className="py-12 text-center">
          <Settings className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-foreground">Configuración del Evento</h3>
          <p className="max-w-md mx-auto text-sm text-muted-foreground mt-1">
            Próximamente podrás gestionar slots, asignar empresas y configurar 
            opciones avanzadas desde esta página.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventoDetalle;
