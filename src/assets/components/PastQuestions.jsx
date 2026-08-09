import { useEffect, useState, useCallback } from "react";
import { db, auth } from "../../firebase/config";
import { toast } from "react-toastify";
import {
  collection, getDocs, query,
  doc, setDoc, deleteDoc, getDoc,
} from "firebase/firestore";
import {
  FileText, Download, BookOpen, School,
  Calendar, Search,
  Star, Crown, Lock, Eye,
  Share2, SlidersHorizontal,
} from "lucide-react";
import {
  getCloudinaryAttachmentUrl,
  getCloudinaryPreviewUrl,
  isPreviewImageUrl,
} from "../../services/cloudinary";
import ViewerModal from "./ViewerModal";
import { buildShareUrl, shareContent } from "../utils/share";

const PDFThumbnail = ({ url, dark }) => {
  const previewUrl = getCloudinaryPreviewUrl(url);
  const [failed, setFailed] = useState(false);
  const useFramePreview = previewUrl && !isPreviewImageUrl(previewUrl);

  useEffect(() => {
    setFailed(false);
  }, [previewUrl]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden mb-3 ${
        dark ? "bg-slate-950" : "bg-indigo-50"
      }`}
      style={{ height: 160 }}
    >
      {previewUrl && !failed ? (
        useFramePreview ? (
          <div className="absolute inset-0 h-full w-full border-0 select-none pointer-events-none" onContextMenu={(e) => e.preventDefault()}>
            <iframe
              src={previewUrl}
              title="PDF thumbnail"
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
              style={{ pointerEvents: "none" }}
            />
          </div>
        ) : (
          <img
            src={previewUrl}
            alt="PDF thumbnail"
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            draggable="false"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none"
            }}
          />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-25">
          <FileText size={40} />
          <span className="text-xs font-semibold tracking-wide uppercase">
            PDF
          </span>
        </div>
      )}

      <span className="absolute top-2 right-2 rounded-full bg-indigo-600/90 px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] text-white">
        PDF
      </span>
    </div>
  );
};

const SkeletonCard = ({ dark }) => (
  <div className={`p-5 rounded-[28px] border ${dark ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200 shadow-sm"}`}>
    <div className={`w-full h-40 rounded-2xl animate-pulse mb-3 ${dark ? "bg-white/5" : "bg-slate-100"}`} />
    <div className={`h-5 rounded animate-pulse mb-2 ${dark ? "bg-white/5" : "bg-slate-100"}`} />
    <div className={`h-4 w-3/5 rounded animate-pulse mb-4 ${dark ? "bg-white/5" : "bg-slate-100"}`} />
    {[1, 2].map((i) => (
      <div key={i} className={`h-12 rounded-xl animate-pulse mb-2 ${dark ? "bg-white/5" : "bg-slate-100"}`} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const Questions = ({ dark }) => {
  const [questions, setQuestions]   = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [bookmarks, setBookmarks]   = useState({});
  const [isPremium, setIsPremium]   = useState(false);
  const [viewer, setViewer]         = useState(null); // { file, question } | null

  // ── Fetch ────────────────────────────────────────────────
  const fetchQuestions = async () => {
    try {
      const snap = await getDocs(query(collection(db, "questions")));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setQuestions(data);
      setFiltered(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBookmarks = async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDocs(
        collection(db, "users", auth.currentUser.uid, "bookmarks")
      );
      const map = {};
      snap.forEach((d) => (map[d.id] = true));
      setBookmarks(map);
    } catch (err) { console.error(err); }
  };

  const fetchPremiumStatus = async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) setIsPremium(snap.data()?.premium === true);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchQuestions();
    fetchBookmarks();
    fetchPremiumStatus();
  }, []);

  // ── Search + Filter ──────────────────────────────────────
  useEffect(() => {
    let data = [...questions];
    if (search)
      data = data.filter((q) =>
        `${q.title} ${q.courseCode} ${q.school}`
          .toLowerCase().includes(search.toLowerCase())
      );
    if (courseFilter) data = data.filter((q) => q.courseCode === courseFilter);
    if (schoolFilter) data = data.filter((q) => q.school === schoolFilter);
    setFiltered(data);
  }, [search, courseFilter, schoolFilter, questions]);

  // ── Bookmark ─────────────────────────────────────────────
  const toggleBookmark = async (item) => {
    if (!auth.currentUser) {
      toast.error("Please login to bookmark this item.");
      return;
    }
    try {
      const ref = doc(db, "users", auth.currentUser.uid, "bookmarks", item.id);
      if (bookmarks[item.id]) {
        await deleteDoc(ref);
        setBookmarks((prev) => { const u = { ...prev }; delete u[item.id]; return u; });
      } else {
        await setDoc(ref, item);
        setBookmarks((prev) => ({ ...prev, [item.id]: true }));
      }
    } catch (err) { console.error(err); }
  };

  // ── Download (premium gate) ──────────────────────────────
  const downloadFile = useCallback((url, fileName) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, []);

  const handleDownload = useCallback((file) => {
    if (!auth.currentUser) {
      toast.error("Please login to access premium downloads.");
      return;
    }
    if (!isPremium) {
      toast.error("PDF downloads are only available for premium users.");
      return;
    }

    const downloadUrl = getCloudinaryAttachmentUrl(
      file?.url,
      file?.name || file?.original_filename || "document.pdf"
    ) || file?.url;
    const fileName = file?.name || file?.original_filename || "document.pdf";

    if (!downloadUrl) {
      toast.error("Unable to generate download link. Please try again later.");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);
  }, [isPremium]);

  const handleShare = useCallback(async (file, question) => {
    const shareUrl = buildShareUrl("/resources", {
      question: question?.id,
      file: file?.name,
    });

    try {
      await shareContent({
        title: question?.title || file?.name || "Past Question",
        text: `Check out this past question on UniHelp: ${question?.title || file?.name || "Past Question"}`,
        url: shareUrl,
      });

      if (!navigator.share) {
        toast.success("Past question link copied to clipboard.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to share this past question right now.");
    }
  }, []);

  const openViewer  = (file, question) => setViewer({ file, question });
  const closeViewer = useCallback(() => setViewer(null), []);

  // ── Derived options ──────────────────────────────────────
  const courses = [...new Set(questions.map((q) => q.courseCode))];
  const schools = [...new Set(questions.map((q) => q.school))];
  const activeFilterCount = [search, courseFilter, schoolFilter].filter(Boolean).length;

  // ── Style tokens (shared with the rest of the Resources suite) ──
  const pageBg    = dark ? "bg-[#050816] text-white" : "bg-[#f5f7ff] text-slate-900";
  const card      = dark ? "bg-white/[0.04] border border-white/10 backdrop-blur-xl" : "bg-white border border-slate-200 shadow-sm";
  const softCard  = dark ? "bg-white/[0.03]" : "bg-slate-50";
  const fileBg    = dark ? "bg-white/[0.03]" : "bg-slate-50";
  const selectCls = `rounded-2xl px-4 py-3 text-sm font-medium outline-none cursor-pointer transition-colors ${
    dark ? "bg-slate-950 border border-white/10 focus:border-indigo-500" : "bg-slate-100 border border-slate-200 focus:border-indigo-500"
  }`;

  // ─────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen md:mt-20 px-4 py-6 ${pageBg}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── SEARCH + FILTER + PREMIUM STATUS ── */}
        <div className={`${card} rounded-[28px] p-3`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className={`flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 ${softCard}`}>
              <Search size={18} className="text-indigo-400 flex-shrink-0" />
              <input
                placeholder="Search by title, course, school…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none bg-transparent font-medium text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="hidden md:block opacity-40 mx-1" />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">All courses</option>
                {courses.map((c, i) => <option key={i}>{c}</option>)}
              </select>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">All schools</option>
                {schools.map((s, i) => <option key={i}>{s}</option>)}
              </select>

              <div
                className={`hidden sm:flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  isPremium
                    ? "bg-amber-500 text-black"
                    : dark ? "bg-white/5" : "bg-slate-100"
                }`}
              >
                <Crown size={15} />
                {isPremium ? "Premium" : "Free"}
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 px-1 pt-3 text-xs opacity-60">
              <span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
              <button
                onClick={() => { setSearch(""); setCourseFilter(""); setSchoolFilter(""); }}
                className="font-semibold text-indigo-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* ── PREMIUM NOTICE ── */}
        {!isPremium && (
          <div
            className={`rounded-2xl p-4 flex items-start gap-3 border ${
              dark ? "bg-amber-500/[0.06] border-amber-500/20" : "bg-amber-50 border-amber-200"
            }`}
          >
            <Lock className="text-amber-500 shrink-0 mt-0.5" size={17} />
            <div>
              <h3 className="font-semibold text-sm">Premium download required</h3>
              <p className="text-sm opacity-60 mt-0.5">
                Free users can browse and <strong>view</strong> questions in-app,
                but cannot download PDFs. Upgrade to unlock downloads.
              </p>
            </div>
          </div>
        )}

        {/* ── SKELETON GRID ── */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} dark={dark} />)}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && filtered.length === 0 && (
          <div className={`${card} rounded-[28px] p-12 text-center`}>
            <FileText size={44} className="mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-bold">No matching results</h2>
            <p className="mt-2 text-sm opacity-60">
              Try a different search term or clear your filters.
            </p>
          </div>
        )}

        {/* ── QUESTION CARDS ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((q) => (
              <div key={q.id} className={`${card} p-5 rounded-[28px] flex flex-col`}>
                {/* PDF thumbnail — first file only */}
                {q.files?.[0]?.url && (
                  <PDFThumbnail url={q.files[0].url} dark={dark} />
                )}

                {/* Title + bookmark */}
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="font-bold text-base text-indigo-500 leading-snug flex-1">
                    {q.title}
                  </h2>
                  <button
                    onClick={() => toggleBookmark(q)}
                    aria-label={bookmarks[q.id] ? "Remove bookmark" : "Bookmark"}
                    className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      size={19}
                      className={
                        bookmarks[q.id]
                          ? "text-amber-400 fill-amber-400"
                          : "opacity-30"
                      }
                    />
                  </button>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-55 mb-4">
                  <span className="flex items-center gap-1.5"><School size={12} />{q.school}</span>
                  <span className="flex items-center gap-1.5"><BookOpen size={12} />{q.courseCode}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12} />{q.year}</span>
                </div>

                {/* File list */}
                <div className="space-y-2 mt-auto">
                  {q.files?.map((file, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center gap-2 p-3 rounded-xl ${fileBg}`}
                    >
                      {/* View — everyone */}
                      <button
                        onClick={() => openViewer(file, q)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25"
                        title="View document"
                      >
                        <Eye size={13} /> View
                      </button>

                      <button
                        onClick={() => handleShare(file, q)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                        title="Share question"
                      >
                        <Share2 size={13} /> Share
                      </button>

                      {/* Download — premium only */}
                      <button
                        onClick={() => handleDownload(file)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                          isPremium
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : dark
                              ? "bg-white/5 text-slate-500"
                              : "bg-slate-200 text-slate-400"
                        }`}
                        title={isPremium ? "Download PDF" : "Upgrade to download"}
                      >
                        {!isPremium && <Lock size={10} className="text-amber-500" />}
                        <Download size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DOCUMENT VIEWER MODAL ── */}
      {viewer && (
        <ViewerModal
          file={viewer.file}
          question={viewer.question}
          onClose={closeViewer}
          dark={dark}
          isPremium={isPremium}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default Questions;