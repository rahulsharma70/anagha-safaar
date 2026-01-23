import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, CheckCircle2, AlertCircle, Timer, CircleDot } from "lucide-react";
import { useEffect, useState } from "react";

type FlightStatus = "scheduled" | "boarding" | "departed" | "in-flight" | "landed" | "delayed" | "cancelled";

interface FlightStatusBadgeProps {
  departureTime: string;
  arrivalTime: string;
  className?: string;
}

const getFlightStatus = (departureTime: string, arrivalTime: string): FlightStatus => {
  const now = new Date();
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);
  
  const timeToDeparture = departure.getTime() - now.getTime();
  const timeToArrival = arrival.getTime() - now.getTime();
  const minutesToDeparture = Math.floor(timeToDeparture / (1000 * 60));
  
  // If arrival time has passed
  if (timeToArrival < 0) {
    return "landed";
  }
  
  // If departure time has passed but not arrived yet
  if (timeToDeparture < 0 && timeToArrival > 0) {
    return "in-flight";
  }
  
  // Within 30 minutes of departure - boarding
  if (minutesToDeparture <= 30 && minutesToDeparture > 0) {
    return "boarding";
  }
  
  // Within 2 hours of departure - scheduled/ready
  if (minutesToDeparture <= 120 && minutesToDeparture > 30) {
    return "scheduled";
  }
  
  // More than 2 hours away
  return "scheduled";
};

const getStatusConfig = (status: FlightStatus) => {
  switch (status) {
    case "boarding":
      return {
        label: "Boarding",
        color: "bg-amber-500/20 text-amber-600 border-amber-500/30",
        icon: CircleDot,
        pulse: true,
        description: "Gate open for boarding"
      };
    case "departed":
      return {
        label: "Departed",
        color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
        icon: Plane,
        pulse: false,
        description: "Flight has departed"
      };
    case "in-flight":
      return {
        label: "In Flight",
        color: "bg-sky-500/20 text-sky-600 border-sky-500/30",
        icon: Plane,
        pulse: true,
        description: "Currently flying"
      };
    case "landed":
      return {
        label: "Landed",
        color: "bg-green-500/20 text-green-600 border-green-500/30",
        icon: CheckCircle2,
        pulse: false,
        description: "Arrived at destination"
      };
    case "delayed":
      return {
        label: "Delayed",
        color: "bg-red-500/20 text-red-600 border-red-500/30",
        icon: AlertCircle,
        pulse: true,
        description: "Flight delayed"
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: "bg-destructive/20 text-destructive border-destructive/30",
        icon: AlertCircle,
        pulse: false,
        description: "Flight cancelled"
      };
    default:
      return {
        label: "On Time",
        color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
        icon: Clock,
        pulse: false,
        description: "Scheduled on time"
      };
  }
};

const getTimeUntilDeparture = (departureTime: string): string => {
  const now = new Date();
  const departure = new Date(departureTime);
  const diff = departure.getTime() - now.getTime();
  
  if (diff < 0) return "";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }
  
  return `in ${minutes}m`;
};

export const FlightStatusBadge = ({ departureTime, arrivalTime, className = "" }: FlightStatusBadgeProps) => {
  const [status, setStatus] = useState<FlightStatus>(getFlightStatus(departureTime, arrivalTime));
  const [countdown, setCountdown] = useState(getTimeUntilDeparture(departureTime));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getFlightStatus(departureTime, arrivalTime));
      setCountdown(getTimeUntilDeparture(departureTime));
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [departureTime, arrivalTime]);
  
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Badge 
          variant="outline" 
          className={`${config.color} px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 border`}
        >
          {config.pulse && (
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-current"
            />
          )}
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </Badge>
      </motion.div>
      
      {countdown && status === "scheduled" && (
        <motion.span 
          className="text-xs text-muted-foreground font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Departs {countdown}
        </motion.span>
      )}
    </div>
  );
};

export default FlightStatusBadge;
