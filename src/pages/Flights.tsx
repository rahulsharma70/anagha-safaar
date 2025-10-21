import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Clock, Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";

const Flights = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  const { data: flights, isLoading } = useQuery({
    queryKey: ["flights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("departure_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const filteredFlights = useMemo(() => {
    if (!flights) return [];
    
    return flights.filter((flight) => {
      const matchesSearch = searchQuery === "" || 
        flight.departure_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flight.arrival_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flight.airline.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPrice = priceFilter === "all" || 
        (priceFilter === "low" && Number(flight.price_economy) < 5000) ||
        (priceFilter === "medium" && Number(flight.price_economy) >= 5000 && Number(flight.price_economy) < 10000) ||
        (priceFilter === "high" && Number(flight.price_economy) >= 10000);
      
      return matchesSearch && matchesPrice;
    });
  }, [flights, searchQuery, priceFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-hero py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4">
              Flight Bookings
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Find the best flight deals for your next adventure
            </p>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by city or airline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">Under ₹5,000</SelectItem>
                <SelectItem value="medium">₹5,000 - ₹10,000</SelectItem>
                <SelectItem value="high">Above ₹10,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Flights List */}
        <section className="container mx-auto px-4 pb-20">
          {isLoading ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredFlights.length > 0 ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {filteredFlights.map((flight) => (
                <Card key={flight.id} className="p-6 hover:shadow-lg transition-smooth">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-accent/10">
                          <Plane className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{flight.airline}</h3>
                          <p className="text-sm text-muted-foreground">
                            Flight {flight.flight_number}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">From</p>
                          <p className="font-semibold">{flight.departure_city}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(flight.departure_time), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(flight.departure_time), "HH:mm")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">To</p>
                          <p className="font-semibold">{flight.arrival_city}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(flight.arrival_time), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(flight.arrival_time), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Starting from</p>
                        <p className="text-3xl font-bold text-accent">
                          ₹{Number(flight.price_economy).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">per person</p>
                      </div>
                      <Button variant="hero" className="w-full" onClick={() => navigate(`/flights/${flight.id}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : flights && flights.length > 0 ? (
            <div className="text-center py-20 max-w-4xl mx-auto">
              <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                No flights match your filters
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                No flights available yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for flight bookings!
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Flights;
