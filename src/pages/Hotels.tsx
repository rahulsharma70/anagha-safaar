import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";

const Hotels = () => {
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

        {/* Hotels Grid */}
        <section className="container mx-auto px-4 py-20">
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
          ) : hotels && hotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <PackageCard
                  key={hotel.id}
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
              ))}
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
