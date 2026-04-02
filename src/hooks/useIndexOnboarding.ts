import { useCallback, useEffect, useState } from "react";

const WELCOME_DISMISSED_KEY = "hf_user_welcome_dismissed";
const MARKET_TIP_DISABLED_KEY = "hf_market_save_tip_disabled";
const OWN_LINK_TIP_SHOWN_KEY = "hf_own_link_first_tip_shown";

interface UseIndexOnboardingParams {
  locationSearch: string;
  isPremium: boolean;
  profileUserId?: string | null;
}

/**
 * Centraliza los flags de bienvenida y tips del dashboard principal.
 * Mantiene la persistencia actual en localStorage para no cambiar comportamiento.
 */
export function useIndexOnboarding({
  locationSearch,
  isPremium,
  profileUserId,
}: UseIndexOnboardingParams) {
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem(WELCOME_DISMISSED_KEY) !== "true";
  });
  const [isPremiumWelcomeOpen, setIsPremiumWelcomeOpen] = useState(false);

  useEffect(() => {
    if (showRegWelcome) return;
    if (isPremium && profileUserId) {
      const key = `hf_premium_welcome_shown_${profileUserId}`;
      if (localStorage.getItem(key) !== "true") {
        setIsPremiumWelcomeOpen(true);
        localStorage.setItem(key, "true");
      }
    }
  }, [isPremium, profileUserId, showRegWelcome]);

  const handleDismissWelcome = useCallback((dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    }
    setShowWelcome(false);
  }, []);

  const closeRegistrationWelcome = useCallback(() => {
    setShowRegWelcome(false);
  }, []);

  const maybeShowContactTip = useCallback((sourceUrl?: string | null) => {
    const hasSourceUrl = typeof sourceUrl === "string" && sourceUrl.trim().length > 0;
    const isTipDisabled = localStorage.getItem(MARKET_TIP_DISABLED_KEY) === "true";
    const wasShownBefore = localStorage.getItem(OWN_LINK_TIP_SHOWN_KEY) === "true";

    if (hasSourceUrl && !isTipDisabled && !wasShownBefore) {
      localStorage.setItem(OWN_LINK_TIP_SHOWN_KEY, "true");
      setDontShowContactTipAgain(false);
      setShowContactTipModal(true);
    }
  }, []);

  const closeContactTipModal = useCallback(() => {
    if (dontShowContactTipAgain) {
      localStorage.setItem(MARKET_TIP_DISABLED_KEY, "true");
    }
    setShowContactTipModal(false);
    setDontShowContactTipAgain(false);
  }, [dontShowContactTipAgain]);

  const handleContactTipOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeContactTipModal();
      return;
    }
    setShowContactTipModal(true);
  }, [closeContactTipModal]);

  return {
    showWelcome,
    showRegWelcome,
    isPremiumWelcomeOpen,
    showContactTipModal,
    dontShowContactTipAgain,
    setDontShowContactTipAgain,
    setIsPremiumWelcomeOpen,
    handleDismissWelcome,
    closeRegistrationWelcome,
    maybeShowContactTip,
    closeContactTipModal,
    handleContactTipOpenChange,
  };
}
