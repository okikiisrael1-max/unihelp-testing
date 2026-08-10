import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Loader2,
  Search,
  Ban,
  Settings2,
  Sparkles,
  ChevronDown,
  RadioTower,
  UserCheck,
  UserX,
  Building2,
  ShieldAlert,
  X,
  Check,
} from "lucide-react";

import useAdmin from "../hooks/useAdmin";
import { db, auth } from "../../firebase/config";

import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import AdminAnnouncements from "../components/AdminAnncouncement";

export default function AdminPanel({ dark }) {
  /* ---------------- STATES ---------------- */
  const [tab, setTab] = useState("dashboard");
  const [hostels, setHostels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  /* ---------------- CUSTOM HOOK ---------------- */
  const isAdmin = useAdmin();

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    if (!isAdmin) return;

    const unsubHostels = onSnapshot(
      collection(db, "hostels"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setHostels(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error (hostels):", error);
        setLoading(false);
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setUsers(data);
      },
      (error) => {
        console.error("Firestore Error (users):", error);
      }
    );

    return () => {
      unsubHostels();
      unsubUsers();
    };
  }, [isAdmin]);

  /* ---------------- MEMOS ---------------- */
  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return users;

    return users.filter((u) =>
      [u.username, u.name, u.displayName, u.email, u.role]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const totalBanned = users.filter((u) => u.banned).length;
    const totalActive = users.length - totalBanned;

    return {
      totalHostels: hostels.length,
      totalUsers: users.length,
      activeUsers: totalActive,
      bannedUsers: totalBanned,
    };
  }, [hostels, users]);

  /* ---------------- FUNCTIONS ---------------- */
  const toggleBanUser = async (user) => {
    try {
      setActionLoadingId(user.id);
      await updateDoc(doc(db, "users", user.id), {
        banned: !user.banned,
      });
    } catch (err) {
      console.error("Failed to toggle ban status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ---------------- TABS ---------------- */
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "announcements", label: "Announcements", icon: RadioTower },
  ];

  /* ---------------- STYLES ---------------- */
  const bg = dark ? "bg-[#050816] text-slate-100" : "bg-[#f8fafc] text-slate-900";
  const glass = dark
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl"
    : "bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-sm";
  const innerCard = dark ? "bg-white/5 border border-white/5" : "bg-slate-100/70 border border-slate-200/50";

  /* ---------------- AUTH CHECKS ---------------- */
  if (!auth.currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${bg}`}>
        <div className={`${glass} max-w-md w-full p-8 rounded-3xl text-center space-y-4`}>
          <ShieldAlert className="mx-auto text-amber-500" size={48} />
          <h2 className="text-2xl font-black">Authentication Required</h2>
          <p className="text-sm opacity-70">Please log in to your account to access the administrative control panel.</p>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-sm font-medium opacity-70">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${bg}`}>
        <div className={`${glass} max-w-md w-full p-8 rounded-3xl text-center space-y-4`}>
          <ShieldAlert className="mx-auto text-red-500" size={48} />
          <h2 className="text-2xl font-black">Access Denied</h2>
          <p className="text-sm opacity-70">You do not have administrative privileges required to view this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen md:mt-15 w-full relative ${bg}`}>
      {/* BACKGROUND AMBIENT GLOWS */}
      <div className="fixed -top-32 -left-32 h-[30rem] w-[30rem] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* STICKY TOP NAVIGATION BAR */}
      <header className={`sticky top-0 z-40 w-full border-b ${dark ? "border-slate-800/80 bg-[#050816]/80" : "border-slate-200 bg-white/80"} backdrop-blur-2xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Settings2 size={20} />
            </div>
            <div>
              <h1 className="font-black text-lg sm:text-xl tracking-tight leading-none">Unihelp</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase opacity-60">Control Center</span>
            </div>
          </div>

          {/* DESKTOP TABS */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-500/10 border border-slate-500/10">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-semibold ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : dark
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className={`lg:hidden p-2.5 rounded-2xl border transition ${
              dark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-100 border-slate-200 hover:bg-slate-200"
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenu ? <X size={20} /> : <Sparkles size={20} className="text-indigo-500" />}
          </button>
        </div>

        {/* MOBILE NAVIGATION DROPDOWN */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-slate-500/10 px-4 py-3 space-y-1.5">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setMobileMenu(false);
                  }}
                  className={`w-full p-3 rounded-xl transition flex items-center gap-3 text-sm font-semibold ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : dark
                      ? "hover:bg-white/5 text-slate-300"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* MAIN CONTENT CANVAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={36} className="animate-spin text-indigo-500" />
            <p className="text-sm font-medium opacity-60">Synchronizing database state...</p>
          </div>
        ) : (
          <>
            {/* ---------------- DASHBOARD TAB ---------------- */}
            {tab === "dashboard" && (
              <div className="space-y-8 animate-fadeIn">
                {/* HERO BANNER */}
                <div className={`${glass} rounded-3xl p-6 sm:p-10 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Sparkles size={14} />
                      System Overview
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                      Welcome back, Admin 👋
                    </h2>
                    <p className="text-sm sm:text-base opacity-70 leading-relaxed">
                      Monitor platform statistics, manage active member accounts, and issue global announcements seamlessly.
                    </p>
                  </div>
                </div>

                {/* KPI METRICS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Hostels",
                      value: stats.totalHostels,
                      icon: Building2,
                      color: "from-blue-500/20 to-indigo-500/20 text-blue-500",
                    },
                    {
                      label: "Total Registered",
                      value: stats.totalUsers,
                      icon: Users,
                      color: "from-purple-500/20 to-fuchsia-500/20 text-purple-500",
                    },
                    {
                      label: "Active Users",
                      value: stats.activeUsers,
                      icon: UserCheck,
                      color: "from-emerald-500/20 to-teal-500/20 text-emerald-500",
                    },
                    {
                      label: "Banned Accounts",
                      value: stats.bannedUsers,
                      icon: UserX,
                      color: "from-red-500/20 to-rose-500/20 text-rose-500",
                    },
                  ].map((card, i) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={i} className={`${glass} rounded-3xl p-6 flex flex-col justify-between space-y-4`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium opacity-70">{card.label}</span>
                          <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${card.color}`}>
                            <CardIcon size={20} />
                          </div>
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{card.value}</h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- USERS TAB ---------------- */}
            {tab === "users" && (
              <div className="space-y-6 animate-fadeIn">
                {/* SEARCH FILTER */}
                <div className={`${glass} rounded-2xl p-3 sm:p-4`}>
                  <div className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 ${innerCard}`}>
                    <Search size={18} className="opacity-50 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-transparent w-full text-sm outline-none placeholder:opacity-50"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="opacity-50 hover:opacity-100">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* EMPTY STATE */}
                {filteredUsers.length === 0 ? (
                  <div className={`${glass} rounded-3xl p-12 text-center space-y-3`}>
                    <Users className="mx-auto opacity-30" size={48} />
                    <h3 className="text-lg font-bold">No accounts matched your search</h3>
                    <p className="text-sm opacity-60 max-w-sm mx-auto">
                      Try updating your search query or clear filters to locate member profiles.
                    </p>
                  </div>
                ) : (
                  /* USERS CARD GRID */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredUsers.map((u) => {
                      const displayName = u.username || u.name || u.displayName || "Anonymous User";
                      const isBanned = Boolean(u.banned);
                      const isActioning = actionLoadingId === u.id;

                      return (
                        <div key={u.id} className={`${glass} rounded-3xl p-5 flex flex-col justify-between space-y-5 hover:border-slate-500/30 transition`}>
                          {/* HEADER & AVATAR */}
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="h-12 w-12 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-inner">
                                  {u.photo || u.photoURL ? (
                                    <img src={u.photo || u.photoURL} alt={displayName} className="h-full w-full object-cover" />
                                  ) : (
                                    displayName[0]?.toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-bold text-base truncate leading-snug">{displayName}</h3>
                                  <p className="text-xs opacity-60 truncate">{u.email || "No email address"}</p>
                                </div>
                              </div>

                              {/* STATUS PILL */}
                              <span
                                className={`shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                                  isBanned
                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                }`}
                              >
                                {isBanned ? <Ban size={12} /> : <Check size={12} />}
                                {isBanned ? "Banned" : "Active"}
                              </span>
                            </div>

                            {/* DETAILS GRID */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className={`p-3 rounded-2xl ${innerCard}`}>
                                <span className="opacity-60 block text-[10px] uppercase tracking-wider font-semibold">Role</span>
                                <span className="font-bold capitalize text-sm mt-0.5 block truncate">{u.role || "Student"}</span>
                              </div>
                              <div className={`p-3 rounded-2xl ${innerCard}`}>
                                <span className="opacity-60 block text-[10px] uppercase tracking-wider font-semibold">Plan</span>
                                <span className="font-bold capitalize text-sm mt-0.5 block truncate">
                                  {u.plan || (u.premium ? "Premium" : "Free")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ACTION BUTTON */}
                          <button
                            onClick={() => toggleBanUser(u)}
                            disabled={isActioning}
                            className={`w-full py-2.5 px-4 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                              isBanned
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                                : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                            } disabled:opacity-50`}
                          >
                            {isActioning ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <>
                                <Ban size={15} />
                                {isBanned ? "Unban Account" : "Ban Account"}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- ANNOUNCEMENTS TAB ---------------- */}
            {tab === "announcements" && (
              <div className="animate-fadeIn">
                <AdminAnnouncements dark={dark} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}