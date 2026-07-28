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
  ArrowRight,
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
  LayoutDashboard,
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
  const [roleLoading, setRoleLoading] = useState(false);
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
    jamb: {
      label: "JAMB",
      gradient: "from-purple-500 to-indigo-500",
      icon: <BrainCircuit size={22} />,
      description: "Prepare for JAMB using CBT practice and AI tools.",
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
  // ROLE SWITCH
  // =====================================================

  const handleRoleSwitch = async (role) => {
    try {
      setRoleLoading(true);
      await setDoc(doc(db, "users", auth.currentUser.uid), { role, updatedAt: serverTimestamp() }, { merge: true });
      setProfile((prev) => ({ ...prev, role }));
      navigate("/");
    } catch (error) { console.log(error); }
    finally { setRoleLoading(false); }
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
  const currentRole = profile?.role || "university";
  const activeRole = roleThemes[currentRole];

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
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">
        {/* TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button onClick={() => navigate(-1)} className={`${glass} h-10 md:h-12 px-4 md:px-5 rounded-2xl flex items-center gap-2 hover:scale-[1.02] hover:shadow-lg transition-all text-sm md:text-base`}>
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex gap-2">
            <button onClick={() => setEditOpen(true)} className="h-10 md:h-12 px-4 md:px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all text-white flex items-center gap-2 font-semibold text-sm md:text-base shadow-lg shadow-indigo-500/25">
              <Edit3 size={16} /> <span className="hidden sm:inline">Edit</span> Profile
            </button>
            <button onClick={() => navigate("/messages")} className={`${glass} h-10 md:h-12 px-4 md:px-5 rounded-2xl flex items-center gap-2 hover:scale-[1.02] hover:shadow-lg transition-all text-sm md:text-base`}>
              <MessageCircle size={18} />
            </button>
          </div>
        </div>

        {/* MESSAGE TOAST */}
        {message && (
          <div className="mb-4 animate-slideDown">
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl p-4 text-center font-medium backdrop-blur-xl">
              {message}
            </div>
          </div>
        )}

        {/* HERO CARD */}
        <div className={`relative overflow-hidden rounded-[32px] md:rounded-[40px] p-5 md:p-8 lg:p-10 ${glass} mb-6`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${activeRole.gradient} opacity-[0.07]`} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            {/* LEFT - Avatar & Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br ${activeRole.gradient} p-[3px] shadow-2xl`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0f172a] flex items-center justify-center text-4xl md:text-5xl font-black text-white">
                    {profile?.photo ? (
                      <img src={profile.photo} alt="profile" className="w-full h-full object-cover" />
                    ) : initial}
                  </div>
                </div>
                <label className="absolute bottom-1 right-1 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center cursor-pointer text-white shadow-xl shadow-indigo-500/30">
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                  <input type="file" hidden accept="image/*" onChange={handlePhoto} />
                </label>
              </div>

              {/* Info */}
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-3">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">{profile?.username || "Student"}</h1>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-1.5 text-xs font-semibold">
                    <BadgeCheck size={14} /> Verified
                  </div>
                </div>

                <div className={`flex items-center justify-center sm:justify-start gap-2 mt-2 md:mt-3 ${muted} text-sm`}>
                  <Mail size={14} />
                  <span className="break-all">{user?.email}</span>
                </div>

                {(profile?.school || profile?.department || profile?.level) && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    {profile?.school && (
                      <span className={`px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 text-xs font-medium flex items-center gap-1.5`}>
                        <School size={12} /> {profile.school}
                      </span>
                    )}
                    {profile?.department && (
                      <span className={`px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-500 text-xs font-medium flex items-center gap-1.5`}>
                        <Library size={12} /> {profile.department}
                      </span>
                    )}
                    {profile?.level && (
                      <span className={`px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-medium flex items-center gap-1.5`}>
                        <Layers size={12} /> {profile.level}L
                      </span>
                    )}
                  </div>
                )}

                {profile?.bio && (
                  <p className={`mt-3 text-sm ${muted} max-w-xl leading-relaxed`}>{profile.bio}</p>
                )}
              </div>
            </div>

            {/* RIGHT - Role Badge */}
            <div className={`flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 rounded-2xl md:rounded-3xl bg-gradient-to-r ${activeRole.gradient} text-white shadow-xl shrink-0`}>
              {activeRole.icon}
              <div className="text-left">
                <p className="text-[10px] md:text-xs opacity-80">Active Role</p>
                <h3 className="font-black text-sm md:text-base">{activeRole.label}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
          {profileStats.map((stat) => (
            <div key={stat.title} className={`${glass} rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center gap-3 md:gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shrink-0`}>
                {React.cloneElement(stat.icon, { size: 20 })}
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] md:text-xs ${muted} truncate`}>{stat.title}</p>
                <h3 className="text-lg md:text-3xl font-black truncate">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1.5 md:gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : glass + " hover:scale-[1.02]"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* LEFT - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* ABOUT SECTION */}
            {activeTab === "overview" && (
              <>
                <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-8`}>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black">Account Details</h2>
                      <p className={`mt-1 text-sm ${muted}`}>Your profile information</p>
                    </div>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <User2 size={24} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                    {[
                      { title: "Username", value: profile?.username || "Not Added", icon: <User2 size={18} />, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                      { title: "School", value: profile?.school || "Not Added", icon: <School size={18} />, color: "text-green-500", bg: "bg-green-500/10" },
                      { title: "Department", value: profile?.department || profile?.departmentName || "Not Added", icon: <Library size={18} />, color: "text-orange-500", bg: "bg-orange-500/10" },
                      { title: "Level", value: profile?.level ? `${profile.level}L` : "Not Added", icon: <Layers size={18} />, color: "text-pink-500", bg: "bg-pink-500/10" },
                      { title: "Location", value: profile?.location || "Not Added", icon: <MapPin size={18} />, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                      { title: "Joined", value: auth.currentUser?.metadata?.creationTime?.slice(4, 16) || "2026", icon: <Calendar size={18} />, color: "text-purple-500", bg: "bg-purple-500/10" },
                    ].map((item, index) => (
                      <div key={index} className={`${card} rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center gap-3 hover:shadow-lg transition-all`}>
                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>{item.icon}</div>
                        <div className="min-w-0">
                          <p className={`text-xs ${muted}`}>{item.title}</p>
                          <h3 className="font-bold text-sm md:text-xl mt-0.5 break-words truncate">{item.value}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROLE SWITCH */}
                <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-8`}>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black">Switch Dashboard</h2>
                      <p className={`mt-1 text-sm ${muted}`}>Change your learning experience instantly</p>
                    </div>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <LayoutDashboard size={24} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(roleThemes).map(([key, value]) => (
                      <button
                        key={key}
                        disabled={roleLoading}
                        onClick={() => handleRoleSwitch(key)}
                        className={`relative overflow-hidden rounded-[24px] p-5 md:p-7 border transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-xl ${
                          currentRole === key ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" : dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/50"
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-[0.06]`} />
                        <div className="relative z-10">
                          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gradient-to-br ${value.gradient} flex items-center justify-center text-white mb-4 md:mb-6 shadow-lg`}>{value.icon}</div>
                          <h3 className="text-xl md:text-2xl font-black">{value.label}</h3>
                          <p className={`mt-2 md:mt-4 text-sm ${muted}`}>{value.description}</p>
                          <div className="mt-4 md:mt-7 flex items-center justify-between">
                            {currentRole === key ? (
                              <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm">
                                <CheckCircle2 size={16} /> Active
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-indigo-500 font-medium text-sm">
                                Switch <ArrowRight size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ABOUT TAB */}
            {activeTab === "about" && (
              <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-8`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Pencil size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black">Bio</h2>
                    <p className={`text-sm ${muted}`}>Your personal description</p>
                  </div>
                </div>
                <div className={`${card} rounded-2xl md:rounded-3xl p-5 md:p-7`}>
                  <p className={`leading-relaxed ${profile?.bio ? "" : muted} italic`}>
                    {profile?.bio || "No bio added yet. Click 'Edit Profile' to add one."}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Groups Created", value: communityStats.created },
                    { label: "Groups Joined", value: communityStats.joined },
                    { label: "Community", value: "Active" },
                  ].map((item, i) => (
                    <div key={i} className={`${card} rounded-2xl p-4 text-center hover:shadow-lg transition-all`}>
                      <p className="text-2xl md:text-3xl font-black text-indigo-500">{item.value}</p>
                      <p className={`text-xs ${muted} mt-1`}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-8`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black">Achievements</h2>
                    <p className={`text-sm ${muted}`}>Your learning milestones</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { title: "Challenges Done", value: challengeStats?.attempts || 0, icon: <BrainCircuit size={20} />, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { title: "Questions Answered", value: challengeStats?.questionsAnswered || 0, icon: <CheckCircle2 size={20} />, color: "text-green-500", bg: "bg-green-500/10" },
                    { title: "Accuracy", value: challengeStats?.accuracy ? `${challengeStats.accuracy}%` : "0%", icon: <Star size={20} />, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                    { title: "Perfect Scores", value: challengeStats?.perfectScores || 0, icon: <Trophy size={20} />, color: "text-orange-500", bg: "bg-orange-500/10" },
                  ].map((item, i) => (
                    <div key={i} className={`${card} rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center gap-3 hover:shadow-lg transition-all`}>
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>{item.icon}</div>
                      <div>
                        <p className="text-lg md:text-2xl font-black">{item.value}</p>
                        <p className={`text-xs ${muted}`}>{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {challengeStats?.rank && (
                  <div className={`mt-6 ${card} rounded-2xl md:rounded-3xl p-5 flex items-center justify-between`}>
                    <span className="font-semibold">Current Rank</span>
                    <span className="text-2xl font-black" style={{ color: getRankColor(challengeStats.rank) }}>{challengeStats.rank}</span>
                  </div>
                )}
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-8`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black">Security</h2>
                    <p className={`text-sm ${muted}`}>Account safety & settings</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "Email verified",
                    "Secure authentication",
                    "Protected account",
                    "Firebase security rules active",
                  ].map((item, index) => (
                    <div key={index} className={`${card} rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg transition-all`}>
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-medium text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>

                <button onClick={handleLogout} className="mt-6 w-full h-12 md:h-14 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/25">
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* RIGHT - Sidebar */}
          <div className="space-y-6">
            {/* Premium Card */}
            <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                  <WalletCards size={24} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black">Premium</h3>
                  <p className={`text-xs ${muted}`}>Upgrade your experience</p>
                </div>
              </div>
              <div className={`${card} rounded-2xl p-4 md:p-5`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${muted}`}>Current Plan</span>
                  <span className="text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded-full text-xs">FREE</span>
                </div>
                <button onClick={() => navigate("/subscription")} className="mt-4 w-full h-11 md:h-13 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-indigo-500/25 text-sm md:text-base">
                  <Star size={16} /> Upgrade Now
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-6`}>
              <h3 className="font-black text-lg md:text-xl mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Role", value: activeRole.label, gradient: activeRole.gradient },
                  { label: "School Type", value: profile?.schoolType || profile?.universityType || "Not Set" },
                  { label: "Faculty", value: profile?.faculty || "Not Set" },
                ].map((item, i) => (
                  <div key={i} className={`${card} rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between`}>
                    <span className={`text-xs ${muted}`}>{item.label}</span>
                    {item.gradient ? (
                      <span className={`text-xs md:text-sm font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>{item.value}</span>
                    ) : (
                      <span className="text-xs md:text-sm font-bold">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className={`${glass} rounded-[24px] md:rounded-[36px] p-5 md:p-6`}>
              <h3 className="font-black text-lg md:text-xl mb-4">Activity</h3>
              <div className="space-y-2">
                {[
                  { label: "Posts", value: "—" },
                  { label: "Comments", value: "—" },
                  { label: "Likes", value: "—" },
                ].map((item, i) => (
                  <div key={i} className={`${card} rounded-xl p-3 flex items-center justify-between`}>
                    <span className={`text-xs ${muted}`}>{item.label}</span>
                    <span className="font-bold text-sm">{item.value}</span>
                  </div>
                ))}
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
                    onClick={() => setShowSchoolDropdown(!showSchoolDropdown)} onFocus={() => setShowSchoolDropdown(true)} />
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
                    onClick={() => setShowDeptDropdown(!showDeptDropdown)} onFocus={() => setShowDeptDropdown(true)} />
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