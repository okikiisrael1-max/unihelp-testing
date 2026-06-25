import { useState } from "react";

import {
  AlertTriangle,
  FileWarning,
  Send,
  ShieldAlert,
  Flag,
  Ban,
  ShieldCheck,
  Clock3,
  Sparkles,
  CheckCircle2,
  Siren,
  UserX,
  ArrowBigLeft,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Report({
  dark
}) {
  const [category, setCategory] =
    useState("");

  const [reportedUser, setReportedUser] =
    useState("");

  const [details, setDetails] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const API_URL =
    import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !category ||
      !details
    ) {
      setError(
        "Please fill all required fields"
      );

      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/api/report`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            category,
            reportedUser,
            details,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        setError(
          data.message ||
            "Failed to submit report"
        );

        return;
      }

      setSuccess(
        "Report submitted successfully 🚨"
      );

      setCategory("");
      setReportedUser("");
      setDetails("");
    } catch (err) {
      console.log(err);

      setError(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     THEME
  ========================================================= */

  const theme = {
    bg: dark
      ? "bg-[#050816]"
      : "bg-[#f5f7fb]",

    card: dark
      ? "bg-white/[0.05]"
      : "bg-white",

    border: dark
      ? "border-white/10"
      : "border-black/10",

    text: dark
      ? "text-white"
      : "text-black",

    subtext: dark
      ? "text-white/60"
      : "text-black/60",

    input: dark
      ? "bg-white/[0.04]"
      : "bg-[#f8fafc]",
  };

  /* =========================================================
     REPORT OPTIONS
  ========================================================= */

  const reportTypes = [
    {
      icon: Ban,
      title: "Scam",
      desc: "Fraudulent activity or fake services",
      color:
        "from-red-500 to-orange-500",
    },

    {
      icon: ShieldAlert,
      title: "Harassment",
      desc: "Bullying, threats or abuse",
      color:
        "from-pink-500 to-red-500",
    },

    {
      icon: FileWarning,
      title: "Copyright",
      desc: "Unauthorized content usage",
      color:
        "from-violet-500 to-fuchsia-500",
    },

    {
      icon: Flag,
      title: "Spam",
      desc: "Repeated or unwanted messages",
      color:
        "from-cyan-500 to-blue-500",
    },
  ];

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 md:px-8 py-10 ${theme.bg} ${theme.text}`}
    >
      {/* =========================================================
         BACKGROUND GLOW
      ========================================================= */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-120px] left-[-120px] w-[320px] h-[320px] rounded-full bg-red-500/20 blur-[120px]" />

        <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] rounded-full bg-orange-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* =========================================================
           HERO
        ========================================================= */}

        <div className="text-center mb-14">
          <button onClick={()=> navigate(-1)} className="absolute left-2.5 top-2.5 p-2.5 bg-white/10 rounded-lg flex gap-0.5"> <ArrowLeft/>Back</button>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl mb-6">
            <Siren size={16} />

            <span className="text-sm">
              Safety Center
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight">
            Report an{" "}
            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
              Issue
            </span>
          </h1>

          <p
            className={`max-w-2xl mx-auto mt-5 text-lg leading-8 ${theme.subtext}`}
          >
            Help keep Unihelp
            safe by reporting
            scams, harassment,
            abuse, spam, or
            inappropriate
            behavior.
          </p>
        </div>

        {/* =========================================================
           MAIN GRID
        ========================================================= */}

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* =========================================================
             LEFT
          ========================================================= */}

          <div className="space-y-6">
            {/* REPORT TYPES */}

            <div className="grid sm:grid-cols-2 gap-5">
              {reportTypes.map(
                (
                  item,
                  index
                ) => {
                  const Icon =
                    item.icon;

                  return (
                    <div
                      key={
                        index
                      }
                      className={`rounded-[30px] border p-6 backdrop-blur-2xl transition-all hover:scale-[1.02] shadow-2xl ${theme.border} ${theme.card}`}
                    >
                      <div
                        className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-xl mb-5`}
                      >
                        <Icon
                          size={
                            24
                          }
                        />
                      </div>

                      <h3 className="text-xl font-bold">
                        {
                          item.title
                        }
                      </h3>

                      <p
                        className={`text-sm mt-3 leading-7 ${theme.subtext}`}
                      >
                        {
                          item.desc
                        }
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            {/* INFO CARD */}

            <div
              className={`rounded-[35px] border p-7 backdrop-blur-3xl shadow-2xl ${theme.border} ${theme.card}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl">
                  <ShieldCheck
                    size={
                      28
                    }
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Community Safety
                  </h2>

                  <p
                    className={
                      theme.subtext
                    }
                  >
                    Unihelp moderation
                    system
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <CheckCircle2
                    size={
                      20
                    }
                    className="text-green-400 mt-1"
                  />

                  <div>
                    <h4 className="font-semibold">
                      Fast Review
                    </h4>

                    <p
                      className={`text-sm leading-6 ${theme.subtext}`}
                    >
                      Reports are reviewed
                      by moderators within
                      24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <UserX
                    size={
                      20
                    }
                    className="text-red-400 mt-1"
                  />

                  <div>
                    <h4 className="font-semibold">
                      Account Actions
                    </h4>

                    <p
                      className={`text-sm leading-6 ${theme.subtext}`}
                    >
                      Violating users may
                      be warned, suspended
                      or banned.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock3
                    size={
                      20
                    }
                    className="text-cyan-400 mt-1"
                  />

                  <div>
                    <h4 className="font-semibold">
                      Secure Reports
                    </h4>

                    <p
                      className={`text-sm leading-6 ${theme.subtext}`}
                    >
                      Your report details
                      remain private and
                      protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
             FORM
          ========================================================= */}

          <div
            className={`rounded-[35px] border p-7 md:p-8 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] ${theme.border} ${theme.card}`}
          >
            {/* SUCCESS */}

            {success && (
              <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-green-400">
                {success}
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400">
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              {/* CATEGORY */}

              <div>
                <label className="mb-3 flex items-center gap-2 font-semibold">
                  <AlertTriangle
                    size={
                      18
                    }
                  />

                  Report Category
                </label>

                <select
                  value={
                    category
                  }
                  onChange={(
                    e
                  ) =>
                    setCategory(
                      e.target
                        .value
                    )
                  }
                  className={`w-full h-14 rounded-2xl border px-5 outline-none transition-all ${theme.border} ${theme.input}`}
                >
                  <option value="">
                    Select category
                  </option>

                  <option value="Scam">
                    Scam
                  </option>

                  <option value="Abuse">
                    Abuse
                  </option>

                  <option value="Copyright">
                    Copyright Violation
                  </option>

                  <option value="Harassment">
                    Harassment
                  </option>

                  <option value="Spam">
                    Spam
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* USER */}

              <div>
                <label className="mb-3 flex items-center gap-2 font-semibold">
                  <FileWarning
                    size={
                      18
                    }
                  />

                  Reported User
                  (Optional)
                </label>

                <input
                  type="text"
                  placeholder="Username or email"
                  value={
                    reportedUser
                  }
                  onChange={(
                    e
                  ) =>
                    setReportedUser(
                      e.target
                        .value
                    )
                  }
                  className={`w-full h-14 rounded-2xl border px-5 outline-none transition-all focus:border-red-500 ${theme.border} ${theme.input}`}
                />
              </div>

              {/* DETAILS */}

              <div>
                <label className="mb-3 block font-semibold">
                  Report Details
                </label>

                <textarea
                  rows={7}
                  placeholder="Explain the issue clearly..."
                  value={
                    details
                  }
                  onChange={(
                    e
                  ) =>
                    setDetails(
                      e.target
                        .value
                    )
                  }
                  className={`w-full rounded-2xl border p-5 outline-none resize-none transition-all focus:border-red-500 ${theme.border} ${theme.input}`}
                />
              </div>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={
                  loading
                }
                className={`w-full h-14 rounded-2xl font-bold text-white transition-all shadow-2xl ${
                  loading
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:scale-[1.02]"
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  <Send
                    size={
                      18
                    }
                  />

                  {loading
                    ? "Submitting..."
                    : "Submit Report"}
                </span>
              </button>
            </form>

            {/* FOOTER */}

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3 text-sm opacity-70">
              <Sparkles
                size={16}
              />

              Unihelp prioritizes
              community safety and
              transparency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}