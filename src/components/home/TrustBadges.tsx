import { motion } from "framer-motion";
import { Shield, CreditCard, Headphones, Award, CheckCircle2, Lock } from "lucide-react";

const badges = [
  {
    icon: Shield,
    title: "100% Safe & Secure",
    description: "Protected payments"
  },
  {
    icon: Award,
    title: "Government Approved",
    description: "Licensed tour operator"
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    description: "EMI & card options"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always here to help"
  }
];

export const TrustBadges = () => {
  return (
    <section className="py-8 border-y border-border bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
        >
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10">
                <badge.icon className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
