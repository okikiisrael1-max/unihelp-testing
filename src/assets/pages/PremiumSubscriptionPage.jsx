import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
  Loader2,
  GraduationCap,
  Clock3,
  CheckCircle2,
} from "lucide-react";

import {
  useFlutterwave,
  closePaymentModal,
} from "flutterwave-react-v3";

import {
  auth,
  db,
} from "../../firebase/config";

import {
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
} from "firebase/firestore";

// ======================================================
// PREMIUM SUBSCRIPTION PAGE
// ======================================================

export default function PremiumSubscriptionPage({
  dark = true,
}) {
  // ======================================================
  // STATES
  // ======================================================

  const [billing, setBilling] =
    useState("monthly");

  const [loadingPlan, setLoadingPlan] =
    useState(false);

  const [subscriptionData, setSubscriptionData] =
    useState(null);

  const [daysLeft, setDaysLeft] =
    useState(null);

  const API_URL =
    import.meta.env.VITE_API_URL;

  // ======================================================
  // PLAN
  // ======================================================

  const studentPlan = {
    id: "student-plus",

    name: "Student Premium",

    monthlyPrice: 2500,

    yearlyPrice: 24000,

    description:
      "Unlock premium student tools, verified badge, downloads and exclusive UniHelp access.",

    features: [
      "Past question downloads",
      "Lecture note downloads",
      "Verified student badge",
      "Increase Daily AI Limit",
      "Reduced ads experience",
      "Upload 5 Hostels / Products",
      "Early access to New features",
      "Premium student tools",
      "Exclusive UniHelp features",
    ],

    linear:
      "from-indigo-500 to-purple-600",
  };

  // ======================================================
  // PRICE
  // ======================================================

  const amount = useMemo(() => {
    return billing === "monthly"
      ? studentPlan.monthlyPrice
      : studentPlan.yearlyPrice;
  }, [billing]);

  // ======================================================
  // CHECK SUBSCRIPTION STATUS
  // ======================================================

  const checkSubscriptionStatus =
    async () => {
      try {
        if (!auth.currentUser)
          return;

        const userRef = doc(
          db,
          "users",
          auth.currentUser.uid
        );

        const snap =
          await getDoc(userRef);

        if (!snap.exists())
          return;

        const data = snap.data();

        setSubscriptionData(data);

        // ======================================================
        // CHECK EXPIRY
        // ======================================================

        if (
          data.subscriptionExpiresAt
        ) {
          const expiryDate =
            data.subscriptionExpiresAt.toDate();

          const now =
            new Date();

          // ======================================================
          // EXPIRED
          // ======================================================

          if (
            expiryDate <= now
          ) {
            await setDoc(
              userRef,
              {
                premium: false,

                verified: false,

                subscriptionStatus:
                  "expired",

                subscriptionExpired:
                  true,

                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            setSubscriptionData({
              ...data,

              premium: false,

              verified: false,

              subscriptionStatus:
                "expired",
            });

            setDaysLeft(0);

            return;
          }

          // ======================================================
          // DAYS LEFT
          // ======================================================

          const diff =
            expiryDate.getTime() -
            now.getTime();

          const remaining =
            Math.ceil(
              diff /
                (1000 *
                  60 *
                  60 *
                  24)
            );

          setDaysLeft(
            remaining
          );
        }
      } catch (error) {
        console.log(
          "Subscription check error:",
          error
        );
      }
    };

  // ======================================================
  // LOAD SUBSCRIPTION
  // ======================================================

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // ======================================================
  // FLUTTERWAVE CONFIG
  // ======================================================

  const flutterwaveConfig = {
    public_key:
      import.meta.env
        .VITE_FLUTTERWAVE_PUBLIC_KEY,

    tx_ref: `UNIHELP_${Date.now()}`,

    amount,

    currency: "NGN",

    payment_options:
      "card,banktransfer,ussd",

    customer: {
      email:
        auth.currentUser
          ?.email ||
        "student@unihelp.com",

      name:
        auth.currentUser
          ?.displayName ||
        "UniHelp Student",
    },

    customizations: {
      title:
        "UniHelp Student Premium",

      description:
        "Student Premium Subscription",

      logo: "/Favicon.png",
    },
  };

  // ======================================================
  // FLUTTERWAVE
  // ======================================================

  const handleFlutterPayment =
    useFlutterwave(
      flutterwaveConfig
    );

  // ======================================================
  // SUBSCRIBE
  // ======================================================

  const handleSubscribe =
    async () => {
      try {
        if (!auth.currentUser) {
          alert(
            "Please login first"
          );

          return;
        }

        setLoadingPlan(true);

        handleFlutterPayment({
          callback: async (
            response
          ) => {
            try {
              console.log(
                "Flutterwave Response:",
                response
              );

              // CLOSE MODAL
              closePaymentModal();

              // ======================================================
              // SUCCESS
              // ======================================================

              if (
                response.status !==
                "successful"
              ) {
                alert(
                  "Payment not successful"
                );

                setLoadingPlan(
                  false
                );

                return;
              }

              // ======================================================
              // VERIFY PAYMENT
              // ======================================================

              const verify =
                await fetch(
                  `${API_URL}/api/payments/verify-payment`,
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify(
                      {
                        transaction_id:
                          response.transaction_id,

                        userId:
                          auth.currentUser.uid,

                        plan:
                          studentPlan.name,

                        billing,

                        amount,
                      }
                    ),
                  }
                );

              // ======================================================
              // RESPONSE ERROR
              // ======================================================

              if (!verify.ok) {
                throw new Error(
                  "Verification request failed"
                );
              }

              const data =
                await verify.json();

              console.log(
                "Verification:",
                data
              );

              // ======================================================
              // VERIFIED
              // ======================================================

              if (
                data.success
              ) {
                const now =
                  new Date();

                const expiresAt =
                  new Date();

                // MONTHLY

                if (
                  billing ===
                  "monthly"
                ) {
                  expiresAt.setDate(
                    expiresAt.getDate() +
                      30
                  );
                }

                // YEARLY

                if (
                  billing ===
                  "yearly"
                ) {
                  expiresAt.setFullYear(
                    expiresAt.getFullYear() +
                      1
                  );
                }

                // ======================================================
                // SAVE TO FIRESTORE
                // ======================================================

                const userRef = doc(
                  db,
                  "users",
                  auth.currentUser.uid
                );

                await setDoc(
                  userRef,
                  {
                    premium:
                      true,

                    verified:
                      true,

                    subscriptionPlan:
                      "student-premium",

                    subscriptionBilling:
                      billing,

                    subscriptionAmount:
                      amount,

                    subscriptionStatus:
                      "active",

                    subscriptionExpired:
                      false,

                    transactionId:
                      response.transaction_id,

                    paymentReference:
                      response.tx_ref,

                    subscriptionDate:
                      serverTimestamp(),

                    subscriptionStart:
                      Timestamp.fromDate(
                        now
                      ),

                    subscriptionExpiresAt:
                      Timestamp.fromDate(
                        expiresAt
                      ),

                    updatedAt:
                      serverTimestamp(),
                  },
                  {
                    merge: true,
                  }
                );

                // ======================================================
                // UPDATE UI
                // ======================================================

                setSubscriptionData(
                  {
                    premium:
                      true,

                    verified:
                      true,

                    subscriptionBilling:
                      billing,

                    subscriptionStatus:
                      "active",

                    subscriptionExpiresAt:
                      Timestamp.fromDate(
                        expiresAt
                      ),
                  }
                );

                // ======================================================
                // CALCULATE DAYS LEFT
                // ======================================================

                const remainingDays =
                  Math.ceil(
                    (expiresAt.getTime() -
                      now.getTime()) /
                      (1000 *
                        60 *
                        60 *
                        24)
                  );

                setDaysLeft(
                  remainingDays
                );

                alert(
                  "Student Premium activated successfully 🚀"
                );
              } else {
                alert(
                  data.error ||
                    "Payment verification failed"
                );
              }

              setLoadingPlan(
                false
              );
            } catch (error) {
              console.log(
                "Verification error:",
                error
              );

              alert(
                "Payment verification failed"
              );

              setLoadingPlan(
                false
              );
            }
          },

          onClose: () => {
            setLoadingPlan(
              false
            );
          },
        });
      } catch (error) {
        console.log(
          "Subscription error:",
          error
        );

        setLoadingPlan(false);

        alert(
          "Something went wrong"
        );
      }
    };

  // ======================================================
  // THEME
  // ======================================================

  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-[#f3f6ff] text-slate-900";

  const glass = dark
    ? "bg-white/5 border border-white/10"
    : "bg-white border border-slate-200";

  // ======================================================
  // UI
  // ======================================================

  return (
    <div
      className={`min-h-screen w-full overflow-hidden relative ${bg}`}
    >
      {/* BACKGROUND */}

      <div className="absolute -top-50 -left-25 h-100 w-100 bg-indigo-500/20 blur-3xl rounded-full" />

      <div className="absolute -bottom-50 -right-25 h-100 w-100 bg-purple-500/20 blur-3xl rounded-full" />

      {/* CONTENT */}

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-20">
        {/* HERO */}

        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-xl">
            <GraduationCap
              size={18}
            />

            Student Premium
          </div>

          <h1 className="text-4xl md:text-7xl font-black mt-8 leading-tight">
            Unlock The
            <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {" "}
              Ultimate Student{" "}
            </span>
            Experience 🚀
          </h1>

          <p className="opacity-70 text-lg md:text-xl mt-6 max-w-3xl mx-auto">
            Get unlimited
            downloads,
            premium academic
            tools,
            verified badge and
            exclusive UniHelp
            student features.
          </p>

          {/* STATUS CARD */}

          {subscriptionData
            ?.premium && (
            <div
              className={`mt-10 max-w-xl mx-auto rounded-3xl p-6 ${glass}`}
            >
              <div className="flex items-center justify-center gap-3 text-green-400">
                <CheckCircle2
                  size={26}
                />

                <h3 className="text-2xl font-black">
                  Premium Active
                </h3>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400">
                <Clock3
                  size={18}
                />

                <span className="font-semibold">
                  {daysLeft} days
                  remaining
                </span>
              </div>

              <p className="opacity-70 mt-3 text-sm capitalize">
                Billing Plan:{" "}
                {
                  subscriptionData.subscriptionBilling
                }
              </p>
            </div>
          )}

          {/* EXPIRED */}

          {subscriptionData
            ?.subscriptionStatus ===
            "expired" && (
            <div className="mt-10 max-w-xl mx-auto rounded-3xl p-6 bg-red-500/10 border border-red-500/20">
              <h3 className="text-2xl font-black text-red-400">
                Subscription
                Expired
              </h3>

              <p className="text-red-300 mt-2">
                Renew your
                subscription to
                continue enjoying
                premium features.
              </p>
            </div>
          )}

          {/* BILLING TOGGLE */}

          <div
            className={`mt-10 inline-flex items-center p-2 rounded-2xl ${glass}`}
          >
            <button
              onClick={() =>
                setBilling(
                  "monthly"
                )
              }
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                billing ===
                "monthly"
                  ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white"
                  : ""
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() =>
                setBilling(
                  "yearly"
                )
              }
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                billing ===
                "yearly"
                  ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white"
                  : ""
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* PRICING CARD */}

        <div className="max-w-2xl mx-auto mt-20">
          <div
            className={`relative overflow-hidden rounded-[36px] p-8 md:p-12 transition-all duration-300 ${glass} border-indigo-500 shadow-2xl shadow-indigo-500/20`}
          >
            {/* BADGE */}

            <div className="absolute top-5 right-5 px-4 py-2 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg">
              MOST POPULAR
            </div>

            {/* GLOW */}

            <div
              className={`absolute -top-25 -right-25 h-72 w-72 bg-linear-to-br ${studentPlan.linear} opacity-20 blur-3xl rounded-full`}
            />

            <div className="relative z-10">
              {/* ICON */}

              <div
                className={`h-20 w-20 rounded-3xl bg-linear-to-br ${studentPlan.linear} flex items-center justify-center shadow-xl`}
              >
                <Crown className="text-white" />
              </div>

              {/* TITLE */}

              <h2 className="text-4xl font-black mt-8">
                {
                  studentPlan.name
                }
              </h2>

              <p className="opacity-70 mt-3 text-lg">
                {
                  studentPlan.description
                }
              </p>

              {/* PRICE */}

              <div className="mt-10 flex items-end gap-2">
                <h3 className="text-6xl font-black">
                  ₦
                  {amount.toLocaleString()}
                </h3>

                <span className="opacity-60 mb-3 text-lg">
                  /
                  {billing ===
                  "monthly"
                    ? "mo"
                    : "yr"}
                </span>
              </div>

              {/* FEATURES */}

              <div className="mt-10 grid md:grid-cols-2 gap-4">
                {studentPlan.features.map(
                  (
                    feature,
                    i
                  ) => (
                    <div
                      key={i}
                      className="flex items-center gap-3"
                    >
                      <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                        />
                      </div>

                      <span className="opacity-90">
                        {
                          feature
                        }
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* BUTTON */}

              <button
                onClick={
                  handleSubscribe
                }
                disabled={
                  loadingPlan
                }
                className="w-full mt-12 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-xl disabled:opacity-70"
              >
                {loadingPlan ? (
                  <>
                    <Loader2 className="animate-spin" />

                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles
                      size={20}
                    />

                    Subscribe Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* EXTRA FEATURES */}

        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            {
              icon:
                ShieldCheck,

              title:
                "Verified Student Badge",

              desc:
                "Stand out across UniHelp with a premium verified badge.",
            },

            {
              icon: Zap,

              title:
                "Unlimited Downloads",

              desc:
                "Download premium lecture notes and past questions instantly.",
            },

            {
              icon: Star,

              title:
                "Exclusive Student Tools",

              desc:
                "Unlock powerful academic and productivity features.",
            },
          ].map(
            (
              item,
              i
            ) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={i}
                  className={`${glass} rounded-[30px] p-8`}
                >
                  <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <Icon className="text-white" />
                  </div>

                  <h3 className="text-2xl font-black mt-6">
                    {
                      item.title
                    }
                  </h3>

                  <p className="opacity-70 mt-3">
                    {
                      item.desc
                    }
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
