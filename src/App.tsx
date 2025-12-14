import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth & Context
import { AuthProvider } from "./contexts/AuthContext";
import { DemoProvider } from "./contexts/DemoContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { OnboardingGuard } from "./components/auth/OnboardingGuard";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// App layout and pages
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import MiAgenda from "./pages/app/MiAgenda";
import Eventos from "./pages/app/Eventos";
import EventoDetalle from "./pages/app/EventoDetalle";
import EventoAgenda from "./pages/app/EventoAgenda";
import EventFinder from "./pages/app/EventFinder";
import Perfil from "./pages/app/Perfil";
import Configuracion from "./pages/app/Configuracion";
import CompanyDashboard from "./pages/app/CompanyDashboard";
import AdminDashboard from "./pages/app/AdminDashboard";
import AdminUsers from "./pages/app/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Onboarding route - protected but no onboarding check */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            {/* Protected app routes with sidebar layout and onboarding guard */}
            <Route path="/app" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <AppLayout />
                </OnboardingGuard>
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="agenda/:eventId" element={<EventoAgenda />} />
              {/* Redirect /app/agenda to /app/empresa for recruiters - MiAgenda removed from nav */}
              <Route path="agenda" element={<Navigate to="/app/empresa" replace />} />
              <Route path="explorar" element={<EventFinder />} />
              <Route path="evento/:id" element={<EventoDetalle />} />
              
              {/* Admin routes */}
              <Route path="admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="usuarios" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="eventos" element={
                <ProtectedRoute requiredRole="admin">
                  <Eventos />
                </ProtectedRoute>
              } />
              <Route path="eventos/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <EventoDetalle />
                </ProtectedRoute>
              } />
              
              {/* Company/Recruiter routes */}
              <Route path="empresa" element={
                <ProtectedRoute requiredRole="recruiter">
                  <CompanyDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="perfil" element={<Perfil />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>

            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </DemoProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
