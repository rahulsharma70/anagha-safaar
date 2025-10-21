import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

const Tours = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("destination") || "");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const { data: tours, isLoading } = useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
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
      
      return matchesSearch && matchesDuration && matchesDifficulty;
    });
  }, [tours, searchQuery, durationFilter, difficultyFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-hero py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4">
              Curated Tours
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Embark on unforgettable journeys through spiritual, cultural, and adventure experiences
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
            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="short">1-3 Days</SelectItem>
                <SelectItem value="medium">4-7 Days</SelectItem>
                <SelectItem value="long">8+ Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="challenging">Challenging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Tours Grid */}
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
          ) : filteredTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTours.map((tour) => (
                <Link key={tour.id} to={`/tours/${tour.slug}`}>
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
              ))}
            </div>
          ) : tours && tours.length > 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                No tours match your filters
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                No tours available yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for amazing tour packages!
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Tours;
