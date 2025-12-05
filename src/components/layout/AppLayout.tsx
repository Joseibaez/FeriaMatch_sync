import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemo } from "@/contexts/DemoContext";
import { Eye, X } from "lucide-react";

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/agenda": "Mi Agenda",
  "/app/eventos": "Gestión de Eventos",
  "/app/perfil": "Mi Perfil",
  "/app/configuracion": "Configuración",
};

// Main application layout with responsive sidebar navigation
const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isDemoMode, exitDemoMode } = useDemo();
  const pageTitle = pageTitles[location.pathname] || "FeriaMatch";

  const handleExitDemo = () => {
    exitDemoMode();
    navigate("/");
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {/* Desktop sidebar - hidden on mobile */}
      <AppSidebar />

      <SidebarInset className="flex flex-col min-h-screen">
        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Modo demostración</span>
              <span className="text-primary/70 hidden sm:inline">- Explora la plataforma libremente</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExitDemo}
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              <X className="h-4 w-4 mr-1" />
              Salir
            </Button>
          </div>
        )}

        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
          {/* Mobile hamburger menu */}
          <MobileNav />

          {/* Page title */}
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-base font-semibold text-foreground md:text-lg">
              {pageTitle}
            </h1>
          </div>

          {/* User avatar placeholder */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 touch-target">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main content area - slate-50 background */}
        <main className="flex-1 bg-muted/50 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;