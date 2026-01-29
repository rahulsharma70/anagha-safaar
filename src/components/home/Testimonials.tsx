import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sagar Gupta",
    location: "Mumbai",
    avatar: "SG",
    rating: 5,
    text: "The Kashmir trip was absolutely magical! Every detail was perfectly planned. The team went above and beyond to make our honeymoon unforgettable.",
    trip: "Kashmir Valley Tour",
  },
  {
    name: "Rohit Saxena",
    location: "Ahmedabad",
    avatar: "RS",
    rating: 5,
    text: "Best travel agency in India! The Rajasthan heritage tour exceeded all expectations. Professional guides and luxurious accommodations throughout.",
    trip: "Rajasthan Heritage Circuit",
  },
  {
    name: "Khushi Chawla",
    location: "Chennai",
    avatar: "AK",
    rating: 5,
    text: "The Kerala backwaters cruise was a dream come true. Impeccable service, delicious food, and memories that will last a lifetime.",
    trip: "Kerala Backwaters Cruise",
  },
  {
    name: "Vikram Singh",
    location: "Delhi",
    avatar: "VS",
    rating: 5,
    text: "Third trip with Anagha Safar and they never disappoint! The Himalayan trek was well-organized with experienced guides. Highly recommended!",
    trip: "Himalayan Spiritual Trek",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const Testimonials = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">Traveler Reviews</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            What Our <span className="text-secondary">Travelers</span> Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied travelers who made unforgettable memories with us
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative bg-card rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-secondary/20" />

              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-secondary/20">
                  <AvatarFallback className="bg-secondary/10 text-secondary font-semibold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-4">"{testimonial.text}"</p>

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-secondary font-medium">{testimonial.trip}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
