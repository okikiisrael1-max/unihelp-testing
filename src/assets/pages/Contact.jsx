import { useState } from "react";

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
  Sparkles,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Headphones,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Contact({
  dark
}) {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const navigate = useNavigate()
  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      setError(
        "All fields are required"
      );

      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/api/contact`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            subject,
            message,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        setError(
          data.message ||
            "Failed to send message"
        );

        return;
      }

      setSuccess(
        "Message sent successfully 🚀"
      );

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
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
      : "bg-[#f4f7fb]",

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

    glow1:
      "bg-violet-500/20",

    glow2:
      "bg-cyan-500/20",
  };

  /* =========================================================
     CONTACT OPTIONS
  ========================================================= */

  const contactOptions = [
    {
      icon: Mail,
      title: "Email Support",
      value:
        "support@unihelp.com",
      desc: "Fast support for issues and inquiries",
      color:
        "from-violet-600 to-fuchsia-500",
    },

    {
      icon: Phone,
      title: "Phone Number",
      value: "+234 911 533 6339",
      desc: "Available Mon - Fri",
      color:
        "from-cyan-500 to-blue-600",
    },

    {
      icon: Instagram,
      title: "Instagram",
      value: "@unihelp",
      desc: "Follow us for updates",
      color:
        "from-pink-500 to-orange-500",
    },

    {
      icon: Linkedin,
      title: "LinkedIn",
      value: "Unihelp",
      desc: "Professional updates",
      color:
        "from-blue-600 to-cyan-500",
    },

    {
      icon: Globe,
      title: "Website",
      value:
        "www.unihelp.com",
      desc: "Visit our platform",
      color:
        "from-green-500 to-emerald-500",
    },

    {
      icon: MapPin,
      title: "Location",
      value:
        "Lagos, Nigeria",
      desc: "Serving students globally",
      color:
        "from-orange-500 to-red-500",
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
        <div
          className={`absolute top-[-120px] left-[-120px] w-[320px] h-[320px] rounded-full blur-[120px] ${theme.glow1}`}
        />

        <div
          className={`absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] rounded-full blur-[120px] ${theme.glow2}`}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* =========================================================
           HERO
        ========================================================= */}

        <div className="text-center mb-14">
          <button onClick={()=> navigate(-1)} className="absolute left-2.5 top-2.5 p-2.5 bg-white/10 rounded-lg flex gap-0.5"> <ArrowLeft/>Back</button>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl mb-6">
            <Sparkles size={16} />

            <span className="text-sm">
              Unihelp Support
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight">
            Contact{" "}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              Unihelp
            </span>
          </h1>

          <p
            className={`max-w-2xl mx-auto mt-5 text-lg leading-8 ${theme.subtext}`}
          >
            Have feedback,
            complaints,
            partnership ideas,
            or technical issues?
            Our team is here to
            help you.
          </p>
        </div>

        {/* =========================================================
           GRID
        ========================================================= */}

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* =========================================================
             LEFT SIDE
          ========================================================= */}

          <div className="space-y-6">
            {/* CONTACT CARDS */}

            <div className="grid sm:grid-cols-2 gap-5">
              {contactOptions.map(
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
                      className={`group rounded-[28px] border p-5 backdrop-blur-2xl transition-all hover:scale-[1.02] hover:border-violet-500/30 shadow-2xl ${theme.border} ${theme.card}`}
                    >
                      <div
                        className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-xl mb-4`}
                      >
                        <Icon
                          size={
                            24
                          }
                        />
                      </div>

                      <h3 className="font-bold text-lg">
                        {
                          item.title
                        }
                      </h3>

                      <p className="mt-1 text-sm font-medium">
                        {
                          item.value
                        }
                      </p>

                      <p
                        className={`text-sm mt-2 leading-6 ${theme.subtext}`}
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

            {/* EXTRA INFO */}

            <div
              className={`rounded-[32px] border p-7 backdrop-blur-2xl shadow-2xl ${theme.border} ${theme.card}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-xl">
                  <Headphones
                    size={
                      26
                    }
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Support Hours
                  </h2>

                  <p
                    className={
                      theme.subtext
                    }
                  >
                    We usually reply
                    within a few hours
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock3
                      size={
                        18
                      }
                    />

                    <span>
                      Monday - Friday
                    </span>
                  </div>

                  <span className="font-semibold">
                    8AM - 8PM
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      size={
                        18
                      }
                    />

                    <span>
                      Response Time
                    </span>
                  </div>

                  <span className="font-semibold">
                    Under 24hrs
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={
                        18
                      }
                    />

                    <span>
                      Priority Support
                    </span>
                  </div>

                  <span className="font-semibold">
                    Premium Users
                  </span>
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
              {/* NAME */}

              <div>
                <label className="mb-3 flex items-center gap-2 font-semibold">
                  <User
                    size={
                      18
                    }
                  />

                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(
                    e
                  ) =>
                    setName(
                      e.target
                        .value
                    )
                  }
                  className={`w-full h-14 rounded-2xl border px-5 outline-none transition-all focus:scale-[1.01] focus:border-violet-500 ${theme.border} ${theme.input}`}
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-3 flex items-center gap-2 font-semibold">
                  <Mail
                    size={
                      18
                    }
                  />

                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(
                    e
                  ) =>
                    setEmail(
                      e.target
                        .value
                    )
                  }
                  className={`w-full h-14 rounded-2xl border px-5 outline-none transition-all focus:scale-[1.01] focus:border-violet-500 ${theme.border} ${theme.input}`}
                />
              </div>

              {/* SUBJECT */}

              <div>
                <label className="mb-3 flex items-center gap-2 font-semibold">
                  <MessageSquare
                    size={
                      18
                    }
                  />

                  Subject
                </label>

                <input
                  type="text"
                  placeholder="Enter subject"
                  value={subject}
                  onChange={(
                    e
                  ) =>
                    setSubject(
                      e.target
                        .value
                    )
                  }
                  className={`w-full h-14 rounded-2xl border px-5 outline-none transition-all focus:scale-[1.01] focus:border-violet-500 ${theme.border} ${theme.input}`}
                />
              </div>

              {/* MESSAGE */}

              <div>
                <label className="mb-3 font-semibold block">
                  Message
                </label>

                <textarea
                  rows={6}
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(
                    e
                  ) =>
                    setMessage(
                      e.target
                        .value
                    )
                  }
                  className={`w-full rounded-2xl border p-5 outline-none resize-none transition-all focus:scale-[1.01] focus:border-violet-500 ${theme.border} ${theme.input}`}
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
                    ? "bg-violet-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 hover:scale-[1.02]"
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  <Send
                    size={
                      18
                    }
                  />

                  {loading
                    ? "Sending..."
                    : "Send Message"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}