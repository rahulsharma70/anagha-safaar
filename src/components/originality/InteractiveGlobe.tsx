import { Suspense, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe2, MapPin, Plane, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import * as THREE from "three";

interface Destination {
  name: string;
  lat: number;
  lng: number;
  description: string;
  type: string;
}

const DESTINATIONS: Destination[] = [
  { name: "Delhi", lat: 28.6139, lng: 77.209, description: "Capital Gateway", type: "City" },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, description: "City of Dreams", type: "City" },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, description: "Pink City", type: "Heritage" },
  { name: "Goa", lat: 15.2993, lng: 74.124, description: "Beach Paradise", type: "Beach" },
  { name: "Kerala", lat: 10.8505, lng: 76.2711, description: "God's Own Country", type: "Nature" },
  { name: "Varanasi", lat: 25.3176, lng: 82.9739, description: "Spiritual Capital", type: "Spiritual" },
  { name: "Ladakh", lat: 34.1526, lng: 77.5771, description: "Land of High Passes", type: "Adventure" },
  { name: "Agra", lat: 27.1767, lng: 78.0081, description: "Taj Mahal", type: "Heritage" },
  { name: "Udaipur", lat: 24.5854, lng: 73.7125, description: "City of Lakes", type: "Romantic" },
  { name: "Darjeeling", lat: 27.041, lng: 88.2663, description: "Queen of Hills", type: "Hill Station" },
];

// Convert lat/lng to 3D coordinates
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

function DestinationMarker({ 
  destination, 
  radius, 
  onHover,
  isSelected
}: { 
  destination: Destination; 
  radius: number;
  onHover: (dest: Destination | null) => void;
  isSelected: boolean;
}) {
  const position = useMemo(
    () => latLngToVector3(destination.lat, destination.lng, radius),
    [destination.lat, destination.lng, radius]
  );
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.2;
      meshRef.current.scale.setScalar(isSelected ? scale * 1.5 : scale);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => onHover(destination)}
      onPointerLeave={() => onHover(null)}
    >
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial
        color={isSelected ? "#0EA5A3" : "#D4AF37"}
        emissive={isSelected ? "#0EA5A3" : "#D4AF37"}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function GlobeWithMarkers({ 
  onHover, 
  selectedDest 
}: { 
  onHover: (dest: Destination | null) => void;
  selectedDest: Destination | null;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  const RADIUS = 2;

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Lights - moved outside mesh for proper illumination */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#0EA5A3" />
      
      {/* Globe */}
      <mesh ref={globeRef}>
        <Sphere args={[RADIUS, 64, 64]}>
          <meshPhongMaterial
            color="#1a5276"
            emissive="#0e3d5c"
            emissiveIntensity={0.3}
            specular="#ffffff"
            shininess={30}
          />
        </Sphere>
        {/* Continents overlay - wireframe for visual interest */}
        <Sphere args={[RADIUS * 1.005, 32, 32]}>
          <meshBasicMaterial
            color="#2ecc71"
            wireframe
            transparent
            opacity={0.15}
          />
        </Sphere>
        {/* Atmosphere glow */}
        <Sphere args={[RADIUS * 1.03, 32, 32]}>
          <meshBasicMaterial
            color="#0EA5A3"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </Sphere>
      </mesh>

      {/* Destination Markers */}
      {DESTINATIONS.map((dest) => (
        <DestinationMarker
          key={dest.name}
          destination={dest}
          radius={RADIUS * 1.02}
          onHover={onHover}
          isSelected={selectedDest?.name === dest.name}
        />
      ))}
    </group>
  );
}

function GlobeScene({ 
  onHover, 
  selectedDest 
}: { 
  onHover: (dest: Destination | null) => void;
  selectedDest: Destination | null;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <Suspense fallback={null}>
        <GlobeWithMarkers onHover={onHover} selectedDest={selectedDest} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Suspense>
    </Canvas>
  );
}

export const InteractiveGlobe = () => {
  const [hoveredDest, setHoveredDest] = useState<Destination | null>(null);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);

  const handleHover = (dest: Destination | null) => {
    setHoveredDest(dest);
    if (dest) setSelectedDest(dest);
  };

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
            <Globe2 className="h-3.5 w-3.5 mr-2 text-secondary" />
            Interactive Experience
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore <span className="text-secondary">India</span> in 3D
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Spin the globe and discover incredible destinations across India
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="h-[500px] relative"
          >
            <div className="absolute inset-0 bg-gradient-radial from-secondary/10 to-transparent rounded-full blur-3xl" />
            <GlobeScene onHover={handleHover} selectedDest={selectedDest} />
            
            {/* Hover tooltip */}
            {hoveredDest && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-lg border border-border rounded-xl px-4 py-3 shadow-lg"
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
                  : "Hover over the markers on the globe to explore destinations"
                }
              </p>
            </div>

            {/* Destination Grid */}
            <div className="grid grid-cols-2 gap-3">
              {DESTINATIONS.slice(0, 6).map((dest) => (
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
