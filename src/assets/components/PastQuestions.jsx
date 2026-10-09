import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { toast } from "react-toastify";
import {
  collection, getDocs,
  doc, setDoc, deleteDoc, getDoc,
} from "firebase/firestore";
import {
  FileText, Download, BookOpen, School,
  Calendar, Search, Star, Crown, Lock,
  RefreshCw, X, ArrowDownWideNarrow,
} from "lucide-react";
import {
  getCloudinaryAttachmentUrl,
  getCloudinaryPreviewUrl,
  isPreviewImageUrl,
} from "../../services/cloudinary";
import ViewerModal from "./ViewerModal";
import { getJson } from "../../services/api";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const getTitle = (q) => q.title || q.courseTitle || q.courseCode || "Past question";

const dateValue = (item) =>
  item.createdAt?.toDate?.()?.getTime?.() || new Date(item.createdAt || 0).getTime() || 0;

// ─────────────────────────────────────────────────────────────
// PDF THUMBNAIL
// ─────────────────────────────────────────────────────────────
const PDFThumbnail = ({ url, dark, year }) => {
  const previewUrl = getCloudinaryPreviewUrl(url);
  const [failed, setFailed] = useState(false);
  const useFramePreview = previewUrl && !isPreviewImageUrl(previewUrl);

  useEffect(() => {
    setFailed(false);
  }, [previewUrl]);

  return (
    <div
      className={`relative h-44 w-full overflow-hidden rounded-2xl ${
        dark ? "bg-slate-950" : "bg-indigo-50"
      }`}
    >
      {previewUrl && !failed ? (
        useFramePreview ? (
          <div
            className="pointer-events-none absolute inset-0 select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
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
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            draggable="false"
            style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
          />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-30">
          <FileText size={40} />
          <span className="text-xs font-semibold">Preview unavailable</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
        PDF
      </span>
      {year ? (
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Calendar size={11} /> {year}
        </span>
      ) : null}
    </div>
  );
};

const SkeletonCard = ({ dark }) => {
  const bar = dark ? "bg-white/5" : "bg-slate-100";
  return (
    <div
      aria-hidden="true"
      className={`rounded-3xl p-4 ${
        dark ? "border border-white/10 bg-white/[0.04]" : "border border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className={`h-44 w-full rounded-2xl motion-safe:animate-pulse ${bar}`} />
      <div className={`mt-4 h-5 w-4/5 rounded motion-safe:animate-pulse ${bar}`} />
      <div className={`mt-2 h-4 w-3/5 rounded motion-safe:animate-pulse ${bar}`} />
      <div className={`mt-5 h-12 rounded-xl motion-safe:animate-pulse ${bar}`} />
    </div>
  );
};

const MetaChip = ({ icon: Icon, children, dark }) =>
  children ? (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        dark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"
      }`}
    >
      <Icon size={12} className="flex-none" />
      <span className="truncate">{children}</span>
    </span>
  ) : null;

const questionContentText = (blocks = []) => {
  if (!Array.isArray(blocks)) return "";
  const lines = [];
  const visit = (block) => {
    if (!block || typeof block !== "object") return;
    const value = block.text || block.value || block.title || block.label;
    if (value) lines.push(String(value));
    if (Array.isArray(block.items)) {
      block.items.forEach((item) => {
        const itemText = typeof item === "string" ? item : item?.text || item?.value;
        if (itemText) lines.push(String(itemText));
      });
    }
    if (Array.isArray(block.rows)) {
      block.rows.flat().forEach((cell) => {
        if (cell) lines.push(String(cell));
      });
    }
    if (Array.isArray(block.subQuestions)) block.subQuestions.forEach(visit);
    if (Array.isArray(block.blocks)) block.blocks.forEach(visit);
  };
  blocks.forEach(visit);
  return lines.join("\n\n");
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const Questions = ({ dark }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState({});
  const [busyBookmarks, setBusyBookmarks] = useState(() => new Set());
  const [isPremium, setIsPremium] = useState(false);
  const [viewer, setViewer] = useState(null); // { file, question } | null
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // ── Auth (currentUser is null until Firebase finishes restoring the session) ──
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // ── Fetch questions ──────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await getJson("/api/past-questions?limit=100");
      const data = (Array.isArray(response?.items) ? response.items : []).map((item) => {
        const sourceFiles = Array.isArray(item.files)
          ? item.files
          : Array.isArray(item.assets) ? item.assets : [];
        const files = sourceFiles.map((file) => {
          if (typeof file === "string") return { url: file, name: item.title || "Past question PDF" };
          return {
            ...file,
            url: file.url || file.secureUrl || file.secure_url || file.fileUrl || file.downloadUrl,
            name: file.name || file.fileName || file.filename,
          };
        });
        if (files.length === 0) {
          const fileUrl = item.fileUrl || item.downloadUrl || item.documentUrl;
          if (fileUrl) files.push({ url: fileUrl, name: item.fileName || item.title || "Past question PDF" });
        }
        return {
          ...item,
          courseCode: item.courseCode || item.course || item.subject || "",
          school: item.school || item.institution || "",
          year: item.year || item.examSession || "",
          files: files.filter((file) => file?.url),
        };
      });
      setQuestions(data);
    } catch (err) {
      console.error("Failed to load past questions:", err);
      setLoadError(err.message || "Unable to load past questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // ── Per-user data: bookmarks + premium ───────────────────
  useEffect(() => {
    if (!user) {
      setBookmarks({});
      setIsPremium(false);
      return undefined;
    }
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "bookmarks"));
        if (cancelled) return;
        const map = {};
        snap.forEach((d) => { map[d.id] = true; });
        setBookmarks(map);
      } catch (err) {
        console.error("Failed to load bookmarks:", err);
        if (!cancelled) toast.error("Unable to load your saved items.");
      }
    })();

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!cancelled) setIsPremium(snap.exists() && snap.data()?.premium === true);
      } catch (err) {
        console.error("Failed to load premium status:", err);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ── Search + filter + sort ───────────────────────────────
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return questions
      .filter((q) => {
        if (courseFilter && q.courseCode !== courseFilter) return false;
        if (schoolFilter && q.school !== schoolFilter) return false;
        if (savedOnly && !bookmarks[q.id]) return false;
        if (!needle) return true;
        return `${getTitle(q)} ${q.courseCode} ${q.school} ${q.year}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        if (sort === "title_asc") return getTitle(a).localeCompare(getTitle(b));
        if (sort === "title_desc") return getTitle(b).localeCompare(getTitle(a));
        return dateValue(b) - dateValue(a);
      });
  }, [questions, search, courseFilter, schoolFilter, savedOnly, sort, bookmarks]);

  // ── Bookmark ─────────────────────────────────────────────
  const toggleBookmark = async (item) => {
    if (!user) {
      toast.error("Please log in to save past questions.");
      return;
    }
    if (busyBookmarks.has(item.id)) return;
    setBusyBookmarks((prev) => new Set(prev).add(item.id));
    try {
      const ref = doc(db, "users", user.uid, "bookmarks", item.id);
      if (bookmarks[item.id]) {
        await deleteDoc(ref);
        setBookmarks((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
      } else {
        await setDoc(ref, item);
        setBookmarks((prev) => ({ ...prev, [item.id]: true }));
      }
    } catch (err) {
      console.error("Failed to update bookmark:", err);
      toast.error("Unable to update bookmark. Please try again.");
    } finally {
      setBusyBookmarks((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // ── Download (premium gate) ──────────────────────────────
  const handleDownload = useCallback((file) => {
    if (!auth.currentUser) {
      toast.error("Please log in to access premium downloads.");
      return;
    }
    if (!isPremium) {
      toast.error("PDF downloads are only available for premium users.");
      return;
    }

    const fileName = file?.name || file?.original_filename || "document.pdf";
    const downloadUrl = getCloudinaryAttachmentUrl(file?.url, fileName) || file?.url;

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

  const openViewer = (file, question) => setViewer({ file, question });
  const closeViewer = useCallback(() => setViewer(null), []);

  // ── Derived ──────────────────────────────────────────────
  const courses = useMemo(
    () => [...new Set(questions.map((q) => q.courseCode).filter(Boolean))].sort(),
    [questions]
  );
  const schools = useMemo(
    () => [...new Set(questions.map((q) => q.school).filter(Boolean))].sort(),
    [questions]
  );
  const filtersActive = Boolean(search.trim() || courseFilter || schoolFilter || savedOnly);
  const clearFilters = () => {
    setSearch("");
    setCourseFilter("");
    setSchoolFilter("");
    setSavedOnly(false);
  };

  // ── Style tokens ─────────────────────────────────────────
  const pageBg = dark ? "bg-[#050816] text-white" : "bg-[#f5f7ff] text-slate-900";
  const card = dark
    ? "border border-white/10 bg-white/[0.04] backdrop-blur-xl"
    : "border border-slate-200 bg-white shadow-sm";
  const field = dark
    ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const ghost = dark
    ? "bg-white/5 text-slate-200 hover:bg-white/10"
    : "bg-slate-100 text-slate-700 hover:bg-slate-200";
  const selectCls = `w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors focus:border-indigo-500 ${field} ${focusRing}`;
  const colorScheme = { colorScheme: dark ? "dark" : "light" };

  // ─────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen px-4 py-6 sm:py-8 ${pageBg}`}>
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ── HEADER ── */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Past questions</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              {loading
                ? "Loading past questions…"
                : `${questions.length} paper${questions.length === 1 ? "" : "s"} from ${schools.length || "your"} school${schools.length === 1 ? "" : "s"}. View any paper in the app.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                isPremium ? "bg-amber-500 text-black" : ghost
              }`}
            >
              <Crown size={14} /> {isPremium ? "Premium" : "Free plan"}
            </span>
            <button
              type="button"
              onClick={fetchQuestions}
              disabled={loading}
              aria-label="Refresh past questions"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${ghost} ${focusRing}`}
            >
              <RefreshCw size={14} className={loading ? "motion-safe:animate-spin" : ""} /> Refresh
            </button>
          </div>
        </header>

        {/* ── TOOLBAR ── */}
        <section aria-label="Search and filters" className={`rounded-3xl p-3 sm:p-4 ${card}`}>
          <label className={`flex items-center gap-3 rounded-2xl border px-4 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 ${field}`}>
            <Search size={18} className="flex-none text-indigo-400" />
            <input
              type="search"
              placeholder="Search by title, course, school or year"
              aria-label="Search past questions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="rounded-full p-1 opacity-60 hover:opacity-100">
                <X size={16} />
              </button>
            )}
          </label>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <select aria-label="Filter by course" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectCls} style={colorScheme}>
              <option value="">All courses</option>
              {courses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select aria-label="Filter by school" value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className={selectCls} style={colorScheme}>
              <option value="">All schools</option>
              {schools.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="relative block">
              <ArrowDownWideNarrow size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
              <select aria-label="Sort past questions" value={sort} onChange={(e) => setSort(e.target.value)} className={`${selectCls} appearance-none pr-9`} style={colorScheme}>
                <option value="newest">Newest first</option>
                <option value="title_asc">Title A to Z</option>
                <option value="title_desc">Title Z to A</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              aria-pressed={savedOnly}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${focusRing} ${
                savedOnly ? "bg-amber-500 text-black" : ghost
              }`}
            >
              <Star size={15} className={savedOnly ? "fill-black" : ""} /> Saved
            </button>
          </div>

          {(filtersActive || sort !== "newest") && !loading && (
            <div className={`mt-3 flex items-center gap-3 px-1 text-xs ${muted}`}>
              <span role="status">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => { clearFilters(); setSort("newest"); }}
                className="font-bold text-indigo-500 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </section>

        {/* ── PREMIUM NOTICE ── */}
        {!isPremium && !loading && (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              dark ? "border-amber-500/20 bg-amber-500/[0.07]" : "border-amber-200 bg-amber-50"
            }`}
          >
            <Lock className="mt-0.5 flex-none text-amber-500" size={18} />
            <div>
              <h2 className="text-sm font-bold">Downloads are a premium feature</h2>
              <p className={`mt-0.5 text-sm ${muted}`}>
                You can view every paper in the app for free. Upgrade to save PDFs to your device.
              </p>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading past questions">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} dark={dark} />)}
          </div>
        )}

        {/* ── ERROR ── */}
        {!loading && loadError && (
          <div role="alert" className={`rounded-3xl p-10 text-center ${card}`}>
            <p className="font-bold">We couldn't load past questions</p>
            <p className={`mt-1 text-sm ${muted}`}>{loadError}</p>
            <button
              type="button"
              onClick={fetchQuestions}
              className={`mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 ${focusRing}`}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && !loadError && filtered.length === 0 && (
          <div className={`rounded-3xl p-12 text-center ${card}`}>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600"}`}>
              {savedOnly ? <Star size={26} /> : <FileText size={26} />}
            </div>
            <h2 className="mt-4 text-lg font-bold">
              {questions.length === 0
                ? "No past questions yet"
                : savedOnly && !search && !courseFilter && !schoolFilter
                  ? "You haven't saved any papers"
                  : "No matching results"}
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              {questions.length === 0
                ? "Check back soon. New papers are added regularly."
                : savedOnly && !search && !courseFilter && !schoolFilter
                  ? "Tap the star on a paper to keep it here."
                  : "Try a different search term or clear your filters."}
            </p>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-indigo-500 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── CARDS ── */}
        {!loading && !loadError && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((q) => {
              const saved = Boolean(bookmarks[q.id]);
              return (
                <article
                  key={q.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${getTitle(q)}`}
                  onClick={() => setSelectedQuestion(q)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedQuestion(q);
                    }
                  }}
                  className={`group flex cursor-pointer flex-col gap-4 rounded-3xl p-4 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${card}`}
                >
                  {q.files?.[0]?.url && <PDFThumbnail url={q.files[0].url} dark={dark} year={q.year} />}

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="flex-1 text-base font-bold leading-snug text-indigo-500">
                        {getTitle(q)}
                      </h2>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleBookmark(q);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        disabled={busyBookmarks.has(q.id)}
                        aria-pressed={saved}
                        aria-label={saved ? "Remove from saved" : "Save for later"}
                        className={`flex-none rounded-full p-1.5 transition hover:scale-110 disabled:opacity-50 ${focusRing}`}
                      >
                        <Star size={20} className={saved ? "fill-amber-400 text-amber-400" : "opacity-40"} />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <MetaChip icon={BookOpen} dark={dark}>{q.courseCode}</MetaChip>
                      <MetaChip icon={School} dark={dark}>{q.school}</MetaChip>
                      {!q.files?.[0]?.url && <MetaChip icon={Calendar} dark={dark}>{q.year}</MetaChip>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-current/10 pt-3 text-xs font-bold text-indigo-500">
                    <span className="inline-flex items-center gap-1.5">
                      {q.files?.length > 0 && <FileText size={14} />}
                      {q.files?.length ? `${q.files.length} document${q.files.length === 1 ? "" : "s"}` : "Past question"}
                    </span>
                    <span className="transition-transform group-hover:translate-x-1">View details →</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedQuestion && (
        <div
          className="fixed inset-0 z-[503] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5"
          onClick={(event) => event.target === event.currentTarget && setSelectedQuestion(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="past-question-detail-title"
            className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-7 ${
              dark ? "border-white/10 bg-[#0b1020] text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">Past question</p>
                <h2 id="past-question-detail-title" className="mt-2 text-2xl font-bold">{getTitle(selectedQuestion)}</h2>
                <p className="mt-2 text-sm opacity-65">
                  {[selectedQuestion.courseCode, selectedQuestion.school, selectedQuestion.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                aria-label="Close past question details"
                className={`rounded-xl p-2 ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
              >
                <X size={20} />
              </button>
            </div>

            {selectedQuestion.description && (
              <p className="mb-5 whitespace-pre-wrap text-sm leading-6 opacity-80">{selectedQuestion.description}</p>
            )}
            {(selectedQuestion.content?.length > 0 || selectedQuestion.questions?.length > 0) && (
              <div className={`mb-5 whitespace-pre-wrap rounded-2xl p-4 text-sm leading-7 ${
                dark ? "bg-white/[0.04]" : "bg-slate-50"
              }`}>
                {questionContentText(selectedQuestion.content || selectedQuestion.questions) ||
                  "Question content is available in the attached document."}
              </div>
            )}

            {selectedQuestion.files?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold">Documents</h3>
                {selectedQuestion.files.map((file, index) => (
                  <button
                    type="button"
                    key={`${file.url}-${index}`}
                    onClick={() => {
                      setSelectedQuestion(null);
                      openViewer(file, selectedQuestion);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      dark ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]" : "border-slate-200 bg-slate-50 hover:bg-indigo-50"
                    }`}
                  >
                    <FileText className="shrink-0 text-indigo-500" size={19} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{file.name || `Document ${index + 1}`}</span>
                    <span className="text-sm font-semibold text-indigo-500">Open</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

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