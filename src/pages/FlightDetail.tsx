import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar, Clock, MapPin, Users, DollarSign, ArrowRight, Briefcase, Armchair } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FlightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [passengers, setPassengers] = useState(1);
  const [flightClass, setFlightClass] = useState<"economy" | "business">("economy");
  const [bookingDate, setBookingDate] = useState("");

  const { data: flight, isLoading } = useQuery({
    queryKey: ["flight", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please sign in to book");
      navigate("/auth");
      return;
    }

    if (!bookingDate) {
      toast.error("Please select a travel date");
      return;
    }

    try {
      const price = flightClass === "economy" ? flight?.price_economy : flight?.price_business;
      const bookingReference = 'BK' + crypto.randomUUID().slice(0, 8).toUpperCase();

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        item_id: flight?.id,
        item_type: "flight",
        booking_reference: bookingReference,
        start_date: bookingDate,
        guests_count: passengers,
        total_amount: price * passengers,
        status: "pending",
        payment_status: "pending",
        guest_details: { class: flightClass },
      });

      if (error) throw error;

      toast.success("Booking created! Complete payment to confirm.");
      navigate(`/booking-confirmation/${bookingReference}`, { 
        state: { bookingReference } 
      });
    } catch (error: any) {
      toast.error("Unable to process booking. Please try again.");
      console.error('Booking error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Flight Not Found</h1>
          <Button onClick={() => navigate("/flights")}>Back to Flights</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const departureTime = new Date(flight.departure_time);
  const arrivalTime = new Date(flight.arrival_time);
  const duration = Math.round((arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60 * 60));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/flights")} className="mb-6">
          ← Back to Flights
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl">{flight.airline}</CardTitle>
                  {flight.is_featured && (
                    <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">{flight.flight_number}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <MapPin className="h-6 w-6 mx-auto text-secondary mb-2" />
                    <p className="text-2xl font-bold">{flight.departure_city}</p>
                    <p className="text-sm text-muted-foreground">
                      {departureTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center">
                      <Plane className="h-8 w-8 mx-auto text-accent mb-2 rotate-90" />
                      <p className="text-sm text-muted-foreground">{duration}h flight</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <MapPin className="h-6 w-6 mx-auto text-secondary mb-2" />
                    <p className="text-2xl font-bold">{flight.arrival_city}</p>
                    <p className="text-sm text-muted-foreground">
                      {arrivalTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Flight Classes & Pricing</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className={flightClass === "economy" ? "border-secondary" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Armchair className="h-5 w-5" />
                            <span className="font-semibold">Economy</span>
                          </div>
                          <p className="text-xl font-bold text-accent">₹{Number(flight.price_economy).toLocaleString()}</p>
                        </div>
                        <Button 
                          variant={flightClass === "economy" ? "default" : "outline"} 
                          className="w-full mt-2"
                          onClick={() => setFlightClass("economy")}
                        >
                          {flightClass === "economy" ? "Selected" : "Select"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className={flightClass === "business" ? "border-secondary" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            <span className="font-semibold">Business</span>
                          </div>
                          <p className="text-xl font-bold text-accent">₹{Number(flight.price_business).toLocaleString()}</p>
                        </div>
                        <Button 
                          variant={flightClass === "business" ? "default" : "outline"} 
                          className="w-full mt-2"
                          onClick={() => setFlightClass("business")}
                        >
                          {flightClass === "business" ? "Selected" : "Select"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Book Your Flight</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Travel Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passengers">Number of Passengers</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max={flight.available_seats}
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {flight.available_seats} seats available
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Class:</span>
                    <span className="font-semibold capitalize">{flightClass}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price per person:</span>
                    <span>₹{Number(flightClass === "economy" ? flight.price_economy : flight.price_business).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Passengers:</span>
                    <span>{passengers}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-accent">
                      ₹{(Number(flightClass === "economy" ? flight.price_economy : flight.price_business) * passengers).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handleBooking}>
                  Book Now
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Free cancellation up to 24 hours before departure
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FlightDetail;
