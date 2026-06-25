import { useNavigate } from "react-router-dom";
import { ArrowLeft, Headphones, HelpCircle, UploadCloud, Download, ShieldCheck, MessageSquare, Sparkles } from "lucide-react";

const sections = [
  {
    icon: UploadCloud,
    title: "Upload and preview issues",
    body: "Make sure the file is a PDF, the Cloudinary environment variables are set, and the browser allows pop-ups for the preview modal.",
  },
  {
    icon: Download,
    title: "Download issues",
    body: "Downloads are restricted to the owner or premium users. If a file opens inline, use the built-in download button on the viewer.",
  },
  {
    icon: ShieldCheck,
    title: "Payment verification",
    body: "Premium access and tutorial access are approved manually after payment proof is submitted through the app.",
  },
  {
    icon: MessageSquare,
    title: "Need human help?",
    body: "Send a message through Contact or use the FAQ page for common issues and setup guidance.",
  },
];

export default function HelpCenter({ dark }) {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400 mb-5">
            <Sparkles size={16} /> Help Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black">Support that keeps the app moving</h1>
          <p className="mt-5 max-w-3xl mx-auto text-lg opacity-70">
            Quick answers for uploads, previews, downloads, premium access, and the most common setup issues.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className={`${card} rounded-[28px] p-6`}> 
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <p className="leading-7 opacity-80">{section.body}</p>
              </div>
            );
          })}
        </div>

        <div className={`${card} rounded-[32px] p-8 mt-6`}> 
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black mb-2">Still stuck?</h2>
              <p className="opacity-70 max-w-2xl">
                Send a message and include the page name, file type, and the exact step where the issue appears.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/contact")} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700">
                <Headphones size={18} /> Contact Support
              </button>
              <button onClick={() => navigate("/faq")} className={`inline-flex h-12 items-center gap-2 rounded-2xl px-5 font-semibold ${dark ? "bg-white/5" : "bg-slate-100"}`}>
                <HelpCircle size={18} /> Open FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
