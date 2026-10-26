import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  FieldPath,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  MoreVertical,
  Pause,
  Paperclip,
  Pencil,
  Play,
  Plus,
  Reply,
  Search,
  Send,
  Settings,
  Smile,
  StickyNote,
  Trash2,
  User2,
  UserCheck,
  UserPlus,
  UserRoundPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { db } from "../../firebase/config";
import { deleteJson, getJson, postJson, uploadFeatureMedia, uploadVoiceMessage } from "../../services/api";
import { AuthContext } from "../context/AuthContext";
import {
  formatShortTime,
  getCurrentUserProfile,
  markConversationRead,
  searchUsers,
  suggestFriends,
  sendDirectMessage,
  startConversation,
} from "../service/communityService";
import {
  listenFriends,
  listenIncomingFriendRequests,
  listenOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "../service/friendshipService";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const TABS = [
  { key: "chats", label: "Chats", icon: MessageCircle },
  { key: "friends", label: "Friends", icon: Users },
  { key: "requests", label: "Requests", icon: UserRoundPlus },
];

const STICKER_TABS = [
  { key: "mine", label: "Mine" },
  { key: "recent", label: "Recent" },
  { key: "favorites", label: "Favorites" },
  { key: "packs", label: "Packs" },
];

const EMOJIS = [
  "😀", "😂", "🤣", "😊", "😍", "🥰", "😎", "🤔", "😅", "😭",
  "😢", "😡", "😴", "🤯", "🙈", "😉", "😇", "🥹", "👍", "👎",
  "🙏", "👏", "🙌", "🤝", "💪", "👀", "🔥", "✨", "🎉", "💯",
  "❤️", "✅", "📚", "✍️", "🎓", "💡", "📌", "☕", "🍕", "🎵",
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const EDIT_WINDOW_MS = 30 * 60 * 1000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const TYPING_STALE_MS = 6000;
const PAGE_SIZE = 25; // newest page is live; older pages load on demand
const CACHE_TTL_MS = 5 * 60 * 1000;
const LONG_CACHE_TTL_MS = 30 * 60 * 1000;

const PANEL_H =
  "h-[calc(100dvh-var(--nav-offset,0px))] sm:h-[calc(100dvh-1.5rem-var(--nav-offset,0px))]";

/* Module-level caches survive remounts, so revisiting Messenger never re-reads the same docs. */
const profileCache = new Map(); // uid -> { at, data }
const userDocCache = new Map(); // uid -> { at, data }
const mutualCache = new Map(); // `${me}:${other}` -> { at, value }
const searchCache = new Map(); // `${me}:${query}` -> { at, list }
const muteCache = new Map(); // `${me}:${conversationId}` -> boolean
const stickerCache = new Map(); // key -> { at, data }
const draftCache = new Map(); // conversationId -> unsent text
const suggestionCache = { uid: "", at: 0, list: [] };
const packsCache = { at: 0, data: null };
const fresh = (entry, ttl = CACHE_TTL_MS) => !!entry && Date.now() - entry.at < ttl;

/* One shared stylesheet for every micro-interaction (all disabled for reduced motion). */
const MOTION_CSS = `
@keyframes mxPop{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}
@keyframes mxFade{from{opacity:0}to{opacity:1}}
@keyframes mxSheet{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes mxSlide{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes mxToast{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}
.mx-pop{animation:mxPop .14s ease-out}
.mx-fade{animation:mxFade .16s ease-out}
.mx-sheet{animation:mxSheet .22s cubic-bezier(.2,.8,.2,1)}
.mx-slide{animation:mxSlide .2s ease-out}
.mx-toast{animation:mxToast .2s ease-out}
@media (min-width:768px){.mx-slide{animation:mxFade .16s ease-out}}
@media (prefers-reduced-motion:reduce){.mx-pop,.mx-fade,.mx-sheet,.mx-slide,.mx-toast{animation:none}}
`;

/* -------------------------------------------------------------------------- */
/*  Theme                                                                     */
/* -------------------------------------------------------------------------- */

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f5f7ff] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
  muted: dark ? "text-slate-400" : "text-slate-500",
  divider: dark ? "border-white/10" : "border-slate-200",
  hover: dark ? "hover:bg-white/10" : "hover:bg-slate-100",
  tabActive: dark ? "bg-indigo-500/20 text-indigo-300" : "bg-white text-indigo-700 shadow-sm",
  tabInactive: dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800",
  menu: dark ? "border-white/10 bg-[#0f1729] text-white" : "border-slate-200 bg-white text-slate-900",
  sheet: dark ? "bg-[#0b1224] text-white border-white/10" : "bg-white text-slate-900 border-slate-200",
  bubble: dark ? "bg-white/[0.08] text-white" : "bg-slate-100 text-slate-900",
  chip: dark ? "bg-white/10" : "bg-white",
  accent: dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-700",
});
const THEME_DARK = theme(true);
const THEME_LIGHT = theme(false);

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0";
const iconBtnBase = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95 ${focusRing}`;

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                              */
/* -------------------------------------------------------------------------- */

// Reactions use the `{ emoji: [userId] }` format shared with mobile; legacy `{ userId: emoji }` still reads.
const normalizeReactions = (reactions) => {
  const out = {};
  Object.entries(reactions || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const ids = value.filter(Boolean);
      if (ids.length) out[key] = [...new Set([...(out[key] || []), ...ids])];
    } else if (typeof value === "string" && value) {
      out[value] = [...new Set([...(out[value] || []), key])];
    }
  });
  return out;
};

const kindFor = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "document";
};

const messagePreview = (message) => {
  if (message?.deleted) return "This message was deleted";
  if (message?.type === "voice") return "Voice message";
  if (message?.type === "sticker") return "Sticker";
  if (message?.text) return message.text.slice(0, 120);
  return message?.attachments?.[0]?.name || "Attachment";
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortVisibleConversations = (items, uid) =>
  items
    .filter((item) => {
      const hiddenAt = toDate(item.deletedFor?.[uid])?.getTime() || 0;
      const updatedAt = toDate(item.updatedAt)?.getTime() || 0;
      return !hiddenAt || updatedAt > hiddenAt;
    })
    .sort((a, b) => (toDate(b.updatedAt)?.getTime() || 0) - (toDate(a.updatedAt)?.getTime() || 0));

const sortMessages = (map) =>
  Array.from(map.values()).sort((a, b) => {
    const ta = toDate(a.createdAt)?.getTime() ?? Infinity; // pending server timestamps sort last
    const tb = toDate(b.createdAt)?.getTime() ?? Infinity;
    return ta === tb ? 0 : ta - tb;
  });

const dayLabel = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const canEditMessage = (message, uid) => {
  if (!message || message.deleted || message.senderId !== uid) return false;
  if (message.type === "sticker" || message.type === "voice" || !message.text) return false;
  const sentAt = toDate(message.createdAt);
  return !!sentAt && Date.now() - sentAt.getTime() <= EDIT_WINDOW_MS;
};

const canDeleteMessage = (message, uid) => {
  if (!message || message.deleted || message.senderId !== uid) return false;
  if (message.type !== "voice") return true;
  const sentAt = toDate(message.createdAt);
  return !!sentAt && Date.now() - sentAt.getTime() <= EDIT_WINDOW_MS;
};

const firstLetter = (name = "Student") => name.trim().charAt(0).toUpperCase() || "S";
const pickAvatar = (obj) => obj?.avatar || obj?.photo || "";
const pickName = (obj) => obj?.username || obj?.name || obj?.email || "Student";
const badgeCount = (n) => (n > 99 ? "99+" : String(n));
const formatVoiceDuration = (seconds = 0) => {
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

async function getUserDoc(id) {
  const cached = userDocCache.get(id);
  if (fresh(cached)) return cached.data;
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return null;
  userDocCache.set(id, { at: Date.now(), data: snap.data() });
  return snap.data();
}

/* -------------------------------------------------------------------------- */
/*  Small shared pieces                                                       */
/* -------------------------------------------------------------------------- */

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

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-base",
  lg: "h-12 w-12 text-lg",
};

const Avatar = memo(function Avatar({ src, name, size = "md", className = "" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 font-extrabold text-white ${SIZES[size]} ${className}`}
      title={name || "Student"}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : firstLetter(name)}
    </div>
  );
});

/**
 * Vertical-ellipsis dropdown. Items: { label, icon, onClick, to, danger, show, divider, toggle: boolean, disabled }.
 * `toggle` renders a switch on the right and keeps the menu open.
 */
function KebabMenu({ dark, items, label = "More options", onOpen, className = "", border = false }) {
  const t = dark ? THEME_DARK : THEME_LIGHT;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const visible = items.filter((item) => item && item.show !== false);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!open) onOpen?.();
          setOpen((value) => !value);
        }}
        className={`${iconBtnBase} ${t.hover} ${border ? `border ${t.divider}` : ""}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div role="menu" className={`mx-pop absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-2xl border py-1 shadow-xl ${t.menu}`}>
          {visible.map((item, index) => {
            const Icon = item.icon;
            const body = (
              <>
                {Icon && <Icon size={16} className="shrink-0 opacity-80" />}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {typeof item.toggle === "boolean" && (
                  <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${item.toggle ? "bg-indigo-600" : "bg-slate-400/60"}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${item.toggle ? "left-[18px]" : "left-0.5"}`} />
                  </span>
                )}
              </>
            );
            const cls = `flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm font-semibold transition-colors disabled:opacity-50 ${
              item.danger ? `text-red-500 ${dark ? "hover:bg-red-500/10" : "hover:bg-red-50"}` : t.hover
            }`;
            return (
              <React.Fragment key={item.label + index}>
                {item.divider && <div className={`my-1 border-t ${t.divider}`} />}
                {item.to ? (
                  <Link role="menuitem" to={item.to} onClick={close} className={cls}>{body}</Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      if (typeof item.toggle !== "boolean") close();
                      item.onClick?.();
                    }}
                    className={cls}
                  >
                    {body}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

const URL_SPLIT = /(https?:\/\/[^\s<]+)/g;
const Linkified = ({ text }) =>
  text.split(URL_SPLIT).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="break-all underline underline-offset-2">
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );

