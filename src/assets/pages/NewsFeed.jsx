import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowDownWideNarrow,
  Check,
  Clock3,
  Flag,
  Globe2,
  Heart,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Palette,
  RefreshCw,
  Search,
  Send,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { auth } from "../../firebase/config";
import { deleteJson, getJson, postJson, uploadFeatureMedia } from "../../services/api";

const PAGE_SIZE = 20;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
  { value: "all", label: "All posts" },
  { value: "text", label: "Text" },
  { value: "image", label: "Photos" },
  { value: "colored", label: "Backgrounds" },
];
const audiences = [
  { value: "friends", label: "Friends", Icon: Users },
  { value: "private", label: "Only me", Icon: LockKeyhole },
  { value: "everyone", label: "Everyone", Icon: Globe2 },
];

/* ---------- theme tokens, driven by the `dark` prop ---------- */
const getTheme = (dark) => ({
  text: dark ? "text-slate-100" : "text-slate-900",
  body: dark ? "text-slate-200" : "text-slate-800",
  muted: dark ? "text-slate-400" : "text-slate-500",
  faint: dark ? "text-slate-500" : "text-slate-400",
  divider: dark ? "border-slate-800" : "border-slate-100",

  focusRing: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
    dark ? "focus-visible:ring-offset-slate-900" : "focus-visible:ring-offset-white"
  }`,

  card: dark
    ? "rounded-2xl border border-slate-800 bg-slate-900 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white shadow-sm",

  field: dark
    ? "border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
    : "border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400",

  iconBtn: dark
    ? "rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
    : "rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800",

  select: `bg-transparent py-1.5 text-xs font-semibold outline-none ${
    dark ? "text-slate-200 [color-scheme:dark]" : "text-slate-700 [color-scheme:light]"
  }`,
  option: dark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-900",

  // neutral pills / segmented backgrounds
  pillBg: dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500",
  segmentBg: dark ? "bg-slate-800" : "bg-slate-100",
  chipIdle: dark
    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
  ghostBtn: dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100",

  // accents
  primary: dark ? "bg-indigo-500 hover:bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700",
  primarySolid: dark ? "bg-indigo-500" : "bg-indigo-600",
  accentSoft: dark ? "bg-indigo-950 text-indigo-200" : "bg-indigo-100 text-indigo-700",
  accentText: dark ? "text-indigo-300" : "text-indigo-600",
  violetSoft: dark ? "bg-violet-950 text-violet-200" : "bg-violet-100 text-violet-700",
  segmentActive: dark ? "bg-slate-700 text-indigo-200 shadow-sm" : "bg-white text-indigo-700 shadow-sm",
  segmentIdle: dark ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-800",

  // like / danger
  liked: dark ? "text-rose-400" : "text-rose-600",
  likeIdle: dark
    ? "text-slate-400 hover:text-rose-400"
    : "text-slate-500 hover:text-rose-600",
  commentLikeIdle: dark
    ? "text-slate-500 hover:text-rose-400"
    : "text-slate-400 hover:text-rose-600",
  commentIdle: dark
    ? "text-slate-400 hover:text-indigo-300"
    : "text-slate-500 hover:text-indigo-600",
  commentOpen: dark ? "text-indigo-300" : "text-indigo-600",
  dangerText: dark ? "text-red-400 hover:bg-red-950/40" : "text-red-600 hover:bg-red-50",
  dangerIcon: dark ? "bg-red-950/50 text-red-300" : "bg-red-50 text-red-600",
  dangerBtn: dark ? "bg-red-500 hover:bg-red-400" : "bg-red-600 hover:bg-red-700",

  // alerts
  alertError: dark
    ? "border-red-900 bg-red-950/40 text-red-200"
    : "border-red-200 bg-red-50 text-red-700",
  alertOk: dark
    ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
    : "border-emerald-200 bg-emerald-50 text-emerald-800",
  alertClose: dark ? "hover:bg-white/10" : "hover:bg-black/5",
  warn: dark ? "text-amber-400" : "text-amber-600",

  // menus
  menu: dark
    ? "border border-slate-700 bg-slate-800"
    : "border border-slate-200 bg-white",
  menuItem: dark ? "text-slate-200 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-50",

  // misc surfaces
  skeleton: dark ? "bg-slate-800" : "bg-slate-200",
  imageWell: dark ? "bg-slate-800" : "bg-slate-100",
  commentBubble: dark ? "bg-slate-800" : "bg-slate-100",
  swatchOffset: dark ? "ring-offset-slate-900" : "ring-offset-white",
  swatchActive: dark ? "ring-white" : "ring-slate-900",
  emptyCard: dark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white",
  emptyIcon: dark ? "bg-indigo-950 text-indigo-300" : "bg-indigo-50 text-indigo-600",
  loadMore: dark
    ? "border-slate-700 bg-slate-900 text-indigo-300 hover:bg-slate-800"
    : "border-slate-200 bg-white text-indigo-700 hover:bg-indigo-50",
  tipCard: dark ? "border-indigo-900/60 bg-indigo-950/40" : "border-indigo-100 bg-indigo-50/70",
  tipTitle: dark ? "text-indigo-100" : "text-indigo-900",
  tipText: dark ? "text-indigo-200/80" : "text-indigo-800/80",
  header: dark
    ? "from-indigo-800 via-violet-800 to-fuchsia-900"
    : "from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-indigo-500/10",
  headerGlow: dark ? "bg-white/5" : "bg-white/10",
  avatar: dark ? "bg-indigo-950 text-indigo-200" : "bg-indigo-100 text-indigo-700",
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
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name) {
  return name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function compact(n) {
  const value = Number(n) || 0;
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(value);
}

function postMatchesTime(item, filter) {
  if (filter === "all") return true;
  const date = toDate(item.createdAt);
  if (!date) return false;
  // Clamp so freshly created posts with slightly-ahead server clocks still match.
  const age = Math.max(0, Date.now() - date.getTime());
  if (filter === "today") return age < 86400000;
  if (filter === "week") return age < 7 * 86400000;
  return age < 30 * 86400000;
}

function setBusy(setter, id, on) {
  setter((current) => {
    const next = new Set(current);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  });
}

function Avatar({ src, name, t, className = "h-11 w-11 text-sm" }) {
  return (
    <div className={`flex flex-none items-center justify-center overflow-hidden rounded-full font-bold ${t.avatar} ${className}`}>
      {src ? <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

export default function NewsFeed({ dark = false }) {
  const t = useMemo(() => getTheme(dark), [dark]);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [colored, setColored] = useState(false);
  const [preset, setPreset] = useState("indigo");
  const [audience, setAudience] = useState("friends");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const [myPostsOnly, setMyPostsOnly] = useState(false);
  const [commentsFor, setCommentsFor] = useState("");
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsLoading, setCommentsLoading] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentPosting, setCommentPosting] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [menuFor, setMenuFor] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [highlightId, setHighlightId] = useState("");
  const [busyLikes, setBusyLikes] = useState(() => new Set());
  const [busyCommentLikes, setBusyCommentLikes] = useState(() => new Set());

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const loadSeq = useRef(0);
  const deepLinkHandled = useRef(false);

  const currentUserId = currentUser?.uid;
  const postType = image ? "image" : colored ? "colored" : "text";

  /* ---------- auth: keep uid in sync (auth.currentUser is null on first render) ---------- */
  useEffect(() => onAuthStateChanged(auth, setCurrentUser), []);

  /* ---------- data ---------- */
  const loadFeed = useCallback(async ({ append = false, offset = 0 } = {}) => {
    // A refresh bumps the sequence so any older in-flight response is ignored.
    const seq = append ? loadSeq.current : ++loadSeq.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const response = await getJson(`/api/feed?limit=${PAGE_SIZE}&offset=${offset}`);
      if (seq !== loadSeq.current) return;
      const nextItems = Array.isArray(response.items) ? response.items : [];
      setItems((current) => {
        if (!append) return nextItems;
        const seen = new Set(current.map((entry) => entry.id));
        return [...current, ...nextItems.filter((entry) => !seen.has(entry.id))];
      });
      setHasMore(Boolean(response.hasMore));
      setNextOffset(Number(response.nextCursor) || offset + nextItems.length);
      setError("");
    } catch (loadError) {
      if (seq === loadSeq.current) setError(loadError.message || "Could not load your feed.");
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(image);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  /* ---------- UI plumbing ---------- */
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setPreviewUrl("");
      setDeleteId("");
      setMenuFor("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuFor) return undefined;
    const onPointerDown = (event) => {
      if (!event.target.closest?.("[data-post-menu]")) setMenuFor("");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuFor]);

  useEffect(() => {
    if (!previewUrl && !deleteId) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [previewUrl, deleteId]);

  // The share button creates /feed?post=<id>; scroll to and highlight that post.
  useEffect(() => {
    if (deepLinkHandled.current || items.length === 0) return;
    const id = new URLSearchParams(window.location.search).get("post");
    if (!id) {
      deepLinkHandled.current = true;
      return;
    }
    if (!items.some((entry) => entry.id === id)) return;
    deepLinkHandled.current = true;
    setHighlightId(id);
    requestAnimationFrame(() => document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    setTimeout(() => setHighlightId(""), 3500);
  }, [items]);

  /* ---------- derived ---------- */
  const filtersActive = Boolean(query.trim()) || typeFilter !== "all" || timeFilter !== "all" || myPostsOnly;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase().replace(/^#/, "");
    return items
      .filter((item) => {
        if (typeFilter !== "all" && item.type !== typeFilter) return false;
        if (!postMatchesTime(item, timeFilter)) return false;
        if (myPostsOnly && item.authorId !== currentUserId) return false;
        if (!normalizedQuery) return true;
        return `${item.content || ""} ${item.authorName || ""} ${item.university || ""}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sort === "popular") {
          const score = (item) => (item.likesCount || 0) + (item.commentsCount || 0) * 2 + (item.viewsCount || 0) * 0.1;
          return score(b) - score(a);
        }
        const dateA = toDate(a.createdAt)?.getTime() || 0;
        const dateB = toDate(b.createdAt)?.getTime() || 0;
        return sort === "oldest" ? dateA - dateB : dateB - dateA;
      });
  }, [currentUserId, items, myPostsOnly, query, sort, timeFilter, typeFilter]);

  const canSubmit = image ? true : Boolean(content.trim());

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setTimeFilter("all");
    setMyPostsOnly(false);
  };

  /* ---------- state patch helpers ---------- */
  const patchPost = (id, patch) =>
    setItems((current) => current.map((post) => (post.id === id ? { ...post, ...patch(post) } : post)));

  const patchComment = (commentId, patch) =>
    setCommentsByPost((current) =>
      Object.fromEntries(
        Object.entries(current).map(([postId, list]) => [
          postId,
          list.map((entry) => (entry.id === commentId ? { ...entry, ...patch(entry) } : entry)),
        ])
      )
    );

  /* ---------- composer ---------- */
  const resetComposer = () => {
    setContent("");
    setImage(null);
    setColored(false);
    setPreset("indigo");
    setAudience("friends");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createPost = async (event) => {
    event?.preventDefault();
    if (!canSubmit || posting) return;
    setPosting(true);
    setError("");
    setNotice("");
    try {
      let uploaded = null;
      if (postType === "image" && image) {
        uploaded = await uploadFeatureMedia(image, { feature: "feed", resourceType: "image" });
      }
      const uploadedUrl = uploaded?.url || uploaded?.secure_url;
      if (postType === "image" && !uploadedUrl) throw new Error("The selected image could not be uploaded.");
      await postJson("/api/feed/posts", {
        type: postType,
        content: content.trim(),
        audience,
        backgroundPreset: postType === "colored" ? preset : undefined,
        imageUrl: postType === "image" ? uploadedUrl : undefined,
        cloudinaryPublicId: uploaded?.publicId || uploaded?.public_id,
      });
      resetComposer();
      setNotice("Your post is live.");
      await loadFeed();
    } catch (postError) {
      setError(postError.message || "Could not create your post.");
    } finally {
      setPosting(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That image is larger than 8 MB. Choose a smaller one.");
      event.target.value = "";
      return;
    }
    setError("");
    setImage(file);
    setColored(false); // a photo post can't also have a colored background
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------- post actions ---------- */
  const confirmRemove = async () => {
    const id = deleteId;
    setDeleteId("");
    const index = items.findIndex((item) => item.id === id);
    const removed = items[index];
    if (!removed) return;
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await deleteJson(`/api/feed/posts/${id}`);
      setNotice("Post deleted.");
    } catch (deleteError) {
      setItems((current) => {
        if (current.some((item) => item.id === id)) return current;
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
      setError(deleteError.message || "Could not delete this post.");
    }
  };

  const reportPost = async (id) => {
    setMenuFor("");
    try {
      await postJson(`/api/feed/posts/${id}/report`, { reportType: "Inappropriate content" });
      setNotice("Thanks. Your report was sent to UniHelp.");
    } catch (reportError) {
      setError(reportError.message || "Could not report this post.");
    }
  };

  const toggleLike = async (item) => {
    if (busyLikes.has(item.id)) return;
    const was = Boolean(item.likedByMe);
    setBusy(setBusyLikes, item.id, true);
    patchPost(item.id, (post) => ({
      likedByMe: !was,
      likesCount: Math.max(0, (post.likesCount || 0) + (was ? -1 : 1)),
    }));
    try {
      const response = was
        ? await deleteJson(`/api/feed/posts/${item.id}/like`)
        : await postJson(`/api/feed/posts/${item.id}/like`, {});
      patchPost(item.id, (post) => ({
        likedByMe: typeof response?.liked === "boolean" ? response.liked : !was,
        likesCount: response?.likesCount ?? post.likesCount,
      }));
    } catch (likeError) {
      patchPost(item.id, (post) => ({
        likedByMe: was,
        likesCount: Math.max(0, (post.likesCount || 0) + (was ? 1 : -1)),
      }));
      setError(likeError.message || "Could not update your like.");
    } finally {
      setBusy(setBusyLikes, item.id, false);
    }
  };

  const sharePost = async (item) => {
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
        setNotice("Post link copied to clipboard.");
      } else {
        throw new Error("Sharing is not available in this browser.");
      }
    } catch (shareError) {
      if (shareError?.name !== "AbortError") setError(shareError.message || "Could not share this post.");
    }
  };

  /* ---------- comments ---------- */
  const toggleComments = async (postId) => {
    if (commentsFor === postId) {
      setCommentsFor("");
      return;
    }
    setCommentsFor(postId);
    if (commentsByPost[postId]) return;
    setCommentsLoading(postId);
    try {
      const response = await getJson(`/api/feed/posts/${postId}/comments?limit=20`);
      setCommentsByPost((current) => ({ ...current, [postId]: response.items || [] }));
    } catch (commentError) {
      setError(commentError.message || "Could not load comments.");
    } finally {
      setCommentsLoading("");
    }
  };

  const addComment = async (event, item) => {
    event.preventDefault();
    const text = (commentDrafts[item.id] || "").trim();
    if (!text || commentPosting) return;
    setCommentPosting(item.id);
    try {
      const response = await postJson(`/api/feed/posts/${item.id}/comments`, { text });
      if (!response.item) throw new Error("The comment could not be confirmed.");
      setCommentsByPost((current) => ({ ...current, [item.id]: [response.item, ...(current[item.id] || [])] }));
      patchPost(item.id, (post) => ({ commentsCount: (post.commentsCount || 0) + 1 }));
      setCommentDrafts((current) => ({ ...current, [item.id]: "" }));
    } catch (commentError) {
      setError(commentError.message || "Could not post your comment.");
    } finally {
      setCommentPosting("");
    }
  };

  const toggleCommentLike = async (comment) => {
    if (busyCommentLikes.has(comment.id)) return;
    const was = Boolean(comment.liked);
    setBusy(setBusyCommentLikes, comment.id, true);
    patchComment(comment.id, (entry) => ({
      liked: !was,
      likesCount: Math.max(0, (entry.likesCount || 0) + (was ? -1 : 1)),
    }));
    try {
      const response = was
        ? await deleteJson(`/api/feed/comments/${comment.id}/like`)
        : await postJson(`/api/feed/comments/${comment.id}/like`, {});
      patchComment(comment.id, (entry) => ({
        liked: typeof response?.liked === "boolean" ? response.liked : !was,
        likesCount: response?.likesCount ?? entry.likesCount,
      }));
    } catch (likeError) {
      patchComment(comment.id, (entry) => ({
        liked: was,
        likesCount: Math.max(0, (entry.likesCount || 0) + (was ? 1 : -1)),
      }));
      setError(likeError.message || "Could not update the comment like.");
    } finally {
      setBusy(setBusyCommentLikes, comment.id, false);
    }
  };

  const focusComposer = () => {
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    textareaRef.current?.focus({ preventScroll: true });
  };

  /* ---------- render ---------- */
  return (
    <main className={`mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 ${t.text}`}>
      <header className={`relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br px-6 py-8 text-white sm:px-9 sm:py-10 ${t.header}`}>
        <div className={`pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full blur-2xl ${t.headerGlow}`} />
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Campus feed</h1>
          <p className="mt-2 max-w-xl text-sm text-indigo-50 sm:text-base">
            See what your community is up to, share a moment, and keep the conversation going.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          {/* ---------- composer ---------- */}
          <form onSubmit={createPost} className={`mb-5 p-4 sm:p-5 ${t.card}`}>
            <div className="flex gap-3">
              <Avatar src={currentUser?.photoURL} name={currentUser?.displayName} t={t} />
              <div className="min-w-0 flex-1">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") createPost(event);
                  }}
                  maxLength={500}
                  aria-label="Post content"
                  placeholder={image ? "Add a caption (optional)" : "What's happening on campus?"}
                  className={`w-full resize-y rounded-xl p-3 text-sm leading-6 outline-none transition focus:ring-2 focus:ring-indigo-500/30 ${
                    postType === "colored"
                      ? "min-h-40 border border-transparent text-center text-xl font-bold text-white placeholder:text-white/70"
                      : `min-h-24 focus:border-indigo-500 ${t.field}`
                  }`}
                  style={postType === "colored" ? { backgroundColor: presets[preset] } : undefined}
                />
                <div className={`mt-1 text-right text-xs ${content.length > 450 ? t.warn : t.faint}`}>
                  {content.length}/500
                </div>

                {postType === "colored" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(presets).map(([name, color]) => (
                      <button
                        type="button"
                        key={name}
                        aria-label={`${name} background`}
                        aria-pressed={preset === name}
                        onClick={() => setPreset(name)}
                        className={`h-7 w-7 rounded-full ring-2 ring-offset-2 transition ${t.swatchOffset} ${
                          preset === name ? t.swatchActive : "ring-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}

                {imagePreview && (
                  <div className="relative mt-3 w-fit max-w-full">
                    <img src={imagePreview} alt="Selected image preview" className="max-h-64 rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      aria-label="Remove selected image"
                      className={`absolute right-2 top-2 rounded-full bg-slate-950/70 p-1.5 text-white hover:bg-slate-950 ${t.focusRing}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-3 ${t.divider}`}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${t.ghostBtn} ${t.focusRing}`}
              >
                <ImagePlus size={17} /> Photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                type="button"
                disabled={Boolean(image)}
                onClick={() => setColored((value) => !value)}
                aria-pressed={colored}
                title={image ? "Remove the photo to use a background" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${t.focusRing} ${
                  colored ? t.accentSoft : t.ghostBtn
                }`}
              >
                <Palette size={17} /> Background
              </button>

              <div role="radiogroup" aria-label="Post audience" className={`ml-auto flex rounded-xl p-1 ${t.segmentBg}`}>
                {audiences.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={audience === value}
                    onClick={() => setAudience(value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${t.focusRing} ${
                      audience === value ? t.segmentActive : t.segmentIdle
                    }`}
                  >
                    <Icon size={14} /> <span className="hidden min-[420px]:inline">{label}</span>
                  </button>
                ))}
              </div>

              <button
                disabled={!canSubmit || posting}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${t.primary} ${t.focusRing}`}
              >
                <Send size={15} /> {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>

          {/* ---------- filters ---------- */}
          <div className={`mb-4 p-3 ${t.card}`}>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-bold">Community posts</h2>
              <button
                type="button"
                disabled={loading}
                onClick={() => loadFeed()}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:opacity-50 ${t.muted} ${t.ghostBtn} ${t.focusRing}`}
              >
                <RefreshCw size={14} className={loading ? "motion-safe:animate-spin" : ""} /> Refresh
              </button>
            </div>

            <label className={`flex items-center gap-2 rounded-xl px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 ${t.field}`}>
              <Search size={18} className={`flex-none ${t.faint}`} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search posts"
                placeholder="Search posts, people, or #hashtags"
                className={`h-11 min-w-0 flex-1 bg-transparent text-sm outline-none ${t.text} ${dark ? "placeholder:text-slate-500" : "placeholder:text-slate-400"}`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className={`p-1 ${t.faint} ${dark ? "hover:text-white" : "hover:text-slate-700"}`}
                >
                  <X size={16} />
                </button>
              )}
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                {types.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTypeFilter(option.value)}
                    aria-pressed={typeFilter === option.value}
                    className={`flex-none rounded-full px-3 py-1.5 text-xs font-bold transition ${t.focusRing} ${
                      typeFilter === option.value ? `${t.primarySolid} text-white` : t.chipIdle
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <label className={`flex items-center gap-1.5 rounded-full px-3 ${t.pillBg}`}>
                  <Clock3 size={14} />
                  <select aria-label="Filter by time" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} className={t.select}>
                    <option className={t.option} value="all">Any time</option>
                    <option className={t.option} value="today">Today</option>
                    <option className={t.option} value="week">This week</option>
                    <option className={t.option} value="month">This month</option>
                  </select>
                </label>
                <label className={`flex items-center gap-1.5 rounded-full px-3 ${t.pillBg}`}>
                  <ArrowDownWideNarrow size={14} />
                  <select aria-label="Sort posts" value={sort} onChange={(event) => setSort(event.target.value)} className={t.select}>
                    <option className={t.option} value="latest">Latest</option>
                    <option className={t.option} value="oldest">Oldest</option>
                    <option className={t.option} value="popular">Popular</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setMyPostsOnly((value) => !value)}
                  aria-pressed={myPostsOnly}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${t.focusRing} ${
                    myPostsOnly ? t.violetSoft : t.chipIdle
                  }`}
                >
                  My posts
                </button>
              </div>
            </div>
            {filtersActive && hasMore && (
              <p className={`mt-3 px-1 text-xs ${t.muted}`}>
                Filters apply to the {items.length} posts loaded so far. Load more to search further back.
              </p>
            )}
          </div>

          {/* ---------- alerts ---------- */}
          {(error || notice) && (
            <div
              role={error ? "alert" : "status"}
              className={`mb-4 flex items-center gap-3 rounded-xl border p-3 text-sm ${error ? t.alertError : t.alertOk}`}
            >
              {!error && <Check size={16} className="flex-none" />}
              <span className="min-w-0 flex-1">{error || notice}</span>
              {error && (
                <button type="button" onClick={() => loadFeed()} className="flex-none font-bold underline">
                  Retry feed
                </button>
              )}
              <button
                type="button"
                onClick={() => { setError(""); setNotice(""); }}
                aria-label="Dismiss message"
                className={`flex-none rounded-full p-1 ${t.alertClose}`}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ---------- loading skeleton ---------- */}
          {loading && items.length === 0 && (
            <div className="space-y-4" aria-label="Loading feed" aria-busy="true">
              {[0, 1].map((key) => (
                <div key={key} className={`p-5 ${t.card}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-full motion-safe:animate-pulse ${t.skeleton}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-3 w-1/3 rounded motion-safe:animate-pulse ${t.skeleton}`} />
                      <div className={`h-3 w-1/4 rounded motion-safe:animate-pulse ${t.skeleton}`} />
                    </div>
                  </div>
                  <div className={`mt-4 h-32 rounded-xl motion-safe:animate-pulse ${t.skeleton}`} />
                </div>
              ))}
            </div>
          )}

          {/* ---------- empty state ---------- */}
          {!loading && filteredItems.length === 0 && (
            <div className={`rounded-2xl border border-dashed px-6 py-12 text-center ${t.emptyCard}`}>
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${t.emptyIcon}`}>
                <MessageCircle size={22} />
              </div>
              <h2 className="mt-4 font-bold">{items.length ? "No posts match these filters" : "Your feed is quiet"}</h2>
              <p className={`mt-2 text-sm ${t.muted}`}>
                {items.length ? "Try a different search or clear your filters." : "Share something with your campus community to get the conversation started."}
              </p>
              {items.length > 0 ? (
                <button type="button" onClick={clearFilters} className={`mt-4 text-sm font-bold hover:underline ${t.accentText}`}>
                  Clear filters
                </button>
              ) : (
                <button type="button" onClick={focusComposer} className={`mt-4 text-sm font-bold hover:underline ${t.accentText}`}>
                  Write the first post
                </button>
              )}
            </div>
          )}

          {/* ---------- posts ---------- */}
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const own = item.authorId === currentUserId;
              const audienceOption = audiences.find((option) => option.value === item.audience) || audiences[2];
              const AudienceIcon = audienceOption.Icon;
              const comments = commentsByPost[item.id] || [];
              const open = commentsFor === item.id;
              return (
                <article
                  key={item.id}
                  id={`post-${item.id}`}
                  className={`scroll-mt-24 transition-shadow hover:shadow-md ${t.card} ${highlightId === item.id ? "ring-2 ring-indigo-500" : ""}`}
                >
                  <div className="flex items-center gap-3 p-4 sm:px-5">
                    <Avatar src={item.authorAvatar} name={item.authorName} t={t} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{item.authorName || "UniHelp student"}</p>
                      <div className={`mt-0.5 flex items-center gap-1.5 text-xs ${t.muted}`}>
                        <span className="flex-none">{timeAgo(item.createdAt)}</span>
                        <span aria-hidden="true">·</span>
                        <AudienceIcon size={13} className="flex-none" />
                        <span className="flex-none">{audienceOption.label}</span>
                        {item.university && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{item.university}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => sharePost(item)} aria-label="Share post" className={`${t.iconBtn} ${t.focusRing}`}>
                      <Share2 size={18} />
                    </button>
                    <div className="relative" data-post-menu>
                      <button
                        type="button"
                        onClick={() => setMenuFor(menuFor === item.id ? "" : item.id)}
                        aria-label="Post options"
                        aria-haspopup="menu"
                        aria-expanded={menuFor === item.id}
                        className={`${t.iconBtn} ${t.focusRing}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuFor === item.id && (
                        <div role="menu" className={`absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl py-1 shadow-lg ${t.menu}`}>
                          {own ? (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => { setMenuFor(""); setDeleteId(item.id); }}
                              className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold ${t.dangerText}`}
                            >
                              <Trash2 size={16} /> Delete post
                            </button>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => reportPost(item.id)}
                              className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold ${t.menuItem}`}
                            >
                              <Flag size={16} /> Report post
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.type === "colored" && (
                    <div
                      className="flex min-h-56 items-center justify-center px-8 py-10 text-center font-black text-white"
                      style={{ backgroundColor: presets[item.backgroundPreset] || presets.indigo }}
                    >
                      <p className={`whitespace-pre-wrap break-words ${(item.content || "").length > 120 ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>
                        {item.content}
                      </p>
                    </div>
                  )}
                  {item.type === "image" && item.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(item.imageUrl)}
                      className={`block w-full cursor-zoom-in overflow-hidden ${t.imageWell} ${t.focusRing}`}
                      aria-label="Open full image"
                    >
                      <img src={item.imageUrl} alt={item.content ? `Photo: ${item.content.slice(0, 80)}` : "Post photo"} loading="lazy" className="max-h-[34rem] w-full object-cover" />
                    </button>
                  )}

                  <div className="px-4 pb-4 sm:px-5">
                    {item.type !== "colored" && item.content && (
                      <p className={`whitespace-pre-wrap break-words pt-3 text-sm leading-6 ${t.body}`}>{item.content}</p>
                    )}
                    <div className={`mt-4 flex items-center gap-5 border-t pt-3 ${t.divider}`}>
                      <button
                        type="button"
                        onClick={() => toggleLike(item)}
                        aria-pressed={Boolean(item.likedByMe)}
                        aria-label={item.likedByMe ? "Unlike post" : "Like post"}
                        className={`inline-flex items-center gap-2 rounded-md text-sm font-bold transition active:scale-95 ${t.focusRing} ${
                          item.likedByMe ? t.liked : t.likeIdle
                        }`}
                      >
                        <Heart size={18} fill={item.likedByMe ? "currentColor" : "none"} /> {compact(item.likesCount)}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleComments(item.id)}
                        aria-expanded={open}
                        className={`inline-flex items-center gap-2 rounded-md text-sm font-bold transition ${t.focusRing} ${
                          open ? t.commentOpen : t.commentIdle
                        }`}
                      >
                        <MessageCircle size={18} /> {compact(item.commentsCount)} <span className="hidden sm:inline">Comments</span>
                      </button>
                    </div>

                    {open && (
                      <div className={`mt-3 border-t pt-3 ${t.divider}`}>
                        <form onSubmit={(event) => addComment(event, item)} className="flex items-center gap-2">
                          <Avatar src={currentUser?.photoURL} name={currentUser?.displayName} t={t} className="h-8 w-8 text-xs" />
                          <input
                            value={commentDrafts[item.id] || ""}
                            onChange={(event) => setCommentDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                            maxLength={500}
                            aria-label="Write a comment"
                            placeholder="Write a comment…"
                            className={`min-w-0 flex-1 rounded-full px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${t.field}`}
                          />
                          <button
                            type="submit"
                            disabled={!commentDrafts[item.id]?.trim() || commentPosting === item.id}
                            className={`rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-40 ${t.primary} ${t.focusRing}`}
                          >
                            {commentPosting === item.id ? "Sending…" : "Send"}
                          </button>
                        </form>
                        {commentsLoading === item.id && <p className={`py-4 text-center text-sm ${t.muted}`}>Loading comments…</p>}
                        {commentsLoading !== item.id && comments.length === 0 && (
                          <p className={`py-4 text-center text-sm ${t.muted}`}>No comments yet. Start the conversation.</p>
                        )}
                        <div className="mt-3 space-y-3">
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2.5">
                              <Avatar src={comment.authorAvatar} name={comment.authorName} t={t} className="h-8 w-8 text-xs" />
                              <div className={`min-w-0 flex-1 rounded-2xl px-3 py-2 ${t.commentBubble}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold">{comment.authorName || "Student"}</span>
                                  <span className={`text-[11px] ${t.faint}`}>{timeAgo(comment.createdAt)}</span>
                                </div>
                                <p className={`mt-1 whitespace-pre-wrap break-words text-sm ${t.body}`}>{comment.text || comment.content}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleCommentLike(comment)}
                                aria-pressed={Boolean(comment.liked)}
                                aria-label={comment.liked ? "Unlike comment" : "Like comment"}
                                className={`mt-2 flex flex-none items-center gap-1 rounded-md text-xs ${t.focusRing} ${
                                  comment.liked ? t.liked : t.commentLikeIdle
                                }`}
                              >
                                <Heart size={14} fill={comment.liked ? "currentColor" : "none"} />
                                {comment.likesCount ? compact(comment.likesCount) : ""}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {items.length > 0 && hasMore && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => loadFeed({ append: true, offset: nextOffset })}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm disabled:opacity-50 ${t.loadMore} ${t.focusRing}`}
            >
              <RefreshCw size={16} className={loadingMore ? "motion-safe:animate-spin" : ""} /> {loadingMore ? "Loading…" : "Load more posts"}
            </button>
          )}
        </section>

        {/* ---------- sidebar ---------- */}
        <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block">
          <div className={`p-5 ${t.card}`}>
            <h2 className="font-bold">Your community</h2>
            <p className={`mt-2 text-sm leading-6 ${t.muted}`}>
              Share updates, celebrate campus life, and connect with fellow students.
            </p>
            <button
              type="button"
              onClick={focusComposer}
              className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${t.primary} ${t.focusRing}`}
            >
              Create a post
            </button>
          </div>
          <div className={`rounded-2xl border p-5 ${t.tipCard}`}>
            <h2 className={`text-sm font-bold ${t.tipTitle}`}>Check your audience</h2>
            <p className={`mt-2 text-sm leading-6 ${t.tipText}`}>
              Choose who sees a post before you share it: friends, only you, or everyone.
            </p>
          </div>
        </aside>
      </div>

      {/* ---------- delete confirmation ---------- */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setDeleteId("")}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-sm p-6 shadow-xl ${t.card} ${t.text}`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${t.dangerIcon}`}>
              <Trash2 size={20} />
            </div>
            <h2 id="delete-title" className="mt-4 text-lg font-bold">Delete this post?</h2>
            <p id="delete-desc" className={`mt-1 text-sm ${t.muted}`}>
              The post and its comments will be removed. This can't be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setDeleteId("")}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${dark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"} ${t.focusRing}`}
              >
                Keep post
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${t.dangerBtn} ${t.focusRing}`}
              >
                Delete post
              </button>
            </div>
          </div>
        </div>
      )}

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
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
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