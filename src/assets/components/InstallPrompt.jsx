import { useEffect, useState } from "react";
import { Check, Download, MoreVertical, Plus, Share, Smartphone, X } from "lucide-react";
import usePwaInstall from "../hooks/usePwaInstall";

export default function InstallPrompt() {
  const { platform, isSafari, canInstall, install, installError, installOutcome, installing, isInstalled } = usePwaInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!showInstructions) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowInstructions(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showInstructions]);

  const showButton = !isInstalled && (canInstall || platform === "ios" || platform === "android" || Boolean(installError));
  if (!showButton) return null;

  const ios = platform === "ios";
  const openInstallOptions = () => {
    if (canInstall && !ios) {
      install();
      return;
    }
    setShowInstructions(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openInstallOptions}
        disabled={installing}
        className="fixed bottom-24 left-4 z-[70] inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 sm:bottom-5 sm:left-5"
        aria-haspopup={ios || !canInstall ? "dialog" : undefined}
      >
        <Download size={17} aria-hidden="true" />
        {installing ? "Opening install…" : "Install UniHelp"}
      </button>
      {(installError || installOutcome === "dismissed") && (
        <p role={installError ? "alert" : "status"} className="fixed bottom-36 left-4 z-[70] max-w-[calc(100vw-2rem)] rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg sm:bottom-16 sm:left-5">
          {installError || "Installation was cancelled. Tap Install UniHelp for browser-menu instructions."}
        </p>
      )}

      {showInstructions && (
        <div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowInstructions(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            className="w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl transition duration-200 animate-in fade-in slide-in-from-bottom-3 sm:max-h-[min(90vh,42rem)] sm:rounded-2xl"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start gap-3 bg-slate-900 px-5 py-5 text-white sm:px-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                <Smartphone size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="pwa-install-title" className="text-lg font-bold">Install UniHelp</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {ios
                    ? isSafari
                      ? "Add UniHelp to your Home Screen from Safari."
                      : "On iPhone and iPad, installation is available through Safari. Open this page there to continue."
                    : platform === "android"
                      ? "Use your browser menu to add UniHelp to your device."
                      : "Use Chrome or Edge and their browser menu to install this app."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                aria-label="Close installation instructions"
              >
                <X size={19} />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              {ios && !isSafari ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  iOS does not let websites open the installation dialog. Copy this page’s address, open Safari, and follow the steps there.
                </div>
              ) : ios ? (
                <ol className="space-y-3">
                  {[
                    { icon: Smartphone, text: "Open UniHelp in Safari." },
                    { icon: Share, text: "Tap the Share icon in Safari." },
                    { icon: Plus, text: "Select Add to Home Screen." },
                    { icon: Check, text: "Tap Add to finish." },
                  ].map(({ icon: Icon, text }, index) => (
                    <li key={text} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><Icon size={18} /></span>
                      <span className="flex-1 text-sm font-medium leading-5 text-slate-800">{text}</span>
                      <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="space-y-3">
                  {[
                    { icon: MoreVertical, text: "Open your browser’s menu." },
                    { icon: Download, text: "Choose Install app or Add to Home screen." },
                    { icon: Check, text: "Confirm the installation." },
                  ].map(({ icon: Icon, text }, index) => (
                    <li key={text} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><Icon size={18} /></span>
                      <span className="flex-1 text-sm font-medium leading-5 text-slate-800">{text}</span>
                      <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                    </li>
                  ))}
                </ol>
              )}
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
