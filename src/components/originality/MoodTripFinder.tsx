import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, Mountain, Sunrise, Sparkles, Music, Camera, 
  Compass, Wind, ArrowRight, MapPin, Star
} from "lucide-react";
import { Link } from "react-router-dom";

interface Mood {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  destinations: {
    name: string;
    state: string;
    tagline: string;
    image: string;
    match: number;
  }[];
}

const MOODS: Mood[] = [
  {
    id: "romantic",
    label: "Romantic",
    icon: Heart,
    color: "text-rose-500",
    bgGradient: "from-rose-500/20 to-pink-500/20",
    destinations: [
      { name: "Udaipur", state: "Rajasthan", tagline: "City of Lakes", image: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?w=400&h=300&fit=crop", match: 98 },
      { name: "Andaman", state: "Islands", tagline: "Beach Paradise", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop", match: 95 },
      { name: "Coorg", state: "Karnataka", tagline: "Scotland of India", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop", match: 92 },
    ],
  },
  {
    id: "adventurous",
    label: "Adventurous",
    icon: Mountain,
    color: "text-orange-500",
    bgGradient: "from-orange-500/20 to-amber-500/20",
    destinations: [
      { name: "Ladakh", state: "Himalayas", tagline: "Land of High Passes", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&h=300&fit=crop", match: 99 },
      { name: "Rishikesh", state: "Uttarakhand", tagline: "Adventure Capital", image: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=400&h=300&fit=crop", match: 96 },
      { name: "Manali", state: "Himachal", tagline: "Valley of Gods", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=400&h=300&fit=crop", match: 94 },
    ],
  },
  {
    id: "peaceful",
    label: "Peaceful",
    icon: Sunrise,
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/20 to-teal-500/20",
    destinations: [
      { name: "Kerala Backwaters", state: "Kerala", tagline: "Serene Waters", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop", match: 98 },
      { name: "Pondicherry", state: "Tamil Nadu", tagline: "French Tranquility", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop", match: 95 },
      { name: "Dharamshala", state: "Himachal", tagline: "Abode of Dalai Lama", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=400&h=300&fit=crop", match: 93 },
    ],
  },
  {
    id: "spiritual",
    label: "Spiritual",
    icon: Sparkles,
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-indigo-500/20",
    destinations: [
      { name: "Varanasi", state: "Uttar Pradesh", tagline: "City of Light", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&h=300&fit=crop", match: 99 },
      { name: "Bodh Gaya", state: "Bihar", tagline: "Place of Enlightenment", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop", match: 97 },
      { name: "Amritsar", state: "Punjab", tagline: "Golden Temple", image: "https://images.unsplash.com/photo-1609947017136-9daf32a15c73?w=400&h=300&fit=crop", match: 96 },
    ],
  },
  {
    id: "cultural",
    label: "Cultural",
    icon: Music,
    color: "text-amber-500",
    bgGradient: "from-amber-500/20 to-yellow-500/20",
    destinations: [
      { name: "Jaipur", state: "Rajasthan", tagline: "Pink City", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&h=300&fit=crop", match: 98 },
      { name: "Kolkata", state: "West Bengal", tagline: "City of Joy", image: "https://images.unsplash.com/photo-1558431382-27e303142255?w=400&h=300&fit=crop", match: 95 },
      { name: "Mysore", state: "Karnataka", tagline: "Palace City", image: "https://images.unsplash.com/photo-1600100397608-e3f317757e59?w=400&h=300&fit=crop", match: 93 },
    ],
  },
  {
    id: "photogenic",
    label: "Photogenic",
    icon: Camera,
    color: "text-cyan-500",
    bgGradient: "from-cyan-500/20 to-blue-500/20",
    destinations: [
      { name: "Kashmir", state: "Himalayas", tagline: "Paradise on Earth", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=400&h=300&fit=crop", match: 99 },
      { name: "Hampi", state: "Karnataka", tagline: "Boulder Wonderland", image: "https://images.unsplash.com/photo-1600100397608-e3f317757e59?w=400&h=300&fit=crop", match: 96 },
      { name: "Rann of Kutch", state: "Gujarat", tagline: "White Desert", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop", match: 94 },
    ],
  },
  {
    id: "offbeat",
    label: "Offbeat",
    icon: Compass,
    color: "text-indigo-500",
    bgGradient: "from-indigo-500/20 to-violet-500/20",
    destinations: [
      { name: "Spiti Valley", state: "Himachal", tagline: "Middle Land", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&h=300&fit=crop", match: 99 },
      { name: "Tawang", state: "Arunachal", tagline: "Monastery Town", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=400&h=300&fit=crop", match: 97 },
      { name: "Majuli", state: "Assam", tagline: "River Island", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop", match: 95 },
    ],
  },
  {
    id: "refreshing",
    label: "Refreshing",
    icon: Wind,
    color: "text-sky-500",
    bgGradient: "from-sky-500/20 to-cyan-500/20",
    destinations: [
      { name: "Munnar", state: "Kerala", tagline: "Tea Gardens", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop", match: 98 },
      { name: "Ooty", state: "Tamil Nadu", tagline: "Queen of Hills", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop", match: 95 },
      { name: "Shillong", state: "Meghalaya", tagline: "Scotland of East", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=400&h=300&fit=crop", match: 93 },
    ],
  },
];

export const MoodTripFinder = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Cultural Pattern Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="paisley" patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M10 5c-2.5 0-5 2.5-5 5s2.5 5 5 5c1.5 0 3-0.5 4-1.5C13 12 12 10 10 10s-2 1-2 2.5 1 2.5 2 2.5" 
              fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#paisley)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-accent" />
            AI-Powered Discovery
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How Are You <span className="text-secondary">Feeling</span> Today?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us your mood, and we'll match you with the perfect Indian destination
          </p>
        </motion.div>

        {/* Mood Selector */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {MOODS.map((mood, index) => (
            <motion.button
              key={mood.id}
              onClick={() => setSelectedMood(mood)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all duration-300
                ${selectedMood?.id === mood.id 
                  ? `bg-gradient-to-r ${mood.bgGradient} border-current ${mood.color}` 
                  : 'border-border hover:border-muted-foreground bg-card'
                }
              `}
            >
              <mood.icon className={`h-5 w-5 ${selectedMood?.id === mood.id ? mood.color : 'text-muted-foreground'}`} />
              <span className={`font-medium ${selectedMood?.id === mood.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                {mood.label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {selectedMood && (
            <motion.div
              key={selectedMood.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Perfect Destinations for Your {selectedMood.label} Mood
                </h3>
                <p className="text-muted-foreground">
                  Based on your selection, here are our AI-matched recommendations
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {selectedMood.destinations.map((dest, index) => (
                  <motion.div
                    key={dest.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`group overflow-hidden border-2 hover:border-secondary/50 transition-all duration-300 bg-gradient-to-br ${selectedMood.bgGradient}`}>
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                        <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {dest.match}% Match
                        </Badge>
                        <div className="absolute bottom-3 left-3">
                          <h4 className="text-xl font-bold text-foreground">{dest.name}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {dest.state}
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground mb-4 italic">"{dest.tagline}"</p>
                        <Link to="/tours">
                          <Button className="w-full group/btn">
                            Explore Packages
                            <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedMood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <Compass className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Select a mood above to discover your perfect destination</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};
