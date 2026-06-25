import React, {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Bell,
  BrainCircuit,
  ChevronRight,
  Globe,
  Lock,
  Moon,
  Save,
  Shield,
  Sparkles,
  Sun,
  User2,
  KeyRound,
  Eye,
  ExternalLink,
  BookOpen,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

import {
  auth,
  db,
} from "../../../firebase/config";

const JambSettings = ({
  dark,
  setDark,
}) => {
  const navigate =
    useNavigate();

  const { user } =
    useContext(AuthContext);

  const [loading, setLoading] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [settings, setSettings] =
    useState({
      fullName: "",
      email: "",
      examYear: "2026",
      preferredCourse: "",
      schoolChoice: "",
      notifications: true,
      aiRecommendations: true,
      publicProfile: false,
      emailUpdates: true,
    });

  /* ================= FETCH SETTINGS ================= */

  useEffect(() => {
    if (!user?.uid) return;

    const fetchSettings =
      async () => {
        try {
          const docRef = doc(
            db,
            "jambSettings",
            user.uid
          );

          const snap =
            await getDoc(docRef);

          if (snap.exists()) {
            setSettings(
              (
                prev
              ) => ({
                ...prev,
                ...snap.data(),
              })
            );
          } else {
            setSettings(
              (
                prev
              ) => ({
                ...prev,
                fullName:
                  user.displayName ||
                  "",
                email:
                  user.email ||
                  "",
              })
            );
          }
        } catch (error) {
          console.log(error);
        }
      };

    fetchSettings();
  }, [user]);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]:
        type ===
        "checkbox"
          ? checked
          : value,
    }));
  };

  /* ================= SAVE SETTINGS ================= */

  const saveSettings =
    async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);

        await setDoc(
          doc(
            db,
            "jambSettings",
            user.uid
          ),
          {
            ...settings,
            updatedAt:
              new Date(),
          },
          { merge: true }
        );

        setSaved(true);

        setMessage(
          "Settings saved successfully."
        );

        setTimeout(() => {
          setSaved(false);

          setMessage("");
        }, 3000);
      } catch (error) {
        console.log(error);

        setMessage(
          "Failed to save settings."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ================= RESET PASSWORD ================= */

  const handlePasswordReset =
    async () => {
      if (!user?.email) return;

      try {
        setResetLoading(true);

        await sendPasswordResetEmail(
          auth,
          user.email
        );

        setMessage(
          "Password reset email sent."
        );

        setTimeout(() => {
          setMessage("");
        }, 4000);
      } catch (error) {
        console.log(error);

        setMessage(
          "Failed to send reset email."
        );
      } finally {
        setResetLoading(false);
      }
    };

  /* ================= THEME ================= */

  const card =
    dark
      ? "bg-white/5 border border-white/10 backdrop-blur-2xl"
      : "bg-white border border-slate-200 shadow-sm";

  const input =
    dark
      ? "bg-white/5 border-white/10 text-white placeholder:text-slate-400"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500";

  const fade =
    dark
      ? "text-slate-400"
      : "text-slate-500";

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        dark
          ? "bg-[#020617] text-white"
          : "bg-[#f8fafc] text-black"
      }`}
    >
      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* TOPBAR */}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* BACK */}

          <button
            onClick={() =>
              navigate(-1)
            }
            className={`h-13 px-5 rounded-2xl flex items-center gap-3 transition-all ${
              dark
                ? "bg-white/5 hover:bg-white/10 border border-white/10"
                : "bg-white hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ArrowLeft
              size={20}
            />

            <span className="font-semibold">
              Back
            </span>
          </button>

          {/* SAVE */}

          <button
            onClick={saveSettings}
            disabled={loading}
            className="h-13 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition-all text-white font-semibold flex items-center gap-2 shadow-xl shadow-indigo-500/20"
          >
            <Save size={19} />

            {loading
              ? "Saving..."
              : saved
              ? "Saved"
              : "Save"}
          </button>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-6">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl text-sm">
              {message}
            </div>
          </div>
        )}

        {/* HEADER */}

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-4">
            <Sparkles size={16} />

            Account Preferences
          </div>

          <h1 className="text-4xl sm:text-5xl font-black">
            Settings
          </h1>

          <p
            className={`mt-3 text-sm sm:text-base ${fade}`}
          >
            Manage your profile,
            AI preferences,
            security and dashboard
            settings.
          </p>
        </div>

        {/* GRID */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT */}

          <div className="xl:col-span-2 space-y-6">
            {/* PROFILE */}

            <div
              className={`${card} rounded-[30px] p-5 sm:p-6`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white">
                  <User2 size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Profile
                  </h2>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Update your
                    personal details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${fade}`}
                  >
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={
                      settings.fullName
                    }
                    onChange={
                      handleChange
                    }
                    className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all ${input}`}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${fade}`}
                  >
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      settings.email
                    }
                    onChange={
                      handleChange
                    }
                    className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all ${input}`}
                    placeholder="Your email"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${fade}`}
                  >
                    JAMB Exam Year
                  </label>

                  <select
                    name="examYear"
                    value={
                      settings.examYear
                    }
                    onChange={
                      handleChange
                    }
                    className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all ${input}`}
                  >
                    <option value="2026">
                      2026
                    </option>

                    <option value="2027">
                      2027
                    </option>

                    <option value="2028">
                      2028
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${fade}`}
                  >
                    Preferred Course
                  </label>

                  <input
                    type="text"
                    name="preferredCourse"
                    value={
                      settings.preferredCourse
                    }
                    onChange={
                      handleChange
                    }
                    className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all ${input}`}
                    placeholder="Computer Science"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${fade}`}
                  >
                    School of Choice
                  </label>

                  <input
                    type="text"
                    name="schoolChoice"
                    value={
                      settings.schoolChoice
                    }
                    onChange={
                      handleChange
                    }
                    className={`w-full h-14 rounded-2xl border px-4 outline-none transition-all ${input}`}
                    placeholder="University of Lagos"
                  />
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS */}

            <div
              className={`${card} rounded-[30px] p-5 sm:p-6`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
                  <Bell size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Notifications
                  </h2>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Manage alerts and
                    updates
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title:
                      "Push Notifications",
                    desc: "Receive reminders and updates",
                    name: "notifications",
                    icon: (
                      <Bell
                        size={20}
                      />
                    ),
                  },

                  {
                    title:
                      "AI Recommendations",
                    desc: "Smart study suggestions from AI",
                    name: "aiRecommendations",
                    icon: (
                      <BrainCircuit
                        size={20}
                      />
                    ),
                  },

                  {
                    title:
                      "Email Updates",
                    desc: "Receive important emails",
                    name: "emailUpdates",
                    icon: (
                      <Globe
                        size={20}
                      />
                    ),
                  },
                ].map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-2xl ${
                        dark
                          ? "bg-white/5"
                          : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                          {
                            item.icon
                          }
                        </div>

                        <div>
                          <h3 className="font-semibold">
                            {
                              item.title
                            }
                          </h3>

                          <p
                            className={`text-sm ${fade}`}
                          >
                            {
                              item.desc
                            }
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          name={
                            item.name
                          }
                          checked={
                            settings[
                              item
                                .name
                            ]
                          }
                          onChange={
                            handleChange
                          }
                          className="peer sr-only"
                        />

                        <div className="peer h-7 w-12 rounded-full bg-slate-300 transition-all peer-checked:bg-indigo-500" />

                        <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-5" />
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-6">
            {/* APPEARANCE */}

            <div
              className={`${card} rounded-[30px] p-5 sm:p-6`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center text-white">
                  {dark ? (
                    <Moon
                      size={24}
                    />
                  ) : (
                    <Sun
                      size={24}
                    />
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Appearance
                  </h2>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Theme settings
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setDark(!dark)
                }
                className={`w-full rounded-3xl p-5 border transition-all hover:scale-[1.01] ${
                  dark
                    ? "bg-[#0B172C] border-white/10"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="font-bold text-lg">
                      {dark
                        ? "Dark Mode"
                        : "Light Mode"}
                    </h3>

                    <p
                      className={`text-sm mt-1 ${fade}`}
                    >
                      Tap to switch
                      theme
                    </p>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white">
                    {dark ? (
                      <Moon
                        size={26}
                      />
                    ) : (
                      <Sun
                        size={26}
                      />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* QUICK LINKS */}

            <div
              className={`${card} rounded-[30px] p-5 sm:p-6`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white">
                  <ExternalLink size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Quick Links
                  </h2>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Navigate faster
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title:
                      "Study Planner",
                    icon: (
                      <BookOpen size={20} />
                    ),
                    link: "/jamb/planner",
                  },

                  {
                    title:
                      "Analytics",
                    icon: (
                      <BrainCircuit size={20} />
                    ),
                    link: "/jamb/analytics",
                  },

                  {
                    title:
                      "Goals",
                    icon: (
                      <GraduationCap size={20} />
                    ),
                    link: "/jamb/goals",
                  },

                  {
                    title:
                      "Profile",
                    icon: (
                      <User2 size={20} />
                    ),
                    link: "/profile",
                  },
                ].map(
                  (
                    item,
                    index
                  ) => (
                    <Link
                      key={index}
                      to={item.link}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        dark
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                          {
                            item.icon
                          }
                        </div>

                        <span className="font-medium">
                          {
                            item.title
                          }
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                      />
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* SECURITY */}

            <div
              className={`${card} rounded-[30px] p-5 sm:p-6`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white">
                  <Shield size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Security
                  </h2>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Protect your
                    account
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* RESET PASSWORD */}

                <button
                  onClick={
                    handlePasswordReset
                  }
                  disabled={
                    resetLoading
                  }
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    dark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                      <KeyRound
                        size={20}
                      />
                    </div>

                    <span className="font-medium">
                      {resetLoading
                        ? "Sending..."
                        : "Change Password"}
                    </span>
                  </div>

                  <ChevronRight
                    size={18}
                  />
                </button>

                {/* PRIVACY */}

                <button
                  onClick={() =>
                    setSettings(
                      (
                        prev
                      ) => ({
                        ...prev,
                        publicProfile:
                          !prev.publicProfile,
                      })
                    )
                  }
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    dark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center">
                      <Eye
                        size={20}
                      />
                    </div>

                    <span className="font-medium">
                      Public Profile
                    </span>
                  </div>

                  <div
                    className={`text-sm font-semibold ${
                      settings.publicProfile
                        ? "text-green-400"
                        : fade
                    }`}
                  >
                    {settings.publicProfile
                      ? "Enabled"
                      : "Disabled"}
                  </div>
                </button>

                {/* ACCOUNT STATUS */}

                <div
                  className={`w-full flex items-center justify-between p-4 rounded-2xl ${
                    dark
                      ? "bg-white/5"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center">
                      <ShieldCheck
                        size={20}
                      />
                    </div>

                    <span className="font-medium">
                      Account Status
                    </span>
                  </div>

                  <span className="text-green-400 text-sm font-semibold">
                    Secure
                  </span>
                </div>
              </div>
            </div>

            {/* AI STATUS */}

            <div
              className={`${card} rounded-[30px] p-5 sm:p-6 relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-5">
                  <BrainCircuit
                    size={28}
                  />
                </div>

                <h2 className="text-2xl font-black">
                  AI Smart Mode
                </h2>

                <p
                  className={`mt-3 text-sm leading-relaxed ${fade}`}
                >
                  UniHelp AI analyzes
                  your weak subjects
                  and recommends
                  personalized study
                  plans.
                </p>

                <Link
                  to="/jamb/planner"
                  className="mt-5 w-full h-13 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition-all text-white font-semibold flex items-center justify-center"
                >
                  Manage AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JambSettings;