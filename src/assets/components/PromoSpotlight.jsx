import React, { useCallback, useEffect, useRef, useState } from "react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { ExternalLink, Sparkles, X } from "lucide-react";

import { db } from "../../firebase/config";

const LAST_PROMO_KEY = "unihelp:lastPromoSpotlightId";
const REOPEN_AFTER_MS = 60 * 1000;

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
};

const isActive = (promo) => {
  if (!promo?.enabled) return false;
  const now = Date.now();
  const start = toMillis(promo.startAt);
  const end = toMillis(promo.endAt);
  return (!start || start <= now) && (!end || end >= now);
};

const labelFor = (type) => ({ external_ad: "Sponsored", unihelp_promotion: "UniHelp", announcement: "Announcement" }[type] || "Announcement");

const track = async (eventType, promo, userId) => {
  if (!promo?.id) return;
  try {
    await addDoc(collection(db, "promoSpotlightEvents"), {
      promoId: promo.id,
      promoType: promo.type || "announcement",
      eventType,
      userId: userId || null,
      timestamp: Date.now(),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Analytics must never block the campaign experience.
  }
};

export default function PromoSpotlight({ user, onNavigate }) {
  const [promo, setPromo] = useState(null);
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);
  const dismissedRef = useRef(false);
  const backgroundedAtRef = useRef(0);

  const loadPromo = useCallback(async () => {
    if (!user?.uid || shownRef.current) return;
    try {
      const snapshot = await getDocs(query(collection(db, "promoSpotlights"), where("enabled", "==", true)));
      const active = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .filter(isActive)
        .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0));
      if (!active.length) return;
      const previous = localStorage.getItem(LAST_PROMO_KEY);
      const pool = active.length > 1 && previous ? active.filter((item) => item.id !== previous) : active;
      const next = (pool.length ? pool : active)[Math.floor(Math.random() * (pool.length ? pool.length : active.length))];
      if (!next) return;
      shownRef.current = true;
      dismissedRef.current = false;
      localStorage.setItem(LAST_PROMO_KEY, next.id);
      setPromo(next);
      setVisible(true);
      track("promo_impression", next, user.uid);
    } catch (error) {
      console.log("PromoSpotlight unavailable:", error?.message);
    }
  }, [user?.uid]);

  useEffect(() => {
    shownRef.current = false;
    setPromo(null);
    setVisible(false);
    if (!user?.uid) return undefined;
    const timer = window.setTimeout(loadPromo, 700);
    return () => window.clearTimeout(timer);
  }, [loadPromo, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        backgroundedAtRef.current = Date.now();
        return;
      }
      if (Date.now() - backgroundedAtRef.current >= REOPEN_AFTER_MS) {
        shownRef.current = false;
        loadPromo();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadPromo, user?.uid]);

  const dismiss = useCallback((eventType = "promo_dismiss") => {
    if (!promo || dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    track(eventType, promo, user?.uid);
  }, [promo, user?.uid]);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(() => dismiss(), 5000);
    return () => window.clearTimeout(timer);
  }, [dismiss, visible]);

  if (!promo || !visible) return null;

  const hasAction = promo.actionType && promo.actionType !== "none" && promo.actionUrl;
  const handleAction = () => {
    if (!hasAction) return dismiss();
    dismiss("promo_click");
    if (promo.actionType === "external_url" || promo.actionType === "deep_link") {
      window.open(promo.actionUrl, "_blank", "noopener,noreferrer");
    } else {
      onNavigate?.(promo.actionUrl);
    }
  };
  const gradient = `linear-gradient(${promo.gradientDirection === "horizontal" ? "90deg" : "160deg"}, ${promo.gradientStart || "#1e1b4b"}, ${promo.gradientEnd || "#0f172a"})`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={promo.title || "Promo spotlight"}>
      <section className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl" style={{ background: gradient, color: promo.textColor || "#fff" }}>
        <div className="h-1 bg-white/20"><div className="h-full origin-left animate-[promo-countdown_5s_linear_forwards] bg-white" /></div>
        <button type="button" onClick={() => dismiss()} className="absolute right-3 top-4 z-10 rounded-full bg-black/25 p-2 text-white transition hover:bg-black/45" aria-label="Dismiss promotion"><X size={18} /></button>
        {promo.imageUrl ? <img src={promo.imageUrl} alt="" className="h-56 w-full object-cover" /> : <div className="flex h-36 items-end bg-white/5 p-6"><Sparkles size={42} className="text-white/80" /></div>}
        <div className="p-6">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider"><Sparkles size={13} /> {labelFor(promo.type)}</div>
          {promo.advertiserName && <p className="mb-1 text-xs font-semibold opacity-75">{promo.advertiserName}</p>}
          <h2 className="text-2xl font-black leading-tight">{promo.title || "What's new on UniHelp"}</h2>
          {promo.description && <p className="mt-3 text-sm leading-6 opacity-90">{promo.description}</p>}
          <button type="button" onClick={handleAction} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:scale-[1.02] active:scale-[.98]">
            {promo.buttonText || (hasAction ? "Open" : "Got it")}{hasAction && <ExternalLink size={16} />}
          </button>
        </div>
      </section>
    </div>
  );
}
