import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Building2, Clock } from "lucide-react";

// Dashboard stats data
const stats = [
  {
    title: "Eventos Activos",
    value: "3",
    description: "Ferias en curso",
    icon: Calendar,
    trend: "+1 esta semana",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "Empresas",
    value: "24",
    description: "Participando",
    icon: Building2,
    trend: "+5 nuevas",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    title: "Candidatos",
    value: "156",
    description: "Registrados",
    icon: Users,
    trend: "+28 hoy",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "Entrevistas",
    value: "89",
    description: "Agendadas",
    icon: Clock,
    trend: "78% ocupación",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
];

// Main dashboard page for FeriaMatch app
const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de control de FeriaMatch
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="mt-1 text-xs text-accent font-medium">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Ferias de empleo programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Feria TechJobs 2024", date: "15 Dic", slots: "120 slots" },
                { name: "Expo Empleabilidad", date: "22 Dic", slots: "80 slots" },
                { name: "JobConnect Winter", date: "10 Ene", slots: "150 slots" },
              ].map((event) => (
                <div
                  key={event.name}
                  className="flex items-center justify-between rounded-lg border bg-background p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.slots}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {event.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "Nueva reserva", user: "María García", time: "Hace 5 min" },
                { action: "Empresa registrada", user: "TechCorp S.A.", time: "Hace 15 min" },
                { action: "Slot confirmado", user: "Juan Pérez", time: "Hace 30 min" },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border bg-background p-3"
                >
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
