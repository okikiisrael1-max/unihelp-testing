import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Compass,
  Copy,
  Crown,
  FileText,
  Globe,
  Image as ImageIcon,
  Info,
  ListChecks,
  Loader2,
  Lock,
  MessageCircle,
  MoreVertical,
  Newspaper,
  Paperclip,
  Plus,
  Reply,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Trash2,
  UploadCloud,
  UserMinus,
  Users,
  X,
  Bell,
  Pencil,
} from "lucide-react";

import { db } from "../../firebase/config";
import { uploadFeatureMedia } from "../../services/api";
import { AuthContext } from "../context/AuthContext";
import {
  approveJoinRequest,
  createGroup,
  createGroupPoll,
  createPost,
  deleteOwnPost,
  formatShortTime,
  getCurrentUserProfile,
  getGroup,
  getMembership,
  joinPublicGroup,
  leaveGroup,
  listGroups,
  listenGroupMessages,
  listenGroupPosts,
  loadOlderGroupMessages,
  reactToPost,
  rejectJoinRequest,
  requestJoinGroup,
  sendGroupMessage,
  editGroupPoll,
  setGroupPollClosed,
  voteGroupPoll,
} from "../service/communityService";

/* -------------------------------------------------------------------------- */
/*  Constants, tokens, caches                                                 */
/* -------------------------------------------------------------------------- */

const uploadGroupMedia = (file, resourceType = "image") => uploadFeatureMedia(file, { feature: "groups", resourceType });
const toR2Asset = (result) => ({ url: result?.url || result?.secure_url || "", key: result?.key || result?.publicId || "", storageProvider: "r2" });

const CATEGORIES = ["All", "Academics", "Campus Life", "Marketplace", "Study Group"];
const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏"];
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const CACHE_TTL = 5 * 60 * 1000;
const LONG_TTL = 15 * 60 * 1000;
const POSTS_PAGE = 15;

const DEFAULT_FILTERS = { category: "All", privacy: "all", membership: "all", role: "all", sort: "relevant" };

const TAB_KEYS = ["Feed", "Chat", "Members", "Library", "About"];
const TAB_ICONS = { Feed: Newspaper, Chat: MessageCircle, Members: Users, Library: ImageIcon, About: Info };
const TAB_ALIASES = { Media: "Library", Files: "Library" };

/* Module-level caches: revisiting a page or switching views never re-reads the same docs. */
const profileCache = new Map(); // uid -> { at, data }
const groupCache = new Map(); // groupId -> { at, data }
const listCache = new Map(); // `${term}|${category}` -> { at, groups, cursor, hasMore }
const membersCache = new Map(); // groupId -> { at, members }
const requestsCache = new Map(); // groupId -> { at, requests }
const pendingJoin = new Set(); // groupIds with a request I already sent
const pendingChecked = new Set(); // groupIds whose request status was already read
const joinedCache = { uid: "", at: 0, ok: false, map: new Map() }; // groupId -> { role }
const fresh = (entry, ttl = CACHE_TTL) => !!entry && Date.now() - entry.at < ttl;

const loadProfile = async (user) => {
  if (!user?.uid) return {};
  const cached = profileCache.get(user.uid);
  if (fresh(cached, LONG_TTL)) return cached.data;
  const data = (await getCurrentUserProfile(user)) || {};
  profileCache.set(user.uid, { at: Date.now(), data });
  return data;
};

// One query tells us every group the person is in (no per-card membership reads).
const loadJoined = async (uid) => {
  if (joinedCache.uid === uid && joinedCache.ok && fresh(joinedCache, LONG_TTL)) return joinedCache.map;
  try {
    const snap = await getDocs(query(collection(db, "users", uid, "groups"), limit(100)));
    joinedCache.uid = uid;
    joinedCache.at = Date.now();
    joinedCache.ok = true;
    joinedCache.map = new Map(snap.docs.map((d) => [d.id, { role: d.data()?.role || "member" }]));
  } catch {
    /* keep whatever we had; never mark a failed read as "known" */
  }
  return joinedCache.uid === uid ? joinedCache.map : new Map();
};

// Returns undefined when the cache cannot answer reliably (so the caller reads once).
const cachedMembership = (uid, id) => {
  if (joinedCache.uid !== uid || !joinedCache.ok || !fresh(joinedCache, LONG_TTL)) return undefined;
  if (joinedCache.map.has(id)) return joinedCache.map.get(id);
  return joinedCache.map.size < 100 ? null : undefined;
};

const markJoined = (uid, id, role = "member") => {
  if (joinedCache.uid !== uid) {
    joinedCache.uid = uid;
    joinedCache.ok = false;
    joinedCache.map = new Map();
  }
  joinedCache.map = new Map(joinedCache.map).set(id, { role });
  joinedCache.at = Date.now();
};

const markLeft = (uid, id) => {
  if (joinedCache.uid !== uid) return;
  const next = new Map(joinedCache.map);
  next.delete(id);
  joinedCache.map = next;
};

const bumpGroup = (id, delta) => {
  const cached = groupCache.get(id);
  if (cached) groupCache.set(id, { at: cached.at, data: { ...cached.data, memberCount: Math.max(0, (cached.data.memberCount || 0) + delta) } });
};

const paletteVars = (dark) =>
  dark
    ? {
        "--paper": "#050816",
        "--paper-raised": "#0b1224",
        "--paper-sunken": "#101a30",
        "--ink": "#f1f5f9",
        "--ink-soft": "#cbd5e1",
        "--ink-faint": "#94a3b8",
        "--line": "#1f2a44",
        "--brand": "#6366f1",
        "--brand-text": "#a5b4fc",
        "--brand-soft": "rgba(129,140,248,0.16)",
        "--on-brand": "#ffffff",
        "--danger": "#f87171",
        "--danger-soft": "rgba(248,113,113,0.14)",
      }
    : {
        "--paper": "#f5f7ff",
        "--paper-raised": "#ffffff",
        "--paper-sunken": "#eef1fb",
        "--ink": "#0f172a",
        "--ink-soft": "#475569",
        "--ink-faint": "#64748b",
        "--line": "#e2e8f0",
        "--brand": "#4f46e5",
        "--brand-text": "#4338ca",
        "--brand-soft": "#eef2ff",
        "--on-brand": "#ffffff",
        "--danger": "#dc2626",
        "--danger-soft": "#fee2e2",
      };

const cx = {
  panel: "rounded-2xl border [border-color:var(--line)] [background:var(--paper-raised)]",
  soft: "rounded-xl border [border-color:var(--line)] [background:var(--paper-sunken)]",
  muted: "[color:var(--ink-soft)]",
  faint: "[color:var(--ink-faint)]",
  input:
    "w-full rounded-xl border [border-color:var(--line)] [background:var(--paper-raised)] px-4 py-3 text-sm outline-none transition placeholder:[color:var(--ink-faint)] focus:[border-color:var(--brand)]",
  ghostIcon:
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border [border-color:var(--line)] [background:var(--paper-raised)] [color:var(--ink-soft)] transition active:scale-95 hover:[border-color:var(--brand)] hover:[color:var(--ink)]",
  plainIcon:
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full [color:var(--ink-soft)] transition active:scale-95 hover:[background:var(--paper-sunken)] hover:[color:var(--ink)]",
  primaryBtn:
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl [background:var(--brand)] px-4 text-sm font-semibold [color:var(--on-brand)] transition active:scale-[0.98] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
  ghostBtn:
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border [border-color:var(--line)] [background:var(--paper-raised)] px-4 text-sm font-semibold [color:var(--ink)] transition active:scale-[0.98] hover:[border-color:var(--brand)] disabled:cursor-not-allowed disabled:opacity-50",
  softBtn:
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl [background:var(--brand-soft)] px-4 text-sm font-semibold [color:var(--brand-text)] transition active:scale-[0.98] hover:brightness-95",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const toMs = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const hueFor = (text = "") => {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
};

const initial = (name = "Student") => name.trim().charAt(0).toUpperCase() || "S";
const fileKind = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "document";
};
const messagePreview = (message) => (message?.text ? message.text.slice(0, 120) : message?.attachments?.[0]?.name || (message?.poll ? "Poll" : "Attachment"));
const mentionToken = (member) => `@${(member?.name || "Student").replace(/\s+/g, "")}`;
const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
const formatCount = (n = 0) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const groupLink = (id) => `${window.location.origin}/community/${id}`;

const dayLabel = (ms) => {
  const date = new Date(ms);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
};

function useObjectUrl(file) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return undefined;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

// Close a popover on outside press or Escape.
function useDismiss(ref, open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) closeRef.current?.();
    };
    const onKey = (event) => {
      if (event.key === "Escape") closeRef.current?.();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref]);
}

