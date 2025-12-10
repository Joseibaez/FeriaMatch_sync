import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Building, Plus, Trash2, User, MapPin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

// Validation schema for adding a company allocation
const addAllocationSchema = z.object({
  company_name: z.string().min(1, "El nombre de la empresa es requerido"),
  sector: z.string().optional(),
  interviewer_name: z.string().optional(),
  stand_number: z.string().optional(),
});

type AddAllocationFormValues = z.infer<typeof addAllocationSchema>;

interface EditSlotDialogProps {
  slot: Tables<"slots"> | null;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSlotDialog({ slot, eventId, open, onOpenChange }: EditSlotDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  const form = useForm<AddAllocationFormValues>({
    resolver: zodResolver(addAllocationSchema),
    defaultValues: {
      company_name: "",
      sector: "",
      interviewer_name: "",
      stand_number: "",
    },
  });

  // Fetch allocations for this slot
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ["slot-allocations", slot?.id],
    queryFn: async () => {
      if (!slot) return [];
      const { data, error } = await supabase
        .from("slot_allocations")
        .select("*")
        .eq("slot_id", slot.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!slot && open,
  });

  // Add allocation mutation
  const addAllocationMutation = useMutation({
    mutationFn: async (values: AddAllocationFormValues) => {
      if (!slot) throw new Error("No slot selected");

      const { error } = await supabase
        .from("slot_allocations")
        .insert({
          slot_id: slot.id,
          company_name: values.company_name,
          sector: values.sector || null,
          interviewer_name: values.interviewer_name || null,
          stand_number: values.stand_number || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-allocations", slot?.id] });
      toast({
        title: "Empresa agregada",
        description: "La empresa ha sido asignada al slot correctamente.",
      });
      form.reset();
      setIsAddingCompany(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete allocation mutation
  const deleteAllocationMutation = useMutation({
    mutationFn: async (allocationId: string) => {
      const { error } = await supabase
        .from("slot_allocations")
        .delete()
        .eq("id", allocationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slot-allocations", slot?.id] });
      toast({
        title: "Empresa eliminada",
        description: "La empresa ha sido removida del slot.",
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

  const onSubmit = (values: AddAllocationFormValues) => {
    addAllocationMutation.mutate(values);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setIsAddingCompany(false);
      form.reset();
    }
    onOpenChange(isOpen);
  };

  if (!slot) return null;

  const startDate = new Date(slot.start_time);
  const endDate = new Date(slot.end_time);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Gestionar Slot
          </DialogTitle>
        </DialogHeader>

        {/* Time information - Read only */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Horario del Slot</h4>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-base font-semibold px-3 py-1">
              {format(startDate, "HH:mm")}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="text-base font-semibold px-3 py-1">
              {format(endDate, "HH:mm")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {format(startDate, "EEEE, d 'de' MMMM 'de' yyyy")}
          </p>
        </div>

        <Separator />

        {/* Companies Management Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Empresas Asignadas
            </h4>
            {!isAddingCompany && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingCompany(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            )}
          </div>

          {/* Add Company Form */}
          {isAddingCompany && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-lg border p-4 bg-accent/30">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: TechCorp S.A." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Tecnología" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interviewer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Entrevistador</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stand_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Stand</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: A-15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingCompany(false);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addAllocationMutation.isPending}
                  >
                    {addAllocationMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Allocated Companies List */}
          {allocationsLoading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Cargando empresas...
            </div>
          ) : allocations && allocations.length > 0 ? (
            <div className="space-y-2">
              {allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="flex items-start justify-between rounded-lg border p-3 bg-card"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{allocation.company_name}</p>
                    <div className="flex flex-wrap gap-2">
                      {allocation.sector && (
                        <Badge variant="secondary" className="text-xs">
                          {allocation.sector}
                        </Badge>
                      )}
                      {allocation.interviewer_name && (
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {allocation.interviewer_name}
                        </Badge>
                      )}
                      {allocation.stand_number && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          <MapPin className="h-3 w-3 mr-1" />
                          Stand {allocation.stand_number}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteAllocationMutation.mutate(allocation.id)}
                    disabled={deleteAllocationMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay empresas asignadas a este slot.</p>
              <p className="text-xs mt-1">
                Haz clic en "Agregar" para asignar una empresa.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
