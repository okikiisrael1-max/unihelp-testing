import React, { useState, useRef } from "react";

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
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { Images } from "../data/data";

import { auth } from "../../firebase/config";

import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

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
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateField = (field, value) => {
    if (field === "email") {
      if (!value) return "Email is required";
      if (!isEmailValid(value)) return "Enter a valid email address";
    }
    if (field === "password") {
      if (!value) return "Password is required";
    }
    return "";
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  /* ================= LOGIN ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) {
      return;
    }

    try {
      setIsLoading(true);

      const credential = await signInWithEmailAndPassword(auth, email, password);

      toast.success("Login successful");

      navigate("/");
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
      toast.success("Google login successful");
      navigate("/");
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
      setResetSent(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSent(false);
        setResetEmail("");
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

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetSent(false);
    setResetEmail("");
  };

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-gradient-to-b from-slate-50 to-slate-100 text-black";

  const glass = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-gray-200/70";

  const inputStyle = dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/10"
    : "bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

  return (
    <div className={`min-h-screen relative overflow-y-auto overflow-x-hidden ${bg}`}>
      {/* BACKGROUND EFFECTS */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* subtle grid texture on left panel only, purely decorative */}
      <div
        className="hidden lg:block absolute top-0 left-0 w-1/2 h-full opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 min-h-screen flex">
        {/* ================= LEFT SIDE ================= */}

        <div className="hidden lg:flex w-1/2 p-10 xl:p-16 flex-col justify-between">
          {/* TOP */}

          <div>
            {/* LOGO */}

            <div className="flex items-center gap-3 mb-14">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
                <GraduationCap size={26} className="text-white" />
              </div>

              <div>
                <h1 className="font-black text-2xl tracking-tight">UniHelp.ng</h1>
                <p className="text-sm opacity-60">Smart student platform</p>
              </div>
            </div>

            {/* HERO */}

            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-full mb-6">
                <Sparkles size={13} />
                Trusted by students nationwide
              </span>

              <h1 className="text-4xl md:text-[3.2rem] font-black leading-[1.05] tracking-tight">
                Welcome
                <br />
                Back To
                <br />
                <span className="text-indigo-500">UniHelp.</span>
              </h1>

              <p className="mt-6 text-lg opacity-60 leading-relaxed max-w-md">
                Continue your learning journey, calculate
                CGPA, and collaborate with students across Nigeria.
              </p>
            </div>

            {/* FEATURES */}

            <div className="mt-12 grid grid-cols-1 gap-4">
              {[
                {
                  icon: <BookOpen size={20} />,
                  title: "Smart Learning Platform",
                  desc: "Access notes and learning tools easily",
                },
                {
                  icon: <Users size={20} />,
                  title: "Student Collaboration",
                  desc: "Connect and communicate with students",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`${glass} rounded-2xl p-4 flex gap-4 items-center hover:border-indigo-500/40 hover:translate-x-1 transition-all duration-300`}
                >
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-bold text-[15px]">{item.title}</h3>
                    <p className="opacity-55 text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* TRUST STATS */}

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: "10K+", label: "Active students" },
                { value: "50+", label: "Universities" },
                { value: "4.8★", label: "Average rating" },
              ].map((stat, i) => (
                <div key={i} className="text-left">
                  <p className="text-2xl font-black text-indigo-500">{stat.value}</p>
                  <p className="text-xs opacity-50 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
            <p className="text-sm opacity-40">© 2026 UniHelp.ng</p>

            <div className="flex items-center gap-2 text-sm opacity-50">
              <ShieldCheck size={16} />
              <span>Built for Nigerian students</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10">
          <div
            className={`w-full max-w-lg rounded-[32px] p-6 md:p-9 ${glass} shadow-2xl shadow-black/5`}
          >
            {/* MOBILE LOGO */}

            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap className="text-white" />
              </div>

              <div>
                <h1 className="font-black text-2xl tracking-tight">UniHelp.ng</h1>
                <p className="text-sm opacity-60">Smart student platform</p>
              </div>
            </div>

            {/* HEADER */}

            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 ring-1 ring-indigo-500/20">
                <Lock className="text-indigo-500" size={28} />
              </div>

              <h2 className="text-3xl md:text-[2.2rem] font-black tracking-tight">
                Welcome Back
              </h2>

              <p className="opacity-60 mt-2.5 text-sm md:text-base">
                Login to continue learning on UniHelp.ng
              </p>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL */}

              <div>
                <label className="text-sm font-semibold mb-2 block opacity-80">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      touched.email && fieldErrors.email ? "text-red-500" : "opacity-40"
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched.email) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: validateField("email", e.target.value),
                        }));
                      }
                    }}
                    onBlur={(e) => handleBlur("email", e.target.value)}
                    placeholder="example@gmail.com"
                    aria-invalid={Boolean(touched.email && fieldErrors.email)}
                    className={`w-full h-14 pl-12 pr-10 rounded-2xl border outline-none transition-all duration-200 ${
                      touched.email && fieldErrors.email
                        ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-500/[0.03]"
                        : inputStyle
                    }`}
                  />
                  {touched.email && !fieldErrors.email && email && (
                    <CheckCircle2
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
                    />
                  )}
                </div>
                {touched.email && fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold opacity-80">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-sm text-indigo-500 hover:text-indigo-400 font-medium transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <Lock
                    size={18}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      touched.password && fieldErrors.password ? "text-red-500" : "opacity-40"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validateField("password", e.target.value),
                        }));
                      }
                    }}
                    onBlur={(e) => handleBlur("password", e.target.value)}
                    placeholder="Enter password"
                    aria-invalid={Boolean(touched.password && fieldErrors.password)}
                    className={`w-full h-14 pl-12 pr-14 rounded-2xl border outline-none transition-all duration-200 ${
                      touched.password && fieldErrors.password
                        ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-500/[0.03]"
                        : inputStyle
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* REMEMBER ME */}

              <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <span className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                      rememberMe
                        ? "bg-indigo-500 border-indigo-500"
                        : dark
                        ? "border-white/20"
                        : "border-gray-300"
                    }`}
                  >
                    {rememberMe && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M1 5L4.5 8.5L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="text-sm opacity-70">Remember me for 30 days</span>
              </label>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-14 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed shadow-none"
                    : "bg-indigo-500 hover:bg-indigo-600 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </>
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
              <div className="flex-1 h-px bg-current opacity-10" />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-40">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-current opacity-10" />
            </div>

            {/* GOOGLE LOGIN */}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`w-full h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                dark
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
            >
              <img
                src={Images.google_logo}
                alt="Google"
                className="w-6 h-6 object-contain"
              />
              <span className="font-semibold">Continue with Google</span>
            </button>

            {/* FOOTER */}

            <p className="text-center text-sm opacity-60 mt-8">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-500 hover:text-indigo-400 font-bold"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}

      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={closeForgotModal}
        >
          <div
            className={`w-full max-w-md rounded-3xl p-6 md:p-7 ${glass} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {resetSent ? (
              /* SUCCESS STATE */
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
                  <CheckCircle2 className="text-emerald-500" size={30} />
                </div>
                <h2 className="text-xl font-black">Check your inbox</h2>
                <p className="text-sm opacity-60 mt-2 max-w-xs mx-auto">
                  We've sent a reset link to <span className="font-semibold">{resetEmail}</span>
                </p>
                <button
                  onClick={closeForgotModal}
                  className="mt-6 text-sm font-semibold text-indigo-500 hover:text-indigo-400 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* HEADER */}

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Mail className="text-indigo-500" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">Reset Password</h2>
                      <p className="text-sm opacity-60 mt-0.5">
                        We'll email you a reset link
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closeForgotModal}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-current hover:opacity-10 transition"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* FORM */}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold mb-2 block opacity-80">
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
                      />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        autoFocus
                        className={`w-full h-14 pl-12 pr-4 rounded-2xl border outline-none transition-all duration-200 ${inputStyle}`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className={`w-full h-14 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                      resetLoading
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5"
                    }`}
                  >
                    {resetLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
