import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">
              Anagha <span className="text-accent">Safar</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-foreground hover:text-accent transition-smooth">
              Home
            </Link>
            <Link to="/hotels" className="text-foreground hover:text-accent transition-smooth">
              Hotels
            </Link>
            <Link to="/tours" className="text-foreground hover:text-accent transition-smooth">
              Tours
            </Link>
            <Link to="/flights" className="text-foreground hover:text-accent transition-smooth">
              Flights
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            {user ? (
              <Button variant="ocean" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ocean" size="sm">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 space-y-4 animate-fade-in">
            <Link
              to="/"
              className="block py-2 text-foreground hover:text-accent transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/hotels"
              className="block py-2 text-foreground hover:text-accent transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              Hotels
            </Link>
            <Link
              to="/tours"
              className="block py-2 text-foreground hover:text-accent transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              Tours
            </Link>
            <Link
              to="/flights"
              className="block py-2 text-foreground hover:text-accent transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              Flights
            </Link>
            {user ? (
              <Button variant="ocean" className="w-full" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ocean" className="w-full">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
