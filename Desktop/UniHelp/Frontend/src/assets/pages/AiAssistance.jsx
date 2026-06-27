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

/* =====================================================
   CONFIG
===================================================== */

const FREE_DAILY_MESSAGES = 5;

const PREMIUM_DAILY_MESSAGES = 20;

const quickPrompts = [
  {
    icon: BrainCircuit,

    text: "Explain this topic simply",
  },

  {
    icon: GraduationCap,

    text: "Generate exam questions",
  },

  {
    icon: Rocket,

    text: "Summarize this PDF",
  },

  {
    icon: ShieldCheck,

    text: "Help me prepare for exams",
  },
];

/* =====================================================
   COMPONENT
===================================================== */

export default function AIAssistant({ dark = true }) {
  /* =====================================================
     STATES
  ===================================================== */

  const [messages, setMessages] = useState([
    {
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
    },
  ]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [pdfChunks, setPdfChunks] = useState([]);

  const [activePDF, setActivePDF] = useState(null);

  const [showUpgrade, setShowUpgrade] = useState(false);

  const [usedToday, setUsedToday] = useState(0);

  const [remainingMessages, setRemainingMessages] = useState(0);

  const [dailyLimit, setDailyLimit] = useState(FREE_DAILY_MESSAGES);

  const [isPremium, setIsPremium] = useState(false);

  const [isVerified, setIsVerified] = useState(false);

  const chatRef = useRef(null);

  /* =====================================================
     THEME
  ===================================================== */

  const theme = {
    bg: dark ? "bg-[#050816]" : "bg-[#f7f9fc]",

    card: dark ? "bg-white/[0.04]" : "bg-white",

    card2: dark ? "bg-white/[0.06]" : "bg-[#f3f4f6]",

    border: dark ? "border-white/10" : "border-black/10",

    text: dark ? "text-white" : "text-black",

    subtext: dark ? "text-white/60" : "text-black/60",

    aiBubble: dark ? "bg-white/[0.05]" : "bg-white",

    overlay: dark ? "bg-black/70" : "bg-black/40",
  };

  /* =====================================================
     GET LIMIT
  ===================================================== */

  const getDailyLimit = (premium, verified) => {
    if (premium || verified) {
      return PREMIUM_DAILY_MESSAGES;
    }

    return FREE_DAILY_MESSAGES;
  };

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

      /* CREATE DOC */

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

      /* CHECK PREMIUM */

      let premium = data.premium || false;

      let verified = data.verified || false;

      /* AUTO EXPIRE */

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

      /* RESET DAILY */

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

    const pdf = await pdfjsLib.getDocument({
      data: buffer,
    }).promise;

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
    } catch (err) {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",

          text: "⚠️ Failed to process PDF.",
        },
      ]);
    }

    setLoading(false);
  };

  /* =====================================================
     GEMINI
  ===================================================== */

  const askGemini = async (prompt) => {
    const context =
      pdfChunks.length > 0 ? pdfChunks.slice(0, 10).join("\n\n") : "";

    const conversation = messages
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
     SEND MESSAGE
  ===================================================== */

  const sendMessage = async () => {
    if (!input.trim() || loading) {
      return;
    }

    const limit = getDailyLimit(isPremium, isVerified);

    /* LIMIT */

    if (usedToday >= limit) {
      setShowUpgrade(true);

      return;
    }

    const userMessage = {
      role: "user",

      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;

    setInput("");

    setLoading(true);

    try {
      const reply = await askGemini(currentInput);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",

          text: reply,
        },
      ]);

      const newUsed = usedToday + 1;

      setUsedToday(newUsed);

      setRemainingMessages(Math.max(0, limit - newUsed));

      await updateUsage();
    } catch (err) {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",

          text: "⚠️ AI failed to respond.",
        },
      ]);
    }

    setLoading(false);
  };

  /* =====================================================
     CLEAR CHAT
  ===================================================== */

  const clearChat = () => {
    setMessages([
      {
        role: "ai",

        text: "# ✨ Chat Cleared\n\nReady for a fresh conversation.",
      },
    ]);

    setPdfChunks([]);

    setActivePDF(null);
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
     MARKDOWN COMPONENTS
  ===================================================== */

  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="text-3xl font-black mb-5 mt-2">{children}</h1>
    ),

    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mb-4 mt-6">{children}</h2>
    ),

    h3: ({ children }) => (
      <h3 className="text-xl font-bold mb-3 mt-5">{children}</h3>
    ),

    p: ({ children }) => (
      <p className="leading-8 mb-4 text-[15px]">{children}</p>
    ),

    strong: ({ children }) => (
      <strong className="font-black text-violet-400">{children}</strong>
    ),

    ul: ({ children }) => (
      <ul className="list-disc pl-6 space-y-2 mb-5">{children}</ul>
    ),

    ol: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-2 mb-5">{children}</ol>
    ),

    li: ({ children }) => <li className="leading-8">{children}</li>,

    code: ({ children }) => (
      <code
        className={`px-2 py-1 rounded-lg text-sm ${
          dark ? "bg-black/40 text-cyan-300" : "bg-slate-200 text-blue-700"
        }`}
      >
        {children}
      </code>
    ),

    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-violet-500 pl-4 italic opacity-80 my-4">
        {children}
      </blockquote>
    ),
  };

  return (
    <div
      className={`
      relative min-h-screen md:pt-20 overflow-hidden
      flex flex-col
      ${theme.bg}
      ${theme.text}
    `}
    >
      {/* HEADER */}

      <div
        className={`
        relative z-20
        border-b
        backdrop-blur-3xl
        px-4 md:px-8
        py-2
        flex items-center justify-between
        ${theme.border}
        ${theme.card}
      `}
      >
        <div
          className={`hidden md:flex px-4 py-2 rounded-2xl border text-sm ${theme.border} ${theme.card2}`}
        >
          {remainingMessages} / {dailyLimit} left
        </div>
      </div>

      {/* CHAT */}

      <div
        ref={chatRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8"
      >

        {/* MESSAGES */}

        {messages.map((msg, i) => (
          <div id="chat"
            key={i}
            className={`flex gap-4 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "ai" && (
              <div className="h-12 w-12 text-white rounded-2xl bg-linear-to-br from-violet-600 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-2xl shrink-0">
                <Bot size={20} />
              </div>
            )}

            <div
              className={`
                max-w-[92%] md:max-w-[75%]
                rounded-[30px]
                px-6 py-5
                border backdrop-blur-2xl
                shadow-2xl overflow-hidden
                ${
                  msg.role === "user"
                    ? "bg-linear-to-br from-blue-600 to-violet-600 border-transparent rounded-br-md text-white"
                    : `${theme.aiBubble} ${theme.border} rounded-bl-md`
                }
              `}
            >
              {msg.role === "ai" ? (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="leading-8 whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>

            {msg.role === "user" && (
              <div className="h-12 w-12 text-white rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shrink-0">
                <User size={20} />
              </div>
            )}
          </div>
        ))}

        {/* LOADING */}

        {loading && (
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-2xl text-white bg-linear-to-br from-violet-600 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-2xl">
              <Bot size={20} />
            </div>

            <div
              className={`rounded-[30px] rounded-bl-md px-6 py-5 border flex items-center gap-3 ${theme.border} ${theme.card}`}
            >
              <Loader2 size={18} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}

      <div className="relative z-20 px-4 md:px-8 pb-5">
        <div
          className={`rounded-[35px] border p-1 md:p-3 backdrop-blur-3xl shadow-2xl ${theme.border} ${theme.card}`}
        >
          <div className="flex items-end gap-3">
            {/* FILE */}

            <label
              className={`h-13 w-13 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 shrink-0 ${theme.card2}`}
            >
              <Plus size={22} />

              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFile}
              />
            </label>

            {/* INPUT */}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask Unihelp AI anything..."
              className={`flex-1 resize-none bg-transparent outline-none max-h-40 py-3 text-[15px] ${theme.text}`}
            />

            {/* SEND */}

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="h-13 w-13 rounded-full text-white bg-linear-to-r from-violet-600 to-blue-600 hover:scale-105 disabled:opacity-50 flex items-center justify-center transition-all shadow-2xl shrink-0"
            >
              <Send size={22} />
            </button>
          </div>
        </div>

        <p className={`text-center text-xs mt-3 ${theme.subtext}`}>
          Free users: 5/day • Premium users: 20/day
        </p>
      </div>

      {/* PREMIUM MODAL */}

      {showUpgrade && (
        <div
          className={`fixed inset-0 z-50 backdrop-blur-2xl flex items-center justify-center p-4 ${theme.overlay}`}
        >
          <div
            className={`w-full max-w-md rounded-[35px] border p-8 text-center shadow-2xl ${theme.border} ${theme.card}`}
          >
            <div className="h-24 w-24 rounded-[30px] bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Crown size={42} />
            </div>

            <h2 className="text-3xl font-black mb-3">Daily Limit Reached</h2>

            <p className={`text-sm leading-7 ${theme.subtext}`}>
              Free users get 5 AI chats daily.
              <br />
              Premium users get 20 AI chats daily.
            </p>

            <button
              onClick={goPremium}
              className="w-full h-14 rounded-2xl bg-linear-to-r from-violet-600 to-blue-600 font-bold mt-8 hover:scale-[1.02] transition-all"
            >
              Upgrade Now
            </button>

            <button
              onClick={() => setShowUpgrade(false)}
              className={`mt-5 text-sm ${theme.subtext}`}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
