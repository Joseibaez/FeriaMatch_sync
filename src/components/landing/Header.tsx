import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import logoFeriaMatch from "@/assets/logo-feriamatch.png";

// Header/Navbar component for landing page
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src={logoFeriaMatch} 
            alt="Cámara Zaragoza | FeriaMatch" 
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Características
          </a>
          <a href="#roles" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Roles
          </a>
          <a href="#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contacto
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/auth">Iniciar sesión</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/auth">Registrarse</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-background p-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <a href="#features" className="text-sm font-medium text-muted-foreground">
              Características
            </a>
            <a href="#roles" className="text-sm font-medium text-muted-foreground">
              Roles
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground">
              Contacto
            </a>
            <hr className="my-2" />
            <Button variant="ghost" className="justify-start" asChild>
              <Link to="/auth">Iniciar sesión</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/auth">Registrarse</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
