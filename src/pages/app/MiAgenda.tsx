import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";

// Sample agenda data
const agendaItems = [
  {
    id: 1,
    empresa: "TechCorp S.A.",
    hora: "09:00 - 09:30",
    puesto: "Desarrollador Frontend",
    ubicacion: "Stand A-12",
    estado: "confirmado",
  },
  {
    id: 2,
    empresa: "Innovatech",
    hora: "10:00 - 10:30",
    puesto: "UX Designer",
    ubicacion: "Stand B-05",
    estado: "pendiente",
  },
  {
    id: 3,
    empresa: "DataPro",
    hora: "11:30 - 12:00",
    puesto: "Data Analyst",
    ubicacion: "Stand C-08",
    estado: "confirmado",
  },
  {
    id: 4,
    empresa: "CloudSystems",
    hora: "14:00 - 14:30",
    puesto: "DevOps Engineer",
    ubicacion: "Stand A-03",
    estado: "libre",
  },
];

// Estado badge styling
const estadoBadgeVariant = {
  confirmado: "bg-accent/10 text-accent border-accent/20",
  pendiente: "bg-warning/10 text-warning border-warning/20",
  libre: "bg-secondary text-secondary-foreground border-border",
};

const estadoLabel = {
  confirmado: "Confirmado",
  pendiente: "Pendiente",
  libre: "Disponible",
};

// Mi Agenda page - shows user's scheduled interviews
const MiAgenda = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Mi Agenda
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus entrevistas programadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default">
            <Calendar className="mr-2 h-4 w-4" />
            Ver calendario
          </Button>
        </div>
      </div>

      {/* Date selector */}
      <Card className="border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Feria TechJobs 2024</CardTitle>
              <CardDescription>15 de Diciembre, 2024</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              3 entrevistas
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Agenda items */}
      <div className="space-y-3">
        {agendaItems.map((item) => (
          <Card key={item.id} className="border bg-card transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Time and company info */}
                <div className="flex items-start gap-4">
                  {/* Time block */}
                  <div className="flex h-14 w-20 flex-col items-center justify-center rounded-lg bg-primary/5 text-center">
                    <Clock className="mb-1 h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {item.hora.split(" - ")[0]}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{item.empresa}</h3>
                    <p className="text-sm text-muted-foreground">{item.puesto}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.ubicacion}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        30 min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and actions */}
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={estadoBadgeVariant[item.estado as keyof typeof estadoBadgeVariant]}
                  >
                    {estadoLabel[item.estado as keyof typeof estadoLabel]}
                  </Badge>
                  {item.estado === "libre" ? (
                    <Button variant="action" size="sm">
                      Reservar
                    </Button>
                  ) : item.estado === "pendiente" ? (
                    <Button variant="outline" size="sm">
                      Confirmar
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm">
                      Ver detalles
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state hint */}
      <p className="text-center text-sm text-muted-foreground">
        Mostrando 4 slots para el evento seleccionado
      </p>
    </div>
  );
};

export default MiAgenda;
