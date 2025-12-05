import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  CalendarDays, 
  Calendar, 
  User,
  Settings,
  Building2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Navigation items
const mainNavItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Mi Agenda", url: "/app/agenda", icon: CalendarDays },
  { title: "Mi Perfil", url: "/app/perfil", icon: User },
];

const adminNavItems = [
  { title: "Eventos", url: "/app/eventos", icon: Calendar, badge: "Admin Only" },
];

const settingsNavItems = [
  { title: "Configuración", url: "/app/configuracion", icon: Settings },
];

// Mobile navigation drawer component
export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => location.pathname === path;

  // Only render on mobile
  if (!isMobile) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="touch-target md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-72 p-0 bg-card">
        <SheetHeader className="border-b border-border p-4">
          <Link 
            to="/app" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 min-h-[44px] rounded-md hover:bg-muted/50 transition-colors -mx-2 px-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-left text-base">FeriaMatch</SheetTitle>
              <span className="text-xs text-muted-foreground">Panel de control</span>
            </div>
          </Link>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {/* Main navigation */}
          <span className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground tracking-wider">
            Navegación
          </span>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target",
                "hover:bg-muted hover:text-foreground",
                isActive(item.url) 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </NavLink>
          ))}

          <Separator className="my-4" />

          {/* Admin section */}
          <span className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground tracking-wider">
            Administración
          </span>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target",
                "hover:bg-muted hover:text-foreground",
                isActive(item.url) 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="rounded bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <Separator className="my-4" />

          {/* Settings */}
          {settingsNavItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target",
                "hover:bg-muted hover:text-foreground",
                isActive(item.url) 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};