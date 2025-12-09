import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Building2, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// Main dashboard page for FeriaMatch app
const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch real events from Supabase
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          slots(count)
        `)
        .order("event_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  // Fetch stats from Supabase
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [eventsResult, profilesResult, slotsResult] = await Promise.all([
        supabase.from("events").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("slots").select("id, candidate_id", { count: "exact" }),
      ]);

      const totalSlots = slotsResult.count || 0;
      const bookedSlots = slotsResult.data?.filter(s => s.candidate_id !== null).length || 0;
      
      return {
        events: eventsResult.count || 0,
        candidates: profilesResult.count || 0,
        slots: totalSlots,
        bookedSlots,
      };
    },
  });

  // Build stats cards with real data
  const statsCards = [
    {
      title: "Eventos Activos",
      value: stats?.events?.toString() || "0",
      description: "Ferias registradas",
      icon: Calendar,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Empresas",
      value: "-",
      description: "Participando",
      icon: Building2,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      title: "Candidatos",
      value: stats?.candidates?.toString() || "0",
      description: "Registrados",
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Entrevistas",
      value: stats?.bookedSlots?.toString() || "0",
      description: `de ${stats?.slots || 0} slots`,
      icon: Clock,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
    },
  ];

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
        {statsCards.map((stat) => (
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
              {eventsLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border bg-background p-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))
              ) : events && events.length > 0 ? (
                // Real events from database
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border bg-background p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.slots?.[0]?.count || 0} slots
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {format(new Date(event.event_date), "d MMM", { locale: es })}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => navigate(`/app/agenda/${event.id}`)}
                      >
                        Ver Agenda
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                // Empty state
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No hay eventos programados
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Sin actividad reciente
              </p>
              <p className="text-sm text-muted-foreground">
                La actividad aparecerá aquí
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
