import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { addDoc, collection } from "firebase/firestore";
import { CheckCheckIcon } from "lucide-react";

export default function PaymentSuccess({ dark }) {
  const [params] = useSearchParams();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const verifyPayment = async () => {
      const tx_ref = params.get("tx_ref");
      const tutorialId = localStorage.getItem("tutorialId");
      const plan = localStorage.getItem("paymentPlan");
      const billing = localStorage.getItem("paymentBilling");
      const amount = Number(localStorage.getItem("paymentAmount"));
      const userId = auth.currentUser?.uid;

      if (!tx_ref || !userId) {
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/payments/verify-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction_id: tx_ref,
            userId,
            plan: plan || "student-premium",
            billing: billing || "monthly",
            amount: Number.isFinite(amount) ? amount : 0,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          await addDoc(collection(db, "purchases"), {
            tx_ref,
            userId,
            tutorialId,
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.log("Payment verification failed:", error);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${dark ? "bg-[#0f172a] text-white" : "bg-white text-slate-900"}`}>
      <div className={`w-full max-w-md rounded-3xl border px-6 py-8 text-center shadow-xl ${dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
          <CheckCheckIcon size={28} />
        </div>

        <h1 className="text-2xl font-bold sm:text-3xl">Payment Successful</h1>

        <p className="mt-3 text-sm leading-6 opacity-75 sm:text-base">
          Your payment has been verified. You can now continue using your premium access.
        </p>
      </div>
    </div>
  );
}
