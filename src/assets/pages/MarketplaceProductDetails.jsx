import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Tag,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import ImageCarousel from "../components/ImageCarousel";
import { db } from "../../firebase/config";
import { getJson, postJson } from "../../services/api";
import { buildShareUrl, shareContent } from "../utils/share";

/* =====================================================
   HELPERS
===================================================== */
const REVIEW_MAX = 500;
const SELLER_PROFILE_CACHE_TTL = 5 * 60 * 1000;
const sellerProfileCache = new Map();

const getSellerProfile = (sellerId) => {
  const cached = sellerProfileCache.get(sellerId);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = getDoc(doc(db, "users", sellerId))
    .then((snapshot) => (snapshot.exists() ? snapshot.data() : null))
    .catch((error) => {
      sellerProfileCache.delete(sellerId);
      throw error;
    });
  sellerProfileCache.set(sellerId, { promise, expiresAt: Date.now() + SELLER_PROFILE_CACHE_TTL });
  return promise;
};

const toWhatsAppNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "object" && value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "";
};

const formatPrice = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

const getTheme = (dark) => ({
  page: dark ? "bg-[#0b0f1a] text-white" : "bg-[#f6f8fc] text-slate-900",
  card: dark ? "border border-white/10 bg-white/[0.05]" : "border border-slate-200 bg-white shadow-sm",
  panel: dark ? "bg-white/[0.04]" : "bg-slate-50",
  muted: dark ? "text-slate-400" : "text-slate-500",
  divider: dark ? "border-white/10" : "border-slate-200",
  field: dark
    ? "border-white/10 bg-white/5 text-white placeholder:text-white/40"
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
  outlineBtn: dark
    ? "border border-white/15 text-white hover:bg-white/10"
    : "border border-slate-300 text-slate-800 hover:bg-slate-100",
  skeleton: dark ? "bg-white/10" : "bg-slate-200",
});

function StarRating({ value, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${Number(value) || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(Number(value) || 0) ? "fill-amber-400 text-amber-500" : "text-slate-300"}
        />
      ))}
    </span>
  );
}

function DetailsSkeleton({ theme }) {
  return (
    <main className={`min-h-screen px-4 py-6 md:pt-20 ${theme.page}`}>
      <div className="mx-auto max-w-6xl animate-pulse space-y-5">
        <div className={`h-10 w-24 rounded-xl ${theme.skeleton}`} />
        <div className={`grid overflow-hidden rounded-3xl lg:grid-cols-[1.15fr_0.85fr] ${theme.card}`}>
          <div className={`h-72 lg:h-[28rem] ${theme.skeleton}`} />
          <div className="space-y-4 p-7">
            <div className={`h-5 w-24 rounded-full ${theme.skeleton}`} />
            <div className={`h-8 w-3/4 rounded ${theme.skeleton}`} />
            <div className={`h-4 w-full rounded ${theme.skeleton}`} />
            <div className={`h-4 w-5/6 rounded ${theme.skeleton}`} />
            <div className={`h-24 w-full rounded-2xl ${theme.skeleton}`} />
          </div>
        </div>
      </div>
    </main>
  );
}

