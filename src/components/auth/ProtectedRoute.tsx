import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole | AppRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const { isDemoMode } = useDemo();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Demo mode: ONLY allow access to non-role-protected routes
  // Never bypass authentication for admin or role-protected routes
  if (isDemoMode && !requiredRole) {
    return <>{children}</>;
  }

  // For role-protected routes or when not in demo mode, require authentication
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements for authenticated users
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (userRole && !allowedRoles.includes(userRole)) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
