import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, MapPin, Calendar, Users, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [starFilter, setStarFilter] = useState<string>("all");
  const [checkInDate, setCheckInDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [checkOutDate, setCheckOutDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [adults, setAdults] = useState<number>(2);
  const [rooms, setRooms] = useState<number>(1);
  const [useRealAPI, setUseRealAPI] = useState<boolean>(false);

  // Local Supabase data query
  const { data: localHotels, isLoading: isLoadingLocal } = useQuery({
    queryKey: ["hotels-local"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const hotels = localHotels;
  const isLoading = isLoadingLocal;

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    
    return hotels.filter((hotel) => {
      // Handle both local Supabase data and API data structures
      const hotelName = useRealAPI ? hotel.name : hotel.name;
      const hotelPrice = useRealAPI ? hotel.price : hotel.price_per_night;
      const hotelRating = useRealAPI ? hotel.starRating : hotel.star_rating;
      const hotelLocation = useRealAPI ? hotel.location.city : hotel.location_city;
      
      const matchesSearch = searchQuery === "" || 
        hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotelLocation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPrice = priceFilter === "all" || 
        (priceFilter === "low" && Number(hotelPrice) < 3000) ||
        (priceFilter === "medium" && Number(hotelPrice) >= 3000 && Number(hotelPrice) < 7000) ||
        (priceFilter === "high" && Number(hotelPrice) >= 7000);
      
      const matchesStar = starFilter === "all" || 
        String(hotelRating) === starFilter;
      
      return matchesSearch && matchesPrice && matchesStar;
    });
  }, [hotels, searchQuery, priceFilter, starFilter, useRealAPI]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-hero py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4">
              Luxury Hotels
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Discover handpicked accommodations that blend comfort, elegance, and exceptional service
            </p>
          </div>
        </section>

        {/* Enhanced Search & Filters */}
        <section className="container mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Hotels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City or Airport Code (e.g., DEL, BOM)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="low">Under ₹3,000</SelectItem>
                      <SelectItem value="medium">₹3,000 - ₹7,000</SelectItem>
                      <SelectItem value="high">Above ₹7,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={starFilter} onValueChange={setStarFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Star Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
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
                    Failed to fetch live hotel data. Showing sample data instead.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Hotels Grid */}
        <section className="container mx-auto px-4 pb-20">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-2xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => {
                // Handle both API and local data structures
                const hotelId = useRealAPI ? hotel.id : hotel.id;
                const hotelSlug = useRealAPI ? hotel.id : hotel.slug;
                const hotelImages = useRealAPI ? hotel.images : hotel.images;
                const hotelName = useRealAPI ? hotel.name : hotel.name;
                const hotelLocation = useRealAPI 
                  ? `${hotel.location.city}, ${hotel.location.country}`
                  : `${hotel.location_city}, ${hotel.location_state}`;
                const hotelRating = useRealAPI ? hotel.starRating : hotel.star_rating;
                const hotelPrice = useRealAPI ? hotel.price : hotel.price_per_night;
                const hotelFeatured = useRealAPI ? false : hotel.is_featured;
                
                return (
                  <Link key={hotelId} to={`/hotels/${hotelSlug}`}>
                    <PackageCard
                      image={
                        (hotelImages as string[])?.[0] ||
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
                      }
                      title={hotelName}
                      location={hotelLocation}
                      duration={`${hotelRating}⭐ Hotel`}
                      rating={hotelRating || 4.5}
                      reviews={Math.floor(Math.random() * 300) + 50}
                      price={Number(hotelPrice)}
                      badge={hotelFeatured ? "Featured" : useRealAPI ? "Live" : undefined}
                    />
                  </Link>
                );
              })}
            </div>
          ) : hotels && hotels.length > 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                No hotels match your filters
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                No hotels available yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for amazing hotel listings!
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Hotels;
