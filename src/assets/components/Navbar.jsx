import React, { useContext } from "react";
import { Images } from "./../data/data";
import { HelpCircle, MenuIcon, MoonIcon, SunIcon, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ProBtn from "./ProBtn";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ dark, setDark, setMenuOpen, menuOpen }) => {
  const { user } = useContext(AuthContext);

  const toggleTheme = () => setDark(!dark);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 md:z-500 transition-all duration-300 border-b ${
        dark
          ? "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-900 border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between px-5 md:px-10">

        <Link to="/" className="flex items-center cursor-pointer">
          <img
            src={Images.logo}
            alt="unihelp.ng"
            className="w-28 md:w-36 transition-all"
          />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 mr-15 md:gap-4">
           <ThemeToggle onClick={toggleTheme} dark={dark} setDark={setDark}/>
        </div>
      </div>
    </header>
  );
};

export default Navbar;