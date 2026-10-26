import {
  forwardRef,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  AlertCircle,
  CheckCircle2,
  Flag,
  Globe2,
  Heart,
  ImagePlus,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Palette,
  RefreshCw,
  Search,
  Send,
  Share2,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { auth } from "../../firebase/config";
import { deleteJson, getJson, postJson, uploadFeatureMedia } from "../../services/api";

/* =====================================================================
   READ-REDUCTION NOTES
   1. Feed + comments live in a module-level cache, so leaving and
      returning to the page costs 0 reads while the cache is fresh
      (FEED_TTL) and 1 page read when it is stale.
   2. Creating a post no longer re-fetches the feed: the server's
      response is merged into the list (falls back to one refetch only
      if the API doesn't return the created item).
   3. Comments load only when a post's comments are opened, once per
      post per session. Adding/liking never re-fetches.
   4. Manual refresh is rate-limited (REFRESH_COOLDOWN).
   5. Search / filter / sort run on the client only (0 reads).
   6. Auto "load more" is disabled while filters are active so a narrow
      filter can never trigger a chain of page reads.
   7. Typing in the composer, comment box or search no longer re-renders
      every post (memoised cards, isolated state).
   ===================================================================== */

const PAGE_SIZE = 20;
const COMMENT_PAGE = 20;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const FEED_TTL = 60000;
const REFRESH_COOLDOWN = 15000;
const UNDO_MS = 5000;
const LONG_POST = 280;

let cacheOwner = null;
let feedCache = null; // { items, hasMore, nextOffset, ts }
const commentsCache = new Map(); // postId -> comments[]
let toastSeq = 0;

const presets = {
  indigo: "#4f46e5",
  violet: "#7c3aed",
  blue: "#0284c7",
  green: "#15803d",
  orange: "#ea580c",
  pink: "#db2777",
  red: "#dc2626",
  dark: "#111827",
};
const types = [
  { value: "all", label: "All" },
  { value: "text", label: "Text" },
  { value: "image", label: "Photos" },
  { value: "colored", label: "Backgrounds" },
];
const times = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];
const sorts = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "oldest", label: "Oldest" },
];
const audiences = [
  { value: "friends", label: "Friends", Icon: Users, hint: "Only your friends can see it" },
  { value: "private", label: "Only me", Icon: LockKeyhole, hint: "Visible just to you" },
  { value: "everyone", label: "Everyone", Icon: Globe2, hint: "Anyone on UniHelp can see it" },
];

/* ---------- theme tokens ---------- */
const getTheme = (d) => ({
  page: d ? "text-slate-100" : "text-slate-900",
  body: d ? "text-slate-200" : "text-slate-700",
  muted: d ? "text-slate-400" : "text-slate-500",
  faint: d ? "text-slate-500" : "text-slate-400",
  divider: d ? "border-slate-800" : "border-slate-200",
  focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
    d ? "focus-visible:ring-offset-slate-900" : "focus-visible:ring-offset-white"
  }`,
  card: d ? "rounded-2xl border border-slate-800 bg-slate-900" : "rounded-2xl border border-slate-200 bg-white",
  field: d
    ? "border border-slate-700 bg-slate-800/70 text-slate-100 placeholder:text-slate-500"
    : "border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400",
  ghost: d ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100",
  chip: d ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
  chipOn: d ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white",
  segment: d ? "bg-slate-800" : "bg-slate-100",
  segmentOn: d ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm",
  segmentOff: d ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-800",
  primary: d ? "bg-indigo-500 hover:bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700",
  accent: d ? "text-indigo-300" : "text-indigo-600",
  accentSoft: d ? "bg-indigo-950 text-indigo-200" : "bg-indigo-50 text-indigo-700",
  liked: d ? "text-rose-400" : "text-rose-600",
  actionIdle: d ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  menu: d ? "border border-slate-700 bg-slate-800" : "border border-slate-200 bg-white",
  menuItem: d ? "text-slate-200 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-50",
  danger: d ? "text-red-400 hover:bg-red-950/40" : "text-red-600 hover:bg-red-50",
  skeleton: d ? "bg-slate-800" : "bg-slate-200",
  well: d ? "bg-slate-800" : "bg-slate-100",
  bubble: d ? "bg-slate-800" : "bg-slate-100",
  warn: d ? "text-amber-400" : "text-amber-600",
  avatar: d ? "bg-indigo-950 text-indigo-200" : "bg-indigo-100 text-indigo-700",
  toast: d ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white",
  toastAction: d ? "text-indigo-600" : "text-indigo-300",
  swatchOffset: d ? "ring-offset-slate-900" : "ring-offset-white",
  swatchOn: d ? "ring-white" : "ring-slate-900",
  errorBox: d ? "border-red-900 bg-red-950/40 text-red-200" : "border-red-200 bg-red-50 text-red-700",
});

/* ---------- helpers ---------- */
function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function timeAgo(value) {
  const date = toDate(value);
  if (!date) return "";
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const initials = (name) =>
  name?.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";

function compact(n) {
  const v = Number(n) || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(v);
}

function matchesTime(item, filter) {
  if (filter === "all") return true;
  const date = toDate(item.createdAt);
  if (!date) return false;
  const age = Math.max(0, Date.now() - date.getTime());
  if (filter === "today") return age < 86400000;
  if (filter === "week") return age < 7 * 86400000;
  return age < 30 * 86400000;
}

/**
 * Optimistic like/unlike with a per-item queue: taps always respond instantly,
 * and rapid toggling collapses into the minimum number of requests.
 */
function useQueuedLike({ likedKey, patch, send, onError }) {
  const opts = useRef({});
  opts.current = { likedKey, patch, send, onError };
  const states = useRef(new Map());

  return useCallback((id, wasLiked) => {
    const want = !wasLiked;
    const { likedKey: key, patch: apply } = opts.current;
    apply(id, (e) => ({
      [key]: want,
      likesCount: Math.max(0, (e.likesCount || 0) + (want ? 1 : -1)),
    }));

    let s = states.current.get(id);
    if (!s) {
      s = { inflight: false, server: wasLiked, want };
      states.current.set(id, s);
    }
    if (!s.inflight) s.server = wasLiked;
    s.want = want;
    if (s.inflight) return;
    s.inflight = true;

    (async () => {
      try {
        while (s.want !== s.server) {
          const target = s.want;
          const res = await opts.current.send(id, target);
          s.server = target;
          if (s.want === s.server && typeof res?.likesCount === "number") {
            opts.current.patch(id, () => ({ likesCount: res.likesCount }));
          }
        }
      } catch (err) {
        const server = s.server;
        s.want = server;
        opts.current.patch(id, (e) => ({
          [opts.current.likedKey]: server,
          likesCount: Math.max(0, (e.likesCount || 0) + (server ? 1 : 0) - (e[opts.current.likedKey] ? 1 : 0)),
        }));
        opts.current.onError(err);
      } finally {
        s.inflight = false;
      }
    })();
  }, []);
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((c) => c.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (message, { type = "success", action, duration = 3500 } = {}) => {
      const id = ++toastSeq;
      setToasts((c) => [...c.slice(-2), { id, message, type, action }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );
  return { toasts, notify, dismiss };
}

/* ---------- small components ---------- */
function Avatar({ src, name, t, className = "h-10 w-10 text-sm" }) {
  return (
    <div className={`flex flex-none items-center justify-center overflow-hidden rounded-full font-bold ${t.avatar} ${className}`}>
      {src ? <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

function Chip({ on, onClick, t, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex-none rounded-full px-3 py-1.5 text-xs font-semibold transition ${t.focus} ${on ? t.chipOn : t.chip}`}
    >
      {children}
    </button>
  );
}

