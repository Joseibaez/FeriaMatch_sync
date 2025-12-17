import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, addMinutes, parse, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { toast as sonnerToast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GoBackButton } from "@/components/navigation/GoBackButton";
import { EditSlotDialog } from "@/components/slots/EditSlotDialog";
import { SlotCard } from "@/components/slots/SlotCard";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { BulkAssignDialog } from "@/components/slots/BulkAssignDialog";
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
import { Calendar, Clock, Settings, Layers, Users, RefreshCw, Download, ImageIcon, Trash2, AlertTriangle, Pencil } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { generateCSV, downloadCSV, CSVColumn } from "@/lib/csvExport";

const EventoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Tables<"slots"> | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);

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
  const { data: slots, isLoading: slotsLoading, isFetching: slotsFetching, refetch: refetchSlots } = useQuery({
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

  // Fetch slot allocations with bookings for export
  const { data: allocationsForExport } = useQuery({
    queryKey: ["event-allocations-export", id],
    queryFn: async () => {
      if (!id) return [];

      // Get slot allocations
      const { data: slotAllocations, error: allocError } = await supabase
        .from("slot_allocations")
        .select("id, company_name, sector, stand_number, interviewer_name, slot_id");

      if (allocError) throw allocError;

      // Get slots for this event
      const { data: eventSlots, error: slotsError } = await supabase
        .from("slots")
        .select("id, start_time, end_time")
        .eq("event_id", id);

      if (slotsError) throw slotsError;

      const eventSlotIds = eventSlots?.map(s => s.id) || [];
      const relevantAllocations = slotAllocations?.filter(a => eventSlotIds.includes(a.slot_id)) || [];

      if (relevantAllocations.length === 0) return [];

      // Get bookings
      const allocationIds = relevantAllocations.map(a => a.id);
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, status, user_id, slot_allocation_id")
        .in("slot_allocation_id", allocationIds);

      if (bookingsError) throw bookingsError;

      // Get candidate profiles
      const candidateIds = bookings?.map(b => b.user_id) || [];
      let candidates: any[] = [];
      if (candidateIds.length > 0) {
        const { data: candidateData, error: candidatesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", candidateIds);
        if (candidatesError) throw candidatesError;
        candidates = candidateData || [];
      }

      // Combine data
      return relevantAllocations.map(allocation => {
        const slot = eventSlots?.find(s => s.id === allocation.slot_id);
        const booking = bookings?.find(b => b.slot_allocation_id === allocation.id);
        const candidate = booking ? candidates.find(c => c.id === booking.user_id) : null;

        return {
          company_name: allocation.company_name,
          stand_number: allocation.stand_number,
          start_time: slot?.start_time || '',
          end_time: slot?.end_time || '',
          candidate_name: candidate?.full_name || '',
          candidate_email: candidate?.email || '',
          status: booking?.status || 'Disponible',
        };
      });
    },
    enabled: !!id && isAdmin,
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

  // Delete ALL slots mutation (bulk delete)
  const deleteAllSlotsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("delete_event_slots", {
        event_uuid: id,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ["slots", id] });
      queryClient.invalidateQueries({ queryKey: ["event-allocations-export", id] });
      setShowDeleteAllDialog(false);
      toast({
        title: "Agenda eliminada",
        description: `Se eliminaron ${deletedCount} slots y todas sus reservas asociadas.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
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

  // Export CSV for admin
  const handleExportCSV = () => {
    if (!allocationsForExport || allocationsForExport.length === 0) {
      sonnerToast.error('No hay datos para exportar');
      return;
    }

    const formatSlotTime = (timestamp: string) => {
      try {
        return format(new Date(timestamp), 'HH:mm', { locale: es });
      } catch {
        return '--:--';
      }
    };

    type ExportRow = typeof allocationsForExport[number];
    const columns: CSVColumn<ExportRow>[] = [
      { header: 'Empresa', accessor: (row) => row.company_name },
      { header: 'Stand', accessor: (row) => row.stand_number || '' },
      { header: 'Hora', accessor: (row) => formatSlotTime(row.start_time) + ' - ' + formatSlotTime(row.end_time) },
      { header: 'Candidato', accessor: (row) => row.candidate_name },
      { header: 'Email', accessor: (row) => row.candidate_email },
      { header: 'Estado', accessor: (row) => row.status },
    ];

    const csv = generateCSV(allocationsForExport, columns);
    const eventName = event?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'Evento';
    const filename = `Reporte-Global-${eventName}.csv`;
    downloadCSV(csv, filename);
    sonnerToast.success('CSV exportado correctamente');
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
    <div className="space-y-8">
      {/* Hero Section - Full Width Banner (ALWAYS visible) */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
        <div className="relative w-full h-[280px] sm:h-[360px] lg:h-[400px]">
          {/* Background: Image or Professional Blue Gradient Fallback */}
          {event.image_url ? (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${event.image_url})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
          )}
          
          {/* Dark Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Hero Content */}
          <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 lg:p-12">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-white/90 text-primary hover:bg-white border-0 shadow-lg">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  {format(parseISO(event.event_date), "EEEE, d 'de' MMMM", { locale: es })}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {timeRange}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
                  {event.title}
                </h1>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditEventOpen(true)}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white backdrop-blur-sm"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div>
        <GoBackButton />
      </div>

      {/* Description Section */}
      {event.description && (
        <section className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Acerca del Evento
          </h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-base">
            {event.description}
          </p>
        </section>
      )}

      {/* Stats Cards */}
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

      {/* Generate Agenda Section - Admin Only */}
      {isAdmin && (
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
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleGenerateSlots}
                disabled={generateSlotsMutation.isPending}
              >
                {generateSlotsMutation.isPending ? "Generando..." : "Generar Estructura de Agenda"}
              </Button>
              
              {/* Bulk Delete Button - Only show if slots exist */}
              {slots && slots.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={deleteAllSlotsMutation.isPending}
                  className="gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {deleteAllSlotsMutation.isPending ? "Eliminando..." : "Borrar toda la agenda actual"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Slots del Evento</CardTitle>
            <div className="flex items-center gap-2">
              {/* Manual refresh button */}
              <Button
                onClick={() => {
                  console.log('Refreshing slots...');
                  refetchSlots();
                }}
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={slotsFetching}
                title="Actualizar slots"
              >
                <RefreshCw className={`h-4 w-4 ${slotsFetching ? "animate-spin" : ""}`} />
              </Button>
              {isAdmin && (
                <>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={!allocationsForExport || allocationsForExport.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Button
                    onClick={() => setBulkAssignOpen(true)}
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Asignar por Rango
                  </Button>
                </>
              )}
            </div>
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

      {/* Bulk Assign Dialog */}
      <BulkAssignDialog
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        eventId={id!}
        slots={slots ?? []}
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

      {/* Delete All Slots Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ¿Eliminar toda la agenda?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta acción eliminará <strong>{slots?.length || 0} slots</strong> y todas sus 
                reservas y asignaciones de empresas asociadas.
              </p>
              <p className="text-destructive font-medium">
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAllSlotsMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllSlotsMutation.mutate()}
              disabled={deleteAllSlotsMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAllSlotsMutation.isPending ? "Eliminando..." : "Sí, eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Event Dialog */}
      <CreateEventDialog
        open={editEventOpen}
        onOpenChange={setEditEventOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["event", id] });
        }}
        initialData={event}
      />
    </div>
  );
};

export default EventoDetalle;
