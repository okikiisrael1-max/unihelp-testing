import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";

import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  HelpCircle,
  LayoutGrid,
  Loader2,
  Lock,
  MessageSquareMore,
  RefreshCw,
  Search,
  Send,
  Star,
  Crown,
  Share2,
  Upload,
  X,
  DownloadIcon,
  School,
  Library,
  Layers,
  ChevronDown,
} from "lucide-react";

import { db } from "../../firebase/config";
import {
  getCloudinaryAttachmentUrl,
  getCloudinaryPreviewUrl,
  isPreviewImageUrl,
  toCloudinaryAsset,
  uploadPDF,
} from "../../services/cloudinary";
import ViewerModal from "../components/ViewerModal";
import { buildShareUrl, shareContent } from "../utils/share";
import {
  ALL_NIGERIAN_SCHOOLS,
  NIGERIAN_UNIVERSITIES,
  NIGERIAN_POLYTECHNICS,
  NIGERIAN_COLLEGES_OF_EDUCATION,
  COMMON_DEPARTMENTS,
} from "../data/nigerianSchools";

function SearchableSelect({ value, onChange, options, placeholder, dark }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        (o.name || o.label || "").toLowerCase().includes(q) ||
        (o.shortName || "").toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedLabel = options.find((o) => o.id === value || o.name === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div
        className={`w-full h-14 px-4 rounded-2xl border outline-none transition-all flex items-center gap-2 cursor-pointer ${
          dark ? "bg-slate-950 border-white/10" : "bg-slate-100 border-slate-200"
        }`}
        onClick={() => setOpen(!open)}
      >
        <span className={`flex-1 text-sm ${selectedLabel ? "" : "opacity-40"}`}>
          {selectedLabel
            ? selectedLabel.shortName
              ? `${selectedLabel.name} (${selectedLabel.shortName})`
              : selectedLabel.name || selectedLabel.label
            : placeholder}
        </span>
        <ChevronDown size={16} className="opacity-40" />
      </div>
      {open && (
        <div className={`absolute z-20 w-full mt-1 rounded-2xl border max-h-60 overflow-y-auto shadow-lg ${
          dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
        }`}>
          <div className={`sticky top-0 p-2 border-b ${dark ? "border-white/10" : "border-slate-200"}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl">
              <Search size={16} className="opacity-40 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent outline-none text-sm"
                autoFocus
              />
            </div>
          </div>
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id || item.name}
                type="button"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition text-sm flex items-center gap-2"
              >
                <span className="flex-1 font-medium">
                  {item.name || item.label}
                  {item.shortName && <span className="opacity-50 ml-1">({item.shortName})</span>}
                </span>
                {item.faculty && <span className="text-xs opacity-50">{item.faculty}</span>}
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm opacity-60">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

const PDFThumbnail = ({ note, dark }) => {
  const [failed, setFailed] = useState(false);
  const previewUrl = getCloudinaryPreviewUrl(
    note.fileUrl || note.previewUrl
  );
  const useFramePreview = previewUrl && !isPreviewImageUrl(previewUrl);

  useEffect(() => {
    setFailed(false);
  }, [previewUrl]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl mb-4"
      style={{ height: 180, background: dark ? "#0f172a" : "#eef2ff" }}
    >
      {previewUrl && !failed ? (
        useFramePreview ? (
          <iframe
            src={previewUrl}
            title={`${note.title} preview`}
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <img
            src={previewUrl}
            alt={`${note.title} preview`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-30">
          <FileText size={44} />
          <span className="text-xs font-semibold tracking-[0.3em] uppercase">
            PDF
          </span>
        </div>
      )}

      <span className="absolute top-3 right-3 rounded-full bg-indigo-600/90 px-2 py-1 text-[10px] font-bold tracking-[0.2em] text-white">
        PDF
      </span>
    </div>
  );
};

export default function LectureNotesMarketplace({ dark }) {
  const auth = getAuth();

  const [notes, setNotes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("notes");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [requestText, setRequestText] = useState("");
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [form, setForm] = useState({
    title: "",
    course: "",
    dept: "",
    lecturer: "",
    school: "",
    level: "",
  });

  const isPremium = userProfile?.premium === true;

  const ACADEMIC_LEVELS = [
    { value: "100", label: "100 Level" },
    { value: "200", label: "200 Level" },
    { value: "300", label: "300 Level" },
    { value: "400", label: "400 Level" },
    { value: "500", label: "500 Level" },
    { value: "600", label: "600 Level" },
    { value: "postgraduate", label: "Postgraduate" },
  ];

  const SCHOOL_TYPES = [
    { value: "university", label: "University" },
    { value: "polytechnic", label: "Polytechnic" },
    { value: "college_of_education", label: "College of Education" },
  ];

  const bg = dark ? "bg-[#050816] text-white" : "bg-[#f5f7ff] text-slate-900";
  const card = dark
    ? "bg-white/[0.04] border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200 shadow-sm";
  const softCard = dark ? "bg-white/[0.03]" : "bg-slate-50";
  const inputClass = `w-full rounded-2xl px-4 outline-none transition-all ${
    dark
      ? "bg-slate-950 border border-white/10 focus:border-indigo-500"
      : "bg-slate-100 border border-slate-200 focus:border-indigo-500"
  }`;

  const stats = useMemo(() => {
    const totalDownloads = notes.reduce(
      (sum, note) => sum + (note.downloads || 0),
      0
    );

    return [
      { label: "Requests", value: requests.length, icon: MessageSquareMore },
      { label: "Premium", value: isPremium ? "Yes" : "No", icon: Crown },
    ];
  }, [notes, requests, isPremium]);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(
        query(collection(db, "notes"), orderBy("createdAt", "desc"))
      );
      setNotes(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setUserProfile(null);
        return;
      }

      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "requests"));
        const now = Date.now();

        await Promise.all(
          snapshot.docs.map(async (entry) => {
            const createdAt = entry.data().createdAt?.seconds
              ? entry.data().createdAt.seconds * 1000
              : 0;

            if (createdAt && (now - createdAt) / 3_600_000 >= 48) {
              await deleteDoc(doc(db, "requests", entry.id));
            }
          })
        );
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "requests"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setRequests(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        setNotifications(
          snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
        );
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const filteredNotes = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return notes;

    return notes.filter((note) =>
      [note.title, note.course, note.dept, note.lecturer, note.school]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [notes, search]);

  const canDownload = useCallback(
    (note) => {
      if (!currentUser) return false;
      if (note.uploadedBy === currentUser.uid) return true;
      return isPremium;
    },
    [currentUser, isPremium]
  );

  const openViewer = (note) => setViewer(note);
  const closeViewer = useCallback(() => setViewer(null), []);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a PDF to upload");
      return;
    }

    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("Only PDF files are supported here");
      return;
    }

    if (!currentUser) {
      toast.error("Please log in before uploading");
      return;
    }

    if (!form.title || !form.course || !form.dept || !form.school) {
      toast.error("Please fill in all required fields before uploading");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const result = await uploadPDF(file, (percent) => {
        setProgress(Math.round(percent));
      });

      await addDoc(collection(db, "notes"), {
        ...form,
        fileUrl: result.secure_url,
        downloadUrl: getCloudinaryAttachmentUrl(result.secure_url, file.name),
        previewUrl: getCloudinaryPreviewUrl(result.secure_url),
        fileName: file.name,
        fileSize: file.size,
        compressedSize: result.bytes,
        cloudinaryPublicId: result.public_id,
        cloudinaryResourceType: result.resource_type,
        fileAsset: toCloudinaryAsset(result),
        uploadedBy: currentUser.uid,
        downloads: 0,
        rating: 0,
        createdAt: serverTimestamp(),
      });

      setForm({
        title: "",
        course: "",
        dept: "",
        lecturer: "",
        school: "",
        level: "",
      });
      setFile(null);
      setProgress(0);
      setShowUpload(false);
      toast.success("PDF uploaded successfully");
      await loadNotes();
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDownload = async (note) => {
    if (!canDownload(note)) {
      toast.error("Premium access required to download this note");
      return;
    }

    const downloadLink =
      note.downloadUrl ||
      note.fileUrl ||
      getCloudinaryAttachmentUrl(note.fileUrl, note.fileName || note.title);

    if (!downloadLink) {
      toast.error("Unable to create a download link. Please try again.");
      return;
    }

    const link = document.createElement("a");
    link.href = downloadLink;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      await updateDoc(doc(db, "notes", note.id), {
        downloads: increment(1),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async (note) => {
    const shareUrl = buildShareUrl("/resources", {
      note: note.id,
    });

    try {
      await shareContent({
        title: note.title,
        text: `Check out this lecture note on UniHelp: ${note.title}`,
        url: shareUrl,
      });

      if (!navigator.share) {
        toast.success("Lecture note link copied to clipboard.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to share this lecture note right now.");
    }
  };

  const rateNote = async (noteId, value) => {
    try {
      await updateDoc(doc(db, "notes", noteId), { rating: value });
      setNotes((current) =>
        current.map((note) => (note.id === noteId ? { ...note, rating: value } : note))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const submitRequest = async () => {
    if (!requestText.trim()) return;

    try {
      await addDoc(collection(db, "requests"), {
        text: requestText.trim(),
        userId: currentUser?.uid || null,
        status: "open",
        createdAt: serverTimestamp(),
      });
      setRequestText("");
    } catch (error) {
      console.error(error);
      toast.error("Unable to submit request");
    }
  };

  return (
    <div className={`min-h-screen  w-full overflow-hidden rounded-[32px] ${bg}`}>
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8">
        <div className={`${card} rounded-[32px] p-5 sm:p-6 shadow-2xl`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${softCard}`}
                  >
                    <div className="rounded-xl bg-indigo-500/10 p-1.5 text-indigo-400">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 leading-none">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-none">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-700 text-[13px]"
            >
              <Upload size={18} />
              Upload PDF
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${card}`}>
            <Search size={18} className="opacity-60" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, course, department, or lecturer..."
              className="w-full bg-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div
              role="tablist"
              aria-label="View"
              className={`grid grid-cols-2 gap-1 rounded-2xl p-1 ${
                dark ? "bg-white/5" : "bg-slate-100"
              }`}
            >
              <button
                role="tab"
                aria-selected={tab === "notes"}
                onClick={() => setTab("notes")}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 ${
                  tab === "notes"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : dark
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={16} className={tab === "notes" ? "opacity-100" : "opacity-60"} />
                Notes
              </button>
              <button
                role="tab"
                aria-selected={tab === "requests"}
                onClick={() => setTab("requests")}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 ${
                  tab === "requests"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : dark
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <MessageSquareMore size={16} className={tab === "requests" ? "opacity-100" : "opacity-60"} />
                Requests
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications((current) => !current)}
                className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                  dark ? "bg-white/5" : "bg-white"
                }`}
              >
                <Bell size={18} />
                {notifications.filter((item) => !item.read).length > 0 && (
                  <span className="absolute right-1 top-1 min-w-5 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {notifications.filter((item) => !item.read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className={`absolute right-0 top-14 z-20 w-80 overflow-hidden rounded-3xl border p-3 shadow-2xl ${
                    dark
                      ? "border-white/10 bg-slate-950"
                      : "border-slate-200 bg-white"
                  }`}>
                  <div className="mb-3 flex items-center justify-between px-2">
                    <p className="font-bold">Notifications</p>
                    <span className="text-xs opacity-60">{notifications.length} items</span>
                  </div>

                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl px-3 py-3 text-sm ${
                          dark ? "bg-white/5" : "bg-slate-50"
                        }`}
                      >
                        <p className="font-semibold">{item.title || "New alert"}</p>
                        <p className="mt-1 text-xs opacity-60">{item.message || "You have a new update."}</p>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="rounded-2xl px-3 py-8 text-center text-sm opacity-60">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : tab === "notes" ? (
          <div className="mt-6 w-full grid gap-6 grid-cols-1 xl:grid-cols-2">
            {filteredNotes.length === 0 ? (
              <div className={`${card} rounded-[32px] p-12 text-center xl:col-span-2`}>
                <FileText size={44} className="mx-auto mb-4 opacity-40" />
                <h2 className="text-2xl font-bold">No notes found</h2>
                <p className="mt-2 opacity-60">Try a different search or upload a new PDF.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <article key={note.id} className={`rounded-[32px] p-5 transition-transform hover:-translate-y-1 ${card}`}>
                  <PDFThumbnail note={note} dark={dark} />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-black">{note.title}</h2>
                      <p className="mt-1 text-sm opacity-70">
                        {note.course} · {note.dept}
                      </p>
                      <p className="mt-1 text-xs opacity-50">
                        {note.lecturer} · {note.school}
                      </p>
                    </div>

                    <div className="rounded-2xl flex gap-1.5 justify-center items-center bg-indigo-500/10 px-3 py-2 text-right">
                      <DownloadIcon size={22}/>
                      <p className="mt-1 text-lg font-black">{note.downloads || 0}</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => rateNote(note.id, star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={12}
                            className={note.rating >= star ? "fill-yellow-400" : ""}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="flex w-full justify-around gap-1 mt-2.5">
                      <button onClick={() => handleShare(note)}
                        className={`flex h-11 items-center gap-2 rounded-2xl px-4 font-semibold ${ dark ? "bg-white/5" : "bg-slate-100"}`}>
                        <Share2 size={16} />
                        Share
                      </button>
                      <button onClick={() => openViewer(note)}
                        className={`flex h-11 items-center gap-2 rounded-2xl px-4 font-semibold ${
                          dark ? "bg-white/5" : "bg-slate-100"
                        }`}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(note)}
                        className="flex h-11 items-center gap-2 text-[12px] rounded-2xl bg-indigo-600 px-3 font-semibold text-white hover:bg-indigo-700">
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className={`${card} h-fit rounded-[32px] p-6`}>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Request Notes</h2>
                  <p className="text-sm opacity-60">Requests are auto-cleared after 48 hours.</p>
                </div>
              </div>

              <textarea
                value={requestText}
                onChange={(event) => setRequestText(event.target.value)}
                placeholder="Describe the lecture notes you need"
                className={`min-h-[180px] w-full rounded-3xl p-5 outline-none resize-none ${
                  dark ? "bg-slate-950" : "bg-slate-100"
                }`}
              />

              <button
                onClick={submitRequest}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
              >
                <Send size={18} />
                Submit Request
              </button>
            </div>

            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className={`${card} rounded-[32px] p-12 text-center`}>
                  <Clock3 size={44} className="mx-auto mb-4 opacity-40" />
                  <h2 className="text-2xl font-bold">No active requests</h2>
                  <p className="mt-2 opacity-60">Students can post a request and keep it open for 48 hours.</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className={`${card} rounded-[30px] p-5`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <CheckCircle2
                            size={18}
                            className={request.status === "fulfilled" ? "text-emerald-500" : "text-amber-500"}
                          />
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              request.status === "fulfilled"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold">{request.text}</h3>
                      </div>
                      <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showUpload && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onClick={(event) => event.target === event.currentTarget && setShowUpload(false)}
        >
          <div className={`w-full max-w-2xl rounded-[32px] bg-transparent p-0 shadow-none`}>
            <div className={`flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[32px] bg-transparent shadow-2xl ${card}`}>
              <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Upload Lecture Note</h2>
                    <p className="mt-1 text-sm opacity-60">PDF only. systeme compresses the file before upload.</p>
                  </div>
                  <button
                    onClick={() => setShowUpload(false)}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      dark ? "bg-white/5" : "bg-slate-100"
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Lecture Note Title</label>
                    <input
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      placeholder="e.g. Data Structures — Week 4"
                      className={`${inputClass} h-14 px-4`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Course Code</label>
                    <input
                      value={form.course}
                      onChange={(event) => setForm({ ...form, course: event.target.value })}
                      placeholder="e.g. CSC 204"
                      className={`${inputClass} h-14 px-4`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Department</label>
                    <SearchableSelect
                      value={form.dept}
                      onChange={(item) => setForm({ ...form, dept: item.name })}
                      options={COMMON_DEPARTMENTS.map((d, i) => ({ ...d, id: `dept-${i}` }))}
                      placeholder="Search for your department..."
                      dark={dark}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">School</label>
                    <SearchableSelect
                      value={form.school}
                      onChange={(item) => setForm({ ...form, school: item.name })}
                      options={ALL_NIGERIAN_SCHOOLS.map((s, i) => ({ ...s, id: `sch-${i}` }))}
                      placeholder="Search for your school..."
                      dark={dark}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Level</label>
                    <SearchableSelect
                      value={form.level}
                      onChange={(item) => setForm({ ...form, level: item.value })}
                      options={ACADEMIC_LEVELS.map((l) => ({ ...l, id: l.value, name: l.label }))}
                      placeholder="Select your level..."
                      dark={dark}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Lecturer name (optional)</label>
                    <input
                      value={form.lecturer}
                      onChange={(event) => setForm({ ...form, lecturer: event.target.value })}
                      placeholder="e.g. Dr. Adebayo"
                      className={`${inputClass} h-14 px-4`}
                    />
                  </div>
                </div>

                <label
                  className={`mt-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed transition-colors ${
                    dark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Upload size={40} className="mb-4 opacity-70" />
                  <h3 className="text-lg font-semibold">Choose a PDF to upload</h3>
                  <input
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                </label>

                {file && (
                  <div className={`mt-4 rounded-3xl p-4 ${dark ? "bg-white/5" : "bg-slate-100"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{file.name}</p>
                        <p className="text-xs opacity-60">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-300/40">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewer && (
        <ViewerModal
          note={viewer}
          dark={dark}
          isPremium={canDownload(viewer)}
          onClose={closeViewer}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}