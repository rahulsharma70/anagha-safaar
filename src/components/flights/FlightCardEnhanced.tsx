import { motion } from "framer-motion";
import { Plane, Luggage, Utensils, Wifi, Users, ChevronDown, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FlightStatusBadge from "./FlightStatusBadge";
import LiveFlightTracker from "./LiveFlightTracker";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  price_economy: number | null;
  price_business: number | null;
  available_seats: number | null;
  is_featured: boolean | null;
}

interface FlightCardEnhancedProps {
  flight: Flight;
  flightClass: string;
}

const airlineLogos: Record<string, { logo: string; color: string }> = {
  "IndiGo": { logo: "🔵", color: "bg-blue-500/10 border-blue-500/30" },
  "Air India": { logo: "🟠", color: "bg-orange-500/10 border-orange-500/30" },
  "SpiceJet": { logo: "🔴", color: "bg-red-500/10 border-red-500/30" },
  "Vistara": { logo: "🟣", color: "bg-purple-500/10 border-purple-500/30" },
  "Go First": { logo: "🟢", color: "bg-green-500/10 border-green-500/30" },
  "Akasa Air": { logo: "🟡", color: "bg-yellow-500/10 border-yellow-500/30" },
  "default": { logo: "✈️", color: "bg-primary/10 border-primary/30" }
};

const FlightCardEnhanced = ({ flight, flightClass }: FlightCardEnhancedProps) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [viewingUsers] = useState(Math.floor(Math.random() * 20) + 5);
  
  const airlineInfo = airlineLogos[flight.airline] || airlineLogos.default;
  const price = flightClass === "business" ? flight.price_business : flight.price_economy;
  
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short'
    });
  };

  const getDuration = () => {
    const dep = new Date(flight.departure_time);
    const arr = new Date(flight.arrival_time);
    const diff = arr.getTime() - dep.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 group">
        <CardContent className="p-0">
          {/* Social Proof Banner */}
          {flight.is_featured && (
            <div className="bg-gradient-to-r from-accent/20 to-secondary/20 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-accent text-accent-foreground">Best Deal</Badge>
                <span className="text-xs text-muted-foreground">Lowest price for this route</span>
              </div>
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Users className="w-3 h-3 text-destructive" />
                <span className="text-destructive font-medium">{viewingUsers} people viewing</span>
              </motion.div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row">
            {/* Airline Info */}
            <div className={`p-4 lg:p-6 lg:w-44 flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2 border-b lg:border-b-0 lg:border-r border-border/30 ${airlineInfo.color}`}>
              <div className="text-3xl">{airlineInfo.logo}</div>
              <div>
                <h3 className="font-bold">{flight.airline}</h3>
                <p className="text-sm text-muted-foreground">{flight.flight_number}</p>
              </div>
              <div className="ml-auto lg:ml-0 lg:mt-2">
                <FlightStatusBadge 
                  departureTime={flight.departure_time}
                  arrivalTime={flight.arrival_time}
                />
              </div>
            </div>

            {/* Flight Details */}
            <div className="flex-1 p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                {/* Departure */}
                <div className="text-center lg:text-left">
                  <p className="text-2xl lg:text-3xl font-bold">{formatTime(flight.departure_time)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(flight.departure_time)}</p>
                  <p className="font-semibold mt-1">{flight.departure_city}</p>
                </div>

                {/* Duration & Tracker */}
                <div className="flex-1 px-4 lg:px-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{getDuration()}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs">Non-stop</Badge>
                        </TooltipTrigger>
                        <TooltipContent>Direct flight with no layovers</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <LiveFlightTracker
                    departureTime={flight.departure_time}
                    arrivalTime={flight.arrival_time}
                    departureCity={flight.departure_city}
                    arrivalCity={flight.arrival_city}
                  />
                </div>

                {/* Arrival */}
                <div className="text-center lg:text-right">
                  <p className="text-2xl lg:text-3xl font-bold">{formatTime(flight.arrival_time)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(flight.arrival_time)}</p>
                  <p className="font-semibold mt-1">{flight.arrival_city}</p>
                </div>
              </div>

              {/* Amenities Row */}
              <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Luggage className="w-4 h-4" />
                      <span>15kg</span>
                    </TooltipTrigger>
                    <TooltipContent>15kg check-in baggage included</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Utensils className="w-4 h-4" />
                      <span>Meal</span>
                    </TooltipTrigger>
                    <TooltipContent>Complimentary meal service</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {flightClass === "business" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Wifi className="w-4 h-4" />
                        <span>WiFi</span>
                      </TooltipTrigger>
                      <TooltipContent>In-flight WiFi available</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <span>View Details</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Expandable Details */}
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-border/30"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Aircraft</p>
                      <p className="font-medium">Airbus A320</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cabin Baggage</p>
                      <p className="font-medium">7 kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-in Baggage</p>
                      <p className="font-medium">{flightClass === "business" ? "30 kg" : "15 kg"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cancellation</p>
                      <p className="font-medium text-secondary">Free cancellation*</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Pricing Section */}
            <div className="p-4 lg:p-6 lg:w-56 flex lg:flex-col items-center justify-between lg:justify-center bg-gradient-to-br from-primary/5 to-secondary/5 border-t lg:border-t-0 lg:border-l border-border/30">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {flightClass === "business" ? "Business" : "Economy"}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl lg:text-4xl font-bold text-primary">
                    ₹{price?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">per person</p>
                
                {/* Seat Urgency */}
                <p className={`text-xs font-semibold mt-2 ${
                  flight.available_seats && flight.available_seats < 10 
                    ? 'text-destructive animate-pulse' 
                    : 'text-muted-foreground'
                }`}>
                  {flight.available_seats && flight.available_seats < 10 
                    ? `🔥 Only ${flight.available_seats} seats left!` 
                    : `${flight.available_seats || 0} seats available`}
                </p>
              </div>
              
              <Button 
                onClick={() => navigate(`/flights/${flight.id}`)}
                className="w-full mt-4 rounded-xl bg-primary hover:bg-primary/90 shadow-lg"
                size="lg"
              >
                Book Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FlightCardEnhanced;
