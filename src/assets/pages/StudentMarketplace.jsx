import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  ShoppingBag,
  Search,
  Phone,
  Loader2,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  ImageIcon,
  Tag,
  Crown,
  Lock,
  Pencil,
  MoreVertical,
  Share2,
  Megaphone,
  Star,
  LayoutGrid,
  List,
  ArrowUpDown,
  Package,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import ImageCarousel from "./../components/ImageCarousel";
import { db, auth } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

import { toCloudinaryAsset } from "../../services/cloudinary";
import { deleteJson, getJson, postJson, putJson, uploadFeatureMedia } from "../../services/api";
import { deleteCloudinaryAssets } from "../../services/mediaCleanup";
import { buildShareUrl, shareContent } from "../utils/share";

/* =====================================================
   CONSTANTS & HELPERS
===================================================== */
const FREE_LIMIT = 3;
const PREMIUM_LIMIT = 10;
const MAX_IMAGES = 5;
const BUDGET_CEILING = 20000;
const DESCRIPTION_MAX = 600;

const MARKETPLACE_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Books & study materials",
  "Clothing & fashion",
  "Kitchen & appliances",
  "Sports & fitness",
  "Beauty & personal care",
  "Other",
];

const CONDITION_OPTIONS = ["New", "Like new", "Fairly used", "Needs repair"];
const AVAILABILITY_OPTIONS = ["Available now", "Reserved", "Negotiable"];

const STATUS_STYLES = {
  pending: ["Pending review", "bg-amber-500/10 text-amber-600"],
  approved: ["Live", "bg-emerald-500/10 text-emerald-600"],
  active: ["Live", "bg-emerald-500/10 text-emerald-600"],
  rejected: ["Rejected", "bg-red-500/10 text-red-500"],
};

const EMPTY_FORM = {
  title: "",
  category: "",
  condition: "",
  price: "",
  location: "",
  availability: "",
  phone: "",
  description: "",
};

const formatPrice = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

const toTime = (value) => {
  if (!value) return 0;
  if (typeof value === "object" && typeof value.seconds === "number") return value.seconds * 1000;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

// wa.me needs the international format without "+" (e.g. 0801... -> 234801...)
const toWhatsAppNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
};

const isValidPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
};

const getTheme = (dark) => ({
  page: dark ? "bg-[#0b0f1a] text-white" : "bg-[#f6f8fc] text-gray-900",
  card: dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200 shadow-sm",
  field: dark
    ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-indigo-400 [&>option]:text-gray-900"
    : "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500",
  muted: dark ? "text-white/60" : "text-gray-500",
  subtle: dark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700",
  menu: dark
    ? "bg-[#111827] border border-white/10 text-white shadow-2xl"
    : "bg-white border border-gray-200 text-gray-800 shadow-xl",
  menuHover: dark ? "hover:bg-white/10" : "hover:bg-gray-100",
  skeleton: dark ? "bg-white/10" : "bg-gray-200",
});

/* =====================================================
   SMALL PRESENTATIONAL COMPONENTS
===================================================== */
function Field({ label, required, error, hint, theme, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      ) : hint ? (
        <span className={`mt-1 block text-xs ${theme.muted}`}>{hint}</span>
      ) : null}
    </label>
  );
}

