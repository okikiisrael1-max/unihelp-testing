import { useEffect, useMemo, useState } from "react";

import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "./../../../firebase/config";
import { summarizeTutorFinances } from "../../utils/tutorialEarnings";

import { Link } from "react-router-dom";

import {
  BookOpen,
  Trash2,
  Eye,
  PlusCircle,
  Wallet,
  DollarSign,
  Sparkles,
  PlayCircle,
  Loader2,
  ArrowRight,
  BadgeCheck,
  GraduationCap,
} from "lucide-react";

export default function TutorDashboard({
  dark,
}) {
  const naira = String.fromCharCode(8358);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [tutorials, setTutorials] =
    useState([]);

  const [purchases, setPurchases] =
    useState([]);

  const [withdrawals, setWithdrawals] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [authReady, setAuthReady] =
    useState(false);
  const [tutorialsLoaded, setTutorialsLoaded] =
    useState(false);
  const [purchasesLoaded, setPurchasesLoaded] =
    useState(false);
  const [withdrawalsLoaded, setWithdrawalsLoaded] =
    useState(false);

  const financials = useMemo(
    () =>
      summarizeTutorFinances({
        tutorials,
        purchases,
        withdrawals,
      }),
    [tutorials, purchases, withdrawals]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setAuthReady(true);

        if (!user) {
          setTutorials([]);
          setPurchases([]);
          setWithdrawals([]);
          setTutorialsLoaded(true);
          setPurchasesLoaded(true);
          setWithdrawalsLoaded(true);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // ============================
  // FETCH TUTORIALS
  // ============================
  useEffect(() => {
    if (!authReady) return undefined;

    if (!currentUser?.uid) {
      setTutorialsLoaded(true);
      return undefined;
    }

    setTutorialsLoaded(false);

    const q = query(
      collection(db, "tutorials"),
      where("tutorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTutorials(data);
      setTutorialsLoaded(true);
    });

    return () => unsub();
  }, [authReady, currentUser?.uid]);

  // ============================
  // FETCH SALES
  // ============================
  useEffect(() => {
    if (!authReady) return undefined;

    if (!currentUser?.uid) {
      setPurchasesLoaded(true);
      return undefined;
    }

    setPurchasesLoaded(false);

    const q = query(
      collection(db, "purchases"),
      where("tutorId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPurchases(data);
      setPurchasesLoaded(true);
    });

    return () => unsub();
  }, [authReady, currentUser?.uid]);

  // ============================
  // FETCH WITHDRAWALS
  // ============================
  useEffect(() => {
    if (!authReady) return undefined;

    if (!currentUser?.uid) {
      setWithdrawalsLoaded(true);
      return undefined;
    }

    setWithdrawalsLoaded(false);

    const q = query(
      collection(db, "withdrawals"),
      where("tutorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setWithdrawals(data);
      setWithdrawalsLoaded(true);
    });

    return () => unsub();
  }, [authReady, currentUser?.uid]);

  // ============================
  // DELETE TUTORIAL
  // ============================
  const handleDelete = async (id) => {
    try {
      const confirmDelete =
        window.confirm(
          "Delete this tutorial permanently?"
        );

      if (!confirmDelete) return;

      await deleteDoc(
        doc(db, "tutorials", id)
      );

      alert("Tutorial deleted");
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const balanceReady =
    authReady &&
    tutorialsLoaded &&
    purchasesLoaded &&
    withdrawalsLoaded;

  useEffect(() => {
    setLoading(!balanceReady);
  }, [balanceReady]);

  return (
    <div
      className={`min-h-screen md:pt-20 transition-all duration-300 overflow-hidden ${
        dark
          ? "bg-[#020617] text-white"
          : "bg-[#f8fafc] text-black"
      }`}
    >
      {/* BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-blue-500/20 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-purple-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ============================ */}
        {/* HERO */}
        {/* ============================ */}
        <div
          className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 lg:p-10 mb-8 backdrop-blur-xl ${
            dark
              ? "bg-white/5 border-white/10"
              : "bg-white border-gray-200"
          }`}
        >
          {/* GLOW */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/20 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            {/* LEFT */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-2 rounded-full text-sm font-semibold mb-5">
                <Sparkles size={16} />
                Creator Dashboard
              </div>

              <h1 className="text-4xl sm:text-5xl font-black leading-tight">
                Tutor Dashboard
              </h1>

              <p className="mt-4 text-base sm:text-lg opacity-70 leading-relaxed">
                Upload tutorials, manage your
                educational content, monitor
                sales, and grow your earnings
                inside CampusFlow.
              </p>

              <div
                className={`mt-6 rounded-2xl border px-4 py-4 text-sm leading-relaxed ${
                  dark
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-100"
                    : "border-amber-200 bg-amber-50 text-amber-900/80"
                }`}
              >
                UniHelp keeps a 20% platform fee on every approved tutorial
                payment. The balance cards below already reflect the creator
                share after fees, withdrawals, and reserved payout requests.
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  to="/create-tutorial"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02]"
                >
                  <PlusCircle size={20} />
                  Upload Tutorial
                </Link>

                <Link
                  to="/earnings"
                  className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02]"
                >
                  <Wallet size={20} />
                  Withdraw Earnings
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div
              className={`rounded-[2rem] p-6 border min-w-[300px] ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-green-500/10">
                  <BadgeCheck className="text-green-500" />
                </div>

                <div>
                  <h3 className="font-bold text-lg">
                    Verified Tutor
                  </h3>

                  <p className="text-sm opacity-60">
                    Premium educator access
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="opacity-70">
                    Tutorials
                  </span>

                  <span className="font-bold text-xl">
                    {financials.totalTutorials}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="opacity-70">
                    Approved Sales
                  </span>

                  <span className="font-bold text-xl">
                    {financials.totalSales}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="opacity-70">
                    Gross Revenue
                  </span>

                <span className="font-bold text-xl text-green-500">
                    {naira}
                    {financials.grossRevenue.toLocaleString()}
                </span>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================ */}
        {/* STATS */}
        {/* ============================ */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {/* TOTAL TUTORIALS */}
          <div
            className={`rounded-[2rem] p-6 border transition-all duration-300 hover:-translate-y-1 ${
              dark
                ? "bg-white/5 border-white/10"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">
                  Total Tutorials
                </p>

                <h2 className="text-4xl font-black mt-3">
                  {
                    financials.totalTutorials
                  }
                </h2>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="text-blue-500" />
              </div>
            </div>
          </div>

          {/* SALES */}
          <div
            className={`rounded-[2rem] p-6 border transition-all duration-300 hover:-translate-y-1 ${
              dark
                ? "bg-white/5 border-white/10"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">
                  Total Sales
                </p>

                <h2 className="text-4xl font-black mt-3">
                  {financials.totalSales}
                </h2>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="text-green-500" />
              </div>
            </div>
          </div>

          {/* REVENUE */}
          <div
            className={`rounded-[2rem] p-6 border transition-all duration-300 hover:-translate-y-1 ${
              dark
                ? "bg-white/5 border-white/10"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">
                  Revenue
                </p>

                <h2 className="text-4xl font-black mt-3 text-yellow-500">
                  {naira}
                  {financials.grossRevenue.toLocaleString()}
                </h2>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                <Wallet className="text-yellow-500" />
              </div>
            </div>
          </div>

          {/* VIEWS */}
          <div
            className={`rounded-[2rem] p-6 border transition-all duration-300 hover:-translate-y-1 ${
              dark
                ? "bg-white/5 border-white/10"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">
                  Withdrawable
                </p>

                <h2 className="text-4xl font-black mt-3">
                  {naira}
                  {financials.withdrawableBalance.toLocaleString()}
                </h2>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Wallet className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ============================ */}
        {/* LOADING */}
        {/* ============================ */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28">
            <div
              className={`p-5 rounded-full mb-5 ${
                dark
                  ? "bg-white/5"
                  : "bg-white"
              }`}
            >
              <Loader2
                size={40}
                className="animate-spin text-blue-500"
              />
            </div>

            <h2 className="text-2xl font-bold mb-2">
              Loading Tutorials
            </h2>

            <p className="opacity-60">
              Fetching your content...
            </p>
          </div>
        )}

        {/* ============================ */}
        {/* EMPTY */}
        {/* ============================ */}
        {!loading &&
          tutorials.length === 0 && (
            <div
              className={`rounded-[2rem] border p-10 sm:p-16 text-center ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="w-24 h-24 mx-auto rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6">
                <GraduationCap
                  size={50}
                  className="text-blue-500"
                />
              </div>

              <h2 className="text-3xl font-black mb-4">
                No Tutorials Yet
              </h2>

              <p className="opacity-70 max-w-xl mx-auto mb-8 text-lg">
                Start monetizing your knowledge
                by uploading premium tutorials
                for students.
              </p>

              <Link
                to="/create-tutorial"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02]"
              >
                <PlusCircle size={20} />
                Upload First Tutorial
              </Link>
            </div>
          )}

        {/* ============================ */}
        {/* TUTORIAL GRID */}
        {/* ============================ */}
        {!loading &&
          tutorials.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {tutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className={`group rounded-[2rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                    dark
                      ? "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {/* THUMBNAIL */}
                  <div className="relative h-56 overflow-hidden">
                    {tutorial.thumbnailUrl ? (
                      <img
                        src={
                          tutorial.thumbnailUrl
                        }
                        alt={tutorial.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${
                          dark
                            ? "bg-[#0f172a]"
                            : "bg-gray-100"
                        }`}
                      >
                        <PlayCircle
                          size={45}
                          className="opacity-40"
                        />

                        <p className="mt-3 opacity-50">
                          No Thumbnail
                        </p>
                      </div>
                    )}

                    {/* OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                    {/* PRICE */}
                    <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-xl">
                      {naira}
                      {tutorial.price?.toLocaleString?.() ||
                        tutorial.price}
                    </div>

                    {/* CATEGORY */}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-xl text-white px-3 py-1 rounded-full text-xs">
                      {tutorial.category}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <h2 className="text-2xl font-black line-clamp-1">
                      {tutorial.title}
                    </h2>

                    <p className="opacity-70 text-sm mt-3 line-clamp-3 leading-relaxed">
                      {
                        tutorial.description
                      }
                    </p>

                    {/* FOOTER */}
                    <div className="flex items-center justify-between mt-6">
                      <div>
                        <p className="text-xs opacity-50">
                          Views
                        </p>

                        <h4 className="font-bold text-lg">
                          {tutorial.views || 0}
                        </h4>
                      </div>

                      <div>
                        <p className="text-xs opacity-50">
                          Status
                        </p>

                        <div className="flex items-center gap-1 text-green-500 font-semibold">
                          <BadgeCheck
                            size={16}
                          />
                          Active
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3 mt-6">
                      {/* VIEW */}
                      <a
                        href={tutorial.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold transition-all duration-300"
                      >
                        <Eye size={18} />
                        View
                      </a>

                      {/* DELETE */}
                      <button
                        onClick={() =>
                          handleDelete(
                            tutorial.id
                          )
                        }
                        className="w-14 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all duration-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* OPEN */}
                    <Link
                      to={`/tutorial/${tutorial.id}`}
                      className={`mt-4 flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${
                        dark
                          ? "bg-[#0f172a] hover:bg-[#162033]"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <span className="font-semibold">
                        Open Tutorial Page
                      </span>

                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}


