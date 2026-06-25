import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  BrainCircuit,
  BookOpen,
  Send,
  Sparkles,
  Bot,
  User2,
  Mic,
  Trash2,
  GraduationCap,
  Lightbulb,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Crown,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config"; 

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const JambAITutor = ({
  dark
}) => {
  const navigate =
    useNavigate();

  const auth = getAuth();

  const messagesEndRef =
    useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [redirectMessage, setRedirectMessage] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("Mathematics");

  const [chat, setChat] =
    useState([
      {
        role: "assistant",
        text: "Hello 👋 I’m your AI Tutor. Ask me any JAMB question and I’ll explain it in a simple way.",
      },
    ]);

  /* ================= THEME ================= */

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-slate-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200 shadow-sm";

  const fade = dark
    ? "text-slate-400"
    : "text-slate-500";

  const input = dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
    : "bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400";

  /* ================= SUBJECTS ================= */

  const subjects = [
    "Mathematics",
    "English",
    "Physics",
    "Chemistry",
    "Biology",
    "Economics",
    "Government",
    "Literature",
  ];

  /* ================= QUICK PROMPTS ================= */

  const prompts = [
    "Explain quadratic equations",
    "Teach me photosynthesis",
    "JAMB chemistry tricks",
    "English comprehension tips",
    "How to score above 300",
    "Physics formulas summary",
  ];

  /* ================= SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [chat]);

  /* ================= PROFESSIONAL REDIRECT ================= */

  const redirectToSubscription =
    (
      reason =
        "Premium access is required to continue."
    ) => {
      setRedirectMessage(
        reason
      );

      setTimeout(() => {
        navigate(
          "/subscription",
          {
            state: {
              message:
                reason,
            },
          }
        );
      }, 3500);
    };

  /* ================= CHECK SUBSCRIPTION ================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            redirectToSubscription(
              "Please sign in to access UniHelp AI Tutor."
            );

            return;
          }

          try {
            const [subSnap, userSnap] = await Promise.all([
              getDoc(
                doc(
                  db,
                  "subscriptions",
                  user.uid
                )
              ),
              getDoc(
                doc(
                  db,
                  "users",
                  user.uid
                )
              ),
            ]);

            const data = subSnap.exists()
              ? subSnap.data()
              : {};
            const userData = userSnap.exists()
              ? userSnap.data()
              : {};

            const subscription = data?.subscription;

            const isActive =
              subscription?.active === true ||
              data?.premium === true ||
              data?.verified === true ||
              data?.subscriptionStatus === "active" ||
              userData?.premium === true ||
              userData?.verified === true ||
              userData?.subscriptionStatus === "active";

            if (
              !isActive
            ) {
              let reason =
                "Your premium subscription is currently inactive.";

              if (
                subscription?.status ===
                "rejected"
              ) {
                reason =
                  "Your subscription request was reviewed but could not be approved. Please subscribe again to continue using AI Tutor.";
              }

              if (
                subscription?.status ===
                "expired"
              ) {
                reason =
                  "Your premium subscription has expired. Renew your plan to continue learning with AI Tutor.";
              }

              redirectToSubscription(
                reason
              );

              return;
            }

            setCheckingAccess(
              false
            );
          } catch (error) {
            console.error(
              error
            );

            redirectToSubscription(
              "We could not verify your subscription status at the moment. Please try again."
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [auth]);

  /* ================= GEMINI ================= */

  const generateGeminiReply =
    async (
      userMessage
    ) => {
      const prompt = `
You are UniHelp AI Tutor for JAMB students.

Subject: ${selectedSubject}

Student Question:
${userMessage}

Instructions:
- Teach like an expert tutor.
- Explain in simple language.
- Use bullet points.
- Give examples.
- Include shortcuts and exam tips.
- Keep it clean and easy to understand.
- End with 2 practice questions.
`;

      const response =
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              {
                contents: [
                  {
                    parts: [
                      {
                        text: prompt,
                      },
                    ],
                  },
                ],
              }
            ),
          }
        );

      const data =
        await response.json();

      return (
        data?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text ||
        "Sorry, I couldn't generate a response."
      );
    };

  /* ================= SEND ================= */

  const handleSend =
    async () => {
      if (
        !message.trim() ||
        loading
      )
        return;

      const userText =
        message;

      const userMessage = {
        role: "user",
        text: userText,
      };

      setChat((prev) => [
        ...prev,
        userMessage,
      ]);

      setMessage("");

      setLoading(true);

      try {
        const aiReplyText =
          await generateGeminiReply(
            userText
          );

        const aiReply = {
          role: "assistant",
          text: aiReplyText,
        };

        setChat((prev) => [
          ...prev,
          aiReply,
        ]);
      } catch (error) {
        console.error(
          error
        );

        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Something went wrong while generating your response.",
          },
        ]);
      }

      setLoading(false);
    };

  /* ================= CLEAR CHAT ================= */

  const clearChat = () => {
    setChat([
      {
        role: "assistant",
        text: "Chat cleared successfully. Start learning again 🚀",
      },
    ]);
  };

  /* ================= ACCESS SCREEN ================= */

  if (
    checkingAccess &&
    redirectMessage
  ) {
    return (
      <div className="min-h-screen bg-[#020617] relative overflow-hidden flex items-center justify-center px-6">
        {/* BACKGROUND */}

        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-indigo-500/20 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/20 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-xl w-full">
          <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[35px] p-10 text-center">
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8">
              <Crown
                size={42}
                className="text-white"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-6">
              <ShieldCheck size={16} />
              UniHelp Premium
            </div>

            <h1 className="text-4xl font-black text-white mb-5">
              Premium Access Required
            </h1>

            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              {redirectMessage}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-8">
              <h3 className="text-white font-bold text-lg mb-3">
                What you unlock with Premium
              </h3>

              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-3">
                  <Sparkles
                    size={18}
                    className="text-indigo-400 mt-1"
                  />

                  <span>
                    Unlimited AI tutoring for all JAMB subjects
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <BrainCircuit
                    size={18}
                    className="text-purple-400 mt-1"
                  />

                  <span>
                    Smart explanations powered by Gemini AI
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap
                    size={18}
                    className="text-green-400 mt-1"
                  />

                  <span>
                    Personalized learning support and exam preparation
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-indigo-400 font-semibold">
              <Loader2 className="animate-spin" />

              Redirecting to subscription page...
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${bg}`}
    >
      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[420px] h-[420px] bg-indigo-500/10 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* TOPBAR */}

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                navigate(-1)
              }
              className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all ${
                dark
                  ? "bg-white/5 hover:bg-white/10 border border-white/10"
                  : "bg-white border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <ArrowLeft
                size={22}
              />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-3">
                <Sparkles size={15} />
                AI Powered
              </div>

              <h1 className="text-4xl sm:text-5xl font-black">
               Unihelp AI Tutor
              </h1>

              <p
                className={`mt-2 ${fade}`}
              >
                Learn smarter with
                your personal JAMB AI
                assistant.
              </p>
            </div>
          </div>

          <button
            onClick={
              clearChat
            }
            className="h-13 px-5 rounded-2xl bg-red-500 hover:bg-red-600 transition-all text-white font-semibold flex items-center gap-2"
          >
            <Trash2 size={18} />
            Clear Chat
          </button>
        </div>

        {/* GRID */}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* SIDEBAR */}

          <div className="space-y-6">
            {/* SUBJECTS */}

            <div
              className={`${card} rounded-[30px] p-5`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center">
                  <BookOpen size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Subjects
                  </h2>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Choose topic area
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {subjects.map(
                  (
                    subject,
                    index
                  ) => (
                    <button
                      key={index}
                      onClick={() =>
                        setSelectedSubject(
                          subject
                        )
                      }
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        selectedSubject ===
                        subject
                          ? "bg-indigo-500 text-white"
                          : dark
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      <span className="font-medium">
                        {subject}
                      </span>

                      <ChevronRight
                        size={18}
                      />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* QUICK PROMPTS */}

            <div
              className={`${card} rounded-[30px] p-5`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center">
                  <Lightbulb size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Quick Prompts
                  </h2>

                  <p
                    className={`text-sm ${fade}`}
                  >
                    Start instantly
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {prompts.map(
                  (
                    prompt,
                    index
                  ) => (
                    <button
                      key={index}
                      onClick={() =>
                        setMessage(
                          prompt
                        )
                      }
                      className={`w-full text-left p-4 rounded-2xl transition-all ${
                        dark
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      <p className="font-medium">
                        {prompt}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* CHAT */}

          <div className="xl:col-span-3">
            <div
              className={`${card} rounded-[35px] h-[85vh] flex flex-col overflow-hidden`}
            >
              {/* HEADER */}

              <div
                className={`p-5 border-b ${
                  dark
                    ? "border-white/10"
                    : "border-slate-200"
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <GraduationCap
                      size={28}
                    />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      {selectedSubject} Tutor
                    </h2>

                    <p
                      className={`text-sm ${fade}`}
                    >
                      Unihelp AI is online
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-full bg-green-500/10 text-green-400 text-sm font-semibold">
                  Premium Active
                </div>
              </div>

              {/* MESSAGES */}

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {chat.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className={`flex ${
                        item.role ===
                        "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[75%] rounded-[28px] p-5 ${
                          item.role ===
                          "user"
                            ? "bg-indigo-500 text-white"
                            : dark
                            ? "bg-white/5 border border-white/10"
                            : "bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              item.role ===
                              "user"
                                ? "bg-white/20"
                                : "bg-indigo-500 text-white"
                            }`}
                          >
                            {item.role ===
                            "user" ? (
                              <User2
                                size={18}
                              />
                            ) : (
                              <Bot
                                size={18}
                              />
                            )}
                          </div>

                          <h3 className="font-bold">
                            {item.role ===
                            "user"
                              ? "You"
                              : "AI Tutor"}
                          </h3>
                        </div>

                        <p className="leading-relaxed whitespace-pre-line">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  )
                )}

                {loading && (
                  <div className="flex justify-start">
                    <div
                      className={`rounded-[28px] p-5 ${
                        dark
                          ? "bg-white/5 border border-white/10"
                          : "bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin text-indigo-500" />

                        <span>
                          unihelp AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />
              </div>

              {/* INPUT */}

              <div
                className={`p-5 border-t ${
                  dark
                    ? "border-white/10"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      dark
                        ? "bg-white/5 border border-white/10"
                        : "bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Mic size={22} />
                  </button>

                  <input
                    type="text"
                    value={message}
                    onChange={(e) =>
                      setMessage(
                        e.target
                          .value
                      )
                    }
                    onKeyDown={(
                      e
                    ) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        handleSend();
                      }
                    }}
                    placeholder={`Ask anything in ${selectedSubject}...`}
                    className={`flex-1 h-14 rounded-2xl border px-5 outline-none transition-all ${input}`}
                  />

                  <button
                    onClick={
                      handleSend
                    }
                    disabled={
                      loading
                    }
                    className="w-14 h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition-all flex items-center justify-center text-white"
                  >
                    <Send
                      size={20}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JambAITutor;
