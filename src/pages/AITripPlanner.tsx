import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart, Loader2, Plane, Send, Globe, Compass, Map, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { PopularDestinationsCarousel } from "@/components/planner/PopularDestinationsCarousel";
import { SampleItineraries } from "@/components/planner/SampleItineraries";
import { PlannerStats } from "@/components/planner/PlannerStats";
import { HowItWorks } from "@/components/planner/HowItWorks";
import { PlannerTestimonials } from "@/components/planner/PlannerTestimonials";

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

  const handleSelectDestination = (dest: string) => {
    setDestination(dest);
    toast.success(`${dest} selected! Customize your trip details below.`);
    // Scroll to form
    document.getElementById("trip-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoadSample = (trip: { destination: string; duration: number; travelers: number; budget: string; style: string }) => {
    setDestination(trip.destination);
    setDuration(trip.duration.toString());
    setTravelers(trip.travelers.toString());
    setBudget(trip.budget);
    setTravelStyle(trip.style);
    toast.success("Template loaded! Customize and generate your itinerary.");
    document.getElementById("trip-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCopyItinerary = () => {
    navigator.clipboard.writeText(itinerary);
    toast.success("Itinerary copied to clipboard!");
  };

  const handleDownloadItinerary = () => {
    const blob = new Blob([itinerary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${destination}-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Itinerary downloaded!");
  };

  const handleShareItinerary = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${destination} Trip Itinerary`,
          text: itinerary.substring(0, 200) + "...",
        });
      } catch {
        toast.error("Sharing cancelled");
      }
    } else {
      handleCopyItinerary();
    }
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
      {/* Enhanced Eye-Catching Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Deep Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-background via-40% to-cyan-900/30" />
        
        {/* Vibrant Mesh Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 10% 30%, hsl(280 70% 50% / 0.4), transparent 50%),
              radial-gradient(ellipse 80% 60% at 90% 20%, hsl(200 80% 60% / 0.35), transparent 50%),
              radial-gradient(ellipse 70% 80% at 50% 90%, hsl(320 60% 50% / 0.3), transparent 50%),
              radial-gradient(ellipse 60% 40% at 70% 60%, hsl(180 70% 50% / 0.25), transparent 40%)
            `,
          }}
        />
        
        {/* Pulsing Aurora Effect */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, 
              hsl(280 80% 60% / 0.15) 0%, 
              transparent 25%,
              hsl(200 90% 60% / 0.2) 50%,
              transparent 75%,
              hsl(320 70% 55% / 0.15) 100%)`,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Large Animated Glowing Orbs */}
        <motion.div
          className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, hsl(280 70% 60% / 0.5) 0%, hsl(280 70% 60% / 0) 70%)',
          }}
          animate={{
            x: [0, 120, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 -right-48 w-[800px] h-[800px] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, hsl(200 80% 55% / 0.5) 0%, hsl(200 80% 55% / 0) 70%)',
          }}
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-48 left-1/3 w-[750px] h-[750px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, hsl(320 70% 55% / 0.45) 0%, hsl(320 70% 55% / 0) 70%)',
          }}
          animate={{
            x: [0, 150, 0],
            y: [0, -70, 0],
            scale: [1, 1.35, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, hsl(180 70% 50% / 0.4) 0%, hsl(180 70% 50% / 0) 70%)',
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Glow Rings */}
        <motion.div
          className="absolute top-20 left-[15%] w-32 h-32 border-2 border-cyan-400/30 rounded-full"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-32 right-[20%] w-48 h-48 border border-violet-400/25 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-[45%] right-[10%] w-24 h-24 border-2 border-pink-400/30 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.25, 0.55, 0.25],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating Travel Icons with Glow */}
        <motion.div
          className="absolute top-24 right-[20%]"
          animate={{
            y: [0, -40, 0],
            rotate: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Globe className="w-24 h-24 text-cyan-400/50 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
        </motion.div>
        <motion.div
          className="absolute bottom-40 right-[12%]"
          animate={{
            y: [0, 35, 0],
            rotate: [0, -25, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Compass className="w-20 h-20 text-violet-400/50 drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
        </motion.div>
        <motion.div
          className="absolute top-[35%] left-[6%]"
          animate={{
            y: [0, -45, 0],
            x: [0, 20, 0],
            rotate: [0, 15, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Map className="w-20 h-20 text-pink-400/50 drop-shadow-[0_0_15px_rgba(244,114,182,0.5)]" />
        </motion.div>
        <motion.div
          className="absolute bottom-[35%] left-[15%]"
          animate={{
            y: [0, 40, 0],
            rotate: [0, 30, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Plane className="w-18 h-18 text-teal-400/50 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
        </motion.div>
        <motion.div
          className="absolute top-[12%] left-[35%]"
          animate={{
            y: [0, -25, 0],
            x: [0, -25, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-16 h-16 text-amber-400/50 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
        </motion.div>

        {/* Animated Glowing Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${10 + i * 8}%`,
              top: `${15 + (i % 4) * 20}%`,
              width: `${6 + (i % 3) * 4}px`,
              height: `${6 + (i % 3) * 4}px`,
              background: i % 3 === 0 
                ? 'radial-gradient(circle, hsl(200 80% 60% / 0.8) 0%, transparent 70%)' 
                : i % 3 === 1 
                ? 'radial-gradient(circle, hsl(280 70% 60% / 0.8) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsl(320 70% 55% / 0.8) 0%, transparent 70%)',
              boxShadow: i % 3 === 0 
                ? '0 0 15px 5px hsl(200 80% 60% / 0.4)' 
                : i % 3 === 1 
                ? '0 0 15px 5px hsl(280 70% 60% / 0.4)'
                : '0 0 15px 5px hsl(320 70% 55% / 0.4)',
            }}
            animate={{
              y: [0, -60 - i * 5, 0],
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}

        {/* Shooting Stars Effect */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${20 + i * 30}%`,
              top: `${10 + i * 15}%`,
              boxShadow: '0 0 6px 2px rgba(255,255,255,0.8), -20px 0 20px 2px rgba(255,255,255,0.3)',
            }}
            animate={{
              x: [0, 200],
              y: [0, 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 4,
              repeatDelay: 8,
            }}
          />
        ))}

        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(hsl(200 80% 60%) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(200 80% 60%) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Noise Texture for Depth */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
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

        {/* Stats Section */}
        <PlannerStats />

        {/* How It Works */}
        <HowItWorks />

        {/* Trending Destinations Carousel */}
        <PopularDestinationsCarousel onSelectDestination={handleSelectDestination} />

        {/* Sample Itineraries */}
        <SampleItineraries onLoadSample={handleLoadSample} />

        {/* Main Form & Results Section */}
        <div id="trip-form" className="grid lg:grid-cols-2 gap-8 scroll-mt-8">
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Your Personalized Itinerary
                  </CardTitle>
                  <CardDescription>
                    AI-generated travel plan based on your preferences
                  </CardDescription>
                </div>
                {itinerary && (
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={handleCopyItinerary} title="Copy">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleDownloadItinerary} title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleShareItinerary} title="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
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
                <div className="prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {itinerary}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Testimonials */}
        <div className="mt-12">
          <PlannerTestimonials />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AITripPlanner;
