import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Wallet, Sparkles, ArrowRight, Clock, MapPin } from "lucide-react";

interface SampleItinerariesProps {
  onLoadSample: (trip: {
    destination: string;
    duration: number;
    travelers: number;
    budget: string;
    style: string;
  }) => void;
}

const SAMPLE_TRIPS = [
  {
    title: "Romantic Goa Getaway",
    destination: "Goa",
    duration: 5,
    travelers: 2,
    budget: "50k-1l",
    style: "mid-range",
    highlights: ["Beach Resorts", "Candlelit Dinners", "Sunset Cruises"],
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=300&h=200&fit=crop",
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    title: "Kerala Backwater Bliss",
    destination: "Kerala",
    duration: 7,
    travelers: 4,
    budget: "1l-2l",
    style: "luxury",
    highlights: ["Houseboat Stay", "Ayurveda Spa", "Tea Plantations"],
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=300&h=200&fit=crop",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Rajasthan Heritage Trail",
    destination: "Rajasthan",
    duration: 10,
    travelers: 6,
    budget: "1l-2l",
    style: "mid-range",
    highlights: ["Palace Hotels", "Desert Safari", "Forts & Palaces"],
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=300&h=200&fit=crop",
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    title: "Ladakh Adventure",
    destination: "Ladakh",
    duration: 8,
    travelers: 4,
    budget: "50k-1l",
    style: "backpacker",
    highlights: ["Pangong Lake", "Khardung La", "Monastery Visits"],
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=300&h=200&fit=crop",
    color: "from-blue-500/20 to-cyan-500/20",
  },
];

export const SampleItineraries = ({ onLoadSample }: SampleItinerariesProps) => {
  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-3 px-4 py-1">
          <Sparkles className="h-3 w-3 mr-2" />
          Quick Start Templates
        </Badge>
        <h2 className="text-2xl font-bold text-foreground">Sample Itineraries</h2>
        <p className="text-muted-foreground mt-2">
          Choose a template and customize it to your preferences
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SAMPLE_TRIPS.map((trip, index) => (
          <motion.div
            key={trip.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
          >
            <Card className={`h-full overflow-hidden group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br ${trip.color} backdrop-blur-sm`}>
              <div className="relative h-32 overflow-hidden">
                <img
                  src={trip.image}
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <h3 className="font-bold text-foreground">{trip.title}</h3>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{trip.destination}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {trip.duration} Days
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {trip.travelers} People
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {trip.highlights.slice(0, 2).map((h) => (
                    <Badge key={h} variant="secondary" className="text-xs">
                      {h}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onLoadSample(trip)}
                >
                  Use Template
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
