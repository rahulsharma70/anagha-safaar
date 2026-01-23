import { motion } from "framer-motion";
import { Plane, Radio } from "lucide-react";
import { useEffect, useState } from "react";

interface LiveFlightTrackerProps {
  departureTime: string;
  arrivalTime: string;
  departureCity: string;
  arrivalCity: string;
}

const calculateProgress = (departureTime: string, arrivalTime: string): number => {
  const now = new Date();
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);
  
  if (now < departure) return 0;
  if (now > arrival) return 100;
  
  const totalDuration = arrival.getTime() - departure.getTime();
  const elapsed = now.getTime() - departure.getTime();
  
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};

export const LiveFlightTracker = ({ 
  departureTime, 
  arrivalTime, 
  departureCity, 
  arrivalCity 
}: LiveFlightTrackerProps) => {
  const [progress, setProgress] = useState(calculateProgress(departureTime, arrivalTime));
  const [isInFlight, setIsInFlight] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress = calculateProgress(departureTime, arrivalTime);
      setProgress(newProgress);
      setIsInFlight(newProgress > 0 && newProgress < 100);
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [departureTime, arrivalTime]);
  
  return (
    <div className="flex-1 mx-4 md:mx-8">
      {/* Live indicator */}
      {isInFlight && (
        <motion.div 
          className="flex items-center justify-center gap-1.5 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-destructive"
          />
          <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Live</span>
        </motion.div>
      )}
      
      {/* Track */}
      <div className="relative">
        {/* Background track */}
        <div className="h-1 bg-border rounded-full overflow-hidden">
          {/* Progress fill */}
          <motion.div 
            className="h-full bg-gradient-to-r from-primary via-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Departure dot */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
          <div className={`w-3 h-3 rounded-full border-2 ${progress > 0 ? 'bg-primary border-primary' : 'bg-background border-border'}`} />
        </div>
        
        {/* Plane icon */}
        <motion.div 
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${Math.min(95, Math.max(5, progress))}%` }}
          animate={isInFlight ? { 
            y: [-2, 2, -2],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative -translate-x-1/2">
            <motion.div
              animate={isInFlight ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Plane className={`w-5 h-5 rotate-90 ${isInFlight ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
            
            {/* Trail effect when in flight */}
            {isInFlight && (
              <motion.div
                className="absolute top-1/2 right-full -translate-y-1/2 flex gap-0.5"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 h-1 rounded-full bg-primary/40"
                    style={{ opacity: 1 - i * 0.3 }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
        
        {/* Arrival dot */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
          <div className={`w-3 h-3 rounded-full border-2 ${progress >= 100 ? 'bg-green-500 border-green-500' : 'bg-background border-border'}`} />
        </div>
      </div>
      
      {/* Duration label */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">Direct Flight</span>
        {isInFlight && (
          <motion.span 
            className="text-xs text-primary font-medium flex items-center gap-1"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Radio className="w-3 h-3" />
            Tracking
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default LiveFlightTracker;
