import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy, Medal, Star, Flame, MapPin, Plane, Camera, 
  Heart, Mountain, Crown, Zap, Target, Gift, Lock,
  ChevronRight, Sparkles
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-booking",
    name: "First Steps",
    description: "Complete your first booking",
    icon: Plane,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    unlocked: true,
    rarity: "common",
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Visit 5 different destinations",
    icon: MapPin,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    unlocked: true,
    progress: 5,
    maxProgress: 5,
    rarity: "common",
  },
  {
    id: "photographer",
    name: "Travel Photographer",
    description: "Upload 10 trip photos",
    icon: Camera,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    unlocked: false,
    progress: 3,
    maxProgress: 10,
    rarity: "rare",
  },
  {
    id: "adventurer",
    name: "Adventure Seeker",
    description: "Book an adventure tour",
    icon: Mountain,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    unlocked: true,
    rarity: "rare",
  },
  {
    id: "romantic",
    name: "Hopeless Romantic",
    description: "Book a couple's getaway",
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: "rare",
  },
  {
    id: "streak-7",
    name: "Weekly Wanderer",
    description: "Maintain a 7-day login streak",
    icon: Flame,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    unlocked: true,
    rarity: "epic",
  },
  {
    id: "reviewer",
    name: "Trusted Reviewer",
    description: "Write 25 helpful reviews",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    unlocked: false,
    progress: 12,
    maxProgress: 25,
    rarity: "epic",
  },
  {
    id: "legend",
    name: "Travel Legend",
    description: "Complete 50 bookings",
    icon: Crown,
    color: "text-amber-400",
    bgColor: "bg-gradient-to-br from-amber-500/20 to-yellow-500/20",
    unlocked: false,
    progress: 23,
    maxProgress: 50,
    rarity: "legendary",
  },
];

const STREAKS = {
  current: 12,
  best: 28,
  multiplier: 1.5,
};

const rarityColors = {
  common: "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50",
  rare: "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30",
  epic: "border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30",
  legendary: "border-amber-400 dark:border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30",
};

const rarityLabels = {
  common: { text: "Common", color: "text-slate-600 dark:text-slate-400" },
  rare: { text: "Rare", color: "text-blue-600 dark:text-blue-400" },
  epic: { text: "Epic", color: "text-purple-600 dark:text-purple-400" },
  legendary: { text: "Legendary", color: "text-amber-600 dark:text-amber-400" },
};

export const GamificationSystem = () => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            <Trophy className="h-3.5 w-3.5 mr-2 text-accent" />
            Traveler Rewards
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Earn <span className="text-accent">Badges</span> & Rewards
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every journey unlocks achievements. Collect badges, maintain streaks, and climb the leaderboard!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/20">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  Login Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <motion.div
                    className="text-6xl font-bold text-orange-500"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {STREAKS.current}
                  </motion.div>
                  <p className="text-muted-foreground">Days in a row</p>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{STREAKS.best}</p>
                    <p className="text-muted-foreground">Best Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">{STREAKS.multiplier}x</p>
                    <p className="text-muted-foreground">Points Multiplier</p>
                  </div>
                </div>

                <div className="bg-card/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Next reward at 14 days</p>
                  <Progress value={(STREAKS.current / 14) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">2 days to go!</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent/20">
                      <Medal className="h-6 w-6 text-accent" />
                    </div>
                    Achievements
                  </CardTitle>
                  <Badge variant="secondary">
                    {unlockedCount}/{ACHIEVEMENTS.length} Unlocked
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ACHIEVEMENTS.map((achievement, index) => (
                    <motion.button
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAchievement(achievement)}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-200
                        ${achievement.unlocked 
                          ? rarityColors[achievement.rarity]
                          : 'border-border bg-muted/50 opacity-60'
                        }
                      `}
                    >
                      <div className={`
                        w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2
                        ${achievement.unlocked ? achievement.bgColor : 'bg-muted'}
                      `}>
                        {achievement.unlocked ? (
                          <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-center line-clamp-2">
                        {achievement.name}
                      </p>
                      {achievement.progress !== undefined && !achievement.unlocked && (
                        <div className="mt-2">
                          <Progress 
                            value={(achievement.progress / (achievement.maxProgress || 1)) * 100} 
                            className="h-1"
                          />
                        </div>
                      )}
                      {achievement.unlocked && (
                        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Achievement Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedAchievement(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`
                  bg-card rounded-2xl p-6 max-w-sm w-full border-2 shadow-xl
                  ${rarityColors[selectedAchievement.rarity]}
                `}
              >
                <div className="text-center">
                  <div className={`
                    w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4
                    ${selectedAchievement.unlocked ? selectedAchievement.bgColor : 'bg-muted'}
                  `}>
                    {selectedAchievement.unlocked ? (
                      <selectedAchievement.icon className={`h-10 w-10 ${selectedAchievement.color}`} />
                    ) : (
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <Badge className={rarityLabels[selectedAchievement.rarity].color}>
                    {rarityLabels[selectedAchievement.rarity].text}
                  </Badge>
                  
                  <h3 className="text-xl font-bold mt-3">{selectedAchievement.name}</h3>
                  <p className="text-muted-foreground mt-2">{selectedAchievement.description}</p>
                  
                  {selectedAchievement.progress !== undefined && (
                    <div className="mt-4">
                      <Progress 
                        value={(selectedAchievement.progress / (selectedAchievement.maxProgress || 1)) * 100}
                        className="h-2"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    className="mt-6 w-full" 
                    onClick={() => setSelectedAchievement(null)}
                  >
                    {selectedAchievement.unlocked ? "Awesome!" : "Keep Going!"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
