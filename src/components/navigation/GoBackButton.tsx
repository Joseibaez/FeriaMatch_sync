import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Top-level routes where back button should be hidden
const TOP_LEVEL_ROUTES = [
  "/app",
  "/app/dashboard",
  "/app/agenda",
  "/app/perfil",
  "/app/configuracion",
  "/app/eventos",
  "/app/usuarios",
];

interface GoBackButtonProps {
  className?: string;
  label?: string;
}

// Contextual back button that only shows on sub-pages
export const GoBackButton = ({ className, label = "Volver" }: GoBackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route is a top-level route
  const isTopLevelRoute = TOP_LEVEL_ROUTES.includes(location.pathname);

  // Don't render on top-level pages
  if (isTopLevelRoute) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className={`min-h-[44px] gap-1 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
};
