import { useState } from "react";
import { BookOpen, ClipboardList, PlusCircleIcon, MessageSquarePlus, X, Computer } from "lucide-react";
import LectureNotesMarketplace from "./LectureNotesMarketplace";
import PastQuestions from "../components/PastQuestions";
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
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
  const [requestData, setRequestData] = useState({ type: "question", title: "", course: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error("You must be logged in to request a resource");
      return;
    }
    if (!requestData.title.trim()) {
      toast.error("A request title is required");
      return;
    }
    
    setSubmitting(true);
    try {
      const collectionName = requestData.type === "note" ? "noteRequests" : "questionRequests";
      await addDoc(collection(db, collectionName), {
        title: requestData.title.trim(),
        description: requestData.description.trim(),
        course: requestData.course.trim(),
        type: requestData.type,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || "Student",
        status: "open",
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000),
      });
      toast.success("Request submitted. It will remain open for 48 hours.");
      setShowModal(false);
      setRequestData({ type: tab === "notes" ? "note" : "question", title: "", course: "", description: "" });
    } catch (err) {
      console.error("Failed to submit resource request:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          <button
            type="button"
            onClick={() => navigate("/cbt-practice")}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              dark ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <Computer size={16} />
            CBT practice
          </button>
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
      <div className="fixed right-4 bottom-20 md:bottom-10 z-50 flex flex-col gap-3">
          {tab !== "notes" && (
            <button 
              onClick={() => navigate('/uploadquestion')}
              className='flex items-center gap-2 p-3 px-5 bg-purple-600 shadow-lg shadow-purple-500/30 rounded-full text-white hover:bg-purple-700 transition font-bold'>
              <PlusCircleIcon size={24}/>
              <span className="hidden sm:inline">Upload PDF</span>
            </button>
          )}
        <button 
          onClick={() => {
            setRequestData((current) => ({ ...current, type: tab === "notes" ? "note" : "question" }));
            setShowModal(true);
          }}
          className='flex items-center gap-2 p-3 px-5 bg-indigo-600 shadow-lg shadow-indigo-500/30 rounded-full text-white hover:bg-indigo-700 transition font-bold'
        >
          <MessageSquarePlus size={24}/>
          <span className="hidden sm:inline">Request Material</span>
        </button>
      </div>

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
            <p className="opacity-70 text-sm mb-6">Your request will be visible to the community for 48 hours.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">Request type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: "note", label: "Lecture note" }, { value: "question", label: "Past question" }].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRequestData({ ...requestData, type: option.value })}
                      aria-pressed={requestData.type === option.value}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        requestData.type === option.value
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : dark ? "border-white/10 bg-[#1a2235]" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">Title *</label>
                <input 
                  type="text" 
                  placeholder={requestData.type === "note" ? "e.g. MTH 101 integration notes" : "e.g. MTH 101 past questions"}
                  required
                  value={requestData.title}
                  onChange={(e) => setRequestData({...requestData, title: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:border-indigo-500 ${dark ? "bg-[#1a2235] border-white/10" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">Course / Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g. MTH 101"
                  value={requestData.course}
                  onChange={(e) => setRequestData({...requestData, course: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:border-indigo-500 ${dark ? "bg-[#1a2235] border-white/10" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 opacity-80">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Add any specific details about the material you need."
                  value={requestData.description}
                  onChange={(e) => setRequestData({...requestData, description: e.target.value})}
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