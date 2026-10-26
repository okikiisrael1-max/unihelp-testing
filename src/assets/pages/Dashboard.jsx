import React, {
  memo,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  Bot,
  Calculator,
  ChevronRight,
  Clock,
  MessageCircle,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { allFeatures, featureSections } from "../data/features";

/* =====================================================================
   READ-REDUCTION NOTES
   1. CGPA records are cached in memory + sessionStorage, keyed by user.
      Re-opening the dashboard shows them instantly and costs 0 reads for
      CGPA_TTL; after that it refreshes quietly in the background (1 query).
   2. Only the fields the dashboard shows are cached (not whole semester
      arrays), so the cache stays tiny.
   3. Deleting is optimistic with Undo. Nothing is re-fetched afterwards.
   4. To refresh instantly after the CGPA page saves a record, dispatch
        window.dispatchEvent(new Event("cgpa-records-changed"))
      there (or call invalidateCgpaCache()). Without it the dashboard
      catches up after CGPA_TTL.
   5. Tool search / category filters run on the client (0 reads), and
      "recent tools" live in localStorage (0 reads).
   ===================================================================== */

const CGPA_TTL = 2 * 60 * 1000;
const UNDO_MS = 5000;
const TOOLS_PREVIEW_COUNT = 6;
const RECORDS_PREVIEW_COUNT = 4;
const RECENT_KEY = "dash:recent-tools";
const RECENT_MAX = 4;
const CGPA_EVENT = "cgpa-records-changed";

const QUICK_ACTIONS = [
  { label: "CGPA Tracker", hint: "Log a semester", to: "/CGPA", icon: Calculator, tint: "indigo" },
  { label: "AI Tutor", hint: "Ask anything", to: "/ai", icon: Bot, tint: "violet" },
  { label: "Watch", hint: "Video tutorials", to: "/watch", icon: PlayCircle, tint: "red" },
  { label: "Messages", hint: "Chat with students", to: "/messages", icon: MessageCircle, tint: "sky" },
  { label: "Groups", hint: "Join communities", to: "/community", icon: Users, tint: "emerald" },
];

// Written out in full so Tailwind can see every class at build time.
const TINTS = {
  indigo: { dark: "bg-indigo-500/15 text-indigo-300", light: "bg-indigo-50 text-indigo-600" },
  violet: { dark: "bg-violet-500/15 text-violet-300", light: "bg-violet-50 text-violet-600" },
  red: { dark: "bg-red-500/15 text-red-300", light: "bg-red-50 text-red-600" },
  sky: { dark: "bg-sky-500/15 text-sky-300", light: "bg-sky-50 text-sky-600" },
  emerald: { dark: "bg-emerald-500/15 text-emerald-300", light: "bg-emerald-50 text-emerald-600" },
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

/* ---------- CGPA cache ---------- */
let cgpaCache = null; // { uid, records, ts }
const cacheKey = (uid) => `dash:cgpa:${uid}`;

function readCgpaCache(uid) {
  if (cgpaCache?.uid === uid) return cgpaCache;
  try {
    const raw = sessionStorage.getItem(cacheKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.records)) {
        cgpaCache = { uid, records: parsed.records, ts: parsed.ts || 0 };
        return cgpaCache;
      }
    }
  } catch {
    /* storage unavailable: fall through */
  }
  return null;
}

