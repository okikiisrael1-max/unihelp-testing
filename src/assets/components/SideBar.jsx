import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { signOut } from "firebase/auth";

import {
  Brain,
  CalculatorIcon,
  CalendarDays,
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
  Trophy,
  Flame,
  Menu,
  X,
  HelpCircle,
  Info,
  Bell,
  Settings,
  Rocket,
} from "lucide-react";

import { auth, db } from "../../firebase/config";

import { AuthContext } from "../context/AuthContext";

import ProfilePhoto from "./ProfilePhoto.jsx";
import UpgradeButton from "./UpgradeButton.jsx";
import { doc, getDoc } from "firebase/firestore";

const SideBar = ({ dark, menuOpen, setMenuOpen }) => {

  const { user } = useContext(AuthContext);
  const isGuest = !user;

  const navigate = useNavigate();

  const location = useLocation();

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
      path.includes("community") ||
      path.includes("messages") ||
      path.includes("notifications")
    ) {
      setOpenDropdowns(["Smart Features"]);

    } else if (
      path.includes("challenge")
    ) {
      setOpenDropdowns(["Challenges"]);

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
    () =>
      isGuest
        ? [
            {
              title: "Explore",
              icon: <LayoutDashboardIcon size={19} />,
              links: [
                {
                  to: "/",
                  label: "Home",
                  icon: <LayoutDashboardIcon size={18} />,
                },
                {
                  to: "/features",
                  label: "Features",
                  icon: <Sparkles size={18} />,
                },
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
                  to: "/help-center",
                  label: "Help Center",
                  icon: <PhoneCall size={18} />,
                },
              ],
            },
          ]
        : [
           
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

          {
            to: "/cbt-practice",

            label: "CBT Practice",

            icon: (
              <CheckSquare size={18} />
            ),
          },

          {
            to: "/smart-timetable",

            label: "Smart Timetable",

            icon: (
              <CalendarDays size={18} />
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

            label: "Groups",

            icon: (
              <MessageCircle size={18} />
            ),
          },

          {
            to: "/messages",

            label: "Messenger",

            icon: (
              <MessageCircle size={18} />
            ),
          },

          {
            to: "/notifications",

            label: "Notifications",

            icon: (
              <Bell size={18} />
            ),
          },

          {
            to: "/community-settings",

            label: "Privacy Settings",

            icon: (
              <Settings size={18} />
            ),
          },

          {
            to: "/coming-soon",

            label: "Coming Soon",

            icon: (
              <Rocket size={18} />
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

      {
        title: "Challenges",

        icon: <Trophy size={19} />,

        links: [
          {
            to: "/challenge",

            label: "Challenge Dashboard",

            icon: (
              <Trophy size={18} />
            ),
          },
          {
            to: "/streak",

            label: "Daily Streak",

            icon: (
              <Flame size={18} />
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
          ],
    [isAdmin, isGuest]
  );

  return (
    <>


      {/* BACKDROP */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"/>)}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:hidden top-0 left-0 z-50 h-[100dvh] w-[84vw] max-w-[20rem] px-4 py-5 sm:px-5 overflow-y-auto no-scrollbar transition-all duration-300 shadow-2xl border-r
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}
          ${dark ? "bg-slate-950 text-white border-white/10" : "bg-white text-slate-900 border-slate-200"}
        `}>

        <div className="mb-5 flex items-center justify-between border-b border-slate-200/70 pb-4 dark:border-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Navigation</p>
            <h2 className="mt-1 text-base font-semibold">UniHelp Workspace</h2>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className={`rounded-full p-2 ${dark ? "bg-white/10" : "bg-slate-100"}`}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* MENU */}
        <div className="mb-5 flex min-w-0 flex-col gap-3">

          {menuCategories.map((category) => {

            const isOpen =
              openDropdowns.includes(
                category.title
              );

            return (
              <div
                key={category.title}
                className={`
                  rounded-2xl overflow-hidden border transition-all duration-300
                  ${isOpen
                    ? "border-indigo-500/40 bg-indigo-500/5"
                    : "border-transparent"
                  }
                  ${dark
                    ? "bg-white/5"
                    : "bg-white"
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
                    text-sm font-semibold transition
                    ${dark
                      ? "hover:bg-white/5"
                      : "hover:bg-gray-100"
                    }
                  `}
                >

                  <div className="flex min-w-0 items-center gap-2">

                    {category.icon}

                    <span>
                      {category.title}
                    </span>
                  </div>

                  <ChevronDown
                    size={18}
                    className={`
                      transition-all duration-300
                      ${isOpen
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
                    ${isOpen
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
                            setMenuOpen(false)
                          }
                          className={({
                            isActive,
                          }) =>
                            `
                              flex items-center gap-2
                              rounded-xl px-3 py-2.5
                              text-sm font-medium
                              transition-all duration-300
                              ${isActive
                              ? "bg-indigo-600 text-white shadow-sm"
                              : dark
                                ? "text-slate-300 hover:bg-white/10 hover:text-white"
                                : "text-slate-700 hover:bg-slate-100"
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
        {!isGuest && (
          <div onClick={() => setMenuOpen(false)}>
            <UpgradeButton dark={dark} />
          </div>
        )}

        {isGuest ? (
          <div className={`mt-6 rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
            <p className="text-sm font-semibold">Sign in to unlock your space</p>
            <p className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Access your dashboard, saved tools, and personal learning experience.
            </p>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <div className={`rounded-2xl p-4 ${dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
              <div className="relative flex items-center">
                <div onClick={() => navigate('/profile')} className="flex min-w-0 cursor-pointer flex-col gap-2">
                  <p className="font-medium">Profile</p>
                  <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <ProfilePhoto user={user} /> {user?.displayName ||
                      "Student"}
                  </div>
                  <div
                    className={`text-xs break-all ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {user?.email || "No email"}
                  </div>

                  {isAdmin && (
                    <div className="mt-1 inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full w-fit">
                      <ShieldCheck size={10} />
                      ADMIN
                    </div>
                  )}
                </div>

                <ChevronRight size={22} className="absolute right-1" />
              </div>

              <button
                onClick={handleLogout}
                className="mb-6 mt-5 w-full cursor-pointer flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-all duration-300"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default SideBar;
