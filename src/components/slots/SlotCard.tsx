import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, User, Pencil, Trash2, Briefcase } from "lucide-react";
import { getStringColor, getContrastTextColor } from "@/lib/colorUtils";
import type { Tables } from "@/integrations/supabase/types";

interface SlotCardProps {
  slot: Tables<"slots">;
  isAdmin: boolean;
  onEdit: (slot: Tables<"slots">) => void;
  onDelete: (slotId: string) => void;
  isDeleting: boolean;
}

export const SlotCard = ({ slot, isAdmin, onEdit, onDelete, isDeleting }: SlotCardProps) => {
  const slotStart = new Date(slot.start_time);
  const slotEnd = new Date(slot.end_time);
  const isFree = !slot.candidate_id;

  // Fetch allocations for this slot
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ["slot-allocations", slot.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slot_allocations")
        .select("*")
        .eq("slot_id", slot.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const hasAllocations = allocations && allocations.length > 0;

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        hasAllocations
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:bg-accent/50"
      }`}
    >
      {/* Header: Time range and actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">
            {format(slotStart, "HH:mm")} - {format(slotEnd, "HH:mm")}
          </p>
          {isFree ? (
            <Badge variant="secondary" className="text-xs">
              Libre
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs">
              <User className="mr-1 h-3 w-3" />
              Reservado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(slot)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(slot.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Allocations list */}
      <div className="space-y-2">
        {allocationsLoading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : hasAllocations ? (
          <div className="space-y-1.5">
            {allocations.map((allocation, index) => {
              // Generate deterministic pastel color from company name
              const bgColor = getStringColor(allocation.company_name);
              const textColor = getContrastTextColor();
              
              return (
                <div
                  key={allocation.id}
                  className={`rounded-md p-2 transition-colors ${
                    index < allocations.length - 1 ? "border-b border-border/30" : ""
                  }`}
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Company name */}
                  <div className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" style={{ color: textColor }} />
                    <span 
                      className="font-medium text-sm"
                      style={{ color: textColor }}
                    >
                      {allocation.company_name}
                    </span>
                  </div>

                  {/* Sector and Interviewer */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {allocation.sector && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-normal bg-background/60 border-border/40"
                        style={{ color: textColor }}
                      >
                        <Briefcase className="mr-1 h-3 w-3" />
                        {allocation.sector}
                      </Badge>
                    )}
                    {allocation.interviewer_name && (
                      <span 
                        className="flex items-center gap-1 text-xs opacity-80"
                        style={{ color: textColor }}
                      >
                        <User className="h-3 w-3" />
                        {allocation.interviewer_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Disponible — sin empresas asignadas
          </p>
        )}
      </div>

      {/* Allocation count badge */}
      {hasAllocations && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {allocations.length} empresa{allocations.length > 1 ? "s" : ""} asignada{allocations.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
};
