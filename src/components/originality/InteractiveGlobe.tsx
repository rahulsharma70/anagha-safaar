import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plane, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Destination {
  name: string;
  x: number; // percentage position on map
  y: number;
  description: string;
  type: string;
}

// City positions mapped to India shape (percentage-based)
const DESTINATIONS: Destination[] = [
  { name: "Delhi", x: 48, y: 28, description: "Capital Gateway", type: "City" },
  { name: "Mumbai", x: 32, y: 55, description: "City of Dreams", type: "City" },
  { name: "Jaipur", x: 40, y: 33, description: "Pink City", type: "Heritage" },
  { name: "Goa", x: 32, y: 68, description: "Beach Paradise", type: "Beach" },
  { name: "Kerala", x: 38, y: 85, description: "God's Own Country", type: "Nature" },
  { name: "Varanasi", x: 60, y: 38, description: "Spiritual Capital", type: "Spiritual" },
  { name: "Ladakh", x: 45, y: 8, description: "Land of High Passes", type: "Adventure" },
  { name: "Agra", x: 52, y: 33, description: "Taj Mahal", type: "Heritage" },
  { name: "Udaipur", x: 36, y: 42, description: "City of Lakes", type: "Romantic" },
  { name: "Darjeeling", x: 72, y: 30, description: "Queen of Hills", type: "Hill Station" },
  { name: "Chennai", x: 54, y: 75, description: "Gateway to South", type: "City" },
  { name: "Kolkata", x: 72, y: 42, description: "City of Joy", type: "City" },
  { name: "Hyderabad", x: 50, y: 60, description: "City of Pearls", type: "City" },
  { name: "Bengaluru", x: 45, y: 72, description: "Silicon Valley", type: "City" },
  { name: "Amritsar", x: 40, y: 18, description: "Golden Temple", type: "Spiritual" },
];

// India map SVG path
const IndiaMapSVG = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-full h-full"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="indiaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Simplified India outline */}
    <path
      d="M45 5 
         L52 3 L58 8 L55 15 L48 12 L42 14 L38 12 L35 18 
         L40 22 L45 20 L52 22 L58 25 L62 22 L68 25 L75 28 L78 35 
         L75 42 L72 48 L68 52 L65 58 L60 62 L55 68 L52 75 
         L48 82 L45 88 L40 92 L35 88 L32 82 L28 75 L25 68 
         L28 62 L30 55 L28 48 L25 42 L28 35 L32 28 L35 22 
         L40 18 L45 12 Z"
      fill="url(#indiaGradient)"
      stroke="hsl(var(--secondary))"
      strokeWidth="0.5"
      filter="url(#glow)"
      className="transition-all duration-500"
    />
    
    {/* State boundaries (simplified) */}
    <path
      d="M45 30 L55 32 M35 45 L55 48 M40 60 L50 62 M45 75 L42 80"
      stroke="hsl(var(--border))"
      strokeWidth="0.2"
      strokeDasharray="1,1"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

export const InteractiveGlobe = () => {
  const [hoveredDest, setHoveredDest] = useState<Destination | null>(null);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            <MapPin className="h-3.5 w-3.5 mr-2 text-secondary" />
            Interactive India Map
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore <span className="text-secondary">Incredible India</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Click on any city to discover amazing destinations across India
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* India Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="h-[500px] relative"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-3xl" />
            
            {/* Map container */}
            <div className="relative w-full h-full">
              <IndiaMapSVG />
              
              {/* City markers */}
              {DESTINATIONS.map((dest) => (
                <motion.div
                  key={dest.name}
                  className="absolute cursor-pointer group"
                  style={{ 
                    left: `${dest.x}%`, 
                    top: `${dest.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  whileHover={{ scale: 1.3 }}
                  onMouseEnter={() => setHoveredDest(dest)}
                  onMouseLeave={() => setHoveredDest(null)}
                  onClick={() => setSelectedDest(dest)}
                >
                  {/* Pulse effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${
                      selectedDest?.name === dest.name 
                        ? 'bg-secondary' 
                        : 'bg-primary'
                    }`}
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ width: 12, height: 12 }}
                  />
                  
                  {/* Marker dot */}
                  <div 
                    className={`w-3 h-3 rounded-full border-2 border-background shadow-lg transition-colors ${
                      selectedDest?.name === dest.name 
                        ? 'bg-secondary' 
                        : 'bg-primary group-hover:bg-secondary'
                    }`}
                  />
                  
                  {/* City label */}
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ 
                      opacity: hoveredDest?.name === dest.name || selectedDest?.name === dest.name ? 1 : 0.7,
                      y: 0 
                    }}
                    className={`absolute left-1/2 -translate-x-1/2 top-4 text-xs font-medium whitespace-nowrap px-1.5 py-0.5 rounded ${
                      selectedDest?.name === dest.name 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'bg-card/80 text-foreground'
                    }`}
                  >
                    {dest.name}
                  </motion.span>
                </motion.div>
              ))}
            </div>
            
            {/* Hover tooltip */}
            {hoveredDest && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-lg border border-border rounded-xl px-4 py-3 shadow-xl z-10"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <span className="font-semibold">{hoveredDest.name}</span>
                  <Badge variant="secondary" className="text-xs">{hoveredDest.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{hoveredDest.description}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Destination Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {selectedDest ? selectedDest.name : "Select a Destination"}
              </h3>
              <p className="text-muted-foreground">
                {selectedDest 
                  ? `Discover the magic of ${selectedDest.name} - ${selectedDest.description}`
                  : "Click on any city marker on the map to explore destinations"
                }
              </p>
            </div>

            {/* Destination Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DESTINATIONS.slice(0, 9).map((dest) => (
                <motion.button
                  key={dest.name}
                  onClick={() => setSelectedDest(dest)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    p-3 rounded-xl border text-left transition-all duration-200
                    ${selectedDest?.name === dest.name 
                      ? 'border-secondary bg-secondary/10' 
                      : 'border-border hover:border-muted-foreground bg-card/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Plane className={`h-3.5 w-3.5 ${selectedDest?.name === dest.name ? 'text-secondary' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-sm">{dest.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{dest.type}</p>
                </motion.button>
              ))}
            </div>

            {selectedDest && (
              <Link to="/tours">
                <Button size="lg" className="w-full group">
                  Explore {selectedDest.name} Packages
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
