import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  Send,
  Bot,
  User,
  Sparkles,
  Crown,
  Trash2,
  Plus,
  FileText,
  Loader2,
  BrainCircuit,
  GraduationCap,
  Rocket,
  ShieldCheck,
  X,
  MoreVertical,
  History,
  Settings,
  HelpCircle,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Calculator,
  FlaskConical,
  Code2,
  PenLine,
  ListChecks,
  Layers,
  Pencil,
  ChevronRight,
  MessageSquarePlus,
  Paperclip,
} from "lucide-react";

import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

import { auth, db } from "../../firebase/config";

import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import { GoogleGenerativeAI } from "@google/generative-ai";

/* =====================================================
   MARKDOWN
===================================================== */

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";

/* =====================================================
   GEMINI
===================================================== */

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

const FREE_DAILY_MESSAGES = 5;
const PREMIUM_DAILY_MESSAGES = 20;

/* =====================================================
   WELCOME SUGGESTIONS — auto-sent when tapped
===================================================== */

const welcomeSuggestions = [
  {
    emoji: "📚",
    label: "Explain a topic",
    prompt: "Can you explain a topic to me in simple terms? Ask me what it is first.",
  },
  {
    emoji: "🧮",
    label: "Solve a problem",
    prompt: "I have a problem I need help solving. Ask me for the details.",
  },
  {
    emoji: "📝",
    label: "Summarize my notes",
    prompt: "I'd like to summarize some notes. Ask me to paste them or upload a PDF.",
  },
  {
    emoji: "🎯",
    label: "Help me prepare for an exam",
    prompt: "Help me prepare for an upcoming exam. Ask me what course and topics it covers.",
  },
];

/* =====================================================
   QUICK ACTION PILLS — horizontal scroll
===================================================== */

const quickActions = [
  { icon: BrainCircuit, label: "Explain", prompt: "Explain this: " },
  { icon: Calculator, label: "Solve", prompt: "Help me solve this: " },
  { icon: FileText, label: "Summarize", prompt: "Summarize this: " },
  { icon: ListChecks, label: "Quiz Me", prompt: "Quiz me on: " },
  { icon: Layers, label: "Generate Notes", prompt: "Generate study notes on: " },
  { icon: Sparkles, label: "Flashcards", prompt: "Create flashcards for: " },
];

/* =====================================================
   CAPABILITIES — grouped bottom sheet, populates input
===================================================== */

const capabilityGroups = [
  {
    title: "Study",
    items: [
      { icon: BrainCircuit, label: "Explain concepts", prompt: "Explain this concept clearly: " },
      { icon: FileText, label: "Summarize notes", prompt: "Summarize these notes: " },
      { icon: GraduationCap, label: "Generate study plan", prompt: "Create a study plan for: " },
      { icon: Layers, label: "Create flashcards", prompt: "Create flashcards for: " },
      { icon: ListChecks, label: "Quiz me", prompt: "Quiz me on: " },
    ],
  },
  {
    title: "Problem Solving",
    items: [
      { icon: Calculator, label: "Mathematics", prompt: "Help me solve this math problem: " },
      { icon: Rocket, label: "Physics", prompt: "Help me solve this physics problem: " },
      { icon: FlaskConical, label: "Chemistry", prompt: "Help me solve this chemistry problem: " },
      { icon: Code2, label: "Programming", prompt: "Help me debug/solve this code problem: " },
    ],
  },
  {
    title: "Writing",
    items: [
      { icon: PenLine, label: "Improve writing", prompt: "Improve the writing of this passage: " },
      { icon: ShieldCheck, label: "Grammar", prompt: "Check the grammar of this: " },
      { icon: Pencil, label: "Essay assistance", prompt: "Help me write an essay about: " },
      { icon: BrainCircuit, label: "Research guidance", prompt: "Guide my research on: " },
    ],
  },
];

/* =====================================================
   COMPONENT
===================================================== */

