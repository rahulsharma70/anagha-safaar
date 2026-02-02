import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gem, MapPin, Users, Star, Eye, ArrowRight, Lightbulb,
  Compass, ChevronLeft, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

interface HiddenGem {
  id: string;
  name: string;
  state: string;
  description: string;
  insiderTip: string;
  image: string;
  visitors: string;
  bestTime: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  tags: string[];
}

const HIDDEN_GEMS: HiddenGem[] = [
  {
    id: "1",
    name: "Mawlynnong",
    state: "Meghalaya",
    description: "Asia's cleanest village nestled in the clouds, known for its living root bridges and pristine environment.",
    insiderTip: "Visit during early morning to see the mist-covered bridges. The locals are incredibly welcoming - don't miss their traditional bamboo rice!",
    image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=600&h=400&fit=crop",
    visitors: "~500/month",
    bestTime: "Oct - Apr",
    difficulty: "Moderate",
    tags: ["Nature", "Culture", "Photography"],
  },
  {
    id: "2",
    name: "Ziro Valley",
    state: "Arunachal Pradesh",
    description: "A UNESCO World Heritage Site, home to the Apatani tribe and their unique rice-fish farming traditions.",
    insiderTip: "Attend the Ziro Music Festival in September for an incredible fusion of indie music and tribal culture. Book homestays with local families!",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=400&fit=crop",
    visitors: "~300/month",
    bestTime: "Mar - Oct",
    difficulty: "Moderate",
    tags: ["Tribal", "Music", "UNESCO"],
  },
  {
    id: "3",
    name: "Chettinad",
    state: "Tamil Nadu",
    description: "A land of magnificent mansions, antique traders, and India's spiciest cuisine that few tourists know about.",
    insiderTip: "Hire a local guide to explore abandoned palatial homes. The Chettinad chicken here will change your life - try it at a family-run eatery!",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop",
    visitors: "~400/month",
    bestTime: "Nov - Feb",
    difficulty: "Easy",
    tags: ["Heritage", "Food", "Architecture"],
  },
  {
    id: "4",
    name: "Gurez Valley",
    state: "Kashmir",
    description: "A remote paradise untouched by commercialization, offering raw Himalayan beauty and Dard-Shin culture.",
    insiderTip: "The valley is only accessible 4 months a year. Stay with local families and try the traditional Dard bread - an experience you'll never forget!",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&h=400&fit=crop",
    visitors: "~200/month",
    bestTime: "Jun - Sep",
    difficulty: "Challenging",
    tags: ["Adventure", "Remote", "Culture"],
  },
  {
    id: "5",
    name: "Gandikota",
    state: "Andhra Pradesh",
    description: "India's Grand Canyon - a hidden fortress atop stunning gorges carved by the Pennar River.",
    insiderTip: "Camp overnight at the gorge edge for sunrise - it's magical! The ancient fort has secret passages that most tourists miss. Ask the caretaker!",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop",
    visitors: "~350/month",
    bestTime: "Oct - Feb",
    difficulty: "Easy",
    tags: ["Canyon", "Camping", "History"],
  },
  {
    id: "6",
    name: "Chopta",
    state: "Uttarakhand",
    description: "The 'Mini Switzerland of India' - pristine meadows leading to the world's highest Shiva temple at Tungnath.",
    insiderTip: "Start the Chandrashila trek at 3 AM to catch the Himalayan sunrise from 4,000m. The views of Nanda Devi and Chaukhamba are surreal!",
    image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=600&h=400&fit=crop",
    visitors: "~600/month",
    bestTime: "Apr - Jun, Sep - Nov",
    difficulty: "Moderate",
    tags: ["Trekking", "Spiritual", "Mountains"],
  },
];

const difficultyColors = {
  Easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Moderate: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Challenging: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

export const HiddenGems = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const newIndex = prev + newDirection;
      if (newIndex < 0) return HIDDEN_GEMS.length - 1;
      if (newIndex >= HIDDEN_GEMS.length) return 0;
      return newIndex;
    });
  };

  const currentGem = HIDDEN_GEMS[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30">
            <Gem className="h-3.5 w-3.5 mr-2 text-violet-500" />
            Off the Beaten Path
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Discover <span className="text-gradient-primary">Hidden Gems</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secret destinations that even seasoned travelers don't know about. Explore the unexplored India.
          </p>
        </motion.div>

        {/* Main Carousel */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={() => paginate(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 p-3 rounded-full bg-card border border-border shadow-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 p-3 rounded-full bg-card border border-border shadow-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Card */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="overflow-hidden border-2 hover:border-secondary/50 transition-all duration-300">
                  <div className="grid md:grid-cols-2">
                    {/* Image */}
                    <div className="relative h-64 md:h-auto">
                      <img
                        src={currentGem.image}
                        alt={currentGem.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/80 md:block hidden" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent md:hidden" />
                      
                      {/* Badges overlay */}
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        <Badge className={difficultyColors[currentGem.difficulty]}>
                          {currentGem.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="backdrop-blur-sm">
                          <Eye className="h-3 w-3 mr-1" />
                          {currentGem.visitors}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{currentGem.state}</span>
                      </div>
                      
                      <h3 className="text-3xl font-bold text-foreground mb-3">
                        {currentGem.name}
                      </h3>
                      
                      <p className="text-muted-foreground mb-4">
                        {currentGem.description}
                      </p>

                      {/* Insider Tip */}
                      <div className="bg-accent/10 rounded-xl p-4 mb-4 border border-accent/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-accent" />
                          <span className="font-semibold text-accent">Insider Tip</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          "{currentGem.insiderTip}"
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentGem.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <span>🗓️ Best: {currentGem.bestTime}</span>
                      </div>

                      <Link to="/tours">
                        <Button className="w-full group">
                          Plan Your Visit
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {HIDDEN_GEMS.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? "w-8 bg-secondary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Access Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h3 className="text-center text-lg font-medium text-muted-foreground mb-6">
            Quick Explore More Gems
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {HIDDEN_GEMS.map((gem, index) => (
              <motion.button
                key={gem.id}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${index === currentIndex ? 'border-secondary ring-2 ring-secondary/50' : 'border-transparent'}
                `}
              >
                <img
                  src={gem.image}
                  alt={gem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-xs font-medium text-white text-center">
                  {gem.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
