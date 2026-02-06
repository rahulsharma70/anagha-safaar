import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Heart, Check, Plus, Sparkles, Globe, 
  ChevronRight, Star, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const bucketListDestinations = [
  {
    id: 1,
    name: "Taj Mahal, Agra",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop",
    country: "India",
    category: "Wonder",
    visitors: "8M yearly",
    inBucketList: false
  },
  {
    id: 2,
    name: "Santorini",
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop",
    country: "Greece",
    category: "Island",
    visitors: "2M yearly",
    inBucketList: true
  },
  {
    id: 3,
    name: "Northern Lights, Iceland",
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=400&fit=crop",
    country: "Iceland",
    category: "Natural Wonder",
    visitors: "500K yearly",
    inBucketList: false
  },
  {
    id: 4,
    name: "Machu Picchu",
    image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&h=400&fit=crop",
    country: "Peru",
    category: "Ancient Ruins",
    visitors: "1.5M yearly",
    inBucketList: true
  },
  {
    id: 5,
    name: "Bali Temples",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop",
    country: "Indonesia",
    category: "Spiritual",
    visitors: "6M yearly",
    inBucketList: false
  },
  {
    id: 6,
    name: "Maldives",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop",
    country: "Maldives",
    category: "Beach Paradise",
    visitors: "1.7M yearly",
    inBucketList: true
  }
];

export const BucketList = () => {
  const [destinations, setDestinations] = useState(bucketListDestinations);
  const [filter, setFilter] = useState<"all" | "saved">("all");

  const toggleBucketList = (id: number) => {
    setDestinations(destinations.map(dest => 
      dest.id === id ? { ...dest, inBucketList: !dest.inBucketList } : dest
    ));
  };

  const filteredDestinations = filter === "all" 
    ? destinations 
    : destinations.filter(d => d.inBucketList);

  const savedCount = destinations.filter(d => d.inBucketList).length;

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/10 to-pink-500/10 text-rose-500 px-4 py-2 rounded-full mb-4">
            <Heart className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">Dream Destinations</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Travel <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Bucket List</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Save your dream destinations and track your travel goals
          </p>
        </motion.div>

        {/* Stats & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-2xl">{savedCount}</p>
                <p className="text-xs text-muted-foreground">Saved</p>
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-500/10">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-2xl">0</p>
                <p className="text-xs text-muted-foreground">Visited</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setFilter("all")}
            >
              All Destinations
            </Button>
            <Button
              variant={filter === "saved" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setFilter("saved")}
            >
              <Heart className="w-4 h-4 mr-1 fill-current" />
              My Bucket List ({savedCount})
            </Button>
          </div>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDestinations.map((dest, index) => (
              <motion.div
                key={dest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-foreground">
                      {dest.category}
                    </Badge>
                    
                    {/* Bucket List Button */}
                    <button
                      onClick={() => toggleBucketList(dest.id)}
                      className={cn(
                        "absolute top-3 right-3 p-3 rounded-full transition-all",
                        dest.inBucketList 
                          ? "bg-rose-500 text-white scale-110" 
                          : "bg-black/30 backdrop-blur-sm text-white hover:bg-rose-500/80"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", dest.inBucketList && "fill-current")} />
                    </button>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        {dest.country}
                      </div>
                      <h3 className="text-xl font-bold text-white">{dest.name}</h3>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Camera className="w-4 h-4" />
                      {dest.visitors}
                    </div>
                    <Button size="sm" variant="ghost" className="rounded-full">
                      Explore
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button size="lg" className="rounded-full px-8">
            <Plus className="w-5 h-5 mr-2" />
            Discover More Destinations
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
