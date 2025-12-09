import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth & Context
import { AuthProvider } from "./contexts/AuthContext";
import { DemoProvider } from "./contexts/DemoContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Auth from "./pages/Auth";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// App layout and pages
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import MiAgenda from "./pages/app/MiAgenda";
import Eventos from "./pages/app/Eventos";
import EventoDetalle from "./pages/app/EventoDetalle";
import Perfil from "./pages/app/Perfil";
import Configuracion from "./pages/app/Configuracion";

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
            
            {/* Protected app routes with sidebar layout */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="agenda" element={<MiAgenda />} />
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