function Toasts({ toasts, dismiss, t }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${t.toast}`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={16} className="flex-none text-red-400" />
          ) : (
            <CheckCircle2 size={16} className="flex-none text-emerald-400" />
          )}
          <span className="min-w-0 flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action.onClick();
                dismiss(toast.id);
              }}
              className={`flex-none font-bold ${t.toastAction}`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* =====================================================================
   COMPOSER — owns its own state so typing never re-renders the feed
   ===================================================================== */
const Composer = forwardRef(function Composer({ user, t, onSubmit }, ref) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [colored, setColored] = useState(false);
  const [preset, setPreset] = useState("indigo");
  const [audience, setAudience] = useState("friends");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  const type = image ? "image" : colored ? "colored" : "text";
  const canSubmit = Boolean(image) || Boolean(content.trim());

  useImperativeHandle(ref, () => ({
    focus() {
      taRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      taRef.current?.focus({ preventScroll: true });
    },
    restore(draft) {
      setContent(draft.content || "");
      setAudience(draft.audience || "friends");
      setPreset(draft.preset || "indigo");
      setColored(draft.type === "colored");
      setImage(draft.image || null);
      setOpen(true);
    },
  }), []);

  useEffect(() => {
    if (!image) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Auto-grow the textarea (plain posts only).
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    if (colored) {
      el.style.height = "";
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`;
  }, [content, colored, open]);

  // Collapse an empty composer when the person clicks elsewhere.
  useEffect(() => {
    if (!open || content || image || colored) return undefined;
    const onDown = (e) => {
      if (!formRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, content, image, colored]);

  const pickFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Choose an image file (JPG, PNG, GIF or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError("That image is over 8 MB. Choose a smaller one.");
      return;
    }
    setFileError("");
    setImage(file);
    setColored(false);
    setOpen(true);
  };

  const clearImage = () => {
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (event) => {
    event?.preventDefault();
    if (!canSubmit) return;
    onSubmit({ type, content: content.trim(), audience, preset, image });
    setContent("");
    setImage(null);
    setColored(false);
    setPreset("indigo");
    setAudience("friends");
    setFileError("");
    setOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const near = content.length > 400;

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onFocus={() => setOpen(true)}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer?.files?.[0]);
      }}
      className={`mb-4 p-3 sm:p-4 ${t.card} ${dragging ? "ring-2 ring-indigo-500" : ""}`}
    >
      <div className="flex gap-3">
        <Avatar src={user?.photoURL} name={user?.displayName} t={t} />
        <div className="min-w-0 flex-1">
          <textarea
            ref={taRef}
            value={content}
            rows={colored ? 5 : open ? 3 : 1}
            maxLength={500}
            aria-label="Post content"
            placeholder={image ? "Add a caption (optional)" : "What's happening on campus?"}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
            }}
            onPaste={(e) => {
              const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith("image/"));
              if (file) {
                e.preventDefault();
                pickFile(file);
              }
            }}
            className={`block w-full resize-none rounded-xl text-sm leading-6 outline-none transition ${
              colored
                ? "min-h-48 border border-transparent px-6 py-16 text-center text-xl font-bold text-white placeholder:text-white/70"
                : `px-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 ${t.field}`
            }`}
            style={colored ? { backgroundColor: presets[preset] } : undefined}
          />

          {open && colored && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Background colour">
              {Object.entries(presets).map(([name, color]) => (
                <button
                  type="button"
                  key={name}
                  aria-label={`${name} background`}
                  aria-pressed={preset === name}
                  onClick={() => setPreset(name)}
                  className={`h-7 w-7 rounded-full ring-2 ring-offset-2 transition ${t.swatchOffset} ${
                    preset === name ? t.swatchOn : "ring-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {preview && (
            <div className="relative mt-3 w-fit max-w-full">
              <img src={preview} alt="Selected image preview" className="max-h-64 rounded-xl object-cover" />
              <button
                type="button"
                onClick={clearImage}
                aria-label="Remove selected image"
                className={`absolute right-2 top-2 rounded-full bg-slate-950/70 p-1.5 text-white hover:bg-slate-950 ${t.focus}`}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {fileError && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-500">
              {fileError}
            </p>
          )}
        </div>
      </div>

      {open && (
        <div className={`mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3 ${t.divider}`}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold ${t.ghost} ${t.focus}`}
          >
            <ImagePlus size={17} /> <span className="hidden sm:inline">Photo</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={Boolean(image)}
            onClick={() => setColored((v) => !v)}
            aria-pressed={colored}
            title={image ? "Remove the photo to use a background" : "Colour background"}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${t.focus} ${
              colored ? t.accentSoft : t.ghost
            }`}
          >
            <Palette size={17} /> <span className="hidden sm:inline">Background</span>
          </button>

          <div role="radiogroup" aria-label="Who can see this post" className={`ml-auto flex rounded-xl p-1 ${t.segment}`}>
            {audiences.map(({ value, label, Icon, hint }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={audience === value}
                title={hint}
                onClick={() => setAudience(value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${t.focus} ${
                  audience === value ? t.segmentOn : t.segmentOff
                }`}
              >
                <Icon size={14} /> <span className="hidden min-[460px]:inline">{label}</span>
              </button>
            ))}
          </div>

          {near && (
            <span className={`text-xs tabular-nums ${content.length >= 500 ? "font-bold text-red-500" : t.warn}`}>
              {500 - content.length}
            </span>
          )}
          <span className={`hidden text-xs lg:inline ${t.faint}`}>Ctrl + Enter</span>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${t.primary} ${t.focus}`}
          >
            <Send size={15} /> Post
          </button>
        </div>
      )}
    </form>
  );
});

/* =====================================================================
   COMMENTS — fetched once per post, then served from cache
   ===================================================================== */
function Comments({ postId, count, user, t, notify, onDelta }) {
  const [list, setList] = useState(() => commentsCache.get(postId) || []);
  const [loading, setLoading] = useState(() => !commentsCache.has(postId));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [text, setText] = useState("");

  const updateList = useCallback(
    (fn) =>
      setList((cur) => {
        const next = fn(cur);
        if (commentsCache.has(postId)) commentsCache.set(postId, next.filter((c) => !c.pending));
        return next;
      }),
    [postId]
  );

  useEffect(() => {
    if (commentsCache.has(postId)) return undefined;
    let live = true;
    setLoading(true);
    setFailed(false);
    getJson(`/api/feed/posts/${postId}/comments?limit=${COMMENT_PAGE}`)
      .then((res) => {
        const items = Array.isArray(res.items) ? res.items : [];
        commentsCache.set(postId, items);
        if (live) setList(items);
      })
      .catch(() => live && setFailed(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [postId, attempt]);

  const likeComment = useQueuedLike({
    likedKey: "liked",
    patch: (id, fn) => updateList((cur) => cur.map((c) => (c.id === id ? { ...c, ...fn(c) } : c))),
    send: (id, target) =>
      target ? postJson(`/api/feed/comments/${id}/like`, {}) : deleteJson(`/api/feed/comments/${id}/like`),
    onError: (err) => notify(err.message || "Could not update the like.", { type: "error" }),
  });

  const submit = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    const tempId = `tmp-${Date.now()}`;
    updateList((cur) => [
      {
        id: tempId,
        pending: true,
        text: value,
        authorName: user?.displayName || "You",
        authorAvatar: user?.photoURL,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        liked: false,
      },
      ...cur,
    ]);
    setText("");
    onDelta(postId, 1);
    try {
      const res = await postJson(`/api/feed/posts/${postId}/comments`, { text: value });
      if (!res?.item) throw new Error("The comment could not be confirmed.");
      updateList((cur) => cur.map((c) => (c.id === tempId ? res.item : c)));
    } catch (err) {
      updateList((cur) => cur.filter((c) => c.id !== tempId));
      setText((prev) => prev || value);
      onDelta(postId, -1);
      notify(err.message || "Could not post your comment.", { type: "error" });
    }
  };

  const real = list.filter((c) => !c.pending).length;

  return (
    <div className={`border-t px-4 py-3 sm:px-5 ${t.divider}`}>
      <form onSubmit={submit} className="flex items-center gap-2">
        <Avatar src={user?.photoURL} name={user?.displayName} t={t} className="h-8 w-8 text-xs" />
        <input
          value={text}
          autoFocus
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          aria-label="Write a comment"
          placeholder="Write a comment…"
          className={`min-w-0 flex-1 rounded-full px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 ${t.field}`}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send comment"
          className={`flex-none rounded-full p-2.5 text-white transition disabled:opacity-40 ${t.primary} ${t.focus}`}
        >
          <Send size={15} />
        </button>
      </form>

      {loading && (
        <div className="mt-3 space-y-2" aria-busy="true" aria-label="Loading comments">
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-2.5">
              <div className={`h-8 w-8 flex-none rounded-full motion-safe:animate-pulse ${t.skeleton}`} />
              <div className={`h-12 flex-1 rounded-2xl motion-safe:animate-pulse ${t.skeleton}`} />
            </div>
          ))}
        </div>
      )}

      {!loading && failed && (
        <p className={`py-4 text-center text-sm ${t.muted}`}>
          Comments didn't load.{" "}
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className={`font-bold underline ${t.accent}`}>
            Try again
          </button>
        </p>
      )}

      {!loading && !failed && list.length === 0 && (
        <p className={`py-4 text-center text-sm ${t.muted}`}>No comments yet. Be the first to reply.</p>
      )}

      {list.length > 0 && (
        <ul className="mt-3 space-y-3">
          {list.map((c) => (
            <li key={c.id} className={`flex items-start gap-2.5 ${c.pending ? "opacity-60" : ""}`}>
              <Avatar src={c.authorAvatar} name={c.authorName} t={t} className="h-8 w-8 text-xs" />
              <div className={`min-w-0 flex-1 rounded-2xl px-3.5 py-2 ${t.bubble}`}>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold">{c.authorName || "Student"}</span>
                  <span className={`text-[11px] ${t.faint}`}>{c.pending ? "Sending…" : timeAgo(c.createdAt)}</span>
                </div>
                <p className={`mt-0.5 whitespace-pre-wrap break-words text-sm ${t.body}`}>{c.text || c.content}</p>
              </div>
              <button
                type="button"
                disabled={c.pending}
                onClick={() => likeComment(c.id, Boolean(c.liked))}
                aria-pressed={Boolean(c.liked)}
                aria-label={c.liked ? "Unlike comment" : "Like comment"}
                className={`mt-1.5 flex min-w-[2rem] flex-none items-center justify-center gap-1 rounded-md px-1 py-1 text-xs transition active:scale-90 disabled:opacity-40 ${t.focus} ${
                  c.liked ? t.liked : t.actionIdle
                }`}
              >
                <Heart size={14} fill={c.liked ? "currentColor" : "none"} />
                {c.likesCount ? compact(c.likesCount) : ""}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && count > real && real > 0 && (
        <p className={`mt-3 text-center text-xs ${t.faint}`}>
          Showing {real} of {count} comments
        </p>
      )}
    </div>
  );
}

/* =====================================================================
   POST CARD — memoised; only re-renders when its own item changes
   ===================================================================== */
const PostCard = memo(function PostCard({
  item,
  own,
  t,
  user,
  highlighted,
  onLike,
  onShare,
  onReport,
  onDelete,
  onPreview,
  onCommentDelta,
  notify,
}) {
  const [menu, setMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef(null);
  const pending = Boolean(item.pending);

  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenu(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const audience = audiences.find((a) => a.value === item.audience) || audiences[2];
  const AudienceIcon = audience.Icon;
  const content = item.content || "";
  const long = content.length > LONG_POST;

  return (
    <article
      id={`post-${item.id}`}
      className={`scroll-mt-24 overflow-hidden transition ${t.card} ${pending ? "opacity-75" : ""} ${
        highlighted ? "ring-2 ring-indigo-500" : ""
      }`}
    >
      <header className="flex items-start gap-3 px-4 pb-2 pt-4 sm:px-5">
        <Avatar src={item.authorAvatar} name={item.authorName} t={t} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-5">{item.authorName || "UniHelp student"}</p>
          <div className={`mt-0.5 flex min-w-0 items-center gap-2 text-xs ${t.muted}`}>
            {pending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 size={12} className="motion-safe:animate-spin" /> Posting…
              </span>
            ) : (
              <span className="flex-none">{timeAgo(item.createdAt)}</span>
            )}
            <span className="inline-flex flex-none items-center gap-1" title={audience.hint}>
              <AudienceIcon size={12} /> {audience.label}
            </span>
            {item.university && <span className="truncate">{item.university}</span>}
          </div>
        </div>

        {!pending && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label="Post options"
              aria-haspopup="menu"
              aria-expanded={menu}
              className={`rounded-full p-2 transition ${t.actionIdle} ${t.focus}`}
            >
              <MoreHorizontal size={18} />
            </button>
            {menu && (
              <div role="menu" className={`absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl py-1 shadow-lg ${t.menu}`}>
                {own ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onDelete(item.id);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold ${t.danger}`}
                  >
                    <Trash2 size={16} /> Delete post
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onReport(item.id);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold ${t.menuItem}`}
                  >
                    <Flag size={16} /> Report post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {item.type === "colored" ? (
        <div
          className="mt-1 flex min-h-56 items-center justify-center px-8 py-10 text-center font-extrabold text-white"
          style={{ backgroundColor: presets[item.backgroundPreset] || presets.indigo }}
        >
          <p className={`whitespace-pre-wrap break-words ${content.length > 120 ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>
            {content}
          </p>
        </div>
      ) : (
        <>
          {content && (
            <div className="px-4 pb-3 sm:px-5">
              <p className={`whitespace-pre-wrap break-words text-[15px] leading-6 ${t.body}`}>
                {long && !expanded ? `${content.slice(0, LONG_POST).trimEnd()}…` : content}
              </p>
              {long && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className={`mt-1 text-sm font-semibold hover:underline ${t.accent} ${t.focus}`}
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}
          {item.type === "image" && item.imageUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onPreview(item.imageUrl)}
              aria-label="Open full image"
              className={`block w-full cursor-zoom-in overflow-hidden ${t.well} ${t.focus}`}
            >
              <img
                src={item.imageUrl}
                alt={content ? `Photo: ${content.slice(0, 80)}` : "Post photo"}
                loading="lazy"
                decoding="async"
                className="max-h-[34rem] w-full object-cover"
              />
            </button>
          )}
        </>
      )}

      <div className={`flex items-center gap-1 px-2.5 py-2 sm:px-3.5 ${pending ? "pointer-events-none opacity-50" : ""}`}>
        <button
          type="button"
          onClick={() => onLike(item.id, Boolean(item.likedByMe))}
          aria-pressed={Boolean(item.likedByMe)}
          aria-label={item.likedByMe ? "Unlike post" : "Like post"}
          className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition active:scale-95 ${t.focus} ${
            item.likedByMe ? t.liked : t.actionIdle
          }`}
        >
          <Heart size={18} fill={item.likedByMe ? "currentColor" : "none"} />
          <span className="tabular-nums">{compact(item.likesCount)}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${t.focus} ${
            showComments ? `${t.accentSoft}` : t.actionIdle
          }`}
        >
          <MessageCircle size={18} />
          <span className="tabular-nums">{compact(item.commentsCount)}</span>
          <span className="hidden sm:inline">{item.commentsCount === 1 ? "Comment" : "Comments"}</span>
        </button>
        <button
          type="button"
          onClick={() => onShare(item)}
          aria-label="Share post"
          className={`ml-auto inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${t.actionIdle} ${t.focus}`}
        >
          <Share2 size={17} /> <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {showComments && !pending && (
        <Comments postId={item.id} count={item.commentsCount || 0} user={user} t={t} notify={notify} onDelta={onCommentDelta} />
      )}
    </article>
  );
});

