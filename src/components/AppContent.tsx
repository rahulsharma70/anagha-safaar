import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";

export const AppContent = ({ children }: { children: React.ReactNode }) => {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <>
      <OnboardingModal open={showOnboarding} onComplete={completeOnboarding} />
      {children}
    </>
  );
};
