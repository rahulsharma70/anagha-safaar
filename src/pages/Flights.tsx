import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plane, Calendar, Users, ArrowRight, Sparkles, Filter, ArrowLeftRight } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CityAutocomplete from "@/components/CityAutocomplete";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import FlightDealsBanner from "@/components/flights/FlightDealsBanner";
import FlightTrustBadges from "@/components/flights/FlightTrustBadges";
import FlightSortBar from "@/components/flights/FlightSortBar";
import FlightFilters, { FilterState } from "@/components/flights/FlightFilters";
import FlightCardEnhanced from "@/components/flights/FlightCardEnhanced";

const Flights = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [flightClass, setFlightClass] = useState("economy");
  const [tripType, setTripType] = useState("oneway");
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    stops: [],
    airlines: [],
    departureTime: [],
    priceRange: [0, 50000],
    fareType: []
  });

  // Enable realtime updates
  useRealtimeData("flights", ["flights"]);

  const { data: flights, isLoading } = useQuery({
    queryKey: ["flights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const filteredFlights = useMemo(() => {
    if (!flights) return [];
    
    // Filter flights with available seats
    let availableFlights = flights.filter((flight) => {
      return flight.available_seats && flight.available_seats > 0;
    });

    // Apply search criteria
    if (origin) {
      availableFlights = availableFlights.filter(flight =>
        flight.departure_city.toLowerCase().includes(origin.toLowerCase())
      );
    }

    if (destination) {
      availableFlights = availableFlights.filter(flight =>
        flight.arrival_city.toLowerCase().includes(destination.toLowerCase())
      );
    }

    // Apply price range filter
    availableFlights = availableFlights.filter(flight => {
      const price = flightClass === "business" ? flight.price_business : flight.price_economy;
      return price && price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        availableFlights.sort((a, b) => {
          const priceA = flightClass === "business" ? a.price_business : a.price_economy;
          const priceB = flightClass === "business" ? b.price_business : b.price_economy;
          return (priceA || 0) - (priceB || 0);
        });
        break;
      case "price-high":
        availableFlights.sort((a, b) => {
          const priceA = flightClass === "business" ? a.price_business : a.price_economy;
          const priceB = flightClass === "business" ? b.price_business : b.price_economy;
          return (priceB || 0) - (priceA || 0);
        });
        break;
      case "departure":
        availableFlights.sort((a, b) => 
          new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
        );
        break;
      case "duration":
        availableFlights.sort((a, b) => {
          const durationA = new Date(a.arrival_time).getTime() - new Date(a.departure_time).getTime();
          const durationB = new Date(b.arrival_time).getTime() - new Date(b.departure_time).getTime();
          return durationA - durationB;
        });
        break;
      default:
        // Popular - featured first
        availableFlights.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return availableFlights;
  }, [flights, origin, destination, filters, sortBy, flightClass]);

  const swapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const popularRoutes = [
    { from: "Delhi", to: "Mumbai", price: "₹3,499", discount: "20% OFF" },
    { from: "Bangalore", to: "Delhi", price: "₹4,199", discount: "15% OFF" },
    { from: "Mumbai", to: "Goa", price: "₹2,999", discount: "30% OFF" },
    { from: "Chennai", to: "Kolkata", price: "₹3,799", discount: "10% OFF" },
    { from: "Hyderabad", to: "Pune", price: "₹2,599", discount: "25% OFF" },
    { from: "Delhi", to: "Jaipur", price: "₹1,999", discount: "40% OFF" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
          {/* Background with Gradient */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/70 to-background" />
          
          {/* Animated Plane */}
          <motion.div
            animate={{ 
              x: ["-100%", "200%"],
              y: [0, -50, 0]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-32 opacity-20"
          >
            <Plane className="w-20 h-20 text-white rotate-45" />
          </motion.div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-primary-foreground text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Lowest Price Guarantee
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4 leading-tight">
                Search & Book
                <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                  Cheap Flights
                </span>
              </h1>
              <p className="text-lg text-primary-foreground/90 max-w-xl mx-auto mb-8">
                Compare 100+ airlines and find the best deals instantly
              </p>
            </motion.div>

            {/* Enhanced Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-5xl mx-auto"
            >
              <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border/50">
                {/* Trip Type Selector */}
                <div className="flex gap-4 mb-4">
                  {["oneway", "roundtrip"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTripType(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        tripType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {type === "oneway" ? "One Way" : "Round Trip"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* From */}
                  <div className="md:col-span-3">
                    <CityAutocomplete
                      value={origin}
                      onChange={setOrigin}
                      placeholder="From (City)"
                    />
                  </div>
                  
                  {/* Swap Button */}
                  <div className="md:col-span-1 flex justify-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={swapCities}
                      className="rounded-full h-10 w-10 border-2 border-primary/30 hover:border-primary hover:bg-primary/10"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* To */}
                  <div className="md:col-span-3">
                    <CityAutocomplete
                      value={destination}
                      onChange={setDestination}
                      placeholder="To (City)"
                      iconColor="text-primary"
                    />
                  </div>
                  
                  {/* Depart Date */}
                  <div className="md:col-span-2 relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      type="date"
                      value={departDate}
                      onChange={(e) => setDepartDate(e.target.value)}
                      className="pl-11 h-14 rounded-xl border-border/50 bg-background/50"
                      placeholder="Departure"
                    />
                  </div>

                  {/* Return Date */}
                  {tripType === "roundtrip" && (
                    <div className="md:col-span-2 relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="pl-11 h-14 rounded-xl border-border/50 bg-background/50"
                        placeholder="Return"
                      />
                    </div>
                  )}
                  
                  {/* Search Button */}
                  <div className={tripType === "roundtrip" ? "md:col-span-1" : "md:col-span-3"}>
                    <Button className="h-14 w-full text-base rounded-xl bg-primary hover:bg-primary/90 shadow-lg">
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/30">
                  <Select value={flightClass} onValueChange={setFlightClass}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-background/50">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium-economy">Premium Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First Class</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={passengers} onValueChange={setPassengers}>
                    <SelectTrigger className="w-[150px] rounded-xl bg-background/50">
                      <Users className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Passengers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Adult</SelectItem>
                      <SelectItem value="2">2 Adults</SelectItem>
                      <SelectItem value="3">3 Adults</SelectItem>
                      <SelectItem value="4">4+ Adults</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    <span>🔒 Secure Booking</span>
                    <span>•</span>
                    <span>✓ Free Cancellation</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Deals Banner */}
        <FlightDealsBanner />

        {/* Trust Badges */}
        <FlightTrustBadges />

        {/* Popular Routes */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">Popular Routes</h2>
            <p className="text-muted-foreground">Grab the best deals on trending routes</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {popularRoutes.map((route, index) => (
              <motion.div
                key={`${route.from}-${route.to}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -3 }}
                className="bg-card border border-border/50 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all relative overflow-hidden group"
                onClick={() => {
                  setOrigin(route.from);
                  setDestination(route.to);
                }}
              >
                {route.discount && (
                  <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {route.discount}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{route.from}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-sm">{route.to}</span>
                </div>
                <div className="text-primary font-bold">
                  Starting {route.price}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Flights List with Filters */}
        <section className="container mx-auto px-4 pb-16">
          <FlightSortBar 
            sortBy={sortBy} 
            onSortChange={setSortBy} 
            totalFlights={filteredFlights.length}
          />

          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <FlightFilters 
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>

            {/* Mobile Filter Toggle */}
            <Button 
              variant="outline" 
              className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full shadow-lg"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            {/* Flight Results */}
            <div className="flex-1">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                  ))}
                </div>
              ) : filteredFlights.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {filteredFlights.map((flight) => (
                    <FlightCardEnhanced 
                      key={flight.id} 
                      flight={flight}
                      flightClass={flightClass}
                    />
                  ))}
                </motion.div>
              ) : flights && flights.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-muted/30 rounded-3xl"
                >
                  <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No flights match your search
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button variant="outline" onClick={() => {
                    setOrigin("");
                    setDestination("");
                    setFilters({
                      stops: [],
                      airlines: [],
                      departureTime: [],
                      priceRange: [0, 50000],
                      fareType: []
                    });
                  }}>
                    Clear All Filters
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-muted/30 rounded-3xl"
                >
                  <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No flights available yet
                  </h3>
                  <p className="text-muted-foreground">
                    Check back soon for amazing flight deals!
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Flights;
