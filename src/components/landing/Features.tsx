import { Card, CardContent } from "@/components/ui/card";
import { Clock, Shield, Smartphone, BarChart3 } from "lucide-react";

// Features section showcasing FeriaMatch capabilities
const features = [
  {
    icon: Clock,
    title: "Gestión centralizada del tiempo",
    description: "La Cámara de Comercio define horarios y slots. Las empresas solo ocupan, los candidatos reservan.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Interfaz optimizada para móvil. Valida asistencia y gestiona reservas desde cualquier lugar.",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: Shield,
    title: "Seguridad integrada",
    description: "Autenticación robusta y roles definidos. Cada usuario ve solo lo que necesita.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Métricas en tiempo real",
    description: "Visualiza ocupación, reservas y asistencia. Toma decisiones informadas durante el evento.",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
];

const Features = () => {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Todo lo que necesitas para tu feria
          </h2>
          <p className="text-lg text-muted-foreground">
            Una plataforma diseñada para maximizar conexiones y minimizar el caos administrativo.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="border-0 bg-card shadow-sm transition-all hover:shadow-md animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
