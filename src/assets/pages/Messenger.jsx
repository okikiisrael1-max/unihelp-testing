import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Mic,
  MoreVertical,
  Pause,
  Paperclip,
  Pencil,
  Play,
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
  XCircle,
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
/*  Constants & helpers                                                       */
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

const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const TYPING_STALE_MS = 6000;
const PAGE_SIZE = 30;
const CACHE_TTL_MS = 5 * 60 * 1000;
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Direct messages use the same `{ emoji: [userId] }` reaction format as mobile.
// The fallback also keeps existing web-only `{ userId: emoji }` reactions visible.
const normalizeReactions = (reactions = {}) =>
  Object.entries(reactions || {}).reduce((result, [key, value]) => {
    if (Array.isArray(value)) {
      result[key] = [...new Set(value.filter(Boolean))];
    } else if (typeof value === "string" && value) {
      result[value] = [...new Set([...(result[value] || []), key])];
    }
    return result;
  }, {});

// Module-level caches survive remounts, so revisiting Messenger doesn't re-read the same docs.
const profileCache = new Map(); // uid -> { at, data }
const userDocCache = new Map(); // uid -> { at, data }
const mutualCache = new Map(); // `${me}:${other}` -> { at, value }
const searchCache = new Map(); // `${me}:${query}` -> { at, list }
const suggestionCache = { uid: "", at: 0, list: [] };
const fresh = (entry) => !!entry && Date.now() - entry.at < CACHE_TTL_MS;

// Panel heights: full screen on phones, fits under the nav offset on larger screens.
const PANEL_H =
  "h-[calc(100dvh-var(--nav-offset,0px))] sm:h-[calc(100dvh-1.5rem-var(--nav-offset,0px))]";

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
  muted: dark ? "text-slate-400" : "text-slate-500",
  divider: dark ? "border-white/10" : "border-slate-200",
  hover: dark ? "hover:bg-white/10" : "hover:bg-slate-100",
  tabActive: dark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700",
  tabInactive: dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800",
  menu: dark ? "border-white/10 bg-[#0f1729] text-white" : "border-slate-200 bg-white text-slate-900",
  sheet: dark ? "bg-[#0b1224] text-white border-white/10" : "bg-white text-slate-900 border-slate-200",
});

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0";

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

const stickerLabel = (item) => item?.name || "Sticker";

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
    .sort((left, right) => (toDate(right.updatedAt)?.getTime() || 0) - (toDate(left.updatedAt)?.getTime() || 0));

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

const firstLetter = (name = "Student") => name.trim().charAt(0).toUpperCase() || "S";
const pickAvatar = (obj) => obj?.avatar || obj?.photo || "";
const pickName = (obj) => obj?.username || obj?.name || obj?.email || "Student";
const badgeCount = (n) => (n > 99 ? "99+" : String(n));

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-base",
  lg: "h-12 w-12 text-lg",
};

