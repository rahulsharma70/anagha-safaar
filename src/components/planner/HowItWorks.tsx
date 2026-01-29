import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sliders, Sparkles, Download, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: MapPin,
    title: "Choose Destination",
    description: "Enter your dream destination or select from trending places",
    color: "bg-cyan-500/20 text-cyan-500",
  },
  {
    icon: Sliders,
    title: "Set Preferences",
    description: "Customize duration, budget, travel style, and interests",
    color: "bg-violet-500/20 text-violet-500",
  },
  {
    icon: Sparkles,
    title: "AI Generation",
    description: "Our AI creates a personalized day-by-day itinerary",
    color: "bg-amber-500/20 text-amber-500",
  },
  {
    icon: Download,
    title: "Save & Share",
    description: "Download, copy, or share your itinerary with travel companions",
    color: "bg-emerald-500/20 text-emerald-500",
  },
];

export const HowItWorks = () => {
  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-3 px-4 py-1">
          Simple Process
        </Badge>
        <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
        <p className="text-muted-foreground mt-2">
          Get your personalized itinerary in 4 easy steps
        </p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/30 via-violet-500/30 to-emerald-500/30 -translate-y-1/2 z-0" />

        <div className="grid md:grid-cols-4 gap-6 relative z-10">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <div className="p-6 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-center hover:border-primary/50 transition-all duration-300 h-full">
                <div className={`inline-flex p-4 rounded-full ${step.color} mb-4`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20">
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
