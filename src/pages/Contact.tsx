import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import ContactTrustBadges from "@/components/contact/ContactTrustBadges";
import ContactInfoCards from "@/components/contact/ContactInfoCards";
import ContactSocialLinks from "@/components/contact/ContactSocialLinks";
import ContactFAQ from "@/components/contact/ContactFAQ";
import EnhancedContactForm from "@/components/contact/EnhancedContactForm";
import LiveChatWidget from "@/components/contact/LiveChatWidget";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative gradient-hero py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                We're Here to Help 24/7
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
                Get in Touch
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Have questions about your travel plans? Our expert team is ready to assist you with bookings, refunds, and everything in between.
              </p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-white/90">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm">Avg. response time: 2 hours</span>
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div className="text-white/90 text-sm">
                  ⭐ 4.9/5 Customer Satisfaction
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="container mx-auto px-4 -mt-8 relative z-20">
          <ContactTrustBadges />
        </section>

        {/* Contact Info Cards */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Multiple Ways to Reach Us
            </h2>
            <p className="text-muted-foreground">
              Choose your preferred method of communication
            </p>
          </div>
          <ContactInfoCards />
        </section>

        {/* Main Contact Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Social & Quick Contact */}
            <div className="space-y-6">
              <ContactSocialLinks />
              
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a
                    href="tel:+919039939555"
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 transition-colors"
                  >
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-medium">Call Now</p>
                      <p className="text-xs opacity-80">Speak with an agent</p>
                    </div>
                  </a>
                  <a
                    href="https://wa.me/919039939555"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 transition-colors"
                  >
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-xs opacity-80">Chat instantly</p>
                    </div>
                  </a>
                  <a
                    href="mailto:support@anaghasafar.com"
                    className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 transition-colors"
                  >
                    <span className="text-2xl">✉️</span>
                    <div>
                      <p className="font-medium">Email Us</p>
                      <p className="text-xs opacity-80">Get detailed response</p>
                    </div>
                  </a>
                </div>
              </Card>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-2">
              <EnhancedContactForm />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 pb-12">
          <ContactFAQ />
        </section>

        {/* Map Section */}
        <section className="container mx-auto px-4 pb-20">
          <Card className="overflow-hidden shadow-xl">
            <div className="p-4 bg-muted/50 border-b">
              <h3 className="font-semibold">📍 Find Us on Map</h3>
              <p className="text-sm text-muted-foreground">Visit our office in Gwalior, Madhya Pradesh</p>
            </div>
            <div className="w-full h-[400px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d229085.18221770864!2d78.02608252949295!3d26.21436995752023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3976c5d1792291fb%3A0xff4fb56d65bc3adf!2sGwalior%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1764413887593!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Anagha Safar Location"
              />
            </div>
          </Card>
        </section>
      </main>

      <Footer />
      
      {/* Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
};

export default Contact;
