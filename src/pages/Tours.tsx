import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Tours = () => {
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

        {/* Tours Grid */}
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
          ) : tours && tours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
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