export default function AIAssistant({ dark = false }) {
  /* =====================================================
     STATES
  ===================================================== */

  const WELCOME_MESSAGE = {
    role: "ai",
    text:
      "### Welcome to Unihelp AI\n\n" +
      "Your intelligent study companion for:\n" +
      "- PDF analysis\n" +
      "- Exam preparation\n" +
      "- Assignment assistance\n" +
      "- Quiz generation\n" +
      "- Study summaries\n" +
      "- Academic support",
  };

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);

  const [pdfChunks, setPdfChunks] = useState([]);
  const [activePDF, setActivePDF] = useState(null);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [usedToday, setUsedToday] = useState(0);
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(FREE_DAILY_MESSAGES);
  const [isPremium, setIsPremium] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // UI state for the redesign
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [conversations, setConversations] = useState([]); // session history
  const [reactions, setReactions] = useState({}); // { [messageIndex]: 'like' | 'dislike' }

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  /* =====================================================
     THEME — Indigo-500 system (no default cyan/emerald AI gradients)
  ===================================================== */

  const theme = {
    bg: dark ? "bg-[#050816]" : "bg-[#f5f7ff]",
    card: dark ? "bg-white/[0.04]" : "bg-white",
    card2: dark ? "bg-white/[0.06]" : "bg-[#eef0fb]",
    border: dark ? "border-white/10" : "border-black/[0.06]",
    text: dark ? "text-white" : "text-[#0f1222]",
    subtext: dark ? "text-white/55" : "text-black/50",
    aiBubble: dark ? "bg-white/[0.05]" : "bg-white",
    overlay: dark ? "bg-black/70" : "bg-black/40",
    ring: dark ? "ring-white/10" : "ring-black/[0.06]",
  };

  const getDailyLimit = (premium, verified) =>
    premium || verified ? PREMIUM_DAILY_MESSAGES : FREE_DAILY_MESSAGES;

  /* =====================================================
     LOAD USER
  ===================================================== */

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (!auth.currentUser) return;

      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      const today = new Date().toISOString().split("T")[0];

      if (!snap.exists()) {
        const newUser = {
          usedToday: 0,
          lastActiveDate: today,
          premium: false,
          verified: false,
        };

        await setDoc(userRef, newUser);
        setRemainingMessages(FREE_DAILY_MESSAGES);
        return;
      }

      const data = snap.data();

      let premium = data.premium || false;
      let verified = data.verified || false;

      if (data.subscriptionExpiresAt) {
        const expiry = data.subscriptionExpiresAt.toDate();

        if (expiry < new Date()) {
          premium = false;
          verified = false;

          await updateDoc(userRef, {
            premium: false,
            verified: false,
            subscriptionStatus: "expired",
          });
        }
      }

      setIsPremium(premium);
      setIsVerified(verified);

      const limit = getDailyLimit(premium, verified);
      setDailyLimit(limit);

      if (data.lastActiveDate !== today) {
        await updateDoc(userRef, {
          usedToday: 0,
          lastActiveDate: today,
        });

        setUsedToday(0);
        setRemainingMessages(limit);
      } else {
        const used = data.usedToday || 0;
        setUsedToday(used);
        setRemainingMessages(Math.max(0, limit - used));
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* =====================================================
     CLOSE ⋮ MENU ON OUTSIDE CLICK
  ===================================================== */

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* =====================================================
     PDF HELPERS
  ===================================================== */

  const splitIntoChunks = (text, size = 1500) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks;
  };

  const extractPDFText = async (file) => {
    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      fullText += text + "\n";
    }

    return splitIntoChunks(fullText);
  };

  /* =====================================================
     HANDLE PDF
  ===================================================== */

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setLoading(true);
    setErrorState(false);

    try {
      const chunks = await extractPDFText(file);

      setPdfChunks(chunks);
      setActivePDF(file.name);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            `# 📄 PDF Uploaded Successfully\n\n` +
            `**${file.name}** has been connected.\n\n` +
            `You can now:\n\n` +
            `- Ask questions from the PDF\n` +
            `- Summarize chapters\n` +
            `- Generate quiz questions\n` +
            `- Explain difficult topics`,
        },
      ]);

      toast.success("PDF connected");
    } catch (err) {
      console.log(err);
      setErrorState(true);

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Failed to process PDF." },
      ]);
    }

    setLoading(false);
    e.target.value = "";
  };

  /* =====================================================
     GEMINI
  ===================================================== */

  const askGemini = async (prompt, historyOverride) => {
    const context =
      pdfChunks.length > 0 ? pdfChunks.slice(0, 10).join("\n\n") : "";

    const conversation = (historyOverride || messages)
      .slice(-8)
      .map((m) => `${m.role}: ${m.text}`)
      .join("\n");

    const finalPrompt = `
You are Unihelp AI.

CHAT HISTORY:
${conversation}

PDF CONTEXT:
${context}

USER:
${prompt}

RULES:
- Respond in proper markdown
- Use headings
- Use bullet points
- Use bold formatting properly
- Use tables when necessary
- Explain clearly
- Make responses beautiful and readable
- Prioritize PDF content if available
- Never use raw asterisks incorrectly
`;

    const result = await model.generateContent(finalPrompt);
    return result.response.text();
  };

  /* =====================================================
     UPDATE USAGE
  ===================================================== */

  const updateUsage = async () => {
    try {
      if (!auth.currentUser) return;

      const uid = auth.currentUser.uid;
      const today = new Date().toISOString().split("T")[0];
      const userRef = doc(db, "users", uid);

      await updateDoc(userRef, {
        usedToday: increment(1),
        lastActiveDate: today,
      });
    } catch (err) {
      console.log(err);
    }
  };

  /* =====================================================
     SEND MESSAGE (core logic preserved)
  ===================================================== */

  const dispatchMessage = async (promptText, historyForContext) => {
    const limit = getDailyLimit(isPremium, isVerified);

    if (usedToday >= limit) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setErrorState(false);

    try {
      const reply = await askGemini(promptText, historyForContext);

      setMessages((prev) => [...prev, { role: "ai", text: reply }]);

      const newUsed = usedToday + 1;
      setUsedToday(newUsed);
      setRemainingMessages(Math.max(0, limit - newUsed));

      await updateUsage();
    } catch (err) {
      console.log(err);
      setErrorState(true);

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ UniHelp AI failed to respond." },
      ]);
    }

    setLoading(false);
  };

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const limit = getDailyLimit(isPremium, isVerified);

    if (usedToday >= limit) {
      setShowUpgrade(true);
      return;
    }

    const userMessage = { role: "user", text };
    const nextHistory = [...messages, userMessage];

    setMessages(nextHistory);
    setInput("");

    await dispatchMessage(text, nextHistory);
  };

  /* =====================================================
     REGENERATE — resend last user message
  ===================================================== */

  const regenerate = async () => {
    if (loading) return;

    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;

    const realIndex = messages.length - 1 - lastUserIndex;
    const lastUserText = messages[realIndex].text;

    // drop everything after the last user message (i.e. the old AI reply)
    const trimmed = messages.slice(0, realIndex + 1);
    setMessages(trimmed);

    await dispatchMessage(lastUserText, trimmed);
  };

  /* =====================================================
     MESSAGE ACTIONS
  ===================================================== */

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const shareMessage = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        /* user cancelled */
      }
    } else {
      copyMessage(text);
    }
  };

  const setReaction = (index, type) => {
    setReactions((prev) => ({
      ...prev,
      [index]: prev[index] === type ? undefined : type,
    }));
  };

  /* =====================================================
     NEW CHAT — archives current conversation to session history
  ===================================================== */

  const startNewChat = () => {
    const hasContent = messages.some((m) => m.role === "user");

    if (hasContent) {
      const firstUserMsg = messages.find((m) => m.role === "user");

      setConversations((prev) => [
        {
          id: Date.now(),
          title: firstUserMsg ? firstUserMsg.text.slice(0, 48) : "Conversation",
          messages,
          updatedAt: Date.now(),
        },
        ...prev,
      ]);
    }

    setMessages([WELCOME_MESSAGE]);
    setPdfChunks([]);
    setActivePDF(null);
    setReactions({});
    setMenuOpen(false);
  };

  const clearChat = () => {
    setMessages([{ role: "ai", text: "## ✨ Chat Cleared\n\nReady for a fresh conversation." }]);
    setPdfChunks([]);
    setActivePDF(null);
    setReactions({});
    setMenuOpen(false);
    toast.success("Conversation cleared");
  };

  const openConversation = (conv) => {
    setMessages(conv.messages);
    setShowHistory(false);
  };

  const deleteConversation = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const renameConversation = (id) => {
    const conv = conversations.find((c) => c.id === id);
    const next = window.prompt("Rename conversation", conv?.title || "");
    if (!next) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: next.slice(0, 60) } : c))
    );
  };

  /* =====================================================
     ENTER
  ===================================================== */

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* =====================================================
     PREMIUM
  ===================================================== */

  const goPremium = () => {
    window.location.href = "/premium";
  };

  /* =====================================================
     DERIVED
  ===================================================== */

  const isWelcomeState = messages.length === 1 && !activePDF;
  const usagePct = dailyLimit > 0 ? Math.min(100, Math.round((usedToday / dailyLimit) * 100)) : 0;

  const groupedHistory = {
    Today: [],
    Yesterday: [],
    Previous: [],
  };

  conversations.forEach((c) => {
    const diffDays = Math.floor((Date.now() - c.updatedAt) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) groupedHistory.Today.push(c);
    else if (diffDays === 1) groupedHistory.Yesterday.push(c);
    else groupedHistory.Previous.push(c);
  });

  /* =====================================================
     MARKDOWN COMPONENTS
  ===================================================== */

  const markdownComponents = {
    h1: ({ children }) => <h1 className="text-2xl font-black mb-5 mt-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mb-4 mt-6">{children}</h2>,
    h3: ({ children }) => <h3 className="text-[18px] font-bold mb-3 mt-5">{children}</h3>,
    p: ({ children }) => <p className="leading-8 mb-4 text-[13px]">{children}</p>,
    strong: ({ children }) => (
      <strong className="font-black text-indigo-500">{children}</strong>
    ),
    ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 mb-5">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 mb-5">{children}</ol>,
    li: ({ children }) => <li className="leading-8">{children}</li>,
    table: ({ children }) => (
      <div className="overflow-x-auto mb-5 rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className={`text-left px-3 py-2 font-bold ${dark ? "bg-white/[0.06]" : "bg-[#eef0fb]"}`}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 border-t border-black/5 dark:border-white/10">{children}</td>
    ),
    code: ({ children }) => (
      <code
        className={`px-2 py-1 rounded-lg text-sm ${
          dark ? "bg-black/40 text-indigo-300" : "bg-[#eef0fb] text-indigo-700"
        }`}
      >
        {children}
      </code>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-indigo-500 pl-4 italic opacity-80 my-4">
        {children}
      </blockquote>
    ),
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={`relative min-h-screen md:pt-20 overflow-hidden flex flex-col ${theme.bg} ${theme.text}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* ============ HEADER ============ */}
      <div
        className={`relative z-30 border-b backdrop-blur-3xl px-4 md:px-8 py-3 flex items-center justify-between gap-3 ${theme.border} ${theme.card}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Bot size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">AI Assistant</p>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`hidden sm:flex px-3 py-1.5 rounded-full border text-xs font-medium ${theme.border} ${theme.card2}`}
          >
            {remainingMessages}/{dailyLimit} tokens
          </div>

          <button
            onClick={startNewChat}
            className="h-9 px-3 rounded-full bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-600 transition-colors"
          >
            <MessageSquarePlus size={15} />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${theme.card2}`}
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                className={`absolute right-0 mt-2 w-52 rounded-2xl border shadow-2xl overflow-hidden z-40 ${theme.border} ${theme.card}`}
              >
                <button
                  onClick={() => {
                    setShowHistory(true);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:${theme.card2} transition-colors`}
                >
                  <History size={16} /> Chat history
                </button>
                <button
                  onClick={clearChat}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:opacity-80 transition-colors"
                >
                  <Trash2 size={16} /> Clear conversation
                </button>
                <button
                  onClick={() => {
                    setShowCapabilities(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:opacity-80 transition-colors"
                >
                  <Settings size={16} /> AI settings
                </button>
                <button
                  onClick={() => toast.info("For help, reach out from the Support page.")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:opacity-80 transition-colors"
                >
                  <HelpCircle size={16} /> Help
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage bar */}
      <div className={`px-4 md:px-8 py-2 border-b ${theme.border} ${theme.card}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[11px] font-medium ${theme.subtext}`}>Usage</span>
          <span className={`text-[11px] font-medium ${theme.subtext}`}>
            {usedToday}/{dailyLimit} used today
          </span>
        </div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme.card2}`}>
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      {/* ============ CHAT AREA ============ */}
      <div
        ref={chatRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8"
      >
        {isWelcomeState ? (
          /* ============ WELCOME STATE ============ */
          <div className="flex flex-col items-center justify-center text-center h-full min-h-[60vh] px-2">
            <div className="h-20 w-20 rounded-[28px] bg-indigo-500 text-white flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/25">
              <GraduationCap size={34} />
            </div>

            <h1 className="text-2xl md:text-3xl font-black mb-2">
              Hi! I'm your UniHelp AI Assistant 👋
            </h1>
            <p className={`text-sm md:text-base max-w-md mb-8 ${theme.subtext}`}>
              Ask me anything about your courses, assignments, exams, or university life.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {welcomeSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.prompt)}
                  className={`flex items-center gap-3 text-left px-4 py-4 rounded-2xl border transition-all hover:border-indigo-500/40 hover:-translate-y-0.5 ${theme.border} ${theme.card}`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ============ MESSAGES ============ */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col relative ${
                  msg.role === "user" ? "items-end" : "items-start ml-5"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="h-12 w-12 text-white rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 absolute z-10 -top-5 -left-5">
                    <Bot size={20} />
                  </div>
                )}

                <div
                  className={`max-w-[92%] md:max-w-[75%] rounded-[26px] px-6 py-5 border backdrop-blur-2xl shadow-sm overflow-hidden ${
                    msg.role === "user"
                      ? "bg-indigo-500 border-transparent text-white"
                      : `${theme.aiBubble} ${theme.border}`
                  }`}
                >
                  {msg.role === "ai" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-8 whitespace-pre-wrap text-[14px]">{msg.text}</p>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="h-12 w-12 text-black rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0 absolute -top-5 right-0 border border-black/5">
                    <User size={20} />
                  </div>
                )}

                {/* AI message actions */}
                {msg.role === "ai" && i > 0 && (
                  <div className="flex items-center gap-1 mt-2 ml-1">
                    <button
                      onClick={() => copyMessage(msg.text)}
                      title="Copy"
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${theme.card2}`}
                    >
                      <Copy size={13} />
                    </button>

                    {i === messages.length - 1 && (
                      <button
                        onClick={regenerate}
                        title="Regenerate"
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${theme.card2}`}
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => setReaction(i, "like")}
                      title="Like"
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                        reactions[i] === "like" ? "text-indigo-500" : ""
                      } ${theme.card2}`}
                    >
                      <ThumbsUp size={13} />
                    </button>

                    <button
                      onClick={() => setReaction(i, "dislike")}
                      title="Dislike"
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                        reactions[i] === "dislike" ? "text-rose-500" : ""
                      } ${theme.card2}`}
                    >
                      <ThumbsDown size={13} />
                    </button>

                    <button
                      onClick={() => shareMessage(msg.text)}
                      title="Share"
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${theme.card2}`}
                    >
                      <Share2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ============ LOADING ============ */}
        {loading && (
          <div className="flex gap-4 ml-5">
            <div className="h-12 w-12 rounded-2xl text-white bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot size={20} />
            </div>

            <div
              className={`rounded-[26px] rounded-bl-md px-6 py-5 border flex items-center gap-2 ${theme.border} ${theme.card}`}
            >
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
              </span>
              <span className={`text-xs ${theme.subtext}`}>Let's figure this out together...</span>
            </div>
          </div>
        )}

        {/* ============ ERROR STATE ============ */}
        {errorState && !loading && (
          <div
            className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 ml-5 ${theme.border} ${theme.card2}`}
          >
            <p className="text-xs">
              Something went wrong. Check your connection and try again.
            </p>
            <button
              onClick={regenerate}
              className="text-xs font-semibold text-indigo-500 shrink-0"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ============ QUICK ACTIONS ============ */}
      <div className="relative z-20 px-4 md:px-8 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  setInput(qa.prompt);
                  inputRef.current?.focus();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 hover:border-indigo-500/40 transition-colors ${theme.border} ${theme.card}`}
              >
                <Icon size={13} className="text-indigo-500" />
                {qa.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowCapabilities(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 border-indigo-500/30 text-indigo-500"
          >
            <ChevronRight size={13} />
            More tools
          </button>
        </div>
      </div>

      {/* ============ INPUT AREA ============ */}
      <div
        className="relative z-20 px-4 md:px-8 pb-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        {activePDF && (
          <div
            className={`flex items-center justify-between mb-2 px-4 py-2 rounded-2xl border text-xs ${theme.border} ${theme.card2}`}
          >
            <span className="flex items-center gap-2 truncate">
              <FileText size={13} className="text-indigo-500 shrink-0" />
              <span className="truncate">{activePDF}</span>
            </span>
            <button
              onClick={() => {
                setActivePDF(null);
                setPdfChunks([]);
              }}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div
          className={`rounded-[30px] border p-1.5 md:p-2 backdrop-blur-3xl shadow-lg ${theme.border} ${theme.card}`}
        >
          <div className="flex items-end gap-2">
            <label
              className={`h-11 w-11 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0 ${theme.card2}`}
              title="Attach a PDF"
            >
              <Paperclip size={19} />
              <input type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            </label>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask UniHelp AI anything..."
              className={`flex-1 resize-none bg-transparent outline-none max-h-32 py-2.5 text-[15px] ${theme.text}`}
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="h-11 w-11 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 flex items-center justify-center transition-all shadow-md shrink-0"
            >
              {loading ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}
            </button>
          </div>
        </div>

        <p className={`text-center text-[11px] mt-2.5 ${theme.subtext}`}>
          Free users: 5/day · Premium users: 20/day
        </p>
      </div>

      {/* ============ CAPABILITIES BOTTOM SHEET ============ */}
      {showCapabilities && (
        <div
          className={`fixed inset-0 z-50 flex items-end md:items-center justify-center backdrop-blur-sm ${theme.overlay}`}
          onClick={() => setShowCapabilities(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full md:max-w-lg max-h-[80vh] overflow-y-auto rounded-t-[32px] md:rounded-[32px] border p-6 ${theme.border} ${theme.card}`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">AI capabilities</h3>
              <button onClick={() => setShowCapabilities(false)} className={`h-8 w-8 rounded-full flex items-center justify-center ${theme.card2}`}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6">
              {capabilityGroups.map((group, gi) => (
                <div key={gi}>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${theme.subtext}`}>
                    {group.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item, ii) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={ii}
                          onClick={() => {
                            setInput(item.prompt);
                            setShowCapabilities(false);
                            setTimeout(() => inputRef.current?.focus(), 50);
                          }}
                          className={`flex items-center gap-2 px-3 py-3 rounded-2xl border text-xs font-medium text-left hover:border-indigo-500/40 transition-colors ${theme.border} ${theme.card2}`}
                        >
                          <Icon size={15} className="text-indigo-500 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ HISTORY BOTTOM SHEET ============ */}
      {showHistory && (
        <div
          className={`fixed inset-0 z-50 flex items-end md:items-center justify-center backdrop-blur-sm ${theme.overlay}`}
          onClick={() => setShowHistory(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full md:max-w-lg max-h-[80vh] overflow-y-auto rounded-t-[32px] md:rounded-[32px] border p-6 ${theme.border} ${theme.card}`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">Chat history</h3>
              <button onClick={() => setShowHistory(false)} className={`h-8 w-8 rounded-full flex items-center justify-center ${theme.card2}`}>
                <X size={16} />
              </button>
            </div>

            {conversations.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ${theme.card2}`}>
                  <History size={26} className={theme.subtext} />
                </div>
                <p className="text-sm font-semibold mb-1">No conversations yet</p>
                <p className={`text-xs ${theme.subtext}`}>Your conversations will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedHistory).map(([label, items]) =>
                  items.length > 0 ? (
                    <div key={label}>
                      <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${theme.subtext}`}>
                        {label}
                      </p>
                      <div className="space-y-2">
                        {items.map((c) => (
                          <div
                            key={c.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${theme.border} ${theme.card2}`}
                          >
                            <div className="h-9 w-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                              <Bot size={15} />
                            </div>
                            <button
                              onClick={() => openConversation(c)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className="text-sm font-semibold truncate">{c.title}</p>
                              <p className={`text-[11px] ${theme.subtext}`}>
                                {new Date(c.updatedAt).toLocaleDateString()}
                              </p>
                            </button>
                            <button
                              onClick={() => renameConversation(c.id)}
                              className="h-7 w-7 rounded-full flex items-center justify-center opacity-60 hover:opacity-100"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteConversation(c.id)}
                              className="h-7 w-7 rounded-full flex items-center justify-center opacity-60 hover:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ PREMIUM / INSUFFICIENT TOKENS MODAL ============ */}
      {showUpgrade && (
        <div className={`fixed inset-0 z-50 backdrop-blur-2xl flex items-center justify-center p-4 ${theme.overlay}`}>
          <div className={`w-full max-w-md rounded-[32px] border p-8 text-center shadow-2xl ${theme.border} ${theme.card}`}>
            <div className="h-20 w-20 rounded-[26px] bg-indigo-500 flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-indigo-500/25">
              <Crown size={36} />
            </div>

            <h2 className="text-2xl font-black mb-3">Daily limit reached</h2>

            <p className={`text-sm leading-7 mb-2 ${theme.subtext}`}>
              You've used {usedToday} of {dailyLimit} messages today.
            </p>
            <p className={`text-sm leading-7 ${theme.subtext}`}>
              Free users get 5 AI chats daily. Premium users get 20 AI chats daily.
            </p>

            <button
              onClick={goPremium}
              className="w-full h-13 rounded-2xl bg-indigo-500 text-white font-bold mt-8 hover:bg-indigo-600 transition-colors"
            >
              Upgrade Now
            </button>

            <button onClick={() => setShowUpgrade(false)} className={`mt-4 text-sm ${theme.subtext}`}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}