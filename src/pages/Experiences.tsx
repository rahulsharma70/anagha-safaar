import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MoodBasedSearch } from "@/components/home/MoodBasedSearch";
import { TravelPersonality } from "@/components/home/TravelPersonality";
import { BucketList } from "@/components/home/BucketList";
import { MoodTripFinder, InteractiveGlobe, HiddenGems, GamificationSystem } from "@/components/originality";
import { Testimonials } from "@/components/home/Testimonials";

const Experiences = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Experiences — Anagha Safar" description="Discover mood-based trips, hidden gems, travel quizzes, and more interactive experiences." url="/experiences" />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-muted/60 to-background">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Interactive</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Unique <span className="text-accent">Experiences</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore trips by mood, discover hidden gems, and find your travel personality
              </p>
            </motion.div>
          </div>
        </section>

        <MoodBasedSearch />
        <MoodTripFinder />
        <TravelPersonality />
        <HiddenGems />
        <BucketList />
        <InteractiveGlobe />
        <GamificationSystem />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Experiences;
