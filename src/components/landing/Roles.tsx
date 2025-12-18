import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Building2, User, CheckCircle2 } from "lucide-react";

// Roles section explaining the three user types
const roles = [
  {
    icon: Crown,
    title: "Admin",
    subtitle: "Cámara de Comercio",
    badge: "Time Lord",
    badgeVariant: "default" as const,
    description: "Control total sobre la estructura temporal del evento.",
    capabilities: [
      "Crear y configurar eventos",
      "Definir horario global de la feria",
      "Establecer duración de los slots",
      "Asignar empresas participantes",
    ],
    iconBg: "bg-primary",
  },
  {
    icon: Building2,
    title: "Empresa",
    subtitle: "Reclutador",
    badge: "Participante",
    badgeVariant: "secondary" as const,
    description: "Gestiona tus slots y valida la asistencia de candidatos.",
    capabilities: [
      "Ver slots pre-asignados",
      "Gestionar ocupación de agenda",
      "Validar asistencia (check-in)",
      "Acceder a CVs de candidatos",
    ],
    iconBg: "bg-accent",
  },
  {
    icon: User,
    title: "Candidato",
    subtitle: "Buscador de empleo",
    badge: "Visitante",
    badgeVariant: "outline" as const,
    description: "Explora empresas y reserva tu espacio para entrevistas.",
    capabilities: [
      "Explorar empresas participantes",
      "Ver disponibilidad en tiempo real",
      "Reservar slots libres",
      "Subir y gestionar CV",
    ],
    iconBg: "bg-primary",
  },
];

const Roles = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Tres roles, un objetivo
          </h2>
          <p className="text-lg text-muted-foreground">
            Cada participante tiene herramientas específicas para su función en la feria.
          </p>
        </div>

        {/* Roles grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role, index) => (
            <Card 
              key={role.title} 
              className="relative overflow-hidden border bg-card transition-all hover:shadow-lg"
            >
              {/* Colored top bar */}
              <div className={`h-1 ${role.iconBg}`} />
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${role.iconBg}`}>
                    <role.icon className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <Badge variant={role.badgeVariant}>{role.badge}</Badge>
                </div>
                <CardTitle className="mt-4">
                  <span className="text-xl font-bold">{role.title}</span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    {role.subtitle}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {role.description}
                </p>
                <ul className="space-y-2">
                  {role.capabilities.map((capability) => (
                    <li key={capability} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roles;
