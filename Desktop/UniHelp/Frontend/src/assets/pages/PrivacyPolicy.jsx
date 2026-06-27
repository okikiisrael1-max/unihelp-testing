import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Database, Cloud, FileText, Lock } from "lucide-react";

const policyPoints = [
  {
    icon: Database,
    title: "What we collect",
    body: "Account details, profile info, uploaded documents, marketplace listings, and support messages needed to run the platform.",
  },
  {
    icon: Cloud,
    title: "Where files go",
    body: "Uploaded media is stored through Cloudinary and app data is saved in Firebase so the site can preview, list, and share content reliably.",
  },
  {
    icon: FileText,
    title: "How files are used",
    body: "Files are used for the feature you selected, such as lecture notes, payment proofs, tutorial documents, or profile images.",
  },
  {
    icon: Lock,
    title: "Your control",
    body: "You can request account support, manage your profile, and stop using the service at any time. We keep data only as long as needed for the app to work.",
  },
];

export default function PrivacyPolicy({ dark }) {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 mb-5">
            <ShieldCheck size={16} /> Privacy Policy
          </div>
          <h1 className="text-4xl md:text-6xl font-black">Privacy that is simple and direct</h1>
          <p className="mt-5 max-w-3xl mx-auto text-lg opacity-70">
            This page explains what UniHelp collects, how uploaded files are handled, and how we protect student data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {policyPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className={`${card} rounded-[28px] p-6`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-xl font-bold">{point.title}</h2>
                </div>
                <p className="leading-7 opacity-80">{point.body}</p>
              </div>
            );
          })}
        </div>

        <div className={`${card} rounded-[32px] p-8 mt-6 leading-8 opacity-80`}>
          <p>
            We do not sell student uploads. Public items such as marketplace listings and lecture notes are shown only when a user chooses to publish them.
          </p>
          <p className="mt-4">
            If you want a file removed or have a privacy concern, use the Contact page and include the file title or account email so we can locate it quickly.
          </p>
        </div>
      </div>
    </div>
  );
}
