import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, MapPin, Calendar, Users, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";

const Flights = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [originCity, setOriginCity] = useState<string>("DEL");
  const [destinationCity, setDestinationCity] = useState<string>("BOM");
  const [departureDate, setDepartureDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [returnDate, setReturnDate] = useState<string>(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);
  const [travelClass, setTravelClass] = useState<string>("ECONOMY");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [useRealAPI, setUseRealAPI] = useState<boolean>(false);

  // Local Supabase data query
  const { data: localFlights, isLoading: isLoadingLocal } = useQuery({
    queryKey: ["flights-local"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("departure_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const flights = localFlights;
  const isLoading = isLoadingLocal;

  const filteredFlights = useMemo(() => {
    if (!flights) return [];
    
    return flights.filter((flight) => {
      const flightPrice = flight.price_economy;
      const flightAirline = flight.airline;
      const flightDeparture = flight.departure_city;
      const flightArrival = flight.arrival_city;
      
      const matchesPrice = priceFilter === "all" || 
        (priceFilter === "low" && Number(flightPrice) < 5000) ||
        (priceFilter === "medium" && Number(flightPrice) >= 5000 && Number(flightPrice) < 10000) ||
        (priceFilter === "high" && Number(flightPrice) >= 10000);
      
      return matchesPrice;
    });
  }, [flights, priceFilter, useRealAPI]);

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

        {/* Enhanced Search & Filters */}
        <section className="container mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Search Flights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="From (e.g., DEL)"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="To (e.g., BOM)"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={adults.toString()} onValueChange={(value) => setAdults(parseInt(value))}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Adults" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Adult{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={children.toString()} onValueChange={(value) => setChildren(parseInt(value))}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Children" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Child{num > 1 ? 'ren' : num === 1 ? '' : 'ren'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={travelClass} onValueChange={setTravelClass}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Economy</SelectItem>
                      <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="FIRST">First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-[200px]">
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
                
                <div className="flex gap-2">
                  <Button
                    variant={useRealAPI ? "default" : "outline"}
                    onClick={() => setUseRealAPI(!useRealAPI)}
                    className="flex items-center gap-2"
                  >
                    {useRealAPI ? "Live Search" : "Sample Data"}
                  </Button>
                  {useRealAPI && (
                    <Button
                      variant="outline"
                      onClick={() => refetchAPI()}
                      disabled={isLoadingAPI}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingAPI ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
              
              {apiError && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to fetch live flight data. Showing sample data instead.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
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
              {filteredFlights.map((flight) => {
                // Handle both API and local data structures
                const flightId = useRealAPI ? flight.id : flight.id;
                const flightAirline = useRealAPI ? flight.airline : flight.airline;
                const flightNumber = useRealAPI ? flight.flightNumber : flight.flight_number;
                const flightDepartureCity = useRealAPI ? flight.departure.city : flight.departure_city;
                const flightArrivalCity = useRealAPI ? flight.arrival.city : flight.arrival_city;
                const flightDepartureTime = useRealAPI ? flight.departure.time : flight.departure_time;
                const flightArrivalTime = useRealAPI ? flight.arrival.time : flight.arrival_time;
                const flightPrice = useRealAPI ? flight.price : flight.price_economy;
                
                return (
                  <Card key={flightId} className="p-6 hover:shadow-lg transition-smooth">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-accent/10">
                            <Plane className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{flightAirline}</h3>
                            <p className="text-sm text-muted-foreground">
                              Flight {flightNumber}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">From</p>
                            <p className="font-semibold">{flightDepartureCity}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(flightDepartureTime), "MMM dd, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(flightDepartureTime), "HH:mm")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">To</p>
                            <p className="font-semibold">{flightArrivalCity}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(flightArrivalTime), "MMM dd, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(flightArrivalTime), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Starting from</p>
                          <p className="text-3xl font-bold text-accent">
                            ₹{Number(flightPrice).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">per person</p>
                        </div>
                        <Button variant="hero" className="w-full" onClick={() => navigate(`/flights/${flightId}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
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
