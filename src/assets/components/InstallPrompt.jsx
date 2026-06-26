import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
      setTimeout(() => setShow(true), 800);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const installApp = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      console.log("App installed");
    }

    setPromptEvent(null);
    setShow(false);
  };

  const closeModal = () => {
    setShow(false);
  };

  if (!show || !promptEvent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Install UniHelp</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Install the app</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enjoy a faster, app-like experience with offline-ready access and cleaner navigation.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-500 text-white shadow-lg">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={installApp}
            className="rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition"
          >
            Install App
          </button>
          <button
            onClick={closeModal}
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Not now
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          This prompt can appear again on the next reload if the app is not installed yet.
        </p>
      </div>
    </div>
  );
}
