import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Skip check if we're already on the onboarding page
      if (location.pathname === '/onboarding') {
        setIsChecking(false);
        setIsOnboarded(false); // Allow them to stay on onboarding
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          // On RLS error or any error, assume not onboarded and let them go to onboarding
          console.error('Error checking onboarding status:', error);
          setIsOnboarded(false);
        } else if (!data) {
          // No profile exists yet - needs onboarding
          setIsOnboarded(false);
        } else {
          setIsOnboarded(data.is_onboarded ?? false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, don't block - let them try onboarding
        setIsOnboarded(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (!authLoading && user) {
      checkOnboardingStatus();
    } else if (!authLoading) {
      setIsChecking(false);
    }
  }, [user, authLoading, location.pathname]);

  // Show loading while checking auth or onboarding status
  if (authLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando perfil...</p>
        </div>
      </div>
    );
  }

  // If not logged in, let ProtectedRoute handle redirect to auth
  if (!user) {
    return <>{children}</>;
  }

  // Skip onboarding check if already on the onboarding page
  if (location.pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Redirect to onboarding if not completed
  if (isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
