import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, MapPin, TrendingUp, ChevronRight } from "lucide-react";

interface PopularDestinationsCarouselProps {
  onSelectDestination: (destination: string) => void;
}

const DESTINATIONS = [
  {
    name: "Goa",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop",
    rating: 4.8,
    reviews: 2340,
    tag: "Beach Paradise",
    trending: true,
  },
  {
    name: "Kerala",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 1890,
    tag: "Backwaters",
    trending: true,
  },
  {
    name: "Rajasthan",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&h=300&fit=crop",
    rating: 4.7,
    reviews: 3120,
    tag: "Heritage",
    trending: false,
  },
  {
    name: "Ladakh",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 1560,
    tag: "Adventure",
    trending: true,
  },
  {
    name: "Himachal Pradesh",
    image: "https://images.unsplash.com/photo-1585038541965-9e7d13c73b3e?w=400&h=300&fit=crop",
    rating: 4.6,
    reviews: 2780,
    tag: "Mountains",
    trending: false,
  },
  {
    name: "Varanasi",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&h=300&fit=crop",
    rating: 4.5,
    reviews: 1420,
    tag: "Spiritual",
    trending: false,
  },
];

export const PopularDestinationsCarousel = ({ onSelectDestination }: PopularDestinationsCarouselProps) => {
  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Trending Destinations
          </h2>
          <p className="text-muted-foreground mt-1">Popular choices for your next adventure</p>
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {DESTINATIONS.map((dest, index) => (
            <CarouselItem key={dest.name} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {dest.trending && (
                      <Badge className="absolute top-3 left-3 bg-primary/90">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    <Badge variant="secondary" className="absolute top-3 right-3">
                      {dest.tag}
                    </Badge>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-xl font-bold text-white flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {dest.name}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{dest.rating}</span>
                        <span className="text-muted-foreground text-sm">({dest.reviews.toLocaleString()} reviews)</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary/80"
                        onClick={() => onSelectDestination(dest.name)}
                      >
                        Select
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </motion.section>
  );
};
