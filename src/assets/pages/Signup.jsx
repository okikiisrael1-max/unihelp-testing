import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  Library,
  Loader2,
  Lock,
  Mail,
  School,
  Sparkles,
  Target,
  Upload,
  User2,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Images } from "../data/data";
import { auth, db } from "../../firebase/config";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { NIGERIAN_UNIVERSITIES, NIGERIAN_POLYTECHNICS, NIGERIAN_COLLEGES_OF_EDUCATION, ALL_NIGERIAN_SCHOOLS, COMMON_DEPARTMENTS } from "../data/nigerianSchools";

const ACADEMIC_LEVELS = [
  { value: "100", label: "100L" },
  { value: "200", label: "200L" },
  { value: "300", label: "300L" },
  { value: "400", label: "400L" },
  { value: "500", label: "500L" },
  { value: "600", label: "600L" },
];

const SCHOOL_TYPES = [
  { value: "university", label: "University" },
  { value: "polytechnic", label: "Polytechnic" },
  { value: "college_of_education", label: "College of Education" },
];

const STUDENT_TYPES = [
  { value: "university", label: "University Student" },
  { value: "jamb", label: "JAMB Aspirant" },
];

// Fake-but-real-feeling "course codes" for each platform feature — reads like a
// Nigerian transcript, which is the whole point of the design (see FEATURES row).
const FEATURES = [
  { code: "JMB 101", icon: Target, title: "JAMB CBT Practice", desc: "Real CBT simulation with timer and scoring" },
  { code: "GPA 204", icon: Calculator, title: "CGPA Calculator", desc: "Track your academic performance with ease" },
  { code: "LIB 110", icon: Upload, title: "Lecture Notes", desc: "Upload and access learning materials anytime" },
  { code: "SOC 150", icon: User2, title: "Student Community", desc: "Connect and grow with students like you" },
];

