import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading, isOnboarded } = useAuth();
  const location = useLocation();

  // CRITICAL: Always allow onboarding page - no checks needed
  if (location.pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
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
