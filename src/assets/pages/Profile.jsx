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
  Sun,
  Moon,
} from "lucide-react";

import {
  AuthContext,
} from "../context/AuthContext";

import { NIGERIAN_UNIVERSITIES, NIGERIAN_POLYTECHNICS, NIGERIAN_COLLEGES_OF_EDUCATION, ALL_NIGERIAN_SCHOOLS, COMMON_DEPARTMENTS } from "../data/nigerianSchools";

const Profile = ({
  dark = false,
  toggleTheme,
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
    <div className={`min-h-screen relative overflow-hidden ${bg} transition-all duration-500 md:pt-20`}>
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

                <div className={`mt-4 space-y-2 text-sm font-medium ${muted}`}>
                  {profile?.school && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <School size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-xs">School: <span className={`${dark ? 'text-slate-200' : 'text-slate-600'} font-semibold`}>{profile.school}</span></span>
                    </div>
                  )}
                  {profile?.faculty && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Layers size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-xs">Faculty: <span className={`${dark ? 'text-slate-200' : 'text-slate-600'} font-semibold`}>{profile.faculty}</span></span>
                    </div>
                  )}
                  {profile?.department && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Library size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-xs">Department: <span className={`${dark ? 'text-slate-200' : 'text-slate-600'} font-semibold`}>{profile.department}</span></span>
                    </div>
                  )}
                  {profile?.level && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <GraduationCap size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-xs">Level: <span className={`${dark ? 'text-slate-200' : 'text-slate-600'} font-semibold`}>{profile.level}</span></span>
                    </div>
                  )}
                  {!profile?.department && !profile?.faculty && !profile?.school && (
                     <div className="flex items-center justify-center sm:justify-start gap-2">
                       <School size={14} className="text-indigo-500/50 shrink-0" />
                       <span className="text-xs">No academic details added yet.</span>
                     </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <MapPin size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-xs">{profile.location}</span>
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

            {/* RIGHT - Rank & Theme */}
            <div className="flex flex-col gap-3 w-full lg:w-72 shrink-0">
              
              {/* Theme Toggle */}
              {toggleTheme && (
                <div onClick={toggleTheme} className={`cursor-pointer rounded-[16px] border p-3 flex items-center justify-between ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 hover:bg-slate-50'} shadow-sm transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dark ? 'bg-indigo-500/20 text-yellow-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      {dark ? <Sun size={14} /> : <Moon size={14} />}
                    </div>
                    <span className="text-xs font-bold">{dark ? "Dark Mode" : "Light Mode"}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 flex transition-all ${dark ? 'bg-indigo-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                    <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              )}

              {/* Rank Card */}
              <div className={`rounded-[20px] border p-5 flex-1 ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'} shadow-sm`}>
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


    {editOpen && (
      <div
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) setEditOpen(false);
        }}
        className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-3"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className={`w-full max-w-xl rounded-[20px] relative max-h-[90vh] flex flex-col overflow-hidden border shadow-2xl ${
            dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
          }`}
        >
          {/* Header — pinned */}
          <div className={`flex items-center gap-3 px-5 py-4 border-b shrink-0 ${dark ? "border-white/10" : "border-slate-200"}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <Edit3 size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="edit-profile-title" className="text-xl font-black leading-tight">Edit Profile</h2>
              <p className={`text-xs ${muted}`}>Update your account information</p>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              aria-label="Close"
              className="ml-auto w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-500 flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body — scrolls independently of header/footer */}
          <div className="overflow-y-auto px-5 py-5">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Username */}
              <div className="md:col-span-2">
                <label htmlFor="edit-username" className="block mb-1.5 text-xs font-semibold opacity-80">Username</label>
                <div className="relative">
                  <User2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                  <input
                    id="edit-username"
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="your_username"
                    className={`w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle}`}
                  />
                </div>
              </div>

              {/* School Type */}
              <div className="md:col-span-2">
                <span className="block mb-1.5 text-xs font-semibold opacity-80">School Type</span>
                <div className="flex gap-2 flex-wrap" role="group" aria-label="School type">
                  {[
                    { value: "university", label: "University" },
                    { value: "polytechnic", label: "Polytechnic" },
                    { value: "college_of_education", label: "College" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={form.schoolType === t.value}
                      onClick={() => {
                        setForm({ ...form, schoolType: t.value, school: "", department: "", faculty: "" });
                        setSchoolSearch("");
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        form.schoolType === t.value ? "bg-indigo-500 text-white border-indigo-500" : card
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* School */}
              <div className="relative md:col-span-2">
                <label htmlFor="edit-school" className="block mb-1.5 text-xs font-semibold opacity-80">School</label>
                <div className="relative">
                  <School size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 z-10 pointer-events-none" />
                  <input
                    id="edit-school"
                    type="text"
                    readOnly
                    role="button"
                    tabIndex={0}
                    aria-haspopup="listbox"
                    aria-expanded={showSchoolDropdown}
                    value={form.school || ""}
                    placeholder="Select school..."
                    className={`w-full h-10 pl-9 pr-8 rounded-xl text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle}`}
                    onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowSchoolDropdown(!showSchoolDropdown);
                      }
                    }}
                  />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                </div>
                {showSchoolDropdown && (
                  <>
                    {/* Invisible layer so clicking anywhere outside the panel closes it */}
                    <button
                      type="button"
                      aria-label="Close school list"
                      onClick={() => setShowSchoolDropdown(false)}
                      className="fixed inset-0 z-10 cursor-default"
                    />
                    <div
                      className={`absolute z-20 w-full mt-1 rounded-xl border max-h-40 overflow-y-auto shadow-xl ${
                        dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="sticky top-0 p-1.5 border-b" style={{ backgroundColor: dark ? "#0f1729" : "#FFFFFF" }}>
                        <input
                          type="text"
                          value={schoolSearch}
                          onChange={(e) => {
                            setSchoolSearch(e.target.value);
                            setForm({ ...form, school: "", department: "" });
                          }}
                          placeholder="Search schools..."
                          className={`w-full h-8 px-2.5 rounded-lg border text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle}`}
                          autoFocus
                        />
                      </div>
                      {filteredSchools.length > 0 ? (
                        filteredSchools.map((s, i) => (
                          <button
                            key={`${s.name}-${i}`}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, school: s.name, schoolType: s.type || form.schoolType });
                              setSchoolSearch("");
                              setShowSchoolDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-500/10 transition text-xs focus-visible:outline-none focus-visible:bg-indigo-500/10"
                          >
                            <span className="font-medium">{s.name}</span>
                            {s.shortName && <span className={`${muted} ml-1 text-[10px]`}>({s.shortName})</span>}
                            <span className={`${mutedLight} text-[10px] ml-2`}>{s.state}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-xs opacity-60">No schools found</div>
                      )}
                    </div>
                  </>
                )}
                {form.school && (
                  <p className="text-emerald-500 text-[10px] mt-1 flex items-center gap-1">
                    <CheckCircle2 size={10} /> {form.school}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="relative">
                <label htmlFor="edit-department" className="block mb-1.5 text-xs font-semibold opacity-80">Department</label>
                <div className="relative">
                  <Library size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 z-10 pointer-events-none" />
                  <input
                    id="edit-department"
                    type="text"
                    readOnly
                    disabled={!form.school}
                    role="button"
                    tabIndex={form.school ? 0 : -1}
                    aria-haspopup="listbox"
                    aria-expanded={showDeptDropdown}
                    value={form.department || ""}
                    placeholder="Select dept..."
                    className={`w-full h-10 pl-9 pr-8 rounded-xl text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle} ${!form.school ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => {
                      if (form.school) setShowDeptDropdown(!showDeptDropdown);
                    }}
                    onKeyDown={(e) => {
                      if (form.school && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setShowDeptDropdown(!showDeptDropdown);
                      }
                    }}
                  />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                </div>
                {!form.school && (
                  <p className="text-[10px] mt-1 opacity-50">Select a school first</p>
                )}
                {showDeptDropdown && (
                  <>
                    <button
                      type="button"
                      aria-label="Close department list"
                      onClick={() => setShowDeptDropdown(false)}
                      className="fixed inset-0 z-10 cursor-default"
                    />
                    <div
                      className={`absolute z-20 w-full mt-1 rounded-xl border max-h-40 overflow-y-auto shadow-xl ${
                        dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="sticky top-0 p-1.5 border-b" style={{ backgroundColor: dark ? "#0f1729" : "#FFFFFF" }}>
                        <input
                          type="text"
                          value={deptSearch}
                          onChange={(e) => setDeptSearch(e.target.value)}
                          placeholder="Search departments..."
                          className={`w-full h-8 px-2.5 rounded-lg border text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle}`}
                          autoFocus
                        />
                      </div>
                      {filteredDepartments.length > 0 ? (
                        filteredDepartments.map((d, i) => (
                          <button
                            key={`${d.name}-${i}`}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, department: d.name, faculty: d.faculty });
                              setDeptSearch("");
                              setShowDeptDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-500/10 transition text-xs focus-visible:outline-none focus-visible:bg-indigo-500/10"
                          >
                            <span className="font-medium">{d.name}</span>
                            <span className={`${mutedLight} text-[10px] block mt-0.5`}>{d.faculty}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-xs opacity-60">No departments found</div>
                      )}
                    </div>
                  </>
                )}
                {form.department && (
                  <p className="text-emerald-500 text-[10px] mt-1 flex items-center gap-1">
                    <CheckCircle2 size={10} /> {form.department}
                  </p>
                )}
              </div>

              {/* Level */}
              <div>
                <label htmlFor="edit-level" className="block mb-1.5 text-xs font-semibold opacity-80">Level</label>
                <div className="relative">
                  <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                  <select
                    id="edit-level"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className={`w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none appearance-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle}`}
                  >
                    <option value="" disabled>Select level...</option>
                    {["100", "200", "300", "400", "500", "600"].map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl} Level</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                </div>
              </div>

              {/* Faculty (readonly, auto-filled from department) */}
              <div>
                <label htmlFor="edit-faculty" className="block mb-1.5 text-xs font-semibold opacity-80">Faculty</label>
                <div className="relative">
                  <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                  <input
                    id="edit-faculty"
                    type="text"
                    value={form.faculty}
                    readOnly
                    placeholder="Auto-filled from department"
                    className={`w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none cursor-not-allowed ${inputStyle} opacity-60`}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label htmlFor="edit-location" className="block mb-1.5 text-xs font-semibold opacity-80">Location (City, State)</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                  <input
                    id="edit-location"
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Lagos, Nigeria"
                    className={`w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label htmlFor="edit-bio" className="block mb-1.5 text-xs font-semibold opacity-80">Bio</label>
                <textarea
                  id="edit-bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  className={`w-full p-3 rounded-xl text-sm outline-none transition-all resize-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${inputStyle}`}
                />
              </div>
            </div>
          </div>

          {/* Footer — pinned, always reachable regardless of form length */}
          <div className={`flex gap-3 px-5 py-4 border-t shrink-0 ${dark ? "border-white/10" : "border-slate-200"}`}>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className={`flex-1 h-10 rounded-xl border text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                dark ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-70 shadow-lg shadow-indigo-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Profile;
