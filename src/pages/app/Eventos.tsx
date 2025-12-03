import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Users, Building2, MoreVertical } from "lucide-react";

// Sample events data
const eventos = [
  {
    id: 1,
    nombre: "Feria TechJobs 2024",
    fecha: "15 Dic 2024",
    horario: "09:00 - 18:00",
    duracionSlot: "30 min",
    empresas: 24,
    candidatos: 156,
    estado: "activo",
  },
  {
    id: 2,
    nombre: "Expo Empleabilidad",
    fecha: "22 Dic 2024",
    horario: "10:00 - 17:00",
    duracionSlot: "20 min",
    empresas: 18,
    candidatos: 89,
    estado: "proximo",
  },
  {
    id: 3,
    nombre: "JobConnect Winter",
    fecha: "10 Ene 2025",
    horario: "09:00 - 16:00",
    duracionSlot: "25 min",
    empresas: 32,
    candidatos: 0,
    estado: "borrador",
  },
];

// Estado badge styling
const estadoBadge = {
  activo: { class: "bg-accent/10 text-accent border-accent/20", label: "Activo" },
  proximo: { class: "bg-primary/10 text-primary border-primary/20", label: "Próximo" },
  borrador: { class: "bg-muted text-muted-foreground border-border", label: "Borrador" },
  finalizado: { class: "bg-secondary text-secondary-foreground border-border", label: "Finalizado" },
};

// Eventos page - Admin view for managing job fair events
const Eventos = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Eventos
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary">
              Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Crea y gestiona las ferias de empleo
          </p>
        </div>
        <Button variant="default" size="default">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      {/* Events grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {eventos.map((evento) => (
          <Card key={evento.id} className="border bg-card transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{evento.nombre}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {evento.fecha}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={estadoBadge[evento.estado as keyof typeof estadoBadge].class}
                  >
                    {estadoBadge[evento.estado as keyof typeof estadoBadge].label}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{evento.horario}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground">{evento.duracionSlot}</span>
                  <span>/ slot</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    <span className="font-semibold text-foreground">{evento.empresas}</span>
                    <span className="text-muted-foreground"> empresas</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="text-sm">
                    <span className="font-semibold text-foreground">{evento.candidatos}</span>
                    <span className="text-muted-foreground"> candidatos</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Configurar
                </Button>
                <Button variant="default" size="sm" className="flex-1">
                  Ver Agenda
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info card */}
      <Card className="border-dashed border-2 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold text-foreground">Gestión Centralizada</h3>
          <p className="max-w-sm text-sm text-muted-foreground mt-1">
            Como Admin, defines el horario global y la duración de slots. 
            Las empresas solo pueden ocupar los slots que tú configures.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Eventos;
