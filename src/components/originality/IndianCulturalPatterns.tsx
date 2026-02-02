import { motion } from "framer-motion";

// Madhubani-inspired SVG pattern
export const MadhubaniPattern = ({ className = "" }: { className?: string }) => (
  <svg
    className={`absolute inset-0 w-full h-full opacity-5 pointer-events-none ${className}`}
    viewBox="0 0 200 200"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="madhubani" patternUnits="userSpaceOnUse" width="50" height="50">
        {/* Lotus pattern */}
        <g fill="none" stroke="currentColor" strokeWidth="0.5">
          <ellipse cx="25" cy="25" rx="10" ry="5" transform="rotate(0 25 25)" />
          <ellipse cx="25" cy="25" rx="10" ry="5" transform="rotate(45 25 25)" />
          <ellipse cx="25" cy="25" rx="10" ry="5" transform="rotate(90 25 25)" />
          <ellipse cx="25" cy="25" rx="10" ry="5" transform="rotate(135 25 25)" />
          <circle cx="25" cy="25" r="3" />
          {/* Corner dots */}
          <circle cx="5" cy="5" r="1" fill="currentColor" />
          <circle cx="45" cy="5" r="1" fill="currentColor" />
          <circle cx="5" cy="45" r="1" fill="currentColor" />
          <circle cx="45" cy="45" r="1" fill="currentColor" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#madhubani)" />
  </svg>
);

// Warli-inspired SVG pattern
export const WarliPattern = ({ className = "" }: { className?: string }) => (
  <svg
    className={`absolute inset-0 w-full h-full opacity-5 pointer-events-none ${className}`}
    viewBox="0 0 200 200"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="warli" patternUnits="userSpaceOnUse" width="60" height="60">
        <g fill="none" stroke="currentColor" strokeWidth="0.5">
          {/* Warli human figure */}
          <circle cx="30" cy="15" r="3" />
          <line x1="30" y1="18" x2="30" y2="30" />
          <line x1="30" y1="22" x2="22" y2="28" />
          <line x1="30" y1="22" x2="38" y2="28" />
          <line x1="30" y1="30" x2="24" y2="40" />
          <line x1="30" y1="30" x2="36" y2="40" />
          {/* Triangle (hut) */}
          <path d="M10 55 L20 45 L30 55 Z" />
          {/* Sun spiral */}
          <circle cx="50" cy="15" r="5" />
          <circle cx="50" cy="15" r="3" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#warli)" />
  </svg>
);

// Paisley pattern
export const PaisleyPattern = ({ className = "" }: { className?: string }) => (
  <svg
    className={`absolute inset-0 w-full h-full opacity-5 pointer-events-none ${className}`}
    viewBox="0 0 200 200"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="paisley" patternUnits="userSpaceOnUse" width="40" height="40">
        <g fill="none" stroke="currentColor" strokeWidth="0.5">
          <path d="M20 5 C8 5 5 15 5 20 C5 30 15 35 20 35 C28 35 30 25 28 18 C26 12 22 10 20 10 C17 10 15 14 15 17 C15 22 18 24 20 24" />
          <circle cx="20" cy="17" r="2" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#paisley)" />
  </svg>
);

// Rangoli-inspired border component
export const RangoliBorder = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Corner decorations */}
    <svg className="absolute top-0 left-0 w-12 h-12 text-accent/20" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.3" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <circle
          key={angle}
          cx={24 + 20 * Math.cos((angle * Math.PI) / 180)}
          cy={24 + 20 * Math.sin((angle * Math.PI) / 180)}
          r="2"
          fill="currentColor"
        />
      ))}
    </svg>
    <svg className="absolute top-0 right-0 w-12 h-12 text-accent/20 rotate-90" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.3" />
    </svg>
    <svg className="absolute bottom-0 left-0 w-12 h-12 text-accent/20 -rotate-90" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.3" />
    </svg>
    <svg className="absolute bottom-0 right-0 w-12 h-12 text-accent/20 rotate-180" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.3" />
    </svg>
    {children}
  </div>
);

// Animated Diya (lamp) component
export const AnimatedDiya = ({ className = "" }: { className?: string }) => (
  <motion.div
    className={`relative ${className}`}
    animate={{ scale: [1, 1.02, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <svg viewBox="0 0 60 80" className="w-full h-full">
      {/* Flame */}
      <motion.ellipse
        cx="30"
        cy="20"
        rx="8"
        ry="15"
        fill="url(#flameGradient)"
        animate={{
          scaleX: [1, 1.1, 0.9, 1],
          scaleY: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Flame inner */}
      <motion.ellipse
        cx="30"
        cy="22"
        rx="4"
        ry="8"
        fill="#FFF"
        opacity="0.8"
        animate={{
          scaleX: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
        }}
      />
      {/* Diya base */}
      <path
        d="M15 45 Q15 35 30 35 Q45 35 45 45 L50 55 Q50 65 30 65 Q10 65 10 55 Z"
        fill="url(#diyaGradient)"
      />
      {/* Oil surface */}
      <ellipse cx="30" cy="38" rx="14" ry="4" fill="#8B4513" opacity="0.5" />
      <defs>
        <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF6600" />
          <stop offset="50%" stopColor="#FFCC00" />
          <stop offset="100%" stopColor="#FFFF66" />
        </linearGradient>
        <linearGradient id="diyaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CD853F" />
          <stop offset="50%" stopColor="#DEB887" />
          <stop offset="100%" stopColor="#CD853F" />
        </linearGradient>
      </defs>
    </svg>
    {/* Glow effect */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-400/30 blur-xl rounded-full" />
  </motion.div>
);

// Festival theme banner
export const FestivalBanner = ({ 
  festival, 
  children 
}: { 
  festival: "diwali" | "holi" | "default"; 
  children: React.ReactNode;
}) => {
  const themes = {
    diwali: {
      bg: "from-amber-900/20 via-orange-800/10 to-amber-900/20",
      border: "border-amber-500/30",
      accent: "text-amber-400",
    },
    holi: {
      bg: "from-pink-500/20 via-purple-500/10 to-cyan-500/20",
      border: "border-pink-500/30",
      accent: "text-pink-400",
    },
    default: {
      bg: "from-secondary/10 via-transparent to-accent/10",
      border: "border-secondary/20",
      accent: "text-secondary",
    },
  };

  const theme = themes[festival];

  return (
    <div className={`relative rounded-2xl bg-gradient-to-r ${theme.bg} border ${theme.border} overflow-hidden`}>
      {festival === "diwali" && (
        <>
          <AnimatedDiya className="absolute -top-2 -left-2 w-12 h-16 opacity-60" />
          <AnimatedDiya className="absolute -top-2 -right-2 w-12 h-16 opacity-60" />
        </>
      )}
      {children}
    </div>
  );
};
