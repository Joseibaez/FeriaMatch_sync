import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette } from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";

// Configuracion page - User settings and preferences
const Configuracion = () => {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <BackButton variant="dashboard" />

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main settings */}
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
                  <Input id="nombre" placeholder="Tu nombre" defaultValue="Usuario Demo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" defaultValue="demo@feriamatch.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizacion">Organización</Label>
                <Input id="organizacion" placeholder="Nombre de tu organización" defaultValue="Cámara de Comercio" />
              </div>
              <Button variant="default">Guardar cambios</Button>
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
                <p className="text-2xl font-bold text-primary">Admin</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cámara de Comercio
                </p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Como Admin tienes acceso completo a la gestión de eventos, 
                configuración de slots y visualización de métricas.
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