function GlobalStyle() {
  return (
    <style>{`
      .quad-scope { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
      .quad-scope ::selection { background: var(--brand-soft); color: var(--ink); }
      .quad-scope *:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
      .quad-scope ::-webkit-scrollbar { width: 8px; height: 8px; }
      .quad-scope ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 999px; }
      .quad-scope .no-scrollbar::-webkit-scrollbar { display: none; }
      .quad-scope .no-scrollbar { scrollbar-width: none; }
      @keyframes quad-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      @keyframes quad-pop { from { opacity: 0; transform: translateY(4px) scale(.97); } to { opacity: 1; transform: none; } }
      @keyframes quad-sheet { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
      @keyframes quad-fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes quad-toast { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
      .quad-rise { animation: quad-rise .22s ease backwards; }
      .quad-pop { animation: quad-pop .14s ease backwards; }
      .quad-sheet { animation: quad-sheet .22s cubic-bezier(.2,.8,.2,1) backwards; }
      .quad-fade { animation: quad-fade .16s ease backwards; }
      .quad-toast { animation: quad-toast .2s ease backwards; }
      .quad-menu { animation: quad-sheet .2s cubic-bezier(.2,.8,.2,1) backwards; }
      @media (min-width: 768px) { .quad-menu { animation: quad-pop .14s ease backwards; } }
      @media (prefers-reduced-motion: reduce) {
        .quad-scope * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
}

function PageChrome({ dark, children }) {
  const vars = useMemo(() => paletteVars(dark), [dark]);
  return (
    <div style={vars} className="quad-scope min-h-screen [background:var(--paper)] [color:var(--ink)] antialiased">
      <GlobalStyle />
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toasts                                                                    */
/* -------------------------------------------------------------------------- */

function useToasts() {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const push = useCallback(
    (message, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setItems((cur) => [...cur.slice(-2), { id, message, tone: "info", ...opts }]);
      setTimeout(() => dismiss(id), opts.duration || 4000);
    },
    [dismiss]
  );
  return { items, push, dismiss };
}

function ToastHost({ items, dismiss }) {
  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[700] flex flex-col items-center gap-2 px-4 md:top-20">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`quad-toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl [background:var(--paper-raised)] ${
            item.tone === "error" ? "[border-color:var(--danger)]" : "[border-color:var(--line)]"
          }`}
        >
          {item.tone === "success" && <CheckCircle2 size={17} className="shrink-0 [color:var(--brand-text)]" />}
          <span className="min-w-0 flex-1">{item.message}</span>
          {item.action && (
            <Link to={item.action.to} className="shrink-0 font-semibold [color:var(--brand-text)] hover:underline">
              {item.action.label}
            </Link>
          )}
          <button onClick={() => dismiss(item.id)} className={`shrink-0 ${cx.faint}`} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared UI: Menu (vertical ellipsis), Modal, Confirm                       */
/* -------------------------------------------------------------------------- */

/**
 * Dropdown on desktop, bottom sheet on phones. Pass `items` ({label, icon, onClick, to, danger, show, divider, badge})
 * or a render-prop child `(close) => node` for custom panels.
 */
function Menu({ items, children, label = "More options", trigger, buttonClass, align = "right", width = "md:w-56", direction = "down", onOpen, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const visible = items ? items.filter((i) => i && i.show !== false) : null;
  if (items && !visible.length) return null;

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!open) onOpen?.();
          setOpen((v) => !v);
        }}
        className={buttonClass || cx.ghostIcon}
      >
        {trigger || <MoreVertical size={18} />}
      </button>
      {open && (
        <>
          <div className="quad-fade fixed inset-0 z-[560] bg-black/40 md:hidden" onClick={close} />
          <div
            role="menu"
            className={`quad-menu fixed inset-x-3 bottom-3 z-[570] max-h-[80dvh] overflow-y-auto rounded-2xl border py-1 shadow-2xl [border-color:var(--line)] [background:var(--paper-raised)] md:absolute md:inset-x-auto md:bottom-auto md:max-h-none md:overflow-visible md:shadow-xl ${width} ${
              align === "right" ? "md:right-0" : "md:left-0"
            } ${direction === "up" ? "md:bottom-full md:mb-2" : "md:top-full md:mt-2"}`}
          >
            {visible
              ? visible.map((item) => {
                  const Icon = item.icon;
                  const cls = `flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition md:py-2.5 ${
                    item.danger ? "[color:var(--danger)] hover:[background:var(--danger-soft)]" : "hover:[background:var(--paper-sunken)]"
                  }`;
                  const inner = (
                    <>
                      {Icon && <Icon size={16} className="shrink-0 opacity-80" />}
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold [background:var(--brand)] [color:var(--on-brand)]">{item.badge}</span> : null}
                    </>
                  );
                  return (
                    <React.Fragment key={item.label}>
                      {item.divider && <div className="my-1 border-t [border-color:var(--line)]" />}
                      {item.to ? (
                        <Link role="menuitem" to={item.to} onClick={close} className={cls}>{inner}</Link>
                      ) : (
                        <button type="button" role="menuitem" onClick={() => { close(); item.onClick?.(); }} className={cls}>{inner}</button>
                      )}
                    </React.Fragment>
                  );
                })
              : children(close)}
          </div>
        </>
      )}
    </div>
  );
}

function Modal({ onClose, label, children, size = "sm:max-w-2xl", locked = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !locked && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, locked]);
  return (
    <div className="quad-fade fixed inset-0 z-[580] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => !locked && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={`quad-sheet flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border shadow-2xl [border-color:var(--line)] [background:var(--paper-raised)] sm:rounded-3xl ${size}`}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel = "Confirm", danger = false, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  };
  return (
    <Modal onClose={onClose} label={title} size="sm:max-w-sm" locked={busy}>
      <div className="p-5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className={`mt-1.5 text-sm leading-6 ${cx.muted}`}>{body}</p>
        <div className="mt-5 flex gap-2 pb-[env(safe-area-inset-bottom)]">
          <button onClick={onClose} disabled={busy} className={`${cx.ghostBtn} flex-1`}>Cancel</button>
          <button
            onClick={run}
            disabled={busy}
            className={`${danger ? "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 [background:var(--danger)] hover:brightness-110" : `${cx.primaryBtn} flex-1`}`}
          >
            {busy && <Loader2 size={16} className="animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                               */
/* -------------------------------------------------------------------------- */

const AV = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-base", lg: "h-16 w-16 text-xl", xl: "h-24 w-24 text-3xl" };

const GroupAvatar = ({ group, size = "md", ring = false, className = "" }) => (
  <div
    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-bold [background:var(--brand-soft)] [color:var(--brand-text)] ${AV[size]} ${
      ring ? "border-4 [border-color:var(--paper-raised)]" : ""
    } ${className}`}
  >
    {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : initial(group.name)}
  </div>
);

const UserAvatar = memo(function UserAvatar({ src, name, size = "sm" }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold [background:var(--brand-soft)] [color:var(--brand-text)] ${AV[size]}`} title={name}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : initial(name)}
    </div>
  );
});

// Cover: uploaded image, or a solid colour derived from the group name (stable per group).
const CoverPattern = ({ group }) =>
  group.coverUrl ? (
    <img src={group.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
  ) : (
    <div className="relative h-full w-full overflow-hidden" style={{ background: `hsl(${hueFor(group.name)} 42% 38%)` }}>
      <span className="absolute -bottom-6 right-3 select-none text-[7rem] font-black leading-none text-white/10">{initial(group.name)}</span>
    </div>
  );

const RoleBadge = ({ role, overlay = false }) => {
  const Icon = role === "owner" ? Crown : role === "admin" ? ShieldCheck : Check;
  const label = role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Joined";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${overlay ? "bg-black/55 text-white backdrop-blur" : "[background:var(--brand-soft)] [color:var(--brand-text)]"}`}>
      <Icon size={11} /> {label}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className={`quad-rise p-8 text-center sm:p-10 ${cx.soft}`}>
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl [background:var(--brand-soft)] [color:var(--brand-text)]">
      <Icon size={26} strokeWidth={1.7} />
    </div>
    <h3 className="mt-4 text-base font-semibold">{title}</h3>
    <p className={`mx-auto mt-1.5 max-w-sm text-sm leading-6 ${cx.muted}`}>{text}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

const SkeletonCards = ({ count = 6 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`h-60 animate-pulse ${cx.soft}`} />
    ))}
  </div>
);

const AttachmentPreview = ({ attachment, tile = false }) => {
  if (!attachment?.url) return null;
  if (attachment.type === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
        <img src={attachment.url} alt={attachment.name || "Attachment"} className={`w-full rounded-xl object-cover ${tile ? "aspect-square" : "max-h-80"}`} loading="lazy" decoding="async" />
      </a>
    );
  }
  if (attachment.type === "video") {
    return <video src={attachment.url} controls preload="metadata" className={`w-full rounded-xl bg-black ${tile ? "aspect-square object-cover" : "max-h-80"}`} />;
  }
  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold [border-color:var(--line)] [background:var(--paper-sunken)] hover:[border-color:var(--brand)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [background:var(--brand-soft)] [color:var(--brand-text)]"><FileText size={17} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{attachment.name || "Open file"}</span>
        {attachment.bytes ? <span className={`text-xs font-normal ${cx.faint}`}>{formatBytes(attachment.bytes)}</span> : null}
      </span>
    </a>
  );
};

/* -------------------------------------------------------------------------- */
/*  Composer                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * variant "chat": slim input row (+ menu, pill input, send icon).
 * variant "post": larger card used for feed posts.
 * Text clears instantly on send and is restored if sending fails.
 */
