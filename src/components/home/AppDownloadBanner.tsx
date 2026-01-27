import { motion } from "framer-motion";
import { Smartphone, Star, Download, Check, Bell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  "Exclusive app-only deals",
  "Real-time flight status",
  "Offline access to bookings",
  "Instant notifications"
];

export const AppDownloadBanner = () => {
  return (
    <section className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-primary via-primary/90 to-secondary rounded-3xl p-8 md:p-12 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full" />
            <div className="absolute bottom-10 right-10 w-48 h-48 border border-white rounded-full" />
            <div className="absolute top-1/2 left-1/4 w-20 h-20 border border-white rounded-full" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            {/* Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex-shrink-0"
            >
              <div className="w-64 h-[500px] bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-background to-muted rounded-[2.5rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl" />
                  
                  {/* App Content Preview */}
                  <div className="pt-10 px-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-sm">Anagha Safar</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-muted rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium">Price Alert!</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Flights to Goa dropped 30%</p>
                      </div>
                      
                      <div className="bg-muted rounded-xl p-3">
                        <div className="h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg mb-2" />
                        <p className="text-xs font-medium">Exclusive: ₹500 off first booking</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted rounded-xl p-3 text-center">
                          <span className="text-lg">✈️</span>
                          <p className="text-xs mt-1">Flights</p>
                        </div>
                        <div className="bg-muted rounded-xl p-3 text-center">
                          <span className="text-lg">🏨</span>
                          <p className="text-xs mt-1">Hotels</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -right-4 top-20 bg-white rounded-xl shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">4.8</span>
                </div>
                <p className="text-xs text-muted-foreground">10k+ reviews</p>
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-white text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Download Our App</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Travel Smarter with
                <br />
                <span className="text-accent">Anagha Safar App</span>
              </h2>
              
              <p className="text-lg text-white/80 mb-8 max-w-lg">
                Get exclusive deals, instant notifications, and manage all your bookings on the go!
              </p>
              
              <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-black hover:bg-black/90 text-white rounded-xl px-6"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.5 12.5c0-1.58-.79-2.96-2-3.79V6c0-.55-.45-1-1-1H9.5c-.55 0-1 .45-1 1v2.71c-1.21.83-2 2.21-2 3.79 0 2.48 2.02 4.5 4.5 4.5s4.5-2.02 4.5-4.5zM12 15c-1.38 0-2.5-1.12-2.5-2.5S10.62 10 12 10s2.5 1.12 2.5 2.5S13.38 15 12 15z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </Button>
                
                <Button 
                  size="lg" 
                  className="bg-black hover:bg-black/90 text-white rounded-xl px-6"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.56.68.56 1.19s-.22.92-.56 1.19l-2.04 1.15-2.5-2.5 2.5-2.5 2.04 1.47zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
