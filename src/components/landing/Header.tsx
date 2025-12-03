import { Button } from "@/components/ui/button";
import { Calendar, Menu } from "lucide-react";
import { useState } from "react";

// Header/Navbar component for landing page
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">FeriaMatch</span>
        </a>

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
          <Button variant="ghost">Iniciar sesión</Button>
          <Button variant="default">Registrarse</Button>
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
            <Button variant="ghost" className="justify-start">Iniciar sesión</Button>
            <Button variant="default">Registrarse</Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
