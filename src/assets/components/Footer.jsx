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

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0B1120] text-white mt-20">
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <GraduationCap size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-black">UniHelp</h2>
              <p className="text-sm text-gray-400">
                Student Solution Platform
              </p>
            </div>
          </div>

          <p className="text-gray-400 leading-relaxed">
            Helping Nigerian students succeed through lecture notes,
            past questions, hostel marketplace, tutorials,
            GPA calculator, student community and more.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-lg mb-5">
            Quick Links
          </h3>

          <ul className="space-y-3">
            {[
                {name:"Home", link: '/' },
                {name:"Past Questions", link: '/questions' },
                {name:"Lecture Notes", link: '/lecturenotesmarketplace' },
                {name:"Marketplace", link: '/studentmarketplace' },
                {name:"Find Hostels", link: '/hostelmarketplace' },
                {name:"Community", link: '/community'},
            ].map((item, index) => (
              <li key={index}>
                <Link
                  to={item.link}
                  className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition"
                >
                  <ChevronRight size={16} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div>
          <h3 className="font-bold text-lg mb-5">
            Features
          </h3>

          <ul className="space-y-3 text-gray-400">
            <li>CGPA Calculator</li>
            <li>GPA Calculator</li>
            <li>Past Questions</li>
            <li>Tutorial Videos</li>
            <li>Student Marketplace</li>
            <li>Lecture Notes</li>
            <li>Community Chat</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-bold text-lg mb-5">
            Contact Us
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-400">
              <Mail size={18} />
              <span>support@unihelp.com</span>
            </div>

            <div className="flex items-center gap-3 text-gray-400">
              <Phone size={18} />
              <span>+234 911 533 6339</span>
            </div>

            <div className="flex items-center gap-3 text-gray-400">
              <MapPin size={18} />
              <span>Nigeria</span>
            </div>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3 mt-6">
            {[
              Facebook,
              Instagram,
              Twitter,
              Youtube,
            ].map((Icon, i) => (
              <button
                key={i}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-indigo-600 transition flex items-center justify-center"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">

            <div>
              <h3 className="text-xl font-bold">
                Stay Updated
              </h3>

              <p className="text-gray-400 mt-1">
                Get updates on new notes, tutorials and student opportunities.
              </p>
            </div>

            <div className="flex flex-col md:flex-row w-full lg:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="md:flex-1 lg:w-80 h-12 rounded-xl px-4 bg-white/10 border border-white/10 outline-none"
              />

              <button className="px-6 max-md:h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-gray-500 text-sm text-center md:text-left">
            © {year} UniHelp. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/help-center">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
