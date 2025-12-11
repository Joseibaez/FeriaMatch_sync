import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const candidateSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  phone: z.string().min(9, 'Teléfono inválido').max(20),
  linkedinUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

const companySchema = z.object({
  companyName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  sector: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

type RoleType = 'candidate' | 'recruiter' | null;

export default function Onboarding() {
  const { user, userRole, refreshOnboardingStatus } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Candidate form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Company form state
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [website, setWebsite] = useState('');

  // Redirect admins using useEffect to avoid render-loop
  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/app/eventos', { replace: true });
    }
  }, [userRole, navigate]);

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setStep(2);
    setErrors({});
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole(null);
    setErrors({});
  };

  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'admin':
        return '/app/eventos';
      case 'recruiter':
        return '/app/dashboard';
      case 'candidate':
      default:
        return '/app/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      if (selectedRole === 'candidate') {
        const result = candidateSchema.safeParse({ firstName, lastName, phone, linkedinUrl });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = companySchema.safeParse({ companyName, sector, website });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }
      }

      // Update profile - use upsert to handle case where profile might not exist
      const profileData = selectedRole === 'candidate'
        ? {
            id: user.id,
            email: user.email || '',
            full_name: `${firstName} ${lastName}`,
            phone,
            linkedin_url: linkedinUrl || null,
            is_onboarded: true,
          }
        : {
            id: user.id,
            email: user.email || '',
            company_name: companyName,
            phone: sector,
            website: website || null,
            is_onboarded: true,
          };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) throw profileError;

      // Note: Role is already set during signup by the handle_new_user trigger
      // No client-side role update needed - this prevents privilege escalation attacks

      toast.success('¡Perfil completado correctamente!');
      
      // Refresh onboarding status in AuthContext
      await refreshOnboardingStatus();
      
      // Redirect based on role
      const redirectPath = getRedirectPath(selectedRole);
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error('Error al guardar el perfil. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Don't render if admin (will redirect)
  if (userRole === 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido a FeriaMatch!
          </h1>
          <p className="text-muted-foreground">
            {step === 1 
              ? 'Cuéntanos quién eres para personalizar tu experiencia'
              : 'Completa tu perfil para continuar'
            }
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
              onClick={() => handleRoleSelect('candidate')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Soy Candidato</CardTitle>
                <CardDescription>
                  Busco oportunidades laborales y quiero conectar con empresas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Explora empresas participantes</li>
                  <li>✓ Reserva entrevistas</li>
                  <li>✓ Gestiona tu agenda</li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
              onClick={() => handleRoleSelect('recruiter')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 rounded-full bg-secondary/50 group-hover:bg-secondary transition-colors">
                  <Building2 className="h-10 w-10 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">Soy Empresa</CardTitle>
                <CardDescription>
                  Represento a una empresa y busco talento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Gestiona tus slots de entrevista</li>
                  <li>✓ Revisa candidatos agendados</li>
                  <li>✓ Administra tu equipo</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Data Collection Form */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>
                    {selectedRole === 'candidate' ? 'Datos de Candidato' : 'Datos de Empresa'}
                  </CardTitle>
                  <CardDescription>
                    Completa la información requerida
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedRole === 'candidate' ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombre *</Label>
                        <Input
                          id="firstName"
                          placeholder="Juan"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                        {errors.firstName && (
                          <p className="text-sm text-destructive">{errors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellidos *</Label>
                        <Input
                          id="lastName"
                          placeholder="García López"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                        {errors.lastName && (
                          <p className="text-sm text-destructive">{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+34 600 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn (opcional)</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/tu-perfil"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                      {errors.linkedinUrl && (
                        <p className="text-sm text-destructive">{errors.linkedinUrl}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                      <Input
                        id="companyName"
                        placeholder="Acme Corporation"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                      {errors.companyName && (
                        <p className="text-sm text-destructive">{errors.companyName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector *</Label>
                      <Input
                        id="sector"
                        placeholder="Tecnología, Finanzas, Salud..."
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        required
                      />
                      {errors.sector && (
                        <p className="text-sm text-destructive">{errors.sector}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Sitio Web (opcional)</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://www.tuempresa.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                      {errors.website && (
                        <p className="text-sm text-destructive">{errors.website}</p>
                      )}
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Completar Registro'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
