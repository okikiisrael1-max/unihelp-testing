import { useEffect, useState } from "react";
import { CheckCircle2, Download, Sparkles, X, Zap } from "lucide-react";

const INSTALL_PROMPT_SEEN_KEY = "unihelp.installPromptSeen";

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
};

const FEATURES = [
  { icon: CheckCircle2, text: "Launch straight from your home screen", tone: "text-emerald-500" },
  { icon: Zap, text: "Faster startup, smoother navigation", tone: "text-emerald-500" },
  { icon: CheckCircle2, text: "Offline support where available", tone: "text-emerald-500" },
  { icon: Sparkles, text: "Feels like a real mobile app", tone: "text-indigo-500" },
];

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false); // drives enter/exit animation
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      localStorage.removeItem(INSTALL_PROMPT_SEEN_KEY);
      return;
    }

    // Only ever show the prompt when we actually have a live promptEvent to act on.
    // Previously this also fired from a stale localStorage flag, which could show
    // a permanently-disabled dialog if the browser never refired the event.
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
      setShow(true);
      localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, "true");
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShow(false);
      setPromptEvent(null);
      localStorage.removeItem(INSTALL_PROMPT_SEEN_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Trigger the entrance animation a frame after `show` flips true
  useEffect(() => {
    if (show) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
  }, [show]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setShow(false), 200); // let the exit transition play
  };

  const install = async () => {
    if (!promptEvent) return;

    setInstalling(true);
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      localStorage.removeItem(INSTALL_PROMPT_SEEN_KEY);
    }

    setInstalling(false);
    setPromptEvent(null);
    dismiss();
  };

  if (!show || installed) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-4 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden bg-white shadow-[0_25px_80px_-15px_rgba(67,56,202,0.35)] transition-all duration-300 ease-out
        rounded-t-[28px] sm:rounded-[28px]
        ${visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-8 opacity-0 sm:translate-y-0 sm:scale-95"}`}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-[#4338ca] px-6 pb-8 pt-6 text-white sm:px-8 sm:pt-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl" />

          <button
            onClick={dismiss}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 transition-colors hover:bg-white/25"
            aria-label="Dismiss install prompt"
          >
            <X size={16} />
          </button>

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Download size={26} />
            </div>
            <div className="min-w-0 pt-0.5">
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                Recommended
              </span>
              <h2 className="mt-3 text-2xl font-black leading-tight sm:text-[1.75rem]">
                Install UniHelp
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-indigo-100">
                Get faster access and a more native experience.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text, tone }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 ${tone}`}>
                  <Icon size={16} />
                </div>
                <span className="text-[15px] text-slate-700">{text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              onClick={install}
              disabled={installing}
              className={`w-full rounded-2xl py-4 text-[15px] font-bold text-white shadow-lg transition-all ${
                installing
                  ? "cursor-not-allowed bg-indigo-400 shadow-none"
                  : "bg-[#4338ca] hover:bg-[#3730a3] hover:shadow-[#4338ca]/30 active:scale-[0.98]"
              }`}
            >
              {installing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Installing…
                </span>
              ) : (
                "Install Now"
              )}
            </button>

            <button
              onClick={dismiss}
              className="w-full rounded-2xl border-2 border-gray-200 py-3.5 text-[15px] font-bold text-slate-600 transition-colors hover:bg-gray-50"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}