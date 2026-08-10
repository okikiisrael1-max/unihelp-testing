import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Home,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  Search,
  X,
  Sparkles,
  ShieldCheck,
  CreditCard,
  FileQuestion,
  Headphones,
  ThumbsUp,
  ThumbsDown,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = ["All", "Academic", "Marketplace", "Hostels", "Billing", "Community"];

const rawFaqs = [
  // Academic
  {
    id: 1,
    category: "Academic",
    icon: <GraduationCap size={20} />,
    question: "What is UniHelp?",
    answer:
      "UniHelp is an all-in-one student ecosystem designed to streamline campus life. It provides direct access to crowdsourced lecture notes, verified past questions, GPA/CGPA calculators, learning videos, hostel listings, a student marketplace, and campus discussion forums."
  },
  {
    id: 2,
    category: "Academic",
    icon: <BookOpen size={20} />,
    question: "How do I upload lecture notes or study material?",
    answer:
      "Navigate to the 'Lecture Notes' section, click the 'Upload' button, select your file (PDF formats recommended), add relevant tags (Course Code, Department, Semester), and hit submit. Your contribution helps peer students prepare for exams."
  },
  {
    id: 3,
    category: "Academic",
    icon: <BookOpen size={20} />,
    question: "Can I download lecture notes for free?",
    answer:
      "Basic notes and foundational study guides are accessible to all free users. Advanced study guides, verified solution keys, and bulk PDF downloads require an active UniHelp Premium subscription."
  },
  {
    id: 4,
    category: "Academic",
    icon: <GraduationCap size={20} />,
    question: "How accurate is the GPA & CGPA Calculator?",
    answer:
      "Our calculator supports custom grade-point scale settings (4.0, 5.0, or custom institutional scales). Simply select your university scale, input your course unit load along with earned letter grades, and the algorithm instantly calculates semester GPA and cumulative CGPA."
  },
  {
    id: 5,
    category: "Academic",
    icon: <BookOpen size={20} />,
    question: "Can I request specific lecture notes if they are missing?",
    answer:
      "Yes! Use the 'Request Note' feature inside the study hub. Fill in the course code and university name. Fellow students and verified contributors from your institution will be notified to upload matching material."
  },
  {
    id: 6,
    category: "Academic",
    icon: <BookOpen size={20} />,
    question: "Are learning videos vetted for curriculum relevance?",
    answer:
      "Curated videos undergo community rating and automated verification to ensure they match standard university course syllabi."
  },

  // Hostels
  {
    id: 7,
    category: "Hostels",
    icon: <Home size={20} />,
    question: "How does the hostel marketplace work?",
    answer:
      "Students, property managers, and verified agents list off-campus accommodations complete with photos, rent breakdown, distance from campus, and utility details. Students can filter listings and message property contacts directly."
  },
  {
    id: 8,
    category: "Hostels",
    icon: <Home size={20} />,
    question: "How do I avoid hostel scams?",
    answer:
      "Always inspect properties in person or arrange a video walkthrough before transferring funds. Look for listings tagged with the 'Verified Agent' or 'Verified Student' badge on UniHelp."
  },

  // Marketplace
  {
    id: 9,
    category: "Marketplace",
    icon: <ShoppingBag size={20} />,
    question: "Can I sell textbooks and gadgets on UniHelp?",
    answer:
      "Absolutely. The Student Marketplace allows you to list textbooks, electronics, dorm accessories, or freelance services directly to peers on your campus."
  },
  {
    id: 10,
    category: "Marketplace",
    icon: <ShoppingBag size={20} />,
    question: "Does UniHelp charge seller commissions?",
    answer:
      "Peer-to-peer listings on the basic marketplace are 100% commission-free. Featured top-of-page listings can be boosted for a minor promotional fee."
  },

  // Billing
  {
    id: 11,
    category: "Billing",
    icon: <CreditCard size={20} />,
    question: "How do I become a Premium user?",
    answer:
      "Go to the 'Upgrade to Premium' section in your account dashboard, pick a monthly or annual plan, and complete checkout via secure card payment or manual bank proof upload."
  },
  {
    id: 12,
    category: "Billing",
    icon: <CreditCard size={20} />,
    question: "What is manual payment verification?",
    answer:
      "If you choose bank transfer or campus agent payment methods, upload your transaction receipt under 'Payment Verification'. Our support team verifies proof within 1–3 hours."
  },

  // Community & Security
  {
    id: 13,
    category: "Community",
    icon: <MessageCircle size={20} />,
    question: "What is Community Chat?",
    answer:
      "Community Chat offers campus-specific channels where students discuss academic challenges, share project ideas, collaborate on assignments, and post extracurricular announcements."
  },
  {
    id: 14,
    category: "Community",
    icon: <ShieldCheck size={20} />,
    question: "Is my personal data and uploaded content secure?",
    answer:
      "Yes. UniHelp utilizes end-to-end TLS encryption for data transmission and row-level access controls for uploaded documents and payment information."
  }
];

