import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { 
  Menu, 
  LayoutDashboard, 
  Calendar, 
  User,
  Settings,
  Building2,
  Search,
  Users,
  Home,
  LogOut
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
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: AppRole[];
}

// Navigation items with role restrictions
const navigationItems: NavItem[] = [
  { title: "Dashboard", url: "/app", icon: Home, roles: ['admin', 'recruiter', 'candidate'] },
  { title: "Panel Admin", url: "/app/admin", icon: LayoutDashboard, roles: ['admin'] },
  { title: "Panel Empresa", url: "/app/empresa", icon: Building2, roles: ['recruiter'] },
  { title: "Panel Candidato", url: "/app/candidato", icon: User, roles: ['candidate'] },
  { title: "Explorar Eventos", url: "/app/explorar", icon: Search, roles: ['admin', 'recruiter', 'candidate'] },
  { title: "Mi Perfil", url: "/app/perfil", icon: User, roles: ['admin', 'recruiter', 'candidate'] },
];

// Admin-only navigation items
const adminItems: NavItem[] = [
  { title: "Gestión de Eventos", url: "/app/eventos", icon: Calendar, badge: "Admin", roles: ['admin'] },
  { title: "Usuarios", url: "/app/usuarios", icon: Users, badge: "Admin", roles: ['admin'] },
];

// Settings navigation
const settingsItems: NavItem[] = [
  { title: "Configuración", url: "/app/configuracion", icon: Settings, roles: ['admin', 'recruiter', 'candidate'] },
];

// Mobile navigation drawer component
export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { userRole, signOut, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Filter items based on user role
  const filterByRole = (items: NavItem[]) => {
    if (!userRole) return [];
    return items.filter(item => !item.roles || item.roles.includes(userRole));
  };

  const visibleNavItems = filterByRole(navigationItems);
  const visibleAdminItems = filterByRole(adminItems);
  const visibleSettingsItems = filterByRole(settingsItems);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

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
              <span className="text-xs text-muted-foreground capitalize">{userRole || 'User'}</span>
            </div>
          </Link>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {/* Main navigation */}
          <span className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground tracking-wider">
            Navegación
          </span>
          {visibleNavItems.map((item) => (
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

          {/* Admin section - only show if user has admin items */}
          {visibleAdminItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <span className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground tracking-wider">
                Administración
              </span>
              {visibleAdminItems.map((item) => (
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
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-warning/10 text-warning border-warning/20">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </>
          )}

          <Separator className="my-4" />

          {/* Settings */}
          {visibleSettingsItems.map((item) => (
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

          {/* User info and logout */}
          <Separator className="my-4" />
          
          {user && (
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target w-full",
              "hover:bg-destructive/10 text-destructive"
            )}
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
