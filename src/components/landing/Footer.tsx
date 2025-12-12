import { Calendar } from "lucide-react";

// Footer component for landing page
const Footer = () => {
  return <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">FeriaMatch</span>
            </a>
            <p className="max-w-sm text-sm text-muted-foreground">
              Plataforma centralizada para la gestión de agendas en ferias de empleo. 
              Conectamos talento con oportunidades.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Características</a></li>
              
              <li><a href="#" className="hover:text-foreground">Documentación</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Contacto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>empleo@camarazaragoza.com<a href="#" className="hover:text-foreground">Soporte</a></li>
              
              
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} FeriaMatch. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;