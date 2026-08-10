import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  FileWarning,
  Send,
  ShieldAlert,
  Flag,
  Ban,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  Siren,
  UserX,
  ArrowLeft,
  Info,
  Check
} from "lucide-react";

export default function Report({ dark = true }) {
  const [category, setCategory] = useState("Scam");
  const [reportedUser, setReportedUser] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!category || !details.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/reports/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          reportedUser,
          details,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Failed to submit report. Please try again.");
        return;
      }

      setSuccess("Report submitted successfully. Our team will review it shortly.");
      setCategory("Scam");
      setReportedUser("");
      setDetails("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  /* Dynamic Theme Rules */
  const theme = {
    bg: dark ? "bg-[#070913]" : "bg-[#f8fafc]",
    card: dark ? "bg-white/[0.03]" : "bg-white",
    cardHover: dark ? "hover:bg-white/[0.06]" : "hover:bg-slate-50",
    border: dark ? "border-white/10" : "border-slate-200",
    text: dark ? "text-white" : "text-slate-900",
    subtext: dark ? "text-slate-400" : "text-slate-600",
    input: dark
      ? "bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:ring-red-500/20",
    optionBg: dark ? "bg-slate-900 text-white" : "bg-white text-slate-900",
  };

  const reportTypes = [
    {
      id: "Scam",
      icon: Ban,
      title: "Scam & Fraud",
      desc: "Fake services, phishing, or monetary deceit",
      color: "from-rose-500 to-orange-500",
      accent: "text-rose-500",
    },
    {
      id: "Harassment",
      icon: ShieldAlert,
      title: "Harassment",
      desc: "Bullying, threats, hate speech, or abuse",
      color: "from-pink-500 to-rose-500",
      accent: "text-pink-500",
    },
    {
      id: "Copyright",
      icon: FileWarning,
      title: "Copyright",
      desc: "Intellectual property or material theft",
      color: "from-violet-500 to-purple-500",
      accent: "text-violet-500",
    },
    {
      id: "Spam",
      icon: Flag,
      title: "Spam & Misleading",
      desc: "Repeated messages, bot activity, or rumors",
      color: "from-blue-500 to-cyan-500",
      accent: "text-blue-500",
    },
  ];

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} relative overflow-x-hidden transition-colors duration-300`}>
      {/* BACKGROUND GLOW ACCENTS */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-full max-w-7xl -translate-x-1/2 overflow-hidden opacity-40 blur-[120px]">
        <div className="absolute top-[-100px] left-1/4 h-[300px] w-[300px] rounded-full bg-red-600" />
        <div className="absolute top-[-50px] right-1/4 h-[250px] w-[250px] rounded-full bg-amber-600" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        {/* NAV HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${theme.border} ${theme.card} ${theme.cardHover}`}
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        </div>

        {/* HERO SECTION */}
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-500 sm:text-sm mb-4">
            <Siren size={15} className="animate-pulse" />
            <span>Safety & Moderation Center</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Report an{" "}
            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Issue
            </span>
          </h1>

          <p className={`mt-3 sm:mt-4 text-sm sm:text-base md:text-lg leading-relaxed ${theme.subtext}`}>
            Help maintain a secure platform. Select a category below or fill out the report form directly to alert our moderation team.
          </p>
        </div>

        {/* MAIN RESPONSIVE GRID */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          
          {/* LEFT SIDE: CATEGORY CARDS & SAFETY INFOGRAPHICS */}
          <div className="space-y-6 lg:col-span-6 xl:col-span-5">
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Select Category
                </h2>
                <span className="text-xs text-slate-500">Click to pre-fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {reportTypes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 outline-none ${
                        isSelected
                          ? "border-red-500/80 bg-red-500/[0.06] ring-2 ring-red-500/20"
                          : `${theme.border} ${theme.card} ${theme.cardHover}`
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}

                      <div className="mb-3">
                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md`}>
                          <Icon size={20} />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm sm:text-base">{item.title}</h3>
                        <p className={`mt-1 text-xs leading-relaxed ${theme.subtext}`}>
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SAFETY GUARANTEES CARD */}
            <div className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${theme.border} ${theme.card}`}>
              <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Moderation Guarantee</h3>
                  <p className={`text-xs ${theme.subtext}`}>How your report is handled</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold">24-Hour Review Window</h4>
                    <p className={`text-xs mt-0.5 ${theme.subtext}`}>Our safety team active monitors logs to review incoming tickets promptly.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserX size={18} className="text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold">Decisive Sanctions</h4>
                    <p className={`text-xs mt-0.5 ${theme.subtext}`}>Offenders are subject to warnings, account restrictions, or permanent bans.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3 size={18} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold">Strict Privacy</h4>
                    <p className={`text-xs mt-0.5 ${theme.subtext}`}>Your identity is kept completely anonymous from the accused user.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: REPORT FORM */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-8 shadow-xl backdrop-blur-xl ${theme.border} ${theme.card}`}>
              <div className="mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Report Form
                </h2>
                <p className="text-sm font-semibold mt-1">
                  Provide specific details to expedite investigation
                </p>
              </div>

              {/* BANNERS */}
              {success && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <div>{success}</div>
                </div>
              )}

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 text-sm font-medium">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* CATEGORY SELECTOR DROPDOWN */}
                <div>
                  <label className="mb-2 flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-500" />
                      Category <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full h-12 rounded-xl border px-4 text-sm font-medium outline-none transition-all focus:ring-2 ${theme.input}`}
                  >
                    <option value="" disabled className={theme.optionBg}>
                      Select a category
                    </option>
                    <option value="Scam" className={theme.optionBg}>
                      Scam or Fraud
                    </option>
                    <option value="Harassment" className={theme.optionBg}>
                      Harassment or Abuse
                    </option>
                    <option value="Copyright" className={theme.optionBg}>
                      Copyright Violation
                    </option>
                    <option value="Spam" className={theme.optionBg}>
                      Spam or Misleading Information
                    </option>
                    <option value="Other" className={theme.optionBg}>
                      Other Safety Issue
                    </option>
                  </select>
                </div>

                {/* REPORTED USER INPUT */}
                <div>
                  <label className="mb-2 flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <span className="flex items-center gap-1.5">
                      <FileWarning size={15} className="text-orange-400" />
                      Reported User
                    </span>
                    <span className={`text-xs ${theme.subtext}`}>Optional</span>
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. @username or user email"
                    value={reportedUser}
                    onChange={(e) => setReportedUser(e.target.value)}
                    className={`w-full h-12 rounded-xl border px-4 text-sm font-medium outline-none transition-all focus:ring-2 ${theme.input}`}
                  />
                </div>

                {/* DETAILS TEXTAREA */}
                <div>
                  <label className="mb-2 flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <span>
                      Incident Details <span className="text-red-500">*</span>
                    </span>
                    <span className={`text-xs ${theme.subtext}`}>
                      {details.length}/1000
                    </span>
                  </label>

                  <textarea
                    rows={5}
                    maxLength={1000}
                    placeholder="Please describe what happened in detail (links, timestamps, message content)..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`w-full rounded-xl border p-4 text-sm font-medium outline-none transition-all focus:ring-2 resize-none ${theme.input}`}
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.99] shadow-lg ${
                    loading
                      ? "bg-slate-700 cursor-not-allowed opacity-70"
                      : "bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:opacity-95 shadow-red-500/20"
                  }`}
                >
                  <Send size={16} className={`transition-transform ${loading ? "animate-pulse" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`} />
                  <span>{loading ? "Submitting Report..." : "Submit Incident Report"}</span>
                </button>
              </form>

              {/* FOOTER NOTICE */}
              <div className={`mt-6 flex items-center gap-2 border-t border-white/5 pt-4 text-xs ${theme.subtext}`}>
                <Info size={14} className="shrink-0" />
                <span>False reports violate our terms of service and may result in penalties.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}