const Attachment = ({ item, onOpen }) => {
  if (item.type === "image" || item.type === "video") {
    const isVideo = item.type === "video";
    return (
      <button
        type="button"
        onClick={() => onOpen?.(item)}
        className="group relative mt-2 block aspect-[4/3] w-full max-w-[22rem] overflow-hidden rounded-xl bg-black/10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label={`View ${isVideo ? "video" : "image"} ${item.name || ""}`.trim()}
      >
        {isVideo ? (
          <video
            src={item.url}
            poster={item.thumbnailUrl || item.thumbnail || undefined}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : (
          <img
            src={item.thumbnailUrl || item.thumbnail || item.url}
            alt={item.name || "Image attachment"}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        )}
        {isVideo && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/25">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/30">
              <Play size={21} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      aria-label={`View ${item.type === "video" ? "video" : "attachment"} ${item.name || ""}`.trim()}
      className="mt-2 flex w-full items-center gap-2 rounded-xl bg-black/10 px-3 py-2.5 text-left text-sm font-bold transition hover:bg-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {item.type === "video" ? <Film size={17} className="shrink-0" /> : <FileText size={17} className="shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{item.name || (item.type === "video" ? "Watch video" : "View attachment")}</span>
      <span className="shrink-0 text-xs font-semibold opacity-70">View</span>
    </button>
  );
};

const VoiceMessage = ({ message, mine }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(Number(message.duration) || 0);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
      // Browsers can reject playback until the user has interacted with the page.
    }
  };

  return (
    <div className="flex min-w-[210px] items-center gap-2 py-1">
      <audio
        ref={audioRef}
        src={message.audioUrl}
        preload="none"
        onLoadedMetadata={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : Number(message.duration) || 0)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button
        type="button"
        onClick={togglePlayback}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${mine ? "bg-white/20 text-white" : "bg-indigo-600 text-white"}`}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex h-7 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => {
            const height = 7 + ((index * 13) % 17);
            const filled = index / 24 <= progress;
            return <span key={index} style={{ height }} className={`w-1 rounded-full ${filled ? (mine ? "bg-white" : "bg-indigo-500") : (mine ? "bg-white/35" : "bg-slate-300")}`} />;
          })}
        </div>
        <div className={`mt-0.5 flex items-center justify-between text-[10px] font-semibold ${mine ? "text-white/75" : "text-slate-500"}`}>
          <span>{playing ? "Playing" : "Voice message"}</span>
          <span>{formatVoiceDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const VoiceRecorder = ({ disabled, onSend, onError, onStateChange }) => {
  const [state, setState] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);
  const discardRef = useRef(false);
  const mountedRef = useRef(true);

  const stopTracks = () => {
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
  };
  const clearTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };
  const reset = () => {
    clearTimer();
    stopTracks();
    recorderRef.current = null;
    chunksRef.current = [];
    if (mountedRef.current) {
      setElapsed(0);
      setState("idle");
    }
  };

  useEffect(() => { onStateChange?.(state); }, [onStateChange, state]);

  useEffect(() => () => {
    mountedRef.current = false;
    discardRef.current = true;
    clearTimer();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopTracks();
  }, []);

  const finish = (discard = false) => {
    if (recorderRef.current?.state !== "recording") return;
    discardRef.current = discard;
    clearTimer();
    if (mountedRef.current) setState(discard ? "idle" : "uploading");
    recorderRef.current.stop();
  };

  const start = async () => {
    if (disabled || state !== "idle") return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      onError?.("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const discardRecording = discardRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stopTracks();
        recorderRef.current = null;
        if (discardRecording || !blob.size) {
          reset();
          return;
        }
        try {
          const extension = blob.type.includes("ogg") ? "ogg" : "webm";
          await onSend(new File([blob], `voice-message-${Date.now()}.${extension}`, { type: blob.type || "audio/webm" }), seconds);
        } catch (error) {
          onError?.(error.message || "Voice message could not be sent.");
        } finally {
          reset();
        }
      };
      recorder.start(250);
      setState("recording");
      timerRef.current = window.setInterval(() => {
        const next = Date.now() - startedAtRef.current;
        if (mountedRef.current) setElapsed(next);
        if (next >= 60_000) finish(false);
      }, 250);
    } catch (error) {
      stopTracks();
      onError?.(error.name === "NotAllowedError" ? "Allow microphone access to record a voice message." : "Could not start voice recording.");
    }
  };

  if (state === "recording") {
    return (
      <div className="mx-fade flex min-w-0 flex-1 items-center gap-2 rounded-3xl bg-rose-500/10 px-3 py-1.5 text-rose-600">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" />
        <span className="w-10 text-xs font-black tabular-nums">{formatVoiceDuration(elapsed / 1000)}</span>
        <div className="flex min-w-0 flex-1 items-center gap-1" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => <span key={index} style={{ height: 7 + ((index * 11) % 14), animationDelay: `${index * 75}ms` }} className="w-1 animate-pulse rounded-full bg-rose-500" />)}
        </div>
        <button type="button" onClick={() => finish(true)} className="rounded-full p-2 hover:bg-rose-500/10" aria-label="Cancel recording"><Trash2 size={18} /></button>
        <button type="button" onClick={() => finish(false)} className="rounded-full bg-rose-500 p-2 text-white hover:bg-rose-600" aria-label="Send voice message"><Send size={18} /></button>
      </div>
    );
  }
  if (state === "uploading") {
    return <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm font-bold text-indigo-600"><Loader2 size={17} className="animate-spin" /> Sending voice message…</div>;
  }
  return (
    <button type="button" onClick={start} disabled={disabled} className={`${iconBtnBase} bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40`} aria-label="Record voice message" title="Record voice message">
      <Mic size={19} />
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*  Message row (memoised: typing in the composer never re-renders the list)  */
/* -------------------------------------------------------------------------- */

const EditBox = ({ initial, mine, t, onSave, onCancel }) => {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving || !value.trim()) return;
    setSaving(true);
    const ok = await onSave(value);
    if (ok === false) setSaving(false);
  };
  return (
    <div className="min-w-[200px] sm:min-w-[280px]">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        autoFocus
        aria-label="Edit message"
        className={`w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none ${mine ? "border-white/30 bg-white/10 text-white placeholder:text-white/50" : t.input}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
          else if (e.key === "Escape") onCancel();
        }}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onCancel} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${mine ? "bg-white/15 text-white" : `${t.soft} border`}`}>Cancel</button>
        <button onClick={save} disabled={!value.trim() || saving} className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${mine ? "bg-white text-indigo-700" : "bg-indigo-600 text-white"}`}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
        </button>
      </div>
    </div>
  );
};

