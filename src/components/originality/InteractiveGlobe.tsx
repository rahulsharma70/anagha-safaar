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

// India map SVG path with cities inside
const IndiaMapSVG = ({ 
  destinations, 
  hoveredDest, 
  selectedDest,
  onHover,
  onSelect 
}: {
  destinations: Destination[];
  hoveredDest: Destination | null;
  selectedDest: Destination | null;
  onHover: (dest: Destination | null) => void;
  onSelect: (dest: Destination) => void;
}) => (
  <svg
    viewBox="0 0 100 100"
    className="w-full h-full drop-shadow-2xl"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      {/* Premium gradient for India map */}
      <linearGradient id="indiaMapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
        <stop offset="30%" stopColor="hsl(var(--secondary))" stopOpacity="0.25" />
        <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.15" />
      </linearGradient>
      
      {/* Border gradient */}
      <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--secondary))" />
        <stop offset="50%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--secondary))" />
      </linearGradient>
      
      {/* Outer glow filter */}
      <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood floodColor="hsl(var(--secondary))" floodOpacity="0.4" />
        <feComposite in2="blur" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      {/* Inner shadow for depth */}
      <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feOffset dx="0.5" dy="0.5" />
        <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0" />
        <feBlend in2="SourceGraphic" mode="overlay" />
      </filter>
      
      {/* Marker glow */}
      <filter id="markerGlow">
        <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      {/* Radial gradient for map center highlight */}
      <radialGradient id="centerHighlight" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </radialGradient>
    </defs>
    
    {/* Background decorative ring */}
    <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(var(--border))" strokeWidth="0.15" strokeDasharray="2,2" opacity="0.3" />
    <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="0.1" strokeDasharray="1,3" opacity="0.2" />
    
    {/* More detailed India outline */}
    <path
      d="M45 2 
         L50 1 L55 3 L58 6 L56 10 L52 8 L48 10 L44 8 L40 10 L36 8 L33 12 
         L36 16 L40 14 L44 16 L48 14 L52 16 L56 18 L60 16 L64 18 L68 22 L72 26 L76 32 
         L78 38 L76 44 L74 50 L70 56 L66 62 L62 68 L56 74 L52 80 
         L48 86 L44 90 L38 94 L34 90 L30 84 L26 76 L24 68 
         L26 60 L28 52 L26 44 L24 36 L26 28 L30 22 L34 16 L38 12 L42 8 L45 4 Z"
      fill="url(#indiaMapGradient)"
      stroke="url(#borderGradient)"
      strokeWidth="0.8"
      filter="url(#outerGlow)"
      className="transition-all duration-500"
    />
    
    {/* Inner highlight layer */}
    <path
      d="M45 2 
         L50 1 L55 3 L58 6 L56 10 L52 8 L48 10 L44 8 L40 10 L36 8 L33 12 
         L36 16 L40 14 L44 16 L48 14 L52 16 L56 18 L60 16 L64 18 L68 22 L72 26 L76 32 
         L78 38 L76 44 L74 50 L70 56 L66 62 L62 68 L56 74 L52 80 
         L48 86 L44 90 L38 94 L34 90 L30 84 L26 76 L24 68 
         L26 60 L28 52 L26 44 L24 36 L26 28 L30 22 L34 16 L38 12 L42 8 L45 4 Z"
      fill="url(#centerHighlight)"
      stroke="none"
    />
    
    {/* State/region boundaries (subtle) */}
    <g opacity="0.25" stroke="hsl(var(--muted-foreground))" strokeWidth="0.15" fill="none">
      <path d="M36 20 Q45 25 56 20" />
      <path d="M30 35 Q50 40 70 35" />
      <path d="M28 50 Q48 55 68 48" />
      <path d="M30 65 Q45 70 60 65" />
      <path d="M35 80 Q44 85 52 78" />
      <path d="M50 25 L50 80" strokeDasharray="0.5,1.5" />
    </g>
    
    {/* Decorative compass rose */}
    <g transform="translate(85, 85)" opacity="0.4">
      <circle r="5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" />
      <text x="0" y="-6" textAnchor="middle" fontSize="2" fill="hsl(var(--muted-foreground))">N</text>
      <line x1="0" y1="-4" x2="0" y2="-2" stroke="hsl(var(--secondary))" strokeWidth="0.3" />
      <line x1="0" y1="2" x2="0" y2="4" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" />
      <line x1="-4" y1="0" x2="-2" y2="0" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" />
      <line x1="2" y1="0" x2="4" y2="0" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" />
    </g>

    {/* City markers inside SVG */}
    {destinations.map((dest, index) => {
      const isSelected = selectedDest?.name === dest.name;
      const isHovered = hoveredDest?.name === dest.name;
      
      return (
        <g 
          key={dest.name}
          transform={`translate(${dest.x}, ${dest.y})`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => onHover(dest)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(dest)}
          filter="url(#markerGlow)"
        >
          {/* Outer pulse ring */}
          <circle
            cx="0"
            cy="0"
            r="2"
            fill="none"
            stroke={isSelected ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
            strokeWidth="0.3"
            opacity="0.6"
          >
            <animate
              attributeName="r"
              values="1.5;3.5;1.5"
              dur={`${1.8 + index * 0.1}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0;0.8"
              dur={`${1.8 + index * 0.1}s`}
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Inner glow */}
          <circle
            cx="0"
            cy="0"
            r="1.8"
            fill={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
            opacity="0.2"
          />
          
          {/* Main marker dot */}
          <circle
            cx="0"
            cy="0"
            r={isSelected || isHovered ? "1.4" : "1"}
            fill={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
            stroke="hsl(var(--background))"
            strokeWidth="0.4"
            className="transition-all duration-300"
          />
          
          {/* Inner highlight */}
          <circle
            cx="-0.3"
            cy="-0.3"
            r="0.3"
            fill="white"
            opacity="0.6"
          />
          
          {/* City name label with background */}
          <rect
            x="-8"
            y="2"
            width="16"
            height="3.5"
            rx="0.8"
            fill={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--card))"}
            fillOpacity={isSelected || isHovered ? "0.9" : "0.85"}
            stroke={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--border))"}
            strokeWidth="0.15"
            className="transition-all duration-200"
          />
          <text
            x="0"
            y="4.5"
            textAnchor="middle"
            fontSize="2.2"
            fontWeight={isSelected || isHovered ? "700" : "600"}
            fill={isSelected || isHovered ? "hsl(var(--secondary-foreground))" : "hsl(var(--foreground))"}
            className="transition-colors duration-200"
            style={{ pointerEvents: 'none', letterSpacing: '0.02em' }}
          >
            {dest.name}
          </text>
        </g>
      );
    })}
    
    {/* Title label */}
    <text x="50" y="98" textAnchor="middle" fontSize="2.5" fontWeight="600" fill="hsl(var(--muted-foreground))" opacity="0.6" letterSpacing="0.15em">
      INDIA
    </text>
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
              <IndiaMapSVG 
                destinations={DESTINATIONS}
                hoveredDest={hoveredDest}
                selectedDest={selectedDest}
                onHover={setHoveredDest}
                onSelect={setSelectedDest}
              />
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
