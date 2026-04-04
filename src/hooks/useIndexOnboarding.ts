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
  isPremium,
  profileUserId,
}: UseIndexOnboardingParams) {
  // TODO: Welcome screen desactivada temporalmente – se reemplazará por animación explicativa.
  const [showWelcome, setShowWelcome] = useState(false);
  const [isPremiumWelcomeOpen, setIsPremiumWelcomeOpen] = useState(false);
  const [showContactTipModal, setShowContactTipModal] = useState(false);
  const [dontShowContactTipAgain, setDontShowContactTipAgain] = useState(false);

  useEffect(() => {
    if (isPremium && profileUserId) {
      const key = `hf_premium_welcome_shown_${profileUserId}`;
      if (localStorage.getItem(key) !== "true") {
        setIsPremiumWelcomeOpen(true);
        localStorage.setItem(key, "true");
      }
    }
  }, [isPremium, profileUserId]);

  const handleDismissWelcome = useCallback((dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    }
    setShowWelcome(false);
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
    isPremiumWelcomeOpen,
    showContactTipModal,
    dontShowContactTipAgain,
    setDontShowContactTipAgain,
    setIsPremiumWelcomeOpen,
    handleDismissWelcome,
    maybeShowContactTip,
    closeContactTipModal,
    handleContactTipOpenChange,
  };
}
