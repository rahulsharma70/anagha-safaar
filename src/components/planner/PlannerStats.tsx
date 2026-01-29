import { motion } from "framer-motion";
import { Users, Map, Star, Clock } from "lucide-react";

const STATS = [
  {
    icon: Users,
    value: "50K+",
    label: "Happy Travelers",
    color: "text-cyan-500",
  },
  {
    icon: Map,
    value: "10K+",
    label: "Itineraries Created",
    color: "text-violet-500",
  },
  {
    icon: Star,
    value: "4.9",
    label: "Average Rating",
    color: "text-amber-500",
  },
  {
    icon: Clock,
    value: "30s",
    label: "Generation Time",
    color: "text-emerald-500",
  },
];

export const PlannerStats = () => {
  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-center group hover:border-primary/50 transition-all duration-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={`inline-flex p-3 rounded-full bg-background/80 mb-3 ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
