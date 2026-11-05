import { useCallback, useEffect, useState } from "react";

const INSTALL_COMPLETED_KEY = "unihelp.installCompleted";

const wasInstalled = () => {
  try {
    return window.localStorage.getItem(INSTALL_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
};

const rememberInstallation = () => {
  try {
    window.localStorage.setItem(INSTALL_COMPLETED_KEY, "true");
  } catch {
    // Standalone display detection still covers browsers without storage access.
  }
};

const detectPlatform = () => {
  const userAgent = navigator.userAgent || "";
  const isIOS =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    const isSafari =
      /Safari/i.test(userAgent) &&
      !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|Brave)/i.test(userAgent);
    return { platform: "ios", isSafari };
  }

  return { platform: /Android/i.test(userAgent) ? "android" : "other", isSafari: false };
};

export const isPwaStandalone = (targetWindow = window) =>
  targetWindow.matchMedia?.("(display-mode: standalone)")?.matches === true ||
  targetWindow.matchMedia?.("(display-mode: minimal-ui)")?.matches === true ||
  targetWindow.matchMedia?.("(display-mode: fullscreen)")?.matches === true ||
  targetWindow.navigator?.standalone === true;

export default function usePwaInstall() {
  const [platformInfo, setPlatformInfo] = useState({ platform: "other", isSafari: false });
  const [promptEvent, setPromptEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isPwaStandalone() || wasInstalled());
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState("");
  const [installOutcome, setInstallOutcome] = useState("");

  useEffect(() => {
    setPlatformInfo(detectPlatform());

    const updateStandalone = () => {
      if (isPwaStandalone()) setIsInstalled(true);
    };
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (!isPwaStandalone()) {
        setPromptEvent(event);
        setInstallOutcome("");
      }
    };
    const handleAppInstalled = () => {
      rememberInstallation();
      setIsInstalled(true);
      setPromptEvent(null);
      setInstallOutcome("accepted");
    };
    const handleStorage = (event) => {
      if (event.key === INSTALL_COMPLETED_KEY && event.newValue === "true") {
        setIsInstalled(true);
      }
    };

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    if (standaloneQuery.addEventListener) standaloneQuery.addEventListener("change", updateStandalone);
    else standaloneQuery.addListener?.(updateStandalone);
    window.addEventListener("pageshow", updateStandalone);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("storage", handleStorage);

    return () => {
      if (standaloneQuery.removeEventListener) standaloneQuery.removeEventListener("change", updateStandalone);
      else standaloneQuery.removeListener?.(updateStandalone);
      window.removeEventListener("pageshow", updateStandalone);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return { outcome: "unavailable" };

    setInstalling(true);
    setInstallError("");
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      setInstallOutcome(choice?.outcome || "dismissed");
      return choice;
    } catch {
      setInstallError("The browser could not open its install prompt. Try again from the browser menu.");
      setPromptEvent(null);
      return { outcome: "error" };
    } finally {
      setInstalling(false);
    }
  }, [promptEvent]);

  return {
    ...platformInfo,
    canInstall: Boolean(promptEvent),
    install,
    installError,
    installing,
    installOutcome,
    isInstalled,
  };
}