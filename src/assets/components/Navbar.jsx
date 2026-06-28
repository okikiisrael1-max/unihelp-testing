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
      className={`fixed top-0 left-0 z-50 w-full border-b shadow-sm backdrop-blur-xl transition-colors duration-300 ${
        dark
          ? "bg-slate-950/90 text-white border-slate-800"
          : "bg-white/90 text-slate-900 border-slate-200"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <Link to="/" className="flex items-center cursor-pointer">
          <img
            src={Images.logo}
            alt="unihelp.ng"
            className="h-9 w-auto sm:h-10 md:h-11 transition-none"
          />
        </Link>

        {/* Right Actions */}
        <div className="flex min-w-0 items-center gap-2 mr-15 sm:gap-3 md:gap-4">
           <ThemeToggle onClick={toggleTheme} dark={dark} setDark={setDark}/>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
