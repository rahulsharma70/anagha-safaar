import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [starFilter, setStarFilter] = useState<string>("all");

  const { data: hotels, isLoading } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    
    return hotels.filter((hotel) => {
      const matchesSearch = searchQuery === "" || 
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location_state.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPrice = priceFilter === "all" || 
        (priceFilter === "low" && Number(hotel.price_per_night) < 3000) ||
        (priceFilter === "medium" && Number(hotel.price_per_night) >= 3000 && Number(hotel.price_per_night) < 7000) ||
        (priceFilter === "high" && Number(hotel.price_per_night) >= 7000);
      
      const matchesStar = starFilter === "all" || 
        String(hotel.star_rating) === starFilter;
      
      return matchesSearch && matchesPrice && matchesStar;
    });
  }, [hotels, searchQuery, priceFilter, starFilter]);

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

        {/* Search & Filters */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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
              <SelectTrigger className="w-full md:w-[180px]">
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
              {filteredHotels.map((hotel) => (
                <Link key={hotel.id} to={`/hotels/${hotel.slug}`}>
                  <PackageCard
                    image={
                      (hotel.images as string[])?.[0] ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
                    }
                    title={hotel.name}
                    location={`${hotel.location_city}, ${hotel.location_state}`}
                    duration={`${hotel.star_rating}⭐ Hotel`}
                    rating={hotel.star_rating || 4.5}
                    reviews={Math.floor(Math.random() * 300) + 50}
                    price={Number(hotel.price_per_night)}
                    badge={hotel.is_featured ? "Featured" : undefined}
                  />
                </Link>
              ))}
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
