import React, { useState } from "react";
import {
  Mail,
  Send,
  User,
  MessageSquare,
  Phone,
  MapPin,
  Instagram,
  Linkedin,
  Globe,
  Clock3,
  ShieldCheck,
  Headphones,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const subjectCategories = [
  "General Support",
  "Technical Issue",
  "Billing & Account",
  "Partnership & Media",
];

export default function Contact({ dark = true }) {
  const navigate = useNavigate();

  // Active Tab Toggle State: 'form' | 'info'
  const [activeTab, setActiveTab] = useState("form");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState(null);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  /* =========================================================
     SUBMIT HANDLER
  ========================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("All fields are required. Please complete the form before submitting.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "An error occurred while submitting your inquiry.");
        return;
      }

      setSuccess("Your message has been logged. A support representative will respond shortly.");
      setName("");
      setEmail("");
      setSubject("General Support");
      setMessage("");
    } catch (err) {
      console.error("Contact Form Error:", err);
      setError("Network connection error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     THEME CONFIGURATION (Indigo Accent Focus)
  ========================================================= */
  const theme = {
    bg: dark ? "bg-[#090D16] text-slate-100" : "bg-slate-50 text-slate-900",
    card: dark
      ? "bg-[#111726]/80 border-slate-800/80 backdrop-blur-xl shadow-2xl"
      : "bg-white border-slate-200/80 shadow-xl shadow-slate-200/50",
    border: dark ? "border-slate-800" : "border-slate-200",
    subtext: dark ? "text-slate-400" : "text-slate-500",
    input: dark
      ? "bg-[#0B101D] border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
  };

  /* =========================================================
     CONTACT CHANNELS DATA
  ========================================================= */
  const contactDetails = [
    {
      key: "email",
      icon: Mail,
      label: "Official Email",
      value: "support@unihelp.com",
      actionType: "copy",
    },
    {
      key: "phone",
      icon: Phone,
      label: "Direct Phone Line",
      value: "+234 911 533 6339",
      actionType: "call",
      href: "tel:+2349115336339",
    },
    {
      key: "location",
      icon: MapPin,
      label: "Headquarters",
      value: "Lagos, Nigeria",
      actionType: "link",
      href: "https://maps.google.com/?q=Lagos,+Nigeria",
    },
    {
      key: "website",
      icon: Globe,
      label: "Official Website",
      value: "www.unihelp.com",
      actionType: "link",
      href: "https://www.unihelp.com",
    },
    {
      key: "linkedin",
      icon: Linkedin,
      label: "LinkedIn Profile",
      value: "UniHelp Platform",
      actionType: "link",
      href: "https://linkedin.com/company/unihelp",
    },
    {
      key: "instagram",
      icon: Instagram,
      label: "Instagram Account",
      value: "@unihelp",
      actionType: "link",
      href: "https://instagram.com/unihelp",
    },
  ];

  return (
    <div className={`relative min-h-screen w-full transition-colors duration-300 ${theme.bg} font-sans py-8 md:py-16 overflow-hidden`}>
      
      {/* Brand Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none opacity-30 blur-[140px] -z-0">
        <div className="w-full h-full bg-indigo-500/30" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/40">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              dark
                ? "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            <ArrowLeft size={14} />
            <span>Return</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Desk SLA: Response &lt; 2hrs</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles size={13} />
            <span>Help & Support Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Contact <span className="text-indigo-500">UniHelp</span>
          </h1>
          <p className={`text-sm mt-2 leading-relaxed ${theme.subtext}`}>
            Have an inquiry regarding platform features, technical assistance, or institutional partnerships? We are here to assist you.
          </p>
        </div>

        {/* Segmented Switch Toggle */}
        <div className={`p-1.5 rounded-2xl border mb-8 grid grid-cols-2 max-w-md mx-auto backdrop-blur-md ${
          dark ? "bg-slate-900/90 border-slate-800" : "bg-slate-200/70 border-slate-300"
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === "form"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare size={14} />
            <span>Send Message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === "info"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 size={14} />
            <span>Contact Information</span>
          </button>
        </div>

        {/* =========================================================
           TAB 1: MESSAGE FORM
        ========================================================= */}
        {activeTab === "form" && (
          <div className={`rounded-3xl border p-6 sm:p-10 ${theme.card}`}>
            
            {/* Status Feedback */}
            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-start gap-3">
                <Check size={16} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400 flex items-start gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name & Email Row */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-indigo-400">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full h-12 px-4 text-sm rounded-xl border outline-none transition-all ${theme.input}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-indigo-400">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full h-12 px-4 text-sm rounded-xl border outline-none transition-all ${theme.input}`}
                  />
                </div>
              </div>

              {/* Subject Category Pills & Custom Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-indigo-400">
                  Topic Category <span className="text-rose-500">*</span>
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {subjectCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSubject(cat)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                        subject === cat
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold"
                          : dark
                          ? "bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  placeholder="Subject line..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full h-12 px-4 text-sm rounded-xl border outline-none transition-all ${theme.input}`}
                />
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-indigo-400">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide comprehensive details regarding your inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`w-full p-4 text-sm rounded-xl border outline-none resize-none transition-all ${theme.input}`}
                />
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-xl font-bold text-xs tracking-wider uppercase text-white transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] ${
                  loading
                    ? "bg-indigo-500/50 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Transmitting Message...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
           TAB 2: CONTACT INFORMATION
        ========================================================= */}
        {activeTab === "info" && (
          <div className="space-y-6">
            
            {/* Direct Channels List */}
            <div className={`rounded-3xl border divide-y divide-slate-800/40 overflow-hidden ${theme.card}`}>
              {contactDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="p-5 flex items-center justify-between gap-4 transition-colors hover:bg-indigo-500/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                      </div>
                    </div>

                    <div>
                      {item.actionType === "copy" && (
                        <button
                          type="button"
                          onClick={() => handleCopy(item.value, item.key)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                            copiedKey === item.key
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : dark
                              ? "border-slate-800 text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400"
                              : "border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          {copiedKey === item.key ? (
                            <>
                              <Check size={13} />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}

                      {item.actionType === "call" && (
                        <a
                          href={item.href}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                            dark
                              ? "border-slate-800 text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400"
                              : "border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          <Phone size={13} />
                          <span>Call</span>
                        </a>
                      )}

                      {item.actionType === "link" && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                            dark
                              ? "border-slate-800 text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400"
                              : "border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          <ExternalLink size={13} />
                          <span>Visit</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Support SLA Box */}
            <div className={`rounded-3xl border p-6 ${theme.card}`}>
              <h3 className="text-xs font-bold tracking-wider uppercase text-indigo-400 mb-4">
                Operations & Availability
              </h3>

              <div className="grid sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.03]">
                  <div className="flex items-center gap-2 text-indigo-400 mb-1 font-semibold">
                    <Clock3 size={15} />
                    <span>Operating Hours</span>
                  </div>
                  <p className="font-bold text-sm">Mon - Fri (08:00 - 20:00)</p>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.03]">
                  <div className="flex items-center gap-2 text-indigo-400 mb-1 font-semibold">
                    <ShieldCheck size={15} />
                    <span>Average SLA</span>
                  </div>
                  <p className="font-bold text-sm">Under 24 Hours</p>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.03]">
                  <div className="flex items-center gap-2 text-indigo-400 mb-1 font-semibold">
                    <Headphones size={15} />
                    <span>Support Desk</span>
                  </div>
                  <p className="font-bold text-sm">Tier-1 & Enterprise</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}