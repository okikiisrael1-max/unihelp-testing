import React, { useState, useEffect } from "react";
import { Lock, KeyRound, Eye, EyeOff, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Images } from "../data/data";
import { auth } from "../../firebase/config";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { toast } from "react-toastify";
import customPadlock from "../images/padlock.png";

const ResetPassword = ({ dark }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const oobCode = queryParams.get("oobCode");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((userEmail) => {
          setEmail(userEmail);
          setIsValidCode(true);
          setIsVerifying(false);
        })
        .catch((error) => {
          toast.error("Invalid or expired reset link");
          setIsValidCode(false);
          setIsVerifying(false);
        });
    } else {
      setIsValidCode(false);
      setIsVerifying(false);
    }
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await confirmPasswordReset(auth, oobCode, password);
      setResetSuccess(true);
      toast.success("Password reset successfully");
    } catch (error) {
      toast.error("Failed to reset password. Link might have expired.");
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
            <h1 className="text-2xl font-black text-white drop-shadow-md leading-tight">Secure your account</h1>
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
            <Sparkles size={14} /> SECURITY FIRST
          </span>
          <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] mb-5 text-white drop-shadow-md">
            Set your new <br/><span className="text-indigo-300">password.</span>
          </h1>
          <p className="text-lg max-w-md text-gray-200 drop-shadow font-medium leading-relaxed">
            Choose a strong password to protect your UniHelp account.
          </p>
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="w-full lg:w-[55%] lg:ml-[45%] flex flex-col justify-center items-center px-4 pb-8 lg:p-12 xl:p-16 relative z-10 -mt-6 lg:mt-0 lg:min-h-screen">
        <div className="hidden lg:block absolute top-16 right-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="hidden lg:block absolute bottom-10 left-10 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className={`w-full max-w-[420px] lg:max-w-[440px] mx-auto p-8 lg:p-10 xl:p-12 rounded-t-3xl lg:rounded-3xl transition-all relative z-10
          ${dark
            ? "bg-slate-900 shadow-2xl shadow-black/80 lg:bg-slate-800/60 lg:backdrop-blur-xl lg:border lg:border-slate-700/80 lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
            : "bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:bg-white/90 lg:backdrop-blur-xl lg:border lg:border-gray-100 lg:shadow-[0_20px_60px_-15px_rgba(67,56,202,0.18)]"
          }`}
        >
          {isVerifying ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-semibold">Verifying your link...</p>
            </div>
          ) : !isValidCode ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Invalid or Expired Link</h3>
              <p className={`text-sm mb-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                Your password reset link has expired or is invalid. Please request a new one from the login page.
              </p>
              <Link to="/login" className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]">
                Return to Login
              </Link>
            </div>
          ) : resetSuccess ? (
            /* ------------------------------------------------------------ */
            /*  PREMIUM SUCCESS CARD — matches Login.jsx's forgot-password    */
            /*  success state for a consistent "secure action complete" moment */
            /* ------------------------------------------------------------ */
            <div className="text-center pt-3 pb-2">
              <div className="relative w-32 h-32 mx-auto mb-7">
                {/* ambient glow */}
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl animate-pulse" />

                {/* soft outer ring */}
                <div className={`absolute inset-2 rounded-full ${dark ? "bg-emerald-500/10" : "bg-emerald-50"}`} />

                {/* 3D badge — layered gradient + inset highlight for depth */}
                <div
                  className="absolute inset-5 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(155deg, #34d399 0%, #10b981 45%, #059669 100%)",
                    boxShadow:
                      "0 12px 24px -6px rgba(16,185,129,0.5), 0 4px 8px rgba(16,185,129,0.35), inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -6px 10px rgba(0,0,0,0.18)",
                  }}
                >
                  <Lock size={34} className="text-white drop-shadow-md" strokeWidth={2.25} />
                </div>

                {/* key badge */}
                <div
                  className="absolute bottom-1 right-1 w-11 h-11 rounded-2xl flex items-center justify-center rotate-[12deg]"
                  style={{
                    background: "linear-gradient(155deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%)",
                    boxShadow:
                      "0 8px 16px -4px rgba(245,158,11,0.55), inset 0 1.5px 2px rgba(255,255,255,0.55), inset 0 -4px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  <KeyRound size={18} className="text-white -rotate-[12deg]" strokeWidth={2.5} />
                </div>

                {/* checkmark badge */}
                <div
                  className={`absolute top-0 left-2 w-9 h-9 rounded-full flex items-center justify-center border-4 ${
                    dark ? "border-slate-800" : "border-white"
                  }`}
                  style={{
                    background: "linear-gradient(155deg, #4ade80 0%, #22c55e 100%)",
                    boxShadow: "0 4px 10px -2px rgba(34,197,94,0.5)",
                  }}
                >
                  <CheckCircle2 size={18} className="text-white" strokeWidth={2.5} fill="none" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold tracking-wide uppercase">
                  Password updated
                </span>
              </div>

              <h3 className="text-2xl font-black mb-2 tracking-tight">All set!</h3>
              <p className={`text-sm mb-8 leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>
                Your password has been reset successfully.
                <br />
                You can now log in with your new password.
              </p>

              <Link
                to="/login"
                className="block w-full py-3.5 bg-[#4338ca] hover:bg-[#3730a3] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-[#4338ca]/30 active:scale-[0.98]"
              >
                Login Now
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 mt-2 lg:mt-0 text-center flex flex-col items-center">
                <div className="relative mb-3 flex flex-col items-center justify-center">
                   <div className="absolute top-1 right-2 translate-x-1/2 -translate-y-1/2 z-10 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-md uppercase tracking-wider">
                     100% Secure
                   </div>
                   <img src={customPadlock} alt="Secure Reset" className="w-16 h-16 object-contain" />
                </div>
                <h2 className="text-[1.75rem] lg:text-[2.25rem] font-bold tracking-tight mb-2">Create Password</h2>
                <p className={`text-[15px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Setting new password for <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
                <div className="space-y-2">
                  <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-gray-400"}`} size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className={`w-full pl-11 pr-12 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                        dark
                          ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                          : "bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                        dark ? "text-slate-400 hover:text-slate-200" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-semibold block ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? "text-slate-500" : "text-gray-400"}`} size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={`w-full pl-11 pr-12 py-3.5 rounded-xl border text-[15px] transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                        dark
                          ? "bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                          : "bg-white border-gray-300/80 text-slate-900 placeholder:text-gray-400"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;