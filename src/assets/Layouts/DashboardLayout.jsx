import React, { useState, useContext } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import SideBar from "../components/SideBar";
import BottomBar from "../components/BottomBar";
import { auth } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import ProfilePhoto from "../components/ProfilePhoto";

import {
  Brain,
  CalculatorIcon,
  ChartAreaIcon,
  ChevronDown,
  ChevronRight,
  File,
  FileWarning,
  GraduationCap,
  HouseIcon,
  NewspaperIcon,
  NotebookPenIcon,
  PhoneCall,
  PlaySquareIcon,
  Video,
  LogOut,
  BookOpen,
  LayoutDashboard,
  BadgeDollarSign,
  Wallet,
  BookOpenCheck,
  RadioTower,
} from "lucide-react";
import UpgradeButton from "../components/UpgradeButton";
import ThemeToggle from "../components/ThemeToggle";
import Navbar from "../components/Navbar";
import DraggableCalculatorButton from "../components/DraggableCalculatorButton";
import Footer from "../components/Footer";

const DashboardLayout = ({ dark, setDark, menuOpen, setMenuOpen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const menuCategories = [
    {
      title: "Academic Tools",
      icon: <GraduationCap size={20} />,
      links: [
        { to: "/GPA", label: "GPA Calculator", icon: <CalculatorIcon size={18} /> },
        { to: "/CGPA", label: "CGPA Tracking", icon: <ChartAreaIcon size={18} /> },
        { to: "/questions", label: "Past Questions", icon: <File size={18} /> },
      ],
    },
    {
      title: "Learning Resources",
      icon: <BookOpen size={20} />,
      links: [
        { to: "/lecturenotesmarketplace", label: "Lecture Notes", icon: <NotebookPenIcon size={18} /> },
      ],
    },

    {
      title: "Student Marketplace",
      icon: <LayoutDashboard size={20} />,
      links: [
        { to: "/hostelmarketplace", label: "Find Hostel", icon: <HouseIcon size={18} /> },
        { to: "/studentmarketplace", label: "Student Marketplace", icon: <BadgeDollarSign size={18} /> },
      ],
    },
    {
      title: "Smart Features",
      icon: <Brain size={20} />,
      links: [
        { to: "/newsfeed", label: "Smart Feeds", icon: <NewspaperIcon size={18} /> },
        { to: "/ai", label: "AI Assistance", icon: <Brain size={18} /> },
        { to: "/announcements", label: "Announcements", icon: <RadioTower size={18} /> },
      ],
    },
    {
      title: "Support",
      icon: <PhoneCall size={20} />,
      links: [
        { to: "/report", label: "Report", icon: <FileWarning size={18} /> },
        { to: "/contact", label: "Contact Us", icon: <PhoneCall size={18} /> },
      ],
    },
  ];

  return (
    <div className="flex h-dvh w-full overflow-hidden">

      <Navbar dark={dark} setMenuOpen={setMenuOpen} menuOpen={menuOpen} setDark={setDark}/>

      <div className="relative z-50">
        <SideBar dark={dark} />
        <BottomBar dark={dark} />
      </div>

      <main
        onClick={() => setMenuOpen(false)}
        className={`flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden pb-28 md:pb-0 pt-16 md:pt-0 ${
          dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <Outlet />
        <Footer dark={dark}/>
        <DraggableCalculatorButton dark={dark} onClick={() => navigate("/calculator")} />
      </main>
    </div>
  );
};

export default DashboardLayout;
