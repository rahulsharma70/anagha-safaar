import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

const Flights = () => {
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

        {/* Flights List */}
        <section className="container mx-auto px-4 py-20">
          {isLoading ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : flights && flights.length > 0 ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {flights.map((flight) => (
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
                      <Button variant="hero" className="w-full">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
