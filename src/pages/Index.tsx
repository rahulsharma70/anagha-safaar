import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import PackageCard from "@/components/PackageCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Award, Shield, Clock, ArrowRight, MapPin, Plane, Star, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import heroImage from "@/assets/hero-travel.jpg";
import himalayanRetreat from "@/assets/himalayan-retreat.jpg";
import varanasiGhats from "@/assets/varanasi-ghats.jpg";
import keralaBackwaters from "@/assets/kerala-backwaters.jpg";
import rajasthanHeritage from "@/assets/rajasthan-heritage.jpg";
import { Testimonials } from "@/components/home/Testimonials";
import { TrustBadges } from "@/components/home/TrustBadges";
import { Newsletter } from "@/components/home/Newsletter";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { PopularDestinations } from "@/components/home/PopularDestinations";
import { AppDownloadBanner } from "@/components/home/AppDownloadBanner";
import { FlashDeals } from "@/components/home/FlashDeals";
import { RecentSearches } from "@/components/home/RecentSearches";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { MoodTripFinder, InteractiveGlobe, GamificationSystem, HiddenGems, MadhubaniPattern } from "@/components/originality";

const Index = () => {
  const featuredPackages = [{
    image: himalayanRetreat,
    title: "Himalayan Spiritual Trek",
    location: "Himachal Pradesh",
    duration: "5 Days",
    rating: 4.9,
    reviews: 234,
    price: 45000,
    badge: "Popular",
    href: "/tours/himalayan-trek-2024"
  }, {
    image: varanasiGhats,
    title: "Spiritual Varanasi Journey",
    location: "Varanasi, UP",
    duration: "3 Days",
    rating: 4.8,
    reviews: 189,
    price: 28000,
    href: "/tours/varanasi-spiritual-2024"
  }, {
    image: keralaBackwaters,
    title: "Kerala Backwaters Luxury Cruise",
    location: "Alleppey, Kerala",
    duration: "4 Days",
    rating: 4.9,
    reviews: 312,
    price: 52000,
    badge: "Luxury",
    href: "/tours/kerala-backwaters-2024"
  }, {
    image: rajasthanHeritage,
    title: "Rajasthan Heritage Circuit",
    location: "Jaipur, Rajasthan",
    duration: "7 Days",
    rating: 4.7,
    reviews: 267,
    price: 68000,
    href: "/tours/rajasthan-heritage-2024"
  }];
  const features = [{
    icon: Award,
    title: "Best Price Guarantee",
    description: "Find a lower price? We'll match it.",
    color: "from-amber-500 to-orange-600"
  }, {
    icon: Shield,
    title: "Secure Booking",
    description: "Your data is safe with us.",
    color: "from-emerald-500 to-teal-600"
  }, {
    icon: Clock,
    title: "24/7 Support",
    description: "We're here whenever you need us.",
    color: "from-blue-500 to-indigo-600"
  }, {
    icon: Sparkles,
    title: "Curated Experiences",
    description: "Handpicked journeys for you.",
    color: "from-purple-500 to-pink-600"
  }];
  const stats = [{
    value: "50K+",
    label: "Happy Travelers"
  }, {
    value: "200+",
    label: "Destinations"
  }, {
    value: "4.9",
    label: "Average Rating"
  }, {
    value: "15+",
    label: "Years Experience"
  }];
  const containerVariants: Variants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };
  const floatAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: [0.4, 0, 0.2, 1] as const
    }
  };
  return <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
          {/* Cultural Pattern Overlay */}
          <MadhubaniPattern className="z-[1]" />
          {/* Background Image with Parallax Effect */}
          <motion.div className="absolute inset-0 bg-cover bg-center scale-110" style={{
          backgroundImage: `url(${heroImage})`
        }} initial={{
          scale: 1.2
        }} animate={{
          scale: 1.1
        }} transition={{
          duration: 1.5,
          ease: "easeOut"
        }} />
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-secondary/20" />
          
          {/* Animated Particles/Decorations */}
          <motion.div className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-accent/20 blur-2xl" animate={floatAnimation} />
          <motion.div className="absolute bottom-1/3 right-20 w-32 h-32 rounded-full bg-secondary/20 blur-3xl" animate={floatAnimation} />

          {/* Hero Content */}
          <div className="relative z-10 text-center px-4 space-y-8 max-w-5xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full mt-16 md:mt-20">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-white">Trusted by 50,000+ Travelers</span>
            </motion.div>

            <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight" initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }}>
              Crafting Journeys
              <br />
              <span className="bg-gradient-to-r from-accent via-amber-400 to-orange-400 bg-clip-text text-transparent">
                That Touch the Soul
              </span>
            </motion.h1>

            <motion.p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed" initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.4
          }}>
              Discover luxury hotels, spiritual tours, and unforgettable experiences across India's most breathtaking destinations
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center pt-4" initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.6
          }}>
              <Link to="/tours">
                <Button size="lg" className="group btn-cta px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-accent/25">
                  Explore Packages
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/itinerary">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg font-semibold">
                  <Sparkles className="mr-2 h-5 w-5 ai-icon-gradient" />
                  AI Trip Planner
                </Button>
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-3xl mx-auto" initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.8
          }}>
              {stats.map((stat, index) => <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>)}
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" initial={{
          opacity: 0
        }} animate={{
          opacity: 1,
          y: [0, 10, 0]
        }} transition={{
          opacity: {
            delay: 1.5,
            duration: 0.5
          },
          y: {
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }
        }}>
            <ChevronDown className="h-8 w-8 text-white/60" />
          </motion.div>
        </section>

        {/* Search Bar */}
        <section className="container mx-auto px-4 -mt-20 relative z-20">
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <SearchBar className="pl-0 pt-[85px] py-[79px]" />
          </motion.div>
        </section>

        {/* Recent Searches */}
        <RecentSearches />

        {/* Flash Deals */}
        <FlashDeals />

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
          once: true
        }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => <motion.div key={index} variants={itemVariants} whileHover={{
            y: -8,
            scale: 1.02
          }} className="group relative p-8 rounded-2xl bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} mb-5 shadow-lg`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>)}
          </motion.div>
        </section>

        {/* Featured Packages Section */}
        <section className="relative py-24 overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">Handpicked for You</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Featured <span className="text-secondary">Experiences</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Curated journeys designed to create unforgettable memories for the discerning traveler
              </p>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
            once: true
          }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPackages.map((pkg, index) => <motion.div key={index} variants={itemVariants} whileHover={{
              y: -10
            }} transition={{
              duration: 0.3
            }}>
                  <PackageCard {...pkg} />
                </motion.div>)}
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6,
            delay: 0.4
          }} className="text-center mt-12">
              <Link to="/tours">
                <Button size="lg" className="group bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-6 text-lg font-semibold shadow-lg">
                  View All Packages
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Popular Routes */}
        <PopularRoutes />

        {/* Popular Destinations */}
        <PopularDestinations />

        {/* Destinations Preview */}
        <section className="container mx-auto px-4 py-24">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Top Destinations</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Explore <span className="text-accent">India</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From the mighty Himalayas to serene backwaters, discover the incredible diversity of India
            </p>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
          once: true
        }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{
            name: "Kashmir",
            image: himalayanRetreat,
            tag: "Paradise on Earth"
          }, {
            name: "Kerala",
            image: keralaBackwaters,
            tag: "God's Own Country"
          }, {
            name: "Rajasthan",
            image: rajasthanHeritage,
            tag: "Land of Royals"
          }, {
            name: "Varanasi",
            image: varanasiGhats,
            tag: "Spiritual Capital"
          }].map((destination, index) => <motion.div key={index} variants={itemVariants} whileHover={{
            scale: 1.03
          }} className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer">
                <img src={destination.image} alt={destination.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-xs text-white/70 mb-1">{destination.tag}</p>
                  <h3 className="text-2xl font-bold text-white">{destination.name}</h3>
                </div>
              </motion.div>)}
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
          </div>
          
          {/* Floating Elements */}
          <motion.div className="absolute top-10 left-10 w-24 h-24" animate={{
          rotate: 360
        }} transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}>
            <Plane className="w-full h-full text-white/10" />
          </motion.div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Ready to Start Your
                <br />
                <span className="bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">
                  Dream Journey?
                </span>
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of happy travelers who trusted us with their dream vacations. Your adventure awaits!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="btn-cta px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-accent/25">
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 px-10 py-6 text-lg font-semibold">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* App Download Banner */}
        <AppDownloadBanner />

        {/* Testimonials */}
        <Testimonials />

        {/* Newsletter */}
        <Newsletter />
      </main>

      <Footer />
    </div>;
};
export default Index;