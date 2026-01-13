import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plane, MapPin, Calendar, Users, ArrowRight, Clock, Sparkles, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const Flights = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [flightClass, setFlightClass] = useState("economy");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  const { data: flights, isLoading } = useQuery({
    queryKey: ["flights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredFlights = useMemo(() => {
    if (!flights) return [];
    
    return flights.filter((flight) => {
      const matchesOrigin = origin === "" || 
        flight.departure_city.toLowerCase().includes(origin.toLowerCase());
      
      const matchesDestination = destination === "" || 
        flight.arrival_city.toLowerCase().includes(destination.toLowerCase());
      
      const price = flightClass === "business" ? flight.price_business : flight.price_economy;
      const matchesPrice = priceFilter === "all" || 
        (priceFilter === "budget" && price && price <= 5000) ||
        (priceFilter === "mid" && price && price > 5000 && price <= 15000) ||
        (priceFilter === "premium" && price && price > 15000);
      
      return matchesOrigin && matchesDestination && matchesPrice;
    });
  }, [flights, origin, destination, priceFilter, flightClass]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const popularRoutes = [
    { from: "Delhi", to: "Mumbai", price: "₹3,499" },
    { from: "Bangalore", to: "Delhi", price: "₹4,199" },
    { from: "Mumbai", to: "Goa", price: "₹2,999" },
    { from: "Chennai", to: "Kolkata", price: "₹3,799" },
  ];

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Background with Gradient */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
          
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

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-24 h-24 bg-accent/20 rounded-full blur-xl"
          />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-primary-foreground text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Best Deals on Flights
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
                Book Your
                <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                  Flight
                </span>
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
                Compare prices, find the best deals, and fly to your dream destination
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
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* From */}
                  <div className="md:col-span-2 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="From (City)"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="pl-12 h-14 text-lg rounded-xl border-border/50 bg-background/50"
                    />
                  </div>
                  
                  {/* To */}
                  <div className="md:col-span-2 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      placeholder="To (City)"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-12 h-14 text-lg rounded-xl border-border/50 bg-background/50"
                    />
                  </div>
                  
                  {/* Depart Date */}
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={departDate}
                      onChange={(e) => setDepartDate(e.target.value)}
                      className="pl-12 h-14 rounded-xl border-border/50 bg-background/50"
                    />
                  </div>
                  
                  {/* Search Button */}
                  <Button className="h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 shadow-lg">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/30">
                  <Select value={flightClass} onValueChange={setFlightClass}>
                    <SelectTrigger className="w-[130px] rounded-xl bg-background/50">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={passengers} onValueChange={setPassengers}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-background/50">
                      <Users className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Passengers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Passenger</SelectItem>
                      <SelectItem value="2">2 Passengers</SelectItem>
                      <SelectItem value="3">3 Passengers</SelectItem>
                      <SelectItem value="4">4+ Passengers</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-background/50">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="budget">Under ₹5,000</SelectItem>
                      <SelectItem value="mid">₹5,000 - ₹15,000</SelectItem>
                      <SelectItem value="premium">₹15,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Popular Routes */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-2">Popular Routes</h2>
            <p className="text-muted-foreground">Trending flight routes with best prices</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularRoutes.map((route, index) => (
              <motion.div
                key={`${route.from}-${route.to}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="bg-card border border-border/50 rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => {
                  setOrigin(route.from);
                  setDestination(route.to);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{route.from}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{route.to}</span>
                </div>
                <div className="text-primary font-bold text-lg">
                  Starting {route.price}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Flights List */}
        <section className="container mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-3xl font-bold">
                {origin && destination ? `${origin} to ${destination}` : "Available Flights"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredFlights.length} flights found
              </p>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredFlights.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {filteredFlights.map((flight) => (
                <motion.div key={flight.id} variants={itemVariants}>
                  <Card className="hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-stretch">
                        {/* Airline Info */}
                        <div className="bg-muted/30 p-6 md:w-48 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border/30">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <Plane className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-bold text-center">{flight.airline}</h3>
                          <p className="text-sm text-muted-foreground">{flight.flight_number}</p>
                        </div>

                        {/* Flight Details */}
                        <div className="flex-1 p-6">
                          <div className="flex items-center justify-between">
                            {/* Departure */}
                            <div className="text-center">
                              <p className="text-2xl font-bold">{formatTime(flight.departure_time)}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(flight.departure_time)}</p>
                              <p className="font-medium mt-1">{flight.departure_city}</p>
                            </div>

                            {/* Duration */}
                            <div className="flex-1 mx-6 flex flex-col items-center">
                              <div className="flex items-center w-full">
                                <div className="h-[2px] flex-1 bg-border" />
                                <div className="mx-2">
                                  <Plane className="w-5 h-5 text-primary rotate-90" />
                                </div>
                                <div className="h-[2px] flex-1 bg-border" />
                              </div>
                              <span className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Direct Flight
                              </span>
                            </div>

                            {/* Arrival */}
                            <div className="text-center">
                              <p className="text-2xl font-bold">{formatTime(flight.arrival_time)}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(flight.arrival_time)}</p>
                              <p className="font-medium mt-1">{flight.arrival_city}</p>
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="bg-primary/5 p-6 md:w-56 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border/30 group-hover:bg-primary/10 transition-colors">
                          <p className="text-sm text-muted-foreground mb-1">
                            {flightClass === "business" ? "Business" : "Economy"}
                          </p>
                          <p className="text-3xl font-bold text-primary">
                            ₹{(flightClass === "business" ? flight.price_business : flight.price_economy)?.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">per person</p>
                          {flight.is_featured && (
                            <Badge className="bg-accent text-accent-foreground">Best Deal</Badge>
                          )}
                          <Button className="mt-3 w-full rounded-xl" onClick={() => navigate(`/flights/${flight.id}`)}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : flights && flights.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-muted/30 rounded-3xl"
            >
              <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No flights match your search
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => {
                setOrigin("");
                setDestination("");
                setPriceFilter("all");
              }}>
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-muted/30 rounded-3xl"
            >
              <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No flights available yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for amazing flight deals!
              </p>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Flights;