const Avatar = ({ src, name, size = "md", className = "" }) => (
  <div
    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 font-extrabold text-white ${SIZES[size]} ${className}`}
    title={name || "Student"}
  >
    {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : firstLetter(name)}
  </div>
);

const Attachment = ({ item, onOpen }) => {
  if (item.type === "image") {
    return (
      <button type="button" onClick={() => onOpen?.(item)} className="mt-2 block w-full" aria-label="View image">
        <img src={item.url} alt={item.name || "Image"} className="max-h-72 w-full rounded-xl object-cover" loading="lazy" />
      </button>
    );
  }
  if (item.type === "video") {
    return <video src={item.url} controls className="mt-2 max-h-72 w-full rounded-xl bg-black" />;
  }
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2.5 text-sm font-bold"
    >
      <FileText size={17} className="shrink-0" />
      <span className="truncate">{item.name || "Open file"}</span>
    </a>
  );
};

const formatVoiceDuration = (seconds = 0) => {
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

const isPremiumActive = (profile = {}) => {
  if (!profile.premium || profile.subscriptionStatus === "expired") return false;
  const expiry = profile.subscriptionExpiresAt || profile.premiumExpiresAt;
  const expiryDate = toDate(expiry);
  return !expiryDate || expiryDate.getTime() > Date.now();
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
      // The browser can reject playback until the user has interacted with the page.
    }
  };

  return (
    <div className="flex min-w-[210px] items-center gap-2 py-1">
      <audio
        ref={audioRef}
        src={message.audioUrl}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : Number(message.duration) || 0)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.duration ? event.currentTarget.currentTime / event.currentTarget.duration : 0)}
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

const VoiceRecorder = ({ isPremium, disabled, onSend, onUpgrade, onError, onStateChange }) => {
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

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

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
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const start = async () => {
    if (disabled || state !== "idle") return;
    if (!isPremium) {
      onUpgrade?.();
      return;
    }
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
      onError?.(error.name === "NotAllowedError" ? "Microphone access is required to record a voice message." : "Could not start voice recording.");
    }
  };

  if (state === "recording") {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-rose-500/10 px-3 py-1.5 text-rose-600">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" />
        <span className="w-10 text-xs font-black tabular-nums">{formatVoiceDuration(elapsed / 1000)}</span>
        <div className="flex min-w-0 flex-1 items-center gap-1" aria-label="Recording waveform">
          {Array.from({ length: 16 }, (_, index) => <span key={index} style={{ height: 7 + ((index * 11) % 14), animationDelay: `${index * 75}ms` }} className="w-1 animate-pulse rounded-full bg-rose-500" />)}
        </div>
        <button type="button" onClick={() => finish(true)} className="rounded-lg p-1.5 hover:bg-rose-500/10" aria-label="Cancel voice recording"><Trash2 size={17} /></button>
        <button type="button" onClick={() => finish(false)} className="rounded-lg bg-rose-500 p-1.5 text-white hover:bg-rose-600" aria-label="Send voice message"><Send size={17} /></button>
      </div>
    );
  }
  if (state === "uploading") {
    return <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm font-bold text-indigo-600"><Loader2 size={17} className="animate-spin" /> Uploading voice message…</div>;
  }
  return <button type="button" onClick={start} disabled={disabled} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-indigo-500/10 disabled:opacity-40" aria-label={isPremium ? "Record voice message" : "Voice messages are a Premium feature"} title={isPremium ? "Record voice message" : "Voice messages are a Premium feature"}><Mic size={19} /></button>;
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function Messenger({ dark = false }) {
  const t = theme(dark);
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState({});
  const [activeTab, setActiveTab] = useState("chats");

  // Chats
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeId, setActiveId] = useState("");
  const [openFailed, setOpenFailed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceRecorderState, setVoiceRecorderState] = useState("idle");
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
  const [conversationSettingsOpen, setConversationSettingsOpen] = useState(false);
  const [conversationMuted, setConversationMuted] = useState(false);
  const [conversationSettingsLoading, setConversationSettingsLoading] = useState(false);
  const [reactionViewer, setReactionViewer] = useState(null);

  // Emoji + stickers
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [stickerTab, setStickerTab] = useState("mine");
  const [selectedPack, setSelectedPack] = useState(null);
  const [stickerPacks, setStickerPacks] = useState([]);
  const [stickerItems, setStickerItems] = useState([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [stickerError, setStickerError] = useState("");

  // Message actions
  const [openMenuId, setOpenMenuId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editText, setEditText] = useState("");

  // Friends / requests
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Find friends
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [rawSuggestions, setRawSuggestions] = useState([]);
  const [showFindModal, setShowFindModal] = useState(false);

  // Refs
  const openedUserRef = useRef("");
  const openedConversationRef = useRef("");
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const stickRef = useRef(true);
  const firstLoadRef = useRef(true);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);
  const typingRef = useRef(false);
  const typingConvRef = useRef("");
  const typingTimerRef = useRef(null);
  const messageMapRef = useRef(new Map());
  const oldestDocRef = useRef(null);
  const skipScrollRef = useRef(false);
  const navigate = useNavigate();

  /* ------------------------------ Derived data ----------------------------- */

  const getFriendUid = (friend) => friend.users?.find((id) => id !== user?.uid) || "";
  const getFriendProfile = (friend) => {
    const otherUid = getFriendUid(friend);
    return otherUid ? friend.profiles?.[otherUid] || {} : {};
  };

  const friendIds = useMemo(() => {
    const ids = new Set();
    friends.forEach((friend) => {
      friend.users?.forEach?.((id) => {
        if (id !== user?.uid) ids.add(id);
      });
    });
    return ids;
  }, [friends, user?.uid]);

  const incomingRequestByUser = useMemo(() => {
    const map = new Map();
    incomingRequests.forEach((request) => request.from && map.set(request.from, request));
    return map;
  }, [incomingRequests]);

  const outgoingRequestByUser = useMemo(() => {
    const map = new Map();
    outgoingRequests.forEach((request) => request.to && map.set(request.to, request));
    return map;
  }, [outgoingRequests]);

  // Suggestions are fetched once (cached) and filtered locally, so relationship changes cost no reads.
  const suggestions = useMemo(
    () =>
      rawSuggestions
        .filter(
          (u) =>
            u.id &&
            u.id !== user?.uid &&
            !friendIds.has(u.id) &&
            !incomingRequestByUser.has(u.id) &&
            !outgoingRequestByUser.has(u.id)
        )
        .slice(0, 8),
    [rawSuggestions, friendIds, incomingRequestByUser, outgoingRequestByUser, user?.uid]
  );

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) || null,
    [activeId, conversations]
  );

  const activeOtherId = useMemo(() => {
    if (!activeConversation || !user?.uid) return "";
    return activeConversation.memberIds?.find((id) => id !== user.uid) || "";
  }, [activeConversation, user?.uid]);

  const otherUser = useMemo(
    () => (activeConversation && activeOtherId ? activeConversation.memberInfo?.[activeOtherId] || null : null),
    [activeConversation, activeOtherId]
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.unread?.[user?.uid] || 0), 0),
    [conversations, user?.uid]
  );

  const unreadForMe = Number(activeConversation?.unread?.[user?.uid] || 0);

  const filteredConversations = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((item) => {
      const otherId = item.memberIds?.find((id) => id !== user?.uid);
      const name = (item.memberInfo?.[otherId]?.name || "").toLowerCase();
      return name.includes(q) || (item.lastMessage || "").toLowerCase().includes(q);
    });
  }, [conversations, listFilter, user?.uid]);

  const filteredFriends = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((friend) => {
      const p = getFriendProfile(friend);
      return [p.name, p.username, p.school, p.university, p.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, listFilter, user?.uid]);

  const getRelationshipLabel = (peerId) => {
    if (!peerId || friendIds.has(peerId)) return null;
    if (incomingRequestByUser.has(peerId)) return { text: "Friend request received", icon: UserRoundPlus, tone: "info" };
    if (outgoingRequestByUser.has(peerId)) return { text: "Friend request sent", icon: Clock, tone: "info" };
    return { text: "Not friends yet", icon: UserPlus, tone: "warning" };
  };

  const activeRelationshipLabel = getRelationshipLabel(activeOtherId);
  const activeIncomingRequest = activeOtherId ? incomingRequestByUser.get(activeOtherId) : null;
  const activeOutgoingRequest = activeOtherId ? outgoingRequestByUser.get(activeOtherId) : null;
  const activeAreFriends = !activeOtherId || friendIds.has(activeOtherId);
  const nonFriendMessageUsed = !activeAreFriends && Number(activeConversation?.messageCount || 0) >= 1;
  const canUseComposer = activeAreFriends || !nonFriendMessageUsed;
  const voiceComposerActive = voiceRecorderState !== "idle";
  const canRecordVoice = isPremiumActive(profile);

  // Which of my messages the other person has not read yet.
  const unreadMineIds = useMemo(() => {
    const count = Number(activeConversation?.unread?.[activeOtherId] || 0);
    if (!count) return new Set();
    const mine = messages.filter((m) => m.senderId === user?.uid && !m.deleted);
    return new Set(mine.slice(-count).map((m) => m.id));
  }, [activeConversation, activeOtherId, messages, user?.uid]);

  // Messages + day separators + grouping of consecutive messages
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

  /* -------------------------------- Effects -------------------------------- */

  // Profile
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
  }, [user?.uid]);

  // Keep this query index-free. Combining `array-contains` with `orderBy` needs a
  // composite Firestore index; if it is missing, the entire conversation list fails.
  // Sorting locally also matches the mobile client's conversation behaviour.
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setConvLoading(false);
      return undefined;
    }

    let isMounted = true;
    setConvLoading(true);
    const q = query(
      collection(db, "conversations"),
      where("memberIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!isMounted) return;
        setConversations(sortVisibleConversations(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })), user.uid));
        setConvLoading(false);
      },
      (error) => {
        if (!isMounted) return;
        console.error("Unable to load conversations:", error);
        setConversations([]);
        setConvLoading(false);
        setNotice("Could not load your conversations. Please refresh and try again.");
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.uid]);

  // If a conversation id never resolves, stop showing a spinner.
  useEffect(() => {
    setOpenFailed(false);
    if (!activeId || activeConversation) return undefined;
    const timer = setTimeout(() => setOpenFailed(true), 6000);
    return () => clearTimeout(timer);
  }, [activeId, activeConversation]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!notice || requestTarget) return undefined;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice, requestTarget]);

  // Sticker packs (once per session of the picker)
  useEffect(() => {
    if (!stickerPickerOpen || !user?.uid || stickerPacks.length > 0) return;
    let cancelled = false;
    getJson("/api/stickers/packs")
      .then((packs) => !cancelled && setStickerPacks(packs?.data || []))
      .catch((error) => !cancelled && setStickerError(error.message || "Could not load sticker packs."));
    return () => { cancelled = true; };
  }, [stickerPickerOpen, user?.uid, stickerPacks.length]);

  // Sticker items for the current tab
  useEffect(() => {
    if (!stickerPickerOpen) return undefined;
    if (stickerTab === "packs" && !selectedPack) {
      setStickerItems([]);
      return undefined;
    }
    let cancelled = false;

    const load = async () => {
      try {
        setStickerLoading(true);
        setStickerError("");
        let data = [];
        if (stickerTab === "recent") data = (await getJson("/api/stickers/recent"))?.data || [];
        else if (stickerTab === "favorites") data = (await getJson("/api/stickers/favorites"))?.data || [];
        else if (stickerTab === "mine") data = (await getJson("/api/stickers?owner=me"))?.data || [];
        else data = (await getJson(`/api/stickers?packId=${encodeURIComponent(selectedPack.id)}`))?.data || [];
        if (!cancelled) setStickerItems(data);
      } catch (error) {
        if (!cancelled) setStickerError(error.message || "Could not load stickers.");
      } finally {
        if (!cancelled) setStickerLoading(false);
      }
    };

    load();
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
            if (initialMessage) setText(initialMessage);
            setSearchParams({}, { replace: true });
          })
          .catch(() => setNotice("Could not open that conversation."));
      })
      .catch(() => setNotice("Could not open that conversation."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams, user?.uid, activeId]);

  // Messages: ONE live listener on the newest page; older pages load on demand.
  // (Before, the list was fetched AND listened to, so every open cost double.)
  useEffect(() => {
    messageMapRef.current = new Map();
    oldestDocRef.current = null;
    setMessages([]);
    setHasMore(false);
    if (!activeId || !user?.uid) return undefined;

    firstLoadRef.current = true;
    stickRef.current = true;
    setMessagesLoading(true);
    setShowJump(false);

    let first = true;
    const q = query(
      collection(db, "conversations", activeId, "messages"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
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

  // Shared with the mobile conversation-settings screen.
  useEffect(() => {
    setConversationMuted(false);
    setConversationSettingsLoading(false);
    if (!activeId || !user?.uid) return undefined;
    let cancelled = false;
    setConversationSettingsLoading(true);
    getDoc(doc(db, "users", user.uid, "conversationSettings", activeId))
      .then((snap) => {
        if (!cancelled) setConversationMuted(Boolean(snap.data()?.muted));
      })
      .catch(() => {
        if (!cancelled) setNotice("Could not load conversation settings.");
      })
      .finally(() => {
        if (!cancelled) setConversationSettingsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeId, user?.uid]);

  // Mark as read only when there is something unread (no write on every snapshot).
  useEffect(() => {
    if (!activeId || !user?.uid || unreadForMe === 0) return undefined;
    const mark = () => {
      if (document.visibilityState === "visible") markConversationRead(activeId, user.uid).catch(() => {});
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [activeId, user?.uid, unreadForMe]);

  // Keep the view pinned to the newest message, unless the reader scrolled up.
  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (stickRef.current || last.senderId === user?.uid) {
      scrollToBottom(firstLoadRef.current ? "auto" : "smooth");
    } else {
      setShowJump(true);
    }
    firstLoadRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Reset per-chat UI whenever the open chat changes
  useEffect(() => {
    setOpenMenuId("");
    setEditingId("");
    setEditText("");
    setReplyTo(null);
    setEmojiOpen(false);
    setConversationSettingsOpen(false);
    setReactionViewer(null);
    return () => stopTyping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Close the message menu on outside click
  useEffect(() => {
    if (!openMenuId) return undefined;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpenMenuId("");
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  // Escape closes the top-most layer
  useEffect(() => {
    const handler = (event) => {
      if (event.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else if (reactionViewer) setReactionViewer(null);
      else if (conversationSettingsOpen) setConversationSettingsOpen(false);
      else if (stickerPickerOpen) setStickerPickerOpen(false);
      else if (emojiOpen) setEmojiOpen(false);
      else if (showFindModal) closeFind();
      else if (openMenuId) setOpenMenuId("");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, reactionViewer, conversationSettingsOpen, stickerPickerOpen, emojiOpen, showFindModal, openMenuId]);

  // Lock page scroll behind modals
  useEffect(() => {
    if (!showFindModal && !stickerPickerOpen && !conversationSettingsOpen && !reactionViewer) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [showFindModal, stickerPickerOpen, conversationSettingsOpen, reactionViewer]);

  // Search users: 400ms debounce + 5 min cache per query
  useEffect(() => {
    const value = search.trim();
    if (value.length < 2 || !user?.uid) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const key = `${user.uid}:${value}`;
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
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, user?.uid]);

  // Suggestions: fetched once per open and cached; filtering happens locally (see `suggestions`).
  useEffect(() => {
    if (!showFindModal || !user?.uid) return undefined;
    if (suggestionCache.uid === user.uid && fresh(suggestionCache)) {
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

  // Other person's typing indicator
  useEffect(() => {
    setOtherTyping(false);
    if (!activeId || !activeOtherId) return undefined;
    let timer;
    const unsubscribe = onSnapshot(
      doc(db, "conversations", activeId, "typing", activeOtherId),
      (snap) => {
        clearTimeout(timer);
        const data = snap.data();
        const at = toDate(data?.updatedAt);
        const fresh = !at || Date.now() - at.getTime() < TYPING_STALE_MS;
        const active = !!data?.active && fresh;
        setOtherTyping(active);
        if (active) timer = setTimeout(() => setOtherTyping(false), TYPING_STALE_MS);
      },
      () => {}
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [activeId, activeOtherId]);

  // Friends & requests
  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenFriends(user.uid, setFriends);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenIncomingFriendRequests(user.uid, setIncomingRequests);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenOutgoingFriendRequests(user.uid, setOutgoingRequests);
  }, [user?.uid]);

  // Auto-grow the composer
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text, activeId]);

  // Image preview for the staged file
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setFilePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* -------------------------------- Actions -------------------------------- */

  function scrollToBottom(behavior = "smooth") {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior, block: "end" }), 40);
    setShowJump(false);
  }

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distance < 120;
    setShowJump(distance > 300);
  };

  function writeTyping(convId, active) {
    if (!convId || !user?.uid) return;
    const payload = active
      ? { active: true, name: profile.username || user.displayName || "Student", updatedAt: serverTimestamp() }
      : { active: false, updatedAt: serverTimestamp() };
    setDoc(doc(db, "conversations", convId, "typing", user.uid), payload, { merge: true }).catch(() => {});
  }

  function stopTyping() {
    clearTimeout(typingTimerRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      writeTyping(typingConvRef.current, false);
    }
  }

  const handleTextChange = (value) => {
    setText(value);
    if (!activeId) return;
    if (!typingRef.current) {
      typingRef.current = true;
      typingConvRef.current = activeId;
      writeTyping(activeId, true);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 1500);
  };

  const stageFile = (picked) => {
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) {
      setNotice("That file is larger than 25 MB. Choose a smaller file.");
      return;
    }
    setFile(picked);
  };

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  const getUserDoc = async (id) => {
    const cached = userDocCache.get(id);
    if (fresh(cached)) return cached.data;
    const snap = await getDoc(doc(db, "users", id));
    if (!snap.exists()) return null;
    userDocCache.set(id, { at: Date.now(), data: snap.data() });
    return snap.data();
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
      requestAnimationFrame(() => {
        if (el) el.scrollTop += el.scrollHeight - prevHeight;
      });
    } catch {
      setNotice("Could not load earlier messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const toggleReaction = async (message, emoji) => {
    setOpenMenuId("");
    if (!activeId || !user?.uid) return;
    try {
      const messageRef = doc(db, "conversations", activeId, "messages", message.id);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(messageRef);
        if (!snap.exists()) throw new Error("This message no longer exists.");
        const reactions = normalizeReactions(snap.data().reactions);
        const current = reactions[emoji] || [];
        const next = current.includes(user.uid)
          ? current.filter((id) => id !== user.uid)
          : [...current, user.uid];
        if (next.length) reactions[emoji] = next;
        else delete reactions[emoji];
        transaction.update(messageRef, { reactions });
      });
    } catch {
      setNotice("Could not add your reaction.");
    }
  };

  const updateConversationMuted = async (muted) => {
    if (!activeId || !user?.uid || conversationSettingsLoading) return;
    const previous = conversationMuted;
    setConversationMuted(muted);
    setConversationSettingsLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid, "conversationSettings", activeId),
        { muted, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch {
      setConversationMuted(previous);
      setNotice("Could not update conversation settings.");
    } finally {
      setConversationSettingsLoading(false);
    }
  };

  const openReactionViewer = async (reactions, title = "Reactions") => {
    const normalized = normalizeReactions(reactions);
    const reactorIds = [...new Set(Object.values(normalized).flat())];
    setReactionViewer({ title, reactions: normalized, people: [], loading: true });
    try {
      const people = (await Promise.all(reactorIds.map(async (id) => {
        if (id === user?.uid) return { id, ...profile };
        const data = await getUserDoc(id);
        return data ? { id, ...data } : { id };
      }))).map((person) => ({
        ...person,
        name: person.name || person.username || person.displayName || "Student",
        avatar: person.avatar || person.photo || person.photoURL || "",
        emojis: Object.entries(normalized)
          .filter(([, ids]) => ids.includes(person.id))
          .map(([emoji]) => emoji),
      }));
      setReactionViewer({ title, reactions: normalized, people, loading: false });
    } catch {
      setReactionViewer({ title, reactions: normalized, people: [], loading: false });
      setNotice("Could not load everyone who reacted.");
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

  const closeFind = () => {
    setShowFindModal(false);
    setSearch("");
    setResults([]);
  };

  const openUser = async (item, knownProfile = null) => {
    setNotice("");
    setRequestTarget(null);

    // Already chatting with them? Open it with zero reads.
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
      if (!fresh(result)) {
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
      if (error.message?.includes("Become friends")) {
        setRequestTarget({ ...item, ...target, id: item.id });
      }
      return false;
    }
  };

  const send = async () => {
    if (!activeConversation || sending || (!text.trim() && !file)) return;
    setSending(true);
    setNotice("");
    stopTyping();
    try {
      const attachments = [];
      if (file) {
        const resourceType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "raw";
        const uploaded = await uploadFeatureMedia(file, { feature: "messages", resourceType });
        attachments.push({
          type: kindFor(file),
          url: uploaded.url || uploaded.secure_url,
          publicId: uploaded.publicId || uploaded.public_id || uploaded.key || "",
          resourceType: uploaded.resourceType || uploaded.resource_type || resourceType,
          storageProvider: uploaded.storageProvider || "r2",
          name: file.name,
          bytes: file.size,
        });
      }
      await sendDirectMessage(activeConversation, user, profile, {
        text: text.trim(),
        attachments,
        replyTo: replyTo
          ? {
              id: replyTo.id,
              senderId: replyTo.senderId || "",
              senderName: replyTo.senderName || "Student",
              text: messagePreview(replyTo),
            }
          : null,
      });
      setText("");
      setFile(null);
      setReplyTo(null);
      stickRef.current = true;
    } catch (err) {
      setNotice(err.message || "Message not sent. You may need to be friends first.");
    } finally {
      setSending(false);
    }
  };

  const sendSticker = async (sticker) => {
    if (!activeConversation || !sticker?.id) return;
    setNotice("");
    setStickerPickerOpen(false);
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
      stickRef.current = true;
      postJson(`/api/stickers/${encodeURIComponent(sticker.id)}/use`, {}).catch((error) =>
        console.error("Sticker use tracking failed:", error)
      );
    } catch (err) {
      setNotice(err.message || "Sticker not sent.");
    }
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      handleTextChange(text + emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    handleTextChange(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Message actions
  const canEditMessage = (message) => {
    if (!message || message.deleted || message.senderId !== user?.uid) return false;
    if (message.type === "sticker" || !message.text) return false;
    const sentAt = toDate(message.createdAt);
    return !!sentAt && Date.now() - sentAt.getTime() <= EDIT_WINDOW_MS;
  };

  const sendVoice = async (audioFile, duration) => {
    if (!activeConversation || sending) throw new Error("The conversation is not ready yet.");
    setSending(true);
    setNotice("");
    stopTyping();
    try {
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
        replyTo: replyTo
          ? {
              id: replyTo.id,
              senderId: replyTo.senderId || "",
              senderName: replyTo.senderName || "Student",
              text: messagePreview(replyTo),
            }
          : null,
      });
      setReplyTo(null);
      stickRef.current = true;
    } finally {
      setSending(false);
    }
  };

  const canDeleteMessage = (message) => {
    if (!message || message.deleted || message.senderId !== user?.uid) return false;
    if (message.type !== "voice") return true;
    const sentAt = toDate(message.createdAt);
    return !!sentAt && Date.now() - sentAt.getTime() <= EDIT_WINDOW_MS;
  };

  const startEditMessage = (message) => {
    setEditingId(message.id);
    setEditText(message.text || "");
    setOpenMenuId("");
  };

  const cancelEditMessage = () => {
    setEditingId("");
    setEditText("");
  };

  const saveEditMessage = async (message) => {
    const trimmed = editText.trim();
    if (!trimmed || !activeId) return;
    if (trimmed === (message.text || "")) {
      cancelEditMessage();
      return;
    }
    if (!canEditMessage(message)) {
      setNotice("The 30 minute edit window has passed.");
      cancelEditMessage();
      return;
    }
    try {
      await updateDoc(doc(db, "conversations", activeId, "messages", message.id), {
        text: trimmed,
        edited: true,
        editedAt: serverTimestamp(),
      });
      cancelEditMessage();
    } catch (err) {
      setNotice(err.message || "Could not save your edit.");
    }
  };

  const deleteMessage = async (message) => {
    if (!activeId) return;
    setOpenMenuId("");
    if (!canDeleteMessage(message)) {
      setNotice("Voice messages can only be deleted within 30 minutes of sending.");
      return;
    }
    if (!window.confirm("Delete this message for everyone? This can't be undone.")) return;
    try {
      if (message.type === "voice") {
        await deleteJson(`/api/voice/${encodeURIComponent(activeId)}/${encodeURIComponent(message.id)}`);
        return;
      }
      await updateDoc(doc(db, "conversations", activeId, "messages", message.id), {
        deleted: true,
        text: "",
        attachments: [],
        deletedAt: serverTimestamp(),
      });
    } catch (err) {
      setNotice(err.message || "Could not delete the message.");
    }
  };

  const copyMessage = async (message) => {
    setOpenMenuId("");
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
      await sendFriendRequest({
        currentUid: user.uid,
        targetUid: targetUser.id,
        currentProfile: profile,
        targetProfile: targetUser,
      });
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
      setNotice("Friend request accepted. You can chat freely now.");
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

  // Open (or create) the chat with a friend. The old version guessed a conversation id.
  const openFriendChat = async (friend) => {
    const otherUid = getFriendUid(friend);
    if (!otherUid) return;
    await openUser({ id: otherUid, ...getFriendProfile(friend) });
  };

  /* --------------------------------- Render -------------------------------- */

  const iconBtn = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${t.hover} ${focusRing}`;

  const renderToast = () =>
    notice ? (
      <div
        role="status"
        className={`fixed left-1/2 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${
          dark ? "border-amber-400/30 bg-[#1b1708] text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <span className="min-w-0 flex-1">{notice}</span>
        {requestTarget && (
          <button
            onClick={() => handleSendRequest(requestTarget)}
            disabled={requestSending}
            className={`shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${focusRing}`}
          >
            {requestSending ? "Sending…" : "Send friend request"}
          </button>
        )}
        <button
          onClick={() => { setNotice(""); setRequestTarget(null); }}
          className={`shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 ${focusRing}`}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    ) : null;

  const renderTabBar = () => (
    <div className={`flex gap-1 rounded-2xl border p-1 ${t.soft}`} role="tablist">
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
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors ${focusRing} ${
              isActive ? t.tabActive : t.tabInactive
            }`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
                {badgeCount(badge)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderListSearch = (placeholder) => (
    <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 ${t.input}`}>
      <Search size={16} className="shrink-0 opacity-50" />
      <input
        value={listFilter}
        onChange={(e) => setListFilter(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full bg-transparent text-sm outline-none"
      />
      {listFilter && (
        <button onClick={() => setListFilter("")} className="opacity-60 hover:opacity-100" aria-label="Clear search">
          <X size={15} />
        </button>
      )}
    </div>
  );

  const renderSkeletonRows = () =>
    [0, 1, 2, 3].map((i) => (
      <div key={i} className="mb-2 flex animate-pulse items-center gap-3 p-3">
        <div className={`h-12 w-12 rounded-full ${dark ? "bg-white/10" : "bg-slate-200"}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 w-1/2 rounded ${dark ? "bg-white/10" : "bg-slate-200"}`} />
          <div className={`h-3 w-3/4 rounded ${dark ? "bg-white/5" : "bg-slate-100"}`} />
        </div>
      </div>
    ));

  const renderEmpty = (Icon, title, body, action) => (
    <div className={`rounded-2xl border border-dashed p-8 text-center ${t.divider}`}>
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
        <button
          onClick={() => setShowFindModal(true)}
          className={`mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 ${focusRing}`}
        >
          Find friends
        </button>
      );
    }
    if (filteredConversations.length === 0) {
      return <p className={`py-10 text-center text-sm ${t.muted}`}>No chats match “{listFilter}”.</p>;
    }
    return filteredConversations.map((item) => {
      const otherId = item.memberIds?.find((id) => id !== user?.uid);
      const other = item.memberInfo?.[otherId] || {};
      const unread = Number(item.unread?.[user?.uid] || 0);
      const relationship = getRelationshipLabel(otherId);
      const RelIcon = relationship?.icon;
      const selected = activeId === item.id;
      return (
        <button
          key={item.id}
          onClick={() => setActiveId(item.id)}
          className={`mb-1.5 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${focusRing} ${
            selected ? "border-indigo-500 bg-indigo-500/10" : `border-transparent ${t.hover}`
          }`}
        >
          <Avatar src={pickAvatar(other)} name={other.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`truncate ${unread ? "font-extrabold" : "font-bold"}`}>{other.name || "Student"}</p>
              <span className={`shrink-0 text-[11px] ${unread ? "font-bold text-indigo-500" : t.muted}`}>
                {formatShortTime(item.updatedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className={`truncate text-sm ${unread ? "font-semibold" : t.muted}`}>{item.lastMessage || "Say hello"}</p>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                  {badgeCount(unread)}
                </span>
              )}
            </div>
            {relationship && RelIcon && (
              <span
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  relationship.tone === "warning"
                    ? dark ? "bg-amber-400/10 text-amber-300" : "bg-amber-50 text-amber-700"
                    : dark ? "bg-indigo-400/10 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                }`}
              >
                <RelIcon size={11} />
                {relationship.text}
              </span>
            )}
          </div>
        </button>
      );
    });
  };

  const renderFriendsTab = () => (
    <div>
      <button
        onClick={() => setShowFindModal(true)}
        className={`mb-4 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${t.soft} ${t.hover} ${focusRing}`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600">
          <UserPlus size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Find friends</p>
          <p className={`text-xs ${t.muted}`}>Search students or see suggestions</p>
        </div>
      </button>

      <p className={`mb-2 px-1 text-xs font-bold ${t.muted}`}>
        Your friends{friends.length > 0 ? ` (${friends.length})` : ""}
      </p>

      {friends.length === 0
        ? renderEmpty(Users, "No friends yet", "Connect with other students to chat without limits.")
        : filteredFriends.length === 0
          ? <p className={`py-10 text-center text-sm ${t.muted}`}>No friends match “{listFilter}”.</p>
          : filteredFriends.map((friend) => {
              const p = getFriendProfile(friend);
              const friendUid = getFriendUid(friend);
              const name = p.name || p.username || "Student";
              const sub = [p.school || p.university, p.department].filter(Boolean).join(" · ");
              return (
                <div key={friend.id} className={`mb-1.5 flex items-center gap-2 rounded-2xl p-2 ${t.hover}`}>
                  <button onClick={() => openFriendChat(friend)} className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left ${focusRing}`}>
                    <Avatar src={pickAvatar(p)} name={name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{name}</p>
                      {sub && <p className={`truncate text-xs ${t.muted}`}>{sub}</p>}
                    </div>
                  </button>
                  {friendUid && (
                    <Link to={`/profile/${friendUid}`} className={`${iconBtn} border ${t.divider}`} aria-label={`View ${name}'s profile`} title="View profile">
                      <Eye size={16} />
                    </Link>
                  )}
                  <button onClick={() => openFriendChat(friend)} className={`${iconBtn} bg-indigo-600 text-white hover:bg-indigo-700`} aria-label={`Message ${name}`} title="Message">
                    <MessageCircle size={16} />
                  </button>
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
      <div key={request.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${t.soft}`}>
        <Avatar src={pickAvatar(p)} name={name} size="lg" />
        <div className="min-w-0 flex-1 basis-32">
          <p className="truncate font-bold">{name}</p>
          <p className={`truncate text-xs ${t.muted}`}>{sub}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {kind === "in" ? (
            <>
              <button onClick={() => handleAcceptRequest(request)} className={`flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 ${focusRing}`}>
                <UserCheck size={15} /> Accept
              </button>
              <button
                onClick={() => handleDeclineRequest(request)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold ${focusRing} ${
                  dark ? "border-red-400/30 text-red-300 hover:bg-red-500/10" : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                <UserX size={15} /> Decline
              </button>
            </>
          ) : (
            <button onClick={() => handleCancelRequest(request)} className={`rounded-xl border px-3.5 py-2 text-xs font-bold ${t.divider} ${t.hover} ${focusRing}`}>
              Cancel request
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderRequestsTab = () => {
    if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
      return renderEmpty(
        UserRoundPlus,
        "No pending requests",
        "Requests you send or receive show up here. Use Find friends to connect with someone."
      );
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

  // One row used for both search results and suggestions. Buttons reflect the real relationship.
  const renderPersonRow = (item) => {
    const name = pickName(item);
    const detail = item.school || item.department || item.email || "";
    const isFriend = friendIds.has(item.id);
    const incoming = incomingRequestByUser.get(item.id);
    const outgoing = outgoingRequestByUser.get(item.id);
    return (
      <div key={item.id} className={`mb-2 flex items-center gap-3 rounded-2xl border p-3 ${t.soft}`}>
        <Avatar src={pickAvatar(item)} name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{name}</p>
          {detail && <p className={`truncate text-xs ${t.muted}`}>{detail}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          {isFriend ? (
            <span className={`flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-bold ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
              <Check size={14} /> Friends
            </span>
          ) : incoming ? (
            <button onClick={() => handleAcceptRequest(incoming)} className={`flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 ${focusRing}`}>
              <UserCheck size={14} /> Accept
            </button>
          ) : outgoing ? (
            <span className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${t.divider} ${t.muted}`}>
              <Clock size={14} /> Pending
            </span>
          ) : (
            <button onClick={() => handleSendRequest(item)} className={`flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 ${focusRing}`}>
              <UserPlus size={14} /> Add
            </button>
          )}
          <button
            onClick={() => openUser(item)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${t.divider} ${t.hover} ${focusRing}`}
            aria-label={`Message ${name}`}
            title="Message"
          >
            <MessageCircle size={14} />
          </button>
        </div>
      </div>
    );
  };

  const renderFindModal = () => {
    if (!showFindModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={closeFind}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Find friends"
          className={`flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl ${t.sheet}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Find friends</h2>
            <button onClick={closeFind} className={`${iconBtn}`} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className={`mb-4 flex items-center gap-2 rounded-2xl border px-3 ${t.input}`}>
            <Search size={17} className="opacity-50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or school"
              className="h-11 w-full bg-transparent text-sm outline-none"
              autoFocus
            />
            {searching ? (
              <Loader2 size={16} className="animate-spin opacity-50" />
            ) : (
              search && (
                <button onClick={() => setSearch("")} className="opacity-60 hover:opacity-100" aria-label="Clear search">
                  <X size={16} />
                </button>
              )
            )}
          </div>

          <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
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
                <p className={`mb-3 text-sm font-bold ${t.muted}`}>Suggested for you</p>
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

  const renderRelationshipPrompt = () => {
    if (!activeRelationshipLabel) return null;
    const PromptIcon = activeRelationshipLabel.icon;
    const isIncoming = !!activeIncomingRequest;
    const isOutgoing = !!activeOutgoingRequest;
    const title = isIncoming ? "Friend request waiting" : isOutgoing ? "Friend request sent" : "Add friend to keep chatting";
    const body = isIncoming
      ? `${otherUser?.name || "This student"} wants to connect.`
      : isOutgoing
        ? "Chat unlocks once accepted."
        : nonFriendMessageUsed
          ? "Intro message sent. Add friend to chat more."
          : "1 intro message available before friending.";

    return (
      <div className={`mx-3 mb-2 flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 text-xs ${dark ? "border-indigo-400/20 bg-indigo-400/10" : "border-indigo-100 bg-indigo-50"}`}>
        <div className="flex min-w-0 items-center gap-2">
          <PromptIcon size={15} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div className="min-w-0 truncate">
            <span className="font-bold">{title}:</span> <span className={t.muted}>{body}</span>
          </div>
        </div>
        {isIncoming ? (
          <button onClick={() => handleAcceptRequest(activeIncomingRequest)} className={`flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-600 ${focusRing}`}>
            <UserCheck size={13} /> Accept
          </button>
        ) : isOutgoing ? (
          <span className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${t.soft}`}>
            <Clock size={13} /> Pending
          </span>
        ) : (
          <button
            onClick={() => handleSendRequest({ id: activeOtherId, uid: activeOtherId, ...(otherUser || {}) })}
            disabled={requestSending}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 ${focusRing}`}
          >
            <UserPlus size={13} /> Add friend
          </button>
        )}
      </div>
    );
  };

  const renderMessage = ({ message, index, grouped, lastInGroup }) => {
    const mine = message.senderId === user?.uid;
    const senderName = mine
      ? profile.username || user?.displayName || "You"
      : message.senderName || otherUser?.name || "Student";
    const senderAvatar = message.senderAvatar || (mine ? profile.photo || user?.photoURL : otherUser?.avatar) || "";
    const isEditing = editingId === message.id;
    const isMenuOpen = openMenuId === message.id;
    const editable = canEditMessage(message);
    const showActions = !message.deleted && !isEditing;
    const isSticker = message.type === "sticker" && message.sticker && !message.deleted;
    const openUp = index >= messages.length - 3 && messages.length > 3;
    const unreadByOther = unreadMineIds.has(message.id);
    const reactions = normalizeReactions(message.reactions);
    const reactionCounts = Object.fromEntries(
      Object.entries(reactions).map(([emoji, ids]) => [emoji, ids.length])
    );
    const myReactions = new Set(
      Object.entries(reactions)
        .filter(([, ids]) => ids.includes(user?.uid))
        .map(([emoji]) => emoji)
    );

    const bubbleTone = isSticker
      ? ""
      : mine
        ? "bg-indigo-600 text-white"
        : dark ? "bg-white/[0.08] text-white" : "bg-slate-100 text-slate-900";
    const tail = mine ? (lastInGroup ? "rounded-br-md" : "") : lastInGroup ? "rounded-bl-md" : "";

    const actions = showActions && (
      <div className="relative shrink-0 self-center" ref={isMenuOpen ? menuRef : null}>
        <button
          onClick={() => setOpenMenuId(isMenuOpen ? "" : message.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-opacity ${t.hover} ${focusRing} ${
            isMenuOpen ? "opacity-100" : "opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          }`}
          aria-label="Message actions"
          aria-expanded={isMenuOpen}
        >
          <MoreVertical size={16} />
        </button>
        {isMenuOpen && (
          <div className={`absolute right-0 z-30 w-48 overflow-hidden rounded-2xl border py-1 shadow-xl ${t.menu} ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
            <div className={`mb-1 flex justify-between border-b px-2 pb-1.5 pt-1 ${t.divider}`}>
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(message, emoji)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-base transition-transform hover:scale-125 ${myReactions.has(emoji) ? "bg-indigo-500/20" : ""}`}
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {[
              { label: "Reply", icon: Reply, show: true, run: () => { setReplyTo(message); setOpenMenuId(""); textareaRef.current?.focus(); } },
              { label: "Copy", icon: Copy, show: !!message.text, run: () => copyMessage(message) },
              { label: "Edit", icon: Pencil, show: mine && editable, run: () => startEditMessage(message) },
              { label: "Delete", icon: Trash2, show: mine && canDeleteMessage(message), run: () => deleteMessage(message), danger: true },
            ]
              .filter((a) => a.show)
              .map((a) => (
                <button
                  key={a.label}
                  onClick={a.run}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold ${
                    a.danger ? `text-red-500 ${dark ? "hover:bg-red-500/10" : "hover:bg-red-50"}` : t.hover
                  }`}
                >
                  <a.icon size={14} /> {a.label}
                </button>
              ))}
          </div>
        )}
      </div>
    );

    const footer = (
      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-semibold ${mine && !isSticker ? "text-white/75" : t.muted}`}>
        {message.edited && !message.deleted && <span>Edited</span>}
        <span>{formatShortTime(message.createdAt)}</span>
        {mine && !message.deleted &&
          (unreadByOther ? <Check size={13} aria-label="Sent" /> : <CheckCheck size={13} className={isSticker ? "text-indigo-400" : "text-sky-200"} aria-label="Read" />)}
      </div>
    );

    return (
      <div id={`msg-${message.id}`} className={`group flex items-end gap-2 rounded-2xl transition-colors duration-500 ${mine ? "justify-end" : "justify-start"} ${grouped ? "-mt-2" : ""}`}>
        {!mine && (lastInGroup ? <Avatar src={senderAvatar} name={senderName} size="sm" /> : <div className="w-8 shrink-0" />)}
        {mine && actions}
        <div className={`relative min-w-0 max-w-[80%] rounded-2xl px-3.5 py-2 ${bubbleTone} ${tail} ${message.deleted ? "opacity-70" : ""} ${isSticker ? "px-0 py-0" : ""}`}>
          {message.deleted ? (
            <p className="flex items-center gap-1.5 text-sm italic opacity-80">
              <Trash2 size={13} /> This message was deleted
            </p>
          ) : isEditing ? (
            <div className="min-w-[200px] sm:min-w-[260px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                autoFocus
                aria-label="Edit message"
                className={`w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none ${mine ? "border-white/30 bg-white/10 text-white placeholder:text-white/50" : t.input}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    saveEditMessage(message);
                  } else if (event.key === "Escape") {
                    cancelEditMessage();
                  }
                }}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={cancelEditMessage} className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${mine ? "bg-white/15 text-white" : t.soft + " border"}`}>
                  <XCircle size={13} /> Cancel
                </button>
                <button onClick={() => saveEditMessage(message)} disabled={!editText.trim()} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                  <CheckCheck size={13} /> Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.replyTo && (
                <button
                  type="button"
                  onClick={() => jumpToMessage(message.replyTo.id)}
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
                />
              )}
              {message.type === "voice" && message.audioUrl && <VoiceMessage message={message} mine={mine} />}
              {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-6"><Linkified text={message.text} /></p>}
              {(message.attachments || []).map((item, i) => <Attachment key={i} item={item} onOpen={setLightbox} />)}
              {Object.keys(reactionCounts).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <div
                      key={emoji}
                      className={`flex items-center overflow-hidden rounded-full text-xs font-bold ${
                        myReactions.has(emoji)
                          ? "bg-indigo-500/30 ring-1 ring-indigo-400"
                          : mine ? "bg-white/15" : dark ? "bg-white/10" : "bg-white"
                      }`}
                    >
                      <button
                        onClick={() => toggleReaction(message, emoji)}
                        className="flex items-center gap-1 px-2 py-0.5"
                        aria-label={`${emoji} ${count}${myReactions.has(emoji) ? ", you reacted" : ""}`}
                      >
                        <span>{emoji}</span>
                        {count > 1 && <span>{count}</span>}
                      </button>
                      <button
                        onClick={() => openReactionViewer(message.reactions, "Message reactions")}
                        className={`border-l px-1.5 py-0.5 ${mine ? "border-white/20" : dark ? "border-white/10" : "border-slate-200"}`}
                        aria-label={`See the ${count} people who reacted ${emoji}`}
                        title="See who reacted"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {!isEditing && footer}
        </div>
        {!mine && actions}
      </div>
    );
  };

  const renderEmojiPicker = () =>
    emojiOpen ? (
      <>
        <div className="fixed inset-0 z-30" onClick={() => setEmojiOpen(false)} />
        <div className={`absolute bottom-full left-0 z-40 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border p-2 shadow-xl ${t.menu}`}>
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => insertEmoji(emoji)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${t.hover}`} aria-label={`Insert ${emoji}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </>
    ) : null;

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
      <div className="fixed inset-0 z-50 bg-black/45" onClick={() => setStickerPickerOpen(false)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Stickers"
          className={`absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-3xl border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ${t.sheet}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-black">Stickers</p>
            <button onClick={() => setStickerPickerOpen(false)} className={iconBtn} aria-label="Close sticker picker">
              <X size={18} />
            </button>
          </div>

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 text-sm">
            {STICKER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStickerTab(tab.key); setSelectedPack(null); }}
                className={`shrink-0 rounded-full px-3.5 py-2 font-semibold ${focusRing} ${
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

          {stickerError && (
            <div className={`mb-3 rounded-xl p-2 text-sm ${dark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-600"}`}>{stickerError}</div>
          )}

          <div className="max-h-[45dvh] overflow-y-auto">
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
                      className={`flex aspect-square items-center justify-center rounded-2xl border p-2 transition hover:border-indigo-400/60 hover:bg-indigo-500/10 ${t.soft} ${focusRing}`}
                      title={stickerLabel(sticker)}
                    >
                      {image ? (
                        <img src={image} alt={stickerLabel(sticker)} className="h-full w-full rounded-xl object-contain" loading="lazy" />
                      ) : (
                        <span className={`text-[10px] font-bold ${t.muted}`}>Sticker</span>
                      )}
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

  const headerSubtitle = otherTyping
    ? "typing…"
    : activeAreFriends
      ? "Friends"
      : activeRelationshipLabel?.text || "";

  const renderChatHeader = () => {
    const identity = (
      <>
        <Avatar src={pickAvatar(otherUser)} name={otherUser?.name} size="md" />
        <div className="min-w-0">
          <h2 className="truncate text-sm sm:text-base font-bold">{otherUser?.name || "Student"}</h2>
          <p className={`truncate text-xs ${otherTyping ? "font-bold text-emerald-500" : t.muted}`}>{headerSubtitle}</p>
        </div>
      </>
    );
    return (
      <div className={`flex items-center gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3 ${t.divider}`}>
        <button onClick={() => setActiveId("")} className={`${iconBtn} -ml-1 md:hidden`} aria-label="Back to chats">
          <ArrowLeft size={18} />
        </button>
        {activeAreFriends && activeOtherId ? (
          <Link to={`/profile/${activeOtherId}`} className="group flex min-w-0 flex-1 items-center gap-2.5" title="View profile">
            {identity}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">{identity}</div>
        )}
        <button
          onClick={() => setConversationSettingsOpen(true)}
          className={`${iconBtn} border ${t.divider}`}
          aria-label="Conversation settings"
          title="Conversation settings"
        >
          <Settings size={18} />
        </button>
      </div>
    );
  };

  const renderConversationSettings = () =>
    conversationSettingsOpen ? (
      <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-3 sm:items-center" onClick={() => setConversationSettingsOpen(false)}>
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Conversation settings"
          className={`w-full max-w-md rounded-3xl border p-5 shadow-2xl ${t.sheet}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-black">Conversation settings</p>
              <p className={`mt-1 text-sm ${t.muted}`}>These preferences sync with Unihelp Mobile.</p>
            </div>
            <button onClick={() => setConversationSettingsOpen(false)} className={iconBtn} aria-label="Close conversation settings"><X size={18} /></button>
          </div>
          <div className={`mt-5 flex items-center gap-3 rounded-2xl border p-4 ${t.soft}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500"><MessageCircle size={18} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">Message notifications</p>
              <p className={`mt-0.5 text-xs ${t.muted}`}>{conversationMuted ? "Muted on this device and your other signed-in apps." : "Get notifications when this person messages you."}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!conversationMuted}
              disabled={conversationSettingsLoading}
              onClick={() => updateConversationMuted(!conversationMuted)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-55 ${conversationMuted ? "bg-slate-400" : "bg-indigo-600"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${conversationMuted ? "left-1" : "left-6"}`} />
            </button>
          </div>
        </section>
      </div>
    ) : null;

  const renderReactionViewer = () =>
    reactionViewer ? (
      <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-3 sm:items-center" onClick={() => setReactionViewer(null)}>
        <section
          role="dialog"
          aria-modal="true"
          aria-label={reactionViewer.title}
          className={`w-full max-w-md rounded-3xl border p-5 shadow-2xl ${t.sheet}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black">{reactionViewer.title}</p>
              <p className={`mt-0.5 text-sm ${t.muted}`}>{reactionViewer.people.length} {reactionViewer.people.length === 1 ? "person" : "people"}</p>
            </div>
            <button onClick={() => setReactionViewer(null)} className={iconBtn} aria-label="Close reactions"><X size={18} /></button>
          </div>
          <div className="mt-4 max-h-[55dvh] space-y-2 overflow-y-auto">
            {reactionViewer.loading ? (
              <div className={`flex justify-center py-10 ${t.muted}`}><Loader2 className="animate-spin" size={22} /></div>
            ) : reactionViewer.people.length ? reactionViewer.people.map((person) => (
              <Link key={person.id} to={`/profile/${person.id}`} onClick={() => setReactionViewer(null)} className={`flex items-center gap-3 rounded-2xl p-2 ${t.hover}`}>
                <Avatar src={person.avatar} name={person.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{person.name}</span>
                <span className="text-lg">{person.emojis.join("")}</span>
              </Link>
            )) : (
              <p className={`py-8 text-center text-sm ${t.muted}`}>No reactions yet.</p>
            )}
          </div>
        </section>
      </div>
    ) : null;

  const renderComposer = () => (
    <div className={`border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-3 ${t.divider}`}>
      {replyTo && (
        <div className={`mb-2 flex items-start justify-between gap-3 rounded-2xl border border-l-4 border-l-indigo-500 p-3 text-xs ${t.soft}`}>
          <div className="min-w-0">
            <p className="font-bold">Replying to {replyTo.senderId === user?.uid ? "yourself" : replyTo.senderName || "Student"}</p>
            <p className={`mt-0.5 line-clamp-1 ${t.muted}`}>{messagePreview(replyTo)}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="rounded-lg p-1 hover:bg-red-500/10" aria-label="Cancel reply">
            <X size={15} />
          </button>
        </div>
      )}

      {file && (
        <div className={`mb-2 flex items-center gap-3 rounded-2xl border p-2 text-xs ${t.soft}`}>
          {filePreview ? (
            <img src={filePreview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500"><FileText size={20} /></div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{file.name}</p>
            <p className={t.muted}>{(file.size / 1024 / 1024).toFixed(file.size > 1024 * 1024 ? 1 : 2)} MB</p>
          </div>
          <button onClick={() => setFile(null)} className="rounded-lg p-2 hover:bg-red-500/10" aria-label="Remove attachment">
            <X size={15} />
          </button>
        </div>
      )}

      {canUseComposer ? (
        <div className={`relative flex items-end gap-1 rounded-3xl border p-1.5 ${t.soft}`}>
          {!voiceComposerActive && <>
            {renderEmojiPicker()}
            <button onClick={() => setEmojiOpen((v) => !v)} className={iconBtn} aria-label="Emoji" aria-expanded={emojiOpen}>
              <Smile size={19} />
            </button>
            <button onClick={() => setStickerPickerOpen(true)} className={iconBtn} aria-label="Open sticker picker">
              <StickyNote size={19} />
            </button>
            <label className={`${iconBtn} cursor-pointer`} aria-label="Attach file">
              <Paperclip size={19} />
              <input
                hidden
                type="file"
                onChange={(e) => {
                  stageFile(e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />
            </label>
          </>}
          <VoiceRecorder
            key={activeId}
            isPremium={canRecordVoice}
            disabled={sending || Boolean(file) || Boolean(text.trim())}
            onStateChange={setVoiceRecorderState}
            onSend={sendVoice}
            onError={(message) => setNotice(message)}
            onUpgrade={() => navigate("/premium")}
          />
          {!voiceComposerActive && <>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onPaste={(e) => {
                const pasted = Array.from(e.clipboardData?.files || [])[0];
                if (pasted) {
                  e.preventDefault();
                  stageFile(pasted);
                }
              }}
              rows={1}
              placeholder={activeAreFriends ? "Message" : "Send one intro message"}
              aria-label="Message"
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <button
              onClick={send}
              disabled={sending || (!text.trim() && !file)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-opacity hover:bg-indigo-700 disabled:opacity-40 ${focusRing}`}
              aria-label="Send message"
            >
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </>}
        </div>
      ) : (
        <div className={`rounded-2xl border p-4 text-center text-sm font-semibold ${t.soft}`}>
          Add each other as friends to send more messages.
        </div>
      )}
    </div>
  );

  const renderMessagesArea = () => (
    <div
      className="relative min-h-0 flex-1"
      onDragOver={(e) => {
        if (canUseComposer && e.dataTransfer?.types?.includes("Files")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (canUseComposer) stageFile(e.dataTransfer?.files?.[0]);
      }}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-500/10 text-sm font-bold text-indigo-500">
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
          <div className="space-y-3">
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold ${t.divider} ${t.hover} ${focusRing} disabled:opacity-60`}
                >
                  {loadingOlder ? "Loading…" : "Load earlier messages"}
                </button>
              </div>
            )}
            {rows.map((row) =>
              row.kind === "day" ? (
                <div key={row.id} className="flex justify-center py-1">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"}`}>{row.label}</span>
                </div>
              ) : (
                <React.Fragment key={row.message.id}>{renderMessage(row)}</React.Fragment>
              )
            )}
            {otherTyping && (
              <div className="flex items-end gap-2">
                <Avatar src={pickAvatar(otherUser)} name={otherUser?.name} size="sm" />
                <div className={`flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3 ${dark ? "bg-white/[0.08]" : "bg-slate-100"}`} aria-label="Typing">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full motion-reduce:animate-none bg-slate-400" style={{ animationDelay: `${delay}ms` }} />
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
          className={`absolute bottom-3 right-4 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg ${t.menu} ${focusRing}`}
          aria-label="Jump to latest message"
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );

  const renderMain = () => {
    if (activeConversation) {
      return (
        <>
          {renderChatHeader()}
          {renderMessagesArea()}
          {renderRelationshipPrompt()}
          {renderComposer()}
        </>
      );
    }
    if (activeId) {
      return (
        <>
          <div className={`flex items-center gap-2 border-b p-3 ${t.divider}`}>
            <button onClick={() => setActiveId("")} className={`${iconBtn} md:hidden`} aria-label="Back to chats"><ArrowLeft size={20} /></button>
          </div>
          <div className={`flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center ${t.muted}`}>
            {openFailed ? (
              <>
                <MessageCircle size={40} className="opacity-40" />
                <p className="font-bold">Conversation not found</p>
                <button onClick={() => setActiveId("")} className={`rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white ${focusRing}`}>Back to chats</button>
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
            <button onClick={() => setShowFindModal(true)} className={`flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 ${focusRing}`}>
              <UserPlus size={16} /> Find friends
            </button>
            {incomingRequests.length > 0 && (
              <button onClick={() => setActiveTab("requests")} className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${t.divider} ${t.hover} ${focusRing}`}>
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
      {renderToast()}

      <div className="mx-auto grid h-full max-w-[1400px] grid-cols-1 gap-0 sm:gap-4 sm:px-4 sm:py-3 md:grid-cols-[320px_minmax(0,1fr)] md:px-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        {/* Left panel: lists. Full screen on phones until a chat is opened. */}
        <aside className={`${activeId ? "hidden" : "flex"} flex-col overflow-hidden rounded-none border-0 md:flex sm:rounded-3xl sm:border ${PANEL_H} ${t.panel}`}>
          <div className={`border-b p-3 sm:p-4 ${t.divider}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1">
                <button onClick={goBack} className={`${iconBtn} -ml-2`} aria-label="Go back">
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl sm:text-2xl font-black">Messenger</h1>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowFindModal(true)} className={`${iconBtn} border ${t.divider}`} aria-label="Find friends" title="Find friends">
                  <UserPlus size={18} />
                </button>
                <Link to="/community-settings" className={`${iconBtn} border ${t.divider}`} aria-label="Messaging settings" title="Settings">
                  <Settings size={18} />
                </Link>
              </div>
            </div>
            <div className="mt-4">{renderTabBar()}</div>
            {activeTab === "chats" && conversations.length > 0 && renderListSearch("Search chats")}
            {activeTab === "friends" && friends.length > 0 && renderListSearch("Search friends")}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {activeTab === "chats" && renderChatsTab()}
            {activeTab === "friends" && renderFriendsTab()}
            {activeTab === "requests" && renderRequestsTab()}
          </div>
        </aside>

        {/* Right panel: chat. Full screen on phones once a chat is open. */}
        <main className={`${activeId ? "flex" : "hidden"} flex-col overflow-hidden rounded-none border-0 md:flex sm:rounded-3xl sm:border ${PANEL_H} ${t.panel}`}>
          {renderMain()}
        </main>
      </div>

      {renderStickerPicker()}
      {renderFindModal()}
      {renderConversationSettings()}
      {renderReactionViewer()}

      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label="Image preview">
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close image" onClick={() => setLightbox(null)}>
            <X size={20} />
          </button>
          <img src={lightbox.url} alt={lightbox.name || "Image"} className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
