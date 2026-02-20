import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Clock, Users, CheckCircle, XCircle, ArrowLeft, Calendar, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import ReviewSection from "@/components/ReviewSection";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

const TourDetail = () => {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [aiItinerary, setAiItinerary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const { data: tour, isLoading } = useQuery({
    queryKey: ["tour", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Auto-generate itinerary when tour loads and user fills in details
  const generateAIItinerary = async () => {
    if (!tour || !startDate || !travelers) {
      toast.error("Please fill in start date and number of travelers");
      return;
    }

    setIsGenerating(true);
    setAiItinerary("");

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
            destination: `${tour.name} - ${tour.location_city}, ${tour.location_state}`,
            duration: tour.duration_days,
            travelers: parseInt(travelers),
            budget: `₹${Number(tour.price_per_person).toLocaleString()} per person`,
            interests: [tour.tour_type || "Adventure", "Culture & History", "Nature & Wildlife"],
            travelStyle: tour.difficulty === "easy" ? "mid-range" : tour.difficulty === "challenging" ? "backpacker" : "mid-range",
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
          return;
        }
        if (response.status === 402) {
          toast.error("Service temporarily unavailable. Please try again later.");
          return;
        }
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
                setAiItinerary(fullText);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      setHasGenerated(true);
      toast.success("Personalized itinerary generated!");
    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate itinerary");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full rounded-2xl mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Tour Not Found</h1>
          <Link to="/tours">
            <Button variant="hero">Back to Tours</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const images = (tour.images as string[]) || [];
  const itinerary = (tour.itinerary as any[]) || [];
  const inclusions = (tour.inclusions as string[]) || [];
  const exclusions = (tour.exclusions as string[]) || [];

  const difficultyColors = {
    easy: "bg-success/10 text-success",
    moderate: "bg-accent/10 text-accent",
    challenging: "bg-destructive/10 text-destructive",
  };

  const seoDescription = tour.description
    ? tour.description.slice(0, 155)
    : `${tour.name} - ${tour.duration_days}-day ${tour.tour_type || "tour"} in ${tour.location_city}, ${tour.location_state}. From ₹${Number(tour.price_per_person).toLocaleString()} per person.`;

  const tourStructuredData = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.name,
    description: seoDescription,
    touristType: tour.tour_type,
    itinerary: { "@type": "ItemList", numberOfItems: tour.duration_days },
    provider: { "@type": "Organization", name: "Anagha Safar" },
    offers: {
      "@type": "Offer",
      price: tour.price_per_person,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    image: images[0] || undefined,
  };

  return (
    <>
      <SEOHead
        title={`${tour.name} - ${tour.duration_days} Day Tour`}
        description={seoDescription}
        image={images[0]}
        url={`/tours/${tour.slug}`}
        structuredData={tourStructuredData}
      />
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Back Button */}
        <div className="container mx-auto px-4 py-6">
          <Link to="/tours">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Tours
            </Button>
          </Link>
        </div>

        {/* Gallery */}
        <section className="container mx-auto px-4 mb-8">
          <div className="h-[400px] lg:h-[500px] rounded-2xl overflow-hidden mb-4">
            <img
              src={images[selectedImage] || "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200"}
              alt={tour.name}
              className="w-full h-full object-cover hover:scale-105 transition-smooth duration-700"
            />
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tour.is_featured && (
                    <Badge className="gradient-gold text-accent-foreground">Featured</Badge>
                  )}
                  {tour.tour_type && (
                    <Badge variant="secondary" className="capitalize">{tour.tour_type}</Badge>
                  )}
                  <Badge className={difficultyColors[tour.difficulty as keyof typeof difficultyColors]}>
                    {tour.difficulty}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{tour.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-5 w-5" />
                    <span>{tour.location_city}, {tour.location_state}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-5 w-5" />
                    <span>{tour.duration_days} Days</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-5 w-5" />
                    <span>Max {tour.max_group_size} people</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Overview</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {tour.description}
                </p>
              </div>

              {/* Default Itinerary */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Standard Itinerary</h2>
                <Accordion type="single" collapsible className="w-full">
                  {itinerary.map((day, idx) => (
                    <AccordionItem key={idx} value={`day-${idx}`}>
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-accent" />
                          <span>Day {day.day}: {day.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pl-8">
                        {day.description}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* AI Generated Itinerary Section */}
              {(aiItinerary || isGenerating) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-semibold">AI-Personalized Itinerary</h2>
                      {isGenerating && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary ml-2" />
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {aiItinerary ? (
                        <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                          {aiItinerary}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating your personalized itinerary...</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Inclusions & Exclusions */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>What's Included</span>
                  </h3>
                  <ul className="space-y-2">
                    {inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span>What's Not Included</span>
                  </h3>
                  <ul className="space-y-2">
                    {exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <XCircle className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 p-6 shadow-lg">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Price per person</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-bold text-accent">
                        ₹{Number(tour.price_per_person).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Number of Travelers</label>
                      <input
                        type="number"
                        min="1"
                        max={tour.max_group_size}
                        value={travelers}
                        onChange={(e) => setTravelers(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>

                  {/* AI Generate Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 border-primary/50 hover:bg-primary/10"
                    onClick={generateAIItinerary}
                    disabled={isGenerating || !startDate || !travelers}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {hasGenerated ? "Regenerate AI Itinerary" : "Generate AI Itinerary"}
                      </>
                    )}
                  </Button>

                  <Link to={`/booking/checkout?type=tour&id=${tour.id}&name=${encodeURIComponent(tour.name)}&price=${tour.price_per_person}`}>
                    <Button variant="hero" size="lg" className="w-full">
                      Book This Tour
                    </Button>
                  </Link>

                  <p className="text-xs text-center text-muted-foreground">
                    Reserve your spot today
                  </p>

                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{tour.duration_days} Days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Group Size</span>
                      <span className="font-medium">Max {tour.max_group_size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty</span>
                      <span className="font-medium capitalize">{tour.difficulty}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TourDetail;
