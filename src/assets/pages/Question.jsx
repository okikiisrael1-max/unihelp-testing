import React from 'react'
import PastQuestions from '../components/PastQuestions'
import { PlusCircleIcon, MessageSquarePlus, X } from 'lucide-react';
import { db, auth } from '../../firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useState } from 'react';

const Question = ({dark}) => {
  const [showModal, setShowModal] = useState(false);
  const [requestData, setRequestData] = useState({ courseCode: "", year: "", school: "", additionalInfo: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error("You must be logged in to request a question");
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
    <div className='relative w-full p-5 md:mt-20 min-h-screen'>
      <PastQuestions dark={dark}/>
      
      {/* Floating Action Button */}
      <button 
        onClick={() => setShowModal(true)}
        className='fixed cursor-pointer flex items-center gap-2 p-3 px-5 bg-indigo-600 shadow-lg shadow-indigo-500/30 rounded-full text-white right-4 bottom-20 md:bottom-10 hover:bg-indigo-700 transition font-bold z-50'
      >
        <MessageSquarePlus size={24}/>
        <span className="hidden sm:inline">Request Question</span>
      </button>

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

            <h2 className="text-2xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Request Past Question</h2>
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
  )
}

export default Question
