import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart, Loader2, Plane, Send } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">AI-Powered Trip Planning</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Plan Your Dream Trip with AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us your preferences and let our AI create a personalized travel itinerary just for you. 
            Experience smart travel planning in seconds!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="border-2">
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

          {/* Itinerary Output */}
          <Card className="border-2">
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AITripPlanner;
