import { useEffect, useMemo, useState } from "react";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "./../../../firebase/config";
import { summarizeTutorFinances } from "../../utils/tutorialEarnings";

import { Clock, Send, Wallet, TrendingUp, DollarSign } from "lucide-react";

export default function TutorEarnings({ dark }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [tutorialsLoaded, setTutorialsLoaded] = useState(false);
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);
  const [withdrawalsLoaded, setWithdrawalsLoaded] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("opay");
  const [account, setAccount] = useState("");

  const summary = useMemo(
    () =>
      summarizeTutorFinances({
        tutorials,
        purchases,
        withdrawals,
      }),
    [tutorials, purchases, withdrawals]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
    });

    return () => unsubscribe();
  }, []);

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

    const unsubscribe = onSnapshot(q, (snap) => {
      setTutorials(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setTutorialsLoaded(true);
    });

    return () => unsubscribe();
  }, [authReady, currentUser?.uid]);

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

    const unsubscribe = onSnapshot(q, (snap) => {
      setPurchases(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setPurchasesLoaded(true);
    });

    return () => unsubscribe();
  }, [authReady, currentUser?.uid]);

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

    const unsubscribe = onSnapshot(q, (snap) => {
      setWithdrawals(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setWithdrawalsLoaded(true);
    });

    return () => unsubscribe();
  }, [authReady, currentUser?.uid]);

  useEffect(() => {
    setLoading(
      !authReady ||
        (currentUser &&
          (!tutorialsLoaded || !purchasesLoaded || !withdrawalsLoaded))
    );
  }, [
    authReady,
    currentUser,
    tutorialsLoaded,
    purchasesLoaded,
    withdrawalsLoaded,
  ]);

  const requestWithdrawal = async () => {
    if (!currentUser?.uid) return alert("Login required");
    if (!amount || !account) return alert("Fill all fields");

    if (Number(amount) > summary.withdrawableBalance) {
      return alert("Insufficient withdrawable balance");
    }

    await addDoc(collection(db, "withdrawals"), {
      tutorId: currentUser.uid,
      amount: Number(amount),
      method,
      accountDetails: account,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    alert("Withdrawal request sent");

    setAmount("");
    setAccount("");
  };

  return (
    <div
      className={`min-h-screen md:pt-20 p-6 ${
        dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div
          className={`rounded-[2rem] border p-6 sm:p-8 ${
            dark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                Creator Earnings
              </p>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                Tutor Earnings Dashboard
              </h1>
              <p className="mt-3 max-w-2xl opacity-70">
                Your earnings are calculated from approved tutorial sales. UniHelp
                keeps a 20% platform fee on each sale, and the balance below shows
                what is still withdrawable after any approved or pending payouts.
              </p>
            </div>

            <div className="rounded-3xl bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-500">
              20% platform fee
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            dark={dark}
            title="Gross Revenue"
            value={`₦${summary.grossRevenue.toLocaleString()}`}
            icon={TrendingUp}
            color="text-green-500"
            bg="bg-green-500/10"
          />

          <StatCard
            dark={dark}
            title="Platform Fee"
            value={`₦${summary.platformFee.toLocaleString()}`}
            icon={DollarSign}
            color="text-yellow-500"
            bg="bg-yellow-500/10"
          />

          <StatCard
            dark={dark}
            title="Total Balance"
            value={`₦${summary.creatorGrossBalance.toLocaleString()}`}
            icon={Wallet}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />

          <StatCard
            dark={dark}
            title="Withdrawable"
            value={`₦${summary.withdrawableBalance.toLocaleString()}`}
            icon={Wallet}
            color="text-purple-500"
            bg="bg-purple-500/10"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            dark={dark}
            title="Withdrawn"
            value={`₦${summary.withdrawnAmount.toLocaleString()}`}
            icon={Send}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />

          <StatCard
            dark={dark}
            title="Pending Withdrawals"
            value={`₦${summary.reservedAmount.toLocaleString()}`}
            icon={Clock}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
        </div>

        {loading && (
          <div
            className={`rounded-[2rem] border p-10 text-center ${
              dark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
            }`}
          >
            <p className="opacity-70">Loading earnings...</p>
          </div>
        )}

        {!loading && (
          <>
            <div
              className={`p-5 rounded-2xl ${
                dark ? "bg-[#1e293b]" : "bg-white"
              }`}
            >
              <h2 className="text-xl font-bold mb-4">Request Withdrawal</h2>

              <div className="grid gap-3">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  type="number"
                  className="p-3 rounded-xl text-black"
                />

                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="p-3 rounded-xl text-black"
                >
                  <option value="kuda">Kuda</option>
                  <option value="opay">Opay</option>
                  <option value="palmpay">PalmPay</option>
                  <option value="moniepoint">MoniePoint</option>
                </select>

                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="Account Details"
                  className="p-3 rounded-xl text-black"
                />

                <button
                  onClick={requestWithdrawal}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl"
                >
                  <Send size={18} />
                  Request Withdrawal
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Withdrawal History</h2>

              <div className="grid gap-4">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-xl flex justify-between items-center ${
                      dark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-bold">₦{w.amount}</p>
                      <p className="text-sm opacity-60">
                        {w.method} - {w.accountDetails}
                      </p>
                    </div>

                    <div
                      className={`flex items-center gap-1 text-sm ${
                        w.status === "pending"
                          ? "text-yellow-500"
                          : w.status === "approved"
                            ? "text-green-500"
                            : "text-red-500"
                      }`}
                    >
                      <Clock size={16} />
                      {w.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ dark, title, value, icon: Icon, color, bg }) {
  return (
    <div
      className={`rounded-[2rem] border p-6 ${
        dark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-70">{title}</p>
          <h2 className="text-3xl sm:text-4xl font-black mt-3">{value}</h2>
        </div>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bg}`}>
          <Icon className={color} />
        </div>
      </div>
    </div>
  );
}
