import { useLocation, Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { 
  Calendar, 
  LayoutDashboard, 
  CalendarDays, 
  Settings, 
  Building2, 
  ChevronLeft,
  User,
  Users,
  Search,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: AppRole[];
}

// Navigation items with role restrictions
const navigationItems: NavItem[] = [
  { 
    title: "Dashboard", 
    url: "/app", 
    icon: LayoutDashboard,
    roles: ['candidate']
  },
  { 
    title: "Panel Admin", 
    url: "/app/admin", 
    icon: LayoutDashboard,
    roles: ['admin']
  },
  { 
    title: "Panel Empresa", 
    url: "/app/empresa", 
    icon: Building2,
    roles: ['recruiter']
  },
  { 
    title: "Mi Agenda", 
    url: "/app/agenda", 
    icon: CalendarDays,
    roles: ['recruiter']
  },
  { 
    title: "Explorar Eventos", 
    url: "/app/explorar", 
    icon: Search,
    roles: ['candidate']
  },
  { 
    title: "Mi Perfil", 
    url: "/app/perfil", 
    icon: User,
    roles: ['admin', 'recruiter', 'candidate']
  },
];

// Admin-only navigation items
const adminItems: NavItem[] = [
  { 
    title: "Gestión de Eventos", 
    url: "/app/eventos", 
    icon: Calendar, 
    badge: "Admin",
    roles: ['admin']
  },
  { 
    title: "Usuarios", 
    url: "/app/usuarios", 
    icon: Users, 
    badge: "Admin",
    roles: ['admin']
  },
];

// Settings navigation
const settingsItems: NavItem[] = [
  { 
    title: "Configuración", 
    url: "/app/configuracion", 
    icon: Settings,
    roles: ['admin', 'recruiter', 'candidate']
  },
];

// Desktop sidebar component for FeriaMatch app
const AppSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const { userRole, signOut, user } = useAuth();
  const isCollapsed = state === "collapsed";

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
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      {/* Header with logo - links to dashboard */}
      <SidebarHeader className="border-b border-sidebar-border">
        <Link 
          to="/app" 
          className="flex items-center gap-2 px-2 py-3 min-h-[44px] rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">FeriaMatch</span>
              <span className="text-xs text-muted-foreground capitalize">{userRole || 'User'}</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin navigation - only show if there are visible admin items */}
        {visibleAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {!isCollapsed && item.badge && (
                          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-warning/10 text-warning border-warning/20">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings at bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSettingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user info and actions */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {/* User email display */}
          {!isCollapsed && user && (
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          
          <Separator className="my-1" />
          
          {/* Logout button */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Cerrar sesión"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Collapse toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Colapsar menú">
              <SidebarTrigger className="w-full justify-start">
                <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
                <span>Colapsar</span>
              </SidebarTrigger>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;