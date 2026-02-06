import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ChevronRight, Compass, Mountain, Waves, 
  Coffee, Camera, Users, Heart, MapPin, Check, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const questions = [
  {
    id: 1,
    question: "How do you prefer to start your mornings on vacation?",
    options: [
      { id: "a", text: "Sunrise yoga or meditation", icon: Sparkles, type: "spiritual" },
      { id: "b", text: "Adventure activities like hiking", icon: Mountain, type: "adventurer" },
      { id: "c", text: "Lazy brunch with a view", icon: Coffee, type: "relaxer" },
      { id: "d", text: "Exploring local markets", icon: Compass, type: "explorer" }
    ]
  },
  {
    id: 2,
    question: "What's your ideal evening activity?",
    options: [
      { id: "a", text: "Romantic dinner by candlelight", icon: Heart, type: "romantic" },
      { id: "b", text: "Beach bonfire or party", icon: Waves, type: "socializer" },
      { id: "c", text: "Photography walk", icon: Camera, type: "creative" },
      { id: "d", text: "Group activities with new friends", icon: Users, type: "socializer" }
    ]
  },
  {
    id: 3,
    question: "Pick your dream accommodation:",
    options: [
      { id: "a", text: "Boutique heritage hotel", icon: MapPin, type: "cultural" },
      { id: "b", text: "Adventure camp or treehouse", icon: Mountain, type: "adventurer" },
      { id: "c", text: "Luxury beach resort", icon: Waves, type: "relaxer" },
      { id: "d", text: "Cozy mountain cabin", icon: Coffee, type: "romantic" }
    ]
  }
];

const personalities = {
  adventurer: {
    title: "The Bold Explorer",
    emoji: "🏔️",
    description: "You crave adrenaline and new challenges. Mountains, treks, and wild experiences call your name!",
    destinations: ["Ladakh", "Rishikesh", "Manali", "Spiti Valley"],
    color: "from-orange-500 to-amber-500"
  },
  relaxer: {
    title: "The Zen Seeker",
    emoji: "🧘",
    description: "You travel to unwind and rejuvenate. Luxury, comfort, and peaceful vibes are your priority.",
    destinations: ["Kerala", "Goa", "Maldives", "Andaman"],
    color: "from-cyan-500 to-blue-500"
  },
  explorer: {
    title: "The Culture Vulture",
    emoji: "🗺️",
    description: "You love immersing in local culture, trying street food, and discovering hidden gems.",
    destinations: ["Jaipur", "Varanasi", "Hampi", "Kolkata"],
    color: "from-purple-500 to-violet-500"
  },
  romantic: {
    title: "The Love Bird",
    emoji: "💕",
    description: "You seek intimate experiences, sunset views, and cozy moments with your special someone.",
    destinations: ["Udaipur", "Coorg", "Munnar", "Shimla"],
    color: "from-rose-500 to-pink-500"
  },
  socializer: {
    title: "The Party Nomad",
    emoji: "🎉",
    description: "You love meeting new people, nightlife, and creating memories with friends!",
    destinations: ["Goa", "Mumbai", "Bangalore", "Kasol"],
    color: "from-fuchsia-500 to-pink-500"
  },
  creative: {
    title: "The Visual Storyteller",
    emoji: "📸",
    description: "You see the world through a lens. Every trip is a photo album waiting to happen.",
    destinations: ["Rann of Kutch", "Spiti", "Pushkar", "Hampi"],
    color: "from-indigo-500 to-blue-500"
  },
  spiritual: {
    title: "The Soul Searcher",
    emoji: "✨",
    description: "You travel for inner peace, spiritual growth, and meaningful experiences.",
    destinations: ["Rishikesh", "Varanasi", "Bodh Gaya", "Dharamshala"],
    color: "from-violet-500 to-purple-500"
  },
  cultural: {
    title: "The Heritage Hunter",
    emoji: "🏛️",
    description: "You're fascinated by history, architecture, and stories from the past.",
    destinations: ["Jaipur", "Agra", "Khajuraho", "Orchha"],
    color: "from-amber-500 to-yellow-500"
  }
};

export const TravelPersonality = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [started, setStarted] = useState(false);

  const handleAnswer = (type: string) => {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const getResult = () => {
    const counts: Record<string, number> = {};
    answers.forEach(type => {
      counts[type] = (counts[type] || 0) + 1;
    });
    const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "explorer";
    return personalities[winner as keyof typeof personalities];
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setStarted(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          {!started ? (
            <Card className="overflow-hidden">
              <div className="relative bg-gradient-to-r from-primary via-secondary to-primary p-8 text-white text-center">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-4 text-6xl">✈️</div>
                  <div className="absolute bottom-4 right-4 text-6xl">🌍</div>
                </div>
                <div className="relative z-10">
                  <div className="text-6xl mb-4">🧭</div>
                  <h2 className="text-3xl font-bold mb-2">Discover Your Travel Personality</h2>
                  <p className="text-white/80 mb-6">
                    Take our 30-second quiz and get personalized destination recommendations!
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
                    onClick={() => setStarted(true)}
                  >
                    Start Quiz
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : !showResult ? (
            <Card>
              <CardContent className="p-8">
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Question {currentQuestion + 1} of {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-2xl font-bold mb-6 text-center">
                      {questions[currentQuestion].question}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {questions[currentQuestion].options.map((option) => (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswer(option.type)}
                          className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <option.icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium">{option.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="overflow-hidden">
                <div className={`bg-gradient-to-r ${getResult().color} p-8 text-white text-center`}>
                  <div className="text-6xl mb-4">{getResult().emoji}</div>
                  <h2 className="text-3xl font-bold mb-2">You are...</h2>
                  <h3 className="text-4xl font-bold">{getResult().title}</h3>
                </div>
                <CardContent className="p-8">
                  <p className="text-lg text-center text-muted-foreground mb-6">
                    {getResult().description}
                  </p>
                  
                  <div className="bg-muted/50 rounded-xl p-6 mb-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Perfect Destinations for You
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getResult().destinations.map((dest) => (
                        <span 
                          key={dest}
                          className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm"
                        >
                          {dest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-full"
                      onClick={resetQuiz}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retake Quiz
                    </Button>
                    <Button className="flex-1 rounded-full">
                      Explore Destinations
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
