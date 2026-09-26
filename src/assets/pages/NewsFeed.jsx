import { useEffect, useRef, useState } from "react";
import { Heart, ImagePlus, MessageCircle, Palette, Send, Share2, Trash2, MoreHorizontal, X } from "lucide-react";
import { auth } from "../../firebase/config";
import { deleteJson, getJson, postJson, uploadFeatureMedia } from "../../services/api";

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

// Firestore can hand back Timestamp objects instead of ISO strings, and
// `new Date(timestamp)` on one of those silently produces "Invalid Date".
// This normalizes either shape before formatting.
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
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name) {
  if (!name) return "U";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

const typeOptions = [
  { key: "text", label: "Text", icon: Send },
  { key: "image", label: "Photo", icon: ImagePlus },
  { key: "colored", label: "Background", icon: Palette },
];

export default function NewsFeed() {
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState("text");
  const [preset, setPreset] = useState("indigo");
  const [image, setImage] = useState(null);
  const [imageObjectUrl, setImageObjectUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [likedIds, setLikedIds] = useState(() => new Set());
  const fileInputRef = useRef(null);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const response = await getJson("/api/feed?limit=20");
      setItems(response.items || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load your feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeed(); }, []);

  // Keep the image preview URL in sync with the selected file, and always
  // release the previous object URL so we don't leak memory across posts.
  useEffect(() => {
    if (!image) { setImageObjectUrl(""); return; }
    const url = URL.createObjectURL(image);
    setImageObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const canSubmit = type === "image" ? Boolean(image) : content.trim().length > 0;

  const resetComposer = () => {
    setContent("");
    setImage(null);
    setType("text");
    setPreset("indigo");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createPost = async (event) => {
    event.preventDefault();
    if (!canSubmit || posting) return;
    setPosting(true);
    try {
      let uploaded = null;
      if (type === "image") uploaded = await uploadFeatureMedia(image, { feature: "feed", resourceType: "image" });
      await postJson("/api/feed/posts", {
        type,
        content,
        backgroundPreset: type === "colored" ? preset : undefined,
        imageUrl: uploaded?.url || uploaded?.secure_url,
        cloudinaryPublicId: uploaded?.publicId || uploaded?.public_id,
      });
      resetComposer();
      await loadFeed();
    } catch (postError) {
      setError(postError.message || "Could not create your post.");
    } finally {
      setPosting(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImage(file);
    if (file) setType("image");
  };

  const clearImage = () => {
    setImage(null);
    if (type === "image") setType("text");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePost = async (id) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await deleteJson(`/api/feed/posts/${id}`);
    } catch (deleteError) {
      setItems(previous);
      setError(deleteError.message || "Could not delete this post.");
    }
  };

  const reportPost = async (id) => {
    try {
      await postJson(`/api/feed/posts/${id}/report`, { reportType: "Inappropriate content" });
      setError("Thanks. Your report was sent to UniHelp.");
    } catch (reportError) {
      setError(reportError.message || "Could not report this post.");
    }
  };

  const toggleLike = async (item) => {
    const alreadyLiked = likedIds.has(item.id);
    setLikedIds((current) => {
      const next = new Set(current);
      alreadyLiked ? next.delete(item.id) : next.add(item.id);
      return next;
    });
    setItems((current) => current.map((post) => post.id === item.id
      ? { ...post, likesCount: (post.likesCount || 0) + (alreadyLiked ? -1 : 1) }
      : post));
    try {
      await postJson(`/api/feed/posts/${item.id}/like`, {});
    } catch (likeError) {
      setLikedIds((current) => {
        const next = new Set(current);
        alreadyLiked ? next.add(item.id) : next.delete(item.id);
        return next;
      });
      setItems((current) => current.map((post) => post.id === item.id
        ? { ...post, likesCount: (post.likesCount || 0) + (alreadyLiked ? 1 : -1) }
        : post));
      setError(likeError.message || "Could not update your like.");
    }
  };

  const sharePost = async (item) => {
    const url = `${window.location.origin}/feed?post=${encodeURIComponent(item.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${item.authorName || "UniHelp student"} on UniHelp`, text: item.content || "View this post on UniHelp.", url });
      } else {
        await navigator.clipboard.writeText(url);
        setError("Post link copied to clipboard.");
      }
    } catch (shareError) {
      if (shareError?.name !== "AbortError") setError("Could not share this post.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">UniHelp</p>
        <h1 className="mt-1 text-3xl font-black">Feed</h1>
        <p className="mt-2 text-sm opacity-70">Share what's happening with your friends around campus.</p>
      </header>

      <form onSubmit={createPost} className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {initials(auth.currentUser?.displayName)}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={500}
              placeholder={type === "image" ? "Add a caption (optional)" : "What's on your mind?"}
              className={`min-h-20 w-full resize-y rounded-xl border p-3 text-sm outline-none transition-colors focus:border-indigo-500 ${
                type === "colored"
                  ? "text-center text-lg font-bold text-white placeholder:text-white/70"
                  : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              }`}
              style={type === "colored" ? { backgroundColor: presets[preset] } : undefined}
            />
            <div className="mt-1 text-right text-xs opacity-50">{content.length}/500</div>
          </div>
        </div>

        {type === "colored" && (
          <div className="mt-2 flex flex-wrap gap-2 pl-13">
            {Object.entries(presets).map(([name, color]) => (
              <button
                type="button"
                key={name}
                aria-label={name}
                aria-pressed={preset === name}
                onClick={() => setPreset(name)}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-2 transition ${preset === name ? "ring-slate-900 dark:ring-white" : "ring-transparent"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {imageObjectUrl && (
          <div className="relative mt-3 inline-block">
            <img src={imageObjectUrl} alt="Selected upload preview" className="max-h-64 rounded-xl object-cover" />
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remove selected image"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {typeOptions.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => (key === "image" ? fileInputRef.current?.click() : setType(key))}
              aria-pressed={type === key}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                type === key
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <button
            disabled={!canSubmit || posting}
            className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button className="flex-none font-bold underline" onClick={loadFeed}>Try again</button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      )}

      {!loading && !items.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <h2 className="font-bold">Your feed is quiet</h2>
          <p className="mt-2 text-sm opacity-70">Add friends and start sharing what's happening around campus.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const own = item.authorId === auth.currentUser?.uid;
          const liked = likedIds.has(item.id);
          return (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  {item.authorAvatar ? <img src={item.authorAvatar} alt="" className="h-full w-full object-cover" /> : initials(item.authorName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-bold">{item.authorName || "UniHelp student"}</p>
                    {item.authorPremium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                        <span aria-hidden="true">✓</span> Premium
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-60">{timeAgo(item.createdAt)}</p>
                </div>
                <button onClick={() => sharePost(item)} aria-label="Share post" className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Share2 size={18} />
                </button>
                <button
                  onClick={() => (own ? removePost(item.id) : reportPost(item.id))}
                  aria-label={own ? "Delete post" : "Report post"}
                  className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {own ? <Trash2 size={18} /> : <MoreHorizontal size={18} />}
                </button>
              </div>

              {item.type === "colored" && (
                <div
                  className="flex min-h-56 items-center justify-center p-8 text-center text-2xl font-black text-white"
                  style={{ backgroundColor: presets[item.backgroundPreset] || presets.indigo }}
                >
                  {item.content}
                </div>
              )}

              {item.type === "image" && item.imageUrl && (
                <button type="button" onClick={() => setImagePreview(item.imageUrl)} className="block w-full cursor-zoom-in" aria-label="Open full image">
                  <img src={item.imageUrl} alt="" loading="lazy" className="max-h-[30rem] w-full object-cover" />
                </button>
              )}

              <div className="p-4">
                {item.type !== "colored" && item.content && (
                  <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
                )}
                <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-3 text-sm font-bold opacity-80 dark:border-slate-800">
                  <button onClick={() => toggleLike(item)} className={`inline-flex items-center gap-1.5 transition-colors ${liked ? "text-red-600" : "hover:text-red-600"}`}>
                    <Heart size={16} fill={liked ? "currentColor" : "none"} /> {item.likesCount || 0}
                  </button>
                  <span className="inline-flex items-center gap-1.5 opacity-70">
                    <MessageCircle size={16} /> {item.commentsCount || 0}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {imagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Full image preview" onClick={() => setImagePreview("")}>
          <div className="relative flex h-full w-full items-center justify-center">
            <img src={imagePreview} alt="Full post" className="max-h-full max-w-full object-contain" />
            <button type="button" onClick={() => setImagePreview("")} aria-label="Close full image" className="absolute right-2 top-2 rounded-full bg-black/60 p-3 text-white">
              <X size={22} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}