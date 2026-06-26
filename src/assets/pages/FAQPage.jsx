import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Home,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FAQPage({ dark = false }) {
  const [openIndex, setOpenIndex] = useState(null);
  const navigate = useNavigate();
  const faqs = [
    {
      icon: <GraduationCap size={20} />,
      question: "What is UniHelp?",
      answer:
        "UniHelp is an all-in-one student platform that helps university students access lecture notes, past questions, GPA/CGPA calculators, tutorial videos, hostel listings, student marketplace services, and community discussions."
    },
    {
      icon: <BookOpen size={20} />,
      question: "How do I upload lecture notes?",
      answer:
        "Go to the Lecture Notes section, click Upload, fill in the required details, and upload your document. Other students can then access it."
    },
    {
      icon: <BookOpen size={20} />,
      question: "Can I download lecture notes for free?",
      answer:
        "Some lecture notes are available to all users. Premium features may require an active UniHelp Premium subscription."
    },
    {
      icon: <GraduationCap size={20} />,
      question: "How does the GPA & CGPA Calculator work?",
      answer:
        "Simply enter your course units and grades. UniHelp automatically calculates your GPA and CGPA according to your institution's grading system."
    },
    {
      icon: <BookOpen size={20} />,
      question: "Can I upload past questions?",
      answer:
        "Yes. Students can contribute past questions to help others prepare for exams and improve academic performance."
    },
    {
      icon: <Home size={20} />,
      question: "How does the hostel marketplace work?",
      answer:
        "Students and agents can list available hostels with pictures, pricing, and location details. Students can browse and contact hostel owners directly."
    },
    {
      icon: <ShoppingBag size={20} />,
      question: "Can I sell products on UniHelp?",
      answer:
        "Yes. The student marketplace allows students to sell textbooks, gadgets, fashion items, services, and more."
    },
    {
      icon: <MessageCircle size={20} />,
      question: "What is the Community Chat feature?",
      answer:
        "Community Chat allows students to interact, ask questions, share opportunities, discuss academics, and build connections across campuses."
    },
    {
      icon: <BookOpen size={20} />,
      question: "How do tutorial videos work?",
      answer:
        "Students can access educational videos uploaded by tutors or linked from trusted educational platforms like YouTube."
    },
    {
      icon: <GraduationCap size={20} />,
      question: "Can I request lecture notes?",
      answer:
        "Yes. If a note is unavailable, you can submit a request and other students may upload it."
    },
    {
      icon: <HelpCircle size={20} />,
      question: "Is my data secure?",
      answer:
        "Yes. UniHelp follows industry-standard security practices to protect user information and uploaded content."
    },
    {
      icon: <HelpCircle size={20} />,
      question: "How do I become a Premium user?",
      answer:
        "Navigate to the Premium section and choose a subscription plan to unlock advanced features and unlimited downloads."
    }
  ];

  const bg = dark
    ? "bg-[#060816] text-white"
    : "bg-[#f8fafc] text-slate-900";

  const card = dark
    ? "bg-white/5 border border-white/10"
    : "bg-white border border-slate-200";

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-5xl mx-auto px-4 py-10">

      <span onClick={()=> navigate(-1)} className="bg-indigo-400/20 p-2.5 rounded-lg w-30 text-2xl cursor-pointer flex items-center gap-1 font-medium"><ArrowLeft size={22}/> Back</span>


        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-600 flex items-center justify-center mb-5">
            <HelpCircle size={40} className="text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Frequently Asked Questions
          </h1>

          <p className="text-lg opacity-70 max-w-2xl mx-auto">
            Everything you need to know about UniHelp and its student-focused
            services.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const open = openIndex === index;

            return (
              <div
                key={index}
                className={`${card} rounded-3xl overflow-hidden transition-all`}
              >
                <button
                  onClick={() =>
                    setOpenIndex(open ? null : index)
                  }
                  className="w-full p-6 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      {faq.icon}
                    </div>

                    <h3 className="font-bold text-lg">
                      {faq.question}
                    </h3>
                  </div>

                  {open ? (
                    <ChevronUp size={22} />
                  ) : (
                    <ChevronDown size={22} />
                  )}
                </button>

                {open && (
                  <div className="px-6 pb-6">
                    <div className="pl-16 text-sm leading-7 opacity-80">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support */}
        <div
          className={`${card} mt-10 rounded-3xl p-8 text-center`}
        >
          <h2 className="text-2xl font-bold mb-3">
            Still Need Help?
          </h2>

          <p className="opacity-70 mb-5">
            Our support team is always available to assist you.
          </p>

          <button
            onClick={() => navigate("/help-center")}
            className="px-8 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
