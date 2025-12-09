import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import type { Tables } from "@/integrations/supabase/types";

// Validation schema for slot editing
const editSlotSchema = z.object({
  start_time: z.string().min(1, "La hora de inicio es requerida"),
  end_time: z.string().min(1, "La hora de fin es requerida"),
}).refine((data) => {
  return data.start_time < data.end_time;
}, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["end_time"],
});

type EditSlotFormValues = z.infer<typeof editSlotSchema>;

interface EditSlotDialogProps {
  slot: Tables<"slots"> | null;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSlotDialog({ slot, eventId, open, onOpenChange }: EditSlotDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditSlotFormValues>({
    resolver: zodResolver(editSlotSchema),
    defaultValues: {
      start_time: "",
      end_time: "",
    },
  });

  // Update form values when slot changes
  useEffect(() => {
    if (slot) {
      const startDate = new Date(slot.start_time);
      const endDate = new Date(slot.end_time);
      form.reset({
        start_time: format(startDate, "HH:mm"),
        end_time: format(endDate, "HH:mm"),
      });
    }
  }, [slot, form]);

  // Mutation to update the slot
  const updateSlotMutation = useMutation({
    mutationFn: async (values: EditSlotFormValues) => {
      if (!slot) throw new Error("No slot selected");

      // Get the date from the existing slot to maintain consistency
      const originalDate = new Date(slot.start_time);
      const dateStr = format(originalDate, "yyyy-MM-dd");

      // Build new timestamps with the updated times
      const newStartTime = new Date(`${dateStr}T${values.start_time}:00`);
      const newEndTime = new Date(`${dateStr}T${values.end_time}:00`);

      const { error } = await supabase
        .from("slots")
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
        })
        .eq("id", slot.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", eventId] });
      toast({
        title: "Slot actualizado",
        description: "El slot ha sido actualizado correctamente.",
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

  const onSubmit = (values: EditSlotFormValues) => {
    updateSlotMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Slot</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Inicio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateSlotMutation.isPending}>
                {updateSlotMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
