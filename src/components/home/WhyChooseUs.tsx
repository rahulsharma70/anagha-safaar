import { motion } from "framer-motion";
import { Users, MapPin, Headphones, ThumbsUp, Calendar, Heart } from "lucide-react";

const reasons = [
  {
    icon: Users,
    value: "50,000+",
    label: "Happy Travelers",
    description: "Trusted by travelers across India"
  },
  {
    icon: MapPin,
    value: "200+",
    label: "Destinations",
    description: "Curated locations to explore"
  },
  {
    icon: Calendar,
    value: "15+",
    label: "Years Experience",
    description: "Crafting perfect journeys since 2010"
  },
  {
    icon: ThumbsUp,
    value: "98%",
    label: "Satisfaction Rate",
    description: "Based on verified reviews"
  },
  {
    icon: Headphones,
    value: "24/7",
    label: "Support Available",
    description: "We're always here for you"
  },
  {
    icon: Heart,
    value: "100%",
    label: "Personalized",
    description: "Trips tailored to your needs"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose <span className="text-accent">Anagha Safar</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We don't just plan trips, we craft experiences that create lifelong memories
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.03 }}
              className="text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <motion.div
                whileHover={{ rotate: 10 }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 mb-4"
              >
                <reason.icon className="h-6 w-6 text-secondary" />
              </motion.div>
              <p className="text-2xl font-bold text-foreground mb-1">{reason.value}</p>
              <p className="text-sm font-medium text-foreground mb-1">{reason.label}</p>
              <p className="text-xs text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
