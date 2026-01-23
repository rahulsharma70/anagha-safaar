import { Shield, Clock, CreditCard, Headphones, Award, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  {
    icon: Shield,
    title: "100% Secure",
    description: "SSL encrypted payments"
  },
  {
    icon: Clock,
    title: "Instant Confirmation",
    description: "E-ticket in seconds"
  },
  {
    icon: CreditCard,
    title: "Best Price Guarantee",
    description: "Or we'll refund the difference"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always here to help"
  }
];

const FlightTrustBadges = () => {
  return (
    <section className="bg-muted/30 border-y border-border/30 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <badge.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlightTrustBadges;
