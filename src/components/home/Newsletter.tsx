import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Save to newsletter_subscriptions table
      const { error: dbError } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email });

      if (dbError) {
        if (dbError.code === "23505") {
          toast.info("You're already subscribed! Check your inbox for our latest deals.");
          setIsSubscribed(true);
          return;
        }
        throw dbError;
      }

      // Send welcome email via edge function
      const { error: fnError } = await supabase.functions.invoke("newsletter-welcome", {
        body: { email },
      });

      if (fnError) {
        console.error("Welcome email error:", fnError);
        // Still mark as subscribed even if email fails
      }

      setIsSubscribed(true);
      toast.success("Successfully subscribed! Check your email for a welcome message. 🎉");
      setEmail("");
    } catch (err: any) {
      console.error("Newsletter subscription error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--secondary) / 0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6"
          >
            <Mail className="h-8 w-8 text-accent" />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Exclusive Travel Deals
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Subscribe to our newsletter and be the first to know about special offers, new destinations, and travel inspiration.
          </p>

          {isSubscribed ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-2 text-secondary font-medium"
            >
              <Check className="h-5 w-5" />
              <span>You're subscribed! Check your inbox for exclusive deals.</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 px-4 bg-background border-border"
                required
              />
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="btn-cta h-12 px-6 whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="animate-pulse">Subscribing...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            No spam, unsubscribe anytime. By subscribing you agree to our Privacy Policy.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