function Composer({
  variant = "chat", placeholder, onSend, allowVideo = true, replyTo = null, onCancelReply, mentionMembers = [], onMentionIntent,
  enterToSend = false, sendLabel = "Send", extraItems = [], onDone, autoFocus = false,
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const areaRef = useRef(null);
  const inputRef = useRef(null);
  const askedRef = useRef(false);
  const preview = useObjectUrl(file && file.type.startsWith("image/") ? file : null);
  const compact = variant === "chat";

  useEffect(() => {
    if (autoFocus) areaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (replyTo) areaRef.current?.focus();
  }, [replyTo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const mentionMatch = text.match(/(^|\s)@([^\s@]*)$/);
  const mentionActive = !!mentionMatch;
  useEffect(() => {
    if (mentionActive && !askedRef.current) {
      askedRef.current = true;
      onMentionIntent?.(); // members are only read once someone actually types "@"
    }
  }, [mentionActive, onMentionIntent]);

  const mentionOptions = useMemo(() => {
    if (!mentionMatch || !mentionMembers.length) return [];
    const q = mentionMatch[2].toLowerCase();
    return mentionMembers.filter((m) => (m.name || "").replace(/\s+/g, "").toLowerCase().startsWith(q)).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mentionMembers]);

  const pickMention = (member) => {
    setText((cur) => cur.replace(/@([^\s@]*)$/, `${mentionToken(member)} `));
    areaRef.current?.focus();
  };

  const stageFile = (picked) => {
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) {
      setError("That file is larger than 25 MB. Choose a smaller one.");
      return;
    }
    setError("");
    setFile(picked);
  };

  const submit = async () => {
    const value = text.trim();
    if (sending || (!value && !file)) return;
    const picked = file;
    const kind = picked ? fileKind(picked) : "";
    if (kind === "video" && !allowVideo) {
      setError("Video uploads are available for premium users.");
      return;
    }
    setError("");
    const mentions = mentionMembers
      .filter((member) => value.includes(mentionToken(member)))
      .map((member) => ({ uid: member.id || member.uid, name: member.name || "Student" }));
    const reply = replyTo ? { id: replyTo.id, senderId: replyTo.senderId || "", senderName: replyTo.senderName || "Student", text: messagePreview(replyTo) } : null;
    if (picked) setSending(true);
    else setText("");
    try {
      const attachments = [];
      if (picked) {
        const uploaded = await uploadGroupMedia(picked, kind === "image" || kind === "video" ? kind : "raw");
        attachments.push({
          type: kind,
          url: uploaded.url || uploaded.secure_url,
          key: uploaded.key || uploaded.publicId,
          resourceType: uploaded.resourceType || (kind === "image" || kind === "video" ? kind : "raw"),
          name: uploaded.originalFilename || picked.name,
          bytes: uploaded.bytes || picked.size,
        });
      }
      await onSend({ text: value, attachments, mentions, replyTo: reply });
      if (picked) {
        setText("");
        setFile(null);
      }
      onCancelReply?.();
      onDone?.();
    } catch (err) {
      if (!picked) setText((cur) => cur || value);
      setError(err?.errors?.[0] || err?.message || "Could not send. Try again.");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (enterToSend && e.key === "Enter" && !e.shiftKey && window.matchMedia?.("(pointer: fine)").matches) {
      e.preventDefault();
      submit();
    }
  };
  const onPaste = (e) => {
    const pasted = Array.from(e.clipboardData?.files || [])[0];
    if (pasted) {
      e.preventDefault();
      stageFile(pasted);
    }
  };

  const hidden = (
    <input ref={inputRef} hidden type="file" onChange={(e) => { stageFile(e.target.files?.[0] || null); e.target.value = ""; }} />
  );

  const replyBanner = replyTo && (
    <div className={`quad-pop mb-2 flex items-start justify-between gap-3 border-l-4 p-2.5 text-xs [border-left-color:var(--brand)] ${cx.soft}`}>
      <div className="min-w-0">
        <p className="font-semibold">Replying to {replyTo.senderName || "Student"}</p>
        <p className={`mt-0.5 line-clamp-1 ${cx.muted}`}>{messagePreview(replyTo)}</p>
      </div>
      <button type="button" onClick={onCancelReply} className="shrink-0 rounded p-1 [color:var(--danger)] hover:[background:var(--danger-soft)]" aria-label="Cancel reply"><X size={14} /></button>
    </div>
  );

  const mentionList = mentionOptions.length > 0 && (
    <div className="quad-pop absolute bottom-full left-3 z-20 mb-2 w-64 overflow-hidden rounded-xl border py-1 shadow-xl [border-color:var(--line)] [background:var(--paper-raised)]">
      {mentionOptions.map((member) => (
        <button key={member.id || member.uid} type="button" onClick={() => pickMention(member)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:[background:var(--paper-sunken)]">
          <UserAvatar src={member.avatar} name={member.name} />
          <span className="truncate font-medium">{member.name}</span>
        </button>
      ))}
    </div>
  );

  const fileChip = file && (
    <div className={`quad-pop mb-2 flex items-center gap-3 p-2 text-xs ${cx.soft}`}>
      {preview ? <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-lg [background:var(--brand-soft)] [color:var(--brand-text)]"><FileText size={18} /></span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{file.name}</span>
        <span className={cx.faint}>{sending ? "Uploading…" : formatBytes(file.size)}</span>
      </span>
      {sending ? <Loader2 size={16} className="mr-2 animate-spin [color:var(--brand-text)]" /> : (
        <button onClick={() => setFile(null)} className="shrink-0 rounded p-1.5 [color:var(--danger)] hover:[background:var(--danger-soft)]" aria-label="Remove attachment"><X size={14} /></button>
      )}
    </div>
  );

  const errorBox = error && <div role="alert" className="mb-2 rounded-lg p-2.5 text-xs font-medium [background:var(--danger-soft)] [color:var(--danger)]">{error}</div>;

  if (compact) {
    return (
      <div className="relative border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] [border-color:var(--line)] [background:var(--paper-raised)] sm:p-3">
        {replyBanner}
        {mentionList}
        {fileChip}
        {errorBox}
        <div className="flex items-end gap-1.5">
          <Menu
            label="Add to message"
            direction="up"
            align="left"
            width="md:w-52"
            trigger={<Plus size={20} />}
            buttonClass={cx.plainIcon}
            items={[{ label: "Attach file", icon: Paperclip, onClick: () => inputRef.current?.click() }, ...extraItems]}
          />
          <textarea
            ref={areaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={placeholder}
            aria-label={placeholder}
            className="max-h-40 min-h-11 min-w-0 flex-1 resize-none rounded-3xl border px-4 py-2.5 text-sm leading-6 outline-none transition [border-color:var(--line)] [background:var(--paper-sunken)] placeholder:[color:var(--ink-faint)] focus:[border-color:var(--brand)]"
          />
          <button
            type="button"
            onClick={submit}
            disabled={sending || (!text.trim() && !file)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 hover:brightness-110 disabled:opacity-40 [background:var(--brand)] [color:var(--on-brand)]"
            aria-label={sendLabel}
          >
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
        {hidden}
      </div>
    );
  }

  return (
    <div className={`quad-rise relative p-3 ${cx.panel}`}>
      {replyBanner}
      {mentionList}
      <textarea
        ref={areaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        rows={3}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-h-44 w-full resize-none border-0 bg-transparent px-1 text-sm leading-6 outline-none placeholder:[color:var(--ink-faint)]"
      />
      {fileChip}
      {errorBox}
      <div className="mt-1 flex items-center justify-between gap-2 border-t pt-2.5 [border-color:var(--line)]">
        <button type="button" onClick={() => inputRef.current?.click()} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${cx.soft} ${cx.muted}`}>
          <UploadCloud size={15} /> Attach
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDone} className={`${cx.ghostBtn} h-10 px-3 text-xs`}>Cancel</button>
          <button onClick={submit} disabled={sending || (!text.trim() && !file)} className={`${cx.primaryBtn} h-10 px-4`}>
            {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} {sendLabel}
          </button>
        </div>
      </div>
      {hidden}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Create group                                                              */
/* -------------------------------------------------------------------------- */

function CreateGroupModal({ onClose, onCreated, user, profile }) {
  const [form, setForm] = useState({ name: "", description: "", category: "Academics", privacy: "public", rules: "" });
  const [cover, setCover] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const coverPreview = useObjectUrl(cover);
  const avatarPreview = useObjectUrl(avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pickImage = (setter) => (e) => {
    const picked = e.target.files?.[0] || null;
    e.target.value = "";
    if (picked && picked.size > MAX_FILE_BYTES) {
      setError("That image is larger than 25 MB.");
      return;
    }
    setter(picked);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      setError("Add a group name and a short description.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const uploads = {};
      if (cover) {
        const result = await uploadGroupMedia(cover);
        uploads.coverUrl = result.url || result.secure_url;
        uploads.coverAsset = toR2Asset(result);
      }
      if (avatar) {
        const result = await uploadGroupMedia(avatar);
        uploads.avatarUrl = result.url || result.secure_url;
        uploads.avatarAsset = toR2Asset(result);
      }
      const id = await createGroup({ form, user, profile, uploads });
      markJoined(user.uid, id, "owner");
      listCache.clear();
      onCreated(id);
    } catch (err) {
      setError(err?.errors?.[0] || err?.message || "Could not create the group.");
      setSaving(false);
    }
  };

  const privacyOptions = [
    { value: "public", icon: Globe, title: "Public", text: "Anyone can find and join instantly." },
    { value: "private", icon: Lock, title: "Private", text: "People request access; admins approve." },
  ];

  return (
    <Modal onClose={onClose} label="Create a group" locked={saving}>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4 border-b p-5 [border-color:var(--line)]">
          <div>
            <h2 className="text-xl font-bold">Create a group</h2>
            <p className={`mt-1 text-sm ${cx.muted}`}>Set the basics now. You can manage members and rules later.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className={cx.ghostIcon} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="rounded-2xl border [border-color:var(--line)]">
            <div className="relative h-28 overflow-hidden rounded-t-2xl [background:var(--paper-sunken)]">
              {coverPreview ? <img src={coverPreview} alt="" className="h-full w-full object-cover" /> : <CoverPattern group={{ name: form.name || "Group" }} />}
              <label className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <ImageIcon size={13} /> {cover ? "Change cover" : "Add cover"}
                <input type="file" hidden accept="image/*" onChange={pickImage(setCover)} />
              </label>
            </div>
            <div className="flex items-center gap-4 px-4 pb-4">
              <label className="relative -mt-8 cursor-pointer" aria-label="Choose group avatar">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 text-xl font-bold [border-color:var(--paper-raised)] [background:var(--brand-soft)] [color:var(--brand-text)]">
                  {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : initial(form.name || "G")}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 [border-color:var(--paper-raised)] [background:var(--brand)] [color:var(--on-brand)]"><UploadCloud size={12} /></span>
                <input type="file" hidden accept="image/*" onChange={pickImage(setAvatar)} />
              </label>
              <p className={`pt-3 text-xs ${cx.faint}`}>Avatar and cover are optional.</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Group name</span>
              <input className={cx.input} value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CSC 301 Study Circle" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Category</span>
              <select className={cx.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 flex justify-between text-xs font-semibold">Description <span className={`font-normal ${cx.faint}`}>{form.description.length}/300</span></span>
              <textarea className={cx.input} rows={3} maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this group for, and who is it for?" />
            </label>
            <fieldset className="md:col-span-2">
              <legend className="mb-1.5 text-xs font-semibold">Who can join</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {privacyOptions.map(({ value, icon: Icon, title, text }) => {
                  const selected = form.privacy === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, privacy: value })}
                      aria-pressed={selected}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${selected ? "[border-color:var(--brand)] [background:var(--brand-soft)]" : "[border-color:var(--line)] hover:[border-color:var(--brand)]"}`}
                    >
                      <Icon size={18} className={selected ? "mt-0.5 [color:var(--brand-text)]" : "mt-0.5"} />
                      <span>
                        <span className="block text-sm font-semibold">{title}</span>
                        <span className={`block text-xs ${cx.muted}`}>{text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold">Rules <span className={`font-normal ${cx.faint}`}>(optional)</span></span>
              <input className={cx.input} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="e.g. Be respectful. No spam." />
            </label>
          </div>
          {error && <div role="alert" className="mt-4 rounded-lg border p-3 text-sm font-medium [border-color:var(--danger)] [background:var(--danger-soft)] [color:var(--danger)]">{error}</div>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [border-color:var(--line)] sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className={cx.ghostBtn}>Cancel</button>
          <button disabled={saving} className={cx.primaryBtn}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} {saving ? "Creating…" : "Create group"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Discovery                                                                 */
/* -------------------------------------------------------------------------- */

function PillGroup({ title, value, onChange, options }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold [color:var(--ink-faint)]">{title}</legend>
      <div role="radiogroup" aria-label={title} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95 ${
                selected ? "[border-color:var(--brand)] [background:var(--brand-soft)] [color:var(--brand-text)]" : "[border-color:var(--line)] [color:var(--ink-soft)] hover:[border-color:var(--brand)]"
              }`}
            >
              {opt.icon && <opt.icon size={13} />} {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterPanel({ view, filters, setFilter, onClear, activeCount, onDone }) {
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Filters</h2>
        {activeCount > 0 && <button onClick={onClear} className="text-xs font-semibold [color:var(--brand-text)] hover:underline">Clear all</button>}
      </div>
      {view === "discover" ? (
        <PillGroup title="Membership" value={filters.membership} onChange={(v) => setFilter("membership", v)} options={[{ value: "all", label: "All" }, { value: "not_joined", label: "Not joined" }, { value: "joined", label: "Joined" }]} />
      ) : (
        <PillGroup title="Your role" value={filters.role} onChange={(v) => setFilter("role", v)} options={[{ value: "all", label: "Any" }, { value: "admin", label: "Owner or admin" }, { value: "member", label: "Member" }]} />
      )}
      <PillGroup title="Privacy" value={filters.privacy} onChange={(v) => setFilter("privacy", v)} options={[{ value: "all", label: "Any" }, { value: "public", label: "Public", icon: Globe }, { value: "private", label: "Private", icon: Lock }]} />
      <PillGroup title="Sort by" value={filters.sort} onChange={(v) => setFilter("sort", v)} options={[{ value: "relevant", label: "Recommended" }, { value: "members", label: "Most members" }, { value: "newest", label: "Newest" }, { value: "name", label: "A–Z" }]} />
      <button onClick={onDone} className={`${cx.primaryBtn} w-full md:hidden`}>Show results</button>
    </div>
  );
}

const GroupCard = memo(function GroupCard({ group, joined, role, pending, joining, onJoin, onCopy }) {
  const isPrivate = group.privacy === "private";
  const href = `/community/${group.id}`;
  return (
    <article className="quad-rise relative flex flex-col rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-lg [border-color:var(--line)] [background:var(--paper-raised)]">
      <div className="relative h-20 pt-10">
        <Link to={href} className="absolute inset-0 rounded-t-2xl" aria-label={`Open ${group.name}`} />
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
          {joined && <RoleBadge role={role} overlay />}
          {isPrivate && <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur" title="Private group"><Lock size={11} /></span>}
        </div>
        <div className="absolute right-2 top-2">
          <Menu
            label="Group options"
            buttonClass="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70 active:scale-95"
            items={[
              { label: "Open group", icon: Users, to: href },
              { label: "Copy link", icon: Copy, onClick: () => onCopy(group) },
            ]}
          />
        </div>
      </div>
      <Link to={href} className="block flex-1 px-4 pb-3 pt-5">
      <div className="mt-[-1.75rem] flex items-start gap-3">
        <div className="-mt-7 mb-3"><GroupAvatar group={group} size="xl" ring /></div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 text-base font-semibold">{group.name}</h2>
        <p className={`mt-1 line-clamp-2 text-sm leading-[1.4rem] ${cx.muted}`}>{group.description}</p>
        <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${cx.faint}`}>
          <span className="rounded-full px-2 py-0.5 font-semibold [background:var(--paper-sunken)] [color:var(--ink-soft)]">{group.category}</span>
          <span className="inline-flex items-center gap-1"><Users size={12} /> {formatCount(group.memberCount || 0)}</span>
        </div>
        </div>
      </div>        
        
      </Link>
      <div className="border-t px-4 py-3 [border-color:var(--line)]">
        {joined ? (
          <Link to={href} className={`${cx.softBtn} w-full`}><CheckCircle2 size={16} /> Open</Link>
        ) : pending ? (
          <button disabled className={`${cx.ghostBtn} w-full`}><Clock size={16} /> Request sent</button>
        ) : (
          <button onClick={() => onJoin(group)} disabled={joining} className={`${cx.primaryBtn} w-full`}>
            {joining ? <Loader2 className="animate-spin" size={16} /> : isPrivate ? <Lock size={15} /> : <Plus size={16} />}
            {isPrivate ? "Request to join" : "Join group"}
          </button>
        )}
      </div>
    </article>
  );
});

function CategoryChips({ value, onChange }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist" aria-label="Categories">
      {CATEGORIES.map((item) => {
        const active = value === item;
        return (
          <button
            key={item}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item)}
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
              active ? "[background:var(--brand)] [color:var(--on-brand)]" : "border [border-color:var(--line)] [background:var(--paper-raised)] [color:var(--ink-soft)] hover:[border-color:var(--brand)]"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

function GroupDiscovery() {
  const { user } = useContext(AuthContext);
  const uid = user?.uid;
  const navigate = useNavigate();
  const { items: toasts, push, dismiss } = useToasts();

  const firstList = listCache.get("|All");
  const [profile, setProfile] = useState({});
  const [joined, setJoined] = useState(() => (joinedCache.uid === uid ? joinedCache.map : new Map()));
  const [joinedReady, setJoinedReady] = useState(() => joinedCache.uid === uid && joinedCache.ok);
  const [view, setView] = useState("discover");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [term, setTerm] = useState("");
  const [groups, setGroups] = useState(() => (fresh(firstList) ? firstList.groups : []));
  const [hasMore, setHasMore] = useState(() => (fresh(firstList) ? firstList.hasMore : false));
  const [loading, setLoading] = useState(() => !fresh(firstList));
  const [error, setError] = useState("");
  const [mine, setMine] = useState([]);
  const [mineLoading, setMineLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState(() => new Set(pendingJoin));
  const [joiningId, setJoiningId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const cursorRef = useRef(fresh(firstList) ? firstList.cursor : null);
  const keyRef = useRef(fresh(firstList) ? "|All" : "");
  const groupsRef = useRef(groups);
  const reqRef = useRef(0);

  const setFilter = useCallback((key, value) => setFilters((cur) => ({ ...cur, [key]: value })), []);
  const clearFilters = () => setFilters((cur) => ({ ...DEFAULT_FILTERS, category: cur.category }));

  // Debounce the search box; the server is only asked when the query really changes.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(searchInput.trim()), 320);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    loadProfile(user).then((p) => !cancelled && setProfile(p)).catch(() => {});
    loadJoined(uid).then((m) => {
      if (cancelled) return;
      setJoined(m);
      setJoinedReady(true);
    });
    return () => { cancelled = true; };
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async ({ key, searchTerm, category, reset }) => {
    const req = ++reqRef.current;
    setLoading(true);
    setError("");
    try {
      const result = await listGroups({ search: searchTerm, category, cursor: reset ? null : cursorRef.current });
      if (req !== reqRef.current) return;
      result.groups.forEach((g) => groupCache.set(g.id, { at: Date.now(), data: g }));
      const base = reset ? [] : groupsRef.current;
      const seen = new Set(base.map((g) => g.id));
      const next = [...base, ...result.groups.filter((g) => !seen.has(g.id))];
      groupsRef.current = next;
      cursorRef.current = result.cursor;
      listCache.set(key, { at: Date.now(), groups: next, cursor: result.cursor, hasMore: result.hasMore });
      setGroups(next);
      setHasMore(result.hasMore);
    } catch (err) {
      if (req === reqRef.current) setError(err?.message || "Could not load groups.");
    } finally {
      if (req === reqRef.current) setLoading(false);
    }
  }, []);

  const key = `${term}|${filters.category}`;
  useEffect(() => {
    if (view !== "discover" || keyRef.current === key) return;
    keyRef.current = key;
    const cached = listCache.get(key);
    if (fresh(cached)) {
      groupsRef.current = cached.groups;
      cursorRef.current = cached.cursor;
      setGroups(cached.groups);
      setHasMore(cached.hasMore);
      setLoading(false);
      setError("");
      return;
    }
    groupsRef.current = [];
    load({ key, searchTerm: term, category: filters.category, reset: true });
  }, [view, key, term, filters.category, load]);

  // "Joined": reuse cached group docs and read only the ones we do not have.
  const joinedKey = useMemo(() => Array.from(joined.keys()).sort().join(","), [joined]);
  useEffect(() => {
    if (view !== "mine") return undefined;
    const ids = joinedKey ? joinedKey.split(",").slice(0, 60) : [];
    if (!ids.length) {
      setMine([]);
      setMineLoading(false);
      return undefined;
    }
    const have = ids.map((id) => groupCache.get(id)).map((entry) => (fresh(entry, LONG_TTL) ? entry.data : null));
    setMine(have.filter(Boolean));
    const missing = ids.filter((_, i) => !have[i]);
    if (!missing.length) {
      setMineLoading(false);
      return undefined;
    }
    let cancelled = false;
    setMineLoading(true);
    Promise.all(
      missing.map(async (id) => {
        try {
          const g = await getGroup(id);
          if (g) groupCache.set(id, { at: Date.now(), data: { ...g, id } });
          return g ? { ...g, id } : null;
        } catch {
          return null;
        }
      })
    ).then((list) => {
      if (cancelled) return;
      setMine([...have.filter(Boolean), ...list.filter(Boolean)]);
      setMineLoading(false);
    });
    return () => { cancelled = true; };
  }, [view, joinedKey]);

  const bumpCount = (id, delta) => {
    bumpGroup(id, delta);
    const next = groupsRef.current.map((g) => (g.id === id ? { ...g, memberCount: Math.max(0, (g.memberCount || 0) + delta) } : g));
    groupsRef.current = next;
    setGroups(next);
  };

  // Public groups join instantly (optimistic) and roll back if the server refuses.
  const handleJoin = useCallback(
    async (group) => {
      if (!uid) return;
      const isPrivate = group.privacy === "private";
      setJoiningId(group.id);
      if (!isPrivate) {
        markJoined(uid, group.id, "member");
        setJoined(new Map(joinedCache.map));
        bumpCount(group.id, 1);
      }
      try {
        const p = Object.keys(profile).length ? profile : await loadProfile(user);
        if (isPrivate) {
          await requestJoinGroup(group, user, p);
          pendingJoin.add(group.id);
          setPendingIds(new Set(pendingJoin));
          push(`Request sent to ${group.name}. We'll notify you once it's approved.`, { tone: "success" });
        } else {
          await joinPublicGroup(group, user, p);
          push(`You joined ${group.name}.`, { tone: "success", action: { label: "Open", to: `/community/${group.id}` } });
        }
      } catch (err) {
        if (!isPrivate) {
          markLeft(uid, group.id);
          setJoined(new Map(joinedCache.map));
          bumpCount(group.id, -1);
        }
        push(err?.message || "Could not complete that. Try again.", { tone: "error" });
      } finally {
        setJoiningId("");
      }
    },
    [uid, profile, user, push] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const copyLink = useCallback(
    async (group) => {
      try {
        await navigator.clipboard.writeText(groupLink(group.id));
        push("Group link copied.", { tone: "success" });
      } catch {
        push("Could not copy the link.", { tone: "error" });
      }
    },
    [push]
  );

  const visible = useMemo(() => {
    const isMine = view === "mine";
    const q = searchInput.trim().toLowerCase();
    const base = (isMine ? mine : groups).filter((g) => {
      if (isMine && q && !(g.name || "").toLowerCase().includes(q) && !(g.description || "").toLowerCase().includes(q)) return false;
      if (filters.category !== "All" && g.category !== filters.category) return false;
      if (filters.privacy !== "all" && (g.privacy || "public") !== filters.privacy) return false;
      if (isMine) {
        if (filters.role !== "all") {
          const r = joined.get(g.id)?.role || "member";
          if (filters.role === "admin" ? !(r === "owner" || r === "admin") : r !== "member") return false;
        }
      } else {
        const isJoined = joined.has(g.id);
        if (filters.membership === "joined" && !isJoined) return false;
        if (filters.membership === "not_joined" && isJoined) return false;
      }
      return true;
    });
    const sorted = [...base];
    if (filters.sort === "members") sorted.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    else if (filters.sort === "newest") sorted.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
    else if (filters.sort === "name") sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return sorted;
  }, [view, mine, groups, joined, filters, searchInput]);

  const activeCount =
    (filters.privacy !== "all" ? 1 : 0) +
    (view === "discover" ? (filters.membership !== "all" ? 1 : 0) : filters.role !== "all" ? 1 : 0) +
    (filters.sort !== "relevant" ? 1 : 0);

  const activeChips = [
    filters.privacy !== "all" && { key: "privacy", label: filters.privacy === "public" ? "Public" : "Private", reset: "all" },
    view === "discover" && filters.membership !== "all" && { key: "membership", label: filters.membership === "joined" ? "Joined" : "Not joined", reset: "all" },
    view === "mine" && filters.role !== "all" && { key: "role", label: filters.role === "admin" ? "Owner or admin" : "Member", reset: "all" },
    filters.sort !== "relevant" && { key: "sort", label: `Sort: ${filters.sort}`, reset: "relevant" },
  ].filter(Boolean);

  const showSkeleton = view === "discover" ? loading && groups.length === 0 : !joinedReady || (mineLoading && mine.length === 0);

  return (
    <div className="md:mt-16">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Groups</h1>
            <p className={`mt-1 max-w-xl text-sm leading-6 ${cx.muted}`}>Join classmates and clubs, and keep everything for a class in one place.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => setCreateOpen(true)} className={`${cx.primaryBtn} hidden sm:inline-flex`}><Plus size={17} /> Create group</button>
            <Menu
              label="Groups options"
              items={[
                { label: "Messages", icon: MessageCircle, to: "/messages" },
                { label: "Notifications", icon: Bell, to: "/notifications" },
                { label: "Messaging settings", icon: Settings, to: "/community-settings" },
              ]}
            />
          </div>
        </header>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="inline-flex shrink-0 rounded-xl border p-1 [border-color:var(--line)] [background:var(--paper-raised)]" role="tablist" aria-label="Group views">
            {[
              { key: "discover", label: "Discover", icon: Compass },
              { key: "mine", label: `Joined${joined.size ? ` (${joined.size})` : ""}`, icon: Users },
            ].map(({ key: k, label, icon: Icon }) => (
              <button
                key={k}
                role="tab"
                aria-selected={view === k}
                onClick={() => setView(k)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${view === k ? "[background:var(--brand)] [color:var(--on-brand)]" : "[color:var(--ink-soft)] hover:[color:var(--ink)]"}`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 transition [border-color:var(--line)] [background:var(--paper-raised)] focus-within:[border-color:var(--brand)]">
              <Search size={17} className={cx.faint} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={view === "mine" ? "Search your groups" : "Search all groups"}
                aria-label="Search groups"
                className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:[color:var(--ink-faint)]"
              />
              {searchInput && <button onClick={() => setSearchInput("")} className={cx.faint} aria-label="Clear search"><X size={16} /></button>}
            </div>
            <Menu
              label="Filters"
              width="md:w-80"
              buttonClass={`${cx.ghostBtn} relative px-3.5`}
              trigger={
                <>
                  <SlidersHorizontal size={16} /> <span className="hidden sm:inline">Filters</span>
                  {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold [background:var(--brand)] [color:var(--on-brand)]">{activeCount}</span>}
                </>
              }
            >
              {(close) => <FilterPanel view={view} filters={filters} setFilter={setFilter} onClear={clearFilters} activeCount={activeCount} onDone={close} />}
            </Menu>
          </div>
        </div>

        <div className="mt-4"><CategoryChips value={filters.category} onChange={(v) => setFilter("category", v)} /></div>

        <section className="mt-5" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="mr-1 text-sm font-semibold">{showSkeleton ? "Loading…" : `${visible.length} ${visible.length === 1 ? "group" : "groups"}`}</p>
            {activeChips.map((chip) => (
              <button key={chip.key} onClick={() => setFilter(chip.key, chip.reset)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 [background:var(--brand-soft)] [color:var(--brand-text)]" aria-label={`Remove filter ${chip.label}`}>
                {chip.label} <X size={12} />
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium [border-color:var(--danger)] [background:var(--danger-soft)] [color:var(--danger)]">
              {error}
              <button onClick={() => load({ key, searchTerm: term, category: filters.category, reset: true })} className="shrink-0 font-semibold underline">Retry</button>
            </div>
          )}

          {showSkeleton ? (
            <SkeletonCards />
          ) : visible.length === 0 ? (
            view === "mine" && joined.size === 0 ? (
              <EmptyState icon={Users} title="You haven't joined any groups yet" text="Groups you join or create show up here for quick access." action={<button onClick={() => setView("discover")} className={cx.primaryBtn}><Compass size={16} /> Discover groups</button>} />
            ) : (
              <EmptyState
                icon={Search}
                title="No groups match"
                text="Try a different search, or clear your filters."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {(activeCount > 0 || searchInput || filters.category !== "All") && (
                      <button onClick={() => { clearFilters(); setFilter("category", "All"); setSearchInput(""); }} className={cx.ghostBtn}>Clear filters</button>
                    )}
                    <button onClick={() => setCreateOpen(true)} className={cx.primaryBtn}><Plus size={16} /> Start a group</button>
                  </div>
                }
              />
            )
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visible.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  joined={joined.has(group.id)}
                  role={joined.get(group.id)?.role}
                  pending={pendingIds.has(group.id)}
                  joining={joiningId === group.id}
                  onJoin={handleJoin}
                  onCopy={copyLink}
                />
              ))}
            </div>
          )}

          {view === "discover" && hasMore && !showSkeleton && (
            <div className="mt-8 flex justify-center">
              <button onClick={() => load({ key, searchTerm: term, category: filters.category, reset: false })} disabled={loading} className={cx.ghostBtn}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />} {loading ? "Loading…" : "Load more groups"}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Phone shortcut to create a group */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition active:scale-95 hover:brightness-110 sm:hidden [background:var(--brand)] [color:var(--on-brand)]"
        aria-label="Create group"
      >
        <Plus size={24} />
      </button>

      {createOpen && <CreateGroupModal user={user} profile={profile} onClose={() => setCreateOpen(false)} onCreated={(id) => navigate(`/community/${id}`)} />}
      <ToastHost items={toasts} dismiss={dismiss} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Group detail pieces                                                       */
/* -------------------------------------------------------------------------- */

const PostCard = memo(function PostCard({ post, groupId, uid, onDelete, onCopy }) {
  // Reactions update instantly; the live snapshot then confirms (or corrects) them.
  const [override, setOverride] = useState(null);
  useEffect(() => { setOverride(null); }, [post.reactions, post.userReactions]);
  const reactions = override?.reactions || post.reactions || {};
  const mineReaction = override ? override.mine : post.userReactions?.[uid];
  const active = REACTIONS.filter((emoji) => (reactions[emoji] || 0) > 0);

  const react = async (emoji) => {
    const next = { ...reactions };
    if (mineReaction) next[mineReaction] = Math.max(0, (next[mineReaction] || 0) - 1);
    const newMine = mineReaction === emoji ? null : emoji;
    if (newMine) next[newMine] = (next[newMine] || 0) + 1;
    setOverride({ reactions: next, mine: newMine });
    try {
      await reactToPost(groupId, post.id, emoji, uid);
    } catch {
      setOverride(null);
    }
  };

  const isMine = post.authorId === uid;
  return (
    <article className={`quad-rise p-4 sm:p-5 ${cx.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar src={post.authorAvatar} name={post.authorName} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{post.authorName}</p>
            <p className={`text-xs ${cx.faint}`}>{formatShortTime(post.createdAt)}</p>
          </div>
        </div>
        <Menu
          label="Post options"
          buttonClass={cx.plainIcon}
          items={[
            { label: "Copy text", icon: Copy, onClick: () => onCopy(post.text), show: !!post.text },
            { label: "Delete post", icon: Trash2, onClick: () => onDelete(post), danger: true, show: isMine, divider: !!post.text },
          ]}
        />
      </div>
      {post.text && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{post.text}</p>}
      {(post.attachments || []).map((item, index) => <div key={`${post.id}-${index}`} className="mt-3"><AttachmentPreview attachment={item} /></div>)}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {active.map((emoji) => {
          const selected = mineReaction === emoji;
          return (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition active:scale-90 ${
                selected ? "[border-color:var(--brand)] [background:var(--brand-soft)] [color:var(--brand-text)]" : "[border-color:var(--line)] [color:var(--ink-soft)] hover:[border-color:var(--brand)]"
              }`}
            >
              <span>{emoji}</span><span>{reactions[emoji]}</span>
            </button>
          );
        })}
        <Menu
          label="Add reaction"
          align="left"
          width="md:w-auto"
          buttonClass="inline-flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-90 [border-color:var(--line)] [color:var(--ink-soft)] hover:[border-color:var(--brand)]"
          trigger={<Smile size={15} />}
        >
          {(close) => (
            <div className="flex justify-around gap-1 p-2">
              {REACTIONS.map((emoji) => (
                <button key={emoji} onClick={() => { close(); react(emoji); }} className="rounded-xl p-2 text-2xl transition active:scale-90 hover:[background:var(--paper-sunken)] md:text-lg">
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </Menu>
      </div>
    </article>
  );
});

function renderMentions(text) {
  return text.split(/(@[^\s@]+)/g).map((part, i) =>
    i % 2 === 1 ? <span key={i} className="font-semibold underline decoration-dotted underline-offset-2">{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

const ChatMessage = memo(function ChatMessage({ message, mine, grouped, lastInGroup, uid, h }) {
  const poll = message.type === "poll" ? message.poll : null;
  const name = message.senderName || "Student";
  const totalVotes = poll ? new Set(poll.options?.flatMap((option) => option.voterIds || []) || []).size : 0;

  const menu = (
    <Menu
      label="Message options"
      width="md:w-52"
      align={mine ? "right" : "left"}
      buttonClass="mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:[background:var(--paper-sunken)] [@media(hover:none)]:opacity-50"
      items={[
        { label: "Reply", icon: Reply, onClick: () => h.reply(message) },
        { label: "Copy text", icon: Copy, onClick: () => h.copy(message.text), show: !!message.text },
        { label: "Message sender", icon: MessageCircle, onClick: () => h.openDM(message.senderId), show: !mine },
        { label: "Edit poll", icon: Pencil, onClick: () => h.editPoll(message), show: mine && !!poll, divider: true },
        { label: poll?.isClosed ? "Reopen poll" : "Close poll", icon: ListChecks, onClick: () => h.togglePoll(message), show: mine && !!poll },
      ]}
    />
  );

  return (
    <div id={`gm-${message.id}`} className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-3"}`}>
      {!mine && (lastInGroup ? (
        <button onClick={() => h.openDM(message.senderId)} aria-label={`Message ${name}`} className="shrink-0"><UserAvatar src={message.senderAvatar} name={name} /></button>
      ) : <div className="w-9 shrink-0" />)}
      {mine && menu}
      <div className={`min-w-0 max-w-[82%] rounded-2xl px-3.5 py-2 ${mine ? "[background:var(--brand)] [color:var(--on-brand)]" : "border [border-color:var(--line)] [background:var(--paper-sunken)]"} ${lastInGroup ? (mine ? "rounded-br-md" : "rounded-bl-md") : ""}`}>
        {!grouped && !mine && <p className={`text-[11px] font-semibold ${cx.faint}`}>{name}</p>}
        {message.replyTo && (
          <div className={`mt-1 rounded-lg border-l-2 p-2 text-xs ${mine ? "border-white/60 bg-white/10" : "[border-color:var(--brand)] [background:var(--brand-soft)]"}`}>
            <p className="font-semibold opacity-90">{message.replyTo.senderName}</p>
            <p className="mt-0.5 line-clamp-2 opacity-80">{message.replyTo.text}</p>
          </div>
        )}
        {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-6">{renderMentions(message.text)}</p>}
        {poll && (
          <div className="mt-1 min-w-56 sm:min-w-64">
            <p className="text-sm font-bold">{poll.question}</p>
            <div className="mt-2 space-y-2">
              {poll.options.map((option) => {
                const count = option.voterIds?.length || 0;
                const selected = option.voterIds?.includes(uid);
                const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <button
                    key={option.id}
                    disabled={poll.isClosed}
                    onClick={() => h.vote(message, option.id)}
                    className={`relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80 ${mine ? "border-white/30 bg-white/10" : "[border-color:var(--line)] [background:var(--paper-raised)]"}`}
                  >
                    <span className={`absolute inset-y-0 left-0 transition-all ${mine ? "bg-white/15" : "[background:var(--brand-soft)]"}`} style={{ width: `${percent}%` }} />
                    <span className="relative flex justify-between gap-3"><span>{selected ? "✓ " : ""}{option.text}</span><span>{percent}%</span></span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] opacity-75">{totalVotes} {totalVotes === 1 ? "vote" : "votes"} · {poll.multiSelect ? "Multiple answers" : "One answer"}{poll.isClosed ? " · Closed" : ""}</p>
          </div>
        )}
        {(message.attachments || []).map((item, index) => <div key={index} className="mt-2"><AttachmentPreview attachment={item} /></div>)}
        {lastInGroup && <p className={`mt-0.5 text-right text-[10px] font-semibold ${mine ? "opacity-75" : cx.faint}`}>{formatShortTime(message.createdAt)}</p>}
      </div>
      {!mine && menu}
    </div>
  );
});

function GroupChat({ messages, ready, hasOlder, loadingOlder, onLoadOlder, uid, h, members, onMentionIntent, onSend, allowVideo, replyTo, onCancelReply, onCreatePoll }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const bottomRef = useRef(null);
  const stickRef = useRef(true);
  const firstRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const rows = useMemo(() => {
    const out = [];
    let lastDay = "";
    messages.forEach((m, i) => {
      const ms = toMs(m.createdAt);
      const day = ms ? new Date(ms).toDateString() : "";
      let inserted = false;
      if (day && day !== lastDay) {
        out.push({ kind: "day", id: `day-${day}`, label: dayLabel(ms) });
        lastDay = day;
        inserted = true;
      }
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const nextDay = next && toMs(next.createdAt) ? new Date(toMs(next.createdAt)).toDateString() : day;
      out.push({ kind: "msg", message: m, grouped: !!prev && prev.senderId === m.senderId && !inserted, lastInGroup: !next || next.senderId !== m.senderId || nextDay !== day });
    });
    return out;
  }, [messages]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior, block: "end" }));
    setShowJump(false);
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (stickRef.current || last.senderId === uid) scrollToBottom(firstRef.current ? "auto" : "smooth");
    else setShowJump(true);
    firstRef.current = false;
  }, [messages, uid, scrollToBottom]);

  // Images finishing loading grow the list; stay pinned without jumping.
  const hasMessages = messages.length > 0;
  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => { if (stickRef.current) bottomRef.current?.scrollIntoView({ block: "end" }); });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMessages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distance < 120;
    setShowJump((prev) => (prev === distance > 300 ? prev : distance > 300));
  };

  const loadOlder = async () => {
    const el = scrollRef.current;
    const prev = el?.scrollHeight || 0;
    stickRef.current = false;
    await onLoadOlder();
    requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - prev; });
  };

  const send = async (payload) => {
    stickRef.current = true;
    await onSend(payload);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
          {!ready ? (
            <div className={`flex h-full items-center justify-center ${cx.faint}`}><Loader2 className="animate-spin" size={22} /></div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageCircle size={32} className={cx.faint} />
              <p className="mt-3 text-sm font-semibold">No messages yet</p>
              <p className={`mt-1 text-xs ${cx.muted}`}>Say hello to the group.</p>
            </div>
          ) : (
            <div ref={contentRef}>
              {hasOlder && (
                <button onClick={loadOlder} disabled={loadingOlder} className={`mx-auto mb-3 block rounded-full border px-4 py-1.5 text-xs font-semibold disabled:opacity-60 [border-color:var(--line)] ${cx.muted}`}>
                  {loadingOlder ? "Loading…" : "Load older messages"}
                </button>
              )}
              {rows.map((row) =>
                row.kind === "day" ? (
                  <div key={row.id} className="flex justify-center pb-1 pt-4">
                    <span className="rounded-full px-3 py-1 text-[11px] font-semibold [background:var(--paper-sunken)] [color:var(--ink-faint)]">{row.label}</span>
                  </div>
                ) : (
                  <ChatMessage key={row.message.id} message={row.message} mine={row.message.senderId === uid} grouped={row.grouped} lastInGroup={row.lastInGroup} uid={uid} h={h} />
                )
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        {showJump && (
          <button onClick={() => { stickRef.current = true; scrollToBottom("smooth"); }} className="quad-pop absolute bottom-3 right-4 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg [border-color:var(--line)] [background:var(--paper-raised)]" aria-label="Jump to latest message">
            <ChevronDown size={18} />
          </button>
        )}
      </div>
      <Composer
        placeholder="Message the group. Type @ to mention."
        onSend={send}
        allowVideo={allowVideo}
        replyTo={replyTo}
        onCancelReply={onCancelReply}
        mentionMembers={members}
        onMentionIntent={onMentionIntent}
        enterToSend
        extraItems={[{ label: "Create poll", icon: ListChecks, onClick: onCreatePoll }]}
      />
    </div>
  );
}

function PollBuilderModal({ poll, onClose, onSave }) {
  const [question, setQuestion] = useState(poll?.question || "");
  const [options, setOptions] = useState(poll?.options?.map((item) => item.text) || ["", ""]);
  const [multiSelect, setMultiSelect] = useState(Boolean(poll?.multiSelect));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) return setError("Add a question.");
    if (cleaned.length < 2) return setError("Add at least two options.");
    setSaving(true);
    setError("");
    try {
      await onSave({ question: question.trim(), options: cleaned, multiSelect });
      onClose();
    } catch (err) {
      setError(err?.message || "Could not save the poll.");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} label={poll ? "Edit poll" : "Create a poll"} size="sm:max-w-lg" locked={saving}>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b p-5 [border-color:var(--line)]">
          <div>
            <h2 className="text-lg font-bold">{poll ? "Edit poll" : "Create a poll"}</h2>
            <p className={`mt-0.5 text-xs ${cx.muted}`}>Set up a decision your group can vote on.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className={cx.ghostIcon} aria-label="Close"><X size={17} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <label className="block text-xs font-semibold">
            Question
            <textarea className={`mt-2 ${cx.input}`} rows={3} value={question} maxLength={220} onChange={(e) => setQuestion(e.target.value)} placeholder="What should the group decide?" />
          </label>
          <div className="mt-4 space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input className={cx.input} value={option} maxLength={100} onChange={(e) => setOptions((items) => items.map((item, i) => (i === index ? e.target.value : item)))} placeholder={`Option ${index + 1}`} />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions((items) => items.filter((_, i) => i !== index))} className="inline-flex h-[46px] w-11 shrink-0 items-center justify-center rounded-xl [color:var(--danger)] hover:[background:var(--danger-soft)]" aria-label={`Remove option ${index + 1}`}><X size={16} /></button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && <button type="button" onClick={() => setOptions((items) => [...items, ""])} className="mt-3 text-xs font-semibold [color:var(--brand-text)]">+ Add option</button>}
          <label className={`mt-5 flex cursor-pointer items-center justify-between gap-3 p-3 ${cx.soft}`}>
            <span>
              <span className="block text-sm font-semibold">Allow multiple answers</span>
              <span className={`block text-xs ${cx.muted}`}>Members can pick more than one option.</span>
            </span>
            <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={multiSelect} onChange={(e) => setMultiSelect(e.target.checked)} />
          </label>
          {error && <div role="alert" className="mt-4 rounded-lg p-2.5 text-xs font-medium [background:var(--danger-soft)] [color:var(--danger)]">{error}</div>}
        </div>
        <div className="border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [border-color:var(--line)]">
          <button disabled={saving} className={`${cx.primaryBtn} w-full`}>{saving ? <Loader2 className="animate-spin" size={16} /> : null} {saving ? "Saving…" : poll ? "Save poll" : "Post poll"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Group detail                                                              */
/* -------------------------------------------------------------------------- */

function GroupDetail({ groupId }) {
  const { user } = useContext(AuthContext);
  const uid = user?.uid;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: toasts, push, dismiss } = useToasts();

  // Cache-first: opening a group you just saw in the list costs zero reads.
  const cachedGroup = groupCache.get(groupId);
  const initialMembership = cachedMembership(uid, groupId);
  const [profile, setProfile] = useState(() => profileCache.get(uid)?.data || {});
  const [group, setGroup] = useState(() => cachedGroup?.data || null);
  const [membership, setMembership] = useState(initialMembership); // undefined = unknown, null = not a member
  const [pending, setPending] = useState(() => pendingJoin.has(groupId));
  const [loading, setLoading] = useState(() => !cachedGroup || initialMembership === undefined);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const [posts, setPosts] = useState([]);
  const [postsReady, setPostsReady] = useState(false);
  const [postLimit, setPostLimit] = useState(POSTS_PAGE);
  const [composeOpen, setComposeOpen] = useState(false);
  const [libraryView, setLibraryView] = useState("media");

  const [liveMessages, setLiveMessages] = useState([]);
  const [olderMessages, setOlderMessages] = useState([]);
  const [chatReady, setChatReady] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [chatUnread, setChatUnread] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [pollBuilder, setPollBuilder] = useState(null);

  const [members, setMembers] = useState(() => membersCache.get(groupId)?.members || []);
  const [membersReady, setMembersReady] = useState(() => !!membersCache.get(groupId));
  const [memberSearch, setMemberSearch] = useState("");
  const [requests, setRequests] = useState(() => requestsCache.get(groupId)?.requests || []);
  const [confirm, setConfirm] = useState(null);

  // Sticky flags: a listener stays on for the whole visit once started, so tab switching never re-reads.
  const [postsOn, setPostsOn] = useState(false);
  const [chatOn, setChatOn] = useState(false);

  const olderCursorRef = useRef(null);
  const olderLoadedRef = useRef(false);
  const membersLoadingRef = useRef(false);
  const lastChatIdRef = useRef("");
  const tabRef = useRef("Feed");

  const isMember = Boolean(membership);
  const canManage = membership?.role === "owner" || membership?.role === "admin" || group?.ownerId === uid;
  const isPremium = profile?.plan === "premium" || profile?.premium === true;

  const rawTab = searchParams.get("tab");
  const wanted = TAB_ALIASES[rawTab] || rawTab;
  const tab = isMember && TAB_KEYS.includes(wanted) ? wanted : isMember ? "Feed" : "About";
  tabRef.current = tab;
  const setTab = useCallback((key) => setSearchParams(key === "Feed" ? {} : { tab: key }, { replace: true }), [setSearchParams]);

  /* ----------------------------- Data loading ------------------------------ */

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const cg = groupCache.get(groupId);
        const needGroup = !fresh(cg);
        const cm = cachedMembership(uid, groupId);
        const [groupData, profileData, membershipData] = await Promise.all([
          needGroup ? getGroup(groupId) : cg.data,
          loadProfile(user),
          cm !== undefined ? cm : getMembership(groupId, uid),
        ]);
        if (cancelled) return;
        if (groupData) {
          const withId = { ...groupData, id: groupId };
          if (needGroup) groupCache.set(groupId, { at: Date.now(), data: withId });
          setGroup(withId);
        } else {
          setGroup(null);
        }
        setProfile(profileData || {});
        setMembership(membershipData || null);
        if (membershipData) markJoined(uid, groupId, membershipData.role || "member");
        setLoading(false);

        // One request check per private group per session.
        if (groupData?.privacy === "private" && !membershipData && !pendingChecked.has(groupId)) {
          pendingChecked.add(groupId);
          const snap = await getDocs(query(collection(db, "groups", groupId, "joinRequests"), where("uid", "==", uid), limit(1)));
          if (!snap.empty) pendingJoin.add(groupId);
          if (!cancelled) setPending(pendingJoin.has(groupId));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.message || "Could not load this group.");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [groupId, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start listeners lazily, then keep them for the visit.
  useEffect(() => {
    if (!isMember) return;
    if (tab === "Feed" || tab === "Library") setPostsOn(true);
    if (tab === "Chat") setChatOn(true);
  }, [isMember, tab]);

  useEffect(() => {
    if (!postsOn || !isMember) return undefined;
    return listenGroupPosts(groupId, (items) => {
      setPosts(items);
      setPostsReady(true);
    });
  }, [groupId, postsOn, isMember]);

  useEffect(() => {
    if (!chatOn || !isMember) return undefined;
    olderLoadedRef.current = false;
    olderCursorRef.current = null;
    return listenGroupMessages(groupId, (items, cursor) => {
      setLiveMessages(items);
      setChatReady(true);
      if (!olderLoadedRef.current) {
        olderCursorRef.current = cursor || null;
        setHasOlder(Boolean(cursor));
      }
      const newest = items[items.length - 1];
      if (newest && lastChatIdRef.current && newest.id !== lastChatIdRef.current && newest.senderId !== uid && tabRef.current !== "Chat") setChatUnread(true);
      if (newest) lastChatIdRef.current = newest.id;
    });
  }, [groupId, chatOn, isMember, uid]);

  useEffect(() => {
    if (tab === "Chat") setChatUnread(false);
  }, [tab]);

  const loadMembers = useCallback(async () => {
    const cached = membersCache.get(groupId);
    if (fresh(cached)) {
      setMembers(cached.members);
      setMembersReady(true);
      return;
    }
    if (membersLoadingRef.current) return;
    membersLoadingRef.current = true;
    try {
      const snap = await getDocs(query(collection(db, "groups", groupId, "members"), orderBy("joinedAt", "desc"), limit(50)));
      const list = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      membersCache.set(groupId, { at: Date.now(), members: list });
      setMembers(list);
      setMembersReady(true);
    } catch {
      /* try again next time */
    } finally {
      membersLoadingRef.current = false;
    }
  }, [groupId]);

  // Members are only read when the Members tab opens or someone types "@".
  useEffect(() => {
    if (isMember && tab === "Members") loadMembers();
  }, [isMember, tab, loadMembers]);

  // Join requests: managers of private groups only, once (cached).
  useEffect(() => {
    if (!canManage || group?.privacy !== "private") return;
    const cached = requestsCache.get(groupId);
    if (fresh(cached)) {
      setRequests(cached.requests);
      return;
    }
    getDocs(query(collection(db, "groups", groupId, "joinRequests"), orderBy("requestedAt", "desc"), limit(30)))
      .then((snap) => {
        const list = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
        requestsCache.set(groupId, { at: Date.now(), requests: list });
        setRequests(list);
      })
      .catch(() => {});
  }, [canManage, group?.privacy, groupId]);

  const messages = useMemo(() => {
    const map = new Map();
    [...olderMessages, ...liveMessages].forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [olderMessages, liveMessages]);

  const loadOlder = useCallback(async () => {
    if (!olderCursorRef.current || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await loadOlderGroupMessages(groupId, olderCursorRef.current);
      olderLoadedRef.current = true;
      olderCursorRef.current = res.cursor || null;
      setHasOlder(Boolean(res.cursor) && res.messages.length > 0);
      setOlderMessages((cur) => [...res.messages, ...cur]);
    } catch {
      push("Could not load older messages.", { tone: "error" });
    } finally {
      setLoadingOlder(false);
    }
  }, [groupId, loadingOlder, push]);

  /* -------------------------------- Actions -------------------------------- */

  const join = async () => {
    if (!group || busy) return;
    const isPrivate = group.privacy === "private";
    setBusy(true);
    if (!isPrivate) {
      // Optimistic: unlock the group immediately, roll back on failure.
      markJoined(uid, groupId, "member");
      setMembership({ role: "member" });
      setGroup((g) => ({ ...g, memberCount: (g.memberCount || 0) + 1 }));
      bumpGroup(groupId, 1);
    }
    try {
      if (isPrivate) {
        await requestJoinGroup(group, user, profile);
        pendingJoin.add(groupId);
        setPending(true);
        push("Request sent. We'll notify you when an admin approves it.", { tone: "success" });
      } else {
        await joinPublicGroup(group, user, profile);
        membersCache.delete(groupId);
        push(`Welcome to ${group.name}.`, { tone: "success" });
      }
    } catch (err) {
      if (!isPrivate) {
        markLeft(uid, groupId);
        setMembership(null);
        setGroup((g) => ({ ...g, memberCount: Math.max(0, (g.memberCount || 1) - 1) }));
        bumpGroup(groupId, -1);
      }
      push(err?.message || "Could not join this group.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    try {
      await leaveGroup(group, uid);
      markLeft(uid, groupId);
      membersCache.delete(groupId);
      setMembership(null);
      setGroup((g) => ({ ...g, memberCount: Math.max(0, (g.memberCount || 1) - 1) }));
      bumpGroup(groupId, -1);
      setPostsOn(false);
      setChatOn(false);
      setPosts([]);
      setLiveMessages([]);
      setOlderMessages([]);
      push(`You left ${group.name}.`);
    } catch (err) {
      push(err?.message || "Could not leave the group.", { tone: "error" });
    }
  };

  const sendPost = (payload) => createPost(groupId, user, profile, payload);
  const sendChat = (payload) => sendGroupMessage(groupId, user, profile, payload);

  const openDirectMessage = useCallback(
    (targetUid) => {
      if (!targetUid || targetUid === uid) return;
      navigate(`/messages?user=${encodeURIComponent(targetUid)}`);
    },
    [navigate, uid]
  );

  const copyText = useCallback(
    async (value, okMessage = "Copied to clipboard.") => {
      try {
        await navigator.clipboard.writeText(value);
        push(okMessage, { tone: "success" });
      } catch {
        push("Could not copy.", { tone: "error" });
      }
    },
    [push]
  );

  const savePoll = async (input) => {
    try {
      if (pollBuilder?.id) await editGroupPoll(groupId, pollBuilder.id, uid, input);
      else await createGroupPoll(groupId, user, profile, input);
    } catch (err) {
      push(err?.message || "Could not save the poll.", { tone: "error" });
      throw err;
    }
  };

  // Stable handler bag so chat rows are not re-rendered by unrelated state.
  const chatHandlers = useMemo(
    () => ({
      reply: setReplyTo,
      copy: (value) => copyText(value),
      openDM: openDirectMessage,
      editPoll: (message) => setPollBuilder(message),
      togglePoll: async (message) => {
        try {
          await setGroupPollClosed(groupId, message.id, uid, !message.poll?.isClosed);
        } catch (err) {
          push(err?.message || "Could not update the poll.", { tone: "error" });
        }
      },
      vote: async (message, optionId) => {
        try {
          await voteGroupPoll(groupId, message.id, optionId, uid);
        } catch (err) {
          push(err?.message || "Could not record your vote.", { tone: "error" });
        }
      },
    }),
    [copyText, openDirectMessage, groupId, uid, push]
  );

  const askDeletePost = useCallback(
    (post) =>
      setConfirm({
        title: "Delete this post?",
        body: "It will be removed for everyone in the group. This can't be undone.",
        confirmLabel: "Delete",
        danger: true,
        onConfirm: async () => {
          try {
            await deleteOwnPost(groupId, post.id);
          } catch (err) {
            push(err?.message || "Could not delete the post.", { tone: "error" });
          }
        },
      }),
    [groupId, push]
  );

  const decideRequest = async (request, approve) => {
    setRequests((items) => items.filter((i) => i.id !== request.id));
    requestsCache.delete(groupId);
    try {
      if (approve) {
        await approveJoinRequest(group, request);
        const added = { id: request.uid || request.id, name: request.name, avatar: request.avatar || request.photo || "", role: "member" };
        const next = [added, ...members.filter((m) => m.id !== added.id)];
        setMembers(next);
        membersCache.set(groupId, { at: Date.now(), members: next });
        setGroup((g) => ({ ...g, memberCount: (g.memberCount || 0) + 1 }));
        bumpGroup(groupId, 1);
        push(`${request.name} was approved.`, { tone: "success" });
      } else {
        await rejectJoinRequest(group, request);
      }
    } catch (err) {
      setRequests((items) => [request, ...items]);
      push(err?.message || "Could not update the request.", { tone: "error" });
    }
  };

  const mediaItems = useMemo(() => posts.flatMap((p) => (p.attachments || []).filter((i) => i.type === "image" || i.type === "video")), [posts]);
  const fileItems = useMemo(() => posts.flatMap((p) => (p.attachments || []).filter((i) => i.type === "pdf" || i.type === "document")), [posts]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const list = q ? members.filter((m) => (m.name || "").toLowerCase().includes(q)) : members;
    const rank = { owner: 0, admin: 1 };
    return [...list].sort((a, b) => (rank[a.role] ?? 2) - (rank[b.role] ?? 2));
  }, [members, memberSearch]);

  const mentionable = useMemo(() => members.filter((m) => m.id !== uid), [members, uid]);

  /* --------------------------------- Render -------------------------------- */

  if (loading) {
    return (
      <div className="md:mt-16">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className={`h-14 animate-pulse ${cx.soft}`} />
          <div className="mt-4"><SkeletonCards count={3} /></div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="md:mt-16">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <EmptyState
            icon={Users}
            title={loadError ? "Could not load this group" : "Group not found"}
            text={loadError || "This group may have been deleted or the link is incorrect."}
            action={<Link to="/community" className={cx.primaryBtn}>Browse groups</Link>}
          />
        </div>
      </div>
    );
  }

  const chatMode = isMember && tab === "Chat";
  const isPrivate = group.privacy === "private";

  const headerMenuItems = [
    { label: "Copy group link", icon: Copy, onClick: () => copyText(groupLink(groupId), "Group link copied.") },
    { label: "Join requests", icon: Users, onClick: () => setTab("Members"), badge: requests.length || 0, show: canManage && requests.length > 0 },
    { label: "Manage group", icon: ShieldCheck, to: `/community/${groupId}/manage`, show: canManage },
    { label: "Direct messages", icon: MessageCircle, to: "/messages", show: isMember },
    { label: "Messaging settings", icon: Settings, to: "/community-settings", show: isMember },
    {
      label: "Leave group",
      icon: UserMinus,
      danger: true,
      divider: true,
      show: isMember && membership?.role !== "owner",
      onClick: () =>
        setConfirm({
          title: `Leave ${group.name}?`,
          body: "You'll lose access to its posts and chat. You can rejoin later if the group allows it.",
          confirmLabel: "Leave group",
          danger: true,
          onConfirm: leave,
        }),
    },
  ];

  const joinButton = (full = false) => (
    <button onClick={join} disabled={busy || pending} className={`${cx.primaryBtn} ${full ? "w-full" : "h-10 px-3.5"}`}>
      {busy ? <Loader2 className="animate-spin" size={16} /> : pending ? <Clock size={16} /> : isPrivate ? <Lock size={15} /> : <Plus size={16} />}
      <span>{pending ? "Request sent" : isPrivate ? "Request to join" : "Join group"}</span>
    </button>
  );

  const aboutBlock = (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">About</h2>
        <p className={`mt-2 whitespace-pre-wrap text-sm leading-7 ${cx.muted}`}>{group.description}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold">Rules</h3>
        <p className={`mt-2 text-sm leading-7 ${cx.muted}`}>{group.rules || "No rules added yet."}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        {[
          { label: "Category", value: group.category },
          { label: "Privacy", value: group.privacy || "public", cap: true },
          { label: "Created", value: formatShortTime(group.createdAt) },
          { label: "Members", value: group.memberCount || 0 },
          { label: "Posts", value: group.postCount || 0 },
          { label: "Files", value: group.fileCount || 0 },
        ].map((item) => (
          <div key={item.label} className={`p-3 ${cx.soft}`}>
            <dt className={`text-xs ${cx.faint}`}>{item.label}</dt>
            <dd className={`mt-0.5 font-semibold ${item.cap ? "capitalize" : ""}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const tabBadge = (key) => {
    if (key === "Chat" && chatUnread) return <span className="h-2 w-2 rounded-full [background:var(--brand)]" aria-label="New messages" />;
    if (key === "Members" && canManage && requests.length > 0) return <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold [background:var(--danger)] text-white">{requests.length}</span>;
    return null;
  };

  return (
    <div className={`md:mt-16 ${chatMode ? "flex h-[100dvh] flex-col md:h-[calc(100dvh-4rem)]" : ""}`}>
      {/* Compact header + tabs */}
      <header className={`z-30 border-b [border-color:var(--line)] [background:var(--paper-raised)] ${chatMode ? "shrink-0" : "sticky top-0 md:top-16"}`}>
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-2 py-2 md:px-6">
          <Link to="/community" className={cx.plainIcon} aria-label="All groups" title="All groups"><ChevronLeft size={20} /></Link>
          <GroupAvatar group={group} size="sm" className="!rounded-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 text-sm font-bold sm:text-base">
              <span className="truncate">{group.name}</span>
              {isPrivate && <Lock size={12} className={`shrink-0 ${cx.faint}`} aria-label="Private group" />}
            </h1>
            <p className={`truncate text-xs ${cx.muted}`}>
              {formatCount(group.memberCount || 0)} {group.memberCount === 1 ? "member" : "members"} · {group.category}
              {isMember && membership?.role && membership.role !== "member" ? ` · ${membership.role === "owner" ? "Owner" : "Admin"}` : ""}
            </p>
          </div>
          {!isMember && <div className="hidden sm:block">{joinButton()}</div>}
          <Menu label="Group options" items={headerMenuItems} buttonClass={cx.plainIcon} />
        </div>

        {isMember && (
          <nav className="no-scrollbar mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 md:px-6" role="tablist" aria-label="Group sections">
            {TAB_KEYS.map((key) => {
              const Icon = TAB_ICONS[key];
              const active = tab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3.5 text-sm font-semibold transition ${
                    active ? "[border-color:var(--brand)] [color:var(--brand-text)]" : "border-transparent [color:var(--ink-soft)] hover:[color:var(--ink)]"
                  }`}
                >
                  <Icon size={15} /> {key} {tabBadge(key)}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {chatMode ? (
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col md:px-6 md:py-3">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-x-0 md:rounded-2xl md:border [border-color:var(--line)] [background:var(--paper-raised)]">
            <GroupChat
              messages={messages}
              ready={chatReady}
              hasOlder={hasOlder}
              loadingOlder={loadingOlder}
              onLoadOlder={loadOlder}
              uid={uid}
              h={chatHandlers}
              members={mentionable}
              onMentionIntent={loadMembers}
              onSend={sendChat}
              allowVideo={isPremium}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onCreatePoll={() => setPollBuilder({})}
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-3 pb-24 pt-4 md:px-6 md:pb-10">
          {!isMember && (
            <>
              <div className={`overflow-hidden ${cx.panel}`}>
                <div className="h-24 sm:h-32"><CoverPattern group={group} /></div>
                <div className="p-4 sm:p-5">{aboutBlock}</div>
              </div>
              <div className={`mt-4 p-5 text-center ${cx.panel}`}>
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl [background:var(--brand-soft)] [color:var(--brand-text)]">
                  {isPrivate ? <Lock size={20} /> : <Users size={20} />}
                </div>
                <h2 className="mt-3 text-sm font-semibold">{isPrivate ? "This is a private group" : "Join to take part"}</h2>
                <p className={`mx-auto mt-1 max-w-md text-xs leading-5 ${cx.muted}`}>
                  {pending
                    ? "Your request is waiting for an admin. You'll get a notification once it's approved."
                    : isPrivate
                      ? "Request access and an admin will review it. Posts, chat and files unlock after you're approved."
                      : "Join to see posts, chat with members, and share files."}
                </p>
                <div className="mx-auto mt-4 max-w-xs">{joinButton(true)}</div>
              </div>
            </>
          )}

          {isMember && tab === "Feed" && (
            <div className="space-y-4">
              {composeOpen ? (
                <Composer variant="post" placeholder="Share an update, question, or study resource…" onSend={sendPost} allowVideo={isPremium} sendLabel="Post" onDone={() => setComposeOpen(false)} autoFocus />
              ) : (
                <button onClick={() => setComposeOpen(true)} className={`flex w-full items-center gap-3 p-3 text-left transition hover:[border-color:var(--brand)] ${cx.panel}`}>
                  <UserAvatar src={profile.photo || user?.photoURL} name={profile.username || user?.displayName || "You"} size="md" />
                  <span className={`flex-1 text-sm ${cx.faint}`}>Share an update, question, or resource…</span>
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold [background:var(--brand-soft)] [color:var(--brand-text)]"><Plus size={14} /> Post</span>
                </button>
              )}
              {!postsReady ? (
                <div className="space-y-4">{[0, 1].map((i) => <div key={i} className={`h-32 animate-pulse ${cx.soft}`} />)}</div>
              ) : posts.length === 0 ? (
                <EmptyState icon={Newspaper} title="No posts yet" text="Be the first to share something helpful with the group." action={!composeOpen && <button onClick={() => setComposeOpen(true)} className={cx.primaryBtn}><Plus size={16} /> Write a post</button>} />
              ) : (
                <>
                  {posts.slice(0, postLimit).map((post) => (
                    <PostCard key={post.id} post={post} groupId={groupId} uid={uid} onDelete={askDeletePost} onCopy={copyText} />
                  ))}
                  {posts.length > postLimit && (
                    <div className="flex justify-center">
                      <button onClick={() => setPostLimit((n) => n + POSTS_PAGE)} className={cx.ghostBtn}><ChevronDown size={16} /> Show more posts</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {isMember && tab === "Members" && (
            <div className="space-y-4">
              {canManage && requests.length > 0 && (
                <div className={`p-4 ${cx.panel}`}>
                  <h2 className="text-sm font-semibold">Join requests ({requests.length})</h2>
                  <div className="mt-3 space-y-2">
                    {requests.map((request) => (
                      <div key={request.id} className={`flex items-center justify-between gap-3 p-3 ${cx.soft}`}>
                        <span className="min-w-0 truncate text-sm font-semibold">{request.name}</span>
                        <div className="flex shrink-0 gap-2">
                          <button onClick={() => decideRequest(request, true)} className={`${cx.primaryBtn} h-9 px-3 text-xs`}><Check size={14} /> Approve</button>
                          <button onClick={() => decideRequest(request, false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 [background:var(--danger-soft)] [color:var(--danger)]" aria-label={`Decline ${request.name}`} title="Decline"><X size={15} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl border px-4 transition [border-color:var(--line)] [background:var(--paper-raised)] focus-within:[border-color:var(--brand)]">
                <Search size={16} className={cx.faint} />
                <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members" aria-label="Search members" className="h-11 w-full bg-transparent text-sm outline-none placeholder:[color:var(--ink-faint)]" />
                {memberSearch && <button onClick={() => setMemberSearch("")} className={cx.faint} aria-label="Clear search"><X size={15} /></button>}
              </div>

              {!membersReady ? (
                <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-[68px] animate-pulse ${cx.soft}`} />)}</div>
              ) : filteredMembers.length === 0 ? (
                <EmptyState icon={Users} title={memberSearch ? "No members match" : "No members to show"} text={memberSearch ? "Try a different name." : "Members will appear here."} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredMembers.map((member) => {
                    const self = member.id === uid;
                    return (
                      <div key={member.id} className={`flex items-center gap-3 p-3 ${cx.panel}`}>
                        <UserAvatar src={member.avatar} name={member.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{member.name}{self && <span className={`ml-1 font-normal ${cx.faint}`}>(you)</span>}</p>
                          <p className={`text-xs capitalize ${cx.muted}`}>{member.role || "member"}</p>
                        </div>
                        {!self && (
                          <Menu
                            label={`Options for ${member.name}`}
                            buttonClass={cx.plainIcon}
                            items={[{ label: "Send message", icon: MessageCircle, onClick: () => openDirectMessage(member.id) }]}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isMember && tab === "Library" && (
            <div className="space-y-4">
              <div className="inline-flex rounded-xl border p-1 [border-color:var(--line)] [background:var(--paper-raised)]" role="tablist" aria-label="Library">
                {[{ key: "media", label: "Photos & videos", icon: ImageIcon }, { key: "files", label: "Files", icon: FileText }].map(({ key, label, icon: Icon }) => (
                  <button key={key} role="tab" aria-selected={libraryView === key} onClick={() => setLibraryView(key)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${libraryView === key ? "[background:var(--brand)] [color:var(--on-brand)]" : "[color:var(--ink-soft)] hover:[color:var(--ink)]"}`}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
              {!postsReady ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className={`aspect-square animate-pulse ${cx.soft}`} />)}</div>
              ) : libraryView === "media" ? (
                mediaItems.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{mediaItems.map((item, i) => <AttachmentPreview key={i} attachment={item} tile />)}</div>
                ) : (
                  <EmptyState icon={ImageIcon} title="No photos or videos yet" text="Media shared in posts will appear here." />
                )
              ) : fileItems.length ? (
                <div className="grid gap-2 sm:grid-cols-2">{fileItems.map((item, i) => <AttachmentPreview key={i} attachment={item} />)}</div>
              ) : (
                <EmptyState icon={FileText} title="No files yet" text="PDFs and documents shared in posts will appear here." />
              )}
            </div>
          )}

          {isMember && tab === "About" && (
            <div className={`overflow-hidden ${cx.panel}`}>
              <div className="h-24 sm:h-32"><CoverPattern group={group} /></div>
              <div className="p-4 sm:p-6">{aboutBlock}</div>
            </div>
          )}
        </div>
      )}

      {/* Phone-only sticky join bar for non-members */}
      {!isMember && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden [border-color:var(--line)] [background:var(--paper-raised)]">
          {joinButton(true)}
        </div>
      )}

      {pollBuilder && <PollBuilderModal poll={pollBuilder.poll} onClose={() => setPollBuilder(null)} onSave={savePoll} />}
      {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
      <ToastHost items={toasts} dismiss={dismiss} />
    </div>
  );
}

export default function Community({ dark = false }) {
  const { groupId } = useParams();
  return <PageChrome dark={dark}>{groupId ? <GroupDetail key={groupId} groupId={groupId} /> : <GroupDiscovery />}</PageChrome>;
}