function writeCgpaCache(uid, records, ts = Date.now()) {
  cgpaCache = { uid, records, ts };
  try {
    sessionStorage.setItem(cacheKey(uid), JSON.stringify({ records, ts }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function invalidateCgpaCache() {
  window.dispatchEvent(new Event(CGPA_EVENT));
}

/* ---------- recent tools ---------- */
function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ---------- helpers ---------- */
const formatDate = (createdAt) => {
  if (!createdAt?.seconds) return "";
  return new Date(createdAt.seconds * 1000).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const normalizeRecord = (d) => {
  const data = d.data();
  return {
    id: d.id,
    cgpa: Number(data.cgpa) || 0,
    semesterCount: Array.isArray(data.semesters) ? data.semesters.length : 0,
    createdAt: data.createdAt?.seconds ? { seconds: data.createdAt.seconds } : null,
  };
};

const initialsOf = (name) =>
  (name || "S").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "S";

/* =====================================================================
   INLINE ILLUSTRATIONS (no image files to load or break)
   ===================================================================== */
const ChallengeArt = ({ className }) => (
  <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={className}>
    <circle cx="80" cy="62" r="50" fill="white" fillOpacity="0.12" />
    <path d="M56 34h48v20a24 24 0 0 1-48 0V34Z" fill="white" />
    <path
      d="M56 40H44a4 4 0 0 0-4 4c0 10 7 18 17 19M104 40h12a4 4 0 0 1 4 4c0 10-7 18-17 19"
      stroke="white"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <rect x="74" y="78" width="12" height="14" rx="2" fill="white" fillOpacity="0.85" />
    <rect x="62" y="92" width="36" height="8" rx="4" fill="white" />
    <polygon points="80,40 84,49 94,50 86.5,56.5 89,66 80,61 71,66 73.5,56.5 66,50 76,49" fill="#fbbf24" />
    <circle cx="32" cy="30" r="3" fill="white" fillOpacity="0.7" />
    <circle cx="132" cy="24" r="4" fill="#fbbf24" fillOpacity="0.9" />
    <circle cx="140" cy="86" r="2.5" fill="white" fillOpacity="0.7" />
    <path d="M22 80v10M17 85h10" stroke="white" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const GroupsArt = ({ className }) => (
  <svg viewBox="0 0 200 120" fill="none" aria-hidden="true" className={className}>
    <rect x="8" y="16" width="184" height="96" rx="20" className="fill-indigo-500/10" />
    <g>
      <circle cx="62" cy="58" r="14" className="fill-sky-400" />
      <path d="M38 104a24 24 0 0 1 48 0Z" className="fill-sky-400" />
      <circle cx="138" cy="58" r="14" className="fill-emerald-400" />
      <path d="M114 104a24 24 0 0 1 48 0Z" className="fill-emerald-400" />
      <circle cx="100" cy="50" r="16" className="fill-indigo-500" />
      <path d="M72 106a28 28 0 0 1 56 0Z" className="fill-indigo-500" />
    </g>
    <rect x="124" y="6" width="56" height="28" rx="12" className="fill-violet-500" />
    <path d="M136 34l-4 9 12-9Z" className="fill-violet-500" />
    <circle cx="142" cy="20" r="3" fill="white" />
    <circle cx="152" cy="20" r="3" fill="white" />
    <circle cx="162" cy="20" r="3" fill="white" />
  </svg>
);

const EmptyChartArt = ({ className }) => (
  <svg viewBox="0 0 120 80" fill="none" aria-hidden="true" className={className}>
    <rect x="12" y="46" width="16" height="26" rx="4" className="fill-indigo-500/25" />
    <rect x="38" y="34" width="16" height="38" rx="4" className="fill-indigo-500/35" />
    <rect x="64" y="22" width="16" height="50" rx="4" className="fill-indigo-500/50" />
    <rect x="90" y="8" width="16" height="64" rx="4" className="fill-indigo-500" />
    <path d="M20 38l26-14 26-6 26-10" className="stroke-indigo-500" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 6" />
  </svg>
);

/* ---------- CGPA sparkline (inline SVG, no chart lib) ---------- */
const Sparkline = ({ data }) => {
  const W = 360;
  const H = 110;
  const P = 10;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min;
  const pts = data.map((d, i) => ({
    ...d,
    x: P + (i * (W - 2 * P)) / Math.max(1, data.length - 1),
    y: span === 0 ? H / 2 : H - P - ((d.value - min) / span) * (H - 2 * P),
  }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${P},${H - P / 2} ${line} ${W - P},${H - P / 2}`;
  const last = pts.length - 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`CGPA across your last ${data.length} records, from ${vals[0].toFixed(2)} to ${vals[last].toFixed(2)}`}
      className="h-28 w-full"
    >
      <polygon points={area} className="fill-indigo-500/10" />
      <polyline
        points={line}
        fill="none"
        className="stroke-indigo-500"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={i === last ? 5 : 3.5}
          className={i === last ? "fill-indigo-500" : "fill-indigo-300"}
        >
          <title>{`${p.value.toFixed(2)}${p.date ? ` · ${p.date}` : ""}`}</title>
        </circle>
      ))}
    </svg>
  );
};

const Delta = ({ value, className = "" }) => {
  if (value === null || Math.abs(value) < 0.005) return null;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold ${
        up ? "text-emerald-500" : "text-red-500"
      } ${className}`}
    >
      <Icon size={13} />
      {up ? "+" : ""}
      {value.toFixed(2)}
    </span>
  );
};

/* ---------- tool row ---------- */
const ToolRow = memo(function ToolRow({ item, theme, showCategory, onOpen }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.link}
      onClick={() => onOpen(item.link)}
      className={`${theme.card} group flex items-start gap-3.5 rounded-2xl p-4 transition hover:border-indigo-400/50 hover:shadow-md motion-safe:hover:-translate-y-0.5 ${FOCUS}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.iconTint}`}>
        {Icon && <Icon size={19} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold leading-tight">{item.title}</h3>
        {showCategory && <p className="mt-0.5 text-[11px] font-semibold text-indigo-500">{item.category}</p>}
        <p className={`mt-1 line-clamp-2 text-xs leading-5 ${theme.textSoft}`}>{item.desc}</p>
      </div>
      <ChevronRight
        size={16}
        className="mt-1 shrink-0 opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-70"
      />
    </Link>
  );
});

/* =====================================================================
   DASHBOARD
   ===================================================================== */
const Dashboard = ({ dark }) => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const uid = user?.uid;

  const initialCache = uid ? readCgpaCache(uid) : null;
  const [records, setRecords] = useState(initialCache?.records || []);
  const [loading, setLoading] = useState(Boolean(uid) && !initialCache);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAllTools, setShowAllTools] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [recent, setRecent] = useState(readRecent);

  const searchRef = useRef(null);
  const toolsRef = useRef(null);
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const pendingDeletes = useRef(new Map());
  const fetchSeq = useRef(0);

  /* ---------- records: state + cache in one place ---------- */
  const commit = useCallback(
    (next) => {
      recordsRef.current = next;
      setRecords(next);
      if (uid) writeCgpaCache(uid, next, cgpaCache?.uid === uid ? cgpaCache.ts : Date.now());
    },
    [uid]
  );

  const fetchRecords = useCallback(
    async ({ silent = false } = {}) => {
      if (!uid) return;
      const seq = ++fetchSeq.current;
      if (!silent) setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "cgpaTracker"), where("userId", "==", uid)));
        if (seq !== fetchSeq.current) return;
        // Don't resurrect records that are still waiting out their undo window.
        const data = snap.docs.map(normalizeRecord).filter((r) => !pendingDeletes.current.has(r.id));
        writeCgpaCache(uid, data);
        recordsRef.current = data;
        setRecords(data);
        setLoadError("");
      } catch (err) {
        console.error(err);
        if (seq === fetchSeq.current && !recordsRef.current.length) {
          setLoadError("We couldn't load your CGPA records.");
        }
      } finally {
        if (seq === fetchSeq.current) setLoading(false);
      }
    },
    [uid]
  );

  useEffect(() => {
    if (!uid) {
      setRecords([]);
      setLoading(false);
      return undefined;
    }
    const cached = readCgpaCache(uid);
    if (cached) {
      setRecords(cached.records);
      setLoading(false);
      if (Date.now() - cached.ts > CGPA_TTL) fetchRecords({ silent: true });
    } else {
      fetchRecords();
    }
    const onChanged = () => fetchRecords({ silent: true });
    window.addEventListener(CGPA_EVENT, onChanged);
    return () => window.removeEventListener(CGPA_EVENT, onChanged);
  }, [uid, fetchRecords]);

  /* ---------- delete with undo ---------- */
  const deleteRecord = useCallback(
    (record) => {
      const index = recordsRef.current.findIndex((r) => r.id === record.id);
      if (index === -1) return;
      commit(recordsRef.current.filter((r) => r.id !== record.id));

      const restore = () => {
        if (recordsRef.current.some((r) => r.id === record.id)) return;
        const next = [...recordsRef.current];
        next.splice(Math.min(index, next.length), 0, record);
        commit(next);
      };

      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(record.id);
        try {
          await deleteDoc(doc(db, "cgpaTracker", record.id));
        } catch (err) {
          console.error(err);
          restore();
          toast.error("Couldn't delete that record. It has been restored.");
        }
      }, UNDO_MS);
      pendingDeletes.current.set(record.id, { timer });

      toast(
        ({ closeToast }) => (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>Record deleted</span>
            <button
              type="button"
              className="font-bold underline"
              onClick={() => {
                clearTimeout(timer);
                pendingDeletes.current.delete(record.id);
                restore();
                closeToast();
              }}
            >
              Undo
            </button>
          </div>
        ),
        { toastId: `del-${record.id}`, autoClose: UNDO_MS }
      );
    },
    [commit]
  );

  // Leaving the page: send any deletes that were still counting down.
  useEffect(
    () => () => {
      pendingDeletes.current.forEach(({ timer }, id) => {
        clearTimeout(timer);
        toast.dismiss(`del-${id}`);
        deleteDoc(doc(db, "cgpaTracker", id)).catch(() => {});
      });
      pendingDeletes.current.clear();
    },
    []
  );

  /* ---------- "/" focuses tool search ---------- */
  const focusSearch = useCallback(() => {
    toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 250);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      e.preventDefault();
      focusSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSearch]);

  /* ---------- recent tools ---------- */
  const trackTool = useCallback((link) => {
    setRecent((cur) => {
      const next = [link, ...cur.filter((l) => l !== link)].slice(0, RECENT_MAX);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /* ---------- derived CGPA numbers ---------- */
  const sorted = useMemo(
    () => [...records].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [records]
  );

  const summary = useMemo(() => {
    const values = sorted.map((r) => r.cgpa);
    const n = values.length;
    return {
      count: n,
      latest: n ? values[0] : 0,
      best: n ? Math.max(...values) : 0,
      avg: n ? values.reduce((a, b) => a + b, 0) / n : 0,
      change: n > 1 ? values[0] - values[1] : null,
    };
  }, [sorted]);

  const sparkData = useMemo(
    () =>
      sorted
        .slice(0, 8)
        .reverse()
        .map((r) => ({ id: r.id, value: r.cgpa, date: formatDate(r.createdAt) })),
    [sorted]
  );

  const visibleRecords = showAllRecords ? sorted : sorted.slice(0, RECORDS_PREVIEW_COUNT);

  /* ---------- tools ---------- */
  const categoryNames = useMemo(() => ["All", ...featureSections.map((s) => s.title)], []);
  const categoryCounts = useMemo(() => {
    const counts = { All: allFeatures.length };
    allFeatures.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, []);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || activeCategory !== "All";

  const matchedItems = useMemo(
    () =>
      allFeatures.filter((item) => {
        if (activeCategory !== "All" && item.category !== activeCategory) return false;
        if (!normalizedQuery) return true;
        return `${item.title} ${item.desc} ${item.category}`.toLowerCase().includes(normalizedQuery);
      }),
    [activeCategory, normalizedQuery]
  );

  const shownItems = showAllTools || isFiltering ? matchedItems : matchedItems.slice(0, TOOLS_PREVIEW_COUNT);
  const canToggleTools = !isFiltering && matchedItems.length > TOOLS_PREVIEW_COUNT;

  const recentItems = useMemo(
    () => recent.map((link) => allFeatures.find((f) => f.link === link)).filter(Boolean),
    [recent]
  );

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
  };

  /* ---------- theme ---------- */
  const theme = useMemo(
    () => ({
      bg: dark ? "bg-[#070b14] text-white" : "bg-[#f6f7fb] text-gray-900",
      card: dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200/80 shadow-sm",
      soft: dark ? "bg-white/5" : "bg-gray-50",
      input: dark
        ? "bg-white/5 border border-white/10 focus-within:border-indigo-400/60"
        : "bg-white border border-gray-200 focus-within:border-indigo-400",
      iconTint: dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600",
      textSoft: dark ? "text-gray-400" : "text-gray-500",
      textFaint: dark ? "text-gray-500" : "text-gray-400",
      divider: dark ? "divide-white/10" : "divide-gray-200",
      kbd: dark ? "border-white/15 bg-white/5 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-500",
      ghost: dark ? "hover:bg-white/10" : "hover:bg-gray-100",
      tint: (name) => TINTS[name][dark ? "dark" : "light"],
    }),
    [dark]
  );

  /* ---------- greeting copy ---------- */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });
  const firstName = (user?.displayName || "").split(" ")[0] || "there";

  const subline = (() => {
    if (!uid) return "Sign in to track your CGPA and pick up where you left off.";
    if (loading || authLoading) return "Getting your dashboard ready…";
    if (summary.count === 0) return "Add your first semester and start tracking your progress.";
    if (summary.change !== null && summary.change > 0.004)
      return `Your CGPA is up ${summary.change.toFixed(2)} since your last record. Nice work.`;
    if (summary.change !== null && summary.change < -0.004)
      return `Your CGPA is down ${Math.abs(summary.change).toFixed(2)} since your last record. Your history below can help you see what changed.`;
    return "Here's where you stand today.";
  })();

  const busy = authLoading || loading;
  const signedOut = !authLoading && !uid;

  /* ================================================================= */
  return (
    <div className={`min-h-screen px-4 md:mt-20 md:px-8 lg:px-10 ${theme.bg} motion-safe:transition-colors motion-safe:duration-300`}>
      <div className="mx-auto max-w-[1280px] px-0 py-6 sm:px-4 md:px-6 md:py-10 lg:px-8">
        {/* ---------- header ---------- */}
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-black ${theme.iconTint}`}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                initialsOf(user?.displayName)
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium ${theme.textSoft}`}>{today}</p>
              <h1 className="truncate text-2xl font-black tracking-tight md:text-3xl">
                {greeting}, {firstName}
              </h1>
              <p className={`mt-1 max-w-xl text-sm ${theme.textSoft}`}>{subline}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={focusSearch}
            className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition hover:border-indigo-400/60 md:w-72 ${theme.card} ${FOCUS}`}
          >
            <Search size={16} className={theme.textFaint} />
            <span className={`flex-1 ${theme.textSoft}`}>Find a tool…</span>
            <kbd className={`hidden h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold md:inline-flex ${theme.kbd}`}>
              /
            </kbd>
          </button>
        </header>

        {/* ---------- quick actions ---------- */}
        <nav
          aria-label="Quick actions"
          className="-mx-4 mb-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible"
        >
          {QUICK_ACTIONS.map(({ label, hint, to, icon: Icon, tint }) => (
            <Link
              key={label}
              to={to}
              className={`group flex min-w-[10.5rem] shrink-0 snap-start items-center gap-3 rounded-2xl p-3.5 transition hover:border-indigo-400/60 hover:shadow-md motion-safe:hover:-translate-y-0.5 lg:min-w-0 ${theme.card} ${FOCUS}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.tint(tint)}`}>
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold leading-tight">{label}</span>
                <span className={`mt-0.5 block truncate text-xs ${theme.textSoft}`}>{hint}</span>
              </span>
            </Link>
          ))}
        </nav>

        {recentItems.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:mb-8">
            <span className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold ${theme.textSoft}`}>
              <Clock size={13} /> Jump back in
            </span>
            {recentItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.link}
                  to={item.link}
                  onClick={() => trackTool(item.link)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:border-indigo-400/60 hover:text-indigo-500 ${theme.card} ${FOCUS}`}
                >
                  {Icon && <Icon size={13} />}
                  {item.title}
                </Link>
              );
            })}
          </div>
        )}
        {recentItems.length === 0 && <div className="mb-3 md:mb-5" />}

        {/* ---------- main grid ---------- */}
        <div className="mb-10 grid items-start gap-5 md:mb-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* CGPA overview */}
          <section aria-labelledby="cgpa-title" className={`${theme.card} rounded-3xl p-5 md:p-6 lg:col-start-1 lg:row-start-1`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="cgpa-title" className="text-lg font-black">
                Your CGPA
              </h2>
              {uid && !busy && summary.count > 0 && (
                <Link
                  to="/CGPA"
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 text-xs font-bold text-white transition hover:bg-indigo-600 ${FOCUS}`}
                >
                  <Plus size={14} /> Add record
                </Link>
              )}
            </div>

            {busy && (
              <div aria-busy="true" aria-label="Loading your CGPA" className="space-y-4">
                <div className={`h-10 w-28 rounded-lg motion-safe:animate-pulse ${theme.soft}`} />
                <div className={`h-28 rounded-2xl motion-safe:animate-pulse ${theme.soft}`} />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className={`h-14 rounded-xl motion-safe:animate-pulse ${theme.soft}`} />
                  ))}
                </div>
              </div>
            )}

            {!busy && signedOut && (
              <div className={`flex flex-col items-center rounded-2xl px-6 py-8 text-center ${theme.soft}`}>
                <EmptyChartArt className="mb-3 h-20 w-auto" />
                <h3 className="text-sm font-bold">Sign in to see your progress</h3>
                <p className={`mt-1 max-w-xs text-xs leading-5 ${theme.textSoft}`}>
                  Your CGPA records are saved to your account, so they follow you across devices.
                </p>
                <Link to="/login" className={`mt-4 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 ${FOCUS}`}>
                  Sign in
                </Link>
              </div>
            )}

            {!busy && uid && loadError && summary.count === 0 && (
              <div role="alert" className={`rounded-2xl px-6 py-8 text-center ${theme.soft}`}>
                <h3 className="text-sm font-bold">{loadError}</h3>
                <p className={`mt-1 text-xs ${theme.textSoft}`}>Check your connection and try again.</p>
                <button
                  type="button"
                  onClick={() => fetchRecords()}
                  className={`mt-4 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 ${FOCUS}`}
                >
                  Try again
                </button>
              </div>
            )}

            {!busy && uid && !loadError && summary.count === 0 && (
              <div className={`flex flex-col items-center rounded-2xl px-6 py-8 text-center ${theme.soft}`}>
                <EmptyChartArt className="mb-3 h-20 w-auto" />
                <h3 className="text-sm font-bold">No records yet</h3>
                <p className={`mt-1 max-w-xs text-xs leading-5 ${theme.textSoft}`}>
                  Add a semester and we'll chart your progress and show how you're trending.
                </p>
                <Link to="/CGPA" className={`mt-4 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 ${FOCUS}`}>
                  Add your first record
                </Link>
              </div>
            )}

            {!busy && uid && summary.count > 0 && (
              <>
                <div className="flex items-end gap-3">
                  <p className="text-5xl font-black leading-none tracking-tight text-indigo-500 tabular-nums">
                    {summary.latest.toFixed(2)}
                  </p>
                  <div className="pb-1">
                    <p className={`text-xs ${theme.textSoft}`}>Latest</p>
                    <Delta value={summary.change} />
                  </div>
                </div>

                <div className="mt-4">
                  {sparkData.length > 1 ? (
                    <Sparkline data={sparkData} />
                  ) : (
                    <p className={`rounded-xl px-4 py-5 text-center text-xs ${theme.soft} ${theme.textSoft}`}>
                      Add one more record to see your trend.
                    </p>
                  )}
                </div>

                <dl className={`mt-4 grid grid-cols-3 divide-x rounded-2xl py-3 ${theme.soft} ${theme.divider}`}>
                  {[
                    ["Best", summary.best.toFixed(2)],
                    ["Average", summary.avg.toFixed(2)],
                    ["Records", summary.count],
                  ].map(([label, value]) => (
                    <div key={label} className="px-4 text-center">
                      <dt className={`text-xs ${theme.textSoft}`}>{label}</dt>
                      <dd className="mt-0.5 text-lg font-black tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </section>

          {/* Daily challenge */}
          <section className="relative overflow-hidden rounded-3xl bg-indigo-600 p-5 text-white shadow-lg shadow-indigo-600/20 md:p-6 lg:col-start-2 lg:row-start-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-100">Daily challenge</p>
                <h2 className="mt-1 text-xl font-black leading-snug">Ready for today's questions?</h2>
              </div>
              <ChallengeArt className="-mr-2 -mt-2 h-24 w-auto shrink-0" />
            </div>
            <p className="mt-2 text-sm leading-6 text-indigo-100">
              A few quick questions, fresh every day. Earn XP and see where you rank.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                to="/challenge"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
              >
                Start challenge <ArrowRight size={16} />
              </Link>
              <Link
                to="/leaderboard"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
              >
                <Trophy size={15} /> Leaderboard
              </Link>
            </div>
          </section>

          {/* CGPA history */}
          {uid && !busy && summary.count > 0 && (
            <section aria-labelledby="history-title" className={`${theme.card} rounded-3xl p-5 md:p-6 lg:col-start-1 lg:row-start-2`}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id="history-title" className="text-lg font-black">
                  History
                </h2>
                <p className={`text-xs ${theme.textSoft}`}>Newest first</p>
              </div>

              <ul className="space-y-2">
                {visibleRecords.map((record, i) => {
                  const older = sorted[i + 1];
                  const date = formatDate(record.createdAt);
                  const delta = older ? record.cgpa - older.cgpa : null;
                  return (
                    <li key={record.id} className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${theme.soft}`}>
                      <p className="w-14 shrink-0 text-xl font-black tabular-nums text-indigo-500">
                        {record.cgpa.toFixed(2)}
                      </p>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-xs ${theme.textSoft}`}>
                          {record.semesterCount} semester{record.semesterCount === 1 ? "" : "s"}
                          {date ? `, saved ${date}` : ""}
                        </p>
                      </div>
                      <Delta value={delta} className="shrink-0" />
                      <button
                        type="button"
                        onClick={() => deleteRecord(record)}
                        aria-label={`Delete record with CGPA ${record.cgpa.toFixed(2)}`}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${theme.textFaint} hover:bg-red-500/10 hover:text-red-500 ${FOCUS}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {sorted.length > RECORDS_PREVIEW_COUNT && (
                <button
                  type="button"
                  onClick={() => setShowAllRecords((v) => !v)}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded text-xs font-bold text-indigo-500 transition hover:text-indigo-400 ${FOCUS}`}
                >
                  {showAllRecords ? "Show fewer" : `Show all ${sorted.length}`}
                  <ChevronRight size={13} className={`transition-transform ${showAllRecords ? "-rotate-90" : "rotate-90"}`} />
                </button>
              )}
            </section>
          )}

          {/* Groups */}
          <section className={`${theme.card} rounded-3xl p-5 md:p-6 lg:col-start-2 lg:row-start-2`}>
            <GroupsArt className="mb-4 h-24 w-auto" />
            <h2 className="text-lg font-black">Study with people who get it</h2>
            <p className={`mt-1.5 text-sm leading-6 ${theme.textSoft}`}>
              Join groups from your university to swap notes, ask questions, and team up on projects.
            </p>
            <Link
              to="/community"
              className={`mt-4 inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition hover:border-indigo-400/60 hover:text-indigo-500 ${
                dark ? "border-white/15" : "border-gray-200"
              } ${FOCUS}`}
            >
              <Users size={15} /> Browse groups
            </Link>
          </section>
        </div>

        {/* ---------- explore tools ---------- */}
        <section id="explore-tools" ref={toolsRef} aria-labelledby="tools-title" className="mb-10 scroll-mt-24 md:mb-12">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="tools-title" className="text-xl font-black md:text-2xl">
                Explore tools
              </h2>
              <p className={`mt-1 text-sm ${theme.textSoft}`}>
                {allFeatures.length} tools for your studies, campus life, and community.
              </p>
            </div>
            <Link to="/features" className={`inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-indigo-500 transition hover:text-indigo-400 ${FOCUS}`}>
              See all features <ArrowRight size={15} />
            </Link>
          </div>

          <div className={`mb-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 transition ${theme.input}`}>
            <Search size={17} className={theme.textFaint} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchQuery("")}
              placeholder="Search tools, e.g. CGPA calculator, marketplace"
              aria-label="Search tools"
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${dark ? "placeholder:text-gray-500" : "placeholder:text-gray-400"}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-red-500/10 hover:text-red-500 ${theme.textFaint}`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative mb-5">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pr-8 [scrollbar-width:none]">
              {categoryNames.map((name) => {
                const active = activeCategory === name;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveCategory(name)}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${FOCUS} ${
                      active
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : `${theme.card} hover:border-indigo-500/50 hover:text-indigo-500`
                    }`}
                  >
                    {name}
                    <span className={`tabular-nums ${active ? "text-indigo-100" : theme.textFaint}`}>
                      {categoryCounts[name] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {isFiltering && (
            <div className="mb-3 flex items-center justify-between" aria-live="polite">
              <p className={`text-xs font-semibold ${theme.textSoft}`}>
                {matchedItems.length} {matchedItems.length === 1 ? "tool" : "tools"} found
              </p>
              <button type="button" onClick={clearFilters} className={`rounded text-xs font-bold text-indigo-500 transition hover:text-indigo-400 ${FOCUS}`}>
                Clear filters
              </button>
            </div>
          )}

          {shownItems.length === 0 ? (
            <div className={`rounded-3xl p-10 text-center ${theme.soft}`}>
              <Search className="mx-auto mb-4 opacity-40" size={32} />
              <h3 className="font-bold">
                {searchQuery ? `Nothing matches "${searchQuery}"` : "No tools in this category yet"}
              </h3>
              <p className={`mx-auto mt-1 max-w-sm text-sm ${theme.textSoft}`}>
                Try a shorter keyword, check the spelling, or browse another category.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className={`mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-600 ${FOCUS}`}
              >
                Show all tools
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {shownItems.map((item) => (
                <ToolRow
                  key={`${item.category}-${item.title}`}
                  item={item}
                  theme={theme}
                  showCategory={Boolean(normalizedQuery) && activeCategory === "All"}
                  onOpen={trackTool}
                />
              ))}
            </div>
          )}

          {canToggleTools && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setShowAllTools((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition hover:border-indigo-400/60 hover:text-indigo-500 ${theme.card} ${FOCUS}`}
              >
                {showAllTools ? "Show fewer tools" : `Show all ${matchedItems.length} tools`}
                <ChevronRight size={13} className={`transition-transform ${showAllTools ? "-rotate-90" : "rotate-90"}`} />
              </button>
            </div>
          )}
        </section>

        <div className="h-6" />
      </div>
    </div>
  );
};

export default Dashboard;