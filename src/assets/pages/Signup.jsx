import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  Target,
  Upload,
  User2,
  School,
  Library,
  Layers,
  Check,
  ChevronDown,
  Search,
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

  const bg = dark ? "bg-[#020617] text-white" : "bg-[#f8fafc] text-black";
  const glass = dark ? "bg-white/5 border border-white/10 backdrop-blur-2xl" : "bg-white border border-gray-200";
  const inputStyle = dark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-indigo-500" : "bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-indigo-500";
  const muted = dark ? "text-gray-400" : "text-gray-500";

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
  const filteredDepartments = COMMON_DEPARTMENTS.filter((d) =>
    d.name?.toLowerCase().includes(deptSearch.toLowerCase())
  );

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

  return (
    <div className={`min-h-screen relative overflow-y-auto overflow-x-hidden ${bg}`}>
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/20 blur-3xl rounded-full" />
      <div className="relative z-10 min-h-screen flex">
        <div className="hidden lg:flex w-1/2 p-10 xl:p-14 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap size={28} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-2xl">UniHelp.ng</h1>
                <p className="text-sm opacity-70">Smart student platform</p>
              </div>
            </div>
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-black leading-tight">Learn.<br />Prepare.<br /><span className="text-indigo-500">Succeed.</span></h1>
              <p className="mt-6 text-lg opacity-70 leading-relaxed">One platform for JAMB students and university students to learn, practice, collaborate and grow.</p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-5">
              {[
                { icon: <Target size={22} />, title: "JAMB CBT Practice", desc: "Real CBT simulation with timer and scores", color: "from-green-500 to-emerald-600" },
                { icon: <Calculator size={22} />, title: "CGPA Calculator", desc: "Track academic performance easily", color: "from-indigo-500 to-purple-600" },
                { icon: <Upload size={22} />, title: "Lecture Notes", desc: "Upload and access learning materials", color: "from-orange-500 to-red-500" },
                { icon: <User2 size={22} />, title: "Student Community", desc: "Connect and grow with students", color: "from-pink-500 to-rose-500" },
              ].map((item, index) => (
                <div key={index} className={`${glass} rounded-3xl p-5 flex gap-4 hover:scale-[1.02] transition-all duration-300`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0`}>{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="opacity-70 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mt-10">
            <p className="text-sm opacity-50">© 2026 UniHelp.ng</p>
            <div className="flex items-center gap-2 text-sm opacity-60"><Sparkles size={16} /><span>Built for Nigerian students</span></div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10">
          <div className={`w-full max-w-lg rounded-[32px] p-6 md:p-8 ${glass} shadow-2xl`}>
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center"><GraduationCap className="text-white" /></div>
              <div>
                <h1 className="font-black text-2xl">UniHelp.ng</h1>
                <p className="text-sm opacity-70">Smart student platform</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-black">Create Account</h2>
              <p className={`opacity-70 mt-2 text-sm ${muted}`}>{step === 1 ? "Step 1: Basic Information" : "Step 2: Academic Information"}</p>
            </div>

            <div className="flex items-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-indigo-500 text-white" : glass}`}>
                    {step > s ? <Check size={16} /> : s}
                  </div>
                  {s < 2 && <div className={`w-12 h-1 rounded-full ${step > s ? "bg-indigo-500" : "bg-gray-200 dark:bg-white/10"}`} />}
                </div>
              ))}
              <span className={`text-xs ${muted} ml-2`}>Step {step} of 2</span>
            </div>

            <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block opacity-80">First Name</label>
                      <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" className={`w-full h-12 px-4 rounded-2xl border outline-none transition-all ${inputStyle} ${errors.firstName ? 'border-red-500' : ''}`} />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block opacity-80">Last Name</label>
                      <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" className={`w-full h-12 px-4 rounded-2xl border outline-none transition-all ${inputStyle} ${errors.lastName ? 'border-red-500' : ''}`} />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Username</label>
                    <div className="relative">
                      <User2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                      <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="your_username" className={`w-full h-12 pl-11 pr-4 rounded-2xl border outline-none transition-all ${inputStyle} ${errors.username ? 'border-red-500' : ''}`} />
                      {form.username.length >= 3 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          {usernameAvailable === true ? <CheckCircle2 size={18} className="text-green-500" /> : usernameAvailable === false ? <X size={18} className="text-red-500" /> : null}
                        </span>
                      )}
                    </div>
                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    {usernameAvailable === true && <p className="text-green-500 text-xs mt-1">Username is available!</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className={`w-full h-12 pl-11 pr-4 rounded-2xl border outline-none transition-all ${inputStyle} ${errors.email ? 'border-red-500' : ''}`} />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                      <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" className={`w-full h-12 pl-11 pr-12 rounded-2xl border outline-none transition-all ${inputStyle} ${errors.password ? 'border-red-500' : ''}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block opacity-80">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                      {STUDENT_TYPES.map((t) => (
                        <button key={t.value} type="button" onClick={() => setForm({ ...form, studentType: t.value, schoolId: "", schoolName: "", departmentId: "", departmentName: "", faculty: "", level: "" })}
                          className={`p-4 rounded-2xl border text-left transition-all ${form.studentType === t.value ? "border-indigo-500 bg-indigo-500/10" : glass}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.studentType === t.value ? "border-indigo-500" : "border-gray-400"}`}>
                              {form.studentType === t.value && <div className="w-3 h-3 rounded-full bg-indigo-500" />}
                            </div>
                            <span className="font-medium text-sm">{t.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.studentType && <p className="text-red-500 text-xs mt-1">{errors.studentType}</p>}
                  </div>

                  {form.studentType === "university" && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block opacity-80">School Type</label>
                        <div className="flex flex-wrap gap-2">
                          {SCHOOL_TYPES.map((t) => (
                            <button key={t.value} type="button" onClick={() => { setForm({ ...form, schoolType: t.value, schoolId: "", schoolName: "", departmentId: "", departmentName: "" }); setSchoolSearch(""); }}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${form.schoolType === t.value ? "bg-indigo-500 text-white border-indigo-500" : glass}`}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <label className="text-sm font-medium mb-1.5 block opacity-80">
                          {form.schoolType === "university" ? "University" : form.schoolType === "polytechnic" ? "Polytechnic" : "College of Education"}
                        </label>
                        <div className="relative">
                          <School size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 z-10" />
                          <input type="text" readOnly value={form.schoolName || ""} placeholder="Select from the list below..."
                            className={`w-full h-12 pl-11 pr-4 rounded-2xl border outline-none cursor-pointer ${inputStyle} ${errors.schoolId ? 'border-red-500' : ''}`}
                            onClick={() => setShowSchoolDropdown(!showSchoolDropdown)} onFocus={() => setShowSchoolDropdown(true)} />
                          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                        </div>
                        {showSchoolDropdown && (
                          <div className={`absolute z-20 w-full mt-1 rounded-2xl border max-h-48 overflow-y-auto ${glass} shadow-lg`}>
                            <div className="sticky top-0 p-2 border-b" style={{ backgroundColor: dark ? "#0f1729" : "#FFFFFF" }}>
                              <input type="text" value={schoolSearch} onChange={(e) => { setSchoolSearch(e.target.value); setForm({ ...form, schoolId: "", schoolName: "" }); }} placeholder="Search schools..." className={`w-full h-10 px-3 rounded-xl border text-sm outline-none ${inputStyle}`} autoFocus />
                            </div>
                            {filteredSchools.length > 0 ? filteredSchools.map((s, i) => (
                              <button key={`${s.name}-${i}`} type="button" onClick={() => { setForm({ ...form, schoolId: `${s.type || form.schoolType}-${i}`, schoolName: s.name, departmentId: "", departmentName: "" }); setSchoolSearch(""); setShowSchoolDropdown(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition text-sm">
                                <span className="font-medium">{s.name}</span>
                                {s.shortName && <span className={`${muted} ml-1`}>({s.shortName})</span>}
                                <span className={`${muted} text-xs ml-2 opacity-60`}>{s.state}</span>
                              </button>
                            )) : (
                              <div className="px-4 py-6 text-center text-sm opacity-60">No schools found matching "{schoolSearch}"</div>
                            )}
                          </div>
                        )}
                        {errors.schoolId && <p className="text-red-500 text-xs mt-1">{errors.schoolId}</p>}
                        {form.schoolName && <p className="text-emerald-500 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Selected: {form.schoolName}</p>}
                      </div>

                      <div className="relative">
                        <label className="text-sm font-medium mb-1.5 block opacity-80">Department</label>
                        <div className="relative">
                          <Library size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 z-10" />
                          <input type="text" readOnly value={form.departmentName || ""} placeholder="Select from the list below..."
                            className={`w-full h-12 pl-11 pr-4 rounded-2xl border outline-none cursor-pointer ${inputStyle} ${errors.departmentId ? 'border-red-500' : ''}`}
                            onClick={() => setShowDeptDropdown(!showDeptDropdown)} onFocus={() => setShowDeptDropdown(true)} />
                          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                        </div>
                        {showDeptDropdown && (
                          <div className={`absolute z-20 w-full mt-1 rounded-2xl border max-h-48 overflow-y-auto ${glass} shadow-lg`}>
                            <div className="sticky top-0 p-2 border-b" style={{ backgroundColor: dark ? "#0f1729" : "#FFFFFF" }}>
                              <input type="text" value={deptSearch} onChange={(e) => { setDeptSearch(e.target.value); setForm({ ...form, departmentId: "", departmentName: "" }); }} placeholder="Search departments..." className={`w-full h-10 px-3 rounded-xl border text-sm outline-none ${inputStyle}`} autoFocus />
                            </div>
                            {filteredDepartments.length > 0 ? filteredDepartments.map((d, i) => (
                              <button key={`${d.name}-${i}`} type="button" onClick={() => { setForm({ ...form, departmentId: `dept-${i}`, departmentName: d.name, faculty: d.faculty || "" }); setDeptSearch(""); setShowDeptDropdown(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition text-sm">
                                <span className="font-medium">{d.name}</span>
                                {d.faculty && <span className={`${muted} text-xs ml-2`}>{d.faculty}</span>}
                              </button>
                            )) : (
                              <div className="px-4 py-6 text-center text-sm opacity-60">No departments found matching "{deptSearch}"</div>
                            )}
                          </div>
                        )}
                        {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
                        {form.departmentName && <p className="text-emerald-500 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Selected: {form.departmentName}</p>}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block opacity-80">Academic Level</label>
                        <div className="flex flex-wrap gap-2">
                          {ACADEMIC_LEVELS.map((l) => (
                            <button key={l.value} type="button" onClick={() => setForm({ ...form, level: l.value })}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${form.level === l.value ? "bg-indigo-500 text-white border-indigo-500" : glass}`}>
                              {l.label}
                            </button>
                          ))}
                        </div>
                        {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
                      </div>
                    </>
                  )}

                  {form.studentType === "jamb" && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block opacity-80">Preferred Course</label>
                        <input type="text" value={form.preferredCourse} onChange={(e) => setForm({ ...form, preferredCourse: e.target.value })} placeholder="e.g. Computer Science" className={`w-full h-12 px-4 rounded-2xl border outline-none transition-all ${inputStyle} ${errors.preferredCourse ? 'border-red-500' : ''}`} />
                        {errors.preferredCourse && <p className="text-red-500 text-xs mt-1">{errors.preferredCourse}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block opacity-80">Target University (optional)</label>
                        <input type="text" value={form.targetUniversity} onChange={(e) => setForm({ ...form, targetUniversity: e.target.value })} placeholder="e.g. University of Lagos" className={`w-full h-12 px-4 rounded-2xl border outline-none transition-all ${inputStyle}`} />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button type="button" onClick={handleBack}
                    className="w-1/3 h-12 rounded-2xl border font-semibold transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                    style={dark ? { borderColor: 'rgba(255,255,255,0.1)', color: '#fff' } : { borderColor: '#e5e7eb', color: '#000' }}>
                    <ArrowLeft size={18} /> Back
                  </button>
                )}
                {step < 2 ? (
                  <button type="button" onClick={handleNext}
                    className="flex-1 h-12 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 hover:scale-[1.01]">
                    Continue <ArrowRight size={18} />
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading}
                    className={`flex-1 h-12 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${isLoading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600 hover:scale-[1.01]"}`}>
                    {isLoading ? <><Loader2 className="animate-spin" /> Creating Account...</> : <><Sparkles size={18} /> Create Account</>}
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-sm opacity-50">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button onClick={handleGoogleSignup} disabled={isLoading}
              className={`w-full h-12 rounded-2xl border transition-all flex items-center justify-center gap-3 ${dark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 hover:bg-gray-50"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
              <img src={Images.google_logo} alt="Google" className="w-6 h-6 object-contain" />
              <span className="font-medium">Continue with Google</span>
            </button>

            <p className="text-center text-sm opacity-70 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-500 hover:text-indigo-400 font-semibold">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;