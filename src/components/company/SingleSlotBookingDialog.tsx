import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { Clock, User, Briefcase } from "lucide-react";

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
}

interface SingleSlotBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: Slot | null;
  companyName: string;
  defaultSector?: string | null;
}

export function SingleSlotBookingDialog({
  open,
  onOpenChange,
  slot,
  companyName,
  defaultSector,
}: SingleSlotBookingDialogProps) {
  const queryClient = useQueryClient();
  const [interviewerName, setInterviewerName] = useState("");
  const [sector, setSector] = useState("");

  // Pre-fill sector when dialog opens
  useEffect(() => {
    if (open && defaultSector) {
      setSector(defaultSector);
    }
  }, [open, defaultSector]);

  const bookSlotMutation = useMutation({
    mutationFn: async () => {
      if (!slot || !companyName) throw new Error("Datos incompletos");
      if (!interviewerName.trim()) throw new Error("El nombre del entrevistador es requerido");

      const { error } = await supabase.from("slot_allocations").insert({
        slot_id: slot.id,
        company_name: companyName,
        interviewer_name: interviewerName.trim(),
        sector: sector.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Te has apuntado al slot correctamente");
      queryClient.invalidateQueries({ queryKey: ["my-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["company-allocations"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Error al inscribirse: ${error.message}`);
    },
  });

  const resetForm = () => {
    setInterviewerName("");
    setSector(defaultSector || "");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookSlotMutation.mutate();
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "HH:mm", { locale: es });
    } catch {
      return "--:--";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Inscribirse al Slot
          </DialogTitle>
          <DialogDescription>
            Completa los datos para inscribirte en este horario.
          </DialogDescription>
        </DialogHeader>

        {slot && (
          <div className="rounded-lg bg-muted/50 p-3 mb-2">
            <p className="text-sm font-medium text-foreground">
              Horario: {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Empresa: {companyName}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interviewer" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Nombre del Entrevistador <span className="text-destructive">*</span>
            </Label>
            <Input
              id="interviewer"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="Ej: María García"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector" className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              Sector
            </Label>
            <Input
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Ej: Tecnología"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={bookSlotMutation.isPending || !interviewerName.trim()}
            >
              {bookSlotMutation.isPending ? "Inscribiendo..." : "Confirmar Inscripción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
