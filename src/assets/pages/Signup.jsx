import React, { useState } from "react";

import {
  ArrowRight,
  BookOpen,
  Calculator,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
  Target,
  Upload,
  User2,
  CheckCircle2,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { Images } from "../data/data";

import {
  auth,
  db,
} from "../../firebase/config";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";

const Signup = ({ dark }) => {
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  provider.addScope("profile");
  provider.addScope("email");

  const [isLoading, setIsLoading] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  /* ================= EMAIL SIGNUP ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      toast.error("All fields are required");
      return;
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: username,
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          username,
          usernameLower: username.trim().toLowerCase(),
          email,
          role: "",
          photo: "",
          provider: "email",
          createdAt: serverTimestamp(),
        }
      );

      toast.success("Account created successfully");
      navigate("/select-role");
    } catch (error) {
      console.log(error);

      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("Email already exists");
          break;

        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;

        case "auth/weak-password":
          toast.error("Password is too weak");
          break;

        default:
          toast.error("Unable to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= GOOGLE SIGNUP ================= */

  const getUserRole = async (userId) => {
    try {
      const userSnap = await getDoc(doc(db, "users", userId));
      if (userSnap.exists()) {
        return userSnap.data()?.role || null;
      }
    } catch (err) {
      console.error("Failed to read user role:", err);
    }
    return null;
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      const user = result.user;

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap =
        await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          username:
            user.displayName || "Student",
          usernameLower:
            (user.displayName || "Student").trim().toLowerCase(),
          email: user.email,
          role: "",
          photo: user.photoURL || "",
          provider: "google",
          createdAt: serverTimestamp(),
        });
      }

      const role = await getUserRole(user.uid);
      toast.success("Google login successful");
      navigate(role ? "/" : "/select-role");
    } catch (error) {
      console.log(error);

      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        toast.error("Google popup closed");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Google popup blocked by the browser");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error(
          "An account already exists with a different login method"
        );
      } else if (error.code === "auth/unauthorized-domain") {
        toast.error("Google authentication domain is not authorized");
      } else {
        toast.error("Google signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= STYLES ================= */

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-black";

  const glass = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-gray-200";

  const inputStyle = dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-indigo-500"
    : "bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-indigo-500";

  return (
    <div
      className={`min-h-screen relative overflow-y-auto overflow-x-hidden ${bg}`}
    >
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/20 blur-3xl rounded-full" />

      <div className="relative z-10 min-h-screen flex">

        {/* ================= LEFT SIDE ================= */}
        <div className="hidden lg:flex w-1/2 p-10 xl:p-14 flex-col justify-between">

          {/* TOP */}
          <div>

            {/* LOGO */}
            <div className="flex items-center gap-3 mb-10">

              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap
                  size={28}
                  className="text-white"
                />
              </div>

              <div>
                <h1 className="font-black text-2xl">
                  UniHelp.ng
                </h1>

                <p className="text-sm opacity-70">
                  Smart student platform
                </p>
              </div>
            </div>

            {/* HERO TEXT */}
            <div className="max-w-xl">

              <h1 className="text-4xl md:text-5xl font-black leading-tight">
                Learn.
                <br />
                Prepare.
                <br />
                <span className="text-indigo-500">
                  Succeed.
                </span>
              </h1>

              <p className="mt-6 text-lg opacity-70 leading-relaxed">
                One platform for JAMB students and
                university students to learn,
                practice, collaborate and grow.
              </p>
            </div>

            {/* FEATURES */}
            <div className="mt-12 grid grid-cols-1 gap-5">

              {[
                {
                  icon: (
                    <Target size={22} />
                  ),
                  title:
                    "JAMB CBT Practice",
                  desc:
                    "Real CBT simulation with timer and scores",
                  color:
                    "from-green-500 to-emerald-600",
                },

                {
                  icon: (
                    <Calculator size={22} />
                  ),
                  title:
                    "CGPA Calculator",
                  desc:
                    "Track academic performance easily",
                  color:
                    "from-indigo-500 to-purple-600",
                },

                {
                  icon: (
                    <Upload size={22} />
                  ),
                  title:
                    "Lecture Notes",
                  desc:
                    "Upload and access learning materials",
                  color:
                    "from-orange-500 to-red-500",
                },

                {
                  icon: (
                    <User2 size={22} />
                  ),
                  title:
                    "Student Community",
                  desc:
                    "Connect and grow with students",
                  color:
                    "from-pink-500 to-rose-500",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`${glass} rounded-3xl p-5 flex gap-4 hover:scale-[1.02] transition-all duration-300`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0`}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">
                      {item.title}
                    </h3>

                    <p className="opacity-70 text-sm mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between mt-10">
            <p className="text-sm opacity-50">
              © 2026 UniHelp.ng
            </p>

            <div className="flex items-center gap-2 text-sm opacity-60">
              <Sparkles size={16} />

              <span>
                Built for Nigerian students
              </span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10">

          <div
            className={`w-full max-w-lg rounded-[32px] p-6 md:p-8 ${glass} shadow-2xl`}
          >
            {/* MOBILE LOGO */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">

              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center">
                <GraduationCap className="text-white" />
              </div>

              <div>
                <h1 className="font-black text-2xl">
                  UniHelp.ng
                </h1>

                <p className="text-sm opacity-70">
                  Smart student platform
                </p>
              </div>
            </div>

            {/* HEADER */}
            <div className="text-center mb-8">

              <h2 className="text-3xl md:text-4xl font-black">
                Create Account
              </h2>

              <p className="opacity-70 mt-3 text-sm md:text-base">
                Join thousands of students using
                UniHelp.ng
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* USERNAME */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-80">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="John Doe"
                  className={`w-full h-14 px-4 rounded-2xl border outline-none transition-all ${inputStyle}`}
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-80">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="example@gmail.com"
                  className={`w-full h-14 px-4 rounded-2xl border outline-none transition-all ${inputStyle}`}
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-80">
                  Password
                </label>

                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Create password"
                    className={`w-full h-14 px-4 pr-14 rounded-2xl border outline-none transition-all ${inputStyle}`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* PASSWORD INFO */}
              <div className="flex items-center gap-2 text-sm opacity-70">
                <CheckCircle2
                  size={16}
                  className="text-green-500"
                />

                <span>
                  Password must be at least 6
                  characters
                </span>
              </div>



              {/* BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-14 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 hover:scale-[1.01]"
                }`}
              >
                {isLoading ? (
                  "Creating Account..."
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-white/10" />

              <span className="text-sm opacity-50">
                OR
              </span>

              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* GOOGLE BUTTON */}
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className={`w-full h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                dark
                  ? "bg-white/5 border-white/10 hover:bg-white/10"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              } ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <img
                src={Images.google_logo}
                alt="Google"
                className="w-7 h-7 object-contain"
              />

              <span className="font-medium">
                Continue with Google
              </span>
            </button>

            {/* FOOTER */}
            <p className="text-center text-sm opacity-70 mt-7">
              Already have an account?{" "}

              <Link
                to="/"
                className="text-indigo-500 hover:text-indigo-400 font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
