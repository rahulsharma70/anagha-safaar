import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart, Loader2, Plane, Send, Globe, Compass, Map } from "lucide-react";
import { toast } from "sonner";

const INTERESTS = [
  "Adventure",
  "Culture & History",
  "Nature & Wildlife",
  "Beach & Relaxation",
  "Food & Culinary",
  "Photography",
  "Spiritual & Wellness",
  "Shopping",
  "Nightlife",
  "Family Activities",
];

const TRAVEL_STYLES = [
  { value: "budget", label: "Budget Friendly" },
  { value: "mid-range", label: "Mid-Range Comfort" },
  { value: "luxury", label: "Luxury Experience" },
  { value: "backpacker", label: "Backpacker" },
];

const BUDGET_OPTIONS = [
  { value: "under-25k", label: "Under ₹25,000" },
  { value: "25k-50k", label: "₹25,000 - ₹50,000" },
  { value: "50k-1l", label: "₹50,000 - ₹1,00,000" },
  { value: "1l-2l", label: "₹1,00,000 - ₹2,00,000" },
  { value: "above-2l", label: "Above ₹2,00,000" },
];

const AITripPlanner = () => {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState("");
  const [itinerary, setItinerary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerateItinerary = async () => {
    if (!destination || !duration || !budget || !travelStyle || selectedInterests.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setItinerary("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-trip-planner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            destination,
            duration: parseInt(duration),
            travelers: parseInt(travelers),
            budget,
            interests: selectedInterests,
            travelStyle,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate itinerary");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        let textBuffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          textBuffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setItinerary(fullText);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      toast.success("Itinerary generated successfully!");
    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate itinerary");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Rich Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background via-50% to-accent/15" />
        
        {/* Mesh Gradient Overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--primary) / 0.3), transparent),
              radial-gradient(ellipse 60% 40% at 80% 20%, hsl(var(--accent) / 0.25), transparent),
              radial-gradient(ellipse 50% 60% at 60% 80%, hsl(var(--primary) / 0.2), transparent)
            `,
          }}
        />
        
        {/* Large Animated Orbs */}
        <motion.div
          className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-primary/30 to-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 80, 0],
            y: [0, 60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-gradient-to-bl from-accent/25 to-primary/15 rounded-full blur-3xl"
          animate={{
            x: [0, -60, 0],
            y: [0, 80, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-32 left-1/4 w-[550px] h-[550px] bg-gradient-to-tr from-primary/20 via-accent/15 to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-primary/15 to-accent/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Travel Icons */}
        <motion.div
          className="absolute top-24 right-[20%] text-primary/30"
          animate={{
            y: [0, -30, 0],
            rotate: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Globe className="w-20 h-20" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-[15%] text-accent/40"
          animate={{
            y: [0, 25, 0],
            rotate: [0, -20, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Compass className="w-16 h-16" />
        </motion.div>
        <motion.div
          className="absolute top-[40%] left-[8%] text-primary/25"
          animate={{
            y: [0, -35, 0],
            x: [0, 15, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Map className="w-18 h-18" />
        </motion.div>
        <motion.div
          className="absolute bottom-[40%] left-[18%] text-accent/35"
          animate={{
            y: [0, 30, 0],
            rotate: [0, 25, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Plane className="w-14 h-14" />
        </motion.div>
        <motion.div
          className="absolute top-[15%] left-[40%] text-primary/20"
          animate={{
            y: [0, -20, 0],
            x: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-12 h-12" />
        </motion.div>

        {/* Animated Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/40 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Diagonal Lines Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              hsl(var(--primary)),
              hsl(var(--primary)) 1px,
              transparent 1px,
              transparent 60px
            )`,
          }}
        />
      </div>

      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-4 py-2 rounded-full mb-4 border border-primary/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">AI-Powered Trip Planning</span>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Plan Your Dream Trip with AI
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Tell us your preferences and let our AI create a personalized travel itinerary just for you. 
            Experience smart travel planning in seconds!
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
          <Card className="border-2 backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                Trip Details
              </CardTitle>
              <CardDescription>
                Fill in your preferences to generate a personalized itinerary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Destination
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g., Goa, Kerala, Rajasthan, Ladakh"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              {/* Duration & Travelers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Duration (Days)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="30"
                    placeholder="e.g., 5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Travelers
                  </Label>
                  <Input
                    id="travelers"
                    type="number"
                    min="1"
                    max="20"
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Budget (per person)
                </Label>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <Label>Travel Style</Label>
                <Select value={travelStyle} onValueChange={setTravelStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your travel style" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAVEL_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Interests (Select multiple)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80 transition-colors"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateItinerary}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Your Itinerary...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Generate AI Itinerary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
          {/* Itinerary Output */}
          <Card className="border-2 backdrop-blur-sm bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Personalized Itinerary
              </CardTitle>
              <CardDescription>
                AI-generated travel plan based on your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !itinerary && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                  <p className="text-lg">Creating your perfect itinerary...</p>
                  <p className="text-sm">This may take a few seconds</p>
                </div>
              )}
              
              {!isLoading && !itinerary && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Plane className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Ready to plan your adventure?</p>
                  <p className="text-sm text-center mt-2">
                    Fill in your trip details and click "Generate AI Itinerary" to get started
                  </p>
                </div>
              )}
              
              {itinerary && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {itinerary}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AITripPlanner;
