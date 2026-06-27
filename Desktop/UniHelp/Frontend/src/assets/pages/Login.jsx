import React, { useState } from "react";

import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  X,
  TargetIcon,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { Images } from "../data/data";

import { auth, db } from "../../firebase/config";

import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const Login = ({ dark }) => {
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  provider.addScope("profile");
  provider.addScope("email");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  /* ================= LOGIN ================= */

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("All fields are required");
      return;
    }

    try {
      setIsLoading(true);

      const credential = await signInWithEmailAndPassword(auth, email, password);

      const role = await getUserRole(credential.user.uid);
      toast.success("Login successful");

      if (role) {
        navigate("/");
      } else {
        navigate("/select-role");
      }
    } catch (error) {
      console.log(error);

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("Account does not exist");
          break;

        case "auth/wrong-password":
          toast.error("Incorrect password");
          break;

        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;

        case "auth/invalid-credential":
          toast.error("Invalid login credentials");
          break;

        default:
          toast.error("Unable to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      const result = await signInWithPopup(auth, provider);
      const role = await getUserRole(result.user.uid);

      toast.success("Google login successful");
      if (role) {
        navigate("/");
      } else {
        navigate("/select-role");
      }
    } catch (error) {
      console.log(error);

      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        toast.error("Google popup closed");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Google popup blocked by the browser");
      } else if (error.code === "auth/unauthorized-domain") {
        toast.error("Google authentication domain is not authorized");
      } else {
        toast.error("Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= RESET PASSWORD ================= */

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setResetLoading(true);

      await sendPasswordResetEmail(auth, resetEmail);

      toast.success("Password reset email sent successfully");
      setTimeout(() => {
        setShowForgotModal(false);
      }, 3000);
    } catch (error) {
      console.log(error);

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email");
          break;

        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;

        default:
          toast.error("Unable to send reset email");
      }
    } finally {
      setResetLoading(false);
    }
  };

  /* ================= STYLES ================= */

  const bg = dark ? "bg-[#020617] text-white" : "bg-[#f8fafc] text-black";

  const glass = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-gray-200";

  const inputStyle = dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-indigo-500"
    : "bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-indigo-500";

  return (
    <div className={`min-h-screen relative overflow-y-auto overflow-x-hidden ${bg}`}>
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
                <GraduationCap size={28} className="text-white" />
              </div>

              <div>
                <h1 className="font-black text-2xl">UniHelp.ng</h1>

                <p className="text-sm opacity-70">Smart student platform</p>
              </div>
            </div>

            {/* HERO */}

            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-black leading-tight">
                Welcome
                <br />
                Back To
                <br />
                <span className="text-indigo-500">UniHelp.</span>
              </h1>

              <p className="mt-6 text-lg opacity-70 leading-relaxed">
                Continue your learning journey, practice CBT exams, calculate
                CGPA, and collaborate with students across Nigeria.
              </p>
            </div>

            {/* FEATURES */}

            <div className="mt-12 grid grid-cols-1 gap-5">
              {[
                {
                  icon: <BookOpen size={22} />,
                  title: "Smart Learning Platform",
                  desc: "Access notes and learning tools easily",
                  color: "from-indigo-500 to-purple-600",
                },

                {
                  icon: <TargetIcon size={22} />,
                  title: "JAMB CBT Practice",
                  desc: "Real CBT simulation with timer and scores",
                  color: "from-green-500 to-emerald-600",
                },

                {
                  icon: <Mail size={22} />,
                  title: "Student Collaboration",
                  desc: "Connect and communicate with students",
                  color: "from-pink-500 to-rose-500",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`${glass} rounded-3xl p-5 flex gap-4 hover:scale-[1.02] transition-all duration-300`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-linear-to-br ${item.color} flex items-center justify-center text-white shrink-0`}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>

                    <p className="opacity-70 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between mt-10">
            <p className="text-sm opacity-50">© 2026 UniHelp.ng</p>

            <div className="flex items-center gap-2 text-sm opacity-60">
              <Sparkles size={16} />

              <span>Built for Nigerian students</span>
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
                <h1 className="font-black text-2xl">UniHelp.ng</h1>

                <p className="text-sm opacity-70">Smart student platform</p>
              </div>
            </div>

            {/* HEADER */}

            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-5">
                <BookOpen className="text-indigo-500" size={36} />
              </div>

              <h2 className="text-3xl md:text-4xl font-black">Welcome Back</h2>

              <p className="opacity-70 mt-3 text-sm md:text-base">
                Login to continue learning on UniHelp.ng
              </p>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL */}

              <div>
                <label className="text-sm font-medium mb-2 block opacity-80">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className={`w-full h-14 px-4 rounded-2xl border outline-none transition-all ${inputStyle}`}
                />
              </div>

              {/* PASSWORD */}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium opacity-80">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-sm text-indigo-500 hover:text-indigo-400 transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full h-14 px-4 pr-14 rounded-2xl border outline-none transition-all ${inputStyle}`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* ERRORS */}


              {/* LOGIN BUTTON */}

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
                  "Signing In..."
                ) : (
                  <>
                    Login
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}

            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-white/10" />

              <span className="text-sm opacity-50">OR</span>

              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* GOOGLE LOGIN */}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`w-full h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                dark
                  ? "bg-white/5 border-white/10 hover:bg-white/10"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <img
                src={Images.google_logo}
                alt="Google"
                className="w-7 h-7 object-contain"
              />

              <span className="font-medium">Continue with Google</span>
            </button>

            {/* FOOTER */}

            <p className="text-center text-sm opacity-70 mt-7">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-500 hover:text-indigo-400 font-semibold"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}

      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className={`w-full max-w-md rounded-3xl p-6 ${glass}`}>
            {/* HEADER */}

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">Reset Password</h2>

                <p className="text-sm opacity-70 mt-1">
                  Enter your email address
                </p>
              </div>

              <button
                onClick={() => setShowForgotModal(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block opacity-80">
                  Email Address
                </label>

                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full h-14 px-4 rounded-2xl border outline-none transition-all ${inputStyle}`}
                />
              </div>


              <button
                type="submit"
                disabled={resetLoading}
                className={`w-full h-14 rounded-2xl font-bold text-white transition-all duration-300 ${
                  resetLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600"
                }`}
              >
                {resetLoading ? "Sending Reset Link..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
