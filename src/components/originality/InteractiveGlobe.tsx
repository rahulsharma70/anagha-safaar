 import { useState } from "react";
 import { motion } from "framer-motion";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { MapPin, Plane, ArrowRight, Info } from "lucide-react";
 import { Link } from "react-router-dom";
 
 interface Destination {
   name: string;
   x: number;
   y: number;
   description: string;
   type: string;
 }
 
 type RouteType = "domestic" | "popular" | "seasonal";
 
 interface FlightRoute {
   from: string;
   to: string;
   type: RouteType;
 }
 
 // Route type colors and labels
 const ROUTE_COLORS: Record<RouteType, { color: string; label: string; description: string }> = {
   popular: { 
     color: "hsl(var(--secondary))", 
     label: "Popular Routes", 
     description: "Most frequently traveled" 
   },
   domestic: { 
     color: "hsl(45, 93%, 47%)", 
     label: "Domestic Routes", 
     description: "Regular connections" 
   },
   seasonal: { 
     color: "hsl(280, 70%, 60%)", 
     label: "Seasonal Routes", 
     description: "Best during peak season" 
   },
 };
 
 // Flight routes connecting cities with types
 const FLIGHT_ROUTES: FlightRoute[] = [
   { from: "Delhi", to: "Mumbai", type: "popular" },
   { from: "Delhi", to: "Bengaluru", type: "popular" },
   { from: "Delhi", to: "Kolkata", type: "popular" },
   { from: "Mumbai", to: "Bengaluru", type: "popular" },
   { from: "Delhi", to: "Jaipur", type: "domestic" },
   { from: "Delhi", to: "Varanasi", type: "domestic" },
   { from: "Delhi", to: "Amritsar", type: "domestic" },
   { from: "Delhi", to: "Agra", type: "domestic" },
   { from: "Mumbai", to: "Goa", type: "domestic" },
   { from: "Mumbai", to: "Hyderabad", type: "domestic" },
   { from: "Bengaluru", to: "Chennai", type: "domestic" },
   { from: "Chennai", to: "Kerala", type: "domestic" },
   { from: "Hyderabad", to: "Bengaluru", type: "domestic" },
   { from: "Jaipur", to: "Udaipur", type: "domestic" },
   { from: "Delhi", to: "Ladakh", type: "seasonal" },
   { from: "Kolkata", to: "Darjeeling", type: "seasonal" },
 ];
 
 // City positions mapped to India shape
 const DESTINATIONS: Destination[] = [
   { name: "Delhi", x: 48, y: 26, description: "Capital Gateway", type: "City" },
   { name: "Mumbai", x: 36, y: 52, description: "City of Dreams", type: "City" },
   { name: "Jaipur", x: 42, y: 32, description: "Pink City", type: "Heritage" },
   { name: "Goa", x: 36, y: 65, description: "Beach Paradise", type: "Beach" },
   { name: "Kerala", x: 40, y: 82, description: "God's Own Country", type: "Nature" },
   { name: "Varanasi", x: 58, y: 34, description: "Spiritual Capital", type: "Spiritual" },
   { name: "Ladakh", x: 46, y: 10, description: "Land of High Passes", type: "Adventure" },
   { name: "Agra", x: 50, y: 30, description: "Taj Mahal", type: "Heritage" },
   { name: "Udaipur", x: 38, y: 40, description: "City of Lakes", type: "Romantic" },
   { name: "Darjeeling", x: 68, y: 28, description: "Queen of Hills", type: "Hill Station" },
   { name: "Chennai", x: 52, y: 72, description: "Gateway to South", type: "City" },
   { name: "Kolkata", x: 68, y: 38, description: "City of Joy", type: "City" },
   { name: "Hyderabad", x: 48, y: 58, description: "City of Pearls", type: "City" },
   { name: "Bengaluru", x: 46, y: 70, description: "Silicon Valley", type: "City" },
   { name: "Amritsar", x: 44, y: 18, description: "Golden Temple", type: "Spiritual" },
 ];
 
 // Accurate India map path
 const INDIA_MAP_PATH = `
   M 47 5
   C 45 6, 43 7, 42 9
   L 40 8 L 38 10 L 36 9 L 35 11
   C 33 12, 32 14, 33 16
   L 35 18 L 34 20 L 36 22
   C 38 21, 40 20, 42 21
   L 44 19 L 46 20 L 48 18 L 50 19
   C 52 18, 54 19, 56 18
   L 58 20 L 60 19 L 62 21
   C 64 20, 66 21, 68 23
   L 70 26 L 72 29 L 74 33
   C 76 37, 77 41, 76 45
   L 74 49 L 73 53 L 71 57
   C 69 61, 67 64, 64 67
   L 61 70 L 58 73 L 55 77
   C 52 80, 50 83, 48 86
   L 46 89 L 44 91 L 42 93
   C 40 94, 38 93, 36 91
   L 34 88 L 32 84 L 30 79
   C 28 74, 27 69, 28 64
   L 29 59 L 28 54 L 27 49
   C 26 44, 27 39, 28 34
   L 30 29 L 32 25 L 35 21
   C 37 18, 39 15, 42 13
   L 44 11 L 46 8 L 47 5
   Z
 `;
 
 // State boundary paths
 const STATE_BOUNDARIES = [
   "M 42 9 Q 48 14, 55 12",
   "M 42 19 L 50 22",
   "M 35 27 Q 42 37, 38 47",
   "M 30 42 Q 35 50, 32 57",
   "M 32 54 Q 45 57, 55 52",
   "M 40 40 Q 52 44, 62 40",
   "M 50 27 Q 60 32, 68 30",
   "M 60 44 Q 65 52, 62 60",
   "M 38 62 Q 50 64, 58 60",
   "M 45 77 Q 50 80, 52 74",
   "M 70 32 Q 75 37, 74 44",
 ];
 
 // Flight Paths Component
 const FlightPaths = ({ 
   destinations, 
   selectedDest, 
   hoveredDest
 }: { 
   destinations: Destination[];
   selectedDest: Destination | null;
   hoveredDest: Destination | null;
 }) => {
   const getDestCoords = (name: string) => {
     const dest = destinations.find(d => d.name === name);
     return dest ? { x: dest.x, y: dest.y } : null;
   };
 
   const getCurvedPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
     const midX = (from.x + to.x) / 2;
     const midY = (from.y + to.y) / 2;
     const dx = to.x - from.x;
     const dy = to.y - from.y;
     const dist = Math.sqrt(dx * dx + dy * dy);
     const curveOffset = Math.min(dist * 0.2, 6);
     const controlX = midX - (dy / dist) * curveOffset;
     const controlY = midY + (dx / dist) * curveOffset;
     return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
   };
 
   const getRouteColor = (type: RouteType) => ROUTE_COLORS[type].color;
   const getRouteGradient = (type: RouteType) => `url(#${type}RouteGradient)`;
 
   const activeCity = selectedDest?.name || hoveredDest?.name;
   const activeRoutes = activeCity 
     ? FLIGHT_ROUTES.filter(route => route.from === activeCity || route.to === activeCity)
     : [];
   const showAllRoutes = !activeCity;
 
   return (
     <g className="flight-paths">
       {showAllRoutes && FLIGHT_ROUTES.map((route, index) => {
         const fromCoords = getDestCoords(route.from);
         const toCoords = getDestCoords(route.to);
         if (!fromCoords || !toCoords) return null;
         const pathD = getCurvedPath(fromCoords, toCoords);
         const routeColor = getRouteColor(route.type);
         
         return (
           <path
             key={`bg-${index}`}
             d={pathD}
             fill="none"
             stroke={routeColor}
             strokeWidth="0.2"
             strokeDasharray="0.6,0.8"
             opacity="0.25"
             strokeLinecap="round"
           />
         );
       })}
 
       {activeRoutes.map((route, index) => {
         const fromCoords = getDestCoords(route.from);
         const toCoords = getDestCoords(route.to);
         if (!fromCoords || !toCoords) return null;
         
         const pathD = getCurvedPath(fromCoords, toCoords);
         const pathId = `flight-path-${index}`;
         const isFromActive = route.from === activeCity;
         const routeColor = getRouteColor(route.type);
         const routeGradient = getRouteGradient(route.type);
         
         return (
           <g key={pathId}>
             <path
               d={pathD}
               fill="none"
               stroke={routeColor}
               strokeWidth="1.2"
               opacity="0.15"
               strokeLinecap="round"
             >
               <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
             </path>
             
             <path
               id={pathId}
               d={pathD}
               fill="none"
               stroke={routeGradient}
               strokeWidth="0.35"
               strokeLinecap="round"
               opacity="0.8"
             />
             
             <path
               d={pathD}
               fill="none"
               stroke={routeColor}
               strokeWidth="0.25"
               strokeDasharray="1,2"
               strokeLinecap="round"
               opacity="0.9"
             >
               <animate
                 attributeName="stroke-dashoffset"
                 values={isFromActive ? "0;-12" : "-12;0"}
                 dur="1.5s"
                 repeatCount="indefinite"
               />
             </path>
             
             <g>
               <circle r="0.9" fill={routeColor}>
                 <animateMotion dur={`${2 + index * 0.3}s`} repeatCount="indefinite" rotate="auto">
                   <mpath href={`#${pathId}`} />
                 </animateMotion>
                 <animate attributeName="opacity" values="0;1;1;1;0" dur={`${2 + index * 0.3}s`} repeatCount="indefinite" />
               </circle>
               <circle r="0.4" fill={routeColor} opacity="0.5">
                 <animateMotion dur={`${2 + index * 0.3}s`} repeatCount="indefinite" rotate="auto" keyPoints="0;0.95" keyTimes="0;1" calcMode="linear">
                   <mpath href={`#${pathId}`} />
                 </animateMotion>
               </circle>
             </g>
           </g>
         );
       })}
     </g>
   );
 };
 
 // India map SVG with cities inside
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
   <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
     <defs>
       <linearGradient id="indiaMapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
         <stop offset="25%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
         <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
         <stop offset="75%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
         <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
       </linearGradient>
       
       <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stopColor="hsl(var(--secondary))" />
         <stop offset="35%" stopColor="hsl(var(--primary))" />
         <stop offset="65%" stopColor="hsl(var(--secondary))" />
         <stop offset="100%" stopColor="hsl(var(--secondary))" />
       </linearGradient>
       
       <linearGradient id="popularRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
         <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
         <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="1" />
         <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
       </linearGradient>
       
       <linearGradient id="domesticRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
         <stop offset="0%" stopColor="hsl(45, 93%, 47%)" stopOpacity="0.2" />
         <stop offset="50%" stopColor="hsl(45, 93%, 47%)" stopOpacity="1" />
         <stop offset="100%" stopColor="hsl(45, 93%, 47%)" stopOpacity="0.2" />
       </linearGradient>
       
       <linearGradient id="seasonalRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
         <stop offset="0%" stopColor="hsl(280, 70%, 60%)" stopOpacity="0.2" />
         <stop offset="50%" stopColor="hsl(280, 70%, 60%)" stopOpacity="1" />
         <stop offset="100%" stopColor="hsl(280, 70%, 60%)" stopOpacity="0.2" />
       </linearGradient>
       
       <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
         <feGaussianBlur stdDeviation="1.5" result="blur" />
         <feFlood floodColor="hsl(var(--secondary))" floodOpacity="0.4" />
         <feComposite in2="blur" operator="in" />
         <feMerge>
           <feMergeNode />
           <feMergeNode in="SourceGraphic" />
         </feMerge>
       </filter>
       
       <filter id="markerGlow">
         <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
         <feMerge>
           <feMergeNode in="coloredBlur" />
           <feMergeNode in="SourceGraphic" />
         </feMerge>
       </filter>
       
       <radialGradient id="centerHighlight" cx="50%" cy="50%" r="50%">
         <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.15" />
         <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
         <stop offset="100%" stopColor="transparent" stopOpacity="0" />
       </radialGradient>
       
       <pattern id="terrainPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
         <circle cx="1" cy="1" r="0.3" fill="hsl(var(--muted-foreground))" opacity="0.05" />
         <circle cx="3" cy="3" r="0.2" fill="hsl(var(--muted-foreground))" opacity="0.03" />
       </pattern>
     </defs>
     
     {/* Background rings */}
     <circle cx="50" cy="48" r="48" fill="none" stroke="hsl(var(--border))" strokeWidth="0.15" strokeDasharray="2,2" opacity="0.3" />
     <circle cx="50" cy="48" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="0.1" strokeDasharray="1,3" opacity="0.2" />
     
     {/* India outline */}
     <path
       d={INDIA_MAP_PATH}
       fill="url(#indiaMapGradient)"
       stroke="url(#borderGradient)"
       strokeWidth="0.6"
       filter="url(#outerGlow)"
       strokeLinejoin="round"
       strokeLinecap="round"
     />
     
     {/* Terrain texture */}
     <path d={INDIA_MAP_PATH} fill="url(#terrainPattern)" stroke="none" />
     
     {/* Center highlight */}
     <path d={INDIA_MAP_PATH} fill="url(#centerHighlight)" stroke="none" />
     
     {/* State boundaries */}
     <g opacity="0.3" stroke="hsl(var(--muted-foreground))" strokeWidth="0.2" fill="none" strokeLinecap="round">
       {STATE_BOUNDARIES.map((path, i) => (
         <path key={i} d={path} strokeDasharray="0.8,0.4" />
       ))}
     </g>
     
     {/* Compass rose */}
     <g transform="translate(88, 88)" opacity="0.5">
       <circle r="6" fill="hsl(var(--card))" fillOpacity="0.5" stroke="hsl(var(--border))" strokeWidth="0.15" />
       <circle r="4.5" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.15" />
       <text x="0" y="-5.5" textAnchor="middle" fontSize="1.8" fontWeight="bold" fill="hsl(var(--secondary))">N</text>
       <text x="0" y="6.8" textAnchor="middle" fontSize="1.4" fill="hsl(var(--muted-foreground))">S</text>
       <text x="-6" y="0.5" textAnchor="middle" fontSize="1.4" fill="hsl(var(--muted-foreground))">W</text>
       <text x="6" y="0.5" textAnchor="middle" fontSize="1.4" fill="hsl(var(--muted-foreground))">E</text>
       <polygon points="0,-4 0.6,-1 0,0 -0.6,-1" fill="hsl(var(--secondary))" />
       <polygon points="0,4 0.5,1 0,0 -0.5,1" fill="hsl(var(--muted-foreground))" opacity="0.5" />
       <line x1="-3.5" y1="0" x2="-1" y2="0" stroke="hsl(var(--muted-foreground))" strokeWidth="0.25" />
       <line x1="1" y1="0" x2="3.5" y2="0" stroke="hsl(var(--muted-foreground))" strokeWidth="0.25" />
     </g>
 
     {/* Flight paths */}
     <FlightPaths destinations={destinations} selectedDest={selectedDest} hoveredDest={hoveredDest} />
 
     {/* City markers */}
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
           <circle cx="0" cy="0" r="2" fill="none" stroke={isSelected ? "hsl(var(--secondary))" : "hsl(var(--primary))"} strokeWidth="0.3" opacity="0.6">
             <animate attributeName="r" values="1.5;3.5;1.5" dur={`${1.8 + index * 0.1}s`} repeatCount="indefinite" />
             <animate attributeName="opacity" values="0.8;0;0.8" dur={`${1.8 + index * 0.1}s`} repeatCount="indefinite" />
           </circle>
           
           <circle cx="0" cy="0" r="1.8" fill={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--primary))"} opacity="0.2" />
           
           <circle
             cx="0" cy="0"
             r={isSelected || isHovered ? "1.4" : "1"}
             fill={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
             stroke="hsl(var(--background))"
             strokeWidth="0.4"
           />
           
           <circle cx="-0.3" cy="-0.3" r="0.3" fill="white" opacity="0.6" />
           
           <rect
             x="-8" y="2" width="16" height="3.5" rx="0.8"
             fill={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--card))"}
             fillOpacity={isSelected || isHovered ? "0.9" : "0.85"}
             stroke={isSelected || isHovered ? "hsl(var(--secondary))" : "hsl(var(--border))"}
             strokeWidth="0.15"
           />
           <text
             x="0" y="4.5"
             textAnchor="middle"
             fontSize="2.2"
             fontWeight={isSelected || isHovered ? "700" : "600"}
             fill={isSelected || isHovered ? "hsl(var(--secondary-foreground))" : "hsl(var(--foreground))"}
             style={{ pointerEvents: 'none', letterSpacing: '0.02em' }}
           >
             {dest.name}
           </text>
         </g>
       );
     })}
     
     {/* Map title */}
     <text x="50" y="97" textAnchor="middle" fontSize="2.8" fontWeight="700" fill="hsl(var(--foreground))" opacity="0.4" letterSpacing="0.2em">
       INDIA
     </text>
   </svg>
 );
 
 // Route Legend Component
 const RouteLegend = () => (
   <motion.div
     initial={{ opacity: 0, y: 10 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ delay: 0.5 }}
     className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg"
   >
     <div className="flex items-center gap-1.5 mb-2">
       <Info className="h-3.5 w-3.5 text-muted-foreground" />
       <span className="text-xs font-semibold text-foreground">Flight Routes</span>
     </div>
     <div className="space-y-1.5">
       {(Object.entries(ROUTE_COLORS) as [RouteType, typeof ROUTE_COLORS[RouteType]][]).map(([type, { color, label, description }]) => (
         <div key={type} className="flex items-center gap-2">
           <div className="flex items-center gap-1.5">
             <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }} />
             <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
           </div>
           <div className="flex flex-col">
             <span className="text-xs font-medium text-foreground leading-none">{label}</span>
             <span className="text-[10px] text-muted-foreground leading-tight">{description}</span>
           </div>
         </div>
       ))}
     </div>
   </motion.div>
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
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="h-[500px] relative"
           >
             <div className="absolute inset-0 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-3xl" />
             
             <div className="relative w-full h-full">
               <IndiaMapSVG 
                 destinations={DESTINATIONS}
                 hoveredDest={hoveredDest}
                 selectedDest={selectedDest}
                 onHover={setHoveredDest}
                 onSelect={setSelectedDest}
               />
             </div>
             
             <RouteLegend />
             
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