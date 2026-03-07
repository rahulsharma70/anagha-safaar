import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import SearchBar from "@/components/SearchBar";
import PackageCard from "@/components/PackageCard";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Star, ChevronDown, Shield, Award, Clock, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import heroImage from "@/assets/hero-travel.jpg";
import himalayanRetreat from "@/assets/himalayan-retreat.jpg";
import varanasiGhats from "@/assets/varanasi-ghats.jpg";
import keralaBackwaters from "@/assets/kerala-backwaters.jpg";
import rajasthanHeritage from "@/assets/rajasthan-heritage.jpg";
import { MadhubaniPattern } from "@/components/originality";

const Index = () => {
  const featuredPackages = [
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

  const stats = [
    { value: "50K+", label: "Happy Travelers" },
    { value: "200+", label: "Destinations" },
    { value: "4.9", label: "Average Rating" },
    { value: "15+", label: "Years Experience" },
  ];

  const trustItems = [
    { icon: Award, title: "Best Price Guarantee", description: "Find a lower price? We'll match it." },
    { icon: Shield, title: "100% Secure Booking", description: "Your data & payments are protected." },
    { icon: Clock, title: "24/7 Support", description: "We're here whenever you need us." },
    { icon: Headphones, title: "Curated Experiences", description: "Handpicked journeys by experts." },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const floatAnimation = {
    y: [-10, 10, -10],
    transition: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.2, 1] as const },
  };

  const seoKeywords = [
    "travel booking",
    "India travel",
    "luxury tours",
    "flight booking",
    "hotel booking",
    "tour packages",
    "holiday packages",
    "vacation packages",
    "cheap flights",
    "best hotels",
    "online travel booking",
    "travel deals",
    "cheapest countries to travel from India",
    "weekend getaway",
    "honeymoon packages",
    "family vacation",
    "travel booking website India",
    "solo travel",
    "backpacking India",
    "adventure travel",
    "best travel agency in India",
    "luxury travel",
    "premium travel",
    "travel agency",
    "travel planner",
    "trip planner",
    "AI trip planner",
    "custom itinerary",
    "travel insurance",
    "tour packages from Bhopal",
    "domestic flights",
    "international flights",
    "best tour operator in Madhya Pradesh",
    "round trip flights",
    "multi city flights",
    "business class flights",
    "first class flights",
    "hotel deals",
    "resort booking",
    "homestay booking",
    "villa rental",
    "boutique hotels",
    "5 star hotels",
    "budget hotels",
    "beach resorts",
    "mountain resorts",
    "heritage hotels",
    "palace hotels",
    "eco resorts",
    "treehouse stay",
    "Kerala tour packages",
    "Delhi to Goa tour package",
    "Mumbai to Goa tour package",
    "Bhopal to Goa tour package",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
    "travel tips India",
    "travel guides",
    "Ladakh tour packages",
    "Thane",
    "Bhopal",
    "Visakhapatnam",
    "Patna",
    "Vadodara",
    "Ghaziabad",
    "Ludhiana",
    "Agra",
    "travel agency in Bhopal",
    "Faridabad",
    "Meerut",
    "Rajkot",
    "Varanasi",
    "Srinagar",
    "Aurangabad",
    "Dhanbad",
    "Amritsar",
    "Allahabad",
    "Ranchi",
    "Howrah",
    "Coimbatore",
    "Jabalpur",
    "Gwalior",
    "Bhopal to Goa tour package",
    "Jodhpur",
    "Madurai",
    "Anagha Safar travel agency India",
    "Kota",
    "Guwahati",
    "Chandigarh",
    "Solapur",
    "Hubli",
    "Mysore",
    "Anagha Safar tour packages",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Gorakhpur",
    "Bikaner",
    "Amravati",
    "Noida",
    "Jamshedpur",
    "Bhilai",
    "Warangal",
    "Cuttack",
    "Firozabad",
    "Kochi",
    "Nellore",
    "Bhavnagar",
    "cheapest flights India",
    "Goa tour packages",
    "Asansol",
    "Rourkela",
    "Nanded",
    "Kolhapur",
    "Ajmer",
    "Akola",
    "international flight deals India",
    "Jamnagar",
    "Ujjain",
    "Loni",
    "Siliguri",
    "Jhansi",
    "Ulhasnagar",
    "Jammu",
    "Sangli",
    "Mangalore",
    "Erode",
    "Belgaum",
    "Ambattur",
    "Tirunelveli",
    "Malegaon",
    "domestic flight booking India",
    "Jalgaon",
    "Udaipur",
    "Maheshtala",
    "Davanagere",
    "Kozhikode",
    "Kurnool",
    "Thiruvananthapuram",
    "Bhubaneswar",
    "Imphal",
    "Shillong",
    "Aizawl",
    "luxury resorts in Kerala",
    "Gangtok",
    "Agartala",
    "Kohima",
    "Panaji",
    "Daman",
    "Silvassa",
    "Kavaratti",
    "best hotels in Goa",
    "Goa",
    "Shimla",
    "Anagha Safar holiday packages",
    "Rishikesh",
    "Darjeeling",
    "Ooty",
    "Mussoorie",
    "Munnar",
    "Leh",
    "Ladakh",
    "Andaman",
    "Pondicherry",
    "Hampi",
    "Khajuraho",
    "Bodh Gaya",
    "Pushkar",
    "Jaisalmer",
    "book trip with Anagha Safar",
    "Jim Corbett",
    "budget hotels in Manali",
    "Kerala",
    "Gokarna",
    "Alleppey",
    "South India tour packages",
    "Thekkady",
    "Wayanad",
    "Coorg",
    "Chikmagalur",
    "Lonavala",
    "Golden Triangle tour India",
    "Panchgani",
    "Lavasa",
    "Shirdi",
    "Tirupati",
    "Rameshwaram",
    "Kanyakumari",
    "Madikeri",
    "Badami",
    "Aihole",
    "Pattadakal",
    "Bijapur",
    "Hospet",
    "Nainital",
    "Golden Triangle tour India",
    "Lansdowne",
    "Dalhousie",
    "McLeod Ganj",
    "Dharamshala",
    "Spiti Valley",
    "Tawang",
    "Anagha Safar reviews",
    "Majuli Island",
    "Cherrapunji",
    "Dawki",
    "best places to visit in Goa",
    "Sundarbans",
    "Chilika Lake",
    "Konark",
    "Puri",
    "Mahabalipuram",
    "Kodaikanal",
    "book travel packages online India",
    "Valparai",
    "Varkala",
    "Kovalam",
    "Bekal",
    "Athirappilly",
    "best hill stations in India",
    "best honeymoon places in India",
    "cheapest countries to travel from India",
    "Mandawa",
    "Shekhawati",
    "Orchha",
    "Mandu",
    "Pachmarhi",
    "Amarkantak",
    "Himalayas",
    "Rajasthan",
    "Uttarakhand",
    "Sikkim",
    "Meghalaya",
    "Arunachal Pradesh",
    "Kashmir",
    "Himachal Pradesh",
    "Tamil Nadu",
    "Karnataka",
    "Maharashtra",
    "Gujarat",
    "Madhya Pradesh",
    "Odisha",
    "Assam",
    "Nagaland",
    "Mizoram",
    "Tripura",
    "Manipur",
    "West Bengal",
    "Bihar",
    "Jharkhand",
    "Chhattisgarh",
    "Telangana",
    "Andhra Pradesh",
    "Punjab",
    "Haryana",
    "Uttar Pradesh",
    "London",
    "Paris",
    "Bali",
    "Bangkok",
    "Indonesia",
    "Singapore",
    "Dubai",
    "Abu Dhabi",
    "Maldives",
    "Sri Lanka",
    "Nepal",
    "Goa honeymoon packages from Delhi",
    "Thailand",
    "Vietnam",
    "Malaysia",
    "Kerala backwater tour packages",
    "Hong Kong",
    "Sydney",
    "New York",
    "Switzerland",
    "Italy",
    "Andaman honeymoon tour package",
    "Turkey",
    "Ladakh bike trip package price",
    "best travel planning website India",
    "Seychelles",
    "New Zealand",
    "Canada",
    "Iceland",
    "pilgrimage tours",
    "wildlife safari",
    "beach holiday",
    "hill station trip",
    "cultural tour",
    "heritage walk",
    "food tour",
    "trekking",
    "camping",
    "custom trip planner India",
    "scuba diving",
    "snorkeling",
    "paragliding",
    "bungee jumping",
    "skiing",
    "Anagha Safar",
    "Anagha Safar travel",
    "best travel website India",
    "safar",
    "safar travel",
    "safar booking",
    "safar website",
    "safar tours",
    "safar holidays",
    "travel safar",
    "my safar",
    "safar trip",
    "safar package",
    "safar India",
    "book trip online",
    "plan my trip",
    "travel booking website",
    "travel booking app",
    "best travel website",
    "travel booking site",
    "online tour booking",
    "book tour online",
    "travel booking India",
    "travel website India",
    "best tour packages",
    "cheap tour packages",
    "best travel deals India",
    "travel planner India",
    "book holiday online",
    "travel booking online India",
    "best tour and travel agency in india",
    "best travel agency in india",
    "top travel agency india",
    "best tour company in india",
    "best travel company in india",
    "travel agency near me",
    "top 10 travel agency in india",
    "trusted travel agency india",
    "best travel agent in india",
    "tour and travel company",
    "tour and travel agency",
    "travel and tourism company india",
    "best tour operator in india",
    "india tour operator",
    "travel agency for domestic tours",
    "travel agency for international tours",
    "best holiday planner india",
    "affordable travel agency india",
    "anagha safar tours",
    "anagha travel agency",
    "anagha safar booking",
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SEOHead
        title="Best Travel Agency in India | Domestic & International Tour Packages"
        description="Book affordable domestic and international tour packages with Anagha Safar. Explore honeymoon packages, family vacations, luxury tours, and customized travel planning across India and worldwide."
        url="/"
        keywords={[
          "travel booking",
          "India travel",
          "luxury tours",
          "flight booking",
          "hotel booking",
          "holiday packages",
          "honeymoon packages",
          "family vacation",
          "travel agency India",
          "international tour packages",
          "domestic tour packages",
          "AI trip planner",
          "custom itinerary",
          ...seoKeywords,
        ]}
        image="/lovable-uploads/ANAGHA_SAFAR_LOGO.png"
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <MadhubaniPattern className="z-[1]" />
          <motion.div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${heroImage})` }}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-secondary/20" />

          <motion.div
            className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-accent/20 blur-2xl"
            animate={floatAnimation}
          />
          <motion.div
            className="absolute bottom-1/3 right-20 w-32 h-32 rounded-full bg-secondary/20 blur-3xl"
            animate={floatAnimation}
          />

          <div className="relative z-10 text-center px-4 space-y-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full mt-16 md:mt-20"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-white">Trusted by 50,000+ Travelers</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Crafting Journeys
              <br />
              <span className="bg-gradient-to-r from-accent via-amber-400 to-orange-400 bg-clip-text text-transparent">
                That Touch the Soul
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Discover luxury hotels, spiritual tours, and unforgettable experiences across India's most breathtaking
              destinations
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link to="/packages">
                <Button
                  size="lg"
                  className="group btn-cta px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-accent/25"
                >
                  Explore Packages
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/itinerary">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg font-semibold"
                >
                  <Sparkles className="mr-2 h-5 w-5 ai-icon-gradient" />
                  AI Trip Planner
                </Button>
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{
              opacity: { delay: 1.5, duration: 0.5 },
              y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
            }}
          >
            <ChevronDown className="h-8 w-8 text-white/60" />
          </motion.div>
        </section>

        {/* Search Bar */}
        <section className="container mx-auto px-4 -mt-16 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SearchBar className="pl-0 pt-[85px] py-[79px]" />
          </motion.div>
        </section>

        {/* Featured Packages */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">Handpicked for You</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Featured <span className="text-secondary">Experiences</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Curated journeys designed to create unforgettable memories
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {featuredPackages.map((pkg, index) => (
                <motion.div key={index} variants={itemVariants} whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                  <PackageCard {...pkg} />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-10"
            >
              <Link to="/packages">
                <Button
                  size="lg"
                  className="group bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-6 text-lg font-semibold shadow-lg"
                >
                  View All Packages
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Trust & Why Choose Us — Combined */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Why Choose <span className="text-accent">Anagha Safar</span>?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We craft experiences that create lifelong memories
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
            >
              {trustItems.map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="text-center p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-secondary/10 mb-4">
                    <item.icon className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
