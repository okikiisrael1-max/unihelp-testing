import { useCallback, useEffect, useMemo, useState } from "react";

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
  Sparkles,
  Star,
  Crown,
  Upload,
  X,
} from "lucide-react";

import { db } from "../../firebase/config";
import {
  getCloudinaryAttachmentUrl,
  getCloudinaryPreviewUrl,
  uploadPDF,
} from "../../services/cloudinary";

const PDFThumbnail = ({ note, dark }) => {
  const [failed, setFailed] = useState(false);
  const previewUrl = getCloudinaryPreviewUrl(
    note.previewUrl || note.fileUrl
  );

  useEffect(() => {
    setFailed(false);
  }, [previewUrl]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl mb-4"
      style={{ height: 180, background: dark ? "#0f172a" : "#eef2ff" }}
    >
      {previewUrl && !failed ? (
        <img
          src={previewUrl}
          alt={`${note.title} preview`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
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

const ViewerModal = ({ note, dark, canDownload, onClose, onDownload }) => {
  const [mode, setMode] = useState("direct");
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const viewerUrl =
    mode === "gdocs"
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
          note.fileUrl
        )}`
      : note.fileUrl;

  const buttonStyle = {
    background: dark ? "#1e293b" : "#f1f5f9",
    color: dark ? "#cbd5e1" : "#475569",
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-3 md:p-5"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="flex w-full max-w-5xl max-h-[calc(100vh-2rem)] min-h-[60vh] flex-col overflow-hidden rounded-[28px] shadow-2xl"
        style={{
          background: dark ? "#020617" : "#ffffff",
          border: `1px solid ${dark ? "#1e293b" : "#e5e7eb"}`,
        }}
      >
        <div
          className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: dark ? "#1e293b" : "#e5e7eb" }}
        >
          <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-400">
            <FileText size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{note.title}</p>
            <p className="mt-0.5 truncate text-xs opacity-50">
              {note.course} · {note.dept} · {note.school}
            </p>
          </div>

          <button
            onClick={() => {
              setMode((current) => (current === "direct" ? "gdocs" : "direct"));
              setFrameKey((current) => current + 1);
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
            style={buttonStyle}
            title="Switch viewer"
          >
            <RefreshCw size={12} />
            {mode === "direct" ? "Google Docs" : "Direct"}
          </button>

          {canDownload ? (
            <button
              onClick={() => onDownload(note)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Download size={13} />
              Download
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500">
              <Lock size={11} />
              Premium only
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded-xl p-2"
            style={buttonStyle}
            aria-label="Close viewer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="relative flex-1 min-h-[55vh]" style={{ background: "#111827" }}>
          <iframe
            key={frameKey}
            src={viewerUrl}
            title={note.title}
            className="absolute inset-0 h-full w-full"
            style={{ border: "none" }}
            allow="fullscreen"
          />
        </div>
      </div>
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
  });

  const isPremium = userProfile?.premium === true;

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
      { label: "Notes", value: notes.length, icon: FileText },
      { label: "Downloads", value: totalDownloads, icon: Download },
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

    const link = document.createElement("a");
    link.href = note.downloadUrl || getCloudinaryAttachmentUrl(note.fileUrl, note.fileName);
    link.download = note.fileName || note.title || "lecture-note.pdf";
    link.target = "_blank";
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
    <div className={`min-h-screen w-full overflow-hidden ${bg}`}>
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8">
        <div className={`${card} rounded-[32px] p-5 sm:p-6 shadow-2xl`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl">
                <FileText size={30} className="text-white" />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
                  <Sparkles size={14} />
                  Lecture Notes Hub
                </div>
                <h1 className="text-2xl font-black md:text-4xl">Lecture Notes Marketplace</h1>
                <p className="mt-1 opacity-70">
                  Upload, preview, and download campus notes without storage bottlenecks.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
              >
                <Upload size={18} />
                Upload PDF
              </button>
              <button
                onClick={() => setTab("requests")}
                className={`inline-flex h-12 items-center gap-2 rounded-2xl px-5 font-semibold ${
                  dark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-900"
                }`}
              >
                <HelpCircle size={18} />
                Requests
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`rounded-3xl p-4 ${softCard}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] opacity-60">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-black">{item.value}</p>
                    </div>
                    <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-400">
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
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
                  }`}
                >
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

            <button
              onClick={() => setTab("notes")}
              className={`inline-flex h-12 items-center gap-2 rounded-2xl px-5 font-semibold ${
                tab === "notes"
                  ? "bg-indigo-600 text-white"
                  : dark
                    ? "bg-white/5 text-white"
                    : "bg-white text-slate-900"
              }`}
            >
              <LayoutGrid size={18} />
              Notes
            </button>

            <button
              onClick={() => setTab("requests")}
              className={`inline-flex h-12 items-center gap-2 rounded-2xl px-5 font-semibold ${
                tab === "requests"
                  ? "bg-indigo-600 text-white"
                  : dark
                    ? "bg-white/5 text-white"
                    : "bg-white text-slate-900"
              }`}
            >
              <MessageSquareMore size={18} />
              Requests
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : tab === "notes" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {filteredNotes.length === 0 ? (
              <div className={`${card} rounded-[32px] p-12 text-center xl:col-span-2`}>
                <FileText size={44} className="mx-auto mb-4 opacity-40" />
                <h2 className="text-2xl font-bold">No notes found</h2>
                <p className="mt-2 opacity-60">Try a different search or upload a new PDF.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <article
                  key={note.id}
                  className={`rounded-[32px] p-5 transition-transform hover:-translate-y-1 ${card}`}
                >
                  <PDFThumbnail note={note} dark={dark} />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-black">{note.title}</h2>
                      <p className="mt-1 text-sm opacity-70">
                        {note.course} · {note.dept}
                      </p>
                      <p className="mt-1 text-xs opacity-50">
                        {note.lecturer || "Lecturer"} · {note.school || "School"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-indigo-500/10 px-3 py-2 text-right">
                      <p className="text-xs uppercase tracking-[0.2em] opacity-60">Downloads</p>
                      <p className="mt-1 text-lg font-black">{note.downloads || 0}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => rateNote(note.id, star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={16}
                            className={note.rating >= star ? "fill-yellow-400" : ""}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openViewer(note)}
                        className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 font-semibold ${
                          dark ? "bg-white/5" : "bg-slate-100"
                        }`}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(note)}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-4 font-semibold text-white hover:bg-indigo-700"
                      >
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
                placeholder="Need CSC301 lecture notes..."
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
                    <p className="mt-1 text-sm opacity-60">PDF only. Cloudinary compresses the file before upload.</p>
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
                  {[
                    { key: "title", placeholder: "Lecture Note Title" },
                    { key: "course", placeholder: "Course Code" },
                    { key: "dept", placeholder: "Department" },
                    { key: "school", placeholder: "School" },
                  ].map((field) => (
                    <input
                      key={field.key}
                      value={form[field.key]}
                      onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                      placeholder={field.placeholder}
                      className={`${inputClass} h-14 px-4`}
                    />
                  ))}
                </div>

                <input
                  value={form.lecturer}
                  onChange={(event) => setForm({ ...form, lecturer: event.target.value })}
                  placeholder="Lecturer name"
                  className={`${inputClass} mt-4 h-14 px-4`}
                />

                <label
                  className={`mt-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed transition-colors ${
                    dark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Upload size={40} className="mb-4 opacity-70" />
                  <h3 className="text-lg font-semibold">Choose a PDF to upload</h3>
                  <p className="mt-2 text-sm opacity-60">This file will be compressed before it reaches Cloudinary.</p>
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
          canDownload={canDownload(viewer)}
          onClose={closeViewer}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
