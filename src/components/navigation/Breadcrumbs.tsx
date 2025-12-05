import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route label mapping for breadcrumbs
const routeLabels: Record<string, string> = {
  app: "Dashboard",
  dashboard: "Dashboard",
  agenda: "Mi Agenda",
  eventos: "Eventos",
  perfil: "Mi Perfil",
  configuracion: "Configuración",
  usuarios: "Usuarios",
};

// Get human-readable label for a route segment
const getRouteLabel = (segment: string): string => {
  return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
};

// Dynamic breadcrumbs component that parses URL path
export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on root app page (Dashboard)
  if (pathSegments.length <= 1 || (pathSegments.length === 2 && pathSegments[1] === "dashboard")) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = getRouteLabel(segment);
    const isLast = index === pathSegments.length - 1;

    return {
      path,
      label,
      isLast,
    };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={item.path}>
            {item.isLast ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link 
                    to={item.path} 
                    className="min-h-[44px] min-w-[44px] flex items-center hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