/* =====================================================
   PAGE
===================================================== */
export default function MarketplaceProductDetails({ dark = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user } = useContext(AuthContext);
  const theme = useMemo(() => getTheme(dark), [dark]);

  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const detailsRequest = useRef(0);

  /* ---------- derived ---------- */
  const sellerId = item?.sellerId || item?.ownerId || item?.userId;
  const isOwner = Boolean(user?.uid && sellerId === user.uid);
  const phone = item?.sellerPhone || item?.contactPhone || item?.phone || "";
  const whatsAppNumber = toWhatsAppNumber(phone);
  const itemTitle = item?.title || item?.name || "Marketplace item";
  const rating = Number(item?.ratingAverage || 0);
  const reviewCount = Number(item?.reviewCount || 0);
  // Never fall back to the seller's email: it would be shown publicly.
  const sellerName =
    item?.sellerName ||
    item?.ownerName ||
    seller?.username ||
    seller?.fullName ||
    seller?.displayName ||
    seller?.name ||
    "UniHelp seller";
  const sellerPhoto = item?.sellerAvatar || item?.sellerPhoto || seller?.photo || seller?.photoURL || "";
  const pickupLocation = item?.location || item?.pickupLocation || item?.address || item?.area || "";
  const dateListed = formatDate(item?.createdAt || item?.postedAt);
  const images = useMemo(() => (Array.isArray(item?.images) ? item.images.filter(Boolean) : []), [item?.images]);
  const showContact = !isOwner && Boolean(sellerId || whatsAppNumber || phone);
  const statusBanner =
    isOwner && item?.status === "pending"
      ? "This listing is pending review. Only you can see it until it's approved."
      : isOwner && item?.status === "rejected"
      ? "This listing was rejected. Edit it from My products and resubmit."
      : "";

  /* ---------- data ---------- */
  // silent = refresh in the background without replacing the page with a loader
  const loadDetails = useCallback(
    async (silent = false) => {
      const requestId = ++detailsRequest.current;
      if (!id) {
        setLoadError("This product link is missing its listing ID.");
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
        setItem(null);
        setSeller(null);
      }
      setLoadError("");
      try {
        const record = await getJson(`/api/marketplace/${encodeURIComponent(id)}`);
        if (requestId !== detailsRequest.current) return;
        setItem(record);
        const ownerId = record.sellerId || record.ownerId || record.userId;
        if (ownerId) {
          try {
            const profile = await getSellerProfile(ownerId);
            if (requestId === detailsRequest.current) setSeller(profile);
          } catch (error) {
            console.warn("Could not load marketplace seller profile:", error);
            if (requestId === detailsRequest.current) setSeller(null);
          }
        } else {
          setSeller(null);
        }
      } catch (error) {
        if (requestId === detailsRequest.current) {
          if (silent) {
            console.error("Could not refresh marketplace listing details:", error);
            toast.error("Your review was saved, but listing details couldn't be refreshed.");
          } else {
            setLoadError(error?.message || "Could not load this listing. Please try again.");
          }
        }
      } finally {
        if (requestId === detailsRequest.current && !silent) setLoading(false);
      }
    },
    [id]
  );

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsError(false);
    try {
      const result = await getJson(`/api/marketplace/${encodeURIComponent(id)}/reviews?page=1&limit=20`);
      setReviews(Array.isArray(result.items) ? result.items : []);
    } catch (error) {
      console.error("Could not load marketplace reviews:", error);
      setReviewsError(true);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    setReviews([]);
    loadReviews();
  }, [loadReviews]);

  /* ---------- actions ---------- */
  const goBack = () => {
    // Opened from a shared link? There's no history to go back to.
    if (routerLocation.key === "default") navigate("/studentmarketplace");
    else navigate(-1);
  };

  const messageSeller = () => {
    if (!sellerId || isOwner) return;
    const message = [
      `Hi, I'm interested in "${itemTitle}". Is it still available?`,
      `Price: ${formatPrice(item.price)}`,
      item.category && `Category: ${item.category}`,
      item.condition && `Condition: ${item.condition}`,
      pickupLocation && `Pickup: ${pickupLocation}`,
      `Listing: ${buildShareUrl(`/studentmarketplace/${id}`)}`,
    ].filter(Boolean).join("\n");
    navigate(`/messages?user=${encodeURIComponent(sellerId)}&message=${encodeURIComponent(message)}`);
  };

  const contactOnWhatsApp = () => {
    if (!whatsAppNumber || isOwner) return;
    const message = `Hi, I'm interested in "${itemTitle}" on UniHelp Marketplace. Is it still available?`;
    window.open(`https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const callSeller = () => {
    const cleanPhone = String(phone).replace(/[^\d+]/g, "");
    if (cleanPhone && !isOwner) window.location.href = `tel:${cleanPhone}`;
  };

  const shareListing = async () => {
    try {
      await shareContent({
        title: itemTitle,
        text: `Check out ${itemTitle} on UniHelp Marketplace.`,
        url: buildShareUrl(`/studentmarketplace/${id}`),
      });
      if (!navigator.share) toast.success("Link copied to clipboard.");
    } catch (error) {
      console.error("Could not share marketplace listing:", error);
      toast.error("Couldn't share this listing right now.");
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) {
      toast.error("Log in to review listings.");
      return;
    }
    if (isOwner) {
      toast.error("You can't review your own listing.");
      return;
    }
    if (!reviewRating) {
      setReviewError("Choose a star rating.");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError("Write a short review.");
      return;
    }

    setReviewError("");
    setReviewSaving(true);
    try {
      const review = await postJson(`/api/marketplace/${encodeURIComponent(id)}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        // Display name only; never publish an email address.
        reviewerName: user.displayName || "UniHelp student",
        reviewerAvatar: user.photoURL || "",
      });
      setReviewRating(0);
      setReviewComment("");
      setReviews((current) => [
        review,
        ...current.filter((entry) => entry.reviewerId !== user.uid),
      ].slice(0, 20));
      await loadDetails(true);
      toast.success("Review submitted.");
    } catch (error) {
      console.error("Could not save marketplace review:", error);
      toast.error(error?.message || "Couldn't save your review. Try again.");
    } finally {
      setReviewSaving(false);
    }
  };

  /* ---------- states ---------- */
  if (loading) return <DetailsSkeleton theme={theme} />;

  if (loadError || !item) {
    return (
      <main className={`min-h-screen px-4 py-24 ${theme.page}`}>
        <div className={`mx-auto max-w-xl rounded-3xl p-8 text-center ${theme.card}`}>
          <h1 className="text-xl font-bold">We couldn't open this listing</h1>
          <p className={`mt-2 text-sm ${theme.muted}`}>{loadError || "This listing may have been removed."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate("/studentmarketplace")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${theme.outlineBtn}`}
            >
              Back to marketplace
            </button>
            <button
              onClick={() => loadDetails()}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- page ---------- */
  return (
    <main className={`min-h-screen px-4 py-6 md:pt-20 ${theme.page}`}>
      <div className={`mx-auto max-w-6xl space-y-5 ${showContact ? "pb-32 lg:pb-24" : "pb-24"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={goBack}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:border-indigo-400 ${theme.card}`}
          >
            <ArrowLeft size={17} /> Back
          </button>
          <button
            onClick={shareListing}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:border-indigo-400 ${theme.card}`}
          >
            <Share2 size={16} /> Share
          </button>
        </div>

        {statusBanner && (
          <div
            className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
              item.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600"
            }`}
          >
            <Clock3 size={16} className="mt-0.5 shrink-0" />
            {statusBanner}
          </div>
        )}

        <div className={`grid overflow-hidden rounded-3xl lg:grid-cols-[1.15fr_0.85fr] ${theme.card}`}>
          <div className={`relative min-h-64 flex ${dark ? "bg-slate-900" : "bg-slate-100"}`}>
            {images.length ? (
              <ImageCarousel images={images} title={itemTitle} dark={dark}/>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 lg:h-full">
                <Eye size={34} className={theme.muted} />
                <span className={`text-sm ${theme.muted}`}>No photos added</span>
              </div>
            )}
            <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
              {item.isSponsored ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow">
                  <Megaphone size={13} /> Sponsored
                </span>
              ) : null}
              {item.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow">
                  <BadgeCheck size={14} /> Verified
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col p-5 sm:p-7">
            {item.category ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-500">
                <Tag size={12} /> {item.category}
              </span>
            ) : null}
            <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{itemTitle}</h1>
            <p className="mt-2 text-3xl font-bold text-indigo-500">{formatPrice(item.price)}</p>

            <div className={`mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm ${theme.muted}`}>
              {item.condition ? (
                <span>
                  Condition: <strong className="font-semibold">{item.condition}</strong>
                </span>
              ) : null}
              {dateListed ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> Listed {dateListed}
                </span>
              ) : null}
              {reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star size={14} className="fill-amber-400 text-amber-500" />
                  {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              ) : null}
            </div>

            {pickupLocation ? (
              <p className={`mt-4 flex items-center gap-2 text-sm ${theme.muted}`}>
                <MapPin size={16} className="shrink-0 text-indigo-500" /> Pickup: {pickupLocation}
              </p>
            ) : null}
            {item.availability ? (
              <p className={`mt-2 flex items-center gap-2 text-sm ${theme.muted}`}>
                <Clock3 size={16} className="shrink-0 text-indigo-500" /> Availability: {item.availability}
              </p>
            ) : null}

            <div className={`mt-6 border-t pt-5 ${theme.divider}`}>
              <h2 className="text-base font-semibold">About this item</h2>
              <p className={`mt-2 max-w-prose whitespace-pre-wrap text-sm leading-7 ${theme.muted}`}>
                {item.description?.trim() || "The seller hasn't added a description for this item yet."}
              </p>
            </div>

            <div className={`mt-6 rounded-2xl p-4 ${theme.panel}`}>
              <div className="flex items-center gap-3">
                {sellerPhoto ? (
                  <img src={sellerPhoto} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <UserRound size={21} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs ${theme.muted}`}>Sold by{isOwner ? " (you)" : ""}</p>
                  <p className="truncate font-semibold">{sellerName}</p>
                  {item.sellerRatingAverage ? (
                    <p className={`mt-0.5 inline-flex items-center gap-1 text-xs ${theme.muted}`}>
                      <Star size={12} className="fill-amber-400 text-amber-500" />
                      {Number(item.sellerRatingAverage).toFixed(1)} seller rating ({item.sellerReviewCount || 0})
                    </p>
                  ) : null}
                </div>
              </div>

              {showContact && (
                <div className="mt-4 hidden gap-2 lg:grid lg:grid-cols-3">
                  {sellerId ? (
                    <button
                      onClick={messageSeller}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      <MessageCircle size={16} /> Message
                    </button>
                  ) : null}
                  {whatsAppNumber ? (
                    <button
                      onClick={contactOnWhatsApp}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
                    >
                      <Phone size={16} /> WhatsApp
                    </button>
                  ) : null}
                  {phone ? (
                    <button
                      onClick={callSeller}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition ${theme.outlineBtn}`}
                    >
                      <Phone size={16} /> Call
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {!isOwner ? (
              <div
                className={`mt-4 flex gap-2 rounded-xl p-3 text-xs leading-5 ${
                  dark ? "bg-emerald-500/10 text-emerald-200" : "bg-emerald-50 text-emerald-800"
                }`}
              >
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                Meet in a public campus spot and check the item before you pay. Never pay in advance.
              </div>
            ) : null}
          </div>
        </div>

        {/* REVIEWS */}
        <section className={`rounded-3xl p-5 sm:p-7 ${theme.card}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Reviews</h2>
              <p className={`mt-1 text-sm ${theme.muted}`}>
                {reviewCount
                  ? `${rating.toFixed(1)} average from ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`
                  : "No reviews yet"}
              </p>
            </div>
            {reviewCount > 0 ? <StarRating value={rating} /> : null}
          </div>

          {user && !isOwner ? (
            <form onSubmit={submitReview} className={`mb-6 rounded-2xl p-4 ${theme.panel}`} noValidate>
              <label htmlFor="review-comment" className="block text-sm font-semibold">
                Share your experience
              </label>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={reviewRating === star}
                    onClick={() => {
                      setReviewRating(star);
                      setReviewError("");
                    }}
                    aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                    className="rounded p-0.5 transition hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={star <= reviewRating ? "fill-amber-400 text-amber-500" : theme.muted}
                    />
                  </button>
                ))}
              </div>
              <textarea
                id="review-comment"
                value={reviewComment}
                onChange={(event) => {
                  setReviewComment(event.target.value.slice(0, REVIEW_MAX));
                  setReviewError("");
                }}
                rows={3}
                maxLength={REVIEW_MAX}
                placeholder="How was the item and the seller?"
                className={`mt-3 w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-indigo-500 ${theme.field}`}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span className={`text-xs ${reviewError ? "text-red-500" : theme.muted}`}>
                  {reviewError || `${reviewComment.length}/${REVIEW_MAX}`}
                </span>
                <button
                  type="submit"
                  disabled={reviewSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {reviewSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {reviewSaving ? "Submitting…" : "Submit review"}
                </button>
              </div>
            </form>
          ) : !user ? (
            <p className={`mb-6 rounded-xl px-4 py-3 text-sm ${theme.panel} ${theme.muted}`}>
              Log in to leave a review.
            </p>
          ) : null}

          {reviewsError ? (
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${theme.panel}`}>
              <span className={theme.muted}>Reviews couldn't be loaded.</span>
              <button onClick={loadReviews} className="font-medium text-indigo-500 hover:underline">
                Retry
              </button>
            </div>
          ) : reviews.length ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article key={review.id} className={`rounded-2xl border p-4 ${theme.divider}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{review.reviewerName || "UniHelp student"}</p>
                    <span className={`text-xs ${theme.muted}`}>{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="mt-1">
                    <StarRating value={review.rating} size={14} />
                  </div>
                  <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${theme.muted}`}>{review.comment}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${theme.muted}`}>
              Bought from or contacted this seller? Be the first to share how it went.
            </p>
          )}
        </section>
      </div>

      {/* MOBILE CONTACT BAR */}
      {showContact && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur-xl lg:hidden ${
            dark ? "border-white/10 bg-[#0b0f1a]/90" : "border-slate-200 bg-white/90"
          }`}
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none text-indigo-500">{formatPrice(item.price)}</p>
              <p className={`mt-1 truncate text-xs ${theme.muted}`}>{itemTitle}</p>
            </div>
            <div className="ml-auto flex gap-2">
              {sellerId ? (
                <button
                  onClick={messageSeller}
                  aria-label="Message seller"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white"
                >
                  <MessageCircle size={16} /> Message
                </button>
              ) : null}
              {whatsAppNumber ? (
                <button
                  onClick={contactOnWhatsApp}
                  aria-label="Contact on WhatsApp"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white"
                >
                  <Phone size={16} /> WhatsApp
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}