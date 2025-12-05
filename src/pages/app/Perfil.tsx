import { User, Mail, Building2, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Placeholder profile page
const Perfil = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                U
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-foreground">Usuario Demo</h2>
              <p className="text-muted-foreground">usuario@demo.com</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="secondary">Candidato</Badge>
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
                <p className="text-sm text-muted-foreground">usuario@demo.com</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Empresa</p>
                <p className="text-sm text-muted-foreground">No especificada</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Miembro desde</p>
                <p className="text-sm text-muted-foreground">Diciembre 2024</p>
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