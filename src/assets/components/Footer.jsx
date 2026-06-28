import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer({ dark = false }) {
  const year = new Date().getFullYear();

  const theme = dark
    ? {
        wrapper: "bg-[#0B1120] text-white",
        muted: "text-gray-400",
        border: "border-white/10",
        surface: "bg-white/10",
        surfaceHover: "hover:bg-indigo-600",
        input: "border-white/10 bg-white/10",
        inputText: "text-white placeholder:text-gray-400",
      }
    : {
        wrapper: "bg-white text-slate-900 border-t border-slate-200",
        muted: "text-slate-600",
        border: "border-slate-200",
        surface: "bg-slate-100",
        surfaceHover: "hover:bg-indigo-600 hover:text-white",
        input: "border-slate-200 bg-slate-50",
        inputText: "text-slate-900 placeholder:text-slate-500",
      };

  return (
    <footer className={`mt-16 ${theme.wrapper}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-10 lg:px-8 lg:py-16">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <GraduationCap size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black sm:text-2xl">UniHelp</h2>
              <p className={`text-sm ${theme.muted}`}>Student Solution Platform</p>
            </div>
          </div>

          <p className={`leading-relaxed ${theme.muted}`}>
            Helping Nigerian students succeed through lecture notes, past
            questions, hostel marketplace, tutorials, GPA calculator, student
            community and more.
          </p>
        </div>

        <div>
          <h3 className="mb-5 text-lg font-bold">Quick Links</h3>

          <ul className="space-y-3">
            {[
              { name: "Home", link: "/" },
              { name: "Past Questions", link: "/questions" },
              { name: "Lecture Notes", link: "/lecturenotesmarketplace" },
              { name: "Marketplace", link: "/studentmarketplace" },
              { name: "Find Hostels", link: "/hostelmarketplace" },
              { name: "Community", link: "/community" },
            ].map((item, index) => (
              <li key={index}>
                <Link
                  to={item.link}
                  className={`flex items-center gap-2 text-sm transition sm:text-base ${theme.muted} ${
                    dark ? "hover:text-indigo-400" : "hover:text-indigo-600"
                  }`}
                >
                  <ChevronRight size={16} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-lg font-bold">Features</h3>

          <ul className={`space-y-3 ${theme.muted}`}>
            <li>CGPA Calculator</li>
            <li>GPA Calculator</li>
            <li>Past Questions</li>
            <li>Tutorial Videos</li>
            <li>Student Marketplace</li>
            <li>Lecture Notes</li>
            <li>Community Chat</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-lg font-bold">Contact Us</h3>

          <div className="space-y-4">
            <div className={`flex items-center gap-3 text-sm sm:text-base ${theme.muted}`}>
              <Mail size={18} />
              <span>support@unihelp.com</span>
            </div>

            <div className={`flex items-center gap-3 text-sm sm:text-base ${theme.muted}`}>
              <Phone size={18} />
              <span>+234 911 533 6339</span>
            </div>

            <div className={`flex items-center gap-3 text-sm sm:text-base ${theme.muted}`}>
              <MapPin size={18} />
              <span>Nigeria</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <button
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${theme.surface} ${theme.surfaceHover}`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`border-t ${theme.border}`}>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
            <div>
              <h3 className="text-lg font-bold sm:text-xl">Stay Updated</h3>
              <p className={`mt-1 ${theme.muted}`}>
                Get updates on new notes, tutorials and student opportunities.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className={`h-12 w-full min-w-0 rounded-xl border px-4 outline-none md:flex-1 lg:w-80 ${theme.input} ${theme.inputText}`}
              />

              <button className="h-12 shrink-0 rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-t ${theme.border}`}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-center md:flex-row md:text-left sm:px-6 lg:px-8">
          <p className={`text-sm ${theme.muted}`}>
            Copyright {year} UniHelp. All rights reserved.
          </p>

          <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm ${theme.muted} md:justify-end`}>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/help-center">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
