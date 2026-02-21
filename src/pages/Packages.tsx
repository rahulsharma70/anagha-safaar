import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PackageCard from "@/components/PackageCard";
import { motion, type Variants } from "framer-motion";
import { Star } from "lucide-react";
import himalayanRetreat from "@/assets/himalayan-retreat.jpg";
import varanasiGhats from "@/assets/varanasi-ghats.jpg";
import keralaBackwaters from "@/assets/kerala-backwaters.jpg";
import rajasthanHeritage from "@/assets/rajasthan-heritage.jpg";
import { PopularDestinations } from "@/components/home/PopularDestinations";

const packages = [
  {
    image: himalayanRetreat,
    title: "Himalayan Spiritual Trek",
    location: "Himachal Pradesh",
    duration: "5 Days",
    rating: 4.9,
    reviews: 234,
    price: 45000,
    badge: "Popular",
    href: "/tours/himalayan-trek-2024",
  },
  {
    image: varanasiGhats,
    title: "Spiritual Varanasi Journey",
    location: "Varanasi, UP",
    duration: "3 Days",
    rating: 4.8,
    reviews: 189,
    price: 28000,
    href: "/tours/varanasi-spiritual-2024",
  },
  {
    image: keralaBackwaters,
    title: "Kerala Backwaters Luxury Cruise",
    location: "Alleppey, Kerala",
    duration: "4 Days",
    rating: 4.9,
    reviews: 312,
    price: 52000,
    badge: "Luxury",
    href: "/tours/kerala-backwaters-2024",
  },
  {
    image: rajasthanHeritage,
    title: "Rajasthan Heritage Circuit",
    location: "Jaipur, Rajasthan",
    duration: "7 Days",
    rating: 4.7,
    reviews: 267,
    price: 68000,
    href: "/tours/rajasthan-heritage-2024",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Packages = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Tour Packages — Anagha Safar" description="Browse curated tour packages across India's most stunning destinations." url="/packages" />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-muted/60 to-background">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">All Packages</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Explore Our <span className="text-secondary">Tour Packages</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Handpicked journeys crafted for the discerning traveler
              </p>
            </motion.div>
          </div>
        </section>

        {/* Packages Grid */}
        <section className="container mx-auto px-4 py-16">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <motion.div key={index} variants={itemVariants} whileHover={{ y: -10 }}>
                <PackageCard {...pkg} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <PopularDestinations />
      </main>
      <Footer />
    </div>
  );
};

export default Packages;
