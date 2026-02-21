import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { FlashDeals } from "@/components/home/FlashDeals";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { PricePrediction } from "@/components/home/PricePrediction";

const Deals = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Today's Best Deals — Anagha Safar" description="Grab the hottest travel deals, flash sales, and popular routes across India." url="/deals" />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-muted/60 to-background">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-4">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">Limited Time</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Today's Best <span className="text-accent">Deals</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Flash sales, popular routes, and unbeatable prices — updated daily
              </p>
            </motion.div>
          </div>
        </section>

        <FlashDeals />
        <PopularRoutes />
        <PricePrediction />
      </main>
      <Footer />
    </div>
  );
};

export default Deals;
