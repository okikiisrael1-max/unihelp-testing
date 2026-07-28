import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../../firebase/config";

import { toCloudinaryAsset, uploadImage } from "../../services/cloudinary";
import { getCloudinaryAttachmentUrl } from "../../services/cloudinary";

import { useParams } from "react-router-dom";

import {
  BookOpen,
  Download,
  Lock,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Upload,
  CreditCard,
  Clock3,
  Info,
} from "lucide-react";

export default function TutorialDetails({
  dark,
}) {
  const { id } = useParams();

  const [tutorial, setTutorial] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [hasAccess, setHasAccess] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [locked, setLocked] =
    useState(false);

  const [proofImage, setProofImage] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const videoRef = useRef(null);

  /* =========================
     FETCH TUTORIAL
  ========================= */

  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const snap = await getDoc(
          doc(db, "tutorials", id)
        );

        if (snap.exists()) {
          setTutorial({
            id: snap.id,
            ...snap.data(),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id]);

  /* =========================
     ACCESS LISTENER
  ========================= */

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where(
        "userId",
        "==",
        auth.currentUser.uid
      ),
      where("tutorialId", "==", id)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        let approved = false;
        let pending = false;

        snap.forEach((doc) => {
          const data = doc.data();

          if (
            data.status === "approved"
          ) {
            approved = true;
          }

          if (
            data.status === "pending"
          ) {
            pending = true;
          }
        });

        setHasAccess(approved);
        setSubmitted(pending);
      }
    );

    return () => unsub();
  }, [id]);

  /* =========================
     VIDEO LOCK
  ========================= */

  useEffect(() => {
    if (!tutorial?.videoUrl) return;

    const video = videoRef.current;

    if (!video) return;

    const handleTime = () => {
      if (hasAccess) return;

      if (video.currentTime >= 30) {
        video.pause();
        setLocked(true);
      }
    };

    video.addEventListener(
      "timeupdate",
      handleTime
    );

    return () => {
      video.removeEventListener(
        "timeupdate",
        handleTime
      );
    };
  }, [tutorial, hasAccess]);

  /* =========================
     PAYMENT UPLOAD
  ========================= */

  const handlePaymentProof =
    async () => {
      try {
        if (!auth.currentUser) {
          toast.error("Login required");
          return;
        }

        if (!proofImage) {
          toast.error("Please upload your payment screenshot.");
          return;
        }

        setUploading(true);

        const result = await uploadImage(proofImage);
        const proofUrl = result.secure_url;
        const tutorialAmount = Number(tutorial.price) || 0;
        const platformFee = tutorialAmount * 0.2;
        const creatorShare = tutorialAmount - platformFee;

        await addDoc(
          collection(db, "purchases"),
          {
            userId:
              auth.currentUser.uid,

            tutorialId: tutorial.id,

            tutorId:
              tutorial.tutorId,

            tutorialTitle:
              tutorial.title,

            amount: tutorialAmount,
            platformFee,
            creatorShare,
            platformFeeRate: 0.2,
            tutorialPrice: tutorialAmount,

            proofUrl,
            proofAsset:
              toCloudinaryAsset(result),

            status: "pending",

            createdAt:
              serverTimestamp(),
          }
        );

        setSubmitted(true);

        toast.success("Payment submitted successfully.");
      } catch (err) {
        toast.error("Payment submission failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };

  /* =========================
     THEME
  ========================= */

  const bg = dark
    ? "bg-black text-white"
    : "bg-zinc-50 text-black";

  const card = dark
    ? "bg-zinc-900 border-zinc-800"
    : "bg-white border-zinc-200";

  const muted = dark
    ? "text-zinc-400"
    : "text-zinc-500";

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg}`}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="animate-spin text-blue-500"
            size={40}
          />

          <p className={muted}>
            Loading tutorial...
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     NOT FOUND
  ========================= */

  if (!tutorial) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg}`}
      >
        Tutorial not found
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${bg}`}
    >
      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 blur-[140px] rounded-full" />

        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1.4fr_420px] gap-8">
          {/* LEFT */}
          <div>
            {/* TAG */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm mb-6">
              <Sparkles size={16} />
              Premium Tutorial
            </div>

            {/* TITLE */}
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">
              {tutorial.title}
            </h1>

            {/* AUTHOR */}
            <div className="flex items-center gap-4 mt-6">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>

              <div>
                <p className="font-semibold">
                  {tutorial.tutorName}
                </p>

                <p
                  className={`text-sm ${muted}`}
                >
                  Professional
                  Instructor
                </p>
              </div>
            </div>

            {!hasAccess && (
              <div
                className={`mt-8 rounded-[28px] border p-5 ${
                  dark
                    ? "border-blue-500/20 bg-blue-500/10"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-blue-500/15 p-2 text-blue-500">
                    <Info size={18} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold">
                      Free preview only
                    </h3>

                    <p
                      className={`mt-1 text-sm leading-relaxed ${
                        dark
                          ? "text-blue-100"
                          : "text-blue-900/80"
                      }`}
                    >
                      This tutorial plays for the first 30 seconds as a free
                      preview. After that, the video locks until your payment is
                      submitted and approved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIDEO */}
            <div
              className={`mt-8 rounded-[32px] overflow-hidden border ${card}`}
            >
              {!hasAccess && (
                <div
                  className={`flex items-center justify-between gap-3 px-5 py-3 text-sm font-semibold ${
                    dark
                      ? "bg-blue-500/10 text-blue-100"
                      : "bg-blue-50 text-blue-900"
                  }`}
                >
                  <span>Preview limit: 30 seconds free</span>
                  <span>Pay to unlock the full tutorial</span>
                </div>
              )}

              <div className="relative">
                <video
                  ref={videoRef}
                  src={tutorial.videoUrl}
                  controls
                  className="w-full bg-black"
                />

                {!hasAccess &&
                  locked && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-5 text-white">
                        <Lock size={40} />
                      </div>

                      <h2 className="text-3xl font-bold text-white">
                        Preview Ended
                      </h2>

                      <p className="text-zinc-300 mt-3 max-w-md">
                        The free preview is limited to 30 seconds. Submit your
                        payment proof to unlock the full tutorial.
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div
              className={`mt-8 rounded-[32px] border p-8 ${card}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  <PlayCircle size={24} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    Course Description
                  </h2>

                  <p
                    className={`text-sm ${muted}`}
                  >
                    What you'll learn
                  </p>
                </div>
              </div>

              <p
                className={`leading-relaxed text-[15px] ${
                  dark
                    ? "text-zinc-300"
                    : "text-zinc-700"
                }`}
              >
                {tutorial.description}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div
              className={`rounded-[32px] border p-8 sticky top-8 ${card}`}
            >
              {/* PRICE */}
              <div className="flex justify-between items-center">
                <div>
                  <p
                    className={`text-sm ${muted}`}
                  >
                    Premium Access
                  </p>

                  <h2 className="text-5xl font-black text-blue-500 mt-2">
                    ₦{tutorial.price}
                  </h2>
                </div>

                <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                  <ShieldCheck size={34} />
                </div>
              </div>

              {/* FEATURES */}
              <div className="mt-8 space-y-4">
                <Feature
                  dark={dark}
                  text="Full HD premium tutorial access"
                />

                <Feature
                  dark={dark}
                  text="Downloadable study materials"
                />

                <Feature
                  dark={dark}
                  text="Lifetime access after approval"
                />

                <Feature
                  dark={dark}
                  text="Secure payment verification"
                />
              </div>

              {!hasAccess && (
                <div
                  className={`mt-6 rounded-2xl border px-4 py-4 text-sm leading-relaxed ${
                    dark
                      ? "border-blue-500/20 bg-blue-500/10 text-blue-100"
                      : "border-blue-200 bg-blue-50 text-blue-900/80"
                  }`}
                >
                  Free preview is limited to the first 30 seconds. Once your
                  payment is approved, the full tutorial opens automatically.
                </div>
              )}

              {/* PDF */}
              {hasAccess &&
                tutorial.pdfUrl && (
                  <a
                    href={getCloudinaryAttachmentUrl(tutorial.pdfUrl, `${tutorial.title}.pdf`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 transition-all duration-300 text-white font-bold flex items-center justify-center gap-3"
                  >
                    <Download size={20} />
                    Download PDF Notes
                  </a>
                )}

              {/* PAYMENT */}
              {!hasAccess && (
                <div className="mt-8">
                  {submitted ? (
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
                      <Clock3
                        className="mx-auto text-yellow-400 mb-4"
                        size={40}
                      />

                      <h3 className="font-bold text-xl text-yellow-300">
                        Payment Pending
                      </h3>

                      <p className="text-yellow-200/80 mt-2 text-sm">
                        Your payment
                        proof has been
                        submitted and is
                        awaiting approval.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* PAYMENT INFO */}
                      <div
                        className={`rounded-2xl border p-6 ${
                          dark
                            ? "border-zinc-800 bg-black"
                            : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <CreditCard
                            className="text-blue-500"
                            size={22}
                          />

                          <h3 className="font-bold text-lg">
                            Manual Payment
                          </h3>
                        </div>

                        <div
                          className={`space-y-4 text-sm ${
                            dark
                              ? "text-zinc-300"
                              : "text-zinc-600"
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>
                              Bank
                            </span>

                            <span className="font-semibold">
                              Indulge MFB
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>
                              Account
                              Name
                            </span>

                            <span className="font-semibold">
                              Unihelpng
                              FLW
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>
                              Account
                              Number
                            </span>

                            <span className="font-bold text-blue-500">
                              9907557021
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* FILE */}
                      <label
                        className={`mt-6 flex items-center justify-between gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                          dark
                            ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                            <Upload
                              size={22}
                            />
                          </div>

                          <div>
                            <h4 className="font-semibold">
                              Upload
                              Payment
                              Proof
                            </h4>

                            <p
                              className={`text-sm ${muted}`}
                            >
                              {proofImage
                                ? proofImage.name
                                : "PNG, JPG, JPEG"}
                            </p>
                          </div>
                        </div>

                        {proofImage && (
                          <CheckCircle2 className="text-green-500" />
                        )}

                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(
                            e
                          ) =>
                            setProofImage(
                              e.target
                                .files[0]
                            )
                          }
                        />
                      </label>

                      {/* BUTTON */}
                      <button
                        onClick={
                          handlePaymentProof
                        }
                        disabled={
                          uploading
                        }
                        className="mt-6 w-full h-16 rounded-2xl bg-linear-to-r from-blue-600 to-purple-600 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Sparkles
                              size={20}
                            />
                            Submit
                            Payment
                            Proof
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   FEATURE
========================= */

function Feature({
  text,
  dark,
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
        <CheckCircle2
          size={16}
          className="text-green-500"
        />
      </div>

      <span
        className={`text-sm ${
          dark
            ? "text-zinc-300"
            : "text-zinc-700"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
