import { useState, useEffect, useCallback } from "react";

const ONBOARDING_COMPLETED_KEY = "onboarding-completed";
const ONBOARDING_STARTED_KEY = "onboarding-started";

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasStartedOnboarding: boolean;
  showTour: boolean;
}

interface OnboardingActions {
  startTour: () => void;
  closeTour: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): OnboardingState & OnboardingActions {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
      const started = localStorage.getItem(ONBOARDING_STARTED_KEY) === "true";
      setHasCompletedOnboarding(completed);
      setHasStartedOnboarding(started);
    }
  }, []);

  const startTour = useCallback(() => {
    setShowTour(true);
    localStorage.setItem(ONBOARDING_STARTED_KEY, "true");
    setHasStartedOnboarding(true);
  }, []);

  const closeTour = useCallback(() => {
    setShowTour(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    setHasCompletedOnboarding(true);
    setShowTour(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    localStorage.removeItem(ONBOARDING_STARTED_KEY);
    setHasCompletedOnboarding(false);
    setHasStartedOnboarding(false);
    setShowTour(false);
  }, []);

  return {
    hasCompletedOnboarding,
    hasStartedOnboarding,
    showTour,
    startTour,
    closeTour,
    completeOnboarding,
    resetOnboarding,
  };
}

export default useOnboarding;
