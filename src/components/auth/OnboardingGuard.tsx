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

  // CRITICAL: Immediately allow onboarding route - no checks needed
  const isOnOnboardingPage = location.pathname === '/onboarding';

  useEffect(() => {
    // Skip ALL checks if on onboarding page
    if (isOnOnboardingPage) {
      setIsChecking(false);
      return;
    }

    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setIsOnboarded(false);
        } else if (!data) {
          setIsOnboarded(false);
        } else {
          setIsOnboarded(data.is_onboarded ?? false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
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
  }, [user, authLoading, isOnOnboardingPage]);

  // FIRST CHECK: If on onboarding page, render immediately
  if (isOnOnboardingPage) {
    return <>{children}</>;
  }

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

  // Redirect to onboarding if not completed
  if (isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
