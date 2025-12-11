import { User, Mail, Building2, Calendar, Shield, Clock, Trash2, Briefcase, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/navigation/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { getStringColor, getContrastTextColor } from "@/lib/colorUtils";

// Profile page with real user data from Supabase
const Perfil = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch profile data from profiles table
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user's bookings with related data
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get bookings for the user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) return [];

      // Get slot allocations for these bookings
      const allocationIds = bookingsData.map((b) => b.slot_allocation_id);
      const { data: allocationsData, error: allocationsError } = await supabase
        .from("slot_allocations")
        .select("*")
        .in("id", allocationIds);

      if (allocationsError) throw allocationsError;

      // Get slots for these allocations
      const slotIds = allocationsData?.map((a) => a.slot_id) || [];
      const { data: slotsData, error: slotsError } = await supabase
        .from("slots")
        .select("*")
        .in("id", slotIds);

      if (slotsError) throw slotsError;

      // Get events for these slots
      const eventIds = [...new Set(slotsData?.map((s) => s.event_id) || [])];
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds);

      if (eventsError) throw eventsError;

      // Combine all data
      return bookingsData.map((booking) => {
        const allocation = allocationsData?.find((a) => a.id === booking.slot_allocation_id);
        const slot = slotsData?.find((s) => s.id === allocation?.slot_id);
        const event = eventsData?.find((e) => e.id === slot?.event_id);
        
        return {
          ...booking,
          allocation,
          slot,
          event,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Mutation for canceling a booking
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva cancelada");
      queryClient.invalidateQueries({ queryKey: ["my-bookings", user?.id] });
    },
    onError: () => {
      toast.error("Error al cancelar la reserva");
    },
  });

  // Get initials for avatar
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  // Get role display label in Spanish
  const getRoleLabel = () => {
    switch (userRole) {
      case "admin":
        return "Administrador";
      case "recruiter":
        return "Reclutador";
      case "candidate":
        return "Candidato";
      default:
        return "Usuario";
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = () => {
    switch (userRole) {
      case "admin":
        return "destructive";
      case "recruiter":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackButton variant="dashboard" />
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <BackButton variant="dashboard" />

      {/* Profile header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-foreground">
                {profile?.full_name || "Sin nombre"}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant={getRoleBadgeVariant()}>
                  <Shield className="mr-1 h-3 w-3" />
                  {getRoleLabel()}
                </Badge>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="touch-target"
              onClick={() => navigate("/app/configuracion")}
            >
              Editar perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for profile sections */}
      <Tabs defaultValue={userRole === "candidate" ? "entrevistas" : "info"} className="space-y-4">
        <TabsList>
          {userRole === "candidate" && (
            <TabsTrigger value="entrevistas" className="gap-2">
              <Calendar className="h-4 w-4" />
              Mis Entrevistas
              {bookings && bookings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {bookings.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" />
            Información
          </TabsTrigger>
        </TabsList>

        {/* My Interviews Tab - Only for candidates */}
        {userRole === "candidate" && (
          <TabsContent value="entrevistas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Mis Entrevistas
                </CardTitle>
                <CardDescription>
                  Tus reservas de entrevistas activas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.map((booking) => {
                      const bgColor = booking.allocation 
                        ? getStringColor(booking.allocation.company_name) 
                        : undefined;
                      const textColor = getContrastTextColor();
                      const isCanceling = cancelMutation.isPending && cancelMutation.variables === booking.id;

                      return (
                        <div
                          key={booking.id}
                          className="rounded-lg border p-4 transition-colors hover:bg-accent/30"
                          style={bgColor ? { backgroundColor: bgColor } : undefined}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              {/* Event name */}
                              <p className="text-sm text-muted-foreground" style={bgColor ? { color: textColor, opacity: 0.8 } : undefined}>
                                {booking.event?.title || "Evento"}
                              </p>
                              
                              {/* Company name */}
                              <h4 className="font-semibold" style={bgColor ? { color: textColor } : undefined}>
                                {booking.allocation?.company_name || "Empresa"}
                              </h4>

                              {/* Time range */}
                              <div className="flex items-center gap-2 text-sm" style={bgColor ? { color: textColor, opacity: 0.9 } : undefined}>
                                <Clock className="h-3.5 w-3.5" />
                                {booking.slot ? (
                                  <>
                                    {format(new Date(booking.slot.start_time), "HH:mm")} - {format(new Date(booking.slot.end_time), "HH:mm")}
                                    <span className="text-muted-foreground" style={bgColor ? { color: textColor, opacity: 0.7 } : undefined}>
                                      • {format(new Date(booking.slot.start_time), "d MMM yyyy", { locale: es })}
                                    </span>
                                  </>
                                ) : (
                                  "Horario no disponible"
                                )}
                              </div>

                              {/* Sector */}
                              {booking.allocation?.sector && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs mt-1 bg-background/60"
                                  style={bgColor ? { color: textColor } : undefined}
                                >
                                  <Briefcase className="mr-1 h-3 w-3" />
                                  {booking.allocation.sector}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                {booking.status === "confirmed" ? "Confirmada" : booking.status}
                              </Badge>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-1"
                                onClick={() => cancelMutation.mutate(booking.id)}
                                disabled={isCanceling}
                              >
                                {isCanceling ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No tienes entrevistas programadas
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reserva un espacio en la agenda de un evento
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Tus datos básicos de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Empresa</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.company_name || "No especificada"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Miembro desde</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.created_at
                        ? format(new Date(profile.created_at), "MMMM yyyy", { locale: es })
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Tu actividad en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Sin actividad reciente
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tu actividad aparecerá aquí
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Perfil;