const MessageRow = memo(function MessageRow({
  message, mine, grouped, lastInGroup, unreadByOther, openUp, senderName, senderAvatar, dark, uid, api,
}) {
  const t = dark ? THEME_DARK : THEME_LIGHT;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const wrapRef = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismiss(wrapRef, menuOpen, closeMenu);

  const reactions = useMemo(() => normalizeReactions(message.reactions), [message.reactions]);
  const reactionList = Object.entries(reactions);
  const isSticker = message.type === "sticker" && !!message.sticker && !message.deleted;
  const showActions = !message.deleted && !editing;
  const editable = menuOpen && canEditMessage(message, uid);
  const deletable = menuOpen && canDeleteMessage(message, uid);

  const bubbleTone = isSticker ? "" : mine ? "bg-indigo-600 text-white" : t.bubble;
  const tail = mine ? (lastInGroup ? "rounded-br-md" : "") : lastInGroup ? "rounded-bl-md" : "";
  const footerTone = mine && !isSticker ? "text-white/75" : t.muted;

  const run = (fn) => () => { setMenuOpen(false); fn(); };

  const menuItems = [
    { label: "Reply", icon: Reply, show: true, run: () => api.reply(message) },
    { label: "Copy text", icon: Copy, show: !!message.text, run: () => api.copy(message) },
    { label: "See who reacted", icon: Eye, show: reactionList.length > 0, run: () => api.openReactions(message.id) },
    { label: "Edit", icon: Pencil, show: mine && editable, run: () => setEditing(true) },
    { label: "Delete", icon: Trash2, show: mine && deletable, run: () => api.requestDelete(message), danger: true },
  ].filter((item) => item.show);

  const actions = showActions && (
    <div ref={wrapRef} className="relative flex shrink-0 items-center self-center">
      <button
        type="button"
        onClick={() => api.reply(message)}
        className={`hidden h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 md:flex ${t.hover} ${focusRing}`}
        aria-label="Reply"
        title="Reply"
      >
        <Reply size={15} />
      </button>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-opacity ${t.hover} ${focusRing} ${
          menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-50"
        }`}
        aria-label="Message options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreVertical size={16} />
      </button>
      {menuOpen && (
        <>
          <div className="mx-fade fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeMenu} />
          <div
            role="menu"
            className={`mx-sheet md:mx-pop fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-3xl border py-1 shadow-2xl md:absolute md:inset-x-auto md:w-56 md:rounded-2xl md:shadow-xl ${t.menu} ${
              openUp ? "md:bottom-full md:mb-1" : "md:bottom-auto md:top-full md:mt-1"
            } ${mine ? "md:right-0" : "md:left-0"}`}
          >
            <div className={`flex justify-around border-b px-2 py-2 ${t.divider}`}>
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={run(() => api.toggleReaction(message, emoji))}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-transform hover:scale-110 active:scale-90 md:h-8 md:w-8 md:text-base ${reactions[emoji]?.includes(uid) ? "bg-indigo-500/25" : ""}`}
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={run(item.run)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold md:py-2.5 md:text-xs ${
                  item.danger ? `text-red-500 ${dark ? "hover:bg-red-500/10" : "hover:bg-red-50"}` : t.hover
                }`}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      id={`msg-${message.id}`}
      className={`group flex items-end gap-2 rounded-2xl transition-colors duration-500 ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-3"}`}
      onContextMenu={(e) => {
        if (!showActions) return;
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      {!mine && (lastInGroup ? <Avatar src={senderAvatar} name={senderName} size="sm" /> : <div className="w-8 shrink-0" />)}
      {mine && actions}
      <div className={`flex min-w-0 max-w-[82%] flex-col ${mine ? "items-end" : "items-start"}`}>
        <div className={`relative min-w-0 max-w-full rounded-2xl ${isSticker ? "" : "px-3.5 py-2"} ${bubbleTone} ${tail} ${message.deleted ? "opacity-70" : ""}`}>
          {message.deleted ? (
            <p className="flex items-center gap-1.5 text-sm italic opacity-80"><Trash2 size={13} /> This message was deleted</p>
          ) : editing ? (
            <EditBox
              initial={message.text || ""}
              mine={mine}
              t={t}
              onCancel={() => setEditing(false)}
              onSave={async (value) => {
                const ok = await api.saveEdit(message, value);
                if (ok !== false) setEditing(false);
                return ok;
              }}
            />
          ) : (
            <>
              {message.replyTo && (
                <button
                  type="button"
                  onClick={() => api.jumpTo(message.replyTo.id)}
                  className={`mb-2 block w-full rounded-xl border-l-4 p-2 text-left text-xs ${mine ? "border-white/60 bg-white/10" : "border-indigo-400 bg-indigo-500/10"}`}
                >
                  <p className="font-bold opacity-90">{message.replyTo.senderName}</p>
                  <p className="mt-0.5 line-clamp-2 opacity-80">{message.replyTo.text}</p>
                </button>
              )}
              {isSticker && (
                <img
                  src={message.sticker.thumbnailUrl || message.sticker.assetUrl || message.sticker.imageUrl || message.sticker.url}
                  alt={message.sticker.name || "Sticker"}
                  className="max-h-36 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              )}
              {message.type === "voice" && message.audioUrl && <VoiceMessage message={message} mine={mine} />}
              {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-6"><Linkified text={message.text} /></p>}
              {(message.attachments || []).map((item, i) => <Attachment key={i} item={item} onOpen={api.openLightbox} />)}
            </>
          )}
          {!editing && !isSticker && (lastInGroup || message.edited) && (
            <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold ${footerTone}`}>
              {message.edited && !message.deleted && <span>Edited</span>}
              <span>{formatShortTime(message.createdAt)}</span>
              {mine && !message.deleted && (unreadByOther ? <Check size={13} aria-label="Sent" /> : <CheckCheck size={13} className="text-sky-200" aria-label="Read" />)}
            </div>
          )}
        </div>

        {isSticker && lastInGroup && (
          <div className={`mt-0.5 flex items-center gap-1 text-[10px] font-semibold ${t.muted}`}>
            <span>{formatShortTime(message.createdAt)}</span>
            {mine && (unreadByOther ? <Check size={13} /> : <CheckCheck size={13} className="text-indigo-400" />)}
          </div>
        )}

        {!message.deleted && reactionList.length > 0 && (
          <div className={`relative z-10 -mt-1.5 flex flex-wrap gap-1 px-1 ${mine ? "justify-end" : "justify-start"}`}>
            {reactionList.map(([emoji, ids]) => {
              const reacted = ids.includes(uid);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => api.toggleReaction(message, emoji)}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold shadow-sm transition-transform active:scale-90 ${
                    reacted ? "border-indigo-400 bg-indigo-500/25" : `${t.divider} ${t.chip}`
                  }`}
                  aria-label={`${emoji} ${ids.length}${reacted ? ", you reacted" : ""}`}
                >
                  <span>{emoji}</span>
                  {ids.length > 1 && <span>{ids.length}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {!mine && actions}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*  Conversation list row                                                     */
/* -------------------------------------------------------------------------- */

const ConversationItem = memo(function ConversationItem({ item, uid, rel, selected, dark, onOpen }) {
  const t = dark ? THEME_DARK : THEME_LIGHT;
  const otherId = item.memberIds?.find((id) => id !== uid);
  const other = item.memberInfo?.[otherId] || {};
  const unread = Number(item.unread?.[uid] || 0);
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors active:scale-[0.99] ${focusRing} ${
        selected ? (dark ? "bg-indigo-500/15" : "bg-indigo-50") : t.hover
      }`}
    >
      <Avatar src={pickAvatar(other)} name={other.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`flex min-w-0 items-center gap-1.5 text-[15px] ${unread ? "font-extrabold" : "font-bold"}`}>
            <span className="truncate">{other.name || "Student"}</span>
            {rel === "none" && <UserPlus size={12} className="shrink-0 opacity-50" aria-label="Not friends yet" />}
            {rel === "incoming" && <UserRoundPlus size={12} className="shrink-0 text-indigo-500" aria-label="Friend request received" />}
            {rel === "outgoing" && <Clock size={12} className="shrink-0 opacity-50" aria-label="Friend request sent" />}
          </p>
          <span className={`shrink-0 text-[11px] ${unread ? "font-bold text-indigo-500" : t.muted}`}>{formatShortTime(item.updatedAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${unread ? "font-semibold" : t.muted}`}>{item.lastMessage || "Say hello"}</p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
              {badgeCount(unread)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/*  Composer (owns its own text state, so keystrokes never re-render the chat) */
/* -------------------------------------------------------------------------- */

const COARSE_POINTER = typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

function Composer({
  dark, activeId, uid, typingName, canUse, areFriends, replyTo, replyLabel, onCancelReply,
  file, onStageFile, onClearFile, onSend, onSendVoice, onOpenStickers, onNotice, seedText, onSeedUsed,
}) {
  const t = dark ? THEME_DARK : THEME_LIGHT;
  const [text, setText] = useState(() => seedText || draftCache.get(activeId) || "");
  const [busy, setBusy] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [filePreview, setFilePreview] = useState("");
  const textareaRef = useRef(null);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);
  const textRef = useRef(text);
  const typingRef = useRef(false);
  const typingTimerRef = useRef(null);
  textRef.current = text;

  useDismiss(emojiRef, emojiOpen, useCallback(() => setEmojiOpen(false), []));
  useDismiss(attachRef, attachOpen, useCallback(() => setAttachOpen(false), []));

  const writeTyping = useCallback((active) => {
    if (!activeId || !uid) return;
    const payload = active
      ? { active: true, name: typingName, updatedAt: serverTimestamp() }
      : { active: false, updatedAt: serverTimestamp() };
    setDoc(doc(db, "conversations", activeId, "typing", uid), payload, { merge: true }).catch(() => {});
  }, [activeId, uid, typingName]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      writeTyping(false);
    }
  }, [writeTyping]);

  // Remember the draft per chat and clear the typing flag when leaving it.
  useEffect(() => () => {
    if (textRef.current.trim()) draftCache.set(activeId, textRef.current);
    else draftCache.delete(activeId);
    clearTimeout(typingTimerRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      setDoc(doc(db, "conversations", activeId, "typing", uid), { active: false, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    }
  }, [activeId, uid]);

  useEffect(() => {
    if (!seedText) return;
    setText(seedText);
    onSeedUsed?.();
  }, [seedText, onSeedUsed]);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setFilePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (value) => {
    setText(value);
    if (!typingRef.current && value) {
      typingRef.current = true;
      writeTyping(true);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 1500);
  };

  const submit = async () => {
    const value = text.trim();
    if ((!value && !file) || busy) return;
    stopTyping();
    const hadFile = !!file;
    if (hadFile) setBusy(true);
    else { setText(""); draftCache.delete(activeId); } // instant for text: restore if it fails
    try {
      await onSend({ text: value, file });
      if (hadFile) setText("");
      draftCache.delete(activeId);
    } catch (error) {
      if (!hadFile) setText(value);
      onNotice(error.message || "Message not sent. You may need to be friends first.");
    } finally {
      setBusy(false);
    }
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    handleChange(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  if (!canUse) {
    return (
      <div className={`border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${t.divider}`}>
        <div className={`rounded-2xl border p-3.5 text-center text-sm font-semibold ${t.soft}`}>
          Become friends to keep chatting. Only one intro message is allowed until then.
        </div>
      </div>
    );
  }

  const recording = voiceState !== "idle";
  const hasContent = !!text.trim() || !!file;

  return (
    <div className={`border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3 ${t.divider}`}>
      {replyTo && (
        <div className={`mx-pop mb-2 flex items-start justify-between gap-3 rounded-2xl border border-l-4 border-l-indigo-500 p-2.5 text-xs ${t.soft}`}>
          <div className="min-w-0">
            <p className="font-bold">Replying to {replyLabel}</p>
            <p className={`mt-0.5 line-clamp-1 ${t.muted}`}>{messagePreview(replyTo)}</p>
          </div>
          <button onClick={onCancelReply} className="rounded-lg p-1 hover:bg-red-500/10" aria-label="Cancel reply"><X size={15} /></button>
        </div>
      )}

      {file && (
        <div className={`mx-pop mb-2 flex items-center gap-3 rounded-2xl border p-2 text-xs ${t.soft}`}>
          {filePreview ? (
            <img src={filePreview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500"><FileText size={20} /></div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{file.name}</p>
            <p className={t.muted}>{busy ? "Uploading…" : `${(file.size / 1024 / 1024).toFixed(file.size > 1024 * 1024 ? 1 : 2)} MB`}</p>
          </div>
          {busy ? <Loader2 size={16} className="mr-2 animate-spin text-indigo-500" /> : (
            <button onClick={onClearFile} className="rounded-lg p-2 hover:bg-red-500/10" aria-label="Remove attachment"><X size={15} /></button>
          )}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        {/* "+" menu: attachments and stickers live here, not on the main row */}
        <div ref={attachRef} className={`relative ${recording ? "hidden" : ""}`}>
          <button
            type="button"
            onClick={() => { setAttachOpen((v) => !v); setEmojiOpen(false); }}
            className={`${iconBtnBase} ${t.hover} ${attachOpen ? "rotate-45" : ""} transition-transform`}
            aria-label="Add attachment"
            aria-expanded={attachOpen}
          >
            <Plus size={22} />
          </button>
          {attachOpen && (
            <div role="menu" className={`mx-pop absolute bottom-full left-0 z-40 mb-2 w-52 overflow-hidden rounded-2xl border py-1 shadow-xl ${t.menu}`}>
              {[
                { label: "Photo or video", icon: ImageIcon, run: () => mediaInputRef.current?.click() },
                { label: "Document", icon: FileText, run: () => docInputRef.current?.click() },
                { label: "Sticker", icon: StickyNote, run: onOpenStickers },
              ].map((item) => (
                <button key={item.label} type="button" role="menuitem" onClick={() => { setAttachOpen(false); item.run(); }} className={`flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm font-semibold ${t.hover}`}>
                  <item.icon size={17} className="opacity-80" /> {item.label}
                </button>
              ))}
            </div>
          )}
          <input ref={mediaInputRef} hidden type="file" accept="image/*,video/*" onChange={(e) => { onStageFile(e.target.files?.[0] || null); e.target.value = ""; }} />
          <input ref={docInputRef} hidden type="file" onChange={(e) => { onStageFile(e.target.files?.[0] || null); e.target.value = ""; }} />
        </div>

        <div className={`relative flex min-w-0 flex-1 items-end rounded-3xl border ${t.input} ${recording ? "hidden" : ""}`}>
          <div ref={emojiRef} className="relative">
            <button type="button" onClick={() => { setEmojiOpen((v) => !v); setAttachOpen(false); }} className={`${iconBtnBase} ${t.hover}`} aria-label="Emoji" aria-expanded={emojiOpen}>
              <Smile size={19} />
            </button>
            {emojiOpen && (
              <div className={`mx-pop absolute bottom-full left-0 z-40 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border p-2 shadow-xl ${t.menu}`}>
                <div className="grid grid-cols-8 gap-0.5">
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${t.hover}`} aria-label={`Insert ${emoji}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={(e) => {
              const pasted = Array.from(e.clipboardData?.files || [])[0];
              if (pasted) { e.preventDefault(); onStageFile(pasted); }
            }}
            rows={1}
            placeholder={areFriends ? "Message" : "Send one intro message"}
            aria-label="Message"
            enterKeyHint={COARSE_POINTER ? "enter" : "send"}
            className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2.5 pr-3 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !COARSE_POINTER) { e.preventDefault(); submit(); }
            }}
          />
        </div>

        {hasContent ? (
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className={`${iconBtnBase} bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60`}
            aria-label="Send message"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        ) : (
          <VoiceRecorder disabled={busy} onStateChange={setVoiceState} onSend={onSendVoice} onError={onNotice} />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Messenger                                                                 */
/* -------------------------------------------------------------------------- */

export default function Messenger({ dark = false }) {
  const t = dark ? THEME_DARK : THEME_LIGHT;
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [activeTab, setActiveTab] = useState("chats");

  // Chats
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeId, setActiveId] = useState("");
  const [openFailed, setOpenFailed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [seedText, setSeedText] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [notice, setNotice] = useState("");
  const [requestTarget, setRequestTarget] = useState(null);
  const [requestSending, setRequestSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [listFilter, setListFilter] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [muted, setMuted] = useState(null); // null = not loaded yet
  const [muteLoading, setMuteLoading] = useState(false);
  const [reactionViewerId, setReactionViewerId] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Stickers
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [stickerTab, setStickerTab] = useState("mine");
  const [selectedPack, setSelectedPack] = useState(null);
  const [stickerPacks, setStickerPacks] = useState([]);
  const [stickerItems, setStickerItems] = useState([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [stickerError, setStickerError] = useState("");

  // Friends / requests / find
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [rawSuggestions, setRawSuggestions] = useState([]);
  const [showFindModal, setShowFindModal] = useState(false);

  // Refs
  const openedUserRef = useRef("");
  const openedConversationRef = useRef("");
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const bottomRef = useRef(null);
  const stickRef = useRef(true);
  const firstLoadRef = useRef(true);
  const messageMapRef = useRef(new Map());
  const convMapRef = useRef(new Map());
  const oldestDocRef = useRef(null);
  const skipScrollRef = useRef(false);
  const markingRef = useRef("");

  /* ------------------------------ Derived data ----------------------------- */

  const getFriendUid = (friend) => friend.users?.find((id) => id !== user?.uid) || "";
  const getFriendProfile = (friend) => {
    const otherUid = getFriendUid(friend);
    return otherUid ? friend.profiles?.[otherUid] || {} : {};
  };

  const friendIds = useMemo(() => {
    const ids = new Set();
    friends.forEach((friend) => friend.users?.forEach?.((id) => { if (id !== user?.uid) ids.add(id); }));
    return ids;
  }, [friends, user?.uid]);

  const incomingByUser = useMemo(() => {
    const map = new Map();
    incomingRequests.forEach((r) => r.from && map.set(r.from, r));
    return map;
  }, [incomingRequests]);

  const outgoingByUser = useMemo(() => {
    const map = new Map();
    outgoingRequests.forEach((r) => r.to && map.set(r.to, r));
    return map;
  }, [outgoingRequests]);

  const relOf = (peerId) =>
    !peerId || friendIds.has(peerId) ? "friend" : incomingByUser.has(peerId) ? "incoming" : outgoingByUser.has(peerId) ? "outgoing" : "none";

  const suggestions = useMemo(
    () =>
      rawSuggestions
        .filter((u) => u.id && u.id !== user?.uid && !friendIds.has(u.id) && !incomingByUser.has(u.id) && !outgoingByUser.has(u.id))
        .slice(0, 8),
    [rawSuggestions, friendIds, incomingByUser, outgoingByUser, user?.uid]
  );

  const activeConversation = useMemo(() => conversations.find((c) => c.id === activeId) || null, [activeId, conversations]);
  const activeOtherId = useMemo(
    () => (activeConversation && user?.uid ? activeConversation.memberIds?.find((id) => id !== user.uid) || "" : ""),
    [activeConversation, user?.uid]
  );
  const otherUser = useMemo(
    () => (activeConversation && activeOtherId ? activeConversation.memberInfo?.[activeOtherId] || null : null),
    [activeConversation, activeOtherId]
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + Number(c.unread?.[user?.uid] || 0), 0),
    [conversations, user?.uid]
  );
  const unreadForMe = Number(activeConversation?.unread?.[user?.uid] || 0);

  const filteredConversations = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const otherId = c.memberIds?.find((id) => id !== user?.uid);
      return (c.memberInfo?.[otherId]?.name || "").toLowerCase().includes(q) || (c.lastMessage || "").toLowerCase().includes(q);
    });
  }, [conversations, listFilter, user?.uid]);

  const filteredFriends = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((friend) => {
      const otherUid = friend.users?.find((id) => id !== user?.uid);
      const p = (otherUid && friend.profiles?.[otherUid]) || {};
      return [p.name, p.username, p.school, p.university, p.department].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [friends, listFilter, user?.uid]);

  const activeRel = relOf(activeOtherId);
  const activeAreFriends = activeRel === "friend";
  const activeIncoming = activeOtherId ? incomingByUser.get(activeOtherId) : null;
  const activeOutgoing = activeOtherId ? outgoingByUser.get(activeOtherId) : null;
  const nonFriendMessageUsed = !activeAreFriends && Number(activeConversation?.messageCount || 0) >= 1;
  const canUseComposer = activeAreFriends || !nonFriendMessageUsed;

  const unreadMineIds = useMemo(() => {
    const count = Number(activeConversation?.unread?.[activeOtherId] || 0);
    if (!count) return new Set();
    return new Set(messages.filter((m) => m.senderId === user?.uid && !m.deleted).slice(-count).map((m) => m.id));
  }, [activeConversation, activeOtherId, messages, user?.uid]);

  const rows = useMemo(() => {
    const out = [];
    let lastDay = "";
    messages.forEach((m, i) => {
      const d = toDate(m.createdAt);
      const key = d ? d.toDateString() : "";
      let dayInserted = false;
      if (key && key !== lastDay) {
        out.push({ kind: "day", id: `day-${key}`, label: dayLabel(d) });
        lastDay = key;
        dayInserted = true;
      }
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const nextDate = next ? toDate(next.createdAt) : null;
      const nextSameDay = !nextDate || !d || nextDate.toDateString() === d.toDateString();
      out.push({
        kind: "msg",
        message: m,
        index: i,
        grouped: !!prev && prev.senderId === m.senderId && !dayInserted,
        lastInGroup: !next || next.senderId !== m.senderId || !nextSameDay,
      });
    });
    return out;
  }, [messages]);

  const reactionViewer = useMemo(() => {
    if (!reactionViewerId) return null;
    const message = messages.find((m) => m.id === reactionViewerId);
    const normalized = normalizeReactions(message?.reactions);
    const ids = [...new Set(Object.values(normalized).flat())];
    // A DM only has two people, so we already know both: zero extra reads.
    const people = ids.map((id) => {
      const mine = id === user?.uid;
      const info = mine
        ? { name: "You", avatar: profile.photo || profile.avatar || user?.photoURL || "" }
        : { name: otherUser?.name || "Student", avatar: pickAvatar(otherUser) };
      return { id, mine, ...info, emojis: Object.entries(normalized).filter(([, list]) => list.includes(id)).map(([e]) => e) };
    });
    return { people };
  }, [reactionViewerId, messages, user?.uid, user?.photoURL, profile, otherUser]);

  /* -------------------------------- Effects -------------------------------- */

  // Profile (cached)
  useEffect(() => {
    if (!user?.uid) return undefined;
    const cached = profileCache.get(user.uid);
    if (fresh(cached)) {
      setProfile(cached.data);
      return undefined;
    }
    let cancelled = false;
    getCurrentUserProfile(user)
      .then((data) => {
        profileCache.set(user.uid, { at: Date.now(), data: data || {} });
        if (!cancelled) setProfile(data || {});
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Conversation list: index-free query, merged by docChanges so unchanged rows keep identity.
  useEffect(() => {
    convMapRef.current = new Map();
    if (!user?.uid) {
      setConversations([]);
      setConvLoading(false);
      return undefined;
    }
    let mounted = true;
    setConvLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, "conversations"), where("memberIds", "array-contains", user.uid)),
      (snap) => {
        if (!mounted) return;
        const map = convMapRef.current;
        snap.docChanges().forEach((change) => {
          if (change.type === "removed") map.delete(change.doc.id);
          else map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        });
        setConversations(sortVisibleConversations(Array.from(map.values()), user.uid));
        setConvLoading(false);
      },
      (error) => {
        if (!mounted) return;
        console.error("Unable to load conversations:", error);
        setConversations([]);
        setConvLoading(false);
        setNotice("Could not load your conversations. Refresh and try again.");
      }
    );
    return () => { mounted = false; unsubscribe(); };
  }, [user?.uid]);

  useEffect(() => {
    setOpenFailed(false);
    if (!activeId || activeConversation) return undefined;
    const timer = setTimeout(() => setOpenFailed(true), 6000);
    return () => clearTimeout(timer);
  }, [activeId, activeConversation]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!notice || requestTarget) return undefined;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice, requestTarget]);

  // Sticker packs: fetched once per session
  useEffect(() => {
    if (!stickerPickerOpen || !user?.uid || stickerPacks.length > 0) return undefined;
    if (fresh(packsCache, LONG_CACHE_TTL_MS) && packsCache.data) {
      setStickerPacks(packsCache.data);
      return undefined;
    }
    let cancelled = false;
    getJson("/api/stickers/packs")
      .then((res) => {
        packsCache.at = Date.now();
        packsCache.data = res?.data || [];
        if (!cancelled) setStickerPacks(packsCache.data);
      })
      .catch((error) => !cancelled && setStickerError(error.message || "Could not load sticker packs."));
    return () => { cancelled = true; };
  }, [stickerPickerOpen, user?.uid, stickerPacks.length]);

  // Sticker items: cached per tab/pack
  useEffect(() => {
    if (!stickerPickerOpen) return undefined;
    if (stickerTab === "packs" && !selectedPack) {
      setStickerItems([]);
      return undefined;
    }
    const cacheKey = stickerTab === "packs" ? `pack:${selectedPack.id}` : stickerTab;
    const cached = stickerCache.get(cacheKey);
    if (fresh(cached)) {
      setStickerItems(cached.data);
      setStickerError("");
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        setStickerLoading(true);
        setStickerError("");
        let data = [];
        if (stickerTab === "recent") data = (await getJson("/api/stickers/recent"))?.data || [];
        else if (stickerTab === "favorites") data = (await getJson("/api/stickers/favorites"))?.data || [];
        else if (stickerTab === "mine") data = (await getJson("/api/stickers?owner=me"))?.data || [];
        else data = (await getJson(`/api/stickers?packId=${encodeURIComponent(selectedPack.id)}`))?.data || [];
        stickerCache.set(cacheKey, { at: Date.now(), data });
        if (!cancelled) setStickerItems(data);
      } catch (error) {
        if (!cancelled) setStickerError(error.message || "Could not load stickers.");
      } finally {
        if (!cancelled) setStickerLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [stickerPickerOpen, stickerTab, selectedPack]);

  // URL params: open a chat directly
  useEffect(() => {
    const targetConversation = searchParams.get("conversation") || searchParams.get("conversationId");
    const targetUid = searchParams.get("user");
    const initialMessage = searchParams.get("message");

    if (targetConversation && activeId !== targetConversation && openedConversationRef.current !== targetConversation) {
      openedConversationRef.current = targetConversation;
      setActiveTab("chats");
      setActiveId(targetConversation);
      setSearchParams({}, { replace: true });
      return;
    }
    if (!targetUid || !user?.uid || targetUid === user.uid || openedUserRef.current === targetUid) return;

    openedUserRef.current = targetUid;
    getUserDoc(targetUid)
      .then((targetProfile) => {
        if (!targetProfile) {
          setNotice("User profile was not found.");
          return;
        }
        openUser({ id: targetUid, ...targetProfile }, targetProfile)
          .then(() => {
            if (initialMessage) setSeedText(initialMessage);
            setSearchParams({}, { replace: true });
          })
          .catch(() => setNotice("Could not open that conversation."));
      })
      .catch(() => setNotice("Could not open that conversation."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams, user?.uid, activeId]);

  // Messages: ONE live listener on the newest page; older pages load on demand.
  useEffect(() => {
    messageMapRef.current = new Map();
    oldestDocRef.current = null;
    setMessages([]);
    setHasMore(false);
    setFile(null);
    setReplyTo(null);
    setReactionViewerId("");
    if (!activeId || !user?.uid) return undefined;

    firstLoadRef.current = true;
    stickRef.current = true;
    setMessagesLoading(true);
    setShowJump(false);

    let first = true;
    const q = query(collection(db, "conversations", activeId, "messages"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    return onSnapshot(
      q,
      (snap) => {
        const map = messageMapRef.current;
        if (first) {
          first = false;
          oldestDocRef.current = snap.docs[snap.docs.length - 1] || null;
          setHasMore(snap.size >= PAGE_SIZE);
        }
        snap.docChanges().forEach((change) => {
          // "removed" also fires when a message slides out of the live window, so ignore it.
          if (change.type !== "removed") map.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        });
        setMessages(sortMessages(map));
        setMessagesLoading(false);
      },
      () => setMessagesLoading(false)
    );
  }, [activeId, user?.uid]);

  // Mute state: from cache, otherwise read lazily the first time the chat menu opens.
  useEffect(() => {
    setMuteLoading(false);
    if (!activeId || !user?.uid) { setMuted(null); return; }
    const key = `${user.uid}:${activeId}`;
    setMuted(muteCache.has(key) ? muteCache.get(key) : null);
  }, [activeId, user?.uid]);

  const ensureMuteLoaded = () => {
    if (!activeId || !user?.uid || muted !== null || muteLoading) return;
    const key = `${user.uid}:${activeId}`;
    const id = activeId;
    setMuteLoading(true);
    getDoc(doc(db, "users", user.uid, "conversationSettings", id))
      .then((snap) => {
        const value = Boolean(snap.data()?.muted);
        muteCache.set(key, value);
        if (openedIdRef.current === id) setMuted(value);
      })
      .catch(() => setNotice("Could not load notification settings."))
      .finally(() => setMuteLoading(false));
  };
  const openedIdRef = useRef("");
  openedIdRef.current = activeId;

  // Mark as read only when something is unread (and only once per unread count).
  useEffect(() => {
    if (!activeId || !user?.uid || unreadForMe === 0) { markingRef.current = ""; return undefined; }
    const mark = () => {
      const token = `${activeId}:${unreadForMe}`;
      if (document.visibilityState !== "visible" || markingRef.current === token) return;
      markingRef.current = token;
      markConversationRead(activeId, user.uid).catch(() => { markingRef.current = ""; });
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [activeId, user?.uid, unreadForMe]);

  // Keep the view pinned to the newest message unless the reader scrolled up.
  useEffect(() => {
    if (skipScrollRef.current) { skipScrollRef.current = false; return; }
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (stickRef.current || last.senderId === user?.uid) scrollToBottom(firstLoadRef.current ? "auto" : "smooth");
    else setShowJump(true);
    firstLoadRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Images/videos finishing loading grow the list: stay pinned without jumping.
  const hasMessages = messages.length > 0;
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (stickRef.current) bottomRef.current?.scrollIntoView({ block: "end" });
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [activeId, hasMessages]);

  // Escape closes the top-most layer
  useEffect(() => {
    const handler = (event) => {
      if (event.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else if (pendingDelete) setPendingDelete(null);
      else if (reactionViewerId) setReactionViewerId("");
      else if (stickerPickerOpen) setStickerPickerOpen(false);
      else if (showFindModal) closeFind();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, pendingDelete, reactionViewerId, stickerPickerOpen, showFindModal]);

  // Lock page scroll behind modals
  useEffect(() => {
    if (!showFindModal && !stickerPickerOpen && !reactionViewerId && !pendingDelete && !lightbox) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [showFindModal, stickerPickerOpen, reactionViewerId, pendingDelete, lightbox]);

  // Search users: debounce + 5 min cache per query
  useEffect(() => {
    const value = search.trim();
    if (value.length < 2 || !user?.uid) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const key = `${user.uid}:${value.toLowerCase()}`;
    const cached = searchCache.get(key);
    if (fresh(cached)) {
      setResults(cached.list);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchUsers(value, user.uid);
        searchCache.set(key, { at: Date.now(), list: found || [] });
        if (!cancelled) setResults(found || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, user?.uid]);

  // Suggestions: fetched when the Find sheet opens, cached 30 min, filtered locally.
  useEffect(() => {
    if (!showFindModal || !user?.uid) return undefined;
    if (suggestionCache.uid === user.uid && fresh(suggestionCache, LONG_CACHE_TTL_MS)) {
      setRawSuggestions(suggestionCache.list);
      return undefined;
    }
    let cancelled = false;
    suggestFriends(profile || {}, user.uid, 16)
      .then((list) => {
        suggestionCache.uid = user.uid;
        suggestionCache.at = Date.now();
        suggestionCache.list = list || [];
        if (!cancelled) setRawSuggestions(list || []);
      })
      .catch(() => !cancelled && setRawSuggestions([]));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFindModal, user?.uid]);

  // Typing indicator: one doc listener, paused while the tab is hidden.
  useEffect(() => {
    setOtherTyping(false);
    if (!activeId || !activeOtherId) return undefined;
    let timer;
    let unsubscribe = null;
    const subscribe = () => {
      if (unsubscribe) return;
      unsubscribe = onSnapshot(
        doc(db, "conversations", activeId, "typing", activeOtherId),
        (snap) => {
          clearTimeout(timer);
          const data = snap.data();
          const at = toDate(data?.updatedAt);
          const isFresh = !at || Date.now() - at.getTime() < TYPING_STALE_MS;
          const active = !!data?.active && isFresh;
          setOtherTyping(active);
          if (active) timer = setTimeout(() => setOtherTyping(false), TYPING_STALE_MS);
        },
        () => {}
      );
    };
    const unsubscribeNow = () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
      setOtherTyping(false);
    };
    const onVisibility = () => (document.visibilityState === "visible" ? subscribe() : unsubscribeNow());
    if (document.visibilityState === "visible") subscribe();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeNow();
    };
  }, [activeId, activeOtherId]);

  // Friends & requests
  useEffect(() => (user?.uid ? listenFriends(user.uid, setFriends) : undefined), [user?.uid]);
  useEffect(() => (user?.uid ? listenIncomingFriendRequests(user.uid, setIncomingRequests) : undefined), [user?.uid]);
  useEffect(() => (user?.uid ? listenOutgoingFriendRequests(user.uid, setOutgoingRequests) : undefined), [user?.uid]);

  /* -------------------------------- Actions -------------------------------- */

  function scrollToBottom(behavior = "smooth") {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior, block: "end" }));
    setShowJump(false);
  }

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distance < 120;
    setShowJump((prev) => (prev === distance > 300 ? prev : distance > 300));
  };

  const stageFile = useCallback((picked) => {
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) {
      setNotice("That file is larger than 25 MB. Choose a smaller one.");
      return;
    }
    setFile(picked);
  }, []);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  const closeFind = () => {
    setShowFindModal(false);
    setSearch("");
    setResults([]);
  };

  const loadOlder = async () => {
    if (!activeId || loadingOlder || !oldestDocRef.current) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight || 0;
    try {
      const snap = await getDocs(
        query(
          collection(db, "conversations", activeId, "messages"),
          orderBy("createdAt", "desc"),
          startAfter(oldestDocRef.current),
          limit(PAGE_SIZE)
        )
      );
      snap.docs.forEach((d) => messageMapRef.current.set(d.id, { id: d.id, ...d.data() }));
      if (snap.docs.length) oldestDocRef.current = snap.docs[snap.docs.length - 1];
      setHasMore(snap.size >= PAGE_SIZE);
      skipScrollRef.current = true;
      setMessages(sortMessages(messageMapRef.current));
      requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - prevHeight; });
    } catch {
      setNotice("Could not load earlier messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  // Reactions: a single targeted write (no transaction read). The local snapshot updates instantly.
  const toggleReaction = async (message, emoji) => {
    if (!activeId || !user?.uid) return;
    const has = (normalizeReactions(message.reactions)[emoji] || []).includes(user.uid);
    try {
      const args = [new FieldPath("reactions", emoji), has ? arrayRemove(user.uid) : arrayUnion(user.uid)];
      if (has && message.reactions?.[user.uid] === emoji) args.push(new FieldPath("reactions", user.uid), deleteField());
      await updateDoc(doc(db, "conversations", activeId, "messages", message.id), ...args);
    } catch {
      setNotice("Could not add your reaction.");
    }
  };

  const toggleMute = async () => {
    if (!activeId || !user?.uid || muteLoading || muted === null) return;
    const next = !muted;
    const key = `${user.uid}:${activeId}`;
    setMuted(next);
    muteCache.set(key, next);
    try {
      await setDoc(doc(db, "users", user.uid, "conversationSettings", activeId), { muted: next, updatedAt: serverTimestamp() }, { merge: true });
    } catch {
      setMuted(!next);
      muteCache.set(key, !next);
      setNotice("Could not update notification settings.");
    }
  };

  const jumpToMessage = (id) => {
    const el = id ? document.getElementById(`msg-${id}`) : null;
    if (!el) {
      setNotice("That message is further up. Load earlier messages to see it.");
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("bg-indigo-500/20");
    setTimeout(() => el.classList.remove("bg-indigo-500/20"), 1200);
  };

  const openUser = async (item, knownProfile = null) => {
    setNotice("");
    setRequestTarget(null);

    const existing = conversations.find((c) => c.memberIds?.includes(item.id));
    if (existing) {
      setActiveId(existing.id);
      setActiveTab("chats");
      closeFind();
      return true;
    }

    let target = knownProfile;
    if (!target) {
      target = await getUserDoc(item.id);
      if (!target) {
        setNotice("User profile was not found.");
        return false;
      }
    }
    if (target.dmsDisabled) {
      setNotice("This user has turned off direct messages.");
      return false;
    }
    if (target.dmPolicy === "mutual_groups") {
      const key = `${user.uid}:${item.id}`;
      let result = mutualCache.get(key);
      if (!fresh(result, LONG_CACHE_TTL_MS)) {
        const [mine, theirs] = await Promise.all([
          getDocs(query(collection(db, "users", user.uid, "groups"), limit(20))),
          getDocs(query(collection(db, "users", item.id, "groups"), limit(20))),
        ]);
        const myGroups = new Set(mine.docs.map((entry) => entry.id));
        result = { at: Date.now(), value: theirs.docs.some((entry) => myGroups.has(entry.id)) };
        mutualCache.set(key, result);
      }
      if (!result.value) {
        setNotice("This user only accepts messages from people in a mutual group.");
        return false;
      }
    }

    try {
      const id = await startConversation(user, item, profile);
      setActiveId(id);
      setActiveTab("chats");
      closeFind();
      return true;
    } catch (error) {
      setNotice(error.message || "Could not open that conversation.");
      if (error.message?.includes("Become friends")) setRequestTarget({ ...item, ...target, id: item.id });
      return false;
    }
  };

  const replyPayload = (message) =>
    message
      ? { id: message.id, senderId: message.senderId || "", senderName: message.senderName || "Student", text: messagePreview(message) }
      : null;

  // Text sends are optimistic in the composer; this throws so it can restore the draft.
  const sendMessage = async ({ text: value, file: picked }) => {
    if (!activeConversation) throw new Error("This chat is still loading. Try again in a moment.");
    const reply = replyPayload(replyTo);
    stickRef.current = true;
    if (!picked) setReplyTo(null);
    const attachments = [];
    if (picked) {
      const resourceType = picked.type.startsWith("image/") ? "image" : picked.type.startsWith("video/") ? "video" : "raw";
      const uploaded = await uploadFeatureMedia(picked, { feature: "messages", resourceType });
      attachments.push({
        type: kindFor(picked),
        url: uploaded.url || uploaded.secure_url,
        publicId: uploaded.publicId || uploaded.public_id || uploaded.key || "",
        resourceType: uploaded.resourceType || uploaded.resource_type || resourceType,
        storageProvider: uploaded.storageProvider || "r2",
        name: picked.name,
        bytes: picked.size,
      });
    }
    await sendDirectMessage(activeConversation, user, profile, { text: value, attachments, replyTo: reply });
    if (picked) {
      setFile(null);
      setReplyTo(null);
    }
  };

  const sendVoice = async (audioFile, duration) => {
    if (!activeConversation) throw new Error("This chat is still loading.");
    const uploaded = await uploadVoiceMessage(audioFile, { conversationId: activeConversation.id, duration });
    if (!uploaded?.audioUrl) throw new Error("Voice upload did not return an audio file.");
    await sendDirectMessage(activeConversation, user, profile, {
      type: "voice",
      text: "",
      attachments: [],
      audioUrl: uploaded.audioUrl,
      duration: uploaded.duration || duration,
      audioBytes: uploaded.bytes || audioFile.size,
      audioMimeType: audioFile.type,
      publicId: uploaded.publicId || "",
      storageProvider: "r2",
      replyTo: replyPayload(replyTo),
    });
    setReplyTo(null);
    stickRef.current = true;
  };

  const sendSticker = async (sticker) => {
    if (!activeConversation || !sticker?.id) return;
    setNotice("");
    setStickerPickerOpen(false);
    stickRef.current = true;
    try {
      await sendDirectMessage(activeConversation, user, profile, {
        type: "sticker",
        stickerId: sticker.id,
        text: "",
        attachments: [],
        sticker: {
          id: sticker.id,
          name: sticker.name || "Sticker",
          type: sticker.type || "image",
          assetUrl: sticker.assetUrl || sticker.url || sticker.imageUrl || sticker.thumbnailUrl || "",
          thumbnailUrl: sticker.thumbnailUrl || sticker.imageUrl || sticker.url || "",
        },
      });
      stickerCache.delete("recent");
      postJson(`/api/stickers/${encodeURIComponent(sticker.id)}/use`, {}).catch((error) => console.error("Sticker use tracking failed:", error));
    } catch (err) {
      setNotice(err.message || "Sticker not sent.");
    }
  };

  const saveEditMessage = async (message, value) => {
    const trimmed = value.trim();
    if (!trimmed || !activeId) return false;
    if (trimmed === (message.text || "")) return true;
    if (!canEditMessage(message, user?.uid)) {
      setNotice("The 30 minute edit window has passed.");
      return true;
    }
    try {
      await updateDoc(doc(db, "conversations", activeId, "messages", message.id), { text: trimmed, edited: true, editedAt: serverTimestamp() });
      return true;
    } catch (err) {
      setNotice(err.message || "Could not save your edit.");
      return false;
    }
  };

  const confirmDelete = async () => {
    const message = pendingDelete;
    if (!message || !activeId) return;
    if (!canDeleteMessage(message, user?.uid)) {
      setNotice("Voice messages can only be deleted within 30 minutes of sending.");
      setPendingDelete(null);
      return;
    }
    setDeleting(true);
    try {
      if (message.type === "voice") {
        await deleteJson(`/api/voice/${encodeURIComponent(activeId)}/${encodeURIComponent(message.id)}`);
      } else {
        await updateDoc(doc(db, "conversations", activeId, "messages", message.id), {
          deleted: true,
          text: "",
          attachments: [],
          deletedAt: serverTimestamp(),
        });
      }
      setPendingDelete(null);
    } catch (err) {
      setNotice(err.message || "Could not delete the message.");
    } finally {
      setDeleting(false);
    }
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text || "");
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Could not copy the message.");
    }
  };

  // Friend requests
  const handleSendRequest = async (targetUser) => {
    setRequestSending(true);
    try {
      await sendFriendRequest({ currentUid: user.uid, targetUid: targetUser.id, currentProfile: profile, targetProfile: targetUser });
      setNotice("Friend request sent.");
      setRequestTarget(null);
    } catch (err) {
      setNotice(err.message || "Could not send the friend request.");
    } finally {
      setRequestSending(false);
    }
  };
  const handleAcceptRequest = async (request) => {
    try {
      await acceptFriendRequest({ request, currentUid: user.uid, currentProfile: profile });
      setNotice("You're now friends. Chat freely.");
    } catch (err) {
      setNotice(err.message || "Could not accept the request.");
    }
  };
  const handleDeclineRequest = async (request) => {
    try {
      await declineFriendRequest({ request, currentUid: user.uid, currentProfile: profile });
    } catch (err) {
      setNotice(err.message || "Could not decline the request.");
    }
  };
  const handleCancelRequest = async (request) => {
    try {
      await cancelFriendRequest({ requestId: request.id, currentUid: user.uid });
    } catch (err) {
      setNotice(err.message || "Could not cancel the request.");
    }
  };

  const openFriendChat = async (friend) => {
    const otherUid = getFriendUid(friend);
    if (!otherUid) return;
    await openUser({ id: otherUid, ...getFriendProfile(friend) });
  };

  // Stable handler bag so memoised rows are never re-rendered by parent state changes.
  const apiRef = useRef({});
  apiRef.current = {
    toggleReaction,
    reply: (message) => setReplyTo(message),
    copy: copyMessage,
    saveEdit: saveEditMessage,
    requestDelete: (message) => setPendingDelete(message),
    openReactions: (id) => setReactionViewerId(id),
    jumpTo: jumpToMessage,
  };
  const api = useMemo(
    () => ({
      toggleReaction: (...a) => apiRef.current.toggleReaction(...a),
      reply: (...a) => apiRef.current.reply(...a),
      copy: (...a) => apiRef.current.copy(...a),
      saveEdit: (...a) => apiRef.current.saveEdit(...a),
      requestDelete: (...a) => apiRef.current.requestDelete(...a),
      openReactions: (...a) => apiRef.current.openReactions(...a),
      jumpTo: (...a) => apiRef.current.jumpTo(...a),
      openLightbox: (item) => {
        setLightbox(item);
      },
    }),
    []
  );

  const clearSeed = useCallback(() => setSeedText(""), []);
  const clearFile = useCallback(() => setFile(null), []);
  const openStickers = useCallback(() => setStickerPickerOpen(true), []);
  const showNotice = useCallback((message) => setNotice(message), []);
  const cancelReply = useCallback(() => setReplyTo(null), []);

  /* --------------------------------- Render -------------------------------- */

  const iconBtn = `${iconBtnBase} ${t.hover}`;

  const renderToast = () =>
    notice ? (
      <div
        role="status"
        className={`mx-toast fixed left-1/2 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl ${
          dark ? "bg-white text-slate-900" : "bg-slate-900 text-white"
        }`}
      >
        <span className="min-w-0 flex-1">{notice}</span>
        {requestTarget && (
          <button
            onClick={() => handleSendRequest(requestTarget)}
            disabled={requestSending}
            className={`shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${focusRing}`}
          >
            {requestSending ? "Sending…" : "Send request"}
          </button>
        )}
        <button onClick={() => { setNotice(""); setRequestTarget(null); }} className={`shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 ${focusRing}`} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    ) : null;

  const renderTabBar = () => (
    <div className={`flex gap-1 rounded-2xl p-1 ${dark ? "bg-white/[0.05]" : "bg-slate-100"}`} role="tablist">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        const badge = tab.key === "requests" ? incomingRequests.length : tab.key === "chats" ? unreadTotal : 0;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => { setActiveTab(tab.key); setListFilter(""); }}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-semibold transition-all ${focusRing} ${isActive ? t.tabActive : t.tabInactive}`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-extrabold text-white">{badgeCount(badge)}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderListSearch = (placeholder) => (
    <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 ${t.input}`}>
      <Search size={16} className="shrink-0 opacity-50" />
      <input value={listFilter} onChange={(e) => setListFilter(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-10 w-full bg-transparent text-sm outline-none" />
      {listFilter && (
        <button onClick={() => setListFilter("")} className="opacity-60 hover:opacity-100" aria-label="Clear search"><X size={15} /></button>
      )}
    </div>
  );

  const renderSkeletonRows = () =>
    [0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="flex animate-pulse items-center gap-3 p-3">
        <div className={`h-12 w-12 rounded-full ${dark ? "bg-white/10" : "bg-slate-200"}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 w-1/2 rounded ${dark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className={`h-3 w-3/4 rounded ${dark ? "bg-white/5" : "bg-slate-100"}`} />
        </div>
      </div>
    ));

  const renderEmpty = (Icon, title, body, action) => (
    <div className={`mx-fade rounded-2xl border border-dashed p-8 text-center ${t.divider}`}>
      <Icon className="mx-auto opacity-40" size={36} />
      <p className="mt-3 font-bold">{title}</p>
      <p className={`mx-auto mt-1 max-w-xs text-sm ${t.muted}`}>{body}</p>
      {action}
    </div>
  );

  const renderChatsTab = () => {
    if (convLoading) return renderSkeletonRows();
    if (conversations.length === 0) {
      return renderEmpty(
        MessageCircle,
        "No conversations yet",
        "Find a student to say hello.",
        <button onClick={() => setShowFindModal(true)} className={`mt-4 h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 ${focusRing}`}>
          Find friends
        </button>
      );
    }
    if (filteredConversations.length === 0) return <p className={`py-10 text-center text-sm ${t.muted}`}>No chats match “{listFilter}”.</p>;
    return filteredConversations.map((item) => {
      const otherId = item.memberIds?.find((id) => id !== user?.uid);
      return (
        <ConversationItem key={item.id} item={item} uid={user?.uid} rel={relOf(otherId)} selected={activeId === item.id} dark={dark} onOpen={setActiveId} />
      );
    });
  };

  const renderFriendsTab = () => (
    <div>
      <p className={`mb-2 px-1 text-xs font-bold ${t.muted}`}>Your friends{friends.length > 0 ? ` (${friends.length})` : ""}</p>
      {friends.length === 0
        ? renderEmpty(Users, "No friends yet", "Add students to chat without limits.",
            <button onClick={() => setShowFindModal(true)} className={`mt-4 h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 ${focusRing}`}>Find friends</button>)
        : filteredFriends.length === 0
          ? <p className={`py-10 text-center text-sm ${t.muted}`}>No friends match “{listFilter}”.</p>
          : filteredFriends.map((friend) => {
              const p = getFriendProfile(friend);
              const friendUid = getFriendUid(friend);
              const name = p.name || p.username || "Student";
              const sub = [p.school || p.university, p.department].filter(Boolean).join(" · ");
              return (
                <div key={friend.id} className={`mb-1 flex items-center gap-1 rounded-2xl pr-1 transition-colors ${t.hover}`}>
                  <button onClick={() => openFriendChat(friend)} className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2.5 text-left ${focusRing}`}>
                    <Avatar src={pickAvatar(p)} name={name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{name}</p>
                      {sub && <p className={`truncate text-xs ${t.muted}`}>{sub}</p>}
                    </div>
                  </button>
                  <KebabMenu
                    dark={dark}
                    label={`Options for ${name}`}
                    items={[
                      { label: "Send message", icon: MessageCircle, onClick: () => openFriendChat(friend) },
                      { label: "View profile", icon: User2, to: friendUid ? `/profile/${friendUid}` : undefined, show: !!friendUid },
                    ]}
                  />
                </div>
              );
            })}
    </div>
  );

  const renderRequestRow = (request, kind) => {
    const p = (kind === "in" ? request.fromProfile : request.toProfile) || {};
    const name = p.name || p.username || "Student";
    const sub = p.school || p.university || p.department || (kind === "in" ? "Wants to connect" : "Waiting for a reply");
    return (
      <div key={request.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${t.soft}`}>
        <Avatar src={pickAvatar(p)} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{name}</p>
          <p className={`truncate text-xs ${t.muted}`}>{sub}</p>
        </div>
        {kind === "in" ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={() => handleAcceptRequest(request)} className={`flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 ${focusRing}`}>
              <UserCheck size={15} /> Accept
            </button>
            <button onClick={() => handleDeclineRequest(request)} className={`${iconBtn} border ${t.divider}`} aria-label={`Decline ${name}`} title="Decline">
              <UserX size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => handleCancelRequest(request)} className={`h-10 shrink-0 rounded-xl border px-3.5 text-xs font-bold ${t.divider} ${t.hover} ${focusRing}`}>
            Cancel
          </button>
        )}
      </div>
    );
  };

  const renderRequestsTab = () => {
    if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
      return renderEmpty(UserRoundPlus, "No pending requests", "Requests you send or receive show up here.");
    }
    return (
      <div className="space-y-6">
        {incomingRequests.length > 0 && (
          <section>
            <p className={`mb-2 px-1 text-xs font-bold ${t.muted}`}>Received ({incomingRequests.length})</p>
            <div className="space-y-2">{incomingRequests.map((r) => renderRequestRow(r, "in"))}</div>
          </section>
        )}
        {outgoingRequests.length > 0 && (
          <section>
            <p className={`mb-2 px-1 text-xs font-bold ${t.muted}`}>Sent ({outgoingRequests.length})</p>
            <div className="space-y-2">{outgoingRequests.map((r) => renderRequestRow(r, "out"))}</div>
          </section>
        )}
      </div>
    );
  };

  // Used by search results and suggestions. The row opens a chat; the button reflects the relationship.
  const renderPersonRow = (item) => {
    const name = pickName(item);
    const detail = item.school || item.department || item.email || "";
    const rel = relOf(item.id);
    return (
      <div key={item.id} className={`mb-1 flex items-center gap-1 rounded-2xl pr-2 transition-colors ${t.hover}`}>
        <button onClick={() => openUser(item)} className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2.5 text-left ${focusRing}`}>
          <Avatar src={pickAvatar(item)} name={name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{name}</p>
            {detail && <p className={`truncate text-xs ${t.muted}`}>{detail}</p>}
          </div>
        </button>
        {rel === "friend" ? (
          <span className={`flex shrink-0 items-center gap-1 px-2 text-xs font-bold ${t.muted}`}><Check size={14} /> Friends</span>
        ) : rel === "incoming" ? (
          <button onClick={() => handleAcceptRequest(incomingByUser.get(item.id))} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 ${focusRing}`}>
            <UserCheck size={14} /> Accept
          </button>
        ) : rel === "outgoing" ? (
          <span className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold ${t.divider} ${t.muted}`}><Clock size={14} /> Pending</span>
        ) : (
          <button onClick={() => handleSendRequest(item)} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 ${focusRing}`}>
            <UserPlus size={14} /> Add
          </button>
        )}
      </div>
    );
  };

  const renderFindModal = () => {
    if (!showFindModal) return null;
    return (
      <div className="mx-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={closeFind}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Find friends"
          className={`mx-sheet flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl ${t.sheet}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Find friends</h2>
            <button onClick={closeFind} className={iconBtn} aria-label="Close"><X size={20} /></button>
          </div>
          <div className={`mb-3 flex items-center gap-2 rounded-2xl border px-3 ${t.input}`}>
            <Search size={17} className="opacity-50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or school"
              className="h-11 w-full bg-transparent text-sm outline-none"
              autoFocus
            />
            {searching ? <Loader2 size={16} className="animate-spin opacity-50" /> : search && (
              <button onClick={() => setSearch("")} className="opacity-60 hover:opacity-100" aria-label="Clear search"><X size={16} /></button>
            )}
          </div>
          <div className="-mr-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            {results.length > 0 ? (
              results.map(renderPersonRow)
            ) : search.trim().length >= 2 ? (
              !searching && (
                <div className="py-10 text-center">
                  <Search className="mx-auto opacity-30" size={36} />
                  <p className={`mt-3 text-sm ${t.muted}`}>No students found for “{search.trim()}”.</p>
                </div>
              )
            ) : suggestions.length > 0 ? (
              <>
                <p className={`mb-2 px-1 text-xs font-bold ${t.muted}`}>Suggested for you</p>
                {suggestions.map(renderPersonRow)}
              </>
            ) : (
              <div className="py-10 text-center">
                <Users className="mx-auto opacity-30" size={36} />
                <p className={`mt-3 text-sm ${t.muted}`}>Type at least 2 characters to search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Slim banner under the header; the full request flow also lives in the header menu.
  const renderRelationshipBanner = () => {
    if (activeAreFriends || !activeOtherId) return null;
    const body = activeIncoming
      ? `${otherUser?.name || "This student"} wants to connect.`
      : activeOutgoing
        ? "Chat unlocks once they accept."
        : nonFriendMessageUsed
          ? "Intro message sent. Add as a friend to chat more."
          : "You can send one intro message before becoming friends.";
    return (
      <div className={`flex items-center justify-between gap-3 border-b px-3 py-2 text-xs sm:px-4 ${t.divider} ${t.accent}`}>
        <p className="min-w-0 flex-1 truncate font-semibold">{body}</p>
        {activeIncoming ? (
          <button onClick={() => handleAcceptRequest(activeIncoming)} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 ${focusRing}`}>
            <UserCheck size={13} /> Accept
          </button>
        ) : activeOutgoing ? (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold"><Clock size={13} /> Pending</span>
        ) : (
          <button
            onClick={() => handleSendRequest({ id: activeOtherId, uid: activeOtherId, ...(otherUser || {}) })}
            disabled={requestSending}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 ${focusRing}`}
          >
            <UserPlus size={13} /> Add friend
          </button>
        )}
      </div>
    );
  };

  const headerSubtitle = otherTyping
    ? "typing…"
    : activeAreFriends
      ? "Friend"
      : activeIncoming ? "Friend request received" : activeOutgoing ? "Friend request sent" : "Not friends yet";

  const renderChatHeader = () => {
    const identity = (
      <>
        <Avatar src={pickAvatar(otherUser)} name={otherUser?.name} size="md" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold sm:text-base">{otherUser?.name || "Student"}</h2>
          <p className={`truncate text-xs ${otherTyping ? "font-bold text-indigo-500" : t.muted}`}>{headerSubtitle}</p>
        </div>
      </>
    );
    return (
      <div className={`flex items-center gap-1 border-b px-2 py-2 sm:px-3 sm:py-2.5 ${t.divider}`}>
        <button onClick={() => setActiveId("")} className={`${iconBtn} md:hidden`} aria-label="Back to chats"><ArrowLeft size={20} /></button>
        {activeAreFriends && activeOtherId ? (
          <Link to={`/profile/${activeOtherId}`} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-0.5" title="View profile">{identity}</Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1">{identity}</div>
        )}
        <KebabMenu
          dark={dark}
          label="Chat options"
          onOpen={ensureMuteLoaded}
          items={[
            { label: "View profile", icon: User2, to: `/profile/${activeOtherId}`, show: activeAreFriends && !!activeOtherId },
            { label: "Add friend", icon: UserPlus, onClick: () => handleSendRequest({ id: activeOtherId, uid: activeOtherId, ...(otherUser || {}) }), show: activeRel === "none" },
            { label: "Accept friend request", icon: UserCheck, onClick: () => handleAcceptRequest(activeIncoming), show: !!activeIncoming },
            { label: "Cancel friend request", icon: X, onClick: () => handleCancelRequest(activeOutgoing), show: !!activeOutgoing },
            {
              label: muted ? "Unmute notifications" : "Mute notifications",
              icon: muted ? BellOff : Bell,
              toggle: muted === null ? false : !muted,
              disabled: muted === null,
              onClick: toggleMute,
              divider: true,
            },
          ]}
        />
      </div>
    );
  };

  const renderMessagesArea = () => (
    <div
      className="relative min-h-0 flex-1"
      onDragOver={(e) => {
        if (canUseComposer && e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); setDragOver(true); }
      }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (canUseComposer) stageFile(e.dataTransfer?.files?.[0]);
      }}
    >
      {dragOver && (
        <div className="mx-fade pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-500/10 text-sm font-bold text-indigo-500">
          Drop to attach
        </div>
      )}
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
        {messagesLoading && messages.length === 0 ? (
          <div className={`flex h-full items-center justify-center ${t.muted}`}><Loader2 className="animate-spin" size={22} /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Avatar src={pickAvatar(otherUser)} name={otherUser?.name} size="lg" className="mb-3 !h-16 !w-16 !text-2xl" />
            <p className="font-bold">No messages yet</p>
            <p className={`mt-1 text-sm ${t.muted}`}>Say hello to {otherUser?.name || "your new connection"}.</p>
          </div>
        ) : (
          <div ref={contentRef}>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button onClick={loadOlder} disabled={loadingOlder} className={`rounded-full border px-4 py-1.5 text-xs font-bold ${t.divider} ${t.hover} ${focusRing} disabled:opacity-60`}>
                  {loadingOlder ? "Loading…" : "Load earlier messages"}
                </button>
              </div>
            )}
            {rows.map((row) =>
              row.kind === "day" ? (
                <div key={row.id} className="flex justify-center pb-1 pt-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"}`}>{row.label}</span>
                </div>
              ) : (
                <MessageRow
                  key={row.message.id}
                  message={row.message}
                  mine={row.message.senderId === user?.uid}
                  grouped={row.grouped}
                  lastInGroup={row.lastInGroup}
                  unreadByOther={unreadMineIds.has(row.message.id)}
                  openUp={row.index >= messages.length - 3 && messages.length > 3}
                  senderName={row.message.senderName || otherUser?.name || "Student"}
                  senderAvatar={row.message.senderAvatar || pickAvatar(otherUser)}
                  dark={dark}
                  uid={user?.uid}
                  api={api}
                />
              )
            )}
            {otherTyping && (
              <div className="mx-fade mt-3 flex items-end gap-2">
                <Avatar src={pickAvatar(otherUser)} name={otherUser?.name} size="sm" />
                <div className={`flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3 ${t.bubble}`} aria-label="Typing">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      {showJump && (
        <button
          onClick={() => { stickRef.current = true; scrollToBottom("smooth"); }}
          className={`mx-pop absolute bottom-3 right-4 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg ${t.menu} ${focusRing}`}
          aria-label="Jump to latest message"
        >
          <ChevronDown size={18} />
          {unreadForMe > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-extrabold text-white">{badgeCount(unreadForMe)}</span>}
        </button>
      )}
    </div>
  );

  const renderStickerPicker = () => {
    if (!stickerPickerOpen) return null;
    const showingPacks = stickerTab === "packs" && !selectedPack;
    const emptyCopy = {
      mine: "Stickers you create will appear here.",
      recent: "Stickers you send will appear here.",
      favorites: "Favorite a sticker to find it quickly.",
      packs: "This pack has no stickers yet.",
    }[stickerTab];
    return (
      <div className="mx-fade fixed inset-0 z-50 bg-black/45" onClick={() => setStickerPickerOpen(false)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Stickers"
          className={`mx-sheet absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-3xl border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ${t.sheet}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-black">Stickers</p>
            <button onClick={() => setStickerPickerOpen(false)} className={iconBtn} aria-label="Close stickers"><X size={18} /></button>
          </div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 text-sm">
            {STICKER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStickerTab(tab.key); setSelectedPack(null); }}
                className={`shrink-0 rounded-full px-3.5 py-2 font-semibold transition-colors ${focusRing} ${
                  stickerTab === tab.key ? "bg-indigo-500 text-white" : dark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {stickerTab === "packs" && selectedPack && (
            <button onClick={() => setSelectedPack(null)} className={`mb-3 flex items-center gap-1.5 text-sm font-bold text-indigo-500 ${focusRing}`}>
              <ArrowLeft size={15} /> {selectedPack.name || "All packs"}
            </button>
          )}
          {stickerError && <div className={`mb-3 rounded-xl p-2 text-sm ${dark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-600"}`}>{stickerError}</div>}
          <div className="max-h-[45dvh] overflow-y-auto overscroll-contain">
            {showingPacks ? (
              stickerPacks.length === 0 ? (
                <div className={`flex min-h-28 items-center justify-center text-sm ${t.muted}`}>No packs available.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {stickerPacks.map((pack) => (
                    <button key={pack.id} onClick={() => setSelectedPack(pack)} className={`rounded-2xl border p-3 text-left ${t.soft} ${t.hover} ${focusRing}`}>
                      <p className="font-bold">{pack.name || "Sticker pack"}</p>
                      <p className={`mt-1 text-xs ${t.muted}`}>{pack.description || "Official pack"}</p>
                    </button>
                  ))}
                </div>
              )
            ) : stickerLoading ? (
              <div className={`flex min-h-28 items-center justify-center ${t.muted}`}><Loader2 className="animate-spin" size={22} /></div>
            ) : stickerItems.length === 0 ? (
              <div className={`flex min-h-28 items-center justify-center text-center text-sm ${t.muted}`}>{emptyCopy}</div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {stickerItems.map((sticker) => {
                  const image = sticker.thumbnailUrl || sticker.assetUrl || sticker.imageUrl || sticker.url || "";
                  return (
                    <button
                      key={sticker.id}
                      onClick={() => sendSticker(sticker)}
                      className={`flex aspect-square items-center justify-center rounded-2xl border p-2 transition active:scale-95 hover:border-indigo-400/60 hover:bg-indigo-500/10 ${t.soft} ${focusRing}`}
                      title={sticker.name || "Sticker"}
                    >
                      {image ? <img src={image} alt={sticker.name || "Sticker"} className="h-full w-full rounded-xl object-contain" loading="lazy" decoding="async" /> : <span className={`text-[10px] font-bold ${t.muted}`}>Sticker</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReactionViewer = () =>
    reactionViewer ? (
      <div className="mx-fade fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-3 sm:items-center" onClick={() => setReactionViewerId("")}>
        <section role="dialog" aria-modal="true" aria-label="Reactions" className={`mx-sheet w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${t.sheet}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-lg font-black">Reactions</p>
            <button onClick={() => setReactionViewerId("")} className={iconBtn} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="mt-3 max-h-[55dvh] space-y-1 overflow-y-auto">
            {reactionViewer.people.length ? reactionViewer.people.map((person) => (
              <div key={person.id} className="flex items-center gap-3 rounded-2xl p-2">
                <Avatar src={person.avatar} name={person.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{person.name}</span>
                <span className="text-lg">{person.emojis.join("")}</span>
              </div>
            )) : <p className={`py-8 text-center text-sm ${t.muted}`}>No reactions yet.</p>}
          </div>
        </section>
      </div>
    ) : null;

  const renderDeleteConfirm = () =>
    pendingDelete ? (
      <div className="mx-fade fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-3 sm:items-center" onClick={() => !deleting && setPendingDelete(null)}>
        <section role="alertdialog" aria-modal="true" aria-label="Delete message" className={`mx-sheet w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${t.sheet}`} onClick={(e) => e.stopPropagation()}>
          <p className="text-lg font-black">Delete message?</p>
          <p className={`mt-1 text-sm ${t.muted}`}>It will be removed for everyone in this chat. This can't be undone.</p>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setPendingDelete(null)} disabled={deleting} className={`h-11 flex-1 rounded-xl border text-sm font-bold ${t.divider} ${t.hover} ${focusRing}`}>Cancel</button>
            <button onClick={confirmDelete} disabled={deleting} className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-70 ${focusRing}`}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
            </button>
          </div>
        </section>
      </div>
    ) : null;

  const renderMain = () => {
    if (activeConversation) {
      const replyLabel = replyTo?.senderId === user?.uid ? "yourself" : replyTo?.senderName || otherUser?.name || "Student";
      return (
        <>
          {renderChatHeader()}
          {renderRelationshipBanner()}
          {renderMessagesArea()}
          <Composer
            key={activeId}
            dark={dark}
            activeId={activeId}
            uid={user?.uid}
            typingName={profile.username || user?.displayName || "Student"}
            canUse={canUseComposer}
            areFriends={activeAreFriends}
            replyTo={replyTo}
            replyLabel={replyLabel}
            onCancelReply={cancelReply}
            file={file}
            onStageFile={stageFile}
            onClearFile={clearFile}
            onSend={sendMessage}
            onSendVoice={sendVoice}
            onOpenStickers={openStickers}
            onNotice={showNotice}
            seedText={seedText}
            onSeedUsed={clearSeed}
          />
        </>
      );
    }
    if (activeId) {
      return (
        <>
          <div className={`flex items-center gap-2 border-b p-2 ${t.divider}`}>
            <button onClick={() => setActiveId("")} className={`${iconBtn} md:hidden`} aria-label="Back to chats"><ArrowLeft size={20} /></button>
          </div>
          <div className={`flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center ${t.muted}`}>
            {openFailed ? (
              <>
                <MessageCircle size={40} className="opacity-40" />
                <p className="font-bold">Conversation not found</p>
                <button onClick={() => setActiveId("")} className={`h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white ${focusRing}`}>Back to chats</button>
              </>
            ) : (
              <>
                <Loader2 className="animate-spin" size={24} />
                <p className="text-sm">Opening conversation…</p>
              </>
            )}
          </div>
        </>
      );
    }
    return (
      <div className="hidden flex-1 items-center justify-center p-8 text-center md:flex">
        <div>
          <MessageCircle className="mx-auto opacity-35" size={54} />
          <h2 className="mt-4 text-2xl font-black">Choose a conversation</h2>
          <p className={`mt-2 text-sm ${t.muted}`}>Pick a chat from the list or find someone new to talk to.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button onClick={() => setShowFindModal(true)} className={`flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 ${focusRing}`}>
              <UserPlus size={16} /> Find friends
            </button>
            {incomingRequests.length > 0 && (
              <button onClick={() => setActiveTab("requests")} className={`h-11 rounded-xl border px-5 text-sm font-bold ${t.divider} ${t.hover} ${focusRing}`}>
                {incomingRequests.length} pending {incomingRequests.length === 1 ? "request" : "requests"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-[100dvh] overflow-hidden ${t.page}`}>
      <style>{MOTION_CSS}</style>
      {renderToast()}

      <div className="mx-auto grid h-full max-w-[1400px] grid-cols-1 gap-0 sm:gap-4 sm:px-4 sm:py-3 md:grid-cols-[320px_minmax(0,1fr)] md:px-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        {/* Left panel: lists. Full screen on phones until a chat is opened. */}
        <aside className={`relative ${activeId ? "hidden" : "flex"} flex-col overflow-hidden rounded-none border-0 md:flex sm:rounded-3xl sm:border ${PANEL_H} ${t.panel}`}>
          <div className={`border-b p-3 sm:p-4 ${t.divider}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1">
                <h1 className="text-xl font-black sm:text-2xl">Messages</h1>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowFindModal(true)} className={`${iconBtnBase} hidden bg-indigo-600 text-white hover:bg-indigo-700 md:flex`} aria-label="New chat" title="New chat">
                  <Plus size={20} />
                </button>
                <KebabMenu
                  dark={dark}
                  label="Messages options"
                  items={[
                    { label: "Find friends", icon: UserPlus, onClick: () => setShowFindModal(true) },
                    { label: "Messaging settings", icon: Settings, to: "/community-settings" },
                  ]}
                />
              </div>
            </div>
            <div className="mt-3">{renderTabBar()}</div>
            {activeTab === "chats" && conversations.length > 4 && renderListSearch("Search chats")}
            {activeTab === "friends" && friends.length > 4 && renderListSearch("Search friends")}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pb-24 md:pb-3">
            {activeTab === "chats" && renderChatsTab()}
            {activeTab === "friends" && renderFriendsTab()}
            {activeTab === "requests" && renderRequestsTab()}
          </div>

          {/* Phone-only shortcut to start a chat */}
          <button
            onClick={() => setShowFindModal(true)}
            className={`absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl transition-transform active:scale-95 hover:bg-indigo-700 md:hidden ${focusRing}`}
            aria-label="New chat"
          >
            <Plus size={24} />
          </button>
        </aside>

        {/* Right panel: chat. Full screen on phones once a chat is open. */}
        <main className={`${activeId ? "flex" : "hidden"} flex-col overflow-hidden rounded-none border-0 md:flex sm:rounded-3xl sm:border ${PANEL_H} ${t.panel}`}>
          <div key={activeId || "empty"} className="mx-slide flex min-h-0 flex-1 flex-col">{renderMain()}</div>
        </main>
      </div>

      {renderStickerPicker()}
      {renderFindModal()}
      {renderReactionViewer()}
      {renderDeleteConfirm()}

      {lightbox && (
        <div
          className="mx-fade fixed inset-0 z-[70] overflow-hidden bg-[#08090d] text-white"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${lightbox.type === "image" ? "Image" : lightbox.type === "video" ? "Video" : "Attachment"} preview`}
        >
          <header
            onClick={(event) => event.stopPropagation()}
            className="fixed inset-x-0 top-0 z-10 flex min-h-16 items-center gap-3 bg-gradient-to-b from-black/75 to-transparent px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5"
          >
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close attachment preview"
              onClick={() => setLightbox(null)}
            >
              <X size={22} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{lightbox.name || "Attachment"}</p>
              <p className="text-xs text-white/65">
                {lightbox.type === "image" ? "Photo" : lightbox.type === "video" ? "Video" : "File"}
              </p>
            </div>
          </header>
          <div className="fixed inset-0 flex items-center justify-center overflow-hidden p-2 pt-20 sm:px-6 sm:pb-6 sm:pt-20">
            {lightbox.type === "image" ? (
              <img
                src={lightbox.url}
                alt={lightbox.name || "Image"}
                onClick={(event) => event.stopPropagation()}
                className="h-full w-full select-none object-contain"
                draggable="false"
              />
            ) : lightbox.type === "video" ? (
              <video
                src={lightbox.url}
                controls
                playsInline
                preload="metadata"
                onClick={(event) => event.stopPropagation()}
                className="h-full w-full bg-black object-contain"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <iframe
                src={lightbox.url}
                title={lightbox.name || "Attachment preview"}
                onClick={(event) => event.stopPropagation()}
                className="h-full w-full border-0 bg-white"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}