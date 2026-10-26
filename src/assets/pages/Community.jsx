import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import {
  Bell,
  Calendar,
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
  Loader2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Newspaper,
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

const DEFAULT_FILTERS = { category: "All", privacy: "all", membership: "all", role: "all", sort: "relevant" };

const DETAIL_TABS = [
  { key: "Feed", icon: Newspaper },
  { key: "Chat", icon: MessageCircle },
  { key: "Members", icon: Users },
  { key: "Media", icon: ImageIcon },
  { key: "Files", icon: FileText },
  { key: "About", icon: Info },
];

// Module-level caches: revisiting the page or switching views doesn't re-read the same docs.
const profileCache = new Map(); // uid -> { at, data }
const groupCache = new Map(); // groupId -> { at, data }
const joinedCache = { uid: "", at: 0, map: new Map() }; // groupId -> { role }
const fresh = (entry) => !!entry && Date.now() - entry.at < CACHE_TTL;

const loadProfile = async (user) => {
  if (!user?.uid) return {};
  const cached = profileCache.get(user.uid);
  if (fresh(cached)) return cached.data;
  const data = (await getCurrentUserProfile(user)) || {};
  profileCache.set(user.uid, { at: Date.now(), data });
  return data;
};

// One query tells us every group the person is in (no per-card membership reads).
const loadJoined = async (uid) => {
  if (joinedCache.uid === uid && fresh(joinedCache)) return joinedCache.map;
  let map = joinedCache.uid === uid ? joinedCache.map : new Map();
  try {
    const snap = await getDocs(query(collection(db, "users", uid, "groups"), limit(100)));
    map = new Map(snap.docs.map((d) => [d.id, { role: d.data()?.role || "member" }]));
  } catch {
    /* keep whatever we had */
  }
  joinedCache.uid = uid;
  joinedCache.at = Date.now();
  joinedCache.map = map;
  return map;
};

const markJoined = (uid, id, role = "member") => {
  if (joinedCache.uid !== uid) {
    joinedCache.uid = uid;
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

const paletteVars = (dark) =>
  dark
    ? {
        "--paper": "#070b14",
        "--paper-raised": "#0f1626",
        "--paper-sunken": "#0b1220",
        "--ink": "#f1f5f9",
        "--ink-soft": "#cbd5e1",
        "--ink-faint": "#94a3b8",
        "--line": "#243044",
        "--brand": "#6366f1",
        "--brand-text": "#a5b4fc",
        "--brand-soft": "rgba(129,140,248,0.16)",
        "--on-brand": "#ffffff",
        "--ok": "#34d399",
        "--ok-soft": "rgba(52,211,153,0.14)",
        "--warn": "#fbbf24",
        "--warn-soft": "rgba(251,191,36,0.14)",
        "--danger": "#f87171",
        "--danger-soft": "rgba(248,113,113,0.14)",
      }
    : {
        "--paper": "#f6f7fb",
        "--paper-raised": "#ffffff",
        "--paper-sunken": "#f1f3f9",
        "--ink": "#0f172a",
        "--ink-soft": "#475569",
        "--ink-faint": "#64748b",
        "--line": "#e2e8f0",
        "--brand": "#4f46e5",
        "--brand-text": "#4338ca",
        "--brand-soft": "#eef2ff",
        "--on-brand": "#ffffff",
        "--ok": "#047857",
        "--ok-soft": "#d1fae5",
        "--warn": "#b45309",
        "--warn-soft": "#fef3c7",
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
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border [border-color:var(--line)] [background:var(--paper-raised)] [color:var(--ink-soft)] transition hover:[border-color:var(--brand)] hover:[color:var(--ink)]",
  primaryBtn:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl [background:var(--brand)] px-4 text-sm font-semibold [color:var(--on-brand)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
  ghostBtn:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border [border-color:var(--line)] [background:var(--paper-raised)] px-4 text-sm font-semibold [color:var(--ink)] transition hover:[border-color:var(--brand)] disabled:cursor-not-allowed disabled:opacity-50",
  okBtn:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border [border-color:var(--ok)] [background:var(--ok-soft)] px-4 text-sm font-semibold [color:var(--ok)] transition hover:brightness-95",
};

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                             */
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
const messagePreview = (message) => (message?.text ? message.text.slice(0, 120) : message?.attachments?.[0]?.name || "Attachment");
const mentionToken = (member) => `@${(member?.name || "Student").replace(/\s+/g, "")}`;
const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

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
      @keyframes quad-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .quad-rise { animation: quad-rise 0.25s ease both; }
      @keyframes quad-pop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      .quad-pop { animation: quad-pop 0.14s ease both; }
      @keyframes quad-sheet { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .quad-sheet { animation: quad-sheet 0.2s ease both; }
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
      setTimeout(() => dismiss(id), opts.duration || 4500);
    },
    [dismiss]
  );
  return { items, push, dismiss };
}

function ToastHost({ items, dismiss }) {
  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[600] flex flex-col items-center gap-2 px-4">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`quad-rise pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl [background:var(--paper-raised)] ${
            item.tone === "error" ? "[border-color:var(--danger)]" : item.tone === "success" ? "[border-color:var(--ok)]" : "[border-color:var(--line)]"
          }`}
        >
          {item.tone === "success" && <CheckCircle2 size={17} className="shrink-0 [color:var(--ok)]" />}
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
/*  Shared UI                                                                 */
/* -------------------------------------------------------------------------- */

function Menu({ trigger, children, align = "right", width = "w-56", label = "Open menu" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label={label}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`quad-pop absolute z-30 mt-2 ${width} ${align === "right" ? "right-0" : "left-0"} overflow-hidden rounded-xl border py-1 shadow-xl [border-color:var(--line)] [background:var(--paper-raised)]`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, tone = "default", disabled = false }) {
  const toneClass = tone === "danger" ? "[color:var(--danger)] hover:[background:var(--danger-soft)]" : "hover:[background:var(--paper-sunken)]";
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );
}

const AV = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-base", lg: "h-16 w-16 text-xl", xl: "h-24 w-24 text-3xl" };

const GroupAvatar = ({ group, size = "md", ring = false }) => (
  <div
    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-bold [background:var(--brand-soft)] [color:var(--brand-text)] ${AV[size]} ${
      ring ? "border-4 [border-color:var(--paper-raised)]" : ""
    }`}
  >
    {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : initial(group.name)}
  </div>
);

const UserAvatar = ({ src, name, size = "sm" }) => (
  <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold [background:var(--brand-soft)] [color:var(--brand-text)] ${AV[size]}`} title={name}>
    {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : initial(name)}
  </div>
);

// Cover: uploaded image, or a solid colour derived from the group name (stable per group).
const CoverPattern = ({ group }) =>
  group.coverUrl ? (
    <img src={group.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="relative h-full w-full overflow-hidden" style={{ background: `hsl(${hueFor(group.name)} 42% 38%)` }}>
      <span className="absolute -bottom-6 right-3 select-none text-[7rem] font-black leading-none text-white/10">{initial(group.name)}</span>
    </div>
  );

const PrivacyBadge = ({ privacy, overlay = false }) => {
  const isPrivate = privacy === "private";
  const Icon = isPrivate ? Lock : Globe;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        overlay ? "bg-black/55 text-white backdrop-blur" : isPrivate ? "[background:var(--warn-soft)] [color:var(--warn)]" : "[background:var(--paper-sunken)] [color:var(--ink-soft)]"
      }`}
    >
      <Icon size={11} /> {isPrivate ? "Private" : "Public"}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const Icon = role === "owner" ? Crown : role === "admin" ? ShieldCheck : Check;
  const label = role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Member";
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold [background:var(--ok-soft)] [color:var(--ok)]">
      <Icon size={11} /> {label}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className={`p-10 text-center ${cx.soft}`}>
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl [background:var(--brand-soft)] [color:var(--brand-text)]">
      <Icon size={26} strokeWidth={1.7} />
    </div>
    <h3 className="mt-4 text-base font-semibold">{title}</h3>
    <p className={`mx-auto mt-1.5 max-w-sm text-sm leading-6 ${cx.muted}`}>{text}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

