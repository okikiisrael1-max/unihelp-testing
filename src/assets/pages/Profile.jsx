import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  auth,
  db,
} from "../../firebase/config";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { toCloudinaryAsset, uploadImage } from "../../services/cloudinary";

import {
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Flame,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Pencil,
  Save,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User2,
  Users,
  WalletCards,
  X,
  Library,
  Layers,
} from "lucide-react";

import {
  AuthContext,
} from "../context/AuthContext";

import { NIGERIAN_UNIVERSITIES, NIGERIAN_POLYTECHNICS, NIGERIAN_COLLEGES_OF_EDUCATION, ALL_NIGERIAN_SCHOOLS, COMMON_DEPARTMENTS } from "../data/nigerianSchools";

const Profile = ({
  dark = false,
}) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // =====================================================
  // STATES
  // =====================================================

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [form, setForm] = useState({
    username: "",
    school: "",
    schoolType: "university",
    department: "",
    faculty: "",
    level: "",
    bio: "",
    location: "",
  });

  const [schoolSearch, setSchoolSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  const [communityStats, setCommunityStats] = useState({
    created: 0,
    joined: 0,
    mutual: 0,
  });
  const [challengeStats, setChallengeStats] = useState(null);

  // =====================================================
  // THEME
  // =====================================================

  const bg = dark ? "bg-[#030712] text-white" : "bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900";
  const glass = dark ? "bg-white/5 border border-white/10 backdrop-blur-3xl" : "bg-white/80 border border-slate-200/80 backdrop-blur-3xl shadow-xl shadow-slate-200/50";
  const card = dark ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200";
  const inputStyle = dark ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-indigo-500" : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const mutedLight = dark ? "text-slate-500" : "text-slate-400";

  // =====================================================
  // ROLE THEMES
  // =====================================================

  const roleThemes = {
    university: {
      label: "University",
      gradient: "from-indigo-500 via-blue-500 to-cyan-500",
      icon: <GraduationCap size={22} />,
      description: "Access CGPA tools, campus resources and university dashboard.",
    },
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <User2 size={16} /> },
    { id: "about", label: "About", icon: <BookOpen size={16} /> },
    { id: "achievements", label: "Achievements", icon: <Trophy size={16} /> },
    { id: "security", label: "Security", icon: <ShieldCheck size={16} /> },
  ];

  // =====================================================
  // FETCH FUNCTIONS
  // =====================================================

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchChallengeStats = async () => {
      try {
        const snap = await getDoc(doc(db, "challengeUsers", auth.currentUser.uid));
        if (snap.exists()) setChallengeStats(snap.data());
      } catch {}
    };
    fetchChallengeStats();
  }, []);

  const getRankColor = (rank) => {
    const colors = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#E5E4E2', Diamond: '#B9F2FF', Legend: '#FF6B35' };
    return colors[rank] || '#6366F1';
  };

  const fetchProfile = async () => {
    try {
      if (!auth.currentUser) { setLoading(false); return; }
      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        const schoolData = ALL_NIGERIAN_SCHOOLS.find(s => s.name === (data.school || data.universityName));
        setForm({
          username: data.username || "",
          school: data.school || data.universityName || "",
          schoolType: data.schoolType || schoolData?.type || "university",
          department: data.department || data.departmentName || "",
          faculty: data.faculty || "",
          level: data.level || "",
          bio: data.bio || "",
          location: data.location || "",
        });
      }
      const createdSnap = await getDocs(query(collection(db, "groups"), where("ownerId", "==", auth.currentUser.uid), limit(50)));
      const joinedSnap = await getDocs(query(collection(db, "users", auth.currentUser.uid, "groups"), limit(50)));
      setCommunityStats({ created: createdSnap.size, joined: joinedSnap.size, mutual: joinedSnap.size });
    } catch (error) { console.log(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave = async () => {
    try {
      setSaving(true);
      const ref = doc(db, "users", auth.currentUser.uid);
      const schoolData = ALL_NIGERIAN_SCHOOLS.find(s => s.name === form.school) || {};
      await setDoc(ref, {
        username: form.username,
        usernameLower: form.username.trim().toLowerCase(),
        school: form.school,
        universityName: form.school,
        schoolType: schoolData.type || form.schoolType || "",
        department: form.department,
        departmentName: form.department,
        faculty: form.faculty || "",
        level: form.level,
        bio: form.bio,
        location: form.location,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await updateProfile(auth.currentUser, { displayName: form.username });
      setMessage("Profile updated successfully 🚀");
      setEditOpen(false);
      fetchProfile();
    } catch (error) { console.log(error); setMessage("Failed to update profile"); }
    finally { setSaving(false); setTimeout(() => setMessage(""), 4000); }
  };

  // =====================================================
  // PHOTO UPLOAD
  // =====================================================

  const handlePhoto = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const result = await uploadImage(file);
      const url = result.secure_url;
      await updateProfile(auth.currentUser, { photoURL: url });
      await setDoc(doc(db, "users", auth.currentUser.uid), { photo: url, photoAsset: toCloudinaryAsset(result) }, { merge: true });
      fetchProfile();
      setMessage("Profile picture updated");
    } catch (error) { console.log(error); }
    finally { setUploading(false); }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try { await signOut(auth); navigate("/"); }
    catch (error) { console.log(error); }
  };

  // =====================================================
  // DERIVED
  // =====================================================

  const initial = useMemo(() => profile?.username?.charAt(0)?.toUpperCase() || "U", [profile]);
  const activeRole = roleThemes[profile?.role] || roleThemes.university;

  const getFilteredSchools = () => {
    let schools = [];
    if (form.schoolType === "university") schools = NIGERIAN_UNIVERSITIES;
    else if (form.schoolType === "polytechnic") schools = NIGERIAN_POLYTECHNICS;
    else if (form.schoolType === "college_of_education") schools = NIGERIAN_COLLEGES_OF_EDUCATION;
    else schools = ALL_NIGERIAN_SCHOOLS;
    if (!schoolSearch.trim()) return schools;
    const q = schoolSearch.toLowerCase();
    return schools.filter((s) => s.name?.toLowerCase().includes(q) || s.shortName?.toLowerCase().includes(q));
  };

  const filteredSchools = getFilteredSchools();
  const filteredDepartments = COMMON_DEPARTMENTS.filter((d) => d.name?.toLowerCase().includes(deptSearch.toLowerCase()));

  const profileStats = [
    { title: "Uploads", value: profile?.uploadCount || profile?.uploads || profile?.files || "0", icon: <BookOpen />, gradient: "from-indigo-500 to-purple-600" },
    { title: "XP Points", value: challengeStats?.xp?.toLocaleString() || "0", icon: <Trophy />, gradient: "from-yellow-500 to-orange-500" },
    { title: "Rank", value: challengeStats?.rank || "Not Set", icon: <Medal />, gradient: "from-pink-500 to-rose-500" },
    { title: "Streak", value: challengeStats?.currentStreak ? `${challengeStats.currentStreak}d` : "0d", icon: <Flame />, gradient: "from-cyan-500 to-blue-500" },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Loading Profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${bg} transition-all duration-500`}>
      {/* Ambient BG Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 blur-3xl rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 blur-3xl rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/5 blur-3xl rounded-full" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        
        {/* MESSAGE TOAST */}
        {message && (
          <div className="mb-4 animate-slideDown">
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl p-3 text-sm text-center font-medium backdrop-blur-xl">
              {message}
            </div>
          </div>
        )}

        {/* HERO SECTION */}
        <div className={`relative overflow-hidden rounded-[20px] md:rounded-[24px] p-5 md:p-6 lg:p-8 ${glass} mb-5 shadow-sm`}>
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            {/* LEFT - Avatar & Info */}
            <div className="flex flex-col sm:flex-row gap-5 lg:gap-6 items-center sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-500">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-3xl font-black text-white" style={{ backgroundColor: dark ? "#0f172a" : "#1e293b" }}>
                    {(profile?.photo || auth.currentUser?.photoURL) ? (
                      <img src={profile?.photo || auth.currentUser?.photoURL} alt="profile" className="w-full h-full object-cover" />
                    ) : ((profile?.username || auth.currentUser?.displayName) ? (profile?.username || auth.currentUser?.displayName)[0].toUpperCase() : "U")}
                  </div>
                </div>
                <label className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center cursor-pointer shadow-lg">
                  {uploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                  <input type="file" hidden accept="image/*" onChange={handlePhoto} />
                </label>
              </div>

              {/* Info */}
              <div className="text-center sm:text-left">
                <h1 className="text-xl md:text-3xl font-black tracking-tight">{profile?.username || auth.currentUser?.displayName || "Student Name"}</h1>
                <p className={`mt-0.5 text-xs font-medium ${muted}`}>@{(profile?.username || auth.currentUser?.displayName || "student").toLowerCase().replace(/\s+/g, '')} • Student</p>

                <div className={`mt-3 space-y-1.5 text-sm font-medium ${muted}`}>
                  {profile?.school && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <GraduationCap size={16} className="text-indigo-500 shrink-0" />
                      <span>{profile.school}</span>
                    </div>
                  )}
                  {profile?.department && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 sm:ml-0">
                      <Library size={16} className="text-slate-400 shrink-0 opacity-0 hidden sm:block" />
                      <span className="text-slate-400">{profile.department}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <MapPin size={16} className="text-indigo-500 shrink-0" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Calendar size={14} className="text-indigo-500 shrink-0" />
                    <span className="text-xs">Joined {auth.currentUser?.metadata?.creationTime?.slice(8, 16) || "May 2024"}</span>
                  </div>
                </div>
                  <button onClick={() => setEditOpen(true)} className={`mt-3 px-3 py-1.5 rounded-full border font-semibold text-[10px] transition-all flex items-center gap-1 mx-auto sm:mx-0 ${dark ? "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10" : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"}`}>
                  <Edit3 size={12} /> Edit Profile
                </button>
              </div>
            </div>
            </div>

            {/* RIGHT - UniHelp Rank */}
            <div className={`w-full lg:w-72 rounded-[20px] border p-5 ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'} shadow-sm shrink-0`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${muted}`}>UniHelp Rank</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                  <Star size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{challengeStats?.rank || "Novice"}</h3>
                </div>
              </div>
              <p className={`text-xs ${muted} mb-3 leading-tight`}>Keep learning to unlock more rewards!</p>
              
              <div className={`w-full h-1.5 rounded-full overflow-hidden mb-1.5 ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(((challengeStats?.xp || 0) % 500) / 500 * 100, 100)}%` }}></div>
              </div>
              <p className={`text-[10px] font-bold text-right ${muted}`}>{((challengeStats?.xp || 0) % 500).toLocaleString()} / 500 XP to next</p>
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className={`flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 rounded-[20px] p-3 md:p-4 ${glass} mb-5 shadow-sm overflow-x-auto`}>
          {[
            { icon: <BookOpen size={16} className="text-indigo-500" />, bg: "bg-indigo-500/10", label: "Uploads", value: profile?.uploadCount || profile?.uploads || profile?.files || "0" },
            { icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: "bg-emerald-500/10", label: "Questions Practiced", value: challengeStats?.questionsAnswered?.toLocaleString() || "0" },
            { icon: <Library size={16} className="text-rose-500" />, bg: "bg-rose-500/10", label: "Accuracy", value: challengeStats?.accuracy ? `${challengeStats.accuracy}%` : "0%" },
            { icon: <Flame size={16} className="text-orange-500" />, bg: "bg-orange-500/10", label: "Streak", value: challengeStats?.currentStreak ? `${challengeStats.currentStreak}d` : "0d" },
            { icon: <Layers size={16} className="text-blue-500" />, bg: "bg-blue-500/10", label: "XP Points", value: challengeStats?.xp?.toLocaleString() || "0" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2.5 min-w-[130px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase ${muted}`}>{stat.label}</p>
                <p className="text-base font-black leading-tight">{stat.value}</p>
              </div>
            </div>
          ))}
          
          <div className={`ml-auto pl-3 border-l ${dark ? 'border-white/10' : 'border-slate-200'}`}>
            <button className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${dark ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              Analytics
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            
            {/* About Me */}
            <div className={`rounded-[20px] p-5 md:p-6 ${glass} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">About Me</h3>
                <Pencil size={16} className="text-indigo-500 cursor-pointer" onClick={() => setEditOpen(true)} />
              </div>
              <p className={`text-sm ${muted} leading-relaxed mb-6 whitespace-pre-wrap`}>
                {profile?.bio || "No bio provided. Click the pencil icon to tell us about yourself."}
              </p>
              <div className={`space-y-3 text-sm font-medium ${muted}`}>
                <div className="flex items-center gap-3">
                  <Mail size={16} className={mutedLight} /> <span>{user?.email || "student@unihelp.com"}</span>
                </div>
                {profile?.location && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className={mutedLight} /> <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar size={16} className={mutedLight} /> <span>Joined {auth.currentUser?.metadata?.creationTime?.slice(4, 16) || "May 12, 2024"}</span>
                </div>
              </div>
            </div>

            {/* My Academic Info */}
            <div className={`rounded-[24px] p-6 md:p-8 ${glass} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">Academic Focus</h3>
                <Pencil size={16} className="text-indigo-500 cursor-pointer" onClick={() => setEditOpen(true)} />
              </div>
              <div className="flex flex-wrap gap-2">
                {[profile?.department, profile?.faculty, profile?.school, profile?.level ? `Level ${profile.level}` : ""].filter(Boolean).map((sub, idx) => (
                  <span key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${dark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{sub}</span>
                ))}
                {!profile?.department && !profile?.faculty && (
                   <span className={`text-sm font-medium ${muted}`}>No academic details added yet.</span>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className={`rounded-[24px] p-6 md:p-8 ${glass} shadow-sm`}>
              <h3 className="font-black text-lg mb-4">Account Settings</h3>
              <div className="space-y-1">
                {[
                  { label: "Edit Profile", action: () => setEditOpen(true) },
                  { label: "Change Password", action: () => {} },
                  { label: "Notification Preferences", action: () => {} },
                  { label: "Privacy Settings", action: () => {} },
                  { label: "Logout", action: handleLogout, color: "text-red-500" },
                ].map((item, i) => (
                  <div key={i} onClick={item.action} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${dark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} ${item.color || (dark ? 'text-slate-300' : 'text-slate-700')}`}>
                    <span className="font-semibold text-sm">{item.label}</span>
                    <ChevronDown size={16} className="opacity-40 -rotate-90" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            
            {/* My Recent Activity */}
            <div className={`rounded-[20px] p-5 md:p-6 ${glass} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">My Recent Activity</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className={`w-12 h-12 rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center mb-3`}>
                  <BookOpen size={20} className={muted} />
                </div>
                <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-800'}`}>No recent activity</p>
                <p className={`text-xs mt-1 max-w-[200px] ${muted}`}>Your recent studies, practice questions, and notes will appear here.</p>
              </div>
            </div>

            {/* Badges Earned */}
            <div className={`rounded-[20px] p-5 md:p-6 ${glass} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">Badges Earned</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className={`w-12 h-12 rounded-full ${dark ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center mb-3`}>
                  <Trophy size={20} className={muted} />
                </div>
                <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-800'}`}>No badges yet</p>
                <p className={`text-xs mt-1 max-w-[200px] ${muted}`}>Keep learning and engaging to unlock exclusive badges.</p>
              </div>
            </div>

          </div>
        </div>
      </div>


      {/* ======================== EDIT MODAL ======================== */}
      {editOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-3 md:p-4 overflow-y-auto">
          <div className={`${glass} w-full max-w-2xl rounded-[28px] md:rounded-[36px] p-5 md:p-8 relative max-h-[90vh] overflow-y-auto`}>
            {/* Close */}
            <button onClick={() => setEditOpen(false)} className="absolute top-4 right-4 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-500 flex items-center justify-center">
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Edit3 size={24} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black">Edit Profile</h2>
                <p className={`text-sm ${muted}`}>Update your account information</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {/* Username */}
              <div className="md:col-span-2">
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">Username</label>
                <div className="relative">
                  <User2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                  <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="your_username" className={`w-full h-12 pl-11 pr-4 rounded-2xl outline-none transition-all ${inputStyle}`} />
                </div>
              </div>

              {/* School Type */}
              <div>
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">School Type</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "university", label: "University" },
                    { value: "polytechnic", label: "Polytechnic" },
                    { value: "college_of_education", label: "College" },
                  ].map((t) => (
                    <button key={t.value} type="button" onClick={() => { setForm({ ...form, schoolType: t.value, school: "", department: "", faculty: "" }); setSchoolSearch(""); }}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-xs md:text-sm font-medium transition-all ${form.schoolType === t.value ? "bg-indigo-500 text-white border-indigo-500" : card}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* School */}
              <div className="relative">
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">School</label>
                <div className="relative">
                  <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 z-10" />
                  <input type="text" readOnly value={form.school || ""} placeholder="Select school..." className={`w-full h-12 pl-11 pr-9 rounded-2xl outline-none cursor-pointer ${inputStyle}`}
                    onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}/>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                </div>
                {showSchoolDropdown && (
                  <div className={`absolute z-20 w-full mt-1 rounded-2xl border max-h-44 overflow-y-auto ${glass} shadow-2xl`}>
                    <div className="sticky top-0 p-2 border-b" style={{ backgroundColor: dark ? "#0f1729" : "#FFFFFF" }}>
                      <input type="text" value={schoolSearch} onChange={(e) => { setSchoolSearch(e.target.value); setForm({ ...form, school: "", department: "" }); }} placeholder="Search schools..." className={`w-full h-10 px-3 rounded-xl border text-sm outline-none ${inputStyle}`} autoFocus />
                    </div>
                    {filteredSchools.length > 0 ? filteredSchools.map((s, i) => (
                      <button key={`${s.name}-${i}`} type="button" onClick={() => { setForm({ ...form, school: s.name, schoolType: s.type || form.schoolType }); setSchoolSearch(""); setShowSchoolDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition text-sm">
                        <span className="font-medium">{s.name}</span>
                        {s.shortName && <span className={`${muted} ml-1 text-xs`}>({s.shortName})</span>}
                        <span className={`${mutedLight} text-xs ml-2`}>{s.state}</span>
                      </button>
                    )) : (
                      <div className="px-4 py-6 text-center text-sm opacity-60">No schools found</div>
                    )}
                  </div>
                )}
                {form.school && <p className="text-emerald-500 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> {form.school}</p>}
              </div>

              {/* Department */}
              <div className="relative">
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">Department</label>
                <div className="relative">
                  <Library size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 z-10" />
                  <input type="text" readOnly value={form.department || ""} placeholder="Select department..." className={`w-full h-12 pl-11 pr-9 rounded-2xl outline-none cursor-pointer ${inputStyle}`}
                    onClick={() => setShowDeptDropdown(!showDeptDropdown)} />
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                </div>
                {showDeptDropdown && (
                  <div className={`absolute z-20 w-full mt-1 rounded-2xl border max-h-44 overflow-y-auto ${glass} shadow-2xl`}>
                    <div className="sticky top-0 p-2 border-b" style={{ backgroundColor: dark ? "#0f1729" : "#FFFFFF" }}>
                      <input type="text" value={deptSearch} onChange={(e) => { setDeptSearch(e.target.value); setForm({ ...form, department: "", faculty: "" }); }} placeholder="Search departments..." className={`w-full h-10 px-3 rounded-xl border text-sm outline-none ${inputStyle}`} autoFocus />
                    </div>
                    {filteredDepartments.length > 0 ? filteredDepartments.map((d, i) => (
                      <button key={`${d.name}-${i}`} type="button" onClick={() => { setForm({ ...form, department: d.name, faculty: d.faculty || "" }); setDeptSearch(""); setShowDeptDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition text-sm">
                        <span className="font-medium">{d.name}</span>
                        {d.faculty && <span className={`${muted} text-xs ml-2`}>{d.faculty}</span>}
                      </button>
                    )) : (
                      <div className="px-4 py-6 text-center text-sm opacity-60">No departments found</div>
                    )}
                  </div>
                )}
                {form.department && <p className="text-emerald-500 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> {form.department}</p>}
              </div>

              {/* Level */}
              <div>
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">Level</label>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {["100", "200", "300", "400", "500", "600"].map((l) => (
                    <button key={l} type="button" onClick={() => setForm({ ...form, level: l })}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-xs md:text-sm font-medium transition-all ${form.level === l ? "bg-indigo-500 text-white border-indigo-500" : card}`}>
                      {l}L
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">Location</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lagos, Nigeria" className={`w-full h-12 pl-11 pr-4 rounded-2xl outline-none transition-all ${inputStyle}`} />
                </div>
              </div>

              {/* Faculty (readonly, auto-filled from department) */}
              <div>
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">Faculty</label>
                <div className="relative">
                  <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                  <input type="text" value={form.faculty} readOnly placeholder="Auto-filled from department" className={`w-full h-12 pl-11 pr-4 rounded-2xl outline-none ${inputStyle} opacity-60`} />
                </div>
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block mb-2 text-xs md:text-sm font-semibold opacity-80">Bio</label>
                <textarea rows="4" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." className={`w-full p-4 md:p-5 rounded-2xl outline-none resize-none transition-all ${inputStyle}`} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 md:mt-8">
              <button onClick={() => setEditOpen(false)} className={`flex-1 h-12 rounded-2xl border font-semibold transition-all ${dark ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-indigo-500/25">
                {saving ? <><Loader2 className="animate-spin" size={18} /> Saving...</> : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
