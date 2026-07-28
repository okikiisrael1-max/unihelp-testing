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
  CheckCircle2,
  ChevronDown,
  Sparkles,
  GraduationCap,
  BookOpen,
  Loader2,
} from "lucide-react";

import { useEffect, useState, useMemo, useRef } from "react";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { db, auth } from "../../firebase/config";
import { uploadFile } from "../../services/cloudinary";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ALL_NIGERIAN_SCHOOLS,
  NIGERIAN_UNIVERSITIES,
  NIGERIAN_POLYTECHNICS,
  NIGERIAN_COLLEGES_OF_EDUCATION,
  COMMON_DEPARTMENTS,
} from "../data/nigerianSchools";

import { theme, fadeUp, stagger, scaleIn } from "../utils/theme";

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
  { value: "college_of_education", label: "College of Education", icon: School },
];


function SearchableSelect({ label, icon: Icon, value, onChange, options, placeholder, error, dark }) {
  const t = theme(dark);
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

  const displayText = selectedLabel
    ? selectedLabel.shortName
      ? `${selectedLabel.name} (${selectedLabel.shortName})`
      : selectedLabel.name || selectedLabel.label
    : "";

  return (
    <div className="relative" ref={ref}>
      <label className={`text-sm font-medium mb-1.5 block ${t.text}`}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-12 px-4 rounded-2xl border outline-none transition-all flex items-center gap-2.5 ${
          error ? "border-red-500" : ""
        } ${t.select} ${open ? t.selectActive : ""}`}
      >
        {Icon && <Icon size={18} className="shrink-0 opacity-50" />}
        <span className={`flex-1 text-left text-sm ${displayText ? "" : "opacity-40"}`}>
          {displayText || placeholder}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="opacity-40" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-20 w-full mt-1.5 rounded-2xl border max-h-64 overflow-y-auto shadow-xl backdrop-blur-2xl ${
              dark ? "bg-[#0f172a] border-white/[0.08]" : "bg-white border-slate-200"
            }`}
          >
            <div className={`sticky top-0 border-b ${dark ? "border-white/[0.06] bg-[#0f172a]" : "border-slate-200 bg-white"}`}>
              <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl m-2 ${t.surfaceSoft}`}>
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
                  onClick={() => { onChange(item); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-3 transition text-sm flex items-center gap-2.5 ${
                    dark ? "hover:bg-white/[0.06]" : "hover:bg-indigo-50"
                  } ${value === (item.id || item.name) ? "bg-indigo-500/10 text-indigo-600" : ""}`}
                >
                  <span className="flex-1 font-medium">
                    {item.name || item.label}
                    {item.shortName && <span className="opacity-50 ml-1">({item.shortName})</span>}
                  </span>
                  {item.faculty && <span className="text-xs opacity-50">{item.faculty}</span>}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm opacity-50">No results found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

