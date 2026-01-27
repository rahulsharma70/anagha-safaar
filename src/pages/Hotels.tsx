import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Building2, Sparkles, Calendar, Users, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CityAutocomplete from "@/components/CityAutocomplete";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import HotelCardEnhanced from "@/components/hotels/HotelCardEnhanced";
import HotelSortBar from "@/components/hotels/HotelSortBar";
import HotelDealsBanner from "@/components/hotels/HotelDealsBanner";
import HotelTrustBadges from "@/components/hotels/HotelTrustBadges";

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [starFilter, setStarFilter] = useState<string>("all");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [sortBy, setSortBy] = useState("recommended");

  // Enable realtime updates
  useRealtimeData("hotels", ["hotels"]);

  const { data: hotels, isLoading } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    
    let filtered = hotels.filter((hotel) => {
      // Only show hotels with available rooms
      const hasAvailability = (hotel.available_rooms ?? 0) > 0;
      
      const matchesSearch = searchQuery === "" || 
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location_state.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPrice = priceFilter === "all" || 
        (priceFilter === "budget" && hotel.price_per_night <= 3000) ||
        (priceFilter === "mid" && hotel.price_per_night > 3000 && hotel.price_per_night <= 8000) ||
        (priceFilter === "luxury" && hotel.price_per_night > 8000);
      
      const matchesStars = starFilter === "all" || 
        hotel.star_rating === parseInt(starFilter);
      
      return hasAvailability && matchesSearch && matchesPrice && matchesStars;
    });

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price_per_night - b.price_per_night);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price_per_night - a.price_per_night);
        break;
      case "rating":
        filtered.sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0));
        break;
      case "stars":
        filtered.sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0));
        break;
    }

    return filtered;
  }, [hotels, searchQuery, priceFilter, starFilter, sortBy]);

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

  const popularDestinations = [
    { name: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop" },
    { name: "Jaipur", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=300&fit=crop" },
    { name: "Kerala", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop" },
    { name: "Mumbai", image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=300&fit=crop" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Parallax */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
          
          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-40 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl"
          />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-primary-foreground text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Discover Your Perfect Stay
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
                Find Your Dream
                <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                  Hotel
                </span>
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
                From luxury resorts to cozy boutique hotels, find accommodations that make every trip memorable
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Destination */}
                  <div className="md:col-span-2">
                    <CityAutocomplete
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Where do you want to stay?"
                    />
                  </div>
                  
                  {/* Check-in */}
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="pl-12 h-14 rounded-xl border-border/50 bg-background/50"
                      placeholder="Check-in"
                    />
                  </div>
                  
                  {/* Check-out */}
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="pl-12 h-14 rounded-xl border-border/50 bg-background/50"
                      placeholder="Check-out"
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
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-background/50">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="budget">Under ₹3,000</SelectItem>
                      <SelectItem value="mid">₹3,000 - ₹8,000</SelectItem>
                      <SelectItem value="luxury">₹8,000+</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={starFilter} onValueChange={setStarFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-background/50">
                      <SelectValue placeholder="Star Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stars</SelectItem>
                      <SelectItem value="5">5 Star</SelectItem>
                      <SelectItem value="4">4 Star</SelectItem>
                      <SelectItem value="3">3 Star</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-background/50">
                      <Users className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Guests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Guest</SelectItem>
                      <SelectItem value="2">2 Guests</SelectItem>
                      <SelectItem value="3">3 Guests</SelectItem>
                      <SelectItem value="4">4+ Guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <HotelTrustBadges />

        {/* Deals Banner */}
        <div className="container mx-auto px-4 py-4">
          <HotelDealsBanner />
        </div>

        {/* Popular Destinations */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-2">Popular Destinations</h2>
            <p className="text-muted-foreground">Trending places to stay</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularDestinations.map((dest, index) => (
              <motion.div
                key={dest.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setSearchQuery(dest.name)}
              >
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold text-lg">{dest.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Hotels Grid */}
        <section className="container mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            <div>
              <h2 className="text-3xl font-bold">
                {searchQuery ? `Hotels in ${searchQuery}` : "All Hotels"}
              </h2>
            </div>
          </motion.div>

          {/* Sort Bar */}
          <HotelSortBar 
            sortBy={sortBy} 
            onSortChange={setSortBy} 
            totalHotels={filteredHotels.length} 
          />

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
            <motion.div 
              variants={containerVariants}
              initial="visible"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredHotels.map((hotel) => (
                <HotelCardEnhanced
                  key={hotel.id}
                  id={hotel.id}
                  slug={hotel.slug}
                  name={hotel.name}
                  location={`${hotel.location_city}, ${hotel.location_state}`}
                  image={
                    (hotel.images as string[])?.[0] ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
                  }
                  price={Number(hotel.price_per_night)}
                  originalPrice={hotel.is_featured ? Math.round(hotel.price_per_night * 1.2) : undefined}
                  starRating={hotel.star_rating || 4}
                  userRating={Number((4.0 + (hotel.star_rating || 4) * 0.15).toFixed(1))}
                  reviewCount={150 + ((hotel.id.charCodeAt(0) * 7) % 350)}
                  availableRooms={hotel.available_rooms || undefined}
                  isFeatured={hotel.is_featured || false}
                  discount={hotel.is_featured ? 20 : undefined}
                />
              ))}
            </motion.div>
          ) : hotels && hotels.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-muted/30 rounded-3xl"
            >
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No hotels match your filters
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setPriceFilter("all");
                setStarFilter("all");
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
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No hotels available yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for amazing hotel deals!
              </p>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Hotels;
