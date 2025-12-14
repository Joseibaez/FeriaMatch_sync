import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Building } from "lucide-react";

interface EditStandDialogProps {
  allocation: {
    id: string;
    company_name: string;
    stand_number: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditStandDialog = ({ allocation, open, onOpenChange }: EditStandDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [standNumber, setStandNumber] = useState("");

  useEffect(() => {
    if (allocation) {
      setStandNumber(allocation.stand_number || "");
    }
  }, [allocation]);

  const updateStandMutation = useMutation({
    mutationFn: async (newStandNumber: string) => {
      if (!allocation) throw new Error("No allocation selected");
      
      const { error } = await supabase
        .from("slot_allocations")
        .update({ stand_number: newStandNumber || null })
        .eq("id", allocation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["event-allocations-export"] });
      toast({
        title: "Stand actualizado",
        description: "El número de stand se ha guardado correctamente.",
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStandMutation.mutate(standNumber.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Asignar Stand
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{allocation?.company_name}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stand_number">Número de Stand</Label>
              <Input
                id="stand_number"
                placeholder="Ej: A1, B2, 15..."
                value={standNumber}
                onChange={(e) => setStandNumber(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para quitar el número de stand
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateStandMutation.isPending}>
              {updateStandMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
