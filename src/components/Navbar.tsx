import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, User, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FadeIn } from "@/components/animations/FadeIn";
import { motion, AnimatePresence } from "framer-motion";

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
            <Link to="/itinerary" className="text-foreground hover:text-accent transition-smooth flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              AI Planner
            </Link>
            <Link to="/about" className="text-foreground hover:text-accent transition-smooth">
              About
            </Link>
            <Link to="/contact" className="text-foreground hover:text-accent transition-smooth">
              Contact
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/user-dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.div>
            </button>
          </div>
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
            <Link
              to="/itinerary"
              className="block py-2 text-foreground hover:text-accent transition-smooth flex items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              <Sparkles className="h-4 w-4" />
              AI Planner
            </Link>
            <Link
              to="/about"
              className="block py-2 text-foreground hover:text-accent transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block py-2 text-foreground hover:text-accent transition-smooth"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ocean" className="w-full" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
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
