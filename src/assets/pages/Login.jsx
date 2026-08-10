import React, { useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle2, X, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Images } from "../data/data";
import customPadlock from "../images/padlock.png";
import successVideo from "../images/success.mp4";
import { auth, db } from "../../firebase/config";
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  linkWithCredential,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const Login = ({ dark }) => {
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("profile");
  provider.addScope("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [pendingEmail, setPendingEmail] = useState("");

  const getUserRole = async (userId) => {
    try {
      const userSnap = await getDoc(doc(db, "users", userId));
      if (userSnap.exists()) {
        return userSnap.data()?.role || null;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user);
          toast.success("A verification link has been sent to your email. Please verify before logging in.");
        } catch (verifyErr) {
          if (verifyErr.code === 'auth/too-many-requests') {
            toast.error("Too many attempts. Please check your inbox for an existing verification link.");
          } else {
            toast.error("Please verify your email before logging in. Check your inbox.");
          }
        }
        await signOut(auth);
        setIsLoading(false);
        return;
      }

      const role = await getUserRole(credential.user.uid);

      toast.success("Login successful");
      if (role) {
        navigate("/");
      } else {
        navigate("/complete-profile");
      }
    } catch (error) {
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const role = await getUserRole(result.user.uid);

      toast.success("Google login successful");
      if (role) {
        navigate("/");
      } else {
        navigate("/complete-profile");
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        toast.error("Google popup closed");
      } else if (error.code === "auth/account-exists-with-different-credential") {
        const cred = GoogleAuthProvider.credentialFromError(error);
        setPendingCredential(cred);
        setPendingEmail(error.customData.email);
        setShowLinkModal(true);
      } else {
        toast.error("Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    if (!linkPassword) {
      toast.error("Please enter your password");
      return;
    }
    try {
      setLinkLoading(true);
      const result = await signInWithEmailAndPassword(auth, pendingEmail, linkPassword);
      await linkWithCredential(result.user, pendingCredential);
      
      const role = await getUserRole(result.user.uid);
      toast.success("Accounts linked successfully!");
      setShowLinkModal(false);
      
      if (role) {
        navigate("/");
      } else {
        navigate("/complete-profile");
      }
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else {
        toast.error("Failed to link accounts");
      }
    } finally {
      setLinkLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent successfully");
      setResetSent(true);
      setTimeout(() => {
        closeForgotModal();
      }, 3000);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email");
      } else {
        toast.error("Unable to send reset email");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetSent(false);
    setResetEmail("");
  };

  return (
    <div className={`min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden ${dark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`}>

      {/* MOBILE HERO (unchanged) */}
      <div className="lg:hidden relative w-full h-[32vh] shrink-0">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
          alt="Students collaborating"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-10 left-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5">
             <img src={Images.logo} alt="UniHelp Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-indigo-200 text-xs font-bold tracking-wider uppercase drop-shadow-md">UniHelp</span>
            <h1 className="text-2xl font-black text-white drop-shadow-md leading-tight">Welcome back!</h1>
          </div>
        </div>
      </div>

      {/* DESKTOP IMAGE PANEL */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 w-[45%] flex-col justify-between p-12 xl:p-16 overflow-hidden z-10">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
          alt="Students learning"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1">
             <img src={Images.logo} alt="UniHelp Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">UniHelp</span>
        </div>

        <div className="relative z-10 mt-auto max-w-lg">
          <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-semibold tracking-wider mb-6">
            <Sparkles size={14} /> WELCOME BACK
          </span>
          <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] mb-5 text-white drop-shadow-md">
            Continue your <br/><span className="text-indigo-300">learning journey.</span>
          </h1>
          <p className="text-lg max-w-md text-gray-200 drop-shadow font-medium leading-relaxed">
            Join thousands of students nationwide connecting, collaborating, and excelling together.
          </p>
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="w-full lg:w-[55%] lg:ml-[45%] flex flex-col justify-center items-center px-4 pb-8 lg:p-12 xl:p-16 relative z-10 -mt-6 lg:mt-0 lg:min-h-screen">

        {/* Decorative background accents — desktop only, sits behind the card */}
        <div className="hidden lg:block absolute top-16 right-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="hidden lg:block absolute bottom-10 left-10 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div
          className={`w-full max-w-[420px] lg:max-w-[440px] mx-auto p-8 lg:p-10 xl:p-12 rounded-t-3xl lg:rounded-3xl transition-all relative z-10
          ${dark
            ? "bg-slate-900 shadow-2xl shadow-black/80 lg:bg-slate-800/60 lg:backdrop-blur-xl lg:border lg:border-slate-700/80 lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
            : "bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:bg-white/90 lg:backdrop-blur-xl lg:border lg:border-gray-100 lg:shadow-[0_20px_60px_-15px_rgba(67,56,202,0.18)]"
          }`}
        >
          <div className="mb-8 mt-2 lg:mt-0 text-center lg:text-left">
            <h2 className="text-[1.75rem] lg:text-[2.25rem] font-bold tracking-tight mb-2">Login to UniHelp</h2>
            <p className={`text-[15px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`w-full px-4 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                  dark
                    ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-4 pr-12 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    dark
                      ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors ${dark ? "text-slate-400 hover:text-slate-200" : "text-gray-400 hover:text-gray-700"}`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl text-white font-bold text-[15px] transition-all shadow-lg ${
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed shadow-none"
                  : "bg-[#4338ca] hover:bg-[#3730a3] hover:shadow-[#4338ca]/30 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className={`flex-1 h-px ${dark ? "bg-slate-700" : "bg-gray-200"}`}></div>
            <span className={`text-sm font-medium ${dark ? "text-slate-400" : "text-gray-400"}`}>or</span>
            <div className={`flex-1 h-px ${dark ? "bg-slate-700" : "bg-gray-200"}`}></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl border-2 flex items-center justify-center gap-3 text-[15px] font-bold transition-all ${
              dark
                ? "bg-transparent border-slate-700 hover:bg-slate-800 text-white"
                : "bg-transparent border-gray-200 hover:bg-gray-50 text-slate-800"
            } ${isLoading ? "opacity-70 cursor-not-allowed" : "active:scale-[0.98]"}`}
          >
            <img src={Images.google_logo} alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <p className={`text-center text-sm font-medium mt-8 ${dark ? "text-slate-300" : "text-slate-600"}`}>
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              Sign up
            </Link>
          </p>

          <div className={`hidden lg:flex items-center justify-center gap-1.5 mt-6 pt-6 border-t text-xs font-medium ${
            dark ? "border-slate-700/80 text-slate-500" : "border-gray-100 text-slate-400"
          }`}>
            <ShieldCheck size={14} />
            Your details are encrypted and never shared
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeForgotModal}
        >
          <div
            className={`w-full max-w-[420px] p-8 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden ${
              dark ? "bg-slate-800 border border-slate-700" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 z-20 p-2 rounded-full transition-colors hover:bg-black/20 bg-black/10 text-white backdrop-blur-sm"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {resetSent ? (
              <div className="text-center py-6 mt-4">
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/10 rounded-full animate-ping opacity-20"></div>
                  <video src={successVideo} autoPlay loop muted playsInline className="w-full h-full object-cover relative z-10 scale-110" />
                </div>
                <h3 className="text-xl font-bold mb-2">Check Your Email!</h3>
                <p className={`text-sm mb-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  We've sent a password reset link to<br/>
                  <span className="font-bold text-current">{resetEmail}</span>
                </p>
                <button
                  onClick={closeForgotModal}
                  className="text-sm font-bold text-indigo-600 dark:text-indigo-400"
                >
                  Back to login
                </button>
              </div>
            ) : (
              <div className="py-2">
                <div className="flex flex-col items-center justify-center w-full gap-3 mb-6">
                  <div className="w-16 h-16 flex items-center justify-center shrink-0">
                    <img 
                      src={customPadlock} 
                      alt="Padlock" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center border border-emerald-200 dark:border-emerald-500/30 gap-1.5">
                    <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={14} />
                    <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">100% Secure</span>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Forgot Password?</h3>
                  <p className={`text-sm mb-8 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    No worries! Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold block">Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-gray-400"}`} size={18} />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                          dark
                            ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                            : "bg-white border-gray-300 text-slate-900 placeholder:text-gray-400"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg ${
                      resetLoading
                        ? "bg-indigo-400 cursor-not-allowed shadow-none"
                        : "bg-[#4338ca] hover:bg-[#3730a3] hover:shadow-[#4338ca]/30 active:scale-[0.98]"
                    }`}
                  >
                    {resetLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {showLinkModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLinkModal(false)}
        >
          <div
            className={`w-full max-w-[420px] p-8 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden ${
              dark ? "bg-slate-800 border border-slate-700" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLinkModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full transition-colors hover:bg-black/20 bg-black/10 text-white backdrop-blur-sm"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="py-2">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Link Accounts</h3>
                <p className={`text-sm mb-8 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  An account already exists with <strong>{pendingEmail}</strong>. Please enter your password to link your Google account to it.
                </p>
              </div>

              <form onSubmit={handleLinkAccount} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`w-full pl-4 pr-12 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                        dark
                          ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                          : "bg-white border-gray-300 text-slate-900 placeholder:text-gray-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors ${dark ? "text-slate-400 hover:text-slate-200" : "text-gray-400 hover:text-gray-700"}`}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={linkLoading}
                  className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg ${
                    linkLoading
                      ? "bg-indigo-400 cursor-not-allowed shadow-none"
                      : "bg-[#4338ca] hover:bg-[#3730a3] hover:shadow-[#4338ca]/30 active:scale-[0.98]"
                  }`}
                >
                  {linkLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Linking...
                    </span>
                  ) : (
                    "Link Accounts"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;