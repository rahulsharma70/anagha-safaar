import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Globe, Headphones } from "lucide-react";
import { motion } from "framer-motion";

const contactInfo = [
  {
    icon: MapPin,
    title: "Head Office",
    content: "Gwalior - M.P. (India)",
    subContent: "474001",
    gradient: "from-red-500 to-orange-500"
  },
  {
    icon: Phone,
    title: "Phone Support",
    content: "+91 9039939555",
    subContent: "Toll-free available",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Mail,
    title: "Email Us",
    content: "support@anaghasafar.com",
    subContent: "sales@anaghasafar.com",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Clock,
    title: "Working Hours",
    content: "Mon - Sat: 9 AM - 6 PM",
    subContent: "Sun: Emergency only",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Headphones,
    title: "24/7 Helpline",
    content: "+91 9039939555",
    subContent: "For urgent queries",
    gradient: "from-amber-500 to-yellow-500"
  },
  {
    icon: Globe,
    title: "Languages",
    content: "English, Hindi",
    subContent: "Regional support",
    gradient: "from-teal-500 to-cyan-500"
  }
];

const ContactInfoCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contactInfo.map((info, index) => (
        <motion.div
          key={info.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="h-full hover:shadow-lg transition-all duration-300 group overflow-hidden">
            <CardContent className="pt-6 relative">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${info.gradient}`} />
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${info.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <info.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-card-foreground mb-1">
                    {info.title}
                  </h3>
                  <p className="text-sm text-foreground font-medium">
                    {info.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {info.subContent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ContactInfoCards;
