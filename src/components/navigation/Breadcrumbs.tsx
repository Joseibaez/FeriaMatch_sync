import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  empresa: "Mi Empresa",
};

// Check if a string is a UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Dynamic breadcrumbs component that parses URL path
export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Extract event ID if present in the path (e.g., /app/eventos/:id)
  const eventIdIndex = pathSegments.findIndex(s => s === "eventos") + 1;
  const eventId = eventIdIndex > 0 && pathSegments[eventIdIndex] && isUUID(pathSegments[eventIdIndex]) 
    ? pathSegments[eventIdIndex] 
    : null;

  // Fetch event name if we have an event ID
  const { data: eventName } = useQuery({
    queryKey: ["event-name", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle();
      
      if (error || !data) return null;
      return data.title;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Don't show breadcrumbs on root app page (Dashboard)
  if (pathSegments.length <= 1 || (pathSegments.length === 2 && pathSegments[1] === "dashboard")) {
    return null;
  }

  // Get human-readable label for a route segment
  const getRouteLabel = (segment: string): string => {
    // If segment is the event ID, return the event name
    if (segment === eventId && eventName) {
      return eventName;
    }
    // If it's a UUID but we don't have a name yet, show loading indicator
    if (isUUID(segment)) {
      return eventName || "Cargando...";
    }
    return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

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
              <BreadcrumbPage className="max-w-[200px] truncate">{item.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link 
                    to={item.path} 
                    className="min-h-[44px] min-w-[44px] flex items-center hover:text-primary transition-colors max-w-[200px] truncate"
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
