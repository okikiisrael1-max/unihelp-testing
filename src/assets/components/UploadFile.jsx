import {
  FileUpIcon,
  Plus,
  X,
  AlertCircle,
  UploadCloud,
  ImageIcon,
  FileText,
  School,
  Library,
  Layers,
  Search,
  ChevronDown,
  GraduationCap,
  BookOpen,
  Loader2,
  Sparkles,
  ExternalLink,
  Trash2,
  Check,
} from "lucide-react";

import { useEffect, useState, useMemo, useRef, useContext } from "react";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";

import { db, auth } from "../../firebase/config";
import { uploadFile } from "../../services/cloudinary";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  ALL_NIGERIAN_SCHOOLS,
  NIGERIAN_UNIVERSITIES,
  NIGERIAN_POLYTECHNICS,
  NIGERIAN_COLLEGES_OF_EDUCATION,
  COMMON_DEPARTMENTS,
} from "../data/nigerianSchools";

import { theme } from "../utils/theme";

/* ── Constants ─────────────────────────────────── */
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
  { value: "university", label: "University", icon: GraduationCap },
  { value: "polytechnic", label: "Polytechnic", icon: BookOpen },
  { value: "college_of_education", label: "College", icon: School },
];

function SearchableSelect({ label, icon: Icon, value, onChange, options, placeholder, error, dark }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        (o.name || o.label || "").toLowerCase().includes(q) ||
        (o.shortName || "").toLowerCase().includes(q) ||
        (o.faculty || "").toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedOption = options.find((o) => o.id === value || o.name === value || o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayText = selectedOption
    ? selectedOption.shortName
      ? `${selectedOption.name} (${selectedOption.shortName})`
      : selectedOption.name || selectedOption.label
    : "";

  return (
    <div className="relative flex flex-col gap-1.5" ref={ref}>
      {label && (
        <label className={`text-xs font-semibold tracking-wide uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-12 px-4 rounded-xl border outline-none transition-all duration-200 flex items-center justify-between gap-3 text-left ${
          error
            ? "border-red-500/80 bg-red-500/5 focus:ring-2 focus:ring-red-500/20"
            : open
            ? dark
              ? "border-indigo-500 bg-slate-900 ring-2 ring-indigo-500/20"
              : "border-indigo-600 bg-white ring-2 ring-indigo-500/15"
            : dark
            ? "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
            : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && <Icon size={18} className={`shrink-0 ${displayText ? "text-indigo-500" : "text-slate-400"}`} />}
          <span className={`text-sm truncate font-medium ${displayText ? (dark ? "text-slate-100" : "text-slate-800") : "text-slate-400"}`}>
            {displayText || placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden max-h-72 flex flex-col ${
              dark ? "bg-slate-900/95 border-slate-800 text-slate-100" : "bg-white/95 border-slate-200 text-slate-800"
            }`}
          >
            <div className={`p-2.5 border-b sticky top-0 ${dark ? "border-slate-800/80 bg-slate-900" : "border-slate-100 bg-white"}`}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${dark ? "bg-slate-800/60" : "bg-slate-100/80"}`}>
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full bg-transparent outline-none text-xs font-medium placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto p-1.5 space-y-0.5">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const isSelected = value === (item.id || item.name || item.value);
                  return (
                    <button
                      key={item.id || item.name || item.value}
                      type="button"
                      onClick={() => {
                        onChange(item);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-medium flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : dark
                          ? "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                          : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <div className="truncate flex items-center gap-2">
                        <span>{item.name || item.label}</span>
                        {item.shortName && (
                          <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                            ({item.shortName})
                          </span>
                        )}
                      </div>
                      {item.faculty && (
                        <span className={`text-[10px] shrink-0 ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                          {item.faculty}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs font-semibold">No results found</p>
                  <p className="mt-1 text-[11px] text-slate-400">Try adjusting your search terms.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="flex items-center gap-1 text-red-500 text-xs mt-0.5"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

export default function UploadFile({ dark }) {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [schoolType, setSchoolType] = useState("university");
  const { user } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (user?.uid) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().admin === true) {
          setIsAdmin(true);
        }
      }
      setCheckingRole(false);
    };
    checkRole();
  }, [user]);

  const [form, setForm] = useState({
    school: "", title: "", courseCode: "", year: "", department: "", level: "",
  });

  const MAX_SIZE = 50 * 1024 * 1024;

  const filteredSchools = useMemo(() => {
    if (schoolType === "university") return NIGERIAN_UNIVERSITIES.map((s, i) => ({ ...s, id: `uni-${i}` }));
    if (schoolType === "polytechnic") return NIGERIAN_POLYTECHNICS.map((s, i) => ({ ...s, id: `poly-${i}` }));
    if (schoolType === "college_of_education") return NIGERIAN_COLLEGES_OF_EDUCATION.map((s, i) => ({ ...s, id: `coe-${i}` }));
    return ALL_NIGERIAN_SCHOOLS.map((s, i) => ({ ...s, id: `sch-${i}` }));
  }, [schoolType]);

  const departments = useMemo(() => COMMON_DEPARTMENTS.map((d, i) => ({ ...d, id: `dept-${i}` })), []);
  const levels = useMemo(() => ACADEMIC_LEVELS.map((l) => ({ ...l, id: l.value, name: l.label })), []);

  const validateFile = (file) => {
    if (file.size > MAX_SIZE) { setError(`${file.name} is too large (Max 50MB)`); return false; }
    return true;
  };

  const isFormValid = () => form.school && form.title && form.courseCode && form.year && form.department && files.length > 0;

  const compressImage = async (file) => {
    try {
      return await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1400, useWebWorker: true });
    } catch { return file; }
  };

  const compressFile = async (file) => {
    if (file.type.startsWith("image/")) return compressImage(file);
    return file;
  };

  const handleFiles = async (fileList) => {
    setError("");
    const arr = Array.from(fileList);
    const validFiles = arr.filter(validateFile);
    if (validFiles.length !== arr.length) return;
    const compressed = await Promise.all(validFiles.map(compressFile));
    setFiles((prev) => [...prev, ...compressed]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setProgress((prev) => { const u = { ...prev }; delete u[name]; return u; });
  };

  useEffect(() => {
    if (!files.length) { setPreviewUrl(null); return; }
    const firstPdf = files.find((f) => f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"));
    if (!firstPdf) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(firstPdf);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="text-pink-500" size={18} />;
    if (file.type === "application/pdf") return <FileText className="text-rose-500" size={18} />;
    return <FileUpIcon className="text-emerald-500" size={18} />;
  };

  const handleUpload = async () => {
    if (!auth.currentUser) { setError("Please log in to upload files."); return; }
    if (!isFormValid()) { setError("Please fill out all document details and select at least one file."); return; }
    setUploading(true);
    setError("");
    try {
      const uploadedFiles = [];
      for (let file of files) {
        const result = await uploadFile(file, (percent) => {
          setProgress((prev) => ({ ...prev, [file.name]: Math.round(percent) }));
        });
        uploadedFiles.push({
          name: file.name, url: result.secure_url, publicId: result.public_id,
          resourceType: result.resource_type, size: file.size, type: file.type,
        });
      }
      await addDoc(collection(db, "questions"), {
        ...form, school: form.school, department: form.department, level: form.level,
        files: uploadedFiles, userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email, createdAt: serverTimestamp(),
      });
      navigate("/resources");
    } catch { setError("Upload failed. Please check your network and try again."); }
    setUploading(false);
  };

  if (checkingRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
        <p className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className={`w-full max-w-md rounded-3xl p-8 text-center border backdrop-blur-xl shadow-2xl ${
          dark ? "bg-slate-900/80 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"
        }`}>
          <div className="mx-auto w-16 h-16 mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Only verified administrators can publish study materials and past question papers.
          </p>
          <button 
            onClick={() => navigate("/")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/20 text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen md:mt-10 px-4 py-8 font-sans ${dark ? "text-slate-100" : "text-slate-800"}`}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-1">
            <Sparkles size={13} />
            <span>Resource Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Upload Academic Resources</h1>
          <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Images are automatically compressed to ensure instant student downloads.
          </p>
        </div>

        {/* DOCUMENT METADATA FORM */}
        <div className={`p-6 rounded-3xl border shadow-sm backdrop-blur-md transition-all duration-200 ${
          dark ? "bg-slate-900/60 border-slate-800" : "bg-white/80 border-slate-200/80"
        }`}>
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200/50 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <UploadCloud size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Document Metadata</h2>
              <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Categorize this material for fast indexing.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* School Type Selection */}
            <div>
              <label className={`text-xs font-semibold tracking-wide uppercase block mb-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Institution Category
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                {SCHOOL_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = schoolType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setSchoolType(t.value);
                        setForm({ ...form, school: "" });
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : dark
                          ? "text-slate-400 hover:text-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={14} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* School Searchable Select */}
            <SearchableSelect
              label="Institution"
              icon={School}
              value={form.school}
              onChange={(item) => setForm({ ...form, school: item.name })}
              options={filteredSchools}
              placeholder="Select institution..."
              dark={dark}
            />

            {/* Title & Course Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-semibold tracking-wide uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Semester Exam"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`h-12 px-4 rounded-xl border text-sm outline-none transition-all duration-200 font-medium ${
                    dark
                      ? "bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-600"
                      : "bg-slate-50/50 border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-semibold tracking-wide uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Course Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSC 301"
                  value={form.courseCode}
                  onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                  className={`h-12 px-4 rounded-xl border text-sm outline-none transition-all duration-200 font-medium uppercase ${
                    dark
                      ? "bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-600"
                      : "bg-slate-50/50 border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>

            {/* Year, Department, and Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-semibold tracking-wide uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Academic Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className={`h-12 px-4 rounded-xl border text-sm outline-none transition-all duration-200 font-medium ${
                    dark
                      ? "bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-600"
                      : "bg-slate-50/50 border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>

              <SearchableSelect
                label="Department"
                icon={Library}
                value={form.department}
                onChange={(item) => setForm({ ...form, department: item.name })}
                options={departments}
                placeholder="Department..."
                dark={dark}
              />

              <SearchableSelect
                label="Level"
                icon={Layers}
                value={form.level}
                onChange={(item) => setForm({ ...form, level: item.value })}
                options={levels}
                placeholder="Level..."
                dark={dark}
              />
            </div>
          </div>
        </div>

        {/* DRAG AND DROP ZONE */}
        <div
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 overflow-hidden ${
            dragActive
              ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
              : dark
              ? "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
              : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-white"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="fileInput"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
              <Plus size={26} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">
                Drop files here or <span className="text-indigo-500 underline underline-offset-4">browse</span>
              </p>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Supports PDFs, Word documents, and High-Res Images up to 50MB.
              </p>
            </div>
          </label>
        </div>

        {/* SELECTED FILE LIST */}
        {files.length > 0 && (
          <div className={`p-5 rounded-3xl border ${dark ? "bg-slate-900/60 border-slate-800" : "bg-white/80 border-slate-200/80"}`}>
            <div className="flex justify-between items-center mb-3 px-1">
              <div className="flex items-center gap-2">
                <FileUpIcon size={16} className="text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wide">
                  Queued Files ({files.length})
                </h3>
              </div>
              <button
                onClick={() => { setFiles([]); setProgress({}); }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2.5">
              {files.map((file) => (
                <div
                  key={file.name}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 ${
                    dark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getFileIcon(file)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{file.name}</p>
                        <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(file.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {uploading && (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${progress[file.name] || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[10px] font-medium text-slate-400">
                          {progress[file.name] || 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF PREVIEW MODAL/CARD */}
        {previewUrl && (
          <div className={`rounded-3xl border overflow-hidden ${dark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wide">Document Preview</span>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-600"
              >
                <span>Fullscreen</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <div className="h-80 w-full bg-slate-100 dark:bg-slate-950">
              <iframe src={previewUrl} title="Document Preview" className="h-full w-full border-none" />
            </div>
          </div>
        )}

        {/* ERROR DISCLOSURE */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2.5 text-xs font-medium"
          >
            <AlertCircle size={16} className="shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xl ${
              uploading
                ? "bg-slate-400 cursor-not-allowed opacity-70"
                : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-indigo-600/25"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing & Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                <span>Publish Document</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}