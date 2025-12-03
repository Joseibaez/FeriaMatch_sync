import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// App layout and pages
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import MiAgenda from "./pages/app/MiAgenda";
import Eventos from "./pages/app/Eventos";
import Configuracion from "./pages/app/Configuracion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Index />} />
          
          {/* App routes with sidebar layout */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<MiAgenda />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>

          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
