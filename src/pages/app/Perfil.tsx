import { User, Mail, Building2, Calendar, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/navigation/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Profile page with real user data from Supabase
const Perfil = () => {
  const { user, userRole } = useAuth();

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

            <Button variant="outline" className="touch-target">
              Editar perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile details */}
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
    </div>
  );
};

export default Perfil;
