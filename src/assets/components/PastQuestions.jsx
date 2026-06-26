import { useEffect, useState, useRef, useCallback } from "react";
import { db, auth } from "../../firebase/config";
import {
  collection, getDocs, query,
  doc, setDoc, deleteDoc, getDoc,
} from "firebase/firestore";
import {
  FileText, Download, BookOpen, School,
  Calendar, User, HardDrive, Search,
  Star, Crown, Lock, Eye, X, RefreshCw,
} from "lucide-react";

const PDFThumbnail = ({ url, dark }) => {
  const canvasRef = useRef(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (!url) { setState("error"); return; }
    let cancelled = false;
    setState("loading");

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        // Worker URL must match the installed pdfjs-dist version
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdf = await pdfjsLib.getDocument({ url }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.6 });

        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;

        if (!cancelled) setState("done");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden mb-3"
      style={{
        height: 160,
        background: dark ? "#1a2235" : "#f0f2f7",
      }}
    >
      {/* Animated skeleton while loading */}
      {state === "loading" && (
        <div
          className="absolute inset-0 animate-pulse rounded-xl"
          style={{ background: dark ? "#252d40" : "#e2e6ef" }}
        />
      )}

      {/* Fallback placeholder */}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-25">
          <FileText size={40} />
          <span className="text-xs font-semibold tracking-wide uppercase">
            No Preview
          </span>
        </div>
      )}

      {/* Rendered canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ display: state === "done" ? "block" : "none" }}
      />

      {/* PDF badge shown on success */}
      {state === "done" && (
        <span
          className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(99,102,241,0.85)", color: "#fff", letterSpacing: "0.06em" }}
        >
          PDF
        </span>
      )}
    </div>
  );
};
const SkeletonCard = ({ dark }) => (
  <div
    className="p-5 rounded-xl shadow-lg"
    style={{ background: dark ? "#111827" : "#fff" }}
  >
    <div
      className="w-full h-40 rounded-xl animate-pulse mb-3"
      style={{ background: dark ? "#1a2235" : "#e5e7eb" }}
    />
    <div className="h-5 rounded animate-pulse mb-2" style={{ background: dark ? "#1a2235" : "#e5e7eb" }} />
    <div className="h-4 w-3/5 rounded animate-pulse mb-4" style={{ background: dark ? "#1a2235" : "#e5e7eb" }} />
    {[1, 2].map((i) => (
      <div
        key={i}
        className="h-12 rounded-lg animate-pulse mb-2"
        style={{ background: dark ? "#1a2235" : "#e5e7eb" }}
      />
    ))}
  </div>
);

