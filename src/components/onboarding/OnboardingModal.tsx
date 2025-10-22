import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plane, Hotel, Map, Gift, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    icon: Plane,
    title: 'Welcome to Anagha Safaar',
    description: 'Your ultimate travel companion for exploring incredible destinations across India and beyond.',
    features: ['Book Flights', 'Reserve Hotels', 'Discover Tours']
  },
  {
    icon: Hotel,
    title: 'Seamless Booking Experience',
    description: 'Book flights, hotels, and tours in just a few clicks with our intuitive 6-step booking process.',
    features: ['Easy Guest Management', 'Flexible Add-ons', 'Secure Payments']
  },
  {
    icon: Map,
    title: 'Personalized Dashboard',
    description: 'Track your bookings, manage your profile, and earn loyalty points with every journey.',
    features: ['Booking History', 'Favorites & Wishlist', 'Loyalty Rewards']
  },
  {
    icon: Gift,
    title: 'Exclusive Benefits',
    description: 'Refer friends, earn rewards, and unlock special deals on your favorite destinations.',
    features: ['Referral Bonuses', 'Special Discounts', 'Priority Support']
  }
];

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="relative">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          <div className="p-6 space-y-4">
            {step.features.map((feature, index) => (
              <Card key={index} className="p-4 border-l-4 border-l-primary">
                <p className="font-medium">{feature}</p>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 py-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between p-6 border-t">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip Tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  'Get Started'
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
