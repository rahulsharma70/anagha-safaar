import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Wifi, Coffee, Waves, Dumbbell, ArrowLeft } from "lucide-react";
import { useState } from "react";

const HotelDetail = () => {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: hotel, isLoading } = useQuery({
    queryKey: ["hotel", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const amenityIcons: Record<string, any> = {
    "WiFi": Wifi,
    "Swimming Pool": Waves,
    "Pool": Waves,
    "Spa": Star,
    "Fitness Center": Dumbbell,
    "Restaurant": Coffee,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full rounded-2xl mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Hotel Not Found</h1>
          <Link to="/hotels">
            <Button variant="hero">Back to Hotels</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const images = (hotel.images as string[]) || [];
  const amenities = (hotel.amenities as string[]) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Back Button */}
        <div className="container mx-auto px-4 py-6">
          <Link to="/hotels">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Hotels
            </Button>
          </Link>
        </div>

        {/* Gallery */}
        <section className="container mx-auto px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Main Image */}
            <div className="lg:col-span-2 h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
              <img
                src={images[selectedImage] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200"}
                alt={hotel.name}
                className="w-full h-full object-cover hover:scale-105 transition-smooth duration-700"
              />
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="lg:col-span-2 flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-smooth ${
                    selectedImage === idx ? "border-accent" : "border-transparent"
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                {hotel.is_featured && (
                  <Badge className="mb-3 gradient-gold text-accent-foreground">Featured</Badge>
                )}
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{hotel.name}</h1>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-5 w-5" />
                    <span>{hotel.location_city}, {hotel.location_state}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(hotel.star_rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">About This Property</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {hotel.description}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((amenity, idx) => {
                    const Icon = amenityIcons[amenity] || Star;
                    return (
                      <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-accent" />
                        <span className="text-sm font-medium">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Availability */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Availability</h2>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Available Rooms</p>
                      <p className="text-3xl font-bold text-accent">{hotel.available_rooms}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {hotel.available_rooms > 50 ? "High Availability" : "Limited Availability"}
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 p-6 shadow-lg">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Price per night</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-bold text-accent">
                        ₹{Number(hotel.price_per_night).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/night</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Check-in</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Check-out</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Guests</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        defaultValue="2"
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>

                  <Button variant="hero" size="lg" className="w-full">
                    Book Now
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    You won't be charged yet
                  </p>

                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cancellation</span>
                      <span className="font-medium text-success">Free</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HotelDetail;