const ViewerModal = ({ file, question, onClose, dark, isPremium, onDownload }) => {
  const [mode, setMode] = useState("direct"); // "direct" | "gdocs"
  const [frameKey, setFrameKey] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const toggleMode = () => {
    setMode((m) => (m === "direct" ? "gdocs" : "direct"));
    setFrameKey((k) => k + 1);
  };

  const src =
    mode === "gdocs"
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`
      : file.url;

  const dividerColor = dark ? "#1f2937" : "#e5e7eb";
  const btnMuted = {
    background: dark ? "#1f2937" : "#f3f4f6",
    color: dark ? "#9ca3af" : "#6b7280",
  };

  return (
    <div
      className="fixed inset-0 z-504 flex items-center justify-center p-3 md:p-5 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(5px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl max-h-[calc(100vh-2rem)] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: dark ? "#0b0f1a" : "#fff",
          border: `1px solid ${dividerColor}`,
        }}
      >
        {/* ── Header ── */}
        <div className="flex max-md:flex-col justify-between items-center gap-3 px-4 py-3 shrink-0" style={{
            borderBottom: `1px solid ${dividerColor}`,
            background: dark ? "#0d1117" : "#f9fafb",
          }}>
            <div className="flex gap-5">
              <div className="p-2 rounded-lg shrink-0"
            style={{ background: "rgba(99,102,241,0.15)" }}>
            <FileText size={16} className="text-indigo-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{file.name}</p>
            <p className="text-xs mt-0.5 opacity-40">
              {question.courseCode} · {question.school} · {question.year} · {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
            </div>
          

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle viewer mode */}
            <button
              onClick={toggleMode}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={btnMuted}
              title={mode === "direct" ? "Switch to Google Docs viewer if PDF doesn't load" : "Switch back to direct embed"}
            >
              <RefreshCw size={12} />
              {mode === "direct" ? "Google Docs" : "Direct View"}
            </button>

            {/* Download (premium) or locked badge */}
            {isPremium ? (
              <button
                onClick={() => onDownload(file)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                <Download size={13} /> Download
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(234,179,8,0.12)", color: "#ca8a04" }}
              >
                <Lock size={11} /> Premium only
              </div>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={btnMuted}
              aria-label="Close viewer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── PDF iframe ── */}
        <div className="flex-1 relative min-h-[60vh]" style={{ background: "#18181b" }}>
          <iframe
            key={frameKey}
            src={src}
            className="absolute inset-0 w-full h-full"
            style={{ border: "none" }}
            title={file.name}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
};

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
    if (!auth.currentUser) return alert("Login required");
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
    anchor.download = fileName || "document.pdf";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, []);

  const handleDownload = useCallback((file) => {
    if (!auth.currentUser)
      return alert("Please login to access premium downloads.");
    if (!isPremium)
      return alert("PDF downloads are only available for premium users 🚀");

    const downloadUrl = file?.url;
    const fileName = file?.name || file?.original_filename || "document.pdf";

    if (!downloadUrl) return;

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);

    if (typeof anchor.download === "string") {
      anchor.click();
    } else {
      window.open(downloadUrl, "_blank");
    }

    document.body.removeChild(anchor);
  }, [isPremium]);

  const openViewer  = (file, question) => setViewer({ file, question });
  const closeViewer = useCallback(() => setViewer(null), []);

  // ── Derived options ──────────────────────────────────────
  const courses = [...new Set(questions.map((q) => q.courseCode))];
  const schools = [...new Set(questions.map((q) => q.school))];

  // ── Style tokens ─────────────────────────────────────────
  const pageBg   = dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900";
  const cardBg   = dark ? "#111827" : "#ffffff";
  const panelBg  = dark ? "#111827" : "#ffffff";
  const selectBg = dark ? "#1f2937" : "#f3f4f6";
  const fileBg   = dark ? "#1a2235" : "#f4f6fa";

  // ─────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen px-4 py-6 ${pageBg}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500 rounded-xl text-white">
              <BookOpen />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Past Questions</h1>
              <p className="text-sm opacity-60">
                Discover and download shared academic materials
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${
              isPremium
                ? "bg-yellow-500 text-black"
                : dark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Crown size={16} />
            {isPremium ? "Premium User" : "Free User"}
          </div>
        </div>

        {/* ── SEARCH + FILTER ── */}
        <div
          className="p-4 rounded-xl flex flex-col md:flex-row gap-3"
          style={{ background: panelBg }}
        >
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} className="opacity-40 flex-shrink-0" />
            <input
              placeholder="Search by title, course, school…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 outline-none bg-transparent text-sm"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="p-2 rounded-lg text-sm"
            style={{ background: selectBg }}
          >
            <option value="">All Courses</option>
            {courses.map((c, i) => <option key={i}>{c}</option>)}
          </select>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="p-2 rounded-lg text-sm"
            style={{ background: selectBg }}
          >
            <option value="">All Schools</option>
            {schools.map((s, i) => <option key={i}>{s}</option>)}
          </select>
        </div>

        {/* ── PREMIUM NOTICE ── */}
        {!isPremium && (
          <div
            className="p-4 rounded-xl flex items-start gap-3"
            style={{
              background: dark ? "rgba(234,179,8,0.08)" : "#fefce8",
              border: "1px solid rgba(234,179,8,0.25)",
            }}
          >
            <Lock className="text-yellow-500 shrink-0 mt-0.5" size={17} />
            <div>
              <h3 className="font-semibold text-sm">Premium Download Required</h3>
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
          <div className="text-center mt-24 opacity-50">
            <FileText size={48} className="mx-auto mb-3" />
            <p className="font-medium">No matching results</p>
            <p className="text-sm mt-1 opacity-70">
              Try a different search term or clear your filters.
            </p>
          </div>
        )}

        {/* ── QUESTION CARDS ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-xl shadow-lg flex flex-col"
                style={{ background: cardBg }}
              >
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
                    className="flex-shrink-0 mt-0.5"
                  >
                    <Star
                      size={19}
                      className={
                        bookmarks[q.id]
                          ? "text-yellow-400 fill-yellow-400"
                          : "opacity-30"
                      }
                    />
                  </button>
                </div>

                {/* Meta */}
                <div className="text-xs space-y-1.5 mb-4 opacity-55">
                  <p className="flex items-center gap-1.5"><School size={12} />{q.school}</p>
                  <p className="flex items-center gap-1.5"><BookOpen size={12} />{q.courseCode}</p>
                  <p className="flex items-center gap-1.5"><Calendar size={12} />{q.year}</p>
                  <p className="flex items-center gap-1.5"><User size={12} />{q.userEmail || "Anonymous"}</p>
                </div>

                {/* File list */}
                <div className="space-y-2 mt-auto">
                  {q.files?.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-3 rounded-lg"
                      style={{ background: fileBg }}
                    >
                      {/* Name + size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs opacity-45 flex items-center gap-1 mt-0.5">
                          <HardDrive size={10} />
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      {/* View — everyone */}
                      <button
                        onClick={() => openViewer(file, q)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                        style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}
                        title="View document"
                      >
                        <Eye size={13} /> View
                      </button>

                      {/* Download — premium only */}
                      <button
                        onClick={() => handleDownload(file)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                        style={
                          isPremium
                            ? { background: "#4f46e5", color: "#fff" }
                            : {
                                background: dark ? "#252d40" : "#e5e7eb",
                                color: dark ? "#6b7280" : "#9ca3af",
                              }
                        }
                        title={isPremium ? "Download PDF" : "Upgrade to download"}
                      >
                        {!isPremium && <Lock size={10} className="text-yellow-500" />}
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