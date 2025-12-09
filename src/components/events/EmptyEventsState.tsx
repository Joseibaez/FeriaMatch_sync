import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyEventsStateProps {
  onCreateClick: () => void;
}

export function EmptyEventsState({ onCreateClick }: EmptyEventsStateProps) {
  return (
    <Card className="border-dashed border-2 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Calendar className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Sin eventos aún
        </h3>
        <p className="max-w-md text-muted-foreground mb-6">
          Crea tu primera feria de empleo para comenzar a gestionar slots, 
          invitar empresas y conectar candidatos con oportunidades.
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Primer Evento
        </Button>
      </CardContent>
    </Card>
  );
}
