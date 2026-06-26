import { useEffect, useState } from "react";
import {
  Download,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;

    if (isInstalled) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
      setShow(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShow(false);
      setPromptEvent(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();

    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      setShow(false);
    }

    setPromptEvent(null);
  };

  if (!show || !promptEvent) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]">

        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 p-7 text-white">

          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 hover:bg-white/30"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
              <Download size={28} />
            </div>

            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                ✨ Recommended
              </span>

              <h2 className="mt-3 text-3xl font-black">
                Install UniHelp
              </h2>

              <p className="mt-2 text-sm text-indigo-100">
                Access UniHelp like a real app.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}

        <div className="space-y-5 p-7">

          <p className="text-sm text-slate-600">
            Install UniHelp for a faster and smoother experience.
          </p>

          <div className="space-y-3">

            <div className="flex items-center gap-3">
              <CheckCircle2
                size={18}
                className="text-green-500"
              />
              <span>Launch directly from your home screen</span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2
                size={18}
                className="text-green-500"
              />
              <span>Faster loading speed</span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2
                size={18}
                className="text-green-500"
              />
              <span>Offline support</span>
            </div>

            <div className="flex items-center gap-3">
              <Sparkles
                size={18}
                className="text-indigo-500"
              />
              <span>Native app experience</span>
            </div>

          </div>

          <button
            onClick={install}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 font-semibold text-white transition hover:scale-[1.02]"
          >
            Install Now
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