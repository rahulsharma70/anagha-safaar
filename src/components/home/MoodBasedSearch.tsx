import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Heart, Mountain, Waves, Sparkles, Users, Camera, 
  TreePine, Compass, Music, UtensilsCrossed, Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";

const moods = [
  {
    id: "romantic",
    label: "Romantic Escape",
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    destinations: ["Udaipur", "Kerala", "Goa"],
    query: "?mood=romantic"
  },
  {
    id: "adventure",
    label: "Adventure Rush",
    icon: Mountain,
    color: "from-orange-500 to-amber-500",
    destinations: ["Ladakh", "Rishikesh", "Manali"],
    query: "?mood=adventure"
  },
  {
    id: "beach",
    label: "Beach Vibes",
    icon: Waves,
    color: "from-cyan-500 to-blue-500",
    destinations: ["Goa", "Andaman", "Maldives"],
    query: "?mood=beach"
  },
  {
    id: "spiritual",
    label: "Spiritual Journey",
    icon: Sparkles,
    color: "from-purple-500 to-violet-500",
    destinations: ["Varanasi", "Rishikesh", "Bodh Gaya"],
    query: "?mood=spiritual"
  },
  {
    id: "family",
    label: "Family Fun",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    destinations: ["Jaipur", "Shimla", "Ooty"],
    query: "?mood=family"
  },
  {
    id: "photography",
    label: "Photo Safari",
    icon: Camera,
    color: "from-indigo-500 to-blue-500",
    destinations: ["Ranthambore", "Jim Corbett", "Kaziranga"],
    query: "?mood=photography"
  },
  {
    id: "nature",
    label: "Nature Retreat",
    icon: TreePine,
    color: "from-emerald-500 to-teal-500",
    destinations: ["Coorg", "Munnar", "Darjeeling"],
    query: "?mood=nature"
  },
  {
    id: "culture",
    label: "Cultural Deep Dive",
    icon: Compass,
    color: "from-amber-500 to-yellow-500",
    destinations: ["Jaipur", "Hampi", "Khajuraho"],
    query: "?mood=culture"
  },
  {
    id: "party",
    label: "Party Mode",
    icon: Music,
    color: "from-pink-500 to-fuchsia-500",
    destinations: ["Goa", "Mumbai", "Bangalore"],
    query: "?mood=party"
  },
  {
    id: "foodie",
    label: "Foodie Trail",
    icon: UtensilsCrossed,
    color: "from-red-500 to-orange-500",
    destinations: ["Delhi", "Lucknow", "Kolkata"],
    query: "?mood=foodie"
  },
  {
    id: "summer",
    label: "Beat the Heat",
    icon: Sun,
    color: "from-sky-500 to-cyan-500",
    destinations: ["Shimla", "Manali", "Nainital"],
    query: "?mood=summer"
  },
  {
    id: "honeymoon",
    label: "Honeymoon Special",
    icon: Moon,
    color: "from-violet-500 to-purple-500",
    destinations: ["Maldives", "Bali", "Mauritius"],
    query: "?mood=honeymoon"
  }
];

export const MoodBasedSearch = () => {
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleMoodClick = (mood: typeof moods[0]) => {
    navigate(`/hotels${mood.query}`);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Not sure where to go?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Search by <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mood</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us how you want to feel, we'll find the perfect destination
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {moods.map((mood, index) => (
            <motion.div
              key={mood.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onHoverStart={() => setHoveredMood(mood.id)}
              onHoverEnd={() => setHoveredMood(null)}
              onClick={() => handleMoodClick(mood)}
              className="cursor-pointer"
            >
              <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${mood.color} text-white overflow-hidden group`}>
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full border-2 border-white/50" />
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full border border-white/30" />
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="mb-3 inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <mood.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{mood.label}</h3>
                  
                  {/* Destinations tooltip on hover */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ 
                      opacity: hoveredMood === mood.id ? 1 : 0,
                      height: hoveredMood === mood.id ? "auto" : 0
                    }}
                    className="overflow-hidden mt-2"
                  >
                    <p className="text-xs text-white/80">
                      {mood.destinations.join(" • ")}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
