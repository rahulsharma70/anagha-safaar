import { Shield, Clock, HeadphonesIcon, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  {
    icon: Clock,
    title: "Quick Response",
    description: "Within 2 hours",
    color: "text-green-500"
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Always available",
    color: "text-blue-500"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is safe",
    color: "text-purple-500"
  },
  {
    icon: MessageCircle,
    title: "Expert Team",
    description: "Travel specialists",
    color: "text-orange-500"
  }
];

const ContactTrustBadges = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300"
        >
          <div className={`p-3 rounded-full bg-muted mb-3 ${badge.color}`}>
            <badge.icon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-card-foreground text-sm">{badge.title}</h3>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default ContactTrustBadges;
