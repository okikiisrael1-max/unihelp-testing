import { useState } from "react";
import { BookOpen, ClipboardList, PlusCircleIcon, MessageSquarePlus, X } from "lucide-react";
import LectureNotesMarketplace from "./LectureNotesMarketplace";
import PastQuestions from "../components/PastQuestions";
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

const TABS = [
  { key: "notes", label: "Lecture notes", blurb: "Course materials shared by students", icon: BookOpen },
  { key: "questions", label: "Past questions", blurb: "Exam papers from previous sessions", icon: ClipboardList },
];

export default function Resources({ dark }) {
  const [tab, setTab] = useState("notes");
  const active = TABS.find((t) => t.key === tab);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [requestData, setRequestData] = useState({ courseCode: "", year: "", school: "", additionalInfo: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error("You must be logged in to request a resource");
      return;
    }
    if (!requestData.courseCode || !requestData.school) {
      toast.error("Course Code and School are required");
      return;
    }
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, "question_requests"), {
        ...requestData,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast.success("Request submitted successfully! We'll notify you when it's available.");
      setShowModal(false);
      setRequestData({ courseCode: "", year: "", school: "", additionalInfo: "" });
    } catch (err) {
      toast.error("Failed to submit request. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="w-full md:mt-20 min-h-screen relative">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`mb-1 text-xs font-semibold uppercase tracking-[0.3em] ${dark ? "text-indigo-400" : "text-indigo-600"}`}>
              Resource center
            </p>
            <h1 className={`text-2xl font-bold sm:text-3xl ${dark ? "text-white" : "text-slate-900"}`}>
              {active.label}
            </h1>
            <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{active.blurb}</p>
          </div>

          {/* Segmented toggle */}
          <div
            role="tablist"
            aria-label="Resource type"
            className={`grid grid-cols-2 gap-1 rounded-2xl p-1 sm:inline-grid ${
              dark ? "bg-white/5 ring-1 ring-white/10" : "bg-slate-100 ring-1 ring-slate-200"
            }`}
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : dark
                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                      : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={isActive ? "opacity-100" : "opacity-60"} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === "notes" ? (
            <LectureNotesMarketplace dark={dark} />
          ) : (
            <PastQuestions dark={dark} />
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      {tab !== "notes" && (
        <div className="fixed right-4 bottom-20 md:bottom-10 z-50 flex flex-col gap-3">
          <button 
            onClick={() => navigate('/uploadquestion')}
            className='flex items-center gap-2 p-3 px-5 bg-purple-600 shadow-lg shadow-purple-500/30 rounded-full text-white hover:bg-purple-700 transition font-bold'>
          <PlusCircleIcon size={24}/>
          <span className="hidden sm:inline">Upload PDF</span>
        </button>
        <button 
          onClick={() => setShowModal(true)}
          className='flex items-center gap-2 p-3 px-5 bg-indigo-600 shadow-lg shadow-indigo-500/30 rounded-full text-white hover:bg-indigo-700 transition font-bold'
        >
          <MessageSquarePlus size={24}/>
          <span className="hidden sm:inline">Request Material</span>
        </button>
      </div>)}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl relative ${dark ? "bg-[#111827] text-white border border-white/10" : "bg-white text-gray-900"}`}>
            <button 
              onClick={() => setShowModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-full ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Request Material</h2>
            <p className="opacity-70 text-sm mb-6">Can't find what you're looking for? Let us know and we'll try to find it.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">Course Code *</label>
                <input 
                  type="text" 
                  placeholder="e.g. MTH 101"
                  required
                  value={requestData.courseCode}
                  onChange={(e) => setRequestData({...requestData, courseCode: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:border-indigo-500 ${dark ? "bg-[#1a2235] border-white/10" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">School *</label>
                <input 
                  type="text" 
                  placeholder="e.g. University of Lagos"
                  required
                  value={requestData.school}
                  onChange={(e) => setRequestData({...requestData, school: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:border-indigo-500 ${dark ? "bg-[#1a2235] border-white/10" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">Year (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2022/2023"
                  value={requestData.year}
                  onChange={(e) => setRequestData({...requestData, year: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:border-indigo-500 ${dark ? "bg-[#1a2235] border-white/10" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">Additional Info</label>
                <textarea 
                  rows="3"
                  placeholder="Any specific topic or lecturer?"
                  value={requestData.additionalInfo}
                  onChange={(e) => setRequestData({...requestData, additionalInfo: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:border-indigo-500 resize-none ${dark ? "bg-[#1a2235] border-white/10" : "bg-gray-50 border-gray-200"}`}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition disabled:opacity-50"
              >
                {submitting ? "Submitting Request..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}