/* =====================================================================
   FEED
   ===================================================================== */
export default function NewsFeed({ dark = false }) {
  const t = useMemo(() => getTheme(dark), [dark]);
  const { toasts, notify, dismiss } = useToasts();

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authReady, setAuthReady] = useState(Boolean(auth.currentUser));
  const uid = currentUser?.uid;

  const [items, setItems] = useState(() =>
    feedCache && cacheOwner === (auth.currentUser?.uid || "anon") ? feedCache.items : []
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [hasMore, setHasMore] = useState(() => Boolean(feedCache?.hasMore));
  const [nextOffset, setNextOffset] = useState(() => feedCache?.nextOffset || 0);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const [mine, setMine] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [previewUrl, setPreviewUrl] = useState("");
  const [highlightId, setHighlightId] = useState("");

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const composerRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadSeq = useRef(0);
  const appendLock = useRef(false);
  const deepLinkHandled = useRef(false);
  const pendingDeletes = useRef(new Map());

  /* ---------- auth ---------- */
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthReady(true);
      }),
    []
  );

  /* items setter that mirrors every change into the cache */
  const updateItems = useCallback(
    (fn) =>
      setItems((cur) => {
        const next = fn(cur);
        if (feedCache) feedCache.items = next.filter((i) => !i.pending);
        return next;
      }),
    []
  );

  const patchPost = useCallback(
    (id, patch) => updateItems((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch(p) } : p))),
    [updateItems]
  );

  /* ---------- data ---------- */
  const loadFeed = useCallback(
    async ({ append = false, offset = 0 } = {}) => {
      if (append) {
        if (appendLock.current) return;
        appendLock.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const seq = append ? loadSeq.current : ++loadSeq.current;
      try {
        const res = await getJson(`/api/feed?limit=${PAGE_SIZE}&offset=${offset}`);
        if (seq !== loadSeq.current) return;
        const next = Array.isArray(res.items) ? res.items : [];
        const more = Boolean(res.hasMore);
        const cursor = Number(res.nextCursor) || offset + next.length;
        if (append) {
          feedCache = { ...(feedCache || { items: [], ts: Date.now() }), hasMore: more, nextOffset: cursor };
          updateItems((cur) => {
            const seen = new Set(cur.map((c) => c.id));
            return [...cur, ...next.filter((n) => !seen.has(n.id))];
          });
        } else {
          feedCache = { items: [], hasMore: more, nextOffset: cursor, ts: Date.now() };
          updateItems((cur) => [...cur.filter((i) => i.pending), ...next]);
        }
        setHasMore(more);
        setNextOffset(cursor);
        setFeedError("");
      } catch (err) {
        if (seq === loadSeq.current) setFeedError(err.message || "Could not load your feed.");
      } finally {
        if (append) {
          appendLock.current = false;
          setLoadingMore(false);
        }
        if (!append && seq === loadSeq.current) setLoading(false);
      }
    },
    [updateItems]
  );

  // Hydrate from cache; only hit the network if there is nothing or it's stale.
  useEffect(() => {
    if (!authReady) return;
    const owner = uid || "anon";
    if (cacheOwner !== owner) {
      cacheOwner = owner;
      feedCache = null;
      commentsCache.clear();
    }
    if (feedCache?.items.length) {
      setItems(feedCache.items);
      setHasMore(feedCache.hasMore);
      setNextOffset(feedCache.nextOffset);
      setLoading(false);
      if (Date.now() - feedCache.ts > FEED_TTL) loadFeed();
    } else {
      loadFeed();
    }
  }, [authReady, uid, loadFeed]);

  const refresh = () => {
    if (!feedError && feedCache && Date.now() - feedCache.ts < REFRESH_COOLDOWN) {
      notify("You're all caught up.", { duration: 2000 });
      return;
    }
    loadFeed();
  };

  /* ---------- UI plumbing ---------- */
  useEffect(() => {
    if (!previewUrl) return undefined;
    const onKey = (e) => e.key === "Escape" && setPreviewUrl("");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewUrl]);

  // Flush any deletes that were waiting out their undo window.
  useEffect(
    () => () => {
      pendingDeletes.current.forEach(({ timer, id }) => {
        clearTimeout(timer);
        if (feedCache) feedCache.items = feedCache.items.filter((i) => i.id !== id);
        deleteJson(`/api/feed/posts/${id}`).catch(() => {});
      });
    },
    []
  );

  // Share links look like /feed?post=<id>.
  useEffect(() => {
    if (deepLinkHandled.current || items.length === 0) return;
    const id = new URLSearchParams(window.location.search).get("post");
    if (!id) {
      deepLinkHandled.current = true;
      return;
    }
    if (!items.some((e) => e.id === id)) return;
    deepLinkHandled.current = true;
    setHighlightId(id);
    requestAnimationFrame(() =>
      document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
    setTimeout(() => setHighlightId(""), 3500);
  }, [items]);

  /* ---------- derived ---------- */
  const filtersActive = Boolean(query.trim()) || typeFilter !== "all" || timeFilter !== "all" || mine;
  const hiddenFilterCount = (timeFilter !== "all" ? 1 : 0) + (sort !== "latest" ? 1 : 0) + (mine ? 1 : 0);

  const filteredItems = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase().replace(/^#/, "");
    return items
      .filter((item) => {
        if (typeFilter !== "all" && item.type !== typeFilter) return false;
        if (!matchesTime(item, timeFilter)) return false;
        if (mine && item.authorId !== uid) return false;
        if (!q) return true;
        return `${item.content || ""} ${item.authorName || ""} ${item.university || ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === "popular") {
          const score = (i) => (i.likesCount || 0) + (i.commentsCount || 0) * 2 + (i.viewsCount || 0) * 0.1;
          return score(b) - score(a);
        }
        const da = toDate(a.createdAt)?.getTime() || 0;
        const db = toDate(b.createdAt)?.getTime() || 0;
        return sort === "oldest" ? da - db : db - da;
      });
  }, [deferredQuery, items, mine, sort, timeFilter, typeFilter, uid]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setTypeFilter("all");
    setTimeFilter("all");
    setMine(false);
  }, []);

  // Auto-load the next page near the bottom — never while filtering.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore || filtersActive || feedError || typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadFeed({ append: true, offset: nextOffset }),
      { rootMargin: "500px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, filtersActive, feedError, nextOffset, items.length, loadFeed]);

  /* ---------- post actions ---------- */
  const submitPost = useCallback(
    async (draft) => {
      clearFilters();
      setSort("latest");
      const tempId = `tmp-${Date.now()}`;
      const localUrl = draft.image ? URL.createObjectURL(draft.image) : "";
      const temp = {
        id: tempId,
        pending: true,
        type: draft.type,
        content: draft.content,
        audience: draft.audience,
        backgroundPreset: draft.type === "colored" ? draft.preset : undefined,
        imageUrl: localUrl,
        authorId: uid,
        authorName: currentUser?.displayName,
        authorAvatar: currentUser?.photoURL,
        likesCount: 0,
        commentsCount: 0,
        likedByMe: false,
        createdAt: new Date().toISOString(),
      };
      updateItems((cur) => [temp, ...cur]);
      try {
        let uploaded = null;
        if (draft.type === "image" && draft.image) {
          uploaded = await uploadFeatureMedia(draft.image, { feature: "feed", resourceType: "image" });
        }
        const uploadedUrl = uploaded?.url || uploaded?.secure_url;
        if (draft.type === "image" && !uploadedUrl) throw new Error("The image could not be uploaded.");
        const res = await postJson("/api/feed/posts", {
          type: draft.type,
          content: draft.content,
          audience: draft.audience,
          backgroundPreset: draft.type === "colored" ? draft.preset : undefined,
          imageUrl: draft.type === "image" ? uploadedUrl : undefined,
          cloudinaryPublicId: uploaded?.publicId || uploaded?.public_id,
        });
        const created = res?.item || res?.post;
        if (created?.id) {
          // No refetch: merge the server's copy in place of the temporary one.
          updateItems((cur) =>
            cur.map((p) =>
              p.id === tempId
                ? { ...temp, pending: false, ...created, imageUrl: created.imageUrl || uploadedUrl || undefined }
                : p
            )
          );
        } else {
          updateItems((cur) => cur.filter((p) => p.id !== tempId));
          await loadFeed();
        }
        notify("Your post is live.");
      } catch (err) {
        updateItems((cur) => cur.filter((p) => p.id !== tempId));
        composerRef.current?.restore(draft);
        notify(err.message || "Could not publish your post.", { type: "error", duration: 6000 });
      } finally {
        if (localUrl) setTimeout(() => URL.revokeObjectURL(localUrl), 1500);
      }
    },
    [clearFilters, currentUser, loadFeed, notify, uid, updateItems]
  );

  const restorePost = useCallback(
    (post, index) =>
      updateItems((cur) => {
        if (cur.some((i) => i.id === post.id)) return cur;
        const next = [...cur];
        next.splice(Math.min(index, next.length), 0, post);
        return next;
      }),
    [updateItems]
  );

  // Instant removal with a 5-second undo; the request is only sent afterwards.
  const deletePost = useCallback(
    (id) => {
      const index = itemsRef.current.findIndex((i) => i.id === id);
      const post = itemsRef.current[index];
      if (!post) return;
      updateItems((cur) => cur.filter((i) => i.id !== id));

      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(id);
        try {
          await deleteJson(`/api/feed/posts/${id}`);
        } catch (err) {
          restorePost(post, index);
          notify(err.message || "Could not delete this post. It has been restored.", { type: "error", duration: 6000 });
        }
      }, UNDO_MS);
      pendingDeletes.current.set(id, { timer, id });

      notify("Post deleted.", {
        duration: UNDO_MS,
        action: {
          label: "Undo",
          onClick: () => {
            clearTimeout(timer);
            pendingDeletes.current.delete(id);
            restorePost(post, index);
          },
        },
      });
    },
    [notify, restorePost, updateItems]
  );

  const reportPost = useCallback(
    (id) => {
      notify("Report sent. Thanks for helping keep UniHelp safe.");
      postJson(`/api/feed/posts/${id}/report`, { reportType: "Inappropriate content" }).catch((err) =>
        notify(err.message || "Could not send your report.", { type: "error" })
      );
    },
    [notify]
  );

  const sharePost = useCallback(
    async (item) => {
      const url = `${window.location.origin}/feed?post=${encodeURIComponent(item.id)}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: `${item.authorName || "UniHelp student"} on UniHelp`,
            text: item.content || "View this post on UniHelp.",
            url,
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          notify("Link copied.", { duration: 2000 });
        } else {
          throw new Error("Sharing isn't available in this browser.");
        }
      } catch (err) {
        if (err?.name !== "AbortError") notify(err.message || "Could not share this post.", { type: "error" });
      }
    },
    [notify]
  );

  const likePost = useQueuedLike({
    likedKey: "likedByMe",
    patch: patchPost,
    send: (id, target) =>
      target ? postJson(`/api/feed/posts/${id}/like`, {}) : deleteJson(`/api/feed/posts/${id}/like`),
    onError: (err) => notify(err.message || "Could not update your like.", { type: "error" }),
  });

  const commentDelta = useCallback(
    (id, delta) => patchPost(id, (p) => ({ commentsCount: Math.max(0, (p.commentsCount || 0) + delta) })),
    [patchPost]
  );

  /* ---------- render ---------- */
  const showSkeleton = loading && items.length === 0;
  const showEmpty = !loading && !feedError && filteredItems.length === 0;

  return (
    <main className={`mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 ${t.page}`}>
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Campus feed</h1>
          <p className={`mt-1 text-sm ${t.muted}`}>See what students around you are sharing.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-60 ${t.ghost} ${t.focus}`}
        >
          <RefreshCw size={15} className={loading ? "motion-safe:animate-spin" : ""} />
          <span className="hidden sm:inline">{loading ? "Updating…" : "Refresh"}</span>
        </button>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <Composer ref={composerRef} user={currentUser} t={t} onSubmit={submitPost} />

          {/* ---------- search + filters ---------- */}
          <div className={`sticky top-2 z-20 mb-4 p-2.5 shadow-sm ${t.card}`}>
            <div className="flex items-center gap-2">
              <label className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/25 ${t.field}`}>
                <Search size={17} className={`flex-none ${t.faint}`} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search posts"
                  placeholder="Search posts, people or #tags"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className={`rounded-full p-1 ${t.faint} ${t.focus}`}>
                    <X size={15} />
                  </button>
                )}
              </label>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className={`relative inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${t.focus} ${
                  filtersOpen || hiddenFilterCount ? t.accentSoft : t.chip
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filters</span>
                {hiddenFilterCount > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white">
                    {hiddenFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {types.map((o) => (
                <Chip key={o.value} t={t} on={typeFilter === o.value} onClick={() => setTypeFilter(o.value)}>
                  {o.label}
                </Chip>
              ))}
            </div>

            {filtersOpen && (
              <div className={`mt-3 space-y-3 border-t pt-3 ${t.divider}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`mr-1 w-14 text-xs font-semibold ${t.muted}`}>Posted</span>
                  {times.map((o) => (
                    <Chip key={o.value} t={t} on={timeFilter === o.value} onClick={() => setTimeFilter(o.value)}>
                      {o.label}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`mr-1 w-14 text-xs font-semibold ${t.muted}`}>Sort by</span>
                  {sorts.map((o) => (
                    <Chip key={o.value} t={t} on={sort === o.value} onClick={() => setSort(o.value)}>
                      {o.label}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`mr-1 w-14 text-xs font-semibold ${t.muted}`}>Show</span>
                  <Chip t={t} on={mine} onClick={() => setMine((v) => !v)}>
                    My posts only
                  </Chip>
                </div>
              </div>
            )}
          </div>

          {filtersActive && !showSkeleton && (
            <div className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs ${t.muted}`}>
              <span>
                {filteredItems.length} of {items.length} loaded {items.length === 1 ? "post" : "posts"}
              </span>
              <button type="button" onClick={clearFilters} className={`font-semibold hover:underline ${t.accent}`}>
                Clear filters
              </button>
              {hasMore && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => loadFeed({ append: true, offset: nextOffset })}
                  className={`font-semibold hover:underline disabled:opacity-50 ${t.accent}`}
                >
                  {loadingMore ? "Loading…" : "Search older posts"}
                </button>
              )}
            </div>
          )}

          {/* ---------- feed error ---------- */}
          {feedError && (
            <div role="alert" className={`mb-4 flex items-center gap-3 rounded-xl border p-3 text-sm ${t.errorBox}`}>
              <AlertCircle size={16} className="flex-none" />
              <span className="min-w-0 flex-1">{feedError}</span>
              <button type="button" onClick={() => loadFeed()} className="flex-none font-bold underline">
                Retry
              </button>
            </div>
          )}

          {/* ---------- skeleton ---------- */}
          {showSkeleton && (
            <div className="space-y-4" aria-busy="true" aria-label="Loading feed">
              {[0, 1, 2].map((k) => (
                <div key={k} className={`p-5 ${t.card}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full motion-safe:animate-pulse ${t.skeleton}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-3 w-1/3 rounded motion-safe:animate-pulse ${t.skeleton}`} />
                      <div className={`h-3 w-1/5 rounded motion-safe:animate-pulse ${t.skeleton}`} />
                    </div>
                  </div>
                  <div className={`mt-4 h-3 w-5/6 rounded motion-safe:animate-pulse ${t.skeleton}`} />
                  <div className={`mt-2 h-3 w-2/3 rounded motion-safe:animate-pulse ${t.skeleton}`} />
                  {k === 0 && <div className={`mt-4 h-44 rounded-xl motion-safe:animate-pulse ${t.skeleton}`} />}
                </div>
              ))}
            </div>
          )}

          {/* ---------- empty ---------- */}
          {showEmpty && (
            <div className={`rounded-2xl border border-dashed px-6 py-12 text-center ${dark ? "border-slate-700" : "border-slate-300"}`}>
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${t.accentSoft}`}>
                <MessageCircle size={22} />
              </div>
              <h2 className="mt-4 font-bold">{items.length ? "No posts match your filters" : "Nothing here yet"}</h2>
              <p className={`mx-auto mt-1.5 max-w-xs text-sm ${t.muted}`}>
                {items.length
                  ? hasMore
                    ? "Try different words, or search older posts."
                    : "Try different words or clear your filters."
                  : "Be the first to share something with your campus."}
              </p>
              <button
                type="button"
                onClick={items.length ? clearFilters : () => composerRef.current?.focus()}
                className={`mt-4 rounded-lg px-4 py-2 text-sm font-bold text-white ${t.primary} ${t.focus}`}
              >
                {items.length ? "Clear filters" : "Write a post"}
              </button>
            </div>
          )}

          {/* ---------- posts ---------- */}
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <PostCard
                key={item.id}
                item={item}
                own={Boolean(uid) && item.authorId === uid}
                t={t}
                user={currentUser}
                highlighted={highlightId === item.id}
                onLike={likePost}
                onShare={sharePost}
                onReport={reportPost}
                onDelete={deletePost}
                onPreview={setPreviewUrl}
                onCommentDelta={commentDelta}
                notify={notify}
              />
            ))}
          </div>

          {/* ---------- pagination ---------- */}
          <div ref={sentinelRef} aria-hidden="true" />
          {items.length > 0 && hasMore && !filtersActive && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => loadFeed({ append: true, offset: nextOffset })}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
                dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              } ${t.focus}`}
            >
              {loadingMore ? <Loader2 size={16} className="motion-safe:animate-spin" /> : null}
              {loadingMore ? "Loading more…" : "Load more posts"}
            </button>
          )}
          {items.length > 0 && !hasMore && !filtersActive && !loading && (
            <p className={`mt-6 text-center text-xs ${t.faint}`}>You're all caught up.</p>
          )}
        </section>

        {/* ---------- sidebar ---------- */}
        <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block">
          <div className={`p-4 ${t.card}`}>
            <div className="flex items-center gap-3">
              <Avatar src={currentUser?.photoURL} name={currentUser?.displayName} t={t} className="h-11 w-11 text-sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{currentUser?.displayName || "Welcome"}</p>
                <p className={`text-xs ${t.muted}`}>Share an update with campus</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => composerRef.current?.focus()}
              className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${t.primary} ${t.focus}`}
            >
              Create a post
            </button>
          </div>
          <div className={`p-4 ${t.card}`}>
            <h2 className="text-sm font-bold">Who can see your post</h2>
            <ul className="mt-3 space-y-3">
              {audiences.map(({ value, label, Icon, hint }) => (
                <li key={value} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg ${t.chip}`}>
                    <Icon size={14} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-5">{label}</p>
                    <p className={`text-xs ${t.muted}`}>{hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <Toasts toasts={toasts} dismiss={dismiss} t={t} />

      {/* ---------- image lightbox ---------- */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Full image preview"
          onClick={() => setPreviewUrl("")}
        >
          <img
            src={previewUrl}
            alt="Full post"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            autoFocus
            onClick={() => setPreviewUrl("")}
            aria-label="Close full image"
            className="absolute right-3 top-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </main>
  );
}