export default function UploadFile({ dark }) {
  const t = theme(dark);
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [schoolType, setSchoolType] = useState("university");

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

  // =========================
  // VALIDATION
  // =========================
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
    if (file.type.startsWith("image/")) return <ImageIcon className="text-pink-400" size={20} />;
    if (file.type === "application/pdf") return <FileText className="text-red-400" size={20} />;
    return <FileUpIcon className="text-emerald-400" size={20} />;
  };

  const handleUpload = async () => {
    if (!auth.currentUser) { setError("⚠️ Please login first"); return; }
    if (!isFormValid()) { setError("⚠️ Fill all fields and add files"); return; }
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
      navigate("/questions");
    } catch { setError("❌ Upload failed. Try again."); }
    setUploading(false);
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Upload Past Questions</h1>
          <p className="text-sm opacity-70">Files are automatically compressed 📦</p>
        </div>

        {/* FORM */}
        <div className={`p-5 rounded-xl ${dark ? "bg-[#111827]" : "bg-white"}`}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UploadCloud size={18} />
            Document Details
          </h2>

          <div className="grid gap-3">
            {/* School Type */}
            <div>
              <label className="text-sm font-medium mb-1.5 block opacity-80">School Type</label>
              <div className="flex flex-wrap gap-2">
                {SCHOOL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setSchoolType(t.value);
                      setForm({ ...form, school: "" });
                    }}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      schoolType === t.value ? "bg-indigo-500 text-white border-indigo-500" : ""
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* School - Searchable Dropdown */}
            <SearchableSelect
              label={schoolType === "university" ? "University" : schoolType === "polytechnic" ? "Polytechnic" : "College of Education"}
              icon={School}
              value={form.school}
              onChange={(item) => setForm({ ...form, school: item.name })}
              options={filteredSchools}
              placeholder="Search for your school..."
            />

            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-1.5 block opacity-80">Title</label>
              <input
                placeholder="e.g. Mid-semester test"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`p-3 rounded-xl border outline-none w-full ${
                  dark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>

            {/* Course Code */}
            <div>
              <label className="text-sm font-medium mb-1.5 block opacity-80">Course Code</label>
              <input
                placeholder="e.g. CSC 301"
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                className={`p-3 rounded-xl border outline-none w-full ${
                  dark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>

            {/* Year */}
            <div>
              <label className="text-sm font-medium mb-1.5 block opacity-80">Year</label>
              <input
                placeholder="e.g. 2024"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className={`p-3 rounded-xl border outline-none w-full ${
                  dark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>

            {/* Department - Searchable Dropdown */}
            <SearchableSelect
              label="Department"
              icon={Library}
              value={form.department}
              onChange={(item) => setForm({ ...form, department: item.name })}
              options={departments}
              placeholder="Search for your department..."
            />

            {/* Level - Searchable Dropdown */}
            <SearchableSelect
              label="Level"
              icon={Layers}
              value={form.level}
              onChange={(item) => setForm({ ...form, level: item.value })}
              options={levels}
              placeholder="Select your level..."
            />
          </div>
        </div>

        {/* DROP ZONE */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            dragActive ? "border-indigo-500 scale-105" : "border-gray-400"
          } ${dark ? "bg-[#111827]" : "bg-white"}`}
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
          <label htmlFor="fileInput" className="cursor-pointer">
            <Plus size={30} className="mx-auto mb-2" />
            <p className="text-sm">Drag & Drop files or click to upload</p>
            <p className="text-xs opacity-60 mt-1">Images, PDF, DOC, DOCX supported</p>
          </label>
        </div>

        {/* FILES */}
        {files.length > 0 && (
          <div className={`p-5 rounded-xl ${dark ? "bg-[#111827]" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileUpIcon size={18} />
                Selected Files ({files.length})
              </h2>
              <button onClick={() => { setFiles([]); setProgress({}); }} className="text-sm text-red-500 hover:underline">Clear All</button>
            </div>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.name} className={`p-3 rounded-lg flex flex-col gap-2 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs opacity-60">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(file.name)}><X className="text-red-500 hover:scale-110 transition" /></button>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progress[file.name] || 0}%` }} />
                  </div>
                  <p className="text-xs text-right opacity-60">{progress[file.name] || 0}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {previewUrl && (
          <div className={`mt-5 overflow-hidden rounded-3xl border ${dark ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
              <div>
                <p className="text-sm font-semibold">Selected PDF preview</p>
                <p className="text-xs opacity-60">Review the selected PDF before uploading.</p>
              </div>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">Open</a>
            </div>
            <div className="h-72 md:h-[28rem]">
              <iframe src={previewUrl} title="Selected PDF Preview" className="h-full w-full" style={{ border: "none" }} />
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm justify-center">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* BUTTON */}
        <div className="text-center">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              uploading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            {uploading ? "Uploading..." : "Compress & Upload"}
          </button>
          {!uploading && files.length === 0 && (
            <p className="text-xs opacity-60 mt-2">Automatic compression helps reduce storage costs</p>
          )}
        </div>

      </div>
    </div>
  );
}