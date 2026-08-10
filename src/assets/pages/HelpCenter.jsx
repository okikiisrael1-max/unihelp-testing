import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Headphones, 
  HelpCircle, 
  UploadCloud, 
  Download, 
  ShieldCheck, 
  MessageSquare, 
  Sparkles,
  Search,
  X,
  ChevronRight,
  FileQuestion,
  ExternalLink
} from "lucide-react";

const sections = [
  {
    id: "uploads",
    icon: UploadCloud,
    title: "Upload & Preview Issues",
    category: "Files",
    body: "Ensure your file is a valid PDF and under the size limit. If preview pop-ups fail to load, verify Cloudinary configuration keys and ensure browser pop-up blockers are disabled.",
    popularQuestions: [
      "Why isn't my PDF previewing?",
      "Supported file formats and size limits"
    ]
  },
  {
    id: "downloads",
    icon: Download,
    title: "Download & Viewer Controls",
    category: "Access",
    body: "File downloads are strictly restricted to file owners and premium tier subscribers. If a file opens directly inside the inline viewer, use the dedicated viewer action toolbar.",
    popularQuestions: [
      "Where do I find my downloaded files?",
      "Can non-premium members download files?"
    ]
  },
  {
    id: "payments",
    icon: ShieldCheck,
    title: "Payment & Subscription Proof",
    category: "Billing",
    body: "Premium tier upgrades and paid resource access are manually verified. Please attach your transaction receipt or proof of payment directly inside your account panel.",
    popularQuestions: [
      "How long does payment approval take?",
      "Accepted payment verification methods"
    ]
  },
  {
    id: "support",
    icon: MessageSquare,
    title: "General Help & Technical FAQ",
    category: "Support",
    body: "Got stuck with account configuration or environment setup? Browse our structured setup guides or open a ticket directly to talk with our team.",
    popularQuestions: [
      "How to request account deletion",
      "Updating account security credentials"
    ]
  },
];

const categories = ["All", "Files", "Access", "Billing", "Support"];

export default function HelpCenter({ dark = true }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Instant Filter Logic
  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesCategory = 
        selectedCategory === "All" || section.category === selectedCategory;
      
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesTitle = section.title.toLowerCase().includes(query);
      const matchesBody = section.body.toLowerCase().includes(query);
      const matchesQuestions = section.popularQuestions.some((q) =>
        q.toLowerCase().includes(query)
      );

      return matchesCategory && (matchesTitle || matchesBody || matchesQuestions);
    });
  }, [searchQuery, selectedCategory]);

  // Color Palette tokens
  const theme = {
    bg: dark ? "bg-[#030712] text-slate-100" : "bg-slate-50 text-slate-900",
    cardBg: dark 
      ? "bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90" 
      : "bg-white border-slate-200 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5",
    subText: dark ? "text-slate-400" : "text-slate-600",
    inputBg: dark ? "bg-slate-900/90 border-slate-800 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm",
    pillActive: "bg-indigo-600 text-white shadow-md shadow-indigo-600/20",
    pillInactive: dark ? "bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900",
    badge: dark ? "bg-slate-800/90 text-indigo-400 border-slate-700/50" : "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className={`relative min-h-screen md:mt-10 w-full transition-colors duration-300 ${theme.bg} overflow-hidden font-sans`}>
      
      {/* Background Decorative Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none opacity-40 blur-[130px] -z-0">
        <div className="w-full h-full bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-pink-500/10" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        
        {/* Top Header & Navigation Action */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              dark 
                ? "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
            }`}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${theme.badge}`}>
            24/7 Knowledge Base
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-indigo-400 mb-6 backdrop-blur-md">
            <Sparkles size={15} className="animate-pulse text-indigo-400" />
            <span>How can we help you today?</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Support that keeps your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              workflow moving
            </span>
          </h1>
          
          <p className={`mt-4 text-base sm:text-lg leading-relaxed ${theme.subText}`}>
            Search our guides or browse categories below to quickly troubleshoot file uploads, access limits, and payments.
          </p>
        </div>

        {/* Dynamic Search & Filter Toolbar */}
        <div className="max-w-2xl mx-auto mb-12 space-y-5">
          {/* Search Input Box */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={20} />
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics, keywords, or error codes..."
              className={`w-full pl-11 pr-10 py-4 text-sm sm:text-base rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${theme.inputBg}`}
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all duration-200 ${
                    isActive ? theme.pillActive : theme.pillInactive
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section Grid */}
        {filteredSections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <div 
                  key={section.id} 
                  className={`group relative rounded-3xl p-6 sm:p-8 border backdrop-blur-sm transition-all duration-300 flex flex-col justify-between ${theme.cardBg}`}
                >
                  <div>
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <Icon size={24} />
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${theme.badge}`}>
                        {section.category}
                      </span>
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-bold mb-3 tracking-tight group-hover:text-indigo-400 transition-colors">
                      {section.title}
                    </h2>
                    <p className={`text-sm sm:text-base leading-relaxed mb-6 ${theme.subText}`}>
                      {section.body}
                    </p>
                  </div>

                  {/* Frequently Asked Quick Links inside Card */}
                  <div className={`pt-4 border-t ${dark ? "border-slate-800/80" : "border-slate-100"}`}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
                      Popular Questions
                    </p>
                    <ul className="space-y-1.5">
                      {section.popularQuestions.map((question, i) => (
                        <li key={i}>
                          <button 
                            onClick={() => navigate("/faq")}
                            className={`text-xs sm:text-sm text-left flex items-center gap-1.5 hover:text-indigo-400 transition-colors ${theme.subText}`}
                          >
                            <ChevronRight size={13} className="text-indigo-400 shrink-0" />
                            <span className="line-clamp-1">{question}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search Results State */
          <div className={`text-center py-16 px-4 rounded-3xl border mb-16 ${theme.cardBg}`}>
            <div className="inline-flex h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 items-center justify-center mb-4">
              <FileQuestion size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className={`max-w-md mx-auto text-sm mb-6 ${theme.subText}`}>
              We couldn't find any help articles matching "<span className="font-semibold text-indigo-400">{searchQuery}</span>". Try refining your search or reach out to our team directly.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Humanized Support Callout Banner */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 border backdrop-blur-md ${theme.cardBg}`}>
          {/* Subtle Background Radial Glow */}
          <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Human Support Team Online
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                Still need a hand?
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed ${theme.subText}`}>
                If you are running into persistent errors, drop us a line with details like the page URL, file type, and exact error message. Our team usually responds within a few hours.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center shrink-0">
              <button 
                onClick={() => navigate("/contact")} 
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 font-semibold text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 active:scale-[0.98]"
              >
                <Headphones size={18} />
                <span>Contact Support</span>
              </button>
              
              <button 
                onClick={() => navigate("/faq")} 
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-semibold border transition-all duration-200 active:scale-[0.98] ${
                  dark 
                    ? "bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white" 
                    : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                }`}
              >
                <HelpCircle size={18} />
                <span>Open FAQ</span>
                <ExternalLink size={15} className="opacity-60" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}