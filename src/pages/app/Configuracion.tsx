import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Bell, Shield, Palette, Loader2, Phone, Linkedin, FileText, Image } from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { FileUploader } from "@/components/upload/FileUploader";

// Validation schema for profile fields
const profileSchema = z.object({
  full_name: z.string().max(100, "El nombre no puede exceder 100 caracteres"),
  company_name: z.string().max(100, "El nombre de empresa no puede exceder 100 caracteres"),
  phone: z.string().max(20, "El teléfono no puede exceder 20 caracteres").optional().or(z.literal("")),
  linkedin_url: z.string()
    .refine((val) => !val || val.includes("linkedin.com"), {
      message: "Debe ser una URL válida de LinkedIn"
    })
    .optional()
    .or(z.literal("")),
});

// Password validation schema
const passwordSchema = z.object({
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

interface ProfileData {
  full_name: string;
  email: string;
  company_name: string;
  phone: string;
  linkedin_url: string;
  cv_url: string;
  avatar_url: string;
  logo_url: string;
}

const Configuracion = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    linkedin_url: "",
    cv_url: "",
    avatar_url: "",
    logo_url: "",
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      // Fetch profile data (cast to any temporarily until types regenerate)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("No se pudo cargar el perfil");
      } else if (data) {
        const profileData = data as any;
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          company_name: profileData.company_name || "",
          phone: profileData.phone || "",
          linkedin_url: profileData.linkedin_url || "",
          cv_url: profileData.cv_url || "",
          avatar_url: profileData.avatar_url || "",
          logo_url: profileData.logo_url || "",
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate profile data
    const validation = profileSchema.safeParse(profile);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setErrors({});
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone: profile.phone || null,
        linkedin_url: profile.linkedin_url || null,
        cv_url: profile.cv_url || null,
        avatar_url: profile.avatar_url || null,
        logo_url: profile.logo_url || null,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("No se pudo actualizar el perfil");
    } else {
      toast.success("Perfil actualizado correctamente");
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords
    const validation = passwordSchema.safeParse(passwords);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: passwords.newPassword,
    });

    setChangingPassword(false);

    if (error) {
      console.error("Error changing password:", error);
      if (error.message.includes("should be at least")) {
        toast.error("La contraseña es muy corta");
      } else {
        toast.error("No se pudo cambiar la contraseña: " + error.message);
      }
    } else {
      toast.success("Contraseña actualizada correctamente");
      setPasswords({ newPassword: "", confirmPassword: "" });
    }
  };

  const handleFileUpload = async (field: keyof ProfileData, url: string) => {
    if (!user?.id) return;

    // Update local state
    setProfile((prev) => ({ ...prev, [field]: url }));

    // Save to database immediately
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: url || null })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving file URL:", error);
      toast.error("Error al guardar el archivo");
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
                <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
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
          {/* Profile section with avatar */}
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
            <CardContent className="space-y-6">
              {/* Avatar upload */}
              <div className="flex justify-center">
                {user?.id && (
                  <FileUploader
                    userId={user.id}
                    bucket="public-files"
                    folder="avatars"
                    currentUrl={profile.avatar_url}
                    onUploadComplete={(url) => handleFileUpload("avatar_url", url)}
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={5}
                    variant="avatar"
                    label="Foto de perfil"
                  />
                )}
              </div>

              <Separator />

              {/* Basic info */}
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
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name}</p>
                  )}
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
                {errors.company_name && (
                  <p className="text-sm text-destructive">{errors.company_name}</p>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Información de Contacto
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/tu-perfil"
                    value={profile.linkedin_url}
                    onChange={(e) =>
                      setProfile({ ...profile, linkedin_url: e.target.value })
                    }
                  />
                  {errors.linkedin_url && (
                    <p className="text-sm text-destructive">{errors.linkedin_url}</p>
                  )}
                </div>
              </div>

              <Button variant="default" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </CardContent>
          </Card>

          {/* Documents section - Only for candidates */}
          {userRole === "candidate" && (
            <Card className="border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Documentos</CardTitle>
                </div>
                <CardDescription>
                  Sube tu CV para que las empresas puedan conocerte mejor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user?.id && (
                  <FileUploader
                    userId={user.id}
                    bucket="secure-documents"
                    folder="cvs"
                    currentUrl={profile.cv_url}
                    onUploadComplete={(url) => handleFileUpload("cv_url", url)}
                    accept="application/pdf"
                    maxSize={10}
                    variant="document"
                    label="Subir CV (PDF)"
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Company branding - Only for recruiters */}
          {userRole === "recruiter" && (
            <Card className="border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  <CardTitle>Imagen de Empresa</CardTitle>
                </div>
                <CardDescription>
                  Sube el logo de tu empresa para que aparezca en la agenda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  {user?.id && (
                    <FileUploader
                      userId={user.id}
                      bucket="public-files"
                      folder="logos"
                      currentUrl={profile.logo_url}
                      onUploadComplete={(url) => handleFileUpload("logo_url", url)}
                      accept="image/jpeg,image/png,image/webp"
                      maxSize={5}
                      variant="logo"
                      label="Logo de empresa"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, newPassword: e.target.value })
                    }
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirmPassword: e.target.value })
                    }
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={changingPassword || !passwords.newPassword}
              >
                {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
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
