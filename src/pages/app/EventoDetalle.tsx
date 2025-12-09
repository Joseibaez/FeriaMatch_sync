import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, addMinutes, parse, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GoBackButton } from "@/components/navigation/GoBackButton";
import { EditSlotDialog } from "@/components/slots/EditSlotDialog";
import { SlotCard } from "@/components/slots/SlotCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, Settings, Layers } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const EventoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Tables<"slots"> | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isAdmin = hasRole("admin");

  // Fetch event details
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
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

  // Fetch slots for this event
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slots")
        .select("*")
        .eq("event_id", id)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Generate slots mutation
  const generateSlotsMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not found");

      // Calculate slots based on event timing
      const eventDate = event.event_date;
      const startTimeStr = event.start_time;
      const endTimeStr = event.end_time;
      const duration = event.slot_duration_minutes;

      // Parse start and end times on the event date
      const baseDate = parseISO(eventDate);
      let currentTime = parse(startTimeStr, "HH:mm:ss", baseDate);
      const endTime = parse(endTimeStr, "HH:mm:ss", baseDate);

      const slotsToCreate: Array<{
        event_id: string;
        start_time: string;
        end_time: string;
        company_id: null;
        candidate_id: null;
      }> = [];

      while (isBefore(currentTime, endTime)) {
        const slotEnd = addMinutes(currentTime, duration);
        
        // Don't create a slot if it would extend past end time
        if (isBefore(endTime, slotEnd)) break;

        slotsToCreate.push({
          event_id: id!,
          start_time: currentTime.toISOString(),
          end_time: slotEnd.toISOString(),
          company_id: null,
          candidate_id: null,
        });

        currentTime = slotEnd;
      }

      if (slotsToCreate.length === 0) {
        throw new Error("No slots could be generated with the current configuration");
      }

      const { error } = await supabase.from("slots").insert(slotsToCreate);
      if (error) throw error;

      return slotsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["slots", id] });
      toast({
        title: "Agenda generada",
        description: `Se crearon ${count} slots exitosamente.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from("slots").delete().eq("id", slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", id] });
      toast({
        title: "Slot eliminado",
        description: "El slot ha sido eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateSlots = () => {
    if (slots && slots.length > 0) {
      setShowOverwriteDialog(true);
    } else {
      generateSlotsMutation.mutate();
    }
  };

  const handleConfirmGenerate = () => {
    setShowOverwriteDialog(false);
    generateSlotsMutation.mutate();
  };

  if (eventLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (eventError || !event) {
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
  const totalSlots = slots?.length ?? 0;
  const freeSlots = slots?.filter(s => !s.candidate_id).length ?? 0;
  const bookedSlots = totalSlots - freeSlots;

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

      {/* Event details and metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Total Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{totalSlots}</p>
            <p className="text-xs text-muted-foreground">
              {freeSlots} libres · {bookedSlots} reservados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Agenda Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Estructura de Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Genera automáticamente los slots de tiempo basándote en la configuración del evento.
            Cada slot tendrá una duración de {event.slot_duration_minutes} minutos.
          </p>
          <Button 
            onClick={handleGenerateSlots}
            disabled={generateSlotsMutation.isPending}
          >
            {generateSlotsMutation.isPending ? "Generando..." : "Generar Estructura de Agenda"}
          </Button>
        </CardContent>
      </Card>

      {/* Slots Visualization */}
      {slotsLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : slots && slots.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Slots del Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  isAdmin={isAdmin}
                  onEdit={(s) => {
                    setEditingSlot(s);
                    setEditDialogOpen(true);
                  }}
                  onDelete={(slotId) => deleteSlotMutation.mutate(slotId)}
                  isDeleting={deleteSlotMutation.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="py-12 text-center">
            <Layers className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-foreground">Sin slots generados</h3>
            <p className="max-w-md mx-auto text-sm text-muted-foreground mt-1">
              Haz clic en "Generar Estructura de Agenda" para crear los slots de tiempo
              automáticamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Slot Dialog */}
      <EditSlotDialog
        slot={editingSlot}
        eventId={id!}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Overwrite Confirmation Dialog */}
      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Generar más slots?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existen {slots?.length} slots para este evento. Esta acción agregará 
              nuevos slots adicionales. Si deseas reemplazar los existentes, elimínalos 
              primero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmGenerate}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventoDetalle;
