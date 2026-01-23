import { motion } from "framer-motion";
import { Sparkles, Clock, Percent, Zap, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const deals = [
  {
    icon: Sparkles,
    title: "Flash Sale",
    description: "Up to 40% off on domestic flights",
    code: "FLY40",
    bgColor: "from-orange-500/20 to-yellow-500/20",
    iconColor: "text-orange-500"
  },
  {
    icon: Gift,
    title: "First Booking",
    description: "₹500 instant discount",
    code: "FIRST500",
    bgColor: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500"
  },
  {
    icon: Zap,
    title: "Weekend Special",
    description: "Extra 10% cashback",
    code: "WEEKEND10",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500"
  }
];

const FlightDealsBanner = () => {
  return (
    <div className="overflow-hidden py-4">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="flex gap-6"
      >
        {[...deals, ...deals, ...deals].map((deal, index) => (
          <div
            key={index}
            className={`flex-shrink-0 flex items-center gap-4 px-6 py-3 rounded-2xl bg-gradient-to-r ${deal.bgColor} border border-border/30 min-w-[300px]`}
          >
            <div className={`p-2 rounded-xl bg-background/80 ${deal.iconColor}`}>
              <deal.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{deal.title}</span>
                <Badge variant="outline" className="text-xs px-2 py-0">
                  {deal.code}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{deal.description}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default FlightDealsBanner;
