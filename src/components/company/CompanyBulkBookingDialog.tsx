import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, User, Briefcase, CalendarRange } from "lucide-react";

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  event_id: string;
}

interface CompanyBulkBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: Slot[];
  companyName: string;
  defaultSector?: string | null;
  existingAllocations?: string[];
}

export function CompanyBulkBookingDialog({
  open,
  onOpenChange,
  slots,
  companyName,
  defaultSector,
  existingAllocations = [],
}: CompanyBulkBookingDialogProps) {
  const queryClient = useQueryClient();
  const [interviewerName, setInterviewerName] = useState("");
  const [sector, setSector] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Pre-fill sector when dialog opens
  useEffect(() => {
    if (open && defaultSector) {
      setSector(defaultSector);
    }
  }, [open, defaultSector]);

  // Get unique time options from slots
  const timeOptions = useMemo(() => {
    if (!slots || slots.length === 0) return [];

    const times = new Set<string>();
    slots.forEach((slot) => {
      const start = format(parseISO(slot.start_time), "HH:mm");
      const end = format(parseISO(slot.end_time), "HH:mm");
      times.add(start);
      times.add(end);
    });

    return Array.from(times).sort();
  }, [slots]);

  // Filter available slots (not already booked by this company)
  const availableSlots = useMemo(() => {
    return slots.filter((slot) => !existingAllocations.includes(slot.id));
  }, [slots, existingAllocations]);

  // Filter matching slots based on time range
  const matchingSlots = useMemo(() => {
    if (!startTime || !endTime) return [];

    return availableSlots.filter((slot) => {
      const slotStart = format(parseISO(slot.start_time), "HH:mm");
      const slotEnd = format(parseISO(slot.end_time), "HH:mm");
      return slotStart >= startTime && slotEnd <= endTime;
    });
  }, [availableSlots, startTime, endTime]);

  const bulkBookMutation = useMutation({
    mutationFn: async () => {
      if (matchingSlots.length === 0) {
        throw new Error("No hay slots disponibles en el rango seleccionado");
      }
      if (!interviewerName.trim()) {
        throw new Error("El nombre del entrevistador es requerido");
      }

      const allocations = matchingSlots.map((slot) => ({
        slot_id: slot.id,
        company_name: companyName,
        interviewer_name: interviewerName.trim(),
        sector: sector.trim() || null,
      }));

      const { error } = await supabase.from("slot_allocations").insert(allocations);
      if (error) throw error;

      return matchingSlots.length;
    },
    onSuccess: (count) => {
      toast.success(`Te has inscrito correctamente a ${count} slots`);
      queryClient.invalidateQueries({ queryKey: ["my-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["company-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["event-slots"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const resetForm = () => {
    setInterviewerName("");
    setSector(defaultSector || "");
    setStartTime("");
    setEndTime("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkBookMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Inscripción por Rango
          </DialogTitle>
          <DialogDescription>
            Inscríbete a múltiples slots de tiempo simultáneamente.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 p-3 mb-2">
          <p className="text-sm text-muted-foreground">
            Empresa: <span className="font-medium text-foreground">{companyName}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Slots disponibles: {availableSlots.length} de {slots.length}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-interviewer" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Nombre del Entrevistador <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bulk-interviewer"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="Ej: María García"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-sector" className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5" />
                Sector
              </Label>
              <Input
                id="bulk-sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ej: Tecnología"
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Rango de Horario
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bulk-startTime">Hora Inicio</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="bulk-startTime">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-endTime">Hora Fin</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="bulk-endTime">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions
                      .filter((time) => !startTime || time > startTime)
                      .map((time) => (
                        <SelectItem key={`end-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            {startTime && endTime && (
              <div className="rounded-md bg-primary/10 border border-primary/20 p-3 text-sm">
                {matchingSlots.length > 0 ? (
                  <p className="text-foreground">
                    <span className="font-semibold text-primary">
                      {matchingSlots.length}
                    </span>{" "}
                    slots serán reservados ({startTime} - {endTime})
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    No hay slots disponibles en el rango seleccionado
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                bulkBookMutation.isPending ||
                !interviewerName.trim() ||
                !startTime ||
                !endTime ||
                matchingSlots.length === 0
              }
            >
              {bulkBookMutation.isPending
                ? "Inscribiendo..."
                : `Inscribirse a ${matchingSlots.length} Slots`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
