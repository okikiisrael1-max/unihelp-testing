import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { signOut } from "firebase/auth";

import {
  Brain,
  CalculatorIcon,
  ChevronDown,
  ChevronRight,
  File,
  HomeIcon,
  LayoutDashboardIcon,
  LogOut,
  MessageCircle,
  NotebookPenIcon,
  VideoIcon,
  YoutubeIcon,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  Sparkles,
  BadgeDollarSign,
  Wallet,
  PhoneCall,
  FileWarning,
  Newspaper,
  RadioTower,
  CheckSquare,
  ShieldCheck,
  Library,
  Bookmark,
  Sigma,
  Menu,
  X,
  HelpCircle,
  Info,
} from "lucide-react";

import { auth, db } from "../../firebase/config";

import { AuthContext } from "../context/AuthContext";

import ProfilePhoto from "./ProfilePhoto.jsx";
import UpgradeButton from "./UpgradeButton.jsx";
import { doc, getDoc } from "firebase/firestore";

const SideBar = ({ dark }) => {

  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  const location = useLocation();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [openDropdowns, setOpenDropdowns] =
    useState(["Dashboard"]);

const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const fetchUserRole = async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {

        const data = userSnap.data();
        setIsAdmin(data.admin === true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error(error);
      setIsAdmin(false);
    }
  };

  fetchUserRole();
}, [user]);

  useEffect(() => {

    const path =
      location.pathname.toLowerCase();

    if (path.includes("formula-hub")) {
      setOpenDropdowns(["Formula Hub"]);

    } else if (
      path.includes("tutorial") ||
      path.includes("lecture") ||
      path.includes("video")
    ) {
      setOpenDropdowns(["Learning"]);

    } else if (
      path.includes("gpa") ||
      path.includes("cgpa") ||
      path.includes("questions")
    ) {
      setOpenDropdowns(["Academic"]);

    } else if (
      path.includes("market") ||
      path.includes("hostel")
    ) {
      setOpenDropdowns(["Marketplace"]);

    } else if (
      path.includes("ai") ||
      path.includes("community")
    ) {
      setOpenDropdowns(["Smart Features"]);

    } else if (
      path.includes("admin")
    ) {
      setOpenDropdowns(["Admin"]);
    }

  }, [location.pathname]);

  const handleLogout = async () => {
    try {

      await signOut(auth);

      navigate("/");

    } catch (error) {
      console.log(error);
    }
  };

  const toggleDropdown = (title) => {

    setOpenDropdowns((prev) => {

      if (prev.includes(title)) {
        return prev.filter(
          (item) => item !== title
        );
      }

      return [...prev, title];
    });
  };

  const menuCategories = useMemo(
    () => [
      {
        title: "Dashboard",
        icon: (
          <LayoutDashboardIcon size={19} />
        ),

        links: [
          {
            to: "/",
            label: "Dashboard",
            icon: (
              <LayoutDashboardIcon size={18} />
            ),
          },
        ],
      },

      {
        title: "Formula Hub",

        icon: <Library size={19} />,

        links: [
          {
            to: "/formula-hub",

            label: "Formula Hub",

            icon: (
              <HomeIcon size={18} />
            ),
          },

          {
            to: "/formula-hub/bookmarks",

            label: "Bookmarks",

            icon: (
              <Bookmark size={18} />
            ),
          },
        ],
      },

      {
        title: "Academic",

        icon: (
          <GraduationCap size={19} />
        ),

        links: [
          {
            to: "/GPA",

            label: "GPA Calculator",

            icon: (
              <CalculatorIcon size={18} />
            ),
          },

          {
            to: "/CGPA",

            label: "CGPA Tracking",

            icon: (
              <CalculatorIcon size={18} />
            ),
          },

          {
            to: "/questions",

            label: "Past Questions",

            icon: <File size={18} />,
          },

          {
            to: "/lecturenotesmarketplace",

            label: "Lecture Notes",

            icon: (
              <NotebookPenIcon size={18} />
            ),
          },

          {
            to: "/tasks",

            label: "Task Management",

            icon: (
              <CheckSquare size={18} />
            ),
          },
        ],
      },

      {
        title: "Learning",

        icon: <BookOpen size={19} />,

        links: [
          {
            to: "/tutorials",

            label: "YouTube Videos",

            icon: (
              <YoutubeIcon size={18} />
            ),
          },

          {
            to: "/my-purchases",

            label: "My Purchases",

            icon: (
              <Wallet size={18} />
            ),
          },

          {
            to: "/tutor-dashboard",

            label: "Tutor Dashboard",

            icon: (
              <GraduationCap size={18} />
            ),
          },

          {
            to: "/create-tutorial",

            label: "Upload Tutorial",

            icon: (
              <BookOpen size={18} />
            ),
          },
        ],
      },

      {
        title: "Marketplace",

        icon: (
          <ShoppingBag size={19} />
        ),

        links: [
          {
            to: "/hostelmarketplace",

            label: "Find Hostel",

            icon: (
              <HomeIcon size={18} />
            ),
          },

          {
            to: "/tutorialmarketplace",

            label: "Tutorial Marketplace",

            icon: (
              <VideoIcon size={18} />
            ),
          },

          {
            to: "/studentmarketplace",

            label: "Student Marketplace",

            icon: (
              <BadgeDollarSign size={18} />
            ),
          },
        ],
      },

      {
        title: "Smart Features",

        icon: <Sparkles size={19} />,

        links: [
          {
            to: "/ai",

            label: "AI Assistance",

            icon: (
              <Brain size={18} />
            ),
          },

          {
            to: "/newsfeed",

            label: "SmartFeeds",

            icon: (
              <Newspaper size={18} />
            ),
          },

          {
            to: "/community",

            label: "Community",

            icon: (
              <MessageCircle size={18} />
            ),
          },

          {
            to: "/announcements",

            label: "Announcements",

            icon: (
              <RadioTower size={18} />
            ),
          },
        ],
      },

      ...(isAdmin
        ? [
            {
              title: "Admin",

              icon: (
                <ShieldCheck size={19} />
              ),

              links: [
                {
                  to: "/adminpanel",

                  label: "Admin Panel",

                  icon: (
                    <ShieldCheck size={18} />
                  ),
                },
              ],
            },
          ]
        : []),

      {
  title: "Support",
  icon: <PhoneCall size={19} />,
  links: [
    {
      to: "/faq",
      label: "FAQ",
      icon: <HelpCircle size={18} />,
    },
    {
      to: "/about",
      label: "About UniHelp",
      icon: <Info size={18} />,
    },
    {
      to: "/report",
      label: "Report",
      icon: <FileWarning size={18} />,
    },
    {
      to: "/contact",
      label: "Contact Us",
      icon: <PhoneCall size={18} />,
    },
  ],
}
    ],
    [isAdmin]
  );

  return (
    <>
      {/* MOBILE BUTTON */}
      <button
        onClick={() =>
          setMobileOpen(!mobileOpen)
        }
        className={`
          md:hidden fixed top-2 z-51 right-5
          p-3 rounded-2xl
          ${dark
              ? "bg-zinc-900 text-white"
              : "bg-white text-black border border-zinc-200"
          }
        `}
      >
        {mobileOpen ? (
          <X size={22} />
        ) : (
          <Menu size={22} />
        )}
      </button>

      {/* BACKDROP */}
      {mobileOpen && (
        <div
          onClick={() =>
            setMobileOpen(false)
          }
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50
          h-screen md:w-72 p-5 w-[75%]
          overflow-y-auto no-scrollbar
          transition-all duration-300
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
          ${
            dark
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-black"
          }
        `}
      >

        {/* MENU */}
        <div className="flex flex-col gap-3 md:mt-16 mb-5">

          {menuCategories.map((category) => {

            const isOpen =
              openDropdowns.includes(
                category.title
              );

            return (
              <div
                key={category.title}
                className={`
                  rounded-2xl overflow-hidden
                  transition-all duration-300
                  ${
                    isOpen
                      ? "ring-1 ring-indigo-500"
                      : ""
                  }
                  ${
                    dark
                      ? "bg-white/5 border border-white/10"
                      : "bg-white border border-gray-200"
                  }
                `}
              >

                {/* HEADER */}
                <button
                  onClick={() =>
                    toggleDropdown(
                      category.title
                    )
                  }
                  className={`
                    w-full flex items-center
                    justify-between px-4 py-3
                    font-semibold transition
                    ${
                      dark
                        ? "hover:bg-white/5"
                        : "hover:bg-gray-100"
                    }
                  `}
                >

                  <div className="flex items-center gap-2">

                    {category.icon}

                    <span>
                      {category.title}
                    </span>
                  </div>

                  <ChevronDown
                    size={18}
                    className={`
                      transition-all duration-300
                      ${
                        isOpen
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />
                </button>

                {/* LINKS */}
                <div
                  className={`
                    overflow-hidden
                    transition-[max-height]
                    duration-500 ease-in-out
                    ${
                      isOpen
                        ? "max-h-[500px] py-2"
                        : "max-h-0"
                    }
                  `}
                >

                  <div className="flex flex-col gap-1 px-2 pb-2">

                    {category.links.map(
                      (link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={() =>
                            setMobileOpen(
                              false
                            )
                          }
                          className={({
                            isActive,
                          }) =>
                            `
                              flex items-center gap-2
                              rounded-xl px-3 py-2.5
                              text-sm font-medium
                              transition-all duration-300
                              ${
                                isActive
                                  ? "bg-indigo-600 text-white"
                                  : dark
                                  ? "hover:bg-white/10"
                                  : "hover:bg-slate-200"
                              }
                            `
                          }
                        >

                          {link.icon}

                          {link.label}
                        </NavLink>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <UpgradeButton dark={dark}/>

        {/* PROFILE */}
        <div className="mt-6">

          <div
            className={`
              rounded-2xl p-4
              ${
                dark
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-gray-200"
              }
            `}
          >

            <div className="flex items-center relative">

              <div onClick={(e)=> navigate('/profile')} className="cursor-pointer flex flex-col gap-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <ProfilePhoto user={user} /> {user?.displayName ||
                    "Student"}
                </div>
                <div
                  className={`text-xs break-all ${ dark ? "text-zinc-400" : "text-zinc-500"}`}>
                  {user?.email || "No email"}
                </div>

                {isAdmin && (
                  <div className="mt-1 inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full w-fit">

                    <ShieldCheck
                      size={10}
                    />

                    ADMIN
                  </div>
                )}
              </div>

              <ChevronRight
                size={22}
                className="absolute right-1"
              />
            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="mb-30 
                mt-5 w-full cursor-pointer
                flex items-center justify-center gap-2
                bg-red-500 hover:bg-red-600
                text-white py-2.5 rounded-xl
                font-medium transition-all duration-300">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideBar;