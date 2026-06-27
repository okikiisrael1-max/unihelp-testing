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
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-white"} h-screen flex items-center justify-center`}>
      <h1 className="text-2xl font-bold flex"><CheckCheckIcon/> Payment Successful</h1>
    </div>
  );
}