const SkeletonCards = ({ count = 6 }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`h-64 animate-pulse ${cx.soft}`} />
    ))}
  </div>
);

const AttachmentPreview = ({ attachment, compact = false }) => {
  if (!attachment?.url) return null;
  if (attachment.type === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className={compact ? "block" : "mt-3 block"}>
        <img
          src={attachment.url}
          alt={attachment.name || "Attachment"}
          className={`w-full rounded-xl object-cover ${compact ? "aspect-square" : "max-h-80"}`}
          loading="lazy"
        />
      </a>
    );
  }
  if (attachment.type === "video") {
    return <video src={attachment.url} controls className={`w-full rounded-xl bg-black ${compact ? "aspect-square object-cover" : "mt-3 max-h-80"}`} />;
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold [border-color:var(--line)] [background:var(--paper-sunken)] hover:[border-color:var(--brand)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [background:var(--brand-soft)] [color:var(--brand-text)]">
        <FileText size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{attachment.name || "Open file"}</span>
        {attachment.bytes ? <span className={`text-xs font-normal ${cx.faint}`}>{formatBytes(attachment.bytes)}</span> : null}
      </span>
    </a>
  );
};

function ReactionBar({ post, groupId, uid }) {
  const active = REACTIONS.filter((emoji) => (post.reactions?.[emoji] || 0) > 0);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      {active.map((emoji) => {
        const selected = post.userReactions?.[uid] === emoji;
        return (
          <button
            key={emoji}
            onClick={() => reactToPost(groupId, post.id, emoji, uid)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
              selected ? "[border-color:var(--brand)] [background:var(--brand-soft)] [color:var(--brand-text)]" : "[border-color:var(--line)] [color:var(--ink-soft)] hover:[border-color:var(--brand)]"
            }`}
          >
            <span>{emoji}</span>
            <span>{post.reactions[emoji]}</span>
          </button>
        );
      })}
      <Menu
        width="w-auto"
        align="left"
        label="Add reaction"
        trigger={<span className="inline-flex h-7 w-7 items-center justify-center rounded-full border [border-color:var(--line)] transition hover:[border-color:var(--brand)]"><Smile size={14} /></span>}
      >
        {(close) => (
          <div className="flex gap-1 p-1.5">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  reactToPost(groupId, post.id, emoji, uid);
                  close();
                }}
                className="rounded-lg p-1.5 text-lg transition hover:[background:var(--paper-sunken)]"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </Menu>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Composer                                                                  */
/* -------------------------------------------------------------------------- */

function Composer({ placeholder, onSend, allowVideo = true, replyTo = null, onCancelReply, mentionMembers = [], enterToSend = false, sendLabel = "Send" }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const areaRef = useRef(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mentionMatch = text.match(/(^|\s)@([^\s@]*)$/);
  const mentionOptions = useMemo(() => {
    if (!mentionMatch || !mentionMembers.length) return [];
    const q = mentionMatch[2].toLowerCase();
    return mentionMembers.filter((m) => (m.name || "").replace(/\s+/g, "").toLowerCase().startsWith(q)).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mentionMembers]);

  const pickMention = (member) => setText((cur) => cur.replace(/@([^\s@]*)$/, `${mentionToken(member)} `));

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
    if (sending || (!text.trim() && !file)) return;
    setSending(true);
    setError("");
    try {
      const attachments = [];
      if (file) {
        const kind = fileKind(file);
        if (kind === "video" && !allowVideo) throw new Error("Video uploads are available for premium users.");
        const uploaded = await uploadGroupMedia(file, kind === "image" || kind === "video" ? kind : "raw");
        attachments.push({
          type: kind,
          url: uploaded.url || uploaded.secure_url,
          key: uploaded.key || uploaded.publicId,
          resourceType: uploaded.resourceType || (kind === "image" || kind === "video" ? kind : "raw"),
          name: uploaded.originalFilename || file.name,
          bytes: uploaded.bytes || file.size,
        });
      }
      const mentions = mentionMembers
        .filter((member) => text.includes(mentionToken(member)))
        .map((member) => ({ uid: member.id || member.uid, name: member.name || "Student" }));

      await onSend({
        text: text.trim(),
        attachments,
        mentions,
        replyTo: replyTo ? { id: replyTo.id, senderId: replyTo.senderId || "", senderName: replyTo.senderName || "Student", text: messagePreview(replyTo) } : null,
      });
      setText("");
      setFile(null);
      onCancelReply?.();
    } catch (err) {
      setError(err?.errors?.[0] || err.message || "Could not send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`relative p-3 ${cx.panel}`}>
      {replyTo && (
        <div className={`mb-3 flex items-start justify-between gap-3 border-l-4 p-3 text-xs [border-left-color:var(--brand)] ${cx.soft}`}>
          <div className="min-w-0">
            <p className="font-semibold">Replying to {replyTo.senderName || "Student"}</p>
            <p className={`mt-0.5 line-clamp-1 ${cx.muted}`}>{messagePreview(replyTo)}</p>
          </div>
          <button type="button" onClick={onCancelReply} className="shrink-0 rounded p-1 [color:var(--danger)] hover:[background:var(--danger-soft)]" aria-label="Cancel reply">
            <X size={14} />
          </button>
        </div>
      )}

      {mentionOptions.length > 0 && (
        <div className="quad-pop absolute bottom-full left-3 z-20 mb-2 w-64 overflow-hidden rounded-xl border py-1 shadow-xl [border-color:var(--line)] [background:var(--paper-raised)]">
          {mentionOptions.map((member) => (
            <button key={member.id || member.uid} type="button" onClick={() => pickMention(member)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:[background:var(--paper-sunken)]">
              <UserAvatar src={member.avatar} name={member.name} />
              <span className="truncate font-medium">{member.name}</span>
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={areaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          const pasted = Array.from(e.clipboardData?.files || [])[0];
          if (pasted) {
            e.preventDefault();
            stageFile(pasted);
          }
        }}
        onKeyDown={(e) => {
          if (enterToSend && e.key === "Enter" && !e.shiftKey && window.matchMedia?.("(pointer: fine)").matches) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-h-40 w-full resize-none border-0 bg-transparent px-1 text-sm leading-6 outline-none placeholder:[color:var(--ink-faint)]"
      />

      {file && (
        <div className={`mt-2 flex items-center gap-3 p-2 text-xs ${cx.soft}`}>
          {preview ? (
            <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-lg [background:var(--brand-soft)] [color:var(--brand-text)]"><FileText size={18} /></span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{file.name}</span>
            <span className={cx.faint}>{formatBytes(file.size)}</span>
          </span>
          <button onClick={() => setFile(null)} className="shrink-0 rounded p-1.5 [color:var(--danger)] hover:[background:var(--danger-soft)]" aria-label="Remove attachment">
            <X size={14} />
          </button>
        </div>
      )}
      {error && <div className="mt-2 rounded-lg p-2.5 text-xs font-medium [background:var(--danger-soft)] [color:var(--danger)]">{error}</div>}

      <div className="mt-2 flex items-center justify-between gap-3 border-t pt-2.5 [border-color:var(--line)]">
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition hover:[border-color:var(--brand)] ${cx.soft} ${cx.muted}`}>
          <UploadCloud size={15} /> Attach
          <input
            type="file"
            hidden
            onChange={(e) => {
              stageFile(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
        </label>
        <button onClick={submit} disabled={sending || (!text.trim() && !file)} className={cx.primaryBtn}>
          {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} {sendLabel}
        </button>
      </div>
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
  const [coverPreview, setCoverPreview] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  useEffect(() => {
    if (!cover) return setCoverPreview("");
    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  useEffect(() => {
    if (!avatar) return setAvatarPreview("");
    const url = URL.createObjectURL(avatar);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

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
      onCreated(id);
    } catch (err) {
      setError(err?.errors?.[0] || err.message || "Could not create the group.");
    } finally {
      setSaving(false);
    }
  };

  const privacyOptions = [
    { value: "public", icon: Globe, title: "Public", text: "Anyone can find and join instantly." },
    { value: "private", icon: Lock, title: "Private", text: "People request access; admins approve." },
  ];

  return (
    <div className="fixed inset-0 z-[550] flex items-end justify-center overflow-y-auto bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => !saving && onClose()}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create a group"
        className={`quad-sheet w-full max-w-2xl rounded-b-none p-5 shadow-2xl sm:rounded-2xl sm:rounded-b-2xl md:p-7 ${cx.panel}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Create a group</h2>
            <p className={`mt-1 text-sm ${cx.muted}`}>Set the basics now. You can manage members and rules later.</p>
          </div>
          <button type="button" onClick={onClose} className={cx.ghostIcon} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border [border-color:var(--line)]">
          <div className="relative h-28 [background:var(--paper-sunken)]">
            {coverPreview ? <img src={coverPreview} alt="" className="h-full w-full object-cover" /> : <CoverPattern group={{ name: form.name || "Group" }} />}
            <label className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <ImageIcon size={13} /> {cover ? "Change cover" : "Add cover"}
              <input type="file" hidden accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="flex items-center gap-4 px-4 pb-4">
            <label className="relative -mt-8 cursor-pointer" aria-label="Choose group avatar">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 text-xl font-bold [border-color:var(--paper-raised)] [background:var(--brand-soft)] [color:var(--brand-text)]">
                {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : initial(form.name || "G")}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 [border-color:var(--paper-raised)] [background:var(--brand)] [color:var(--on-brand)]">
                <UploadCloud size={12} />
              </span>
              <input type="file" hidden accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
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
              {CATEGORIES.filter((item) => item !== "All").map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 flex justify-between text-xs font-semibold">
              Description <span className={`font-normal ${cx.faint}`}>{form.description.length}/300</span>
            </span>
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

        {error && <div className="mt-4 rounded-lg border p-3 text-sm font-medium [border-color:var(--danger)] [background:var(--danger-soft)] [color:var(--danger)]">{error}</div>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className={cx.ghostBtn}>Cancel</button>
          <button disabled={saving} className={cx.primaryBtn}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            {saving ? "Creating…" : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Discovery: filters + cards                                                */
/* -------------------------------------------------------------------------- */

function FilterGroup({ title, value, onChange, options }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold [color:var(--ink-faint)]">{title}</legend>
      <div role="radiogroup" aria-label={title} className="space-y-1">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                selected ? "font-semibold [background:var(--brand-soft)] [color:var(--brand-text)]" : "[color:var(--ink-soft)] hover:[background:var(--paper-sunken)]"
              }`}
            >
              <span className="flex items-center gap-2">
                {opt.icon && <opt.icon size={14} />}
                {opt.label}
              </span>
              {selected && <Check size={14} />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterPanel({ view, filters, setFilter, onClear, activeCount }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs font-semibold [color:var(--brand-text)] hover:underline">
            Clear all
          </button>
        )}
      </div>

      {view === "discover" ? (
        <FilterGroup
          title="Membership"
          value={filters.membership}
          onChange={(v) => setFilter("membership", v)}
          options={[
            { value: "all", label: "All groups" },
            { value: "not_joined", label: "Not joined" },
            { value: "joined", label: "Joined" },
          ]}
        />
      ) : (
        <FilterGroup
          title="Your role"
          value={filters.role}
          onChange={(v) => setFilter("role", v)}
          options={[
            { value: "all", label: "Any role" },
            { value: "admin", label: "Owner or admin" },
            { value: "member", label: "Member" },
          ]}
        />
      )}

      <FilterGroup
        title="Privacy"
        value={filters.privacy}
        onChange={(v) => setFilter("privacy", v)}
        options={[
          { value: "all", label: "Any" },
          { value: "public", label: "Public", icon: Globe },
          { value: "private", label: "Private", icon: Lock },
        ]}
      />

      <FilterGroup
        title="Sort by"
        value={filters.sort}
        onChange={(v) => setFilter("sort", v)}
        options={[
          { value: "relevant", label: "Recommended" },
          { value: "members", label: "Most members" },
          { value: "newest", label: "Newest" },
          { value: "name", label: "Name A–Z" },
        ]}
      />
    </div>
  );
}

function FilterSheet({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[540] flex items-end bg-black/50 lg:hidden" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Filters" onClick={(e) => e.stopPropagation()} className="quad-sheet max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] [border-color:var(--line)] [background:var(--paper-raised)]">
        <div className="mb-4 flex justify-end">
          <button onClick={onClose} className={cx.ghostIcon} aria-label="Close filters"><X size={18} /></button>
        </div>
        {children}
        <button onClick={onClose} className={`${cx.primaryBtn} mt-6 w-full`}>Show results</button>
      </div>
    </div>
  );
}

function GroupCard({ group, joined, role, pending, joining, onJoin }) {
  const isPrivate = group.privacy === "private";
  return (
    <article
      className={`quad-rise relative flex flex-col overflow-hidden rounded-2xl border transition hover:shadow-lg [background:var(--paper-raised)] ${
        joined ? "[border-color:var(--ok)]" : "[border-color:var(--line)]"
      }`}
    >
      {joined && <span aria-hidden className="absolute inset-y-0 left-0 z-10 w-1 [background:var(--ok)]" />}
      <Link to={`/community/${group.id}`} className="block flex-1">
        <div className="relative h-20 overflow-hidden">
          <CoverPattern group={group} />
          <div className="absolute left-3 top-3">{joined && <RoleBadge role={role} />}</div>
          <div className="absolute right-3 top-3"><PrivacyBadge privacy={group.privacy} overlay /></div>
        </div>
        <div className="px-5 pb-4">
          <div className="-mt-7 mb-3"><GroupAvatar group={group} size="lg" ring /></div>
          <h2 className="line-clamp-1 text-base font-semibold">{group.name}</h2>
          <p className={`mt-1 line-clamp-2 min-h-[2.75rem] text-sm leading-[1.4rem] ${cx.muted}`}>{group.description}</p>
          <div className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${cx.faint}`}>
            <span className="rounded-full px-2 py-0.5 font-semibold [background:var(--paper-sunken)] [color:var(--ink-soft)]">{group.category}</span>
            <span className="inline-flex items-center gap-1"><Users size={12} /> {group.memberCount || 0} {group.memberCount === 1 ? "member" : "members"}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 border-t px-5 py-3 [border-color:var(--line)]">
        {joined ? (
          <Link to={`/community/${group.id}`} className={`${cx.okBtn} w-full`}>
            <CheckCircle2 size={16} /> Open group
          </Link>
        ) : pending ? (
          <button disabled className={`${cx.ghostBtn} w-full`}>
            <Clock size={16} /> Request sent
          </button>
        ) : (
          <button onClick={() => onJoin(group)} disabled={joining} className={`${cx.primaryBtn} w-full`}>
            {joining ? <Loader2 className="animate-spin" size={16} /> : isPrivate ? <Lock size={15} /> : <Plus size={16} />}
            {isPrivate ? "Request to join" : "Join group"}
          </button>
        )}
      </div>
    </article>
  );
}

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
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
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
  const navigate = useNavigate();
  const { items: toasts, push, dismiss } = useToasts();

  const [profile, setProfile] = useState({});
  const [joined, setJoined] = useState(() => (joinedCache.uid === user?.uid ? joinedCache.map : new Map()));
  const [view, setView] = useState("discover");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mine, setMine] = useState([]);
  const [mineLoading, setMineLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [joiningId, setJoiningId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const cursorRef = useRef(null);
  const lastKeyRef = useRef("");

  const setFilter = (key, value) => setFilters((cur) => ({ ...cur, [key]: value }));
  const clearFilters = () => setFilters((cur) => ({ ...DEFAULT_FILTERS, category: cur.category }));

  // Profile + joined map (cached)
  useEffect(() => {
    if (!user?.uid) return undefined;
    let cancelled = false;
    loadProfile(user).then((p) => !cancelled && setProfile(p)).catch(() => {});
    loadJoined(user.uid).then((m) => !cancelled && setJoined(m));
    return () => { cancelled = true; };
  }, [user?.uid]);

  const load = useCallback(
    async ({ reset = false } = {}) => {
      setLoading(true);
      setError("");
      try {
        const result = await listGroups({ search: search.trim(), category: filters.category, cursor: reset ? null : cursorRef.current });
        result.groups.forEach((g) => groupCache.set(g.id, { at: Date.now(), data: g }));
        setGroups((cur) => (reset ? result.groups : [...cur, ...result.groups]));
        cursorRef.current = result.cursor;
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err?.message || "Could not load groups.");
      } finally {
        setLoading(false);
      }
    },
    [search, filters.category]
  );

  // Only hit the server when the query actually changed.
  useEffect(() => {
    if (view !== "discover") return undefined;
    const key = `${search.trim()}|${filters.category}`;
    if (key === lastKeyRef.current) return undefined;
    const timer = setTimeout(() => {
      lastKeyRef.current = key;
      load({ reset: true });
    }, lastKeyRef.current === "" ? 0 : 350);
    return () => clearTimeout(timer);
  }, [view, search, filters.category, load]);

  // "My groups": fetch each joined group doc once (cached 5 min).
  const joinedKey = useMemo(() => Array.from(joined.keys()).sort().join(","), [joined]);
  useEffect(() => {
    if (view !== "mine") return undefined;
    const ids = joinedKey ? joinedKey.split(",").slice(0, 40) : [];
    if (!ids.length) {
      setMine([]);
      return undefined;
    }
    let cancelled = false;
    setMineLoading(true);
    Promise.all(
      ids.map(async (id) => {
        const cached = groupCache.get(id);
        if (fresh(cached)) return cached.data;
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
      setMine(list.filter(Boolean));
      setMineLoading(false);
    });
    return () => { cancelled = true; };
  }, [view, joinedKey]);

  const handleJoin = async (group) => {
    if (!user?.uid) return;
    setJoiningId(group.id);
    try {
      const p = Object.keys(profile).length ? profile : await loadProfile(user);
      if (group.privacy === "private") {
        await requestJoinGroup(group, user, p);
        setPendingIds((cur) => new Set(cur).add(group.id));
        push(`Request sent to ${group.name}. You'll be notified when it's approved.`, { tone: "success" });
      } else {
        await joinPublicGroup(group, user, p);
        markJoined(user.uid, group.id, "member");
        setJoined(new Map(joinedCache.map));
        setGroups((cur) => cur.map((g) => (g.id === group.id ? { ...g, memberCount: (g.memberCount || 0) + 1 } : g)));
        push(`You joined ${group.name}.`, { tone: "success", action: { label: "Open", to: `/community/${group.id}` } });
      }
    } catch (err) {
      push(err?.message || "Could not complete that. Try again.", { tone: "error" });
    } finally {
      setJoiningId("");
    }
  };

  const visible = useMemo(() => {
    const isMine = view === "mine";
    const q = search.trim().toLowerCase();
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
  }, [view, mine, groups, joined, filters, search]);

  const activeCount =
    (filters.privacy !== "all" ? 1 : 0) +
    (view === "discover" ? (filters.membership !== "all" ? 1 : 0) : filters.role !== "all" ? 1 : 0) +
    (filters.sort !== "relevant" ? 1 : 0) +
    (filters.category !== "All" ? 1 : 0);

  const activeChips = [
    filters.category !== "All" && { key: "category", label: filters.category, reset: "All" },
    filters.privacy !== "all" && { key: "privacy", label: filters.privacy === "public" ? "Public" : "Private", reset: "all" },
    view === "discover" && filters.membership !== "all" && { key: "membership", label: filters.membership === "joined" ? "Joined" : "Not joined", reset: "all" },
    view === "mine" && filters.role !== "all" && { key: "role", label: filters.role === "admin" ? "Owner or admin" : "Member", reset: "all" },
  ].filter(Boolean);

  const filterPanel = <FilterPanel view={view} filters={filters} setFilter={setFilter} onClear={clearFilters} activeCount={activeCount} />;
  const showSkeleton = view === "discover" ? loading && groups.length === 0 : mineLoading;

  return (
    <div className="md:mt-16">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Groups</h1>
            <p className={`mt-1 max-w-xl text-sm leading-6 ${cx.muted}`}>Find your classmates, join the conversation, and keep everything for a class or club in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/messages" title="Messages" aria-label="Messages" className={cx.ghostIcon}><MessageCircle size={18} /></Link>
            <Link to="/notifications" title="Notifications" aria-label="Notifications" className={cx.ghostIcon}><Bell size={18} /></Link>
            <button onClick={() => setCreateOpen(true)} className={cx.primaryBtn}><Plus size={17} /> Create group</button>
          </div>
        </header>

        {/* View switch + search */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className={`inline-flex shrink-0 rounded-xl border p-1 [border-color:var(--line)] [background:var(--paper-raised)]`} role="tablist" aria-label="Group views">
            {[
              { key: "discover", label: "Discover", icon: Compass },
              { key: "mine", label: `Joined${joined.size ? ` (${joined.size})` : ""}`, icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  view === key ? "[background:var(--brand)] [color:var(--on-brand)]" : "[color:var(--ink-soft)] hover:[color:var(--ink)]"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-xl border px-4 [border-color:var(--line)] [background:var(--paper-raised)] focus-within:[border-color:var(--brand)]">
              <Search size={17} className={cx.faint} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={view === "mine" ? "Search your groups" : "Search all groups"}
                aria-label="Search groups"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:[color:var(--ink-faint)]"
              />
              {search && (
                <button onClick={() => setSearch("")} className={cx.faint} aria-label="Clear search"><X size={16} /></button>
              )}
            </div>
            <button onClick={() => setSheetOpen(true)} className={`${cx.ghostBtn} relative h-[46px] lg:hidden`} aria-label="Open filters">
              <SlidersHorizontal size={16} /> Filters
              {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold [background:var(--brand)] [color:var(--on-brand)]">{activeCount}</span>}
            </button>
          </div>
        </div>

        <div className="mt-4"><CategoryChips value={filters.category} onChange={(v) => setFilter("category", v)} /></div>

        {/* Body */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className={`sticky top-24 p-5 ${cx.panel}`}>{filterPanel}</div>
          </aside>

          <section aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <p className={`mr-1 text-sm font-semibold`}>
                {showSkeleton ? "Loading…" : `${visible.length} ${visible.length === 1 ? "group" : "groups"}`}
              </p>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setFilter(chip.key, chip.reset)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold [background:var(--brand-soft)] [color:var(--brand-text)]"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label} <X size={12} />
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium [border-color:var(--danger)] [background:var(--danger-soft)] [color:var(--danger)]">
                {error}
                <button onClick={() => load({ reset: true })} className="shrink-0 font-semibold underline">Retry</button>
              </div>
            )}

            {showSkeleton ? (
              <SkeletonCards />
            ) : visible.length === 0 ? (
              view === "mine" && joined.size === 0 ? (
                <EmptyState
                  icon={Users}
                  title="You haven't joined any groups yet"
                  text="Groups you join or create show up here for quick access."
                  action={<button onClick={() => setView("discover")} className={cx.primaryBtn}><Compass size={16} /> Discover groups</button>}
                />
              ) : (
                <EmptyState
                  icon={Search}
                  title="No groups match"
                  text="Try a different search, or clear your filters."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      {(activeCount > 0 || search) && (
                        <button onClick={() => { clearFilters(); setFilter("category", "All"); setSearch(""); }} className={cx.ghostBtn}>Clear filters</button>
                      )}
                      <button onClick={() => setCreateOpen(true)} className={cx.primaryBtn}><Plus size={16} /> Start a group</button>
                    </div>
                  }
                />
              )
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    joined={joined.has(group.id)}
                    role={joined.get(group.id)?.role}
                    pending={pendingIds.has(group.id)}
                    joining={joiningId === group.id}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            )}

            {view === "discover" && hasMore && !showSkeleton && (
              <div className="mt-8 flex justify-center">
                <button onClick={() => load()} disabled={loading} className={cx.ghostBtn}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />} {loading ? "Loading…" : "Load more groups"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {sheetOpen && <FilterSheet onClose={() => setSheetOpen(false)}>{filterPanel}</FilterSheet>}
      {createOpen && <CreateGroupModal user={user} profile={profile} onClose={() => setCreateOpen(false)} onCreated={(id) => navigate(`/community/${id}`)} />}
      <ToastHost items={toasts} dismiss={dismiss} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Group detail                                                              */
/* -------------------------------------------------------------------------- */

function PostCard({ post, groupId, uid, onDelete }) {
  return (
    <article className={`quad-rise p-5 ${cx.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar src={post.authorAvatar} name={post.authorName} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{post.authorName}</p>
            <p className={`text-xs ${cx.faint}`}>{formatShortTime(post.createdAt)}</p>
          </div>
        </div>
        {post.authorId === uid && (
          <Menu label="Post options" trigger={<span className="flex h-8 w-8 items-center justify-center rounded-full hover:[background:var(--paper-sunken)]"><MoreHorizontal size={17} /></span>}>
            {(close) => (
              <MenuItem
                icon={Trash2}
                label="Delete post"
                tone="danger"
                onClick={() => {
                  close();
                  onDelete(post);
                }}
              />
            )}
          </Menu>
        )}
      </div>
      {post.text && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{post.text}</p>}
      {(post.attachments || []).map((item, index) => (
        <AttachmentPreview key={`${post.id}-${index}`} attachment={item} />
      ))}
      <ReactionBar post={post} groupId={groupId} uid={uid} />
    </article>
  );
}

function renderMentions(text) {
  return text.split(/(@[^\s@]+)/g).map((part, i) =>
    i % 2 === 1 ? <span key={i} className="font-semibold underline decoration-dotted underline-offset-2">{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

function ChatMessage({ message, mine, avatar, name, onReply, onOpenDM, groupId, uid, onVotePoll, onEditPoll, onTogglePollClosed }) {
  const poll = message.type === "poll" ? message.poll : null;
  const totalVotes = poll ? new Set(poll.options?.flatMap((option) => option.voterIds || []) || []).size : 0;
  return (
    <div className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && (
        <button onClick={() => onOpenDM(message.senderId)} aria-label={`Message ${name}`} className="shrink-0">
          <UserAvatar src={avatar} name={name} />
        </button>
      )}
      {mine && (
        <button onClick={() => onReply(message)} className="mb-1 rounded-full p-1.5 opacity-60 transition hover:opacity-100 md:opacity-0 md:group-hover:opacity-70" aria-label="Reply" title="Reply">
          <Reply size={14} />
        </button>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2 ${
          mine ? "rounded-br-md [background:var(--brand)] [color:var(--on-brand)]" : "rounded-bl-md border [border-color:var(--line)] [background:var(--paper-sunken)]"
        }`}
      >
        <p className={`text-[11px] font-semibold ${mine ? "opacity-80" : cx.faint}`}>
          {mine ? "You" : name} · {formatShortTime(message.createdAt)}
        </p>
        {message.replyTo && (
          <div className={`mt-1.5 rounded-lg border-l-2 p-2 text-xs ${mine ? "border-white/60 bg-white/10" : "[border-color:var(--brand)] [background:var(--brand-soft)]"}`}>
            <p className="font-semibold opacity-90">{message.replyTo.senderName}</p>
            <p className="mt-0.5 line-clamp-2 opacity-80">{message.replyTo.text}</p>
          </div>
        )}
        {message.text && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{renderMentions(message.text)}</p>}
        {poll && (
          <div className={`mt-2 min-w-64 ${mine ? "text-white" : ""}`}>
            <p className="text-sm font-bold">{poll.question}</p>
            <div className="mt-2 space-y-2">
              {poll.options.map((option) => {
                const count = option.voterIds?.length || 0;
                const selected = option.voterIds?.includes(uid);
                const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                return <button key={option.id} disabled={poll.isClosed} onClick={() => onVotePoll(message, option.id)} className={`relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-80 ${mine ? "border-white/30 bg-white/10" : "[border-color:var(--line)] [background:var(--paper-raised)]"}`}>
                  <span className={`absolute inset-y-0 left-0 ${mine ? "bg-white/15" : "[background:var(--brand-soft)]"}`} style={{ width: `${percent}%` }} />
                  <span className="relative flex justify-between gap-3"><span>{selected ? "✓ " : ""}{option.text}</span><span>{percent}%</span></span>
                </button>;
              })}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] opacity-75"><span>{totalVotes} {totalVotes === 1 ? "vote" : "votes"} · {poll.multiSelect ? "Multiple answers" : "One answer"}</span>{poll.isClosed ? <span>Poll closed</span> : null}</div>
            {mine && <div className="mt-2 flex gap-2"><button onClick={() => onEditPoll(message)} className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold">Edit</button><button onClick={() => onTogglePollClosed(message)} className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold">{poll.isClosed ? "Reopen" : "Close poll"}</button></div>}
          </div>
        )}
        {(message.attachments || []).map((item, index) => (
          <AttachmentPreview key={index} attachment={item} />
        ))}
      </div>
      {!mine && (
        <button onClick={() => onReply(message)} className="mb-1 rounded-full p-1.5 opacity-60 transition hover:opacity-100 md:opacity-0 md:group-hover:opacity-70" aria-label="Reply" title="Reply">
          <Reply size={14} />
        </button>
      )}
    </div>
  );
}

function GroupDetail({ groupId }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { items: toasts, push, dismiss } = useToasts();

  const [profile, setProfile] = useState({});
  const [group, setGroup] = useState(null);
  const [membership, setMembership] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [tab, setTab] = useState("Feed");
  const [posts, setPosts] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [olderMessages, setOlderMessages] = useState([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pollBuilder, setPollBuilder] = useState(null);

  const chatScrollRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatStickRef = useRef(true);
  const chatFirstRef = useRef(true);
  const olderCursorRef = useRef(null);
  const olderLoadedRef = useRef(false);
  const membersLoadedRef = useRef("");

  const isMember = Boolean(membership);
  const canManage = membership?.role === "owner" || membership?.role === "admin" || group?.ownerId === user?.uid;
  const isPremium = profile?.plan === "premium" || profile?.premium === true;

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!user?.uid) return;
      if (!silent) setLoading(true);
      try {
        const [groupData, profileData, membershipData] = await Promise.all([getGroup(groupId), loadProfile(user), getMembership(groupId, user.uid)]);
        setGroup(groupData);
        setProfile(profileData || {});
        setMembership(membershipData);
        if (groupData) groupCache.set(groupId, { at: Date.now(), data: { ...groupData, id: groupId } });
        if (membershipData) markJoined(user.uid, groupId, membershipData.role || "member");
        if (!membershipData && groupData?.privacy === "private") {
          const requestSnap = await getDocs(query(collection(db, "groups", groupId, "joinRequests"), where("uid", "==", user.uid), limit(1)));
          setPendingRequest(!requestSnap.empty);
        }
      } finally {
        setLoading(false);
      }
    },
    [groupId, user?.uid]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Posts power Feed, Media and Files, so one listener serves all three tabs.
  const needsPosts = isMember && (tab === "Feed" || tab === "Media" || tab === "Files");
  useEffect(() => {
    if (!needsPosts) return undefined;
    return listenGroupPosts(groupId, (items) => setPosts(items));
  }, [groupId, needsPosts]);

  const needsChat = isMember && tab === "Chat";
  useEffect(() => {
    if (!needsChat) return undefined;
    olderLoadedRef.current = false;
    olderCursorRef.current = null;
    chatFirstRef.current = true;
    chatStickRef.current = true;
    setOlderMessages([]);
    return listenGroupMessages(groupId, (items, cursor) => {
      setLiveMessages(items);
      if (!olderLoadedRef.current) {
        olderCursorRef.current = cursor || null;
        setHasOlder(Boolean(cursor));
      }
      if (chatStickRef.current) {
        const behavior = chatFirstRef.current ? "auto" : "smooth";
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior, block: "end" }), 60);
      }
      chatFirstRef.current = false;
    });
  }, [groupId, needsChat]);

  // Members + join requests: fetched once per group, not on every tab switch.
  useEffect(() => {
    if (!isMember || (tab !== "Members" && tab !== "Chat")) return;
    if (membersLoadedRef.current === groupId) return;
    membersLoadedRef.current = groupId;
    getDocs(query(collection(db, "groups", groupId, "members"), orderBy("joinedAt", "desc"), limit(50)))
      .then((snap) => setMembers(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }))))
      .catch(() => { membersLoadedRef.current = ""; });
    if (canManage) {
      getDocs(query(collection(db, "groups", groupId, "joinRequests"), orderBy("requestedAt", "desc"), limit(30)))
        .then((snap) => setRequests(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }))))
        .catch(() => {});
    }
  }, [canManage, groupId, isMember, tab]);

  const messages = useMemo(() => {
    const map = new Map();
    [...olderMessages, ...liveMessages].forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [olderMessages, liveMessages]);

  const loadOlder = async () => {
    if (!olderCursorRef.current || loadingOlder) return;
    setLoadingOlder(true);
    const el = chatScrollRef.current;
    const prev = el?.scrollHeight || 0;
    try {
      const res = await loadOlderGroupMessages(groupId, olderCursorRef.current);
      olderLoadedRef.current = true;
      olderCursorRef.current = res.cursor || null;
      setHasOlder(Boolean(res.cursor) && res.messages.length > 0);
      chatStickRef.current = false;
      setOlderMessages((cur) => [...res.messages, ...cur]);
      requestAnimationFrame(() => el && (el.scrollTop += el.scrollHeight - prev));
    } catch {
      push("Could not load older messages.", { tone: "error" });
    } finally {
      setLoadingOlder(false);
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      if (group.privacy === "private") {
        await requestJoinGroup(group, user, profile);
        setPendingRequest(true);
        push("Request sent. You'll be notified when an admin approves it.", { tone: "success" });
      } else {
        await joinPublicGroup(group, user, profile);
        markJoined(user.uid, groupId, "member");
        await refresh({ silent: true });
        push(`Welcome to ${group.name}.`, { tone: "success" });
      }
    } catch (err) {
      push(err?.message || "Could not join this group.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!window.confirm(`Leave ${group.name}? You'll lose access to its posts and chat.`)) return;
    try {
      await leaveGroup(group, user.uid);
      markLeft(user.uid, groupId);
      membersLoadedRef.current = "";
      await refresh({ silent: true });
      push(`You left ${group.name}.`);
    } catch (err) {
      push(err?.message || "Could not leave the group.", { tone: "error" });
    }
  };

  const sendPost = async (payload) => createPost(groupId, user, profile, payload);
  const sendChat = async (payload) => {
    chatStickRef.current = true;
    await sendGroupMessage(groupId, user, profile, payload);
    setReplyTo(null);
  };
  const savePoll = async (input) => {
    try { if (pollBuilder?.id) await editGroupPoll(groupId, pollBuilder.id, user.uid, input); else await createGroupPoll(groupId, user, profile, input); }
    catch (err) { push(err?.message || "Could not save poll.", { tone: "error" }); throw err; }
  };
  const votePoll = async (message, optionId) => { try { await voteGroupPoll(groupId, message.id, optionId, user.uid); } catch (err) { push(err?.message || "Could not record your vote.", { tone: "error" }); } };
  const togglePollClosed = async (message) => { try { await setGroupPollClosed(groupId, message.id, user.uid, !message.poll?.isClosed); } catch (err) { push(err?.message || "Could not update poll.", { tone: "error" }); } };
  const deletePost = async (post) => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      await deleteOwnPost(groupId, post.id);
    } catch (err) {
      push(err?.message || "Could not delete the post.", { tone: "error" });
    }
  };
  const openDirectMessage = (uid) => {
    if (!uid || uid === user?.uid) return;
    navigate(`/messages?user=${encodeURIComponent(uid)}`);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      push("Group link copied.", { tone: "success" });
    } catch {
      push("Could not copy the link.", { tone: "error" });
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

  if (loading) {
    return (
      <div className="md:mt-20">
        <div className="mx-auto max-w-7xl px-4 py-8"><SkeletonCards count={3} /></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="md:mt-20">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <EmptyState icon={Users} title="Group not found" text="This group may have been deleted or the link is incorrect." action={<Link to="/community" className={cx.primaryBtn}>Browse groups</Link>} />
        </div>
      </div>
    );
  }

  const tabCount = { Members: group.memberCount, Files: group.fileCount };

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
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className={`p-3 ${cx.soft}`}><dt className={`text-xs ${cx.faint}`}>Category</dt><dd className="mt-0.5 font-semibold">{group.category}</dd></div>
        <div className={`p-3 ${cx.soft}`}><dt className={`text-xs ${cx.faint}`}>Privacy</dt><dd className="mt-0.5 font-semibold capitalize">{group.privacy || "public"}</dd></div>
        <div className={`col-span-2 p-3 ${cx.soft}`}><dt className={`text-xs ${cx.faint}`}>Created</dt><dd className="mt-0.5 font-semibold">{formatShortTime(group.createdAt)}</dd></div>
      </dl>
    </div>
  );

  return (
    <div className="md:mt-16">
      <div className="mx-auto max-w-7xl px-3 py-3 md:px-6 md:py-4">
        {/* CHAT TAB: Dedicated, streamlined chat view without giant banners */}
        {isMember && tab === "Chat" ? (
          <div className={`flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100dvh-5.5rem)] overflow-hidden rounded-2xl border ${cx.panel}`}>
            {/* Sleek chat top header bar */}
            <div className="flex shrink-0 items-center justify-between border-b px-3.5 py-2.5 [border-color:var(--line)] [background:var(--paper-raised)]">
              <div className="flex min-w-0 items-center gap-2.5">
                <Link to="/community" className={`${cx.ghostBtn} -ml-1 h-8 px-2 text-xs`} title="Back to all groups">
                  <ChevronLeft size={16} /> <span className="hidden sm:inline">Groups</span>
                </Link>
                <GroupAvatar group={group} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm sm:text-base font-bold">{group.name}</h2>
                    {isMember && <RoleBadge role={membership?.role || "member"} />}
                    <PrivacyBadge privacy={group.privacy} />
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${cx.muted}`}>
                    <span className="inline-flex items-center gap-1"><Users size={12} /> {group.memberCount || 0} members</span>
                    <span className="opacity-40">•</span>
                    <span className="capitalize">{group.category}</span>
                  </div>
                </div>
              </div>

              {/* Tab switcher pills in header + menu */}
              <div className="flex items-center gap-1.5">
                <div className="hidden md:flex items-center gap-1 rounded-xl p-1 [background:var(--paper-sunken)]">
                  {DETAIL_TABS.map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        tab === key
                          ? "[background:var(--brand)] [color:var(--on-brand)] shadow-sm"
                          : "[color:var(--ink-soft)] hover:[color:var(--ink)]"
                      }`}
                    >
                      <Icon size={13} /> {key}
                    </button>
                  ))}
                </div>

                <div className="md:hidden">
                  <select
                    value={tab}
                    onChange={(e) => setTab(e.target.value)}
                    className="h-8 rounded-lg border px-2 text-xs font-semibold [border-color:var(--line)] [background:var(--paper-sunken)]"
                  >
                    {DETAIL_TABS.map(({ key }) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>

                <Menu
                  label="More actions"
                  trigger={<span className={cx.ghostIcon}><MoreHorizontal size={18} /></span>}
                >
                  {(close) => (
                    <>
                      <MenuItem icon={Copy} label="Copy group link" onClick={() => { close(); copyLink(); }} />
                      <MenuItem icon={MessageCircle} label="Direct messages" onClick={() => { close(); navigate("/messages"); }} />
                      <MenuItem icon={Settings} label="Messaging settings" onClick={() => { close(); navigate("/community-settings"); }} />
                      {canManage && <MenuItem icon={ShieldCheck} label="Manage group" onClick={() => { close(); navigate(`/community/${groupId}/manage`); }} />}
                      {membership?.role !== "owner" && <MenuItem icon={UserMinus} label="Leave group" tone="danger" onClick={() => { close(); leave(); }} />}
                    </>
                  )}
                </Menu>
              </div>
            </div>

            {/* Chat messages viewport */}
            <div
              ref={chatScrollRef}
              onScroll={() => {
                const el = chatScrollRef.current;
                if (el) chatStickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
              }}
              className="min-h-0 flex-1 overflow-y-auto p-4"
            >
              {hasOlder && (
                <button onClick={loadOlder} disabled={loadingOlder} className={`mx-auto mb-4 block rounded-full border px-4 py-1.5 text-xs font-semibold disabled:opacity-60 [border-color:var(--line)] ${cx.muted}`}>
                  {loadingOlder ? "Loading…" : "Load older messages"}
                </button>
              )}
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle size={32} className={cx.faint} />
                  <p className="mt-3 text-sm font-semibold">No messages yet</p>
                  <p className={`mt-1 text-xs ${cx.muted}`}>Say hello to the group.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const mine = message.senderId === user.uid;
                    return (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        mine={mine}
                        name={message.senderName || "Student"}
                        avatar={mine ? message.senderAvatar || profile.photo || user?.photoURL || "" : message.senderAvatar || ""}
                        onReply={setReplyTo}
                        onOpenDM={openDirectMessage}
                        groupId={groupId}
                        uid={user.uid}
                        onVotePoll={votePoll}
                        onEditPoll={(message) => setPollBuilder(message)}
                        onTogglePollClosed={togglePollClosed}
                      />
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t p-3 [border-color:var(--line)] [background:var(--paper-raised)]">
              <button onClick={() => setPollBuilder({})} className={`mb-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${cx.soft}`}>Create poll</button>
              <Composer
                placeholder="Message the group. Type @ to mention someone."
                onSend={sendChat}
                allowVideo={isPremium}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                mentionMembers={members.filter((m) => m.id !== user?.uid)}
                enterToSend
              />
            </div>
          </div>
        ) : (
          /* REGULAR TABS (Feed, Members, Media, Files, About) OR NON-MEMBER VIEW */
          <>
            <Link to="/community" className={`${cx.ghostBtn} mb-3 h-8 px-2.5 text-xs`}>
              <ChevronLeft size={15} /> All groups
            </Link>

            {/* Header: compact modern banner */}
            <div className={`overflow-hidden rounded-2xl border ${cx.panel}`}>
              <div className="h-20 sm:h-28"><CoverPattern group={group} /></div>
              <div className="px-4 pb-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-3">
                    <div className="-mt-8 sm:-mt-10 shrink-0"><GroupAvatar group={group} size="lg" ring /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{group.name}</h1>
                        {isMember && <RoleBadge role={membership?.role || "member"} />}
                        <PrivacyBadge privacy={group.privacy} />
                      </div>
                      <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${cx.muted}`}>
                        <span className="rounded-full px-2 py-0.5 font-semibold [background:var(--paper-sunken)]">{group.category}</span>
                        <span className="inline-flex items-center gap-1"><Users size={12} /> {group.memberCount || 0} members</span>
                        <span className="inline-flex items-center gap-1"><Calendar size={12} /> Since {formatShortTime(group.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isMember ? (
                      <>
                        <button onClick={() => setTab("Chat")} className={`${cx.primaryBtn} h-9 px-3 text-xs`}><MessageCircle size={15} /> Chat</button>
                        <Menu
                          label="More actions"
                          trigger={<span className={cx.ghostIcon}><MoreHorizontal size={18} /></span>}
                        >
                          {(close) => (
                            <>
                              <MenuItem icon={Copy} label="Copy group link" onClick={() => { close(); copyLink(); }} />
                              <MenuItem icon={MessageCircle} label="Direct messages" onClick={() => { close(); navigate("/messages"); }} />
                              <MenuItem icon={Settings} label="Messaging settings" onClick={() => { close(); navigate("/community-settings"); }} />
                              {canManage && <MenuItem icon={ShieldCheck} label="Manage group" onClick={() => { close(); navigate(`/community/${groupId}/manage`); }} />}
                              {membership?.role !== "owner" && <MenuItem icon={UserMinus} label="Leave group" tone="danger" onClick={() => { close(); leave(); }} />}
                            </>
                          )}
                        </Menu>
                      </>
                    ) : (
                      <>
                        <button onClick={copyLink} className={cx.ghostIcon} aria-label="Copy group link" title="Copy link"><Copy size={16} /></button>
                        <button onClick={join} disabled={busy || pendingRequest} className={cx.primaryBtn}>
                          {busy ? <Loader2 className="animate-spin" size={16} /> : pendingRequest ? <Clock size={16} /> : group.privacy === "private" ? <Lock size={15} /> : <Plus size={16} />}
                          {pendingRequest ? "Request sent" : group.privacy === "private" ? "Request to join" : "Join group"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isMember ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className={`p-5 ${cx.panel}`}>{aboutBlock}</div>
                <div className={`h-fit p-5 text-center ${cx.panel}`}>
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl [background:var(--brand-soft)] [color:var(--brand-text)]">
                    {group.privacy === "private" ? <Lock size={20} /> : <Users size={20} />}
                  </div>
                  <h2 className="mt-3 text-sm font-semibold">{group.privacy === "private" ? "This is a private group" : "Join to take part"}</h2>
                  <p className={`mt-1 text-xs leading-5 ${cx.muted}`}>
                    {pendingRequest
                      ? "Your request is waiting for an admin. You'll get a notification once it's approved."
                      : group.privacy === "private"
                        ? "Request access and an admin will review it. Posts, chat, media and files unlock after you're approved."
                        : "Join to see posts, chat with members, and share files."}
                  </p>
                  <button onClick={join} disabled={busy || pendingRequest} className={`${cx.primaryBtn} mt-4 w-full text-xs`}>
                    {busy ? <Loader2 className="animate-spin" size={15} /> : pendingRequest ? <Clock size={15} /> : group.privacy === "private" ? <Lock size={14} /> : <Plus size={15} />}
                    {pendingRequest ? "Request sent" : group.privacy === "private" ? "Request to join" : "Join group"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="min-w-0">
                  <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto border-b px-3 [border-color:var(--line)] md:mx-0 md:px-0" role="tablist">
                    {DETAIL_TABS.map(({ key, icon: Icon }) => {
                      const active = tab === key;
                      const count = key === "Members" && canManage && requests.length > 0 ? requests.length : null;
                      return (
                        <button
                          key={key}
                          role="tab"
                          aria-selected={active}
                          onClick={() => setTab(key)}
                          className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition ${
                            active ? "[border-color:var(--brand)] [color:var(--brand-text)]" : "border-transparent [color:var(--ink-soft)] hover:[color:var(--ink)]"
                          }`}
                        >
                          <Icon size={14} /> {key}
                          {count && <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold [background:var(--danger)] text-white">{count}</span>}
                          {!count && tabCount[key] > 0 && <span className={`text-[11px] font-medium ${cx.faint}`}>{tabCount[key]}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-4">
                    {tab === "Feed" && (
                      <>
                        <Composer placeholder="Share an update, question, or study resource…" onSend={sendPost} allowVideo={isPremium} sendLabel="Post" />
                        {posts.length === 0 ? (
                          <EmptyState icon={Newspaper} title="No posts yet" text="Be the first to share something helpful with the group." />
                        ) : (
                          posts.map((post) => <PostCard key={post.id} post={post} groupId={groupId} uid={user.uid} onDelete={deletePost} />)
                        )}
                      </>
                    )}

                    {tab === "Members" && (
                      <div className="space-y-4">
                        {canManage && requests.length > 0 && (
                          <div className={`p-4 ${cx.panel}`}>
                            <h2 className="text-sm font-semibold">Join requests ({requests.length})</h2>
                            <div className="mt-3 space-y-2">
                              {requests.map((request) => (
                                <div key={request.id} className={`flex flex-wrap items-center justify-between gap-3 p-3 ${cx.soft}`}>
                                  <span className="text-sm font-semibold">{request.name}</span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await approveJoinRequest(group, request);
                                          setRequests((items) => items.filter((i) => i.id !== request.id));
                                          membersLoadedRef.current = "";
                                          push(`${request.name} was approved.`, { tone: "success" });
                                        } catch (err) {
                                          push(err?.message || "Could not approve.", { tone: "error" });
                                        }
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold [background:var(--ok-soft)] [color:var(--ok)]"
                                    >
                                      <Check size={14} /> Approve
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await rejectJoinRequest(group, request);
                                          setRequests((items) => items.filter((i) => i.id !== request.id));
                                        } catch (err) {
                                          push(err?.message || "Could not decline.", { tone: "error" });
                                        }
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold [background:var(--danger-soft)] [color:var(--danger)]"
                                    >
                                      <X size={14} /> Decline
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 rounded-xl border px-4 [border-color:var(--line)] [background:var(--paper-raised)] focus-within:[border-color:var(--brand)]">
                          <Search size={16} className={cx.faint} />
                          <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members" aria-label="Search members" className="h-11 w-full bg-transparent text-sm outline-none placeholder:[color:var(--ink-faint)]" />
                        </div>

                        {filteredMembers.length === 0 ? (
                          <EmptyState icon={Users} title={memberSearch ? "No members match" : "No members to show"} text={memberSearch ? "Try a different name." : "Members will appear here."} />
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {filteredMembers.map((member) => {
                              const self = member.id === user.uid;
                              return (
                                <div key={member.id} className={`flex items-center gap-3 p-3 ${cx.panel}`}>
                                  <UserAvatar src={member.avatar} name={member.name} size="md" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{member.name}{self && <span className={`ml-1 font-normal ${cx.faint}`}>(you)</span>}</p>
                                    <p className={`text-xs capitalize ${cx.muted}`}>{member.role || "member"}</p>
                                  </div>
                                  {!self && (
                                    <button onClick={() => openDirectMessage(member.id)} className={cx.ghostIcon} aria-label={`Message ${member.name}`} title="Message">
                                      <MessageCircle size={16} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {tab === "Media" &&
                      (mediaItems.length ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {mediaItems.map((item, i) => <AttachmentPreview key={i} attachment={item} compact />)}
                        </div>
                      ) : (
                        <EmptyState icon={ImageIcon} title="No media yet" text="Photos and videos shared in posts will appear here." />
                      ))}

                    {tab === "Files" &&
                      (fileItems.length ? (
                        <div className="space-y-1">{fileItems.map((item, i) => <AttachmentPreview key={i} attachment={item} />)}</div>
                      ) : (
                        <EmptyState icon={FileText} title="No files yet" text="PDFs and documents shared in posts will appear here." />
                      ))}

                    {tab === "About" && <div className={`p-6 ${cx.panel}`}>{aboutBlock}</div>}
                  </div>
                </section>

                <aside className="space-y-4">
                  <div className={`p-4 sm:p-5 ${cx.panel}`}>
                    <h3 className="text-sm font-semibold">Activity</h3>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Members", value: group.memberCount },
                        { label: "Posts", value: group.postCount },
                        { label: "Files", value: group.fileCount },
                      ].map((s) => (
                        <div key={s.label} className={`p-2.5 ${cx.soft}`}>
                          <p className="text-base font-bold">{s.value || 0}</p>
                          <p className={`text-[11px] ${cx.faint}`}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {group.rules && (
                    <div className={`p-4 sm:p-5 ${cx.panel}`}>
                      <h3 className="text-sm font-semibold">Group rules</h3>
                      <p className={`mt-2 line-clamp-4 text-xs leading-5 ${cx.muted}`}>{group.rules}</p>
                      <button onClick={() => setTab("About")} className="mt-2 text-xs font-semibold [color:var(--brand-text)] hover:underline">Read more</button>
                    </div>
                  )}

                  <div className={`overflow-hidden ${cx.panel}`}>
                    <h3 className="px-4 pt-4 sm:px-5 sm:pt-5 text-sm font-semibold">Shortcuts</h3>
                    <div className="mt-2 pb-2">
                      <Link to="/messages" className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-medium transition hover:[background:var(--paper-sunken)]">
                        Direct messages <MessageCircle size={15} className={cx.muted} />
                      </Link>
                      <Link to="/community-settings" className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-medium transition hover:[background:var(--paper-sunken)]">
                        Messaging settings <Settings size={15} className={cx.muted} />
                      </Link>
                      {canManage && (
                        <Link to={`/community/${groupId}/manage`} className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-medium transition hover:[background:var(--paper-sunken)]">
                          Manage group <ShieldCheck size={15} className="[color:var(--brand-text)]" />
                        </Link>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </div>
      <ToastHost items={toasts} dismiss={dismiss} />
      {pollBuilder && <PollBuilderModal poll={pollBuilder?.poll} onClose={() => setPollBuilder(null)} onSave={savePoll} />}
    </div>
  );
}

export default function Community({ dark = false }) {
  const { groupId } = useParams();
  return <PageChrome dark={dark}>{groupId ? <GroupDetail groupId={groupId} /> : <GroupDiscovery />}</PageChrome>;
}

function PollBuilderModal({ poll, onClose, onSave }) {
  const [question, setQuestion] = useState(poll?.question || "");
  const [options, setOptions] = useState(poll?.options?.map((item) => item.text) || ["", ""]);
  const [multiSelect, setMultiSelect] = useState(Boolean(poll?.multiSelect));
  const [saving, setSaving] = useState(false);
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { await onSave({ question, options, multiSelect }); onClose(); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}><form onSubmit={submit} onClick={(event) => event.stopPropagation()} className={`w-full max-w-lg p-5 shadow-2xl ${cx.panel}`}><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">{poll ? "Edit poll" : "Create a poll"}</h2><p className={`mt-1 text-xs ${cx.muted}`}>Set up a decision your group can act on.</p></div><button type="button" onClick={onClose} className={cx.ghostIcon}><X size={17} /></button></div><label className="mt-5 block text-xs font-bold">Question<textarea className={`mt-2 ${cx.input}`} rows={3} value={question} maxLength={220} onChange={(event) => setQuestion(event.target.value)} placeholder="What should the group decide?" /></label><div className="mt-4 space-y-2">{options.map((option, index) => <div key={index} className="flex gap-2"><input className={cx.input} value={option} maxLength={100} onChange={(event) => setOptions((items) => items.map((item, i) => i === index ? event.target.value : item))} placeholder={`Option ${index + 1}`} />{options.length > 2 && <button type="button" onClick={() => setOptions((items) => items.filter((_, i) => i !== index))} className="text-xs font-bold [color:var(--danger)]">Remove</button>}</div>)}</div>{options.length < 6 && <button type="button" onClick={() => setOptions((items) => [...items, ""])} className="mt-3 text-xs font-bold [color:var(--brand-text)]">+ Add option</button>}<label className={`mt-5 flex cursor-pointer items-center justify-between p-3 ${cx.soft}`}><span><span className="block text-sm font-bold">Allow multiple answers</span><span className={`block text-xs ${cx.muted}`}>Members can select more than one option.</span></span><input type="checkbox" checked={multiSelect} onChange={(event) => setMultiSelect(event.target.checked)} /></label><button disabled={saving} className={`mt-5 w-full ${cx.primaryBtn}`}>{saving ? "Saving…" : poll ? "Save poll" : "Post poll"}</button></form></div>;
}
