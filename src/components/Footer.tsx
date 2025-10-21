import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="gradient-hero text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">
              Anagha <span className="text-accent">Safar</span>
            </h3>
            <p className="text-sm text-primary-foreground/80">
              Crafting journeys that touch the soul. Your trusted partner for luxury travel experiences.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-accent transition-smooth" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent transition-smooth" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent transition-smooth" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/hotels" className="hover:text-accent transition-smooth">
                  Hotels
                </Link>
              </li>
              <li>
                <Link to="/tours" className="hover:text-accent transition-smooth">
                  Tours
                </Link>
              </li>
              <li>
                <Link to="/flights" className="hover:text-accent transition-smooth">
                  Flights
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-accent transition-smooth">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="hover:text-accent transition-smooth">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/cancellation" className="hover:text-accent transition-smooth">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accent transition-smooth">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-smooth">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <span>UA Biotech Park, Udaipur, Rajasthan</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+91 1234567890</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@anaghasafar.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/80">
          <p>&copy; {new Date().getFullYear()} Anagha Safar. All rights reserved.</p>
          <p className="mt-2">Powered by UA Biotech</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