const FONT_SERIF = "'IBM Plex Serif', Georgia, serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";
const FONT_SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const Signup = ({ dark }) => {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("profile");
  provider.addScope("email");

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", username: "", email: "", password: "",
    schoolId: "", schoolName: "", schoolType: "university",
    departmentId: "", departmentName: "",
    faculty: "", level: "", studentType: "university", preferredCourse: "", targetUniversity: "",
  });
  const [errors, setErrors] = useState({});
  const [schoolSearch, setSchoolSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [formNo] = useState(() => `UH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);

  // Load IBM Plex at runtime so this file works without touching index.html.
  useEffect(() => {
    const id = "unihelp-plex-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // ---- theme tokens: Unihelp brand palette ----
  const page = dark ? "bg-[#0F172A] text-[#F8FAFC]" : "bg-[#F6F8FC] text-[#0F172A]";
  const card = dark ? "bg-[#111827]/90 border border-[#334155] backdrop-blur-xl" : "bg-white border border-[#E2E8F0]";
  const inputStyle = dark
    ? "bg-[#1E293B] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#818CF8]"
    : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#4F46E5]";
  const muted = dark ? "text-[#94A3B8]" : "text-[#64748B]";
  const hairline = dark ? "border-[#334155]" : "border-[#E2E8F0]";
  const accentText = dark ? "text-[#C7D2FE]" : "text-[#4338CA]";
  const amberText = dark ? "text-[#38BDF8]" : "text-[#0EA5E9]";
  const accentBtn = dark
    ? "bg-[#6366F1] hover:bg-[#818CF8] text-white"
    : "bg-[#4F46E5] hover:bg-[#4338CA] text-white";
  const chip = (active) =>
    active
      ? `${accentBtn} border-transparent`
      : `${dark ? "bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#263449]" : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#EEF2FF]"}`;

  const getFilteredSchools = () => {
    let schools = [];
    if (form.schoolType === "university") schools = NIGERIAN_UNIVERSITIES;
    else if (form.schoolType === "polytechnic") schools = NIGERIAN_POLYTECHNICS;
    else if (form.schoolType === "college_of_education") schools = NIGERIAN_COLLEGES_OF_EDUCATION;
    else schools = ALL_NIGERIAN_SCHOOLS;
    if (!schoolSearch.trim()) return schools;
    const q = schoolSearch.toLowerCase();
    return schools.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.shortName?.toLowerCase().includes(q)
    );
  };

  const filteredSchools = getFilteredSchools();
  const filteredDepartments = COMMON_DEPARTMENTS.filter((d) => {
    const q = deptSearch.trim().toLowerCase();
    if (!q) return true;
    return d.name?.toLowerCase().includes(q) || d.faculty?.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!form.username || form.username.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, "users"), where("usernameLower", "==", form.username.trim().toLowerCase()));
        const snap = await getDocs(q);
        setUsernameAvailable(snap.empty);
      } catch { setUsernameAvailable(null); }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.username]);

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim()) errs.lastName = "Last name is required";
      if (!form.username.trim()) errs.username = "Username is required";
      else if (form.username.length < 3) errs.username = "Username must be at least 3 characters";
      else if (usernameAvailable === false) errs.username = "Username is already taken";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email address";
      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    }
    if (s === 2) {
      if (!form.studentType) errs.studentType = "Select your student type";
      if (form.studentType === "university") {
        if (!form.schoolId) errs.schoolId = "Select your school";
        if (!form.departmentId) errs.departmentId = "Select your department";
        if (!form.level) errs.level = "Select your level";
      }
      if (form.studentType === "jamb") {
        if (!form.preferredCourse.trim()) errs.preferredCourse = "Enter your preferred course";
      }
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) { setStep(step - 1); setErrors({}); } };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validateStep(2);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    try {
      setIsLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = credential.user;
      const displayName = `${form.firstName} ${form.lastName}`.trim();
      await updateProfile(user, { displayName });
      const schoolData = ALL_NIGERIAN_SCHOOLS.find((s) => s.name === form.schoolName) || {};
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: form.firstName,
        lastName: form.lastName,
        displayName,
        username: form.username.trim(),
        usernameLower: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        role: form.studentType,
        universityId: form.schoolId || "",
        universityName: form.schoolName || "",
        universityType: schoolData.type || form.schoolType || "",
        schoolType: form.schoolType || "",
        departmentId: form.departmentId || "",
        departmentName: form.departmentName || "",
        faculty: form.faculty || "",
        level: form.level || "",
        studentType: form.studentType,
        preferredCourse: form.preferredCourse || "",
        targetUniversity: form.targetUniversity || "",
        photo: "",
        provider: "email",
        points: 0,
        xp: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("Account created successfully!");
      navigate(form.studentType === "jamb" ? "/jamb" : "/");
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use": toast.error("Email already exists"); break;
        case "auth/invalid-email": toast.error("Invalid email address"); break;
        case "auth/weak-password": toast.error("Password is too weak"); break;
        default: toast.error("Unable to create account");
      }
    } finally { setIsLoading(false); }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          username: user.displayName || "Student",
          usernameLower: (user.displayName || "Student").trim().toLowerCase(),
          email: user.email,
          role: "",
          photo: user.photoURL || "",
          provider: "google",
          createdAt: serverTimestamp(),
        });
      }
      const role = userSnap.data()?.role || null;
      toast.success("Google login successful");
      navigate(role ? "/" : "/select-role");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        toast.error("Google popup closed");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Google popup blocked by the browser");
      } else {
        toast.error("Google signup failed");
      }
    } finally { setIsLoading(false); }
  };

  const STEPS = [
    { n: 1, label: "Bio Data" },
    { n: 2, label: "Academic Info" },
  ];

  return (
    <div className={`min-h-screen relative overflow-y-auto overflow-x-hidden ${page}`} style={{ fontFamily: FONT_SANS }}>
      <div className="relative z-10 min-h-screen flex">
        {/* ---------------- LEFT: letterhead / transcript ---------------- */}
        <div
          className="hidden lg:flex w-1/2 p-10 xl:p-14 flex-col justify-between relative"
          style={{
            backgroundImage: dark
              ? "repeating-linear-gradient(180deg, transparent, transparent 27px, rgba(129,140,248,0.07) 28px)"
              : "repeating-linear-gradient(180deg, transparent, transparent 27px, rgba(79,70,229,0.07) 28px)",
          }}
        >
          {/* exercise-book margin rule */}
          <div className={`absolute top-0 bottom-0 left-16 xl:left-20 w-px ${dark ? "bg-[#38BDF8]/30" : "bg-[#4F46E5]/25"}`} />

          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${accentBtn}`}>
                <GraduationCap size={26} />
              </div>
              <div>
                <h1 className="font-bold text-2xl tracking-tight" >UniHelp.ng</h1>
                <p className={`text-[11px] uppercase tracking-[0.2em] ${muted}`} >Admissions Office</p>
              </div>
            </div>

            <div className="max-w-xl">
              <p className={`text-[11px] uppercase tracking-[0.25em] mb-3 ${amberText}`} style={{ fontFamily: FONT_MONO }}>
                2026 Intake &middot; Now Open
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight" style={{ fontFamily: FONT_SERIF }}>
                Learn.<br />Prepare.<br /><span className={accentText}>Succeed.</span>
              </h1>
              <p className={`mt-6 text-base leading-relaxed ${muted}`}>
                One platform for JAMB aspirants and university students to learn, practice, collaborate and grow.
              </p>
            </div>

            {/* transcript-style feature list */}
            <div className="mt-12 max-w-xl">
              <div className={`flex items-center justify-between text-[10px] uppercase tracking-[0.2em] pb-2 mb-1 border-b ${hairline} ${muted}`} style={{ fontFamily: FONT_MONO }}>
                <span>Course</span>
                <span>Status</span>
              </div>
              {FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className={`flex items-center justify-between gap-4 py-3 ${index < FEATURES.length - 1 ? `border-b ${hairline}` : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded border ${dark ? "border-[#334155] text-[#CBD5E1]" : "border-[#E2E8F0] text-[#475569]"}`}
                        style={{ fontFamily: FONT_MONO }}
                      >
                        {item.code}
                      </span>
                      <Icon size={16} className={`shrink-0 ${accentText}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <p className={`text-xs truncate ${muted}`}>{item.desc}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold ${accentText}`}>
                      <Check size={14} /> Included
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-10">
            <p className={`text-xs ${muted}`} style={{ fontFamily: FONT_MONO }}>&copy; 2026 UniHelp.ng</p>
            <div className={`flex items-center gap-2 text-xs ${muted}`}>
              <Sparkles size={14} /><span>Built for Nigerian students</span>
            </div>
          </div>
        </div>

        {/* ---------------- RIGHT: the form ---------------- */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10">
          <div className={`relative w-full max-w-lg rounded-2xl p-6 md:p-8 ${card} shadow-xl`}>
            {/* form stub */}
            <div
              className={`hidden sm:block absolute -top-3 -right-3 rotate-2 px-3 py-1.5 rounded-md text-[10px] tracking-widest uppercase shadow-sm ${dark ? "bg-[#111827] border border-[#334155] text-[#CBD5E1]" : "bg-white border border-[#E2E8F0] text-[#475569]"}`}
              style={{ fontFamily: FONT_MONO, borderLeftWidth: 2, borderLeftStyle: "dashed", borderLeftColor: dark ? "#818CF8" : "#4F46E5" }}
            >
              Form No. {formNo}
            </div>

            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${accentBtn}`}><GraduationCap size={24} /></div>
              <div>
                <h1 className="font-bold text-2xl" style={{ fontFamily: FONT_SERIF }}>UniHelp.ng</h1>
              </div>
            </div>

            <div className="text-center mb-6">
  
              <h2 className="text-3xl md:text-4xl font-semibold" >Create Account</h2>
            </div>

            {/* OMR-style step indicator */}
            <div className="flex items-center mb-8">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.n}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        step > s.n
                          ? `${dark ? "bg-[#6366F1] border-[#6366F1]" : "bg-[#4F46E5] border-[#4F46E5]"} text-white`
                          : step === s.n
                          ? `${accentText} ${dark ? "border-[#818CF8]" : "border-[#4F46E5]"}`
                          : `${muted} ${hairline}`
                      }`}
                    >
                      {step > s.n ? <Check size={15} /> : <span className="text-xs font-semibold" style={{ fontFamily: FONT_MONO }}>{s.n}</span>}
                    </div>
                    <span className={`text-[9px] uppercase tracking-[0.15em] ${step >= s.n ? accentText : muted}`} style={{ fontFamily: FONT_MONO }}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0 border-t-2 border-dashed mx-2 mb-4 ${step > s.n ? (dark ? "border-[#6366F1]" : "border-[#4F46E5]") : hairline}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>First Name</label>
                      <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" className={`w-full h-12 px-4 rounded-lg border outline-none transition-all ${inputStyle} ${errors.firstName ? 'border-red-500' : ''}`} />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.firstName}</p>}
                    </div>
                    <div>
                      <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Last Name</label>
                      <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" className={`w-full h-12 px-4 rounded-lg border outline-none transition-all ${inputStyle} ${errors.lastName ? 'border-red-500' : ''}`} />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Username</label>
                    <div className="relative">
                      <User2 size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${muted}`} />
                      <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="your_username" className={`w-full h-12 pl-11 pr-4 rounded-lg border outline-none transition-all ${inputStyle} ${errors.username ? 'border-red-500' : ''}`} />
                      {form.username.length >= 3 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          {usernameAvailable === true ? <CheckCircle2 size={18} className={accentText} /> : usernameAvailable === false ? <X size={18} className="text-red-500" /> : null}
                        </span>
                      )}
                    </div>
                    {errors.username && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.username}</p>}
                    {usernameAvailable === true && (
                      <p className={`text-xs mt-1 font-semibold tracking-wide ${accentText}`} style={{ fontFamily: FONT_MONO }}>&#10003; VERIFIED &mdash; available</p>
                    )}
                  </div>
                  <div>
                    <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Email</label>
                    <div className="relative">
                      <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${muted}`} />
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className={`w-full h-12 pl-11 pr-4 rounded-lg border outline-none transition-all ${inputStyle} ${errors.email ? 'border-red-500' : ''}`} />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.email}</p>}
                  </div>
                  <div>
                    <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Password</label>
                    <div className="relative">
                      <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${muted}`} />
                      <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" className={`w-full h-12 pl-11 pr-12 rounded-lg border outline-none transition-all ${inputStyle} ${errors.password ? 'border-red-500' : ''}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${muted} hover:opacity-100`}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.password}</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                      {STUDENT_TYPES.map((t) => (
                        <button key={t.value} type="button" onClick={() => setForm({ ...form, studentType: t.value, schoolId: "", schoolName: "", departmentId: "", departmentName: "", faculty: "", level: "" })}
                          className={`p-4 rounded-xl border text-left transition-all ${form.studentType === t.value ? `${dark ? "border-[#818CF8] bg-[#6366F1]/15" : "border-[#4F46E5] bg-[#EEF2FF]"}` : `${card}`}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.studentType === t.value ? (dark ? "border-[#818CF8]" : "border-[#4F46E5]") : hairline}`}>
                              {form.studentType === t.value && <div className={`w-3 h-3 rounded-full ${dark ? "bg-[#818CF8]" : "bg-[#4F46E5]"}`} />}
                            </div>
                            <span className="font-medium text-sm">{t.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.studentType && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.studentType}</p>}
                  </div>

                  {form.studentType === "university" && (
                    <>
                      <div>
                        <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>School Type</label>
                        <div className="flex flex-wrap gap-2">
                          {SCHOOL_TYPES.map((t) => (
                            <button key={t.value} type="button" onClick={() => { setForm({ ...form, schoolType: t.value, schoolId: "", schoolName: "", departmentId: "", departmentName: "" }); setSchoolSearch(""); }}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${chip(form.schoolType === t.value)}`}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>
                          {form.schoolType === "university" ? "University" : form.schoolType === "polytechnic" ? "Polytechnic" : "College of Education"}
                        </label>
                        <div className="relative">
                          <School size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${muted}`} />
                          <input type="text" readOnly value={form.schoolName || ""} placeholder="Select from the list below..."
                            className={`w-full h-12 pl-11 pr-4 rounded-lg border outline-none cursor-pointer ${inputStyle} ${errors.schoolId ? 'border-red-500' : ''}`}
                            onClick={() => setShowSchoolDropdown(!showSchoolDropdown)} />
                          <ChevronDown size={18} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`} />
                        </div>
                        {showSchoolDropdown && (
                          <div className={`absolute z-20 w-full mt-1 rounded-xl border max-h-48 overflow-y-auto ${card} shadow-lg`}>
                            <div className={`sticky top-0 p-2 border-b ${hairline}`} style={{ backgroundColor: dark ? "#111827" : "#FFFFFF" }}>
                              <input type="text" value={schoolSearch} onChange={(e) => { setSchoolSearch(e.target.value); setForm({ ...form, schoolId: "", schoolName: "" }); }} placeholder="Search schools..." className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${inputStyle}`} autoFocus />
                            </div>
                            {filteredSchools.length > 0 ? filteredSchools.map((s, i) => (
                              <button key={`${s.name}-${i}`} type="button" onClick={() => { setForm({ ...form, schoolId: `${s.type || form.schoolType}-${i}`, schoolName: s.name, departmentId: "", departmentName: "" }); setSchoolSearch(""); setShowSchoolDropdown(false); }}
                                className={`w-full text-left px-4 py-3 transition text-sm ${dark ? "hover:bg-[#1E293B]" : "hover:bg-[#EEF2FF]"}`}>
                                <span className="font-medium">{s.name}</span>
                                {s.shortName && <span className={`${muted} ml-1`}>({s.shortName})</span>}
                                <span className={`${muted} text-xs ml-2 opacity-70`}>{s.state}</span>
                              </button>
                            )) : (
                              <div className={`px-4 py-6 text-center text-sm ${muted}`}>No schools found matching "{schoolSearch}"</div>
                            )}
                          </div>
                        )}
                        {errors.schoolId && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.schoolId}</p>}
                        {form.schoolName && <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${accentText}`}><CheckCircle2 size={12} /> Selected: {form.schoolName}</p>}
                      </div>

                      <div className="relative">
                        <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Department</label>
                        <div className="relative">
                          <Library size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${muted}`} />
                          <input type="text" readOnly value={form.departmentName || ""} placeholder="Select from the list below..."
                            className={`w-full h-12 pl-11 pr-4 rounded-lg border outline-none cursor-pointer ${inputStyle} ${errors.departmentId ? 'border-red-500' : ''}`}
                            onClick={() => setShowDeptDropdown(!showDeptDropdown)}/>
                          <ChevronDown size={18} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`} />
                        </div>
                        {showDeptDropdown && (
                          <div className={`absolute z-30 w-full mt-1 rounded-xl border max-h-72 overflow-y-auto ${card} shadow-lg`}>
                            <div className={`sticky top-0 p-2 border-b ${hairline}`} style={{ backgroundColor: dark ? "#111827" : "#FFFFFF" }}>
                              <input type="text" value={deptSearch} onChange={(e) => { setDeptSearch(e.target.value); setForm({ ...form, departmentId: "", departmentName: "" }); }} placeholder="Search department or faculty..." className={`w-full h-10 px-3 rounded-lg border text-sm outline-none ${inputStyle}`} autoFocus />
                            </div>
                            <div className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wide ${muted}`}>
                              {filteredDepartments.length} {filteredDepartments.length === 1 ? "department" : "departments"}
                            </div>
                            {filteredDepartments.length > 0 ? filteredDepartments.map((d, i) => (
                              <button key={`${d.name}-${i}`} type="button" onClick={() => { setForm({ ...form, departmentId: `dept-${i}`, departmentName: d.name, faculty: d.faculty || "" }); setDeptSearch(""); setShowDeptDropdown(false); }}
                                className={`w-full text-left px-4 py-3 transition text-sm flex items-center justify-between gap-3 ${dark ? "hover:bg-[#1E293B]" : "hover:bg-[#EEF2FF]"}`}>
                                <span className="font-medium">{d.name}</span>
                                {d.faculty && <span className={`${muted} text-xs shrink-0`}>{d.faculty}</span>}
                              </button>
                            )) : (
                              <div className={`px-4 py-8 text-center ${muted}`}>
                                <p className="text-sm font-semibold">No matching department</p>
                                <p className="mt-1 text-xs">Try a faculty name like Science, Engineering, Arts, Health, or Management.</p>
                              </div>
                            )}
                          </div>
                        )}
                        {errors.departmentId && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.departmentId}</p>}
                        {form.departmentName && <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${accentText}`}><CheckCircle2 size={12} /> Selected: {form.departmentName}</p>}
                      </div>

                      <div>
                        <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Academic Level</label>
                        <div className="flex flex-wrap gap-2">
                          {ACADEMIC_LEVELS.map((l) => (
                            <button key={l.value} type="button" onClick={() => setForm({ ...form, level: l.value })}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${chip(form.level === l.value)}`}>
                              {l.label}
                            </button>
                          ))}
                        </div>
                        {errors.level && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.level}</p>}
                      </div>
                    </>
                  )}

                  {form.studentType === "jamb" && (
                    <>
                      <div>
                        <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Preferred Course</label>
                        <input type="text" value={form.preferredCourse} onChange={(e) => setForm({ ...form, preferredCourse: e.target.value })} placeholder="e.g. Computer Science" className={`w-full h-12 px-4 rounded-lg border outline-none transition-all ${inputStyle} ${errors.preferredCourse ? 'border-red-500' : ''}`} />
                        {errors.preferredCourse && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: FONT_MONO }}>&times; {errors.preferredCourse}</p>}
                      </div>
                      <div>
                        <label className={`text-[11px] uppercase tracking-wider mb-1.5 block ${muted}`} style={{ fontFamily: FONT_MONO }}>Target University (optional)</label>
                        <input type="text" value={form.targetUniversity} onChange={(e) => setForm({ ...form, targetUniversity: e.target.value })} placeholder="e.g. University of Lagos" className={`w-full h-12 px-4 rounded-lg border outline-none transition-all ${inputStyle}`} />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button type="button" onClick={handleBack}
                    className={`w-1/3 h-12 rounded-lg border font-semibold transition-all flex items-center justify-center gap-2 ${dark ? "border-[#334155] text-white hover:bg-[#1E293B]" : "border-[#E2E8F0] text-[#0F172A] hover:bg-[#EEF2FF]"}`}>
                    <ArrowLeft size={18} /> Back
                  </button>
                )}
                {step < 2 ? (
                  <button type="button" onClick={handleNext}
                    className={`flex-1 h-12 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${accentBtn}`}>
                    Continue <ArrowRight size={18} />
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading}
                    className={`flex-1 h-12 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isLoading ? "opacity-60 cursor-not-allowed" : ""} ${accentBtn}`}>
                    {isLoading ? <><Loader2 className="animate-spin" size={18} /> Creating Account...</> : <><Sparkles size={18} /> Create Account</>}
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className={`flex-1 h-px ${dark ? "bg-[#334155]" : "bg-[#E2E8F0]"}`} />
              <span className={`text-xs uppercase tracking-widest ${muted}`} style={{ fontFamily: FONT_MONO }}>Or</span>
              <div className={`flex-1 h-px ${dark ? "bg-[#334155]" : "bg-[#E2E8F0]"}`} />
            </div>

            <button onClick={handleGoogleSignup} disabled={isLoading}
              className={`w-full h-12 rounded-lg border transition-all flex items-center justify-center gap-3 ${dark ? "bg-[#1E293B] border-[#334155] hover:bg-[#263449]" : "bg-white border-[#E2E8F0] hover:bg-[#EEF2FF]"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
              <img src={Images.google_logo} alt="Google" className="w-6 h-6 object-contain" />
              <span className="font-medium">Continue with Google</span>
            </button>

            <p className={`text-center text-sm mt-6 ${muted}`}>
              Already have an account?{" "}
              <Link to="/login" className={`font-semibold ${accentText} hover:opacity-80`}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
