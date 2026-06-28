import { useEffect, useState } from "react";

import { CheckCircle2, Download, Sparkles, X } from "lucide-react";

const INSTALL_PROMPT_SEEN_KEY = "unihelp.installPromptSeen";

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
};

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [browserReady, setBrowserReady] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      localStorage.removeItem(INSTALL_PROMPT_SEEN_KEY);
      return;
    }

    if (localStorage.getItem(INSTALL_PROMPT_SEEN_KEY) === "true") {
      setShow(true);
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
      setBrowserReady(true);
      setShow(true);
      localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, "true");
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShow(false);
      setPromptEvent(null);
      setBrowserReady(false);
      localStorage.removeItem(INSTALL_PROMPT_SEEN_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      localStorage.removeItem(INSTALL_PROMPT_SEEN_KEY);
    }

    setPromptEvent(null);
    setShow(false);
  };

  if (!show || installed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 p-5 text-white sm:p-7">
          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 hover:bg-white/30"
            aria-label="Dismiss install prompt"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
              <Download size={28} />
            </div>

            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                Recommended
              </span>

              <h2 className="mt-3 text-2xl font-black sm:text-3xl">Install UniHelp</h2>

              <p className="mt-2 text-sm text-indigo-100">
                Install the app for faster access, offline support, and a more
                native experience.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <p className="text-sm text-slate-600">
            UniHelp works best as an installed app. You will keep seeing this
            prompt on reload until the app is installed.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500" />
              <span>Launch directly from your home screen</span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500" />
              <span>Faster startup and smoother navigation</span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500" />
              <span>Offline support where available</span>
            </div>

            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-indigo-500" />
              <span>Feels like a real mobile app</span>
            </div>
          </div>

          <button
            onClick={install}
            disabled={!browserReady || !promptEvent}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!browserReady || !promptEvent ? "Preparing install..." : "Install Now"}
          </button>

          <button
            onClick={() => setShow(false)}
            className="w-full rounded-2xl border py-3 font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
