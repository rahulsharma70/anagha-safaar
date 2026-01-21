import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Hotels", href: "/hotels" },
    { label: "Tours", href: "/tours" },
    { label: "Flights", href: "/flights" },
    { label: "AI Trip Planner", href: "/itinerary" },
    { label: "Contact Us", href: "/contact" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "Cancellation Policy", href: "/cancellation-policy" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "About Us", href: "/about" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="relative gradient-hero text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              alt="Anagha Safar"
              className="h-24 w-auto object-contain"
              src="/lovable-uploads/b64f0fec-511a-4b20-9a42-a0119383b45f.png"
            />
            <p className="text-white/80 text-sm leading-relaxed">
              Crafting journeys that touch the soul. Your trusted partner for luxury travel experiences across India.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-accent transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-accent" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="group flex items-center gap-2 text-white/80 hover:text-accent transition-colors duration-300"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-accent" />
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="group flex items-center gap-2 text-white/80 hover:text-accent transition-colors duration-300"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-accent" />
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 flex-shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-white/80 text-sm">Gwalior, Madhya Pradesh, India</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 flex-shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <a href="tel:+919039939555" className="text-white/80 text-sm hover:text-accent transition-colors">
                  +91 9039939555
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <a href="mailto:support@anaghasafar.com" className="text-white/80 text-sm hover:text-accent transition-colors">
                  support@anaghasafar.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © {currentYear} Anagha Safar. All rights reserved.
            </p>
            <p className="text-white/60 text-sm flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> — "An Anagha Initiative"
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;