function SkeletonCard({ theme }) {
  return (
    <div className={`${theme.card} animate-pulse overflow-hidden rounded-2xl`}>
      <div className={`h-48 ${theme.skeleton}`} />
      <div className="space-y-3 p-4">
        <div className={`h-4 w-2/3 rounded ${theme.skeleton}`} />
        <div className={`h-3 w-full rounded ${theme.skeleton}`} />
        <div className={`h-3 w-4/5 rounded ${theme.skeleton}`} />
        <div className={`mt-4 h-10 w-full rounded-xl ${theme.skeleton}`} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, action, theme }) {
  return (
    <div className={`${theme.card} flex flex-col items-center rounded-2xl px-6 py-16 text-center`}>
      <div className="mb-4 rounded-2xl bg-indigo-500/10 p-4 text-indigo-500">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className={`mt-1 max-w-sm text-sm ${theme.muted}`}>{text}</p>
      {action ? (
        <button
          onClick={action.onClick}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

function ListingCard({
  item,
  theme,
  dark,
  mode,
  layout = "grid",
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onShare,
  onContact,
  onDetails,
  anchor = false,
  highlighted = false,
}) {
  const isList = layout === "list" && mode === "market";
  const status = mode === "my" ? STATUS_STYLES[item.status] : null;

  return (
    <article
      id={anchor ? `product-${item.id}` : undefined}
      className={`${theme.card} flex overflow-hidden rounded-2xl transition hover:shadow-lg ${
        isList ? "flex-col sm:flex-row" : "flex-col"
      } ${highlighted ? "ring-2 ring-indigo-500" : ""}`}
    >
      <div className={`relative ${isList ? "shrink-0 sm:w-64 md:w-72" : ""}`}>
        <ImageCarousel
          images={item.images}
          title={item.title}
          dark={dark}
          offsetTopRight={mode === "my"}
          verifiedBadge={
            item.verified ? (
              <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white shadow">
                <CheckCircle2 size={12} />
                Verified
              </div>
            ) : null
          }
          menuButton={
            mode === "my" ? (
              <div className="absolute right-3 top-3 z-10" data-menu-id={item.id}>
                <button
                  onClick={() => onToggleMenu(item.id)}
                  aria-label="Listing options"
                  aria-expanded={menuOpen}
                  className="rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition hover:bg-black/80"
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpen ? (
                  <div className={`absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl ${theme.menu}`}>
                    <button
                      onClick={() => onEdit(item)}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm ${theme.menuHover}`}
                    >
                      <Pencil size={15} />
                      Edit listing
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 size={15} />
                      Delete listing
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />
        {mode === "market" && item.isSponsored ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-slate-950 shadow">
            <Megaphone size={12} /> Sponsored
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => onDetails(item)}
              className="line-clamp-1 text-left text-base font-semibold transition hover:text-indigo-500 sm:text-lg"
            >
              {item.title}
            </button>
            {item.category ? (
              <span className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-xs text-indigo-500">
                <Tag size={11} />
                {item.category}
              </span>
            ) : null}
          </div>

          {status ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status[1]}`}>
              {item.status === "pending" ? <Clock size={12} /> : null}
              {status[0]}
            </span>
          ) : null}

          <p className={`line-clamp-2 text-sm ${theme.muted}`}>{item.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
            <p className="text-lg font-bold text-indigo-500">{formatPrice(item.price)}</p>
            {Number(item.reviewCount) > 0 ? (
              <span className={`inline-flex items-center gap-1 text-xs ${theme.muted}`}>
                <Star size={13} className="fill-amber-400 text-amber-500" />
                {Number(item.ratingAverage || 0).toFixed(1)} ({item.reviewCount})
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 pt-0">
          {mode === "market" ? (
            <button
              onClick={() => onDetails(item)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-500/10 py-2.5 text-sm font-medium transition hover:bg-slate-500/20"
            >
              <Eye size={15} />
              Details
            </button>
          ) : null}
          <button
            onClick={() => onShare(item)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500/10 py-2.5 text-sm font-medium text-indigo-500 transition hover:bg-indigo-500/20"
          >
            <Share2 size={15} />
            Share
          </button>
          {mode === "market" && item.phone ? (
            <button
              onClick={() => onContact(item)}
              className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              <Phone size={15} />
              WhatsApp
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/* =====================================================
   MAIN COMPONENT
===================================================== */
export default function StudentMarketplace({ dark }) {
  const theme = useMemo(() => getTheme(dark), [dark]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedProductId = searchParams.get("product");

  /* ---------- state ---------- */
  const [uid, setUid] = useState(auth.currentUser?.uid || null);
  const [view, setView] = useState("market");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPrice, setFilterPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [sponsoredOnly, setSponsoredOnly] = useState(false);

  // Modal & upload
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedSpace, setSavedSpace] = useState(0);
  const [errors, setErrors] = useState({});

  // Files & previews
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const previewUrlsRef = useRef([]);

  // Plan & limits
  const [isPremium, setIsPremium] = useState(false);
  const [uploadLimit, setUploadLimit] = useState(FREE_LIMIT);
  const [userUploads, setUserUploads] = useState(0);
  const [sellerName, setSellerName] = useState("");

  // Editing, menus, delete
  const [editingItem, setEditingItem] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Deep link highlight
  const [highlightedId, setHighlightedId] = useState(null);
  const deepLinkHandled = useRef(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const requestRef = useRef(0);
  const pageRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);

  /* ---------- object URL cleanup ---------- */
  const clearObjectUrls = useCallback(() => {
    previewUrlsRef.current.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    previewUrlsRef.current = [];
  }, []);

  useEffect(() => clearObjectUrls, [clearObjectUrls]);

  const resetForm = useCallback(() => {
    clearObjectUrls();
    setForm(EMPTY_FORM);
    setImages([]);
    setPreviews([]);
    setProgress(0);
    setSavedSpace(0);
    setErrors({});
    setEditingItem(null);
    setShowUpload(false);
  }, [clearObjectUrls]);

  /* ---------- auth ---------- */
  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid || null)), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---------- data ---------- */
  const fetchUserPlan = useCallback(async () => {
    if (!uid) return;
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const premium = userData.premium === true;
        setSellerName(
          userData.username ||
            userData.fullName ||
            userData.name ||
            userData.displayName ||
            auth.currentUser?.displayName ||
            auth.currentUser?.email ||
            ""
        );
        setIsPremium(premium);
        setUploadLimit(premium ? PREMIUM_LIMIT : FREE_LIMIT);
      } else {
        setSellerName(auth.currentUser?.displayName || auth.currentUser?.email || "");
      }
      const data = await getJson(`/api/marketplace?userId=${encodeURIComponent(uid)}&limit=1`);
      setUserUploads(data.total || 0);
    } catch (err) {
      console.error("Error fetching user plan:", err);
    }
  }, [uid]);

  const fetchItems = useCallback(async ({ reset = true } = {}) => {
    if (!reset && (loadingMoreRef.current || !hasMoreRef.current)) return;
    const requestId = reset ? ++requestRef.current : requestRef.current;

    if (view === "my" && !uid) {
      setItems([]);
      setLoading(false);
      hasMoreRef.current = false;
      setHasMore(false);
      return;
    }

    if (reset) {
      pageRef.current = 0;
      hasMoreRef.current = false;
      setHasMore(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
      setLoading(true);
      setLoadError(false);
    } else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    setLoadMoreError(false);

    const page = reset ? 1 : pageRef.current + 1;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (view === "my") {
      params.set("userId", uid);
    } else {
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterCategory) params.set("category", filterCategory);
      if (filterPrice) params.set("maxPrice", filterPrice);
      if (sort !== "newest") params.set("sort", sort);
      if (sponsoredOnly) params.set("sponsored", "active");
    }

    try {
      const data = await getJson(`/api/marketplace?${params.toString()}`);
      if (requestId !== requestRef.current) return; // a newer request superseded this one
      const pageItems = Array.isArray(data.items) ? data.items : [];
      setItems((current) => {
        if (reset) return pageItems;
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...pageItems.filter((item) => !seen.has(item.id))];
      });
      pageRef.current = Number(data.page) || page;
      hasMoreRef.current = Boolean(data.hasMore);
      setHasMore(hasMoreRef.current);
    } catch (err) {
      console.error("Error fetching marketplace items:", err);
      if (requestId === requestRef.current) {
        if (reset) setLoadError(true);
        else setLoadMoreError(true);
      }
    } finally {
      if (requestId === requestRef.current) {
        if (reset) setLoading(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [view, uid, debouncedSearch, filterCategory, filterPrice, sort, sponsoredOnly]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchUserPlan();
  }, [fetchUserPlan]);

  /* ---------- menus, escape, scroll lock ---------- */
  useEffect(() => {
    if (!activeMenu) return undefined;
    const onPointerDown = (e) => {
      if (!e.target.closest?.(`[data-menu-id="${activeMenu}"]`)) setActiveMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeMenu]);

  useEffect(() => {
    if (!showUpload && !deleteTarget) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (deleteTarget && !deleting) setDeleteTarget(null);
      else if (showUpload && !uploading) resetForm();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [showUpload, deleteTarget, uploading, deleting, resetForm]);

  /* ---------- derived lists ---------- */
  const categories = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const c = item.category?.trim();
      if (c && !map.has(c.toLowerCase())) map.set(c.toLowerCase(), c);
    });
    return [...map.values()].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const cat = filterCategory.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);
      const matchCategory = !cat || item.category?.trim().toLowerCase() === cat;
      const matchPrice = !filterPrice || Number(item.price) <= Number(filterPrice);
      return matchSearch && matchCategory && matchPrice && (!sponsoredOnly || item.isSponsored);
    });
  }, [items, debouncedSearch, filterCategory, filterPrice, sponsoredOnly]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    if (sort === "price_asc") return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "price_desc") return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sort === "rating_desc") {
      return list.sort(
        (a, b) =>
          Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0) ||
          Number(b.reviewCount || 0) - Number(a.reviewCount || 0)
      );
    }
    return list.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
  }, [filteredItems, sort]);

  const shelves = useMemo(
    () => ({
      sponsored: filteredItems
        .filter((i) => i.isSponsored)
        .sort((a, b) => Number(b.sponsoredPriority || 0) - Number(a.sponsoredPriority || 0))
        .slice(0, 3),
      fresh: [...filteredItems].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt)).slice(0, 6),
      budget: filteredItems
        .filter((i) => Number(i.price) > 0 && Number(i.price) <= BUDGET_CEILING)
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 6),
      verified: filteredItems.filter((i) => i.verified).slice(0, 6),
    }),
    [filteredItems]
  );

  const hasFilters = Boolean(search || filterCategory || filterPrice || sponsoredOnly);
  const listedItems = view === "market" ? sortedItems : items;
  const usagePercent = Math.min(100, Math.round((userUploads / uploadLimit) * 100));
  const limitReached = userUploads >= uploadLimit;

  const clearFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterPrice("");
    setSponsoredOnly(false);
  };

  /* ---------- deep link (?product=ID) ---------- */
  useEffect(() => {
    if (!sharedProductId || deepLinkHandled.current || loading || view !== "market") return;
    if (!items.some((i) => i.id === sharedProductId)) return;
    deepLinkHandled.current = true;
    setHighlightedId(sharedProductId);
    requestAnimationFrame(() => {
      document.getElementById(`product-${sharedProductId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = setTimeout(() => setHighlightedId(null), 4000);
    return () => clearTimeout(timer);
  }, [sharedProductId, items, loading, view]);

  /* ---------- image handling ---------- */
  const compressImage = async (file) => {
    try {
      return await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        fileType: "image/webp",
      });
    } catch (err) {
      console.warn("Compression failed, using original file:", err);
      return file;
    }
  };

  const handleImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // allow re-selecting the same file
    if (!files.length) return;

    const pictures = files.filter((f) => f.type.startsWith("image/"));
    if (!pictures.length) {
      toast.error("Please choose image files only.");
      return;
    }
    if (pictures.length > MAX_IMAGES) toast.info(`Only the first ${MAX_IMAGES} photos were kept.`);
    const selected = pictures.slice(0, MAX_IMAGES);

    setCompressing(true);
    try {
      const original = selected.reduce((sum, f) => sum + f.size, 0);
      const optimized = await Promise.all(selected.map(compressImage));
      const compressed = optimized.reduce((sum, f) => sum + f.size, 0);

      clearObjectUrls();
      const urls = optimized.map((f) => URL.createObjectURL(f));
      previewUrlsRef.current = urls;

      setSavedSpace(Math.max(0, Math.round(((original - compressed) / (original || 1)) * 100)));
      setImages(optimized);
      setPreviews(urls);
      setErrors((prev) => ({ ...prev, images: undefined }));
    } catch (err) {
      console.error("Error processing images:", err);
      toast.error("Couldn't process those images. Try different files.");
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index) => {
    const url = previews[index];
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    previewUrlsRef.current = previewUrlsRef.current.filter((u) => u !== url);

    const nextImages = images.filter((_, i) => i !== index);
    setImages(nextImages);
    // If every new photo was removed while editing, fall back to the saved ones
    setPreviews(nextImages.length === 0 ? editingItem?.images || [] : previews.filter((_, i) => i !== index));
  };

  /* ---------- upload / update ---------- */
  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    const price = Number(form.price);
    if (!form.title.trim()) next.title = "Give your item a title.";
    if (!form.category.trim()) next.category = "Choose or type a category.";
    if (!form.condition.trim()) next.condition = "Choose the item's condition.";
    if (!form.price || !Number.isFinite(price) || price <= 0) next.price = "Enter a price greater than 0.";
    if (!form.location.trim()) next.location = "Enter a pickup location.";
    if (!isValidPhone(form.phone)) next.phone = "Enter a valid WhatsApp number, e.g. 08012345678.";
    if (!editingItem && images.length === 0) next.images = "Add at least one photo.";
    return next;
  };

  const handleUpload = async () => {
    if (!auth.currentUser) {
      toast.error("Please log in first.");
      return;
    }

    if (!editingItem && userUploads >= uploadLimit) {
      toast.error(
        isPremium
          ? `Premium upload limit reached (${PREMIUM_LIMIT}/${PREMIUM_LIMIT}).`
          : `Free limit reached (${FREE_LIMIT}/${FREE_LIMIT}). Upgrade to list more.`
      );
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast.error("Check the highlighted fields.");
      return;
    }

    setUploading(true);
    setProgress(0);
    const newlyUploadedAssets = [];
    const replacedAssets = images.length > 0 ? editingItem?.imageAssets || [] : [];

    try {
      let imageUrls = editingItem?.images || [];
      let imageAssets = editingItem?.imageAssets || [];

      if (images.length > 0) {
        imageUrls = [];
        imageAssets = [];

        for (let i = 0; i < images.length; i += 1) {
          const result = await uploadFeatureMedia(images[i], {
            feature: "marketplace",
            resourceType: "image",
            onProgress: (percent) => setProgress(Math.round(((i + percent / 100) / images.length) * 100)),
          });
          imageUrls.push(result.secure_url);
          const asset = toCloudinaryAsset(result);
          imageAssets.push(asset);
          newlyUploadedAssets.push(asset);
        }
      }

      const payload = {
        title: form.title.trim(),
        category: form.category.trim(),
        condition: form.condition.trim(),
        price: Number(form.price),
        location: form.location.trim(),
        availability: form.availability.trim(),
        phone: form.phone.trim(),
        description: form.description.trim(),
        sellerName: sellerName || auth.currentUser?.displayName || "",
        ownerName: sellerName || auth.currentUser?.displayName || "",
        postedBy: sellerName || auth.currentUser?.displayName || "",
        images: imageUrls,
        imageAssets,
        updatedAt: new Date(),
      };

      if (editingItem) {
        await putJson(`/api/marketplace/${editingItem.id}`, payload);
        toast.success("Listing updated.");
      } else {
        await postJson("/api/marketplace", {
          ...payload,
          status: "pending",
          verified: isPremium,
          premiumUser: isPremium,
        });
        toast.success("Listing submitted.");
      }

      resetForm();
      fetchItems();
      fetchUserPlan();
      if (replacedAssets.length > 0) {
        await deleteCloudinaryAssets({ assets: replacedAssets }).catch((cleanupError) => {
          console.warn("Unable to clean up replaced listing images", cleanupError);
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (newlyUploadedAssets.length > 0) {
        await deleteCloudinaryAssets({ assets: newlyUploadedAssets }).catch((cleanupError) => {
          console.warn("Unable to clean up failed listing upload", cleanupError);
        });
      }
      toast.error("Couldn't save your listing. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  /* ---------- edit & delete ---------- */
  const openNewListing = () => {
    if (limitReached) {
      toast.error(
        isPremium
          ? `Premium upload limit reached (${PREMIUM_LIMIT}/${PREMIUM_LIMIT}).`
          : `Free limit reached (${FREE_LIMIT}/${FREE_LIMIT}). Upgrade to list more.`
      );
      return;
    }
    resetForm();
    setShowUpload(true);
  };

  const handleEdit = (item) => {
    clearObjectUrls();
    setEditingItem(item);
    setForm({
      title: item.title || "",
      category: item.category || "",
      condition: item.condition || "",
      price: item.price || "",
      location: item.location || item.pickupLocation || "",
      availability: item.availability || "",
      phone: item.phone || "",
      description: item.description || "",
    });
    setImages([]);
    setErrors({});
    setSavedSpace(0);
    setPreviews(item.images || []);
    setShowUpload(true);
    setActiveMenu(null);
  };

  const requestDelete = (item) => {
    setActiveMenu(null);
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJson(`/api/marketplace/${deleteTarget.id}`);
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      fetchUserPlan();
      toast.success("Listing deleted.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Couldn't delete this listing. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- share & whatsapp ---------- */
  const openWhatsApp = (item) => {
    const message = `Hi, I'm interested in "${item.title}" on UniHelp Marketplace.`;
    window.open(
      `https://wa.me/${toWhatsAppNumber(item.phone)}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareProduct = async (item) => {
    const shareUrl = buildShareUrl(`/studentmarketplace/${encodeURIComponent(item.id)}`);
    try {
      await shareContent({
        title: item.title,
        text: `Check out this product on UniHelp: ${item.title}`,
        url: shareUrl,
      });
      if (!navigator.share) toast.success("Link copied to clipboard.");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Couldn't share this listing right now.");
    }
  };

  /* ---------- render helpers ---------- */
  const cardHandlers = {
    onToggleMenu: (id) => setActiveMenu((current) => (current === id ? null : id)),
    onEdit: handleEdit,
    onDelete: requestDelete,
    onShare: shareProduct,
    onContact: openWhatsApp,
    onDetails: (item) => navigate(`/studentmarketplace/${encodeURIComponent(item.id)}`),
  };

  const renderShelf = (title, subtitle, shelfItems) =>
    shelfItems.length > 0 ? (
      <section key={title} className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className={`text-sm ${theme.muted}`}>{subtitle}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shelfItems.map((item) => (
            <ListingCard key={item.id} item={item} theme={theme} dark={dark} mode="market" {...cardHandlers} />
          ))}
        </div>
      </section>
    ) : null;

  const tabClass = (active) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      active ? "bg-indigo-600 text-white shadow" : `${theme.muted} hover:text-indigo-500`
    }`;

  const gridClass =
    view === "market" && viewMode === "list"
      ? "grid grid-cols-1 gap-4"
      : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className={`min-h-screen w-full px-4 py-6 md:pt-20 ${theme.page}`}>
      <div className="mx-auto max-w-7xl space-y-6 pb-24">
        {/* HEADER */}
        <header className="flex gap-3 max-md:flex-col md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-2xl bg-indigo-600 p-3 text-white">
              <ShoppingBag />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Marketplace</h1>
              <p className={`text-sm ${theme.muted}`}>Buy and sell with students on campus</p>
            </div>
          </div>

          <div className={`${theme.card} w-full rounded-2xl px-4 py-3 md:w-64`}>
            <div className="flex items-center gap-3">
              {isPremium ? (
                <Crown className="shrink-0 text-yellow-500" size={22} />
              ) : (
                <Lock className="shrink-0 text-indigo-500" size={22} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{isPremium ? "Premium" : "Free plan"}</p>
                  <p className={`text-xs ${theme.muted}`}>
                    {userUploads}/{uploadLimit} listings
                  </p>
                </div>
                <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-gray-200"}`}>
                  <div
                    className={`h-full rounded-full transition-all ${limitReached ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
            {!isPremium && (
              <button
                onClick={() => navigate("/premium")}
                className="mt-3 w-full rounded-lg bg-indigo-500/10 py-1.5 text-xs font-medium text-indigo-500 transition hover:bg-indigo-500/20"
              >
                Upgrade for up to {PREMIUM_LIMIT} listings
              </button>
            )}
          </div>
        </header>

        {/* TABS */}
        <div className={`${theme.card} inline-flex rounded-xl p-1`} role="tablist">
          <button role="tab" aria-selected={view === "market"} onClick={() => setView("market")} className={tabClass(view === "market")}>
            Marketplace
          </button>
          <button role="tab" aria-selected={view === "my"} onClick={() => setView("my")} className={tabClass(view === "my")}>
            My products
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        {view === "market" && (
          <>
            <div className={`${theme.card} grid gap-3 rounded-2xl p-3 md:grid-cols-[1fr_220px_160px_auto]`}>
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${theme.field}`}>
                <Search size={16} className={theme.muted} />
                <input
                  type="search"
                  placeholder="Search products"
                  aria-label="Search products"
                  className="w-full bg-transparent text-sm outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                aria-label="Filter by category"
                className={`rounded-xl px-3 py-2.5 text-sm outline-none ${theme.field}`}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Max price (₦)"
                aria-label="Maximum price"
                className={`rounded-xl px-3 py-2.5 text-sm outline-none ${theme.field}`}
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
              />

              <button
                onClick={clearFilters}
                disabled={!hasFilters}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${theme.subtle}`}
              >
                Clear
              </button>
            </div>

            {categories.length > 0 && (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <button
                  onClick={() => setFilterCategory("")}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    !filterCategory ? "bg-indigo-600 text-white" : `${theme.card} hover:border-indigo-400`
                  }`}
                >
                  All items
                </button>
                {categories.map((category) => {
                  const active = filterCategory.toLowerCase() === category.toLowerCase();
                  return (
                    <button
                      key={category}
                      onClick={() => setFilterCategory(active ? "" : category)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                        active ? "bg-indigo-600 text-white" : `${theme.card} hover:border-indigo-400`
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}

            <section className="flex flex-col gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-indigo-600 p-2 text-white">
                  <Megaphone size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">Promoted listings</h2>
                  <p className={`text-sm ${theme.muted}`}>
                    Sponsored items get priority placement so more students see them.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSponsoredOnly(true);
                  document.getElementById("marketplace-listings")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Browse promoted
              </button>
            </section>

            {!hasFilters && !loading && !loadError && (
              <div className="space-y-8">
                {renderShelf("Sponsored", "Promoted listings from the student community", shelves.sponsored)}
                {renderShelf("Fresh on campus", "New items students just posted", shelves.fresh)}
                {renderShelf("Budget finds", `Useful picks priced at ${formatPrice(BUDGET_CEILING)} or less`, shelves.budget)}
                {renderShelf("Verified sellers", "Listings from verified sellers", shelves.verified)}
              </div>
            )}

            <div id="marketplace-listings" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {hasFilters ? "Results" : "All listings"}
                <span className={`ml-2 text-sm font-normal ${theme.muted}`}>
                  {sortedItems.length} {sortedItems.length === 1 ? "listing" : "listings"}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {sponsoredOnly && (
                  <button
                    onClick={() => setSponsoredOnly(false)}
                    className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-600"
                  >
                    Sponsored only ×
                  </button>
                )}
                <label className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${theme.card}`}>
                  <ArrowUpDown size={15} />
                  <select
                    aria-label="Sort listings"
                    className={`bg-transparent outline-none ${dark ? "[&>option]:text-gray-900" : ""}`}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="rating_desc">Top rated</option>
                  </select>
                </label>
                <div className={`flex rounded-xl p-1 ${theme.card}`}>
                  {[
                    ["grid", LayoutGrid, "Grid view"],
                    ["list", List, "List view"],
                  ].map(([mode, Icon, label]) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      aria-label={label}
                      aria-pressed={viewMode === mode}
                      className={`rounded-lg p-2 transition ${viewMode === mode ? "bg-indigo-600 text-white" : theme.muted}`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {view === "my" && (
          <div>
            <h2 className="text-lg font-semibold">My products</h2>
            <p className={`text-sm ${theme.muted}`}>Edit, share or remove the items you've listed.</p>
          </div>
        )}

        {/* LISTINGS */}
        {loading ? (
          <div className={gridClass}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} theme={theme} />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load listings"
            text="Check your connection and try again."
            action={{ label: "Retry", onClick: fetchItems }}
            theme={theme}
          />
        ) : listedItems.length === 0 ? (
          view === "my" ? (
            <EmptyState
              icon={Package}
              title="You haven't listed anything yet"
              text="Add photos, a price and your WhatsApp number to start selling to other students."
              action={{ label: "List an item", onClick: openNewListing }}
              theme={theme}
            />
          ) : hasFilters ? (
            <EmptyState
              icon={Search}
              title="No listings match your filters"
              text="Try a different search, category or price."
              action={{ label: "Clear filters", onClick: clearFilters }}
              theme={theme}
            />
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No listings yet"
              text="Be the first to post something for sale on campus."
              action={{ label: "List an item", onClick: openNewListing }}
              theme={theme}
            />
          )
        ) : (
          <div className={gridClass}>
            {listedItems.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                theme={theme}
                dark={dark}
                mode={view}
                layout={viewMode}
                menuOpen={activeMenu === item.id}
                anchor
                highlighted={highlightedId === item.id}
                {...cardHandlers}
              />
            ))}
          </div>
        )}

        {!loading && !loadError && (hasMore || loadMoreError) ? (
          <div className="flex justify-center">
            <button
              onClick={() => fetchItems({ reset: false })}
              disabled={loadingMore}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${theme.subtle}`}
            >
              {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
              {loadingMore ? "Loading more…" : loadMoreError ? "Couldn't load more. Tap to retry" : "Load more campus finds"}
            </button>
          </div>
        ) : null}

        {/* FLOATING ACTION BUTTON */}
        <button
          onClick={openNewListing}
          className="fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-full bg-indigo-600 p-4 text-white shadow-2xl transition hover:bg-indigo-700 sm:bottom-8 sm:right-8 sm:px-5 sm:py-3"
          aria-label="List an item"
        >
          <Plus size={22} />
          <span className="hidden text-sm font-medium sm:inline">List an item</span>
        </button>

        {/* UPLOAD / EDIT MODAL */}
        {showUpload && (
          <div
            className="fixed inset-0 z-[501] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !uploading) resetForm();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="listing-modal-title"
              className={`${theme.card} flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl ${
                dark ? "!bg-[#111827]" : ""
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-500/10 px-5 py-4 sm:px-6">
                <div>
                  <h2 id="listing-modal-title" className="text-lg font-semibold">
                    {editingItem ? "Edit listing" : "List an item"}
                  </h2>
                  {!editingItem && (
                    <p className={`text-xs ${theme.muted}`}>New listings are submitted for review.</p>
                  )}
                </div>
                <button
                  onClick={resetForm}
                  disabled={uploading}
                  aria-label="Close"
                  className="rounded-lg p-1.5 transition hover:opacity-70 disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                <Field label="Title" required error={errors.title} theme={theme}>
                  <input
                    placeholder="e.g. Mini fridge, barely used"
                    className={`w-full rounded-xl p-3 text-sm outline-none ${theme.field}`}
                    value={form.title}
                    maxLength={100}
                    onChange={(e) => updateForm("title", e.target.value)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category" required error={errors.category} theme={theme}>
                    <select
                      value={form.category}
                      className={`w-full rounded-xl p-3 text-sm outline-none ${theme.field}`}
                      onChange={(e) => updateForm("category", e.target.value)}
                    >
                      <option value="">Select category…</option>
                      {[...new Set([...MARKETPLACE_CATEGORIES, form.category].filter(Boolean))].map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Condition" required error={errors.condition} theme={theme}>
                    <select
                      value={form.condition}
                      className={`w-full rounded-xl p-3 text-sm outline-none ${theme.field}`}
                      onChange={(e) => updateForm("condition", e.target.value)}
                    >
                      <option value="">Select condition…</option>
                      {[...new Set([...CONDITION_OPTIONS, form.condition].filter(Boolean))].map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Price" required error={errors.price} theme={theme}>
                    <div className={`flex items-center rounded-xl ${theme.field}`}>
                      <span className={`pl-3 text-sm ${theme.muted}`}>₦</span>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="0"
                        className="w-full bg-transparent p-3 text-sm outline-none"
                        value={form.price}
                        onChange={(e) => updateForm("price", e.target.value)}
                      />
                    </div>
                  </Field>

                  <Field label="Pickup location" required error={errors.location} theme={theme}>
                    <input
                      placeholder="e.g. Main gate, Faculty of Science"
                      className={`w-full rounded-xl p-3 text-sm outline-none ${theme.field}`}
                      value={form.location}
                      onChange={(e) => updateForm("location", e.target.value)}
                    />
                  </Field>
                </div>

                <Field
                  label="Phone"
                  required
                  error={errors.phone}
                  hint="Shown to interested students so they can reach you."
                  theme={theme}
                >
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="08012345678"
                    className={`w-full rounded-xl p-3 text-sm outline-none ${theme.field}`}
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                  />
                </Field>

                <Field label="Availability" hint="Optional" theme={theme}>
                  <select
                    value={form.availability}
                    className={`w-full rounded-xl p-3 text-sm outline-none ${theme.field}`}
                    onChange={(e) => updateForm("availability", e.target.value)}
                  >
                    <option value="">Select availability…</option>
                    {[...new Set([...AVAILABILITY_OPTIONS, form.availability].filter(Boolean))].map((availability) => (
                      <option key={availability} value={availability}>{availability}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Description" theme={theme}>
                  <textarea
                    rows={4}
                    maxLength={DESCRIPTION_MAX}
                    placeholder="Add details such as size or reason for selling…"
                    className={`w-full resize-none rounded-xl p-3 text-sm outline-none ${theme.field}`}
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                  />
                  <span className={`mt-1 block text-right text-xs ${theme.muted}`}>
                    {form.description.length}/{DESCRIPTION_MAX}
                  </span>
                </Field>

                {/* PHOTOS */}
                <div>
                  <span className="mb-1.5 flex items-center gap-1 text-sm font-medium">
                    Photos {!editingItem && <span className="text-red-500">*</span>}
                  </span>
                  <label
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition hover:border-indigo-500/60 ${
                      errors.images ? "border-red-500/60" : "border-indigo-500/30"
                    }`}
                  >
                    {compressing ? (
                      <>
                        <Loader2 className="mb-2 animate-spin text-indigo-500" size={26} />
                        <p className="text-sm font-medium">Optimizing photos…</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className={`mb-2 ${theme.muted}`} size={26} />
                        <p className="text-sm font-medium">
                          {previews.length ? "Replace photos" : "Add photos"}
                        </p>
                        <span className={`mt-1 text-xs ${theme.muted}`}>
                          Up to {MAX_IMAGES} images · JPG, PNG or WEBP
                        </span>
                      </>
                    )}
                    <input hidden type="file" multiple accept="image/*" onChange={handleImages} disabled={compressing || uploading} />
                  </label>
                  {errors.images && <span className="mt-1 block text-xs text-red-500">{errors.images}</span>}
                  {savedSpace > 0 && images.length > 0 && (
                    <span className={`mt-1 block text-xs ${theme.muted}`}>
                      Photos optimized, about {savedSpace}% smaller for faster loading.
                    </span>
                  )}

                  {previews.length > 0 && (
                    <div className="mt-3 flex gap-3 overflow-x-auto py-1">
                      {previews.map((src, i) => (
                        <div key={`${src}-${i}`} className="relative shrink-0">
                          <img
                            src={src}
                            alt={`Preview ${i + 1}`}
                            className="h-24 w-24 rounded-xl border border-gray-500/20 object-cover"
                          />
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              Cover
                            </span>
                          )}
                          {images.length > 0 && (
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              disabled={uploading}
                              aria-label={`Remove photo ${i + 1}`}
                              className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-1 text-white shadow transition hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-500/10 px-5 py-4 sm:px-6">
                {uploading && (
                  <div>
                    <div className={`h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-gray-200"}`}>
                      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {images.length > 0 ? `Uploading photos… ${progress}%` : "Saving…"}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    disabled={uploading}
                    className={`rounded-xl px-5 py-3 text-sm font-medium transition disabled:opacity-50 ${theme.subtle}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || compressing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Saving…
                      </>
                    ) : editingItem ? (
                      "Save changes"
                    ) : (
                      "Publish listing"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION */}
        {deleteTarget && (
          <div
            className="fixed inset-0 z-[502] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              className={`${theme.card} w-full max-w-sm rounded-3xl p-6 ${dark ? "!bg-[#111827]" : ""}`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <Trash2 size={22} />
              </div>
              <h2 id="delete-title" className="text-lg font-semibold">
                Delete this listing?
              </h2>
              <p className={`mt-1 text-sm ${theme.muted}`}>
                “{deleteTarget.title}” will be removed from the marketplace. This can't be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className={`flex-1 rounded-xl py-3 text-sm font-medium transition disabled:opacity-50 ${theme.subtle}`}>
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="animate-spin" size={16} /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}