export default function FAQPage({ dark = true }) {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [feedbackState, setFeedbackState] = useState({});

  // Dynamic filter based on query and selected category
  const filteredFaqs = useMemo(() => {
    return rawFaqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesQuestion = faq.question.toLowerCase().includes(query);
      const matchesAnswer = faq.answer.toLowerCase().includes(query);
      const matchesCategoryName = faq.category.toLowerCase().includes(query);

      return matchesCategory && (matchesQuestion || matchesAnswer || matchesCategoryName);
    });
  }, [searchQuery, selectedCategory]);

  const handleFeedback = (faqId, type) => {
    setFeedbackState((prev) => ({
      ...prev,
      [faqId]: type
    }));
  };

  // Color tokens matching the upgraded HelpCenter theme
  const theme = {
    bg: dark ? "bg-[#030712] text-slate-100" : "bg-slate-50 text-slate-900",
    cardBg: dark
      ? "bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40"
      : "bg-white border-slate-200 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5",
    subText: dark ? "text-slate-400" : "text-slate-600",
    inputBg: dark
      ? "bg-slate-900/90 border-slate-800 text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm",
    pillActive: "bg-indigo-600 text-white shadow-md shadow-indigo-600/20",
    pillInactive: dark
      ? "bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900",
    badge: dark
      ? "bg-slate-800/90 text-indigo-400 border-slate-700/50"
      : "bg-indigo-50 text-indigo-600 border-indigo-100"
  };

  return (
    <div className={`relative min-h-screen md:mt-10 w-full transition-colors duration-300 ${theme.bg} overflow-hidden font-sans`}>
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none opacity-40 blur-[130px] -z-0">
        <div className="w-full h-full bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-pink-500/10" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Navigation Action */}
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
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
            {rawFaqs.length} Help Articles
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-indigo-400 mb-6 backdrop-blur-md">
            <Sparkles size={15} className="animate-pulse text-indigo-400" />
            <span>UniHelp Answers & Documentation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>

          <p className={`mt-4 text-base sm:text-lg leading-relaxed ${theme.subText}`}>
            Everything you need to know about academic tools, marketplace guidelines, hostel listings, and premium features.
          </p>
        </div>

        {/* Live Search & Category Toolbar */}
        <div className="max-w-2xl mx-auto mb-12 space-y-5">
          {/* Search Box */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={20} />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, tools, or keywords..."
              className={`w-full pl-11 pr-10 py-4 text-sm sm:text-base rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${theme.inputBg}`}
            />

            {searchQuery && (
              <button
                type="button"
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
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setOpenIndex(null);
                  }}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all duration-200 ${
                    isActive ? theme.pillActive : theme.pillInactive
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion List */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-4 mb-16">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const feedback = feedbackState[faq.id];

              return (
                <div
                  key={faq.id}
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden backdrop-blur-sm ${theme.cardBg}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between text-left gap-4 focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        {faq.icon}
                      </div>

                      <div>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1 inline-block ${theme.badge}`}>
                          {faq.category}
                        </span>
                        <h3 className="font-bold text-base sm:text-lg tracking-tight">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? "rotate-180 bg-indigo-500/20 text-indigo-400"
                          : dark
                          ? "bg-slate-800 text-slate-400"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className={`px-5 pb-6 sm:px-6 sm:pb-6 pt-2 border-t ${dark ? "border-slate-800/80" : "border-slate-100"}`}>
                      <p className={`text-sm sm:text-base leading-relaxed sm:pl-16 ${theme.subText}`}>
                        {faq.answer}
                      </p>

                      {/* Helpful Feedback Widget */}
                      <div className="mt-5 sm:pl-16 flex items-center justify-between pt-4 border-t border-dashed border-slate-700/30">
                        <span className="text-xs font-medium text-slate-500">
                          Was this answer helpful?
                        </span>

                        <div className="flex items-center gap-2">
                          {feedback ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              <Check size={13} /> Thanks for your feedback!
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleFeedback(faq.id, "yes")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                  dark
                                    ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
                                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                <ThumbsUp size={13} /> Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedback(faq.id, "no")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                  dark
                                    ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-rose-400"
                                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                <ThumbsDown size={13} /> No
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
            <h3 className="text-xl font-bold mb-2">No matching questions found</h3>
            <p className={`max-w-md mx-auto text-sm mb-6 ${theme.subText}`}>
              We couldn't find any questions matching "<span className="font-semibold text-indigo-400">{searchQuery}</span>". Try different keywords or contact support directly.
            </p>
            <button
              type="button"
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

        {/* Contact Support CTA Banner */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 border backdrop-blur-md ${theme.cardBg}`}>
          <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-3">
                <Headphones size={13} />
                Need Personalized Help?
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                Still have unanswered questions?
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${theme.subText}`}>
                Our support team is online to assist you with account issues, payment verifications, and academic uploads.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/help-center")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 font-semibold text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shrink-0"
            >
              <HelpCircle size={18} />
              <span>Visit Help Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}