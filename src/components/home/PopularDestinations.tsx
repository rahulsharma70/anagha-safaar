import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Plane, Building2, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

const destinations = [
  {
    name: "Goa",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&h=400&fit=crop",
    tagline: "Beach Paradise",
    flights: "From ₹2,499",
    hotels: "From ₹1,299",
    href: "/hotels?destination=Goa"
  },
  {
    name: "Jaipur",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&h=400&fit=crop",
    tagline: "Pink City",
    flights: "From ₹1,999",
    hotels: "From ₹999",
    href: "/hotels?destination=Jaipur"
  },
  {
    name: "Kerala",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=400&fit=crop",
    tagline: "God's Own Country",
    flights: "From ₹3,499",
    hotels: "From ₹1,499",
    href: "/hotels?destination=Kerala"
  },
  {
    name: "Ladakh",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&h=400&fit=crop",
    tagline: "Land of High Passes",
    flights: "From ₹5,999",
    hotels: "From ₹1,999",
    href: "/tours?destination=Ladakh"
  },
  {
    name: "Shimla",
    image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=600&h=400&fit=crop",
    tagline: "Queen of Hills",
    flights: "From ₹3,999",
    hotels: "From ₹1,199",
    href: "/hotels?destination=Shimla"
  },
  {
    name: "Udaipur",
    image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=600&h=400&fit=crop",
    tagline: "City of Lakes",
    flights: "From ₹2,799",
    hotels: "From ₹1,599",
    href: "/hotels?destination=Udaipur"
  }
];

export const PopularDestinations = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Trending Now</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Popular <span className="text-primary">Destinations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the most sought-after destinations with unbeatable deals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative rounded-3xl overflow-hidden cursor-pointer"
            >
              <Link to={destination.href}>
                <div className="aspect-[4/3] relative">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <span className="text-sm text-white/80 mb-1">{destination.tagline}</span>
                    <h3 className="text-3xl font-bold text-white mb-4">{destination.name}</h3>
                    
                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Plane className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">{destination.flights}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Building2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">{destination.hotels}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/hotels">
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Explore All Destinations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
