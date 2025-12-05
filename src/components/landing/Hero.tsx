import { Button } from "@/components/ui/button";
import { Calendar, Users, Building2, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";

// Hero section for FeriaMatch landing page
const Hero = () => {
  const navigate = useNavigate();
  const { enterDemoMode } = useDemo();

  const handleDemoClick = () => {
    enterDemoMode();
    navigate("/app");
  };

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="container relative py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground animate-fade-in">
            <Calendar className="h-4 w-4" />
            <span>Gestión inteligente de ferias de empleo</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Conecta talento con{" "}
            <span className="text-primary">oportunidades</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
            FeriaMatch organiza las agendas de tu feria de empleo. 
            Maximiza entrevistas, elimina el caos y conecta empresas con candidatos de forma eficiente.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth">
                Comenzar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" onClick={handleDemoClick}>
              Ver demostración
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted-foreground">Empresas participantes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">10,000+</p>
              <p className="text-sm text-muted-foreground">Candidatos conectados</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">50+</p>
              <p className="text-sm text-muted-foreground">Ferias organizadas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
