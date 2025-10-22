import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = 'onboarding_completed';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`);
      if (!hasCompletedOnboarding) {
        // Show onboarding after a short delay for better UX
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, 'true');
      setShowOnboarding(false);
    }
  };

  return {
    showOnboarding,
    completeOnboarding,
  };
};
