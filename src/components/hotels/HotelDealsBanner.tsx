import { motion } from "framer-motion";
import { Sparkles, Percent, Gift, Clock, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const deals = [
  {
    icon: Sparkles,
    title: "Member Exclusive",
    description: "Extra 15% off for members",
    code: "MEMBER15",
    bgColor: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500"
  },
  {
    icon: Percent,
    title: "Early Bird",
    description: "Book 30 days ahead, save 20%",
    code: "EARLY20",
    bgColor: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500"
  },
  {
    icon: Gift,
    title: "Free Breakfast",
    description: "Complimentary breakfast on select hotels",
    code: "FREEBFAST",
    bgColor: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-500"
  },
  {
    icon: CreditCard,
    title: "Pay at Hotel",
    description: "Free cancellation available",
    code: "PAYHOTEL",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500"
  }
];

const HotelDealsBanner = () => {
  return (
    <div className="overflow-hidden py-4">
      <motion.div
        animate={{ x: [0, -1200] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="flex gap-6"
      >
        {[...deals, ...deals, ...deals].map((deal, index) => (
          <div
            key={index}
            className={`flex-shrink-0 flex items-center gap-4 px-6 py-3 rounded-2xl bg-gradient-to-r ${deal.bgColor} border border-border/30 min-w-[320px]`}
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

export default HotelDealsBanner;
