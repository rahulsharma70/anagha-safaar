import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, MessageCircle } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Rohit Saxena",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    location: "Mumbai",
    trip: "Kerala, 7 days",
    rating: 5,
    text: "The AI planner created the perfect honeymoon itinerary! Every detail was thoughtfully planned. We discovered hidden gems we wouldn't have found on our own.",
  },
  {
    name: "Sagar Gupta",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    location: "Delhi",
    trip: "Ladakh, 10 days",
    rating: 5,
    text: "As a solo backpacker, I was impressed by how well the AI understood my adventure preferences. The bike route suggestions were spot-on!",
  },
  {
    name: "Anita Patel",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    location: "Bangalore",
    trip: "Rajasthan, 12 days",
    rating: 5,
    text: "Planned a family trip for 8 people and the AI balanced everyone's interests perfectly. From kids' activities to heritage sites, it covered everything!",
  },
];

export const PlannerTestimonials = () => {
  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-3 px-4 py-1">
          <MessageCircle className="h-3 w-3 mr-2" />
          Traveler Stories
        </Badge>
        <h2 className="text-2xl font-bold text-foreground">What Our Travelers Say</h2>
        <p className="text-muted-foreground mt-2">Real experiences from travelers who used our AI planner</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
          >
            <Card className="h-full border-2 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {testimonial.trip}
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
