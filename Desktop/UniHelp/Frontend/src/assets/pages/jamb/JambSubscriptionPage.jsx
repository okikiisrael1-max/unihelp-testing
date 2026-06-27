import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  User2,
  Wallet,
  XCircle,
  Clock3,
} from "lucide-react";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

import {
  auth,
  db,
} from "../../../firebase/config";

import { uploadImage } from "../../../services/cloudinary";

import { AuthContext } from "../../context/AuthContext";

// ======================================================
// JAMB SUBSCRIPTION PAGE
// ======================================================

export default function JambSubscriptionPage({
  dark = true,
}) {
  const navigate = useNavigate();

  const { user } =
    useContext(AuthContext);

  const fileRef = useRef(null);

  // ======================================================
  // STATES
  // ======================================================

  const [loading, setLoading] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [copied, setCopied] =
    useState("");

  const [subscription, setSubscription] =
    useState(null);

  const [proofFile, setProofFile] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [daysLeft, setDaysLeft] =
    useState(null);

  // ======================================================
  // THEME
  // ======================================================

  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-slate-100 text-slate-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200 shadow-sm";

  const soft = dark
    ? "text-slate-400"
    : "text-slate-500";

  const input = dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400";

  // ======================================================
  // PAYMENT DETAILS
  // ======================================================

  const paymentDetails = {
    bank: "Indulge MFB",

    accountName: "Unihelpng FLW",

    accountNumber: "9907557021",

    amount: "₦2,500",
  };


          const checkSubscriptionExpiry = async (
  data
) => {
  try {
    if (!data?.expiresAt) return data;

    const now = new Date();

    const expiryDate =
      data.expiresAt.toDate();

    // Expired
    if (expiryDate <= now) {
      const updatedData = {
        ...data,
        subscription: {
          ...data.subscription,
          active: false,
          status: "expired",
        },
      };

      await setDoc(
        doc(
          db,
          "subscriptions",
          user.uid
        ),
        {
          subscription: {
            active: false,
            status: "expired",
          },
        },
        { merge: true }
      );

      return updatedData;
    }

    // Days Remaining
    const difference =
      expiryDate.getTime() -
      now.getTime();

    const remainingDays =
      Math.ceil(
        difference /
          (1000 * 60 * 60 * 24)
      );

    setDaysLeft(remainingDays);

    return data;
  } catch (error) {
    console.log(error);
    return data;
  }
};

  // ======================================================
  // FETCH SUBSCRIPTION
  // ======================================================

  useEffect(() => {
    const fetchSubscription =
      async () => {
        if (!user?.uid) return;

        try {
          const subscriptionRef =
            doc(
              db,
              "subscriptions",
              user.uid
            );

          const snap =
            await getDoc(
              subscriptionRef
            );

          if (snap.exists()) {
            const data = snap.data();

            const checkedData =
              await checkSubscriptionExpiry(
                data
              );

            setSubscription(
              checkedData
            );
          }
        } catch (error) {
          console.log(error);
        }
      };

    fetchSubscription();
  }, [user]);


  const copyText = async (
    value,
    type
  ) => {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.log(error);
    }
  };

  // ======================================================
  // FILE CHANGE
  // ======================================================

  const handleFileChange = (e) => {
    const file =
      e.target.files[0];

    if (!file) return;

    setProofFile(file);

    setPreview(
      URL.createObjectURL(file)
    );
  };

  // ======================================================
  // SUBMIT PAYMENT
  // ======================================================

  const handleSubmit = async () => {
    if (!user?.uid) {
      setMessage(
        "Please login first"
      );

      return;
    }

    if (!proofFile) {
      setMessage(
        "Upload payment proof screenshot"
      );

      return;
    }

    try {
      setLoading(true);

      setUploading(true);

      // ======================================================
      // UPLOAD IMAGE
      // ======================================================

      const result = await uploadImage(proofFile);
      const imageUrl = result.secure_url;

      setUploading(false);

      // ======================================================
      // CREATE DATES
      // ======================================================

      const now = new Date();

      const expiryDate = new Date();

      expiryDate.setDate(
        expiryDate.getDate() + 30
      );

      // ======================================================
      // SAVE TO FIRESTORE
      // ======================================================

      const subscriptionRef =
        doc(
          db,
          "subscriptions",
          user.uid
        );

      await setDoc(
        subscriptionRef,
        {
          uid: user.uid,

          email: user.email,

          name:
            user.displayName ||
            "Student",

          role: "jamb",

          subscription: {
            plan:
              "UniHelp Premium",

            amount: 2500,

            status: "pending",

            active: false,
          },

          paymentProof:
            imageUrl,

          paymentMethod:
            "bank_transfer",

          reviewed: false,

          // ======================================================
          // DATES
          // ======================================================

          startDate:
            Timestamp.fromDate(
              now
            ),

          expiresAt:
            Timestamp.fromDate(
              expiryDate
            ),

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
        { merge: true }
      );

      setSubscription({
        subscription: {
          status: "pending",

          active: false,
        },

        paymentProof:
          imageUrl,

        expiresAt:
          Timestamp.fromDate(
            expiryDate
          ),
      });

      setMessage(
        "Payment proof submitted successfully"
      );

      setProofFile(null);

      setPreview("");
    } catch (error) {
      console.log(error);

      setMessage(
        "Something went wrong"
      );
    } finally {
      setLoading(false);

      setUploading(false);
    }
  };

  // ======================================================
  // STATUS
  // ======================================================

  const status =
    subscription?.subscription
      ?.status;

  // ======================================================
  // UI
  // ======================================================

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${bg}`}
    >
      {/* BACKGROUND */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}

        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() =>
              navigate(-1)
            }
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${card}`}
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-sm font-semibold mb-4">
              <Sparkles size={16} />

              Premium Access
            </div>

            <h1 className="text-3xl sm:text-5xl font-black">
              UniHelp Premium
            </h1>

            <p
              className={`mt-3 ${soft}`}
            >
              Unlock full CBT,
              AI tutor,
              analytics,
              leaderboard and
              premium tools.
            </p>
          </div>

          <div className="w-12" />
        </div>

        {/* STATUS */}

        {status && (
          <div
            className={`${card} rounded-[30px] p-5 mb-8`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div>
                <p
                  className={`text-sm ${soft}`}
                >
                  Subscription
                  Status
                </p>

                <h2 className="text-2xl font-black mt-1">
                  {status ===
                  "approved"
                    ? "Premium Activated"
                    : status ===
                        "pending"
                      ? "Pending Approval"
                      : status ===
                          "expired"
                        ? "Subscription Expired"
                        : "Inactive"}
                </h2>

                {/* DAYS LEFT */}

                {status ===
                  "approved" &&
                  daysLeft !==
                    null && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-yellow-400">
                      <Clock3
                        size={16}
                      />

                      {daysLeft} days
                      remaining
                    </div>
                  )}
              </div>

              <div>
                {status ===
                  "approved" && (
                  <div className="px-5 py-3 rounded-2xl bg-green-500/10 text-green-400 flex items-center gap-2 font-semibold">
                    <CheckCircle2
                      size={18}
                    />

                    Approved
                  </div>
                )}

                {status ===
                  "pending" && (
                  <div className="px-5 py-3 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center gap-2 font-semibold">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Waiting for
                    confirmation
                  </div>
                )}

                {status ===
                  "expired" && (
                  <div className="px-5 py-3 rounded-2xl bg-red-500/10 text-red-400 flex items-center gap-2 font-semibold">
                    <XCircle
                      size={18}
                    />

                    Expired
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GRID */}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT */}

          <div
            className={`${card} rounded-[35px] p-6 sm:p-8`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center text-white">
                <Crown size={30} />
              </div>

              <div>
                <h2 className="text-3xl font-black">
                  Premium Plan
                </h2>

                <p className={soft}>
                  Monthly
                  Subscription
                </p>
              </div>
            </div>

            {/* PRICE */}

            <div className="mb-8">
              <h1 className="text-6xl font-black">
                ₦2,500
              </h1>

              <p
                className={`mt-2 ${soft}`}
              >
                30 days premium
                access
              </p>
            </div>

            {/* FEATURES */}

            <div className="space-y-4">
              {[
                "Unlimited CBT Practice",
                "AI Tutor Access",
                "Performance Analytics",
                "Full Past Questions",
                "Leaderboard Access",
                "Smart Study Planner",
                "Achievement System",
                "Premium Mock Exams",
              ].map(
                (
                  feature,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex items-center gap-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2
                        size={15}
                        className="text-green-400"
                      />
                    </div>

                    <span className="font-medium">
                      {feature}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-8">
            {/* PAYMENT DETAILS */}

            <div
              className={`${card} rounded-[35px] p-6 sm:p-8`}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white">
                  <Wallet size={26} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    Bank Transfer
                  </h2>

                  <p className={soft}>
                    Make payment below
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* ACCOUNT */}

                <div
                  className={`rounded-3xl p-5 ${
                    dark
                      ? "bg-white/5"
                      : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-sm ${soft}`}
                  >
                    Account Number
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-2xl font-black tracking-widest">
                      {
                        paymentDetails.accountNumber
                      }
                    </h3>

                    <button
                      onClick={() =>
                        copyText(
                          paymentDetails.accountNumber,
                          "account"
                        )
                      }
                      className="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center"
                    >
                      <Copy
                        size={18}
                      />
                    </button>
                  </div>

                  {copied ===
                    "account" && (
                    <p className="text-green-400 text-sm mt-3">
                      Copied
                    </p>
                  )}
                </div>

                {/* ACCOUNT NAME */}

                <div
                  className={`rounded-3xl p-5 ${
                    dark
                      ? "bg-white/5"
                      : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-sm ${soft}`}
                  >
                    Account Name
                  </p>

                  <h3 className="text-xl font-black mt-2">
                    {
                      paymentDetails.accountName
                    }
                  </h3>
                </div>

                <div
                  className={`rounded-3xl p-5 ${
                    dark
                      ? "bg-white/5"
                      : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-sm ${soft}`}
                  >
                    Bank
                  </p>

                  <h3 className="text-xl font-black mt-2">
                    {
                      paymentDetails.bank
                    }
                  </h3>
                </div>
              </div>
            </div>

            {/* UPLOAD */}

            <div
              className={`${card} rounded-[35px] p-6 sm:p-8`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={
                  handleFileChange
                }
                className="hidden"
              />

              <button
                onClick={() =>
                  fileRef.current.click()
                }
                className={`w-full border-2 border-dashed rounded-[30px] p-8 transition-all ${
                  dark
                    ? "border-white/10 hover:border-purple-500/50 bg-white/5"
                    : "border-slate-300 hover:border-purple-400 bg-slate-50"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-purple-500 text-white flex items-center justify-center mb-5">
                    <Upload
                      size={28}
                    />
                  </div>

                  <h3 className="text-xl font-bold">
                    Upload Payment
                    Proof
                  </h3>

                  <p
                    className={`mt-2 text-sm ${soft}`}
                  >
                    JPG, PNG or
                    JPEG
                  </p>
                </div>
              </button>

              {/* PREVIEW */}

              {preview && (
                <div className="mt-6">
                  <img
                    src={preview}
                    alt="proof"
                    className="w-full h-72 object-cover rounded-3xl border border-white/10"
                  />
                </div>
              )}

              {/* MESSAGE */}

              {message && (
                <div
                  className={`mt-6 rounded-2xl p-4 text-sm flex items-center gap-3 ${
                    message.includes(
                      "success"
                    )
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.includes(
                    "success"
                  ) ? (
                    <CheckCircle2
                      size={18}
                    />
                  ) : (
                    <XCircle
                      size={18}
                    />
                  )}

                  {message}
                </div>
              )}

              {/* BUTTON */}

              <button
                onClick={
                  handleSubmit
                }
                disabled={
                  loading ||
                  status ===
                    "pending"
                }
                className={`mt-8 w-full h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
                  loading ||
                  status ===
                    "pending"
                    ? "bg-purple-400 cursor-not-allowed text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                    {uploading
                      ? "Uploading..."
                      : "Submitting..."}
                  </>
                ) : status ===
                  "pending" ? (
                  <>
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                    Awaiting
                    Approval
                  </>
                ) : (
                  <>
                    Submit Payment
                    Proof
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
