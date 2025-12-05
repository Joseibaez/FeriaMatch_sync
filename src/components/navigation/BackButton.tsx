import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  variant?: "dashboard" | "back";
  className?: string;
}

export const BackButton = ({ variant = "dashboard", className }: BackButtonProps) => {
  const navigate = useNavigate();

  if (variant === "dashboard") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/app")}
        className={className}
      >
        <LayoutDashboard className="mr-2 h-4 w-4" />
        Volver al Dashboard
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className={className}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Volver atrás
    </Button>
  );
};
