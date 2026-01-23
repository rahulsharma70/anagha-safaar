import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Compass, Mountain, Sparkles, Calendar, Users, TreePine, Waves, Camera } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CityAutocomplete from "@/components/CityAutocomplete";
import { useRealtimeData } from "@/hooks/useRealtimeData";

const Tours = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [tourTypeFilter, setTourTypeFilter] = useState<string>("all");

  // Enable realtime updates
  useRealtimeData("tours", ["tours"]);

  const { data: tours, isLoading } = useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const filteredTours = useMemo(() => {
    if (!tours) return [];
    
    return tours.filter((tour) => {
      const matchesSearch = searchQuery === "" || 
        tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.location_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.location_state.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDuration = durationFilter === "all" || 
        (durationFilter === "short" && tour.duration_days <= 3) ||
        (durationFilter === "medium" && tour.duration_days >= 4 && tour.duration_days <= 7) ||
        (durationFilter === "long" && tour.duration_days > 7);
      
      const matchesDifficulty = difficultyFilter === "all" || 
        tour.difficulty?.toLowerCase() === difficultyFilter;

      const matchesTourType = tourTypeFilter === "all" ||
        tour.tour_type?.toLowerCase() === tourTypeFilter.toLowerCase();
      
      return matchesSearch && matchesDuration && matchesDifficulty && matchesTourType;
    });
  }, [tours, searchQuery, durationFilter, difficultyFilter, tourTypeFilter]);

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

  const tourCategories = [
    { name: "Adventure", icon: Mountain, color: "from-orange-500 to-red-500" },
    { name: "Spiritual", icon: Compass, color: "from-purple-500 to-pink-500" },
    { name: "Nature", icon: TreePine, color: "from-green-500 to-emerald-500" },
    { name: "Beach", icon: Waves, color: "from-blue-500 to-cyan-500" },
  ];

  const featuredDestinations = [
    { name: "Himalayas", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop", tours: 12 },
    { name: "Rajasthan", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=300&fit=crop", tours: 8 },
    { name: "Kerala", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop", tours: 15 },
    { name: "Ladakh", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&h=300&fit=crop", tours: 6 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
          
          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-24 h-24 bg-accent/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
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
                <Camera className="w-4 h-4" />
                Curated Experiences
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
                Explore Amazing
                <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                  Tours
                </span>
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
                Embark on unforgettable journeys through spiritual, cultural, and adventure experiences
              </p>
            </motion.div>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Destination */}
                  <div className="md:col-span-2">
                    <CityAutocomplete
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Where do you want to go?"
                    />
                  </div>
                  
                  {/* Duration */}
                  <Select value={durationFilter} onValueChange={setDurationFilter}>
                    <SelectTrigger className="h-14 rounded-xl border-border/50 bg-background/50">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      <SelectItem value="short">1-3 Days</SelectItem>
                      <SelectItem value="medium">4-7 Days</SelectItem>
                      <SelectItem value="long">8+ Days</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Search Button */}
                  <Button className="h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 shadow-lg">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/30">
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl bg-background/50">
                      <Mountain className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="challenging">Challenging</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={tourTypeFilter} onValueChange={setTourTypeFilter}>
                    <SelectTrigger className="w-[150px] rounded-xl bg-background/50">
                      <Compass className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Tour Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="spiritual">Spiritual</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tour Categories */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-2">Explore by Category</h2>
            <p className="text-muted-foreground">Find your perfect adventure</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tourCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative rounded-2xl p-6 cursor-pointer bg-gradient-to-br ${category.color} text-white shadow-lg overflow-hidden group`}
                onClick={() => setTourTypeFilter(category.name.toLowerCase())}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative z-10">
                  <category.icon className="w-10 h-10 mb-3" />
                  <h3 className="font-bold text-lg">{category.name}</h3>
                  <p className="text-sm text-white/80">Explore tours</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Destinations */}
        <section className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-2">Popular Destinations</h2>
            <p className="text-muted-foreground">Trending places to explore</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredDestinations.map((dest, index) => (
              <motion.div
                key={dest.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative rounded-2xl overflow-hidden cursor-pointer group h-48"
                onClick={() => setSearchQuery(dest.name)}
              >
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold text-xl">{dest.name}</h3>
                  <p className="text-sm text-white/80">{dest.tours} tours</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tours Grid */}
        <section className="container mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-3xl font-bold">
                {searchQuery ? `Tours in ${searchQuery}` : "All Tours"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredTours.length} experiences found
              </p>
            </div>
          </motion.div>

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
          ) : filteredTours.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="visible"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTours.map((tour) => (
                <motion.div 
                  key={tour.id} 
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link to={`/tours/${tour.slug}`}>
                    <PackageCard
                      image={
                        (tour.images as string[])?.[0] ||
                        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop"
                      }
                      title={tour.name}
                      location={`${tour.location_city}, ${tour.location_state}`}
                      duration={`${tour.duration_days} Days`}
                      rating={4.8}
                      reviews={Math.floor(Math.random() * 300) + 50}
                      price={Number(tour.price_per_person)}
                      badge={tour.is_featured ? "Featured" : tour.tour_type ? tour.tour_type : undefined}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : tours && tours.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-muted/30 rounded-3xl"
            >
              <Compass className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No tours match your filters
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setDurationFilter("all");
                setDifficultyFilter("all");
                setTourTypeFilter("all");
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
              <Compass className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No tours available yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for amazing tour packages!
              </p>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Tours;
