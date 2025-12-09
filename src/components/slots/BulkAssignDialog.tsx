import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
import { Building2, Clock, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  slots: Tables<"slots">[];
}

export const BulkAssignDialog = ({
  open,
  onOpenChange,
  eventId,
  slots,
}: BulkAssignDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Get unique time options from existing slots
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

  // Filter matching slots based on selected time range
  const matchingSlots = useMemo(() => {
    if (!startTime || !endTime || !slots) return [];

    return slots.filter((slot) => {
      const slotStart = format(parseISO(slot.start_time), "HH:mm");
      const slotEnd = format(parseISO(slot.end_time), "HH:mm");

      // Slot must start at or after the selected start time
      // AND slot must end at or before the selected end time
      return slotStart >= startTime && slotEnd <= endTime;
    });
  }, [slots, startTime, endTime]);

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      if (matchingSlots.length === 0) {
        throw new Error("No hay slots que coincidan con el rango seleccionado");
      }

      if (!companyName.trim()) {
        throw new Error("El nombre de la empresa es requerido");
      }

      // Create allocations for all matching slots
      const allocations = matchingSlots.map((slot) => ({
        slot_id: slot.id,
        company_name: companyName.trim(),
        sector: sector.trim() || null,
        interviewer_name: interviewerName.trim() || null,
      }));

      const { error } = await supabase.from("slot_allocations").insert(allocations);

      if (error) throw error;

      return matchingSlots.length;
    },
    onSuccess: (count) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["slots", eventId] });
      queryClient.invalidateQueries({ queryKey: ["slot_allocations"] });

      toast({
        title: "Asignación exitosa",
        description: `Empresa asignada a ${count} slots.`,
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCompanyName("");
    setSector("");
    setInterviewerName("");
    setStartTime("");
    setEndTime("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkAssignMutation.mutate();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar Empresa por Rango
          </DialogTitle>
          <DialogDescription>
            Asigna una empresa a múltiples slots de tiempo simultáneamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Datos de la Empresa
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Nombre de la Empresa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Tech Solutions S.A."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Ej: Tecnología"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interviewer">Entrevistador</Label>
                  <Input
                    id="interviewer"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="Ej: María García"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Time Range Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Rango de Horario
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora Inicio</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="startTime">
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
                <Label htmlFor="endTime">Hora Fin</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="endTime">
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

            {/* Preview of matching slots */}
            {startTime && endTime && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                {matchingSlots.length > 0 ? (
                  <p className="text-foreground">
                    <span className="font-semibold text-primary">
                      {matchingSlots.length}
                    </span>{" "}
                    slots serán asignados ({startTime} - {endTime})
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    No hay slots en el rango seleccionado
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
                bulkAssignMutation.isPending ||
                !companyName.trim() ||
                !startTime ||
                !endTime ||
                matchingSlots.length === 0
              }
            >
              {bulkAssignMutation.isPending
                ? "Asignando..."
                : `Asignar a ${matchingSlots.length} Slots`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
