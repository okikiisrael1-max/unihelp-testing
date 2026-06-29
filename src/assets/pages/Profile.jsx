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

import { uploadImage } from "../../services/cloudinary";

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
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User2,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  AuthContext,
} from "../context/AuthContext";

const Profile = ({
  dark = false,
}) => {
  const navigate =
    useNavigate();

  const { user } =
    useContext(AuthContext);

  // =====================================================
  // STATES
  // =====================================================

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [roleLoading, setRoleLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [communityStats, setCommunityStats] =
    useState({
      created: 0,
      joined: 0,
      mutual: 0,
    });

  const [form, setForm] =
    useState({
      username: "",
      school: "",
      department: "",
      level: "",
      bio: "",
      location: "",
    });

  // =====================================================
  // THEME
  // =====================================================

  const bg = dark
    ? "bg-[#030712] text-white"
    : "bg-[#f8fafc] text-slate-900";

  const glass = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-3xl"
    : "bg-white border border-slate-200";

  const card = dark
    ? "bg-white/5 border border-white/10"
    : "bg-white border border-slate-200";

  const inputStyle = dark
    ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40"
    : "bg-slate-100 border border-slate-200 text-slate-900";

  const muted = dark
    ? "text-slate-400"
    : "text-slate-500";

  // =====================================================
  // ROLE THEMES
  // =====================================================

  const roleThemes = {
    university: {
      label: "University",
      gradient:
        "from-indigo-500 via-blue-500 to-cyan-500",

      icon: (
        <GraduationCap size={22} />
      ),

      description:
        "Access CGPA tools, campus resources and university dashboard.",
    },

    jamb: {
      label: "JAMB",
      gradient:
        "from-purple-500 to-indigo-500",

      icon: (
        <BrainCircuit size={22} />
      ),

      description:
        "Prepare for JAMB using CBT practice and AI tools.",
    },
  };

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  const fetchProfile =
    async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        const ref = doc(
          db,
          "users",
          auth.currentUser.uid
        );

        const snap =
          await getDoc(ref);

        if (snap.exists()) {
          const data =
            snap.data();

          setProfile(data);

          setForm({
            username:
              data.username || "",
            school:
              data.school || "",
            department:
              data.department || "",
            level:
              data.level || "",
            bio: data.bio || "",
            location:
              data.location || "",
          });
        }

        const createdSnap = await getDocs(
          query(
            collection(db, "groups"),
            where(
              "ownerId",
              "==",
              auth.currentUser.uid
            ),
            limit(50)
          )
        );

        const joinedSnap = await getDocs(
          query(
            collection(
              db,
              "users",
              auth.currentUser.uid,
              "groups"
            ),
            limit(50)
          )
        );

        setCommunityStats({
          created: createdSnap.size,
          joined: joinedSnap.size,
          mutual: joinedSnap.size,
        });
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave =
    async () => {
      try {
        setSaving(true);

        const ref = doc(
          db,
          "users",
          auth.currentUser.uid
        );

        await setDoc(
          ref,
          {
            ...form,
            usernameLower:
              form.username
                .trim()
                .toLowerCase(),
            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        await updateProfile(
          auth.currentUser,
          {
            displayName:
              form.username,
          }
        );

        setMessage(
          "Profile updated successfully 🚀"
        );

        setEditOpen(false);

        fetchProfile();
      } catch (error) {
        console.log(error);

        setMessage(
          "Failed to update profile"
        );
      } finally {
        setSaving(false);

        setTimeout(() => {
          setMessage("");
        }, 4000);
      }
    };

  // =====================================================
  // PHOTO UPLOAD
  // =====================================================

  const handlePhoto =
    async (e) => {
      try {
        const file =
          e.target.files[0];

        if (!file) return;

        setUploading(true);

        const result = await uploadImage(file);
        const url = result.secure_url;

        await updateProfile(
          auth.currentUser,
          {
            photoURL: url,
          }
        );

        await setDoc(
          doc(
            db,
            "users",
            auth.currentUser.uid
          ),
          {
            photo: url,
          },
          {
            merge: true,
          }
        );

        fetchProfile();

        setMessage(
          "Profile picture updated"
        );
      } catch (error) {
        console.log(error);
      } finally {
        setUploading(false);
      }
    };

  // =====================================================
  // ROLE SWITCH
  // =====================================================

  const handleRoleSwitch =
    async (role) => {
      try {
        setRoleLoading(true);

        await setDoc(
          doc(
            db,
            "users",
            auth.currentUser.uid
          ),
          {
            role,
            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        setProfile((prev) => ({
          ...prev,
          role,
        }));

        navigate("/");
      } catch (error) {
        console.log(error);
      } finally {
        setRoleLoading(false);
      }
    };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        navigate("/");
      } catch (error) {
        console.log(error);
      }
    };

  // =====================================================
  // INITIAL
  // =====================================================

  const initial = useMemo(() => {
    return (
      profile?.username
        ?.charAt(0)
        ?.toUpperCase() || "U"
    );
  }, [profile]);

  // =====================================================
  // ACTIVE ROLE
  // =====================================================

  const currentRole =
    profile?.role ||
    "university";

  const activeRole =
    roleThemes[currentRole];

  const sectionLinks = [
    {
      id: "overview",
      label: "Overview",
      icon: <User2 size={16} />,
    },
    {
      id: "about",
      label: "About",
      icon: <BookOpen size={16} />,
    },
    {
      id: "switch-dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: "premium",
      label: "Premium",
      icon: <WalletCards size={16} />,
    },
    {
      id: "security",
      label: "Security",
      icon: <ShieldCheck size={16} />,
    },
  ];

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const profileStats = [
    {
      title: "Uploads",
      value:
        profile?.uploadCount ||
        profile?.uploads ||
        profile?.files ||
        "0",
      icon: <BookOpen />,
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      title: "Achievements",
      value: profile?.achievements || "0",
      icon: <Trophy />,
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      title: "Rank",
      value: profile?.rank || "0",
      icon: <Medal />,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Streak",
      value: profile?.streak || "0d",
      icon: <Flame />,
      gradient: "from-cyan-500 to-blue-500",
    },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-5" />

          <h2 className="text-xl font-black">
            Loading Profile...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${bg}`}
    >
      {/* BG */}

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-3xl rounded-full" />

      {/* CONTENT */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* TOP BAR */}

        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap w-full items-center justify-between gap-2">
            <button
              onClick={() =>navigate(-1)} className={`${glass} h-12 px-5 rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all`}>
              <ArrowLeft size={18} /> Back
            </button>

            <button
              onClick={() => setEditOpen(true)}
              className="h-12 px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition-all text-white flex items-center gap-2 font-semibold">
              <Edit3 size={18} />Edit Profile</button>
            <button
              onClick={() => navigate("/messages")}
              className={`${glass} h-12 px-5 rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all`}>
              <MessageCircle size={18} /> Messages
            </button>
          </div>

        </div>

        {/* HERO */}

        <div
          className={`relative overflow-hidden rounded-[40px] mt-6 p-6 md:p-10 ${glass}`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${activeRole.gradient} opacity-10`}
          />

          <div className="relative z-10 flex flex-col xl:flex-row gap-10 xl:items-center xl:justify-between" id="overview">
            {/* LEFT */}

            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              {/* AVATAR */}

              <div className="relative shrink-0">
                <div
                  className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br ${activeRole.gradient} p-1 shadow-2xl`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0f172a] flex items-center justify-center text-6xl font-black text-white">
                    {profile?.photo ? (
                      <img
                        src={
                          profile.photo
                        }
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                </div>

                <label className="absolute bottom-2 right-2 w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-all flex items-center justify-center cursor-pointer text-white shadow-xl">
                  {uploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Camera size={20} />
                  )}

                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={
                      handlePhoto
                    }
                  />
                </label>
              </div>

              {/* INFO */}

              <div className="text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <h1 className="text-4xl md:text-6xl font-black break-words">
                    {profile?.username ||
                      "Student"}
                  </h1>

                  <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-2 text-sm font-semibold">
                    <BadgeCheck size={16} />

                    Verified
                  </div>
                </div>

                <div
                  className={`flex items-center justify-center lg:justify-start gap-2 mt-4 ${muted}`}
                >
                  <Mail size={16} />

                  <span className="break-all">
                    {user?.email}
                  </span>
                </div>

                <div className="flex justify-center lg:justify-start gap-3 mt-6">
                  <div className={`${card} px-4 py-3 rounded-2xl flex items-center gap-1`}>
                    <ShieldCheck className="text-green-500" />
                    <span className="font-medium">
                      Secure Account
                    </span>
                  </div>
                
                <div
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r ${activeRole.gradient} text-white shadow-xl`}
                >
                  {activeRole.icon}

                  <div className="text-left">
                    <p className="text-xs opacity-80">
                      Active Role
                    </p>

                    <h3 className="font-black">
                      {
                        activeRole.label
                      }
                    </h3>
                  </div>
                </div>
                </div>

                
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mt-6">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl p-4 text-center">
              {message}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              title: "Groups Created",
              value: communityStats.created,
              icon: <ShieldCheck />,
              color: "from-indigo-500 to-blue-600",
            },
            {
              title: "Groups Joined",
              value: communityStats.joined,
              icon: <Users />,
              color: "from-emerald-500 to-teal-600",
            },
            {
              title: "Mutual Groups",
              value: communityStats.mutual,
              icon: <MessageCircle />,
              color: "from-pink-500 to-rose-600",
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`${glass} rounded-3xl p-5 flex items-center gap-4`}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}
              >
                {item.icon}
              </div>

              <div>
                <p className={`text-sm ${muted}`}>
                  {item.title}
                </p>

                <h3 className="text-3xl font-black">
                  {item.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* GRID */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
          {/* LEFT */}

          <div className="xl:col-span-2 space-y-8">
            {/* ABOUT */}

            <div
              className={`${glass} rounded-[36px] p-6 md:p-8`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black">
                    About User
                  </h2>

                  <p
                    className={`mt-1 ${muted}`}
                  >
                    Personal profile
                    information
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <User2 />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {[
                  {
                    title:
                      "Username",
                    value:
                      profile?.username ||
                      "Not Added",

                    icon: (
                      <User2 />
                    ),

                    color:
                      "text-indigo-400",

                    bg: "bg-indigo-500/10",
                  },

                  {
                    title:
                      "School",
                    value:
                      profile?.school ||
                      "Not Added",

                    icon: (
                      <School />
                    ),

                    color:
                      "text-green-400",

                    bg: "bg-green-500/10",
                  },

                  {
                    title:
                      "Department",
                    value:
                      profile?.department ||
                      "Not Added",

                    icon: (
                      <GraduationCap />
                    ),

                    color:
                      "text-orange-400",

                    bg: "bg-orange-500/10",
                  },

                  {
                    title:
                      "Level",
                    value:
                      profile?.level ||
                      "Not Added",

                    icon: (
                      <LayoutDashboard />
                    ),

                    color:
                      "text-pink-400",

                    bg: "bg-pink-500/10",
                  },

                  {
                    title:
                      "Location",
                    value:
                      profile?.location ||
                      "Not Added",

                    icon: (
                      <MapPin />
                    ),

                    color:
                      "text-cyan-400",

                    bg: "bg-cyan-500/10",
                  },

                  {
                    title:
                      "Joined",
                    value:
                      auth.currentUser?.metadata?.creationTime?.slice(
                        4,
                        16
                      ) || "2026",

                    icon: (
                      <Calendar />
                    ),

                    color:
                      "text-purple-400",

                    bg: "bg-purple-500/10",
                  },
                ].map(
                  (item, index) => (
                    <div
                      key={index}
                      className={`${card} flex gap-2.5 items-center rounded-3xl p-5`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} ${item.color}`}>{item.icon}</div>
                      <div>
                        <p className={` text-sm ${muted}`}>{item.title}</p>

                      <h3 className="font-black text-xl mt-2 break-words">{item.value}</h3>
                      </div>
                      
                    </div>
                  )
                )}
              </div>

              {/* BIO */}

              <div
                className={`${card} rounded-3xl p-6 mt-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Pencil className="text-indigo-400" />

                  <h3 className="text-2xl font-black">
                    Bio
                  </h3>
                </div>

                <p
                  className={`leading-relaxed ${muted}`}
                >
                  {profile?.bio ||
                    "No bio added yet."}
                </p>
              </div>
            </div>

            {/* ROLE SWITCH */}

            <div
              className={`${glass} rounded-[36px] p-6 md:p-8`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black">
                    Switch Dashboard
                  </h2>

                  <p
                    className={`mt-1 ${muted}`}
                  >
                    Change your learning
                    experience instantly.
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <LayoutDashboard />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(
                  roleThemes
                ).map(
                  ([key, value]) => (
                    <button
                      key={key}
                      disabled={
                        roleLoading
                      }
                      onClick={() =>
                        handleRoleSwitch(
                          key
                        )
                      }
                      className={`relative overflow-hidden rounded-[32px] p-7 border transition-all duration-300 text-left hover:scale-[1.02]
                    ${
                      currentRole ===
                      key
                        ? "border-indigo-500 bg-white/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-10`}
                      />

                      <div className="relative z-10">
                        <div
                          className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${value.gradient} flex items-center justify-center text-white mb-6`}
                        >
                          {
                            value.icon
                          }
                        </div>

                        <h3 className="text-2xl font-black">
                          {
                            value.label
                          }
                        </h3>

                        <p
                          className={`mt-4 ${muted}`}
                        >
                          {
                            value.description
                          }
                        </p>

                        <div className="mt-7 flex items-center justify-between">
                          {currentRole ===
                          key ? (
                            <div className="flex items-center gap-2 text-green-400 font-medium">
                              <CheckCircle2 size={16} />
                              Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-indigo-400 font-medium">
                              Switch
                              <ArrowRight size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-8">
            {/* PREMIUM */}

            <div
              className={`${glass} rounded-[36px] p-6`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                  <WalletCards />
                </div>

                <div>
                  <h3 className="text-2xl font-black">
                    Premium
                  </h3>

                  <p
                    className={muted}
                  >
                    Upgrade your
                    experience
                  </p>
                </div>
              </div>

              <div
                className={`${card} rounded-3xl p-5 mt-6`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${muted}`}
                  >
                    Current Plan
                  </span>

                  <span className="text-yellow-400 font-bold">
                    FREE
                  </span>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      "/subscription"
                    )
                  }
                  className="mt-6 w-full h-13 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                >
                  <Star size={18} />

                  Upgrade Now
                </button>
              </div>
            </div>

            {/* SECURITY */}

            <div
              className={`${glass} rounded-[36px] p-6`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center">
                  <ShieldCheck />
                </div>

                <div>
                  <h3 className="text-2xl font-black">
                    Security
                  </h3>

                  <p
                    className={muted}
                  >
                    Account safety
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "Email verified",
                  "Secure authentication",
                  "Protected account",
                ].map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className={`${card} rounded-2xl p-4 flex items-center gap-3`}
                    >
                      <CheckCircle2 className="text-green-400" />

                      <span className="font-medium">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={
                  handleLogout
                }
                className="mt-6 w-full h-13 rounded-2xl bg-red-500 hover:bg-red-600 transition-all text-white font-bold flex items-center justify-center gap-2"
              >
                <LogOut size={18} />

                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}

      {editOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`${glass} w-full max-w-3xl rounded-[36px] p-6 md:p-8 relative`}
          >
            <button
              onClick={() =>
                setEditOpen(false)
              }
              className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-400 flex items-center justify-center"
            >
              <X />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Edit3 size={28} />
              </div>

              <div>
                <h2 className="text-3xl font-black">
                  Edit Profile
                </h2>

                <p className={muted}>
                  Update your account
                  information
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  label:
                    "Username",
                  key: "username",
                },

                {
                  label:
                    "School",
                  key: "school",
                },

                {
                  label:
                    "Department",
                  key:
                    "department",
                },

                {
                  label:
                    "Level",
                  key: "level",
                },

                {
                  label:
                    "Location",
                  key:
                    "location",
                  full: true,
                },
              ].map((field) => (
                <div
                  key={field.key}
                  className={
                    field.full
                      ? "md:col-span-2"
                      : ""
                  }
                >
                  <label className="block mb-2 text-sm font-semibold opacity-80">
                    {
                      field.label
                    }
                  </label>

                  <input
                    type="text"
                    value={
                      form[
                        field.key
                      ]
                    }
                    onChange={(
                      e
                    ) =>
                      setForm({
                        ...form,
                        [field.key]:
                          e.target
                            .value,
                      })
                    }
                    className={`w-full h-14 px-5 rounded-2xl outline-none transition-all ${inputStyle}`}
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-semibold opacity-80">
                  Bio
                </label>

                <textarea
                  rows="5"
                  value={form.bio}
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      bio: e
                        .target
                        .value,
                    })
                  }
                  className={`w-full p-5 rounded-2xl outline-none resize-none transition-all ${inputStyle}`}
                />
              </div>
            </div>

            <button
              onClick={
                handleSave
              }
              disabled={saving}
              className="mt-8 w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />

                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
