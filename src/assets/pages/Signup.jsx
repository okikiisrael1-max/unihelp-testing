import React, { useState } from "react";
import { Eye, EyeOff, Lock, User, Mail, Sparkles, ShieldCheck, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Images } from "../data/data";
import { auth, db } from "../../firebase/config";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0 - 4
};

const STRENGTH_META = [
  { label: "", color: "bg-gray-200 dark:bg-slate-700" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-orange-500" },
  { label: "Good", color: "bg-blue-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

const SignUp = ({ dark }) => {
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("profile");
  provider.addScope("email");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const createUserDoc = async (userId, data) => {
    try {
      await setDoc(doc(db, "users", userId), {
        ...data,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

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

  const validate = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      await createUserDoc(credential.user.uid, {
        name: fullName.trim(),
        email: email.trim(),
      });

      toast.success("Account created successfully");
      navigate("/select-role");
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("An account already exists with this email");
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

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const existingRole = await getUserRole(result.user.uid);
      await createUserDoc(result.user.uid, {
        name: result.user.displayName || "",
        email: result.user.email || "",
      });

      toast.success("Google sign-up successful");
      if (existingRole) {
        navigate("/");
      } else {
        navigate("/select-role");
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        toast.error("Google popup closed");
      } else {
        toast.error("Google sign-up failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden ${dark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`}>

      {/* MOBILE HERO */}
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
            <h1 className="text-2xl font-black text-white drop-shadow-md leading-tight">Join UniHelp</h1>
          </div>
        </div>
      </div>

      {/* DESKTOP IMAGE PANEL */}
      <div className="hidden lg:flex w-[45%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden z-10">
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
            <Sparkles size={14} /> GET STARTED
          </span>
          <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] mb-5 text-white drop-shadow-md">
            Create your account, <br/><span className="text-indigo-300">start learning today.</span>
          </h1>
          <p className="text-lg max-w-md text-gray-200 drop-shadow font-medium leading-relaxed">
            Join thousands of students nationwide connecting, collaborating, and excelling together.
          </p>
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center px-4 pb-8 lg:p-12 xl:p-16 relative z-10 -mt-6 lg:mt-0 lg:min-h-screen">

        <div className="hidden lg:block absolute top-16 right-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="hidden lg:block absolute bottom-10 left-10 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div
          className={`w-full max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] mx-auto p-8 lg:p-10 xl:p-12 rounded-t-3xl lg:rounded-3xl transition-all relative z-10 overflow-hidden
          ${dark
            ? "bg-slate-900 shadow-2xl shadow-black/80 lg:bg-slate-800/60 lg:backdrop-blur-xl lg:border lg:border-slate-700/80 lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]" : "bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:bg-white/90 lg:backdrop-blur-xl lg:border lg:border-gray-100 lg:shadow-[0_20px_60px_-15px_rgba(67,56,202,0.18)]"
          }`}
        >
          <div className="hidden lg:block absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />

          <div className="mb-8 mt-2 lg:mt-0 text-center lg:text-left">
            <h2 className="text-[1.75rem] lg:text-[2.25rem] font-bold tracking-tight mb-2">Create your account</h2>
            <p className={`text-[15px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Let's get you set up. It only takes a minute.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
            <div className="space-y-2">
              <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-gray-400"}`} size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    dark
                      ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-gray-400"}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    dark
                      ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-4">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Password
                </label>
                <span className={`text-xs ${dark ? "text-slate-500" : "text-gray-400"}`}>Min. 8 characters</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
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

              {password.length > 0 && (
                <div className="pt-1">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < strength ? STRENGTH_META[strength].color : (dark ? "bg-slate-700" : "bg-gray-200")
                        }`}
                      />
                    ))}
                  </div>
                  {STRENGTH_META[strength].label && (
                    <p className={`text-xs font-semibold mt-1.5 ${
                      strength <= 1 ? "text-red-500" : strength === 2 ? "text-orange-500" : strength === 3 ? "text-blue-500" : "text-emerald-500"
                    }`}>
                      {STRENGTH_META[strength].label} password
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`w-full pl-4 pr-12 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 ${
                    passwordsMismatch
                      ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                      : "focus:ring-indigo-500/20 focus:border-indigo-500"
                  } ${
                    dark
                      ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors ${dark ? "text-slate-400 hover:text-slate-200" : "text-gray-400 hover:text-gray-700"}`}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-xs font-semibold text-red-500">Passwords do not match</p>
              )}
            </div>
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <span className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="peer sr-only"
                />
                <span className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-colors peer-checked:bg-indigo-600 peer-checked:border-indigo-600 ${
                  dark ? "border-slate-600" : "border-gray-300"
                }`}>
                  {agreedToTerms && <Check size={13} className="text-white" />}
                </span>
              </span>
              <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
                I agree to the{" "}
                <Link to="/terms" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Privacy Policy
                </Link>
              </span>
            </label>

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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className={`flex-1 h-px ${dark ? "bg-slate-700" : "bg-gray-200"}`}></div>
            <span className={`text-sm font-medium ${dark ? "text-slate-400" : "text-gray-400"}`}>or</span>
            <div className={`flex-1 h-px ${dark ? "bg-slate-700" : "bg-gray-200"}`}></div>
          </div>

          <button
            onClick={handleGoogleSignUp}
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
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              Login
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
    </div>
  );
};

export default SignUp;