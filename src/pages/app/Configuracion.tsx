import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Bell, Shield, Palette, Loader2 } from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  full_name: string;
  email: string;
  company_name: string;
}

const Configuracion = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    company_name: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, company_name")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil",
          variant: "destructive",
        });
      } else if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          company_name: data.company_name || "",
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user?.id, toast]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      });
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "recruiter":
        return "Reclutador";
      case "candidate":
        return "Candidato";
      default:
        return "Usuario";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton variant="dashboard" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton variant="dashboard" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Profile section */}
          <Card className="border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Perfil</CardTitle>
              </div>
              <CardDescription>
                Información básica de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Tu nombre"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizacion">Organización</Label>
                <Input
                  id="organizacion"
                  placeholder="Nombre de tu organización"
                  value={profile.company_name}
                  onChange={(e) =>
                    setProfile({ ...profile, company_name: e.target.value })
                  }
                />
              </div>
              <Button variant="default" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </CardContent>
          </Card>

          {/* Notifications section */}
          <Card className="border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notificaciones</CardTitle>
              </div>
              <CardDescription>
                Configura cómo quieres recibir alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuevas reservas</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones cuando un candidato reserve
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recordatorios</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas antes de tus entrevistas programadas
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resumen diario</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe un email con el resumen de actividad
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security section */}
          <Card className="border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Seguridad</CardTitle>
              </div>
              <CardDescription>
                Opciones de seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña actual</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button variant="outline">Cambiar contraseña</Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card className="border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-accent" />
                <CardTitle className="text-base">Tu Rol</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-primary/5 p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {getRoleLabel(userRole)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.company_name || "Sin organización"}
                </p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {userRole === "admin" &&
                  "Como Admin tienes acceso completo a la gestión de eventos, configuración de slots y visualización de métricas."}
                {userRole === "recruiter" &&
                  "Como Reclutador puedes gestionar tus slots asignados y ver las reservas de candidatos."}
                {userRole === "candidate" &&
                  "Como Candidato puedes explorar eventos y reservar slots disponibles."}
                {!userRole && "Tu rol determina qué funcionalidades puedes usar."}
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Ayuda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <a href="#" className="block text-primary hover:underline">
                Documentación
              </a>
              <a href="#" className="block text-primary hover:underline">
                Preguntas frecuentes
              </a>
              <a href="#" className="block text-primary hover:underline">
                Contactar soporte
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
