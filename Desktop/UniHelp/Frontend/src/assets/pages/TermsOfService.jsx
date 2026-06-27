import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, FileCheck, AlertTriangle, Wallet, Users } from "lucide-react";

const terms = [
  {
    icon: FileCheck,
    title: "Acceptable use",
    body: "Use UniHelp for learning, sharing, and campus support. Do not upload illegal, harmful, or misleading content.",
  },
  {
    icon: Wallet,
    title: "Payments and premium access",
    body: "Paid features and subscriptions are tied to the payment flow shown in the app and may require manual approval.",
  },
  {
    icon: Users,
    title: "Content ownership",
    body: "You keep ownership of your own content, but you grant UniHelp permission to display it for the purpose of the service.",
  },
  {
    icon: AlertTriangle,
    title: "Service limits",
    body: "UniHelp is provided as-is. We work to keep the platform reliable, but outages, moderation delays, or delivery issues can happen.",
  },
];

export default function TermsOfService({ dark }) {
  const navigate = useNavigate();
  const bg = dark ? "bg-[#050816] text-white" : "bg-slate-50 text-slate-900";
  const card = dark ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200";

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-lg font-medium mb-8">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400 mb-5">
            <Scale size={16} /> Terms of Service
          </div>
          <h1 className="text-4xl md:text-6xl font-black">Clear rules for using UniHelp</h1>
          <p className="mt-5 max-w-3xl mx-auto text-lg opacity-70">
            These terms explain how the platform works, what is allowed, and what students should expect.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {terms.map((term) => {
            const Icon = term.icon;
            return (
              <div key={term.title} className={`${card} rounded-[28px] p-6`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-xl font-bold">{term.title}</h2>
                </div>
                <p className="leading-7 opacity-80">{term.body}</p>
              </div>
            );
          })}
        </div>

        <div className={`${card} rounded-[32px] p-8 mt-6 leading-8 opacity-80`}>
          <p>
            By using UniHelp, you agree to keep your account secure, respect other users, and follow campus-safe sharing practices.
          </p>
          <p className="mt-4">
            If you do not agree with these terms, you should stop using the service and contact support if you need help with your account or data.
          </p>
        </div>
      </div>
    </div>
  );
}
