import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  Ban,
  BookOpenCheck,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Database,
  FileText,
  Gift,
  GraduationCap,
  Headphones,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  MoreHorizontal,
  Newspaper,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sticker,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import useAdmin from "../hooks/useAdmin";
import { auth, db } from "../../firebase/config";
import { deleteJson, getJson, patchJson, postJson, putJson } from "../../services/api";

const ADMIN_EMAILS = ["onakomayaokiki@gmail.com", "iadejuwon77@gmail.com"];

const cx = (...classes) => classes.filter(Boolean).join(" ");

const navSections = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "premium", label: "Premium", icon: Star },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "pastQuestions", label: "Past Questions", icon: BookOpenCheck },
      { id: "campusNews", label: "Campus News", icon: Newspaper },
      { id: "announcements", label: "Announcements", icon: Megaphone },
      { id: "mediaSources", label: "Media Sources", icon: Sparkles },
      { id: "academicData", label: "Universities", icon: GraduationCap },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { id: "marketplace", label: "Student Marketplace", icon: Package },
      { id: "hostels", label: "Hostels", icon: Home },
    ],
  },
  {
    label: "Support",
    items: [
      { id: "contact", label: "Contact Messages", icon: Headphones },
      { id: "reports", label: "Reports", icon: AlertCircle },
      { id: "suggestions", label: "Suggestions", icon: ClipboardList },
    ],
  },
  {
    label: "Growth",
    items: [
      { id: "promos", label: "Promo Spotlights", icon: BadgeCheck },
      { id: "streakRewards", label: "Streak Rewards", icon: Gift },
      { id: "stickers", label: "Stickers", icon: Sticker },
    ],
  },
  {
    label: "System",
    items: [{ id: "access", label: "Access Info", icon: Settings }],
  },
];

const pageMeta = navSections
  .flatMap((section) => section.items.map((item) => ({ ...item, section: section.label })))
  .reduce((map, item) => ({ ...map, [item.id]: item }), {});

const supportConfigs = {
  contact: {
    route: "contact",
    collection: "contactMessages",
    title: "Contact Messages",
    subtitle: "Review direct support messages from students.",
    titleField: "subject",
    userField: "name",
    previewField: "message",
  },
  reports: {
    route: "reports",
    collection: "reports",
    title: "Reports",
    subtitle: "Investigate reports submitted across UniHelp.",
    titleField: "title",
    userField: "display_name",
    previewField: "description",
  },
  suggestions: {
    route: "suggestions",
    collection: "suggestions",
    title: "Suggestions",
    subtitle: "Triage product and campus experience suggestions.",
    titleField: "title",
    userField: "category",
    previewField: "description",
  },
};

const statusOptions = ["all", "pending", "in_progress", "resolved", "closed"];

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return "Not set";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `₦${n.toLocaleString()}`;
};

const firstImage = (item = {}) => {
  const candidates = [
    item.image,
    item.imageUrl,
    item.coverUrl,
    item.photoUrl,
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.imageAssets) ? item.imageAssets.map((asset) => asset.url || asset.secure_url) : []),
  ].filter(Boolean);
  return candidates[0] || "";
};

const isPremiumUser = (user = {}) => {
  const activeExpiry = [user.subscriptionExpiresAt, user.premiumExpiresAt, user.expiresAt]
    .map(toDate)
    .filter((date) => date && date.getTime() > Date.now());
  return Boolean(user.premium || activeExpiry.length);
};

const normalizePaged = (data, pageSize = 20) => {
  const items = data.items || data.data || [];
  const total = Number(data.total || items.length || 0);
  const offset = Number(data.offset || 0);
  return { items, total, hasMore: Boolean(data.hasMore ?? offset + items.length < total) };
};

function useAdminData() {
  const [state, setState] = useState({
    users: [],
    announcements: [],
    marketingSources: [],
    universities: [],
    departments: [],
    promoSpotlights: [],
    promoStats: {},
    marketplace: [],
    hostels: [],
    pastQuestions: [],
    support: { contact: [], reports: [], suggestions: [] },
    stickers: { packs: [], stickers: [] },
    streakMilestones: [],
    loading: true,
    error: "",
  });

  const fetchCollection = useCallback(async (name, constraints = []) => {
    try {
      const snap = await getDocs(query(collection(db, name), ...constraints));
      return snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    } catch (error) {
      console.warn(`[admin] ${name} load failed`, error);
      return [];
    }
  }, []);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const [
        users,
        announcements,
        marketingSources,
        universities,
        departments,
        promoSpotlights,
        marketplaceResponse,
        hostelsResponse,
        pastQuestionsResponse,
        contactResponse,
        reportsResponse,
        suggestionsResponse,
        streakResponse,
        packsResponse,
        stickersResponse,
      ] = await Promise.all([
        fetchCollection("users"),
        fetchCollection("announcements", [orderBy("createdAt", "desc"), limit(80)]),
        fetchCollection("marketingSources", [orderBy("createdAt", "desc")]),
        fetchCollection("universities", [orderBy("name"), limit(120)]),
        fetchCollection("departments", [orderBy("name"), limit(160)]),
        fetchCollection("promoSpotlights"),
        getJson("/api/marketplace?limit=50").catch((error) => ({ error })),
        getJson("/api/hostels?limit=50").catch((error) => ({ error })),
        getJson("/api/past-questions?limit=100").catch((error) => ({ error })),
        getJson("/api/contact?limit=20&sortField=created_at&sortDirection=desc").catch((error) => ({ error })),
        getJson("/api/reports?limit=20&sortField=created_at&sortDirection=desc").catch((error) => ({ error })),
        getJson("/api/suggestions?limit=20&sortField=created_at&sortDirection=desc").catch((error) => ({ error })),
        getJson("/api/streak/admin/config").catch((error) => ({ error })),
        getJson("/api/stickers/packs").catch((error) => ({ error })),
        getJson("/api/stickers").catch((error) => ({ error })),
      ]);

      let promoStats = {};
      if (promoSpotlights.length) {
        const promoIds = promoSpotlights.map((item) => item.id);
        const chunks = [];
        for (let index = 0; index < promoIds.length; index += 30) chunks.push(promoIds.slice(index, index + 30));
        const eventSnaps = await Promise.all(
          chunks.map((chunk) =>
            getDocs(query(collection(db, "promoSpotlightEvents"), limit(500))).catch(() => ({ docs: [] }))
              .then((snap) => ({
                docs: snap.docs.filter((entry) => chunk.includes(entry.data()?.promoId)),
              }))
          )
        );
        promoStats = eventSnaps.reduce((stats, snap) => {
          snap.docs.forEach((entry) => {
            const event = entry.data();
            const current = stats[event.promoId] || { impressions: 0, clicks: 0, dismissals: 0, ctr: 0 };
            if (event.eventType === "promo_impression") current.impressions += 1;
            if (event.eventType === "promo_click") current.clicks += 1;
            if (event.eventType === "promo_dismiss") current.dismissals += 1;
            current.ctr = current.impressions ? Math.round((current.clicks / current.impressions) * 1000) / 10 : 0;
            stats[event.promoId] = current;
          });
          return stats;
        }, {});
      }

      setState({
        users,
        announcements,
        marketingSources,
        universities,
        departments,
        promoSpotlights: promoSpotlights.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0)),
        promoStats,
        marketplace: marketplaceResponse.error ? [] : normalizePaged(marketplaceResponse).items,
        hostels: hostelsResponse.error ? [] : normalizePaged(hostelsResponse).items,
        pastQuestions: pastQuestionsResponse.error ? [] : pastQuestionsResponse.items || [],
        support: {
          contact: contactResponse.error ? [] : normalizePaged(contactResponse).items,
          reports: reportsResponse.error ? [] : normalizePaged(reportsResponse).items,
          suggestions: suggestionsResponse.error ? [] : normalizePaged(suggestionsResponse).items,
        },
        stickers: {
          packs: packsResponse.error ? [] : packsResponse.data || [],
          stickers: stickersResponse.error ? [] : stickersResponse.data || [],
        },
        streakMilestones: streakResponse.error ? [] : streakResponse.data || [],
        loading: false,
        error: "",
      });
    } catch (error) {
      console.error("[admin] dashboard load failed", error);
      setState((current) => ({ ...current, loading: false, error: error.message || "Unable to load admin data" }));
    }
  }, [fetchCollection]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export default function AdminPanel({ dark }) {
  const isAdmin = useAdmin();
  const data = useAdminData();
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const page = pageMeta[activePage] || pageMeta.dashboard;
  const isDark = Boolean(dark);

  if (!auth.currentUser) {
    return <AuthState dark={isDark} title="Authentication required" text="Please sign in before opening the admin panel." />;
  }

  if (isAdmin === null) {
    return <AuthState dark={isDark} title="Checking admin access" text="Verifying your UniHelp admin credentials." loading />;
  }

  if (!isAdmin) {
    return <AuthState dark={isDark} title="Access denied" text="This workspace is reserved for UniHelp administrators." danger />;
  }

  return (
    <div className={cx("min-h-screen", isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-950")}>
      <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
        <AdminSidebar
          activePage={activePage}
          setActivePage={setActivePage}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          dark={isDark}
        />
        <div className="min-w-0">
          <AdminHeader
            page={page}
            dark={isDark}
            search={globalSearch}
            setSearch={setGlobalSearch}
            onMenu={() => setSidebarOpen(true)}
            onRefresh={data.reload}
          />
          <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
            {data.error ? (
              <ErrorState title="Admin data could not load" message={data.error} onRetry={data.reload} />
            ) : (
              <AdminPage activePage={activePage} data={data} search={globalSearch} dark={isDark} reload={data.reload} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function AuthState({ dark, title, text, loading = false, danger = false }) {
  return (
    <div className={cx("min-h-screen flex items-center justify-center px-4", dark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-950")}>
      <div className={cx("w-full max-w-md rounded-2xl border p-8 text-center shadow-sm", dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
        {loading ? <Loader2 className="mx-auto mb-4 animate-spin text-indigo-500" size={34} /> : <ShieldCheck className={cx("mx-auto mb-4", danger ? "text-rose-500" : "text-indigo-500")} size={38} />}
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm opacity-70">{text}</p>
      </div>
    </div>
  );
}

function AdminSidebar({ activePage, setActivePage, open, setOpen, dark }) {
  const content = (
    <div className={cx("flex h-full flex-col border-r", dark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
      <div className="flex h-16 items-center gap-3 border-b border-inherit px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="text-sm font-bold">UniHelp Admin</div>
          <div className="text-xs opacity-60">Control workspace</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider opacity-50">{section.label}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePage(item.id);
                      setOpen(false);
                    }}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      active
                        ? "bg-indigo-600 text-white"
                        : dark
                          ? "text-slate-300 hover:bg-slate-900 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    )}
                  >
                    <Icon size={17} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-inherit p-3">
        <button
          type="button"
          onClick={() => signOut(auth)}
          className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold", dark ? "text-slate-300 hover:bg-slate-900" : "text-slate-700 hover:bg-slate-100")}
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen lg:sticky lg:top-0 lg:block">{content}</aside>
      {open ? (
        <div className="fixed inset-0 z-[600] lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50" aria-label="Close admin navigation" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[86vw] max-w-80">{content}</aside>
        </div>
      ) : null}
    </>
  );
}

function AdminHeader({ page, dark, search, setSearch, onMenu, onRefresh }) {
  const displayName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Admin";
  return (
    <header className={cx("sticky top-0 z-40 border-b backdrop-blur", dark ? "border-slate-800 bg-slate-950/90" : "border-slate-200 bg-white/90")}>
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button className="rounded-lg p-2 hover:bg-slate-500/10 lg:hidden" onClick={onMenu} aria-label="Open admin navigation">
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">{page.section}</div>
          <h1 className="truncate text-lg font-semibold">{page.label}</h1>
        </div>
        <label className={cx("hidden min-w-72 items-center gap-2 rounded-xl border px-3 py-2 md:flex", dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50")}>
          <Search size={16} className="opacity-50" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search current admin data"
            className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
          />
        </label>
        <button type="button" onClick={onRefresh} className="rounded-xl border border-slate-500/20 p-2 hover:bg-slate-500/10" aria-label="Refresh admin data">
          <RefreshCw size={17} />
        </button>
        <div className="hidden items-center gap-2 rounded-xl border border-slate-500/20 px-3 py-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="max-w-36 truncate text-sm font-semibold">{displayName}</div>
          <ChevronDown size={14} className="opacity-50" />
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <label className={cx("flex items-center gap-2 rounded-xl border px-3 py-2", dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50")}>
          <Search size={16} className="opacity-50" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>
    </header>
  );
}

function AdminPage({ activePage, data, search, dark, reload }) {
  if (data.loading) return <LoadingSkeleton />;
  if (activePage === "dashboard") return <Dashboard data={data} search={search} setPage={() => {}} />;
  if (activePage === "users") return <UsersPage data={data} search={search} reload={reload} />;
  if (activePage === "premium") return <UsersPage data={data} search={search} reload={reload} premiumOnly />;
  if (activePage === "marketplace") return <ListingsPage type="marketplace" data={data} search={search} reload={reload} />;
  if (activePage === "hostels") return <ListingsPage type="hostels" data={data} search={search} reload={reload} />;
  if (["contact", "reports", "suggestions"].includes(activePage)) return <SupportPage kind={activePage} data={data} search={search} reload={reload} />;
  if (activePage === "announcements") return <AnnouncementsPage mode="announcements" data={data} search={search} reload={reload} />;
  if (activePage === "campusNews") return <AnnouncementsPage mode="news" data={data} search={search} reload={reload} />;
  if (activePage === "promos") return <PromosPage data={data} search={search} reload={reload} />;
  if (activePage === "mediaSources") return <MediaSourcesPage data={data} search={search} reload={reload} />;
  if (activePage === "academicData") return <AcademicDataPage data={data} search={search} reload={reload} />;
  if (activePage === "streakRewards") return <StreakRewardsPage data={data} reload={reload} />;
  if (activePage === "stickers") return <StickersPage data={data} reload={reload} />;
  if (activePage === "pastQuestions") return <PastQuestionsPage data={data} search={search} reload={reload} />;
  if (activePage === "access") return <AccessPage dark={dark} />;
  return <EmptyState title="Page not found" text="This admin section is not available." />;
}

function Dashboard({ data }) {
  const totalUsers = data.users.length;
  const blockedUsers = data.users.filter((user) => user.blocked || user.banned).length;
  const premiumUsers = data.users.filter(isPremiumUser).length;
  const pastQuestionDrafts = data.pastQuestions.filter((item) => item.status !== "published").length;
  const supportOpen = ["contact", "reports", "suggestions"].reduce(
    (sum, key) => sum + data.support[key].filter((item) => !["resolved", "closed"].includes(item.status)).length,
    0
  );

  const metrics = [
    { label: "Users", value: totalUsers, detail: `${blockedUsers} blocked or banned`, icon: Users },
    { label: "Premium", value: premiumUsers, detail: "Active or marked premium", icon: Star },
    { label: "Listings", value: data.marketplace.length + data.hostels.length, detail: "Marketplace and hostels", icon: Package },
    { label: "Past Questions", value: data.pastQuestions.length, detail: `${pastQuestionDrafts} drafts or review`, icon: BookOpenCheck },
    { label: "Support Open", value: supportOpen, detail: "Contact, reports, suggestions", icon: Headphones },
    { label: "Promos", value: data.promoSpotlights.length, detail: "Configured campaigns", icon: BadgeCheck },
  ];

  const recent = [
    ...data.announcements.slice(0, 4).map((item) => ({ type: "Announcement", title: item.title, meta: item.category, date: item.createdAt })),
    ...data.pastQuestions.slice(0, 4).map((item) => ({ type: "Past Question", title: item.title, meta: item.status, date: item.updatedAt || item.createdAt })),
    ...data.support.reports.slice(0, 3).map((item) => ({ type: "Report", title: item.title || item.report_type, meta: item.status, date: item.created_at })),
  ]
    .sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Overview" title="Admin dashboard" subtitle="Live operational summary from existing UniHelp data sources." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <SectionCard title="Content status" subtitle="Past-question and content queues">
          <div className="grid gap-3 sm:grid-cols-3">
            <QueueStat label="Published papers" value={data.pastQuestions.filter((item) => item.status === "published").length} />
            <QueueStat label="Draft papers" value={pastQuestionDrafts} />
            <QueueStat label="Manual review" value={data.pastQuestions.filter((item) => /manual|blocked|failed/i.test(item.processing?.status || item.processingStatus || "")).length} />
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-500/15">
            <DataTable
              columns={["Document", "Course", "Status", "Updated"]}
              rows={data.pastQuestions.slice(0, 6).map((item) => [
                item.title || "Untitled",
                item.courseCode || item.courseTitle || "Not set",
                <StatusBadge key="status" value={item.status || "draft"} />,
                formatDate(item.updatedAt || item.createdAt),
              ])}
              empty="No past-question documents found."
            />
          </div>
        </SectionCard>
        <SectionCard title="Recent activity" subtitle="Latest admin-relevant records">
          <div className="space-y-3">
            {recent.length ? recent.map((item, index) => (
              <div key={`${item.type}-${index}`} className="flex gap-3 rounded-xl border border-slate-500/15 p-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-wide text-indigo-500">{item.type}</div>
                  <div className="truncate text-sm font-semibold">{item.title || "Untitled"}</div>
                  <div className="text-xs opacity-60">{item.meta || "No status"} - {formatDateTime(item.date)}</div>
                </div>
              </div>
            )) : <EmptyState title="No recent records" text="Recent admin activity will appear here as data is created." compact />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function UsersPage({ data, search, reload, premiumOnly = false }) {
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [confirmPremium, setConfirmPremium] = useState(null);

  const users = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.users
      .filter((user) => !premiumOnly || isPremiumUser(user))
      .filter((user) => {
        if (filter === "blocked") return user.blocked || user.banned;
        if (filter === "premium") return isPremiumUser(user);
        if (filter === "admins") return user.admin === true || user.role === "admin";
        return true;
      })
      .filter((user) => {
        if (!term) return true;
        return [user.username, user.name, user.displayName, user.email, user.role, user.school].filter(Boolean).some((field) => String(field).toLowerCase().includes(term));
      });
  }, [data.users, filter, premiumOnly, search]);

  const toggleBlocked = async (user) => {
    const uid = user.uid || user.id;
    if (!uid) return;
    setBusy(uid);
    try {
      await setDoc(doc(db, "users", uid), {
        blocked: !(user.blocked || user.banned),
        banned: false,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await reload();
    } finally {
      setBusy("");
    }
  };

  const grantPremium = async (user) => {
    const uid = user.uid || user.id;
    if (!uid) return;
    setBusy(`premium-${uid}`);
    try {
      await postJson(`/api/users/${encodeURIComponent(uid)}/premium-trial`, {});
      setConfirmPremium(null);
      await reload();
    } finally {
      setBusy("");
    }
  };

  const syncPremium = async (user) => {
    const uid = user.uid || user.id;
    if (!uid) return;
    setBusy(`sync-${uid}`);
    try {
      await postJson(`/api/users/${encodeURIComponent(uid)}/sync-premium-expiry`, {});
      await reload();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title={premiumOnly ? "Premium access" : "Users"}
        subtitle={premiumOnly ? "Grant and synchronize Premium access using the existing backend." : "Manage user status, Premium grants, and admin accounts."}
      />
      <FilterBar value={filter} onChange={setFilter} options={["all", "premium", "blocked", "admins"]} />
      <ResponsiveTable
        columns={["User", "Email", "Status", "Premium", "Role", "Actions"]}
        rows={users.map((user) => {
          const uid = user.uid || user.id;
          const blocked = Boolean(user.blocked || user.banned);
          const premium = isPremiumUser(user);
          return {
            key: uid,
            cells: [
              <UserCell key="user" user={user} />,
              user.email || "No email",
              <StatusBadge key="status" value={blocked ? "blocked" : "active"} />,
              <StatusBadge key="premium" value={premium ? "premium" : "free"} />,
              user.admin ? "Admin" : user.role || "Student",
              <div key="actions" className="flex flex-wrap gap-2">
                <ActionButton danger={!blocked} onClick={() => toggleBlocked(user)} busy={busy === uid}>
                  {blocked ? "Unblock" : "Block"}
                </ActionButton>
                <ActionButton onClick={() => setConfirmPremium(user)} busy={busy === `premium-${uid}`}>Grant Premium</ActionButton>
                {premium ? <ActionButton onClick={() => syncPremium(user)} busy={busy === `sync-${uid}`}>Sync Expiry</ActionButton> : null}
              </div>,
            ],
          };
        })}
        empty="No users match the current filters."
      />
      <ConfirmModal
        open={Boolean(confirmPremium)}
        title="Grant Premium access?"
        text={`${confirmPremium?.username || confirmPremium?.email || "This user"} will receive the existing admin Premium gift.`}
        confirmLabel="Grant access"
        busy={busy.startsWith("premium-")}
        onCancel={() => setConfirmPremium(null)}
        onConfirm={() => grantPremium(confirmPremium)}
      />
    </div>
  );
}

function ListingsPage({ type, data, search, reload }) {
  const [busy, setBusy] = useState("");
  const [selected, setSelected] = useState(null);
  const items = type === "marketplace" ? data.marketplace : data.hostels;
  const endpoint = type === "marketplace" ? "/api/marketplace" : "/api/hostels";
  const label = type === "marketplace" ? "Student Marketplace" : "Hostels";
  const filtered = items.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.title, item.name, item.category, item.location, item.sellerName, item.ownerName].filter(Boolean).some((field) => String(field).toLowerCase().includes(term));
  });

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name || "this listing"}"? Cloudinary cleanup will be handled by the existing backend route.`)) return;
    setBusy(item.id);
    try {
      await deleteJson(`${endpoint}/${encodeURIComponent(item.id)}`);
      await reload();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Marketplace" title={label} subtitle="Moderate listings using the existing PostgreSQL and Cloudinary cleanup routes." />
      <ResponsiveTable
        columns={["Listing", "Owner", "Price", "Location", "Status", "Actions"]}
        rows={filtered.map((item) => ({
          key: item.id,
          cells: [
            <ListingCell key="listing" item={item} />,
            item.sellerName || item.ownerName || item.userId || item.ownerId || "Unknown",
            money(item.price) || "Not set",
            item.location || item.category || "Not set",
            <StatusBadge key="status" value={item.status || "listed"} />,
            <div key="actions" className="flex gap-2">
              <ActionButton onClick={() => setSelected(item)}>View</ActionButton>
              <ActionButton danger onClick={() => remove(item)} busy={busy === item.id}>Delete</ActionButton>
            </div>,
          ],
        }))}
        empty={`No ${label.toLowerCase()} records found.`}
      />
      <DetailModal open={Boolean(selected)} title={selected?.title || selected?.name || "Listing"} onClose={() => setSelected(null)}>
        {selected ? <ListingDetails item={selected} /> : null}
      </DetailModal>
    </div>
  );
}

function SupportPage({ kind, data, search, reload }) {
  const config = supportConfigs[kind];
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState("");
  const items = data.support[kind] || [];
  const filtered = items
    .filter((item) => status === "all" || item.status === status)
    .filter((item) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return [item[config.titleField], item[config.previewField], item.email, item[config.userField], item.status].filter(Boolean).some((field) => String(field).toLowerCase().includes(term));
    });

  const openDetail = async (item) => {
    setSelected(item);
    try {
      const res = await getJson(`/api/${config.route}/${encodeURIComponent(item.id)}/notes`);
      setNotes(res.notes || res.data || (Array.isArray(res) ? res : []));
    } catch {
      setNotes([]);
    }
  };

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    setBusy("status");
    try {
      await patchJson(`/api/${config.route}/${encodeURIComponent(selected.id)}/status`, { status: nextStatus });
      setSelected((current) => ({ ...current, status: nextStatus }));
      await reload();
    } finally {
      setBusy("");
    }
  };

  const addNote = async () => {
    if (!selected || !noteText.trim()) return;
    setBusy("note");
    try {
      await postJson(`/api/${config.route}/${encodeURIComponent(selected.id)}/notes`, { note: noteText.trim() });
      setNoteText("");
      const res = await getJson(`/api/${config.route}/${encodeURIComponent(selected.id)}/notes`);
      setNotes(res.notes || res.data || (Array.isArray(res) ? res : []));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Support" title={config.title} subtitle={config.subtitle} />
      <FilterBar value={status} onChange={setStatus} options={statusOptions} />
      <ResponsiveTable
        columns={["Request", "User", "Status", "Created", "Actions"]}
        rows={filtered.map((item) => ({
          key: item.id,
          cells: [
            <div key="request" className="min-w-0">
              <div className="font-semibold">{item[config.titleField] || item.report_type || "Untitled"}</div>
              <div className="line-clamp-1 text-xs opacity-60">{item[config.previewField] || "No preview"}</div>
            </div>,
            item[config.userField] || item.email || item.user_id || "Unknown",
            <StatusBadge key="status" value={item.status || "pending"} />,
            formatDate(item.created_at || item.createdAt),
            <ActionButton key="action" onClick={() => openDetail(item)}>View</ActionButton>,
          ],
        }))}
        empty={`No ${config.title.toLowerCase()} found.`}
      />
      <DetailModal open={Boolean(selected)} title={selected?.[config.titleField] || "Support item"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-500/15 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide opacity-50">Details</div>
              <p className="whitespace-pre-line text-sm">{selected[config.previewField] || selected.message || selected.description || "No message body."}</p>
              <div className="mt-3 text-xs opacity-60">{selected.email || selected.user_id || "No contact info"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.filter((item) => item !== "all").map((option) => (
                <ActionButton key={option} onClick={() => updateStatus(option)} busy={busy === "status"}>{option.replace("_", " ")}</ActionButton>
              ))}
            </div>
            <div className="space-y-3">
              <div className="font-semibold">Admin notes</div>
              {notes.length ? notes.map((note) => (
                <div key={note.id} className="rounded-xl border border-slate-500/15 p-3 text-sm">
                  <div className="mb-1 text-xs font-semibold text-indigo-500">{note.admin_name || note.adminName || "Admin"} - {formatDateTime(note.created_at || note.createdAt)}</div>
                  {note.note}
                </div>
              )) : <p className="text-sm opacity-60">No notes yet.</p>}
              <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-500/20 bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Add an internal note" />
              <ActionButton onClick={addNote} busy={busy === "note"}>Add note</ActionButton>
            </div>
          </div>
        ) : null}
      </DetailModal>
    </div>
  );
}

function AnnouncementsPage({ mode, data, search, reload }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: mode === "news" ? "Campus News" : "General",
    badge: "Update",
    image: "",
    pinned: false,
    published: true,
    expiresIn: "24",
  });

  const isNews = mode === "news";
  const title = isNews ? "Campus News" : "Announcements";
  const filtered = data.announcements.filter((item) => {
    const term = search.trim().toLowerCase();
    if (isNews && item.message && !item.body && !item.description && !item.image) return false;
    if (!term) return true;
    return [item.title, item.body, item.description, item.message, item.category].filter(Boolean).some((field) => String(field).toLowerCase().includes(term));
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", body: "", category: isNews ? "Campus News" : "General", badge: "Update", image: "", pinned: false, published: true, expiresIn: "24" });
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      body: item.body || item.description || item.message || "",
      category: item.category || (isNews ? "Campus News" : "General"),
      badge: item.badge || "Update",
      image: item.image || item.imageUrl || "",
      pinned: item.pinned === true,
      published: item.published !== false,
      expiresIn: item.expiresIn || "24",
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setBusy(true);
    try {
      const hours = Number(form.expiresIn) || 24;
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        description: form.body.trim(),
        message: form.body.trim(),
        category: form.category,
        badge: form.badge,
        image: form.image,
        pinned: form.pinned,
        published: form.published,
        updatedAt: serverTimestamp(),
        ...(isNews ? { source: "Unihelp Admin", authorName: auth.currentUser?.displayName || "Admin" } : {}),
      };
      if (!isNews) {
        payload.expiresIn = form.expiresIn;
        payload.expiresAt = Timestamp.fromDate(new Date(Date.now() + hours * 60 * 60 * 1000));
      }
      if (editing?.id) {
        await updateDoc(doc(db, "announcements", editing.id), payload);
      } else {
        const ref = await addDoc(collection(db, "announcements"), { ...payload, views: 0, createdAt: serverTimestamp(), authorId: auth.currentUser?.uid || "" });
        if (!isNews) {
          postJson("/api/notifications/broadcast", {
            title: form.title,
            body: form.body,
            category: form.category,
            announcementId: ref.id,
            url: "/announcements",
          }).catch((error) => console.warn("Notification broadcast failed", error));
        }
      }
      setFormOpen(false);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || "this item"}"?`)) return;
    await deleteDoc(doc(db, "announcements", item.id));
    await reload();
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Content" title={title} subtitle={isNews ? "Publish news items with visibility and image metadata." : "Create campus-wide announcements and broadcast notifications."}>
        <ActionButton onClick={openCreate}><Plus size={14} /> Create</ActionButton>
      </PageHeader>
      <ResponsiveTable
        columns={["Title", "Category", "Status", "Pinned", "Created", "Actions"]}
        rows={filtered.map((item) => ({
          key: item.id,
          cells: [
            <div key="title" className="min-w-0">
              <div className="font-semibold">{item.title || "Untitled"}</div>
              <div className="line-clamp-1 text-xs opacity-60">{item.body || item.description || item.message || "No body"}</div>
            </div>,
            item.category || "General",
            <StatusBadge key="status" value={item.published === false ? "hidden" : "published"} />,
            item.pinned ? "Pinned" : "No",
            formatDate(item.createdAt),
            <div key="actions" className="flex gap-2">
              <ActionButton onClick={() => openEdit(item)}>Edit</ActionButton>
              <ActionButton danger onClick={() => remove(item)}>Delete</ActionButton>
            </div>,
          ],
        }))}
        empty={`No ${title.toLowerCase()} found.`}
      />
      <AdminModal open={formOpen} title={editing ? `Edit ${title}` : `Create ${title}`} onClose={() => setFormOpen(false)}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={(titleValue) => setForm((current) => ({ ...current, title: titleValue }))} />
          <FormField label="Body" value={form.body} textarea onChange={(body) => setForm((current) => ({ ...current, body }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Category" value={form.category} onChange={(category) => setForm((current) => ({ ...current, category }))} />
            <FormField label="Badge" value={form.badge} onChange={(badge) => setForm((current) => ({ ...current, badge }))} />
          </div>
          {isNews ? <FormField label="Image URL" value={form.image} onChange={(image) => setForm((current) => ({ ...current, image }))} /> : <FormField label="Auto delete hours" value={form.expiresIn} onChange={(expiresIn) => setForm((current) => ({ ...current, expiresIn }))} />}
          <div className="flex flex-wrap gap-2">
            <ToggleButton active={form.pinned} onClick={() => setForm((current) => ({ ...current, pinned: !current.pinned }))}>Pinned</ToggleButton>
            <ToggleButton active={form.published} onClick={() => setForm((current) => ({ ...current, published: !current.published }))}>Published</ToggleButton>
          </div>
          <ActionButton onClick={save} busy={busy}><Save size={14} /> Save</ActionButton>
        </div>
      </AdminModal>
    </div>
  );
}

function PromosPage({ data, search, reload }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", actionType: "none", actionUrl: "", enabled: true, priority: "0" });
  const filtered = data.promoSpotlights.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.title, item.description, item.type, item.advertiserName].filter(Boolean).some((field) => String(field).toLowerCase().includes(term));
  });

  const openEdit = (item = null) => {
    setEditing(item);
    setForm(item ? { ...form, ...item, priority: String(item.priority || 0) } : { title: "", description: "", imageUrl: "", actionType: "none", actionUrl: "", enabled: true, priority: "0" });
    setFormOpen(true);
  };

  const save = async () => {
    const payload = {
      type: editing?.type || "announcement",
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      actionType: form.actionType || "none",
      actionUrl: form.actionUrl.trim(),
      enabled: form.enabled === true,
      priority: Number(form.priority) || 0,
      updatedBy: auth.currentUser?.uid || "",
      updatedAt: serverTimestamp(),
    };
    if (editing?.id) await updateDoc(doc(db, "promoSpotlights", editing.id), payload);
    else await addDoc(collection(db, "promoSpotlights"), { ...payload, createdBy: auth.currentUser?.uid || "", createdAt: serverTimestamp() });
    setFormOpen(false);
    await reload();
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || "this promotion"}"?`)) return;
    await deleteJson(`/api/media-cleanup/documents/promoSpotlights/${encodeURIComponent(item.id)}`);
    await reload();
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Growth" title="Promo Spotlights" subtitle="Manage existing promo campaigns and real event metrics.">
        <ActionButton onClick={() => openEdit()}><Plus size={14} /> Create</ActionButton>
      </PageHeader>
      <ResponsiveTable
        columns={["Campaign", "Status", "Impressions", "Clicks", "CTR", "Actions"]}
        rows={filtered.map((item) => {
          const stats = data.promoStats[item.id] || {};
          return {
            key: item.id,
            cells: [
              <ListingCell key="campaign" item={{ ...item, image: item.imageUrl }} />,
              <StatusBadge key="status" value={item.enabled ? "active" : "paused"} />,
              stats.impressions || 0,
              stats.clicks || 0,
              `${stats.ctr || 0}%`,
              <div key="actions" className="flex gap-2">
                <ActionButton onClick={() => openEdit(item)}>Edit</ActionButton>
                <ActionButton danger onClick={() => remove(item)}>Delete</ActionButton>
              </div>,
            ],
          };
        })}
        empty="No promo spotlights configured."
      />
      <AdminModal open={formOpen} title={editing ? "Edit promotion" : "Create promotion"} onClose={() => setFormOpen(false)}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={(title) => setForm((current) => ({ ...current, title }))} />
          <FormField label="Description" textarea value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} />
          <FormField label="Image URL" value={form.imageUrl} onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Action type" value={form.actionType} onChange={(actionType) => setForm((current) => ({ ...current, actionType }))} />
            <FormField label="Action URL" value={form.actionUrl} onChange={(actionUrl) => setForm((current) => ({ ...current, actionUrl }))} />
          </div>
          <FormField label="Priority" value={form.priority} onChange={(priority) => setForm((current) => ({ ...current, priority }))} />
          <ToggleButton active={form.enabled} onClick={() => setForm((current) => ({ ...current, enabled: !current.enabled }))}>Enabled</ToggleButton>
          <ActionButton onClick={save}>Save promotion</ActionButton>
        </div>
      </AdminModal>
    </div>
  );
}

function MediaSourcesPage({ data, search, reload }) {
  const [form, setForm] = useState({ name: "", category: "Media Partner", description: "", logoUrl: "", active: true });
  const [editing, setEditing] = useState(null);
  const filtered = data.marketingSources.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.name, item.category, item.description].filter(Boolean).some((field) => String(field).toLowerCase().includes(term));
  });
  const save = async () => {
    const payload = { ...form, name: form.name.trim(), updatedAt: serverTimestamp() };
    if (editing?.id) await updateDoc(doc(db, "marketingSources", editing.id), payload);
    else await addDoc(collection(db, "marketingSources"), { ...payload, createdAt: serverTimestamp() });
    setEditing(null);
    setForm({ name: "", category: "Media Partner", description: "", logoUrl: "", active: true });
    await reload();
  };
  const edit = (item) => {
    setEditing(item);
    setForm({ name: item.name || "", category: item.category || "Media Partner", description: item.description || "", logoUrl: item.logoUrl || "", active: item.active !== false });
  };
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <SectionCard title={editing ? "Edit media source" : "Add media source"} subtitle="Controls signup referral source options.">
        <div className="space-y-3">
          <FormField label="Name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
          <FormField label="Category" value={form.category} onChange={(category) => setForm((current) => ({ ...current, category }))} />
          <FormField label="Description" textarea value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} />
          <FormField label="Logo URL" value={form.logoUrl} onChange={(logoUrl) => setForm((current) => ({ ...current, logoUrl }))} />
          <ToggleButton active={form.active} onClick={() => setForm((current) => ({ ...current, active: !current.active }))}>Active</ToggleButton>
          <ActionButton onClick={save}>Save source</ActionButton>
        </div>
      </SectionCard>
      <SectionCard title="Marketing sources" subtitle={`${filtered.length} source records`}>
        <ResponsiveTable
          columns={["Source", "Category", "Status", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <ListingCell key="source" item={{ title: item.name, description: item.description, image: item.logoUrl }} />,
              item.category || "Media Partner",
              <StatusBadge key="status" value={item.active === false ? "inactive" : "active"} />,
              <div key="actions" className="flex gap-2">
                <ActionButton onClick={() => edit(item)}>Edit</ActionButton>
                <ActionButton danger onClick={async () => { if (window.confirm("Delete this media source?")) { await deleteDoc(doc(db, "marketingSources", item.id)); await reload(); } }}>Delete</ActionButton>
              </div>,
            ],
          }))}
          empty="No media sources found."
        />
      </SectionCard>
    </div>
  );
}

function AcademicDataPage({ data, search, reload }) {
  const [university, setUniversity] = useState({ name: "", shortName: "", state: "", country: "Nigeria" });
  const [department, setDepartment] = useState({ name: "", faculty: "", universityId: "" });
  const term = search.trim().toLowerCase();
  const universities = data.universities.filter((item) => !term || [item.name, item.shortName, item.state].filter(Boolean).some((field) => String(field).toLowerCase().includes(term)));
  const departments = data.departments.filter((item) => !term || [item.name, item.faculty, item.universityId].filter(Boolean).some((field) => String(field).toLowerCase().includes(term)));
  const addUniversity = async () => {
    if (!university.name.trim()) return;
    await addDoc(collection(db, "universities"), { ...university, name: university.name.trim(), createdAt: serverTimestamp() });
    setUniversity({ name: "", shortName: "", state: "", country: "Nigeria" });
    await reload();
  };
  const addDepartment = async () => {
    if (!department.name.trim() || !department.universityId.trim()) return;
    await addDoc(collection(db, "departments"), { ...department, name: department.name.trim(), createdAt: serverTimestamp() });
    setDepartment({ name: "", faculty: "", universityId: "" });
    await reload();
  };
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Content" title="Universities & Departments" subtitle="Manage academic lookup data used during signup and upload flows." />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Add university">
          <div className="space-y-3">
            <FormField label="Name" value={university.name} onChange={(name) => setUniversity((current) => ({ ...current, name }))} />
            <FormField label="Short name" value={university.shortName} onChange={(shortName) => setUniversity((current) => ({ ...current, shortName }))} />
            <FormField label="State" value={university.state} onChange={(state) => setUniversity((current) => ({ ...current, state }))} />
            <ActionButton onClick={addUniversity}>Add university</ActionButton>
          </div>
        </SectionCard>
        <SectionCard title="Add department">
          <div className="space-y-3">
            <FormField label="Name" value={department.name} onChange={(name) => setDepartment((current) => ({ ...current, name }))} />
            <FormField label="Faculty" value={department.faculty} onChange={(faculty) => setDepartment((current) => ({ ...current, faculty }))} />
            <FormField label="University document ID" value={department.universityId} onChange={(universityId) => setDepartment((current) => ({ ...current, universityId }))} />
            <ActionButton onClick={addDepartment}>Add department</ActionButton>
          </div>
        </SectionCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Universities" subtitle={`${universities.length} shown`}>
          <DataTable columns={["Name", "State", "ID"]} rows={universities.slice(0, 80).map((item) => [item.name, item.state || "Not set", item.id])} empty="No universities found." />
        </SectionCard>
        <SectionCard title="Departments" subtitle={`${departments.length} shown`}>
          <DataTable columns={["Name", "Faculty", "University ID"]} rows={departments.slice(0, 80).map((item) => [item.name, item.faculty || "Not set", item.universityId || "Not set"])} empty="No departments found." />
        </SectionCard>
      </div>
    </div>
  );
}

function StreakRewardsPage({ data, reload }) {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setJson(JSON.stringify(data.streakMilestones || [], null, 2));
  }, [data.streakMilestones]);
  const save = async () => {
    setBusy(true);
    try {
      const milestones = JSON.parse(json);
      await putJson("/api/streak/admin/config", { milestones });
      await reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Growth" title="Streak Rewards" subtitle="Configure the existing milestone reward structure." />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <SectionCard title="Milestone editor" subtitle="Uses the existing backend config schema.">
          <textarea value={json} onChange={(event) => setJson(event.target.value)} className="min-h-[460px] w-full rounded-xl border border-slate-500/20 bg-slate-950 p-4 font-mono text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="mt-3"><ActionButton onClick={save} busy={busy}>Save configuration</ActionButton></div>
        </SectionCard>
        <SectionCard title="Current milestones">
          <div className="space-y-3">
            {(data.streakMilestones || []).length ? data.streakMilestones.map((item, index) => (
              <div key={`${item.days}-${index}`} className="rounded-xl border border-slate-500/15 p-3">
                <div className="font-semibold">{item.days} day streak</div>
                <div className="mt-1 text-xs opacity-60">{item.enabled === false ? "Disabled" : "Enabled"} - {(item.rewards || []).length} reward(s)</div>
              </div>
            )) : <EmptyState title="No milestones loaded" text="The backend returned no streak reward configuration." compact />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function StickersPage({ data, reload }) {
  const [pack, setPack] = useState({ name: "", description: "" });
  const [selectedPackId, setSelectedPackId] = useState("");
  const [stickerName, setStickerName] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState("");
  const seed = async () => {
    setBusy("seed");
    try { await postJson("/api/stickers/admin/seed-defaults", {}); await reload(); } finally { setBusy(""); }
  };
  const createPack = async () => {
    if (!pack.name.trim()) return;
    setBusy("pack");
    try {
      const res = await postJson("/api/stickers/admin/packs", { name: pack.name.trim(), description: pack.description.trim(), isPremium: false });
      setSelectedPackId(res.data?.id || res.id || "");
      setPack({ name: "", description: "" });
      await reload();
    } finally { setBusy(""); }
  };
  const uploadSticker = async () => {
    if (!file || !selectedPackId) return;
    setBusy("upload");
    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${(import.meta.env.VITE_API_URL || "https://unihelp-backend-vdps.onrender.com").replace(/\/$/, "")}/api/stickers/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const upload = await response.json();
      if (!response.ok) throw new Error(upload.message || upload.error || "Sticker upload failed");
      const uploadData = upload.data || upload;
      await postJson("/api/stickers/admin/stickers", { uploadId: uploadData.uploadId, packId: selectedPackId, name: stickerName || "Official Sticker", isPremium: false });
      setFile(null);
      setStickerName("");
      await reload();
    } finally { setBusy(""); }
  };
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Growth" title="Sticker Management" subtitle="Manage official sticker packs and assets through the existing sticker API." />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <SectionCard title="Default free stickers">
            <p className="mb-3 text-sm opacity-70">Create or restore the built-in free reaction pack.</p>
            <ActionButton onClick={seed} busy={busy === "seed"}>Seed defaults</ActionButton>
          </SectionCard>
          <SectionCard title="Create official pack">
            <div className="space-y-3">
              <FormField label="Pack name" value={pack.name} onChange={(name) => setPack((current) => ({ ...current, name }))} />
              <FormField label="Description" value={pack.description} onChange={(description) => setPack((current) => ({ ...current, description }))} />
              <ActionButton onClick={createPack} busy={busy === "pack"}>Create pack</ActionButton>
            </div>
          </SectionCard>
          <SectionCard title="Upload official sticker">
            <div className="space-y-3">
              <select value={selectedPackId} onChange={(event) => setSelectedPackId(event.target.value)} className="w-full rounded-xl border border-slate-500/20 bg-transparent px-3 py-2 text-sm">
                <option value="">Select pack</option>
                {data.stickers.packs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <FormField label="Sticker name" value={stickerName} onChange={setStickerName} />
              <input type="file" accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} className="w-full text-sm" />
              <ActionButton onClick={uploadSticker} busy={busy === "upload"}><UploadCloud size={14} /> Upload sticker</ActionButton>
            </div>
          </SectionCard>
        </div>
        <SectionCard title="Official assets" subtitle={`${data.stickers.packs.length} packs, ${data.stickers.stickers.length} stickers`}>
          <div className="space-y-4">
            {data.stickers.packs.map((packItem) => (
              <div key={packItem.id} className="rounded-xl border border-slate-500/15 p-4">
                <div className="font-semibold">{packItem.name}</div>
                <div className="text-xs opacity-60">{packItem.isPremium ? "Premium" : "Free"} pack</div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
              {data.stickers.stickers.filter((item) => !item.ownerId).map((item) => (
                <div key={item.id} className="aspect-square overflow-hidden rounded-xl border border-slate-500/15 bg-slate-500/10">
                  {item.thumbnailUrl || item.assetUrl ? <img src={item.thumbnailUrl || item.assetUrl} alt={item.name || "Sticker"} className="h-full w-full object-cover" /> : null}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PastQuestionsPage({ data, search, reload }) {
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState("");
  const filtered = data.pastQuestions.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.title, item.courseCode, item.courseTitle, item.department, item.institution, item.status].filter(Boolean).some((field) => String(field).toLowerCase().includes(term));
  });
  const openEditor = (item) => {
    setSelected(item);
    setDraft({
      ...item,
      contentJson: JSON.stringify(item.content || [], null, 2),
      assetsJson: JSON.stringify(item.assets || [], null, 2),
    });
  };
  const save = async () => {
    if (!draft) return;
    setBusy("save");
    try {
      const payload = { ...draft, status: "draft", content: JSON.parse(draft.contentJson || "[]"), assets: JSON.parse(draft.assetsJson || "[]") };
      delete payload.contentJson;
      delete payload.assetsJson;
      const res = await putJson(`/api/past-questions/${encodeURIComponent(draft.id)}`, payload);
      setSelected(res.item || payload);
      await reload();
    } finally { setBusy(""); }
  };
  const convert = async () => {
    if (!draft) return;
    setBusy("convert");
    try { const res = await postJson(`/api/past-questions/${encodeURIComponent(draft.id)}/convert`, {}); setSelected(res.item); setDraft((current) => ({ ...current, ...(res.item || {}), contentJson: JSON.stringify(res.item?.content || [], null, 2), assetsJson: JSON.stringify(res.item?.assets || [], null, 2) })); await reload(); } finally { setBusy(""); }
  };
  const publish = async () => {
    if (!draft || !window.confirm("Publish this past-question document?")) return;
    setBusy("publish");
    try { const res = await postJson(`/api/past-questions/${encodeURIComponent(draft.id)}/publish`, {}); setSelected(res.item); await reload(); } finally { setBusy(""); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || "this document"}" and its Cloudinary assets?`)) return;
    await deleteJson(`/api/past-questions/${encodeURIComponent(item.id)}`);
    setSelected(null);
    setDraft(null);
    await reload();
  };
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Content" title="Past Questions" subtitle="Review, convert, edit, and publish structured past-question documents." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
        <ResponsiveTable
          columns={["Document", "Course", "Processing", "Status", "Actions"]}
          rows={filtered.map((item) => ({
            key: item.id,
            cells: [
              <div key="doc" className="min-w-0">
                <div className="font-semibold">{item.title || "Untitled"}</div>
                <div className="text-xs opacity-60">{[item.department, item.year, item.examSession || item.semester].filter(Boolean).join(" - ") || "No metadata"}</div>
              </div>,
              item.courseCode || item.courseTitle || "Not set",
              <StatusBadge key="processing" value={item.processing?.status || item.processingStatus || "pending"} />,
              <StatusBadge key="status" value={item.status || "draft"} />,
              <div key="actions" className="flex gap-2">
                <ActionButton onClick={() => openEditor(item)}>Edit</ActionButton>
                <ActionButton danger onClick={() => remove(item)}>Delete</ActionButton>
              </div>,
            ],
          }))}
          empty="No past-question records found."
        />
        <SectionCard title={draft ? "Document editor" : "Select a document"} subtitle="JSON block editing preserves the existing content[] and assets[] schema.">
          {draft ? (
            <div className="space-y-3">
              <FormField label="Title" value={draft.title || ""} onChange={(title) => setDraft((current) => ({ ...current, title }))} />
              <div className="grid gap-3 sm:grid-cols-2">
                {["courseCode", "courseTitle", "department", "institution", "year", "examType"].map((field) => (
                  <FormField key={field} label={field} value={String(draft[field] || "")} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />
                ))}
              </div>
              {draft.originalFile?.url ? <a className="inline-flex text-sm font-semibold text-indigo-500" href={draft.originalFile.url} target="_blank" rel="noreferrer">Open original paper</a> : null}
              <FormField label="content[]" textarea value={draft.contentJson} onChange={(contentJson) => setDraft((current) => ({ ...current, contentJson }))} mono />
              <FormField label="assets[]" textarea value={draft.assetsJson} onChange={(assetsJson) => setDraft((current) => ({ ...current, assetsJson }))} mono />
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={convert} busy={busy === "convert"}>Convert</ActionButton>
                <ActionButton onClick={save} busy={busy === "save"}>Save draft</ActionButton>
                <ActionButton onClick={publish} busy={busy === "publish"}>Publish</ActionButton>
              </div>
            </div>
          ) : <EmptyState title="No document selected" text="Choose a past-question record from the table to review its metadata, content blocks, and assets." compact />}
        </SectionCard>
      </div>
    </div>
  );
}

function AccessPage({ dark }) {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="System" title="Admin access information" subtitle="The redesign reuses existing Firebase Auth and admin detection." />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Frontend checks">
          <ul className="space-y-2 text-sm opacity-80">
            <li>Website uses `useAdmin()`.</li>
            <li>Admin is detected from hard-coded emails, custom claim, `users.admin`, or `users.role`.</li>
            <li>Current user: {auth.currentUser?.email || "Unknown"}</li>
          </ul>
        </SectionCard>
        <SectionCard title="Known admin emails">
          <div className="space-y-2">{ADMIN_EMAILS.map((email) => <StatusBadge key={email} value={email} />)}</div>
        </SectionCard>
        <SectionCard title="Security notes">
          <p className="text-sm opacity-80">This UI does not bypass backend authorization. Existing security concerns found in the audit, such as unauthenticated notification broadcast routes and support routes without admin middleware, were not changed in this UI redesign.</p>
        </SectionCard>
        <SectionCard title="Theme">
          <p className="text-sm opacity-80">Current shell theme: {dark ? "dark" : "light"}. The admin UI inherits the existing website theme flag.</p>
        </SectionCard>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-500/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">{eyebrow}</div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm opacity-70">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-500/15 bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium opacity-60">{label}</div>
          <div className="mt-2 text-3xl font-semibold">{value}</div>
        </div>
        <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-500"><Icon size={20} /></div>
      </div>
      <div className="mt-4 text-xs opacity-60">{detail}</div>
    </div>
  );
}

function QueueStat({ label, value }) {
  return <div className="rounded-xl border border-slate-500/15 p-4"><div className="text-2xl font-semibold">{value}</div><div className="text-xs opacity-60">{label}</div></div>;
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-500/15 bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm opacity-60">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function DataTable({ columns, rows, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-slate-500/5 text-xs uppercase tracking-wide opacity-60">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-500/10">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-middle">{cell}</td>)}
            </tr>
          )) : (
            <tr><td className="px-4 py-8 text-center opacity-60" colSpan={columns.length}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ResponsiveTable({ columns, rows, empty }) {
  return (
    <SectionCard title={`${rows.length} records`}>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-slate-500/15 text-xs uppercase tracking-wide opacity-60">
            <tr>{columns.map((column) => <th key={column} className="px-3 py-3 font-semibold">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.key} className="border-b border-slate-500/10 hover:bg-slate-500/5">
                {row.cells.map((cell, index) => <td key={index} className="px-3 py-3 align-middle">{cell}</td>)}
              </tr>
            )) : <tr><td className="px-3 py-12 text-center opacity-60" colSpan={columns.length}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 lg:hidden">
        {rows.length ? rows.map((row) => (
          <div key={row.key} className="rounded-xl border border-slate-500/15 p-4">
            {row.cells.map((cell, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-40">{columns[index]}</div>
                <div>{cell}</div>
              </div>
            ))}
          </div>
        )) : <EmptyState title="No records found" text={empty} compact />}
      </div>
    </SectionCard>
  );
}

function FilterBar({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button key={option} onClick={() => onChange(option)} className={cx("rounded-full border px-3 py-1.5 text-xs font-semibold capitalize", value === option ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-500/20 hover:bg-slate-500/10")}>
          {option.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ value }) {
  const text = String(value || "unknown");
  const key = text.toLowerCase();
  const tone = key.includes("published") || key.includes("active") || key.includes("premium") || key.includes("ready") || key.includes("resolved")
    ? "bg-emerald-500/10 text-emerald-600"
    : key.includes("blocked") || key.includes("banned") || key.includes("failed") || key.includes("delete")
      ? "bg-rose-500/10 text-rose-600"
      : key.includes("pending") || key.includes("draft") || key.includes("manual")
        ? "bg-amber-500/10 text-amber-600"
        : "bg-slate-500/10 text-slate-600 dark:text-slate-300";
  return <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize", tone)}>{text.replace(/_/g, " ")}</span>;
}

function ActionButton({ children, onClick, danger = false, busy = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cx("inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60",
        danger ? "border-rose-500/30 text-rose-600 hover:bg-rose-500/10" : "border-slate-500/20 hover:bg-slate-500/10")}
    >
      {busy ? <Loader2 className="animate-spin" size={13} /> : null}
      {children}
    </button>
  );
}

function ToggleButton({ active, children, onClick }) {
  return <button type="button" onClick={onClick} className={cx("rounded-full border px-3 py-1.5 text-xs font-semibold", active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-500/20")}>{children}</button>;
}

function UserCell({ user }) {
  const name = user.username || user.name || user.displayName || "Student";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-xs font-bold text-white">
        {user.photo || user.photoURL ? <img src={user.photo || user.photoURL} alt={name} className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold">{name}</div>
        <div className="truncate text-xs opacity-60">{user.school || user.department || user.uid || user.id}</div>
      </div>
    </div>
  );
}

function ListingCell({ item }) {
  const image = firstImage(item);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-500/10">
        {image ? <img src={image} alt={item.title || item.name || "Preview"} className="h-full w-full object-cover" /> : <ImageIcon size={18} className="opacity-40" />}
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold">{item.title || item.name || "Untitled"}</div>
        <div className="truncate text-xs opacity-60">{item.description || item.category || item.type || "No description"}</div>
      </div>
    </div>
  );
}

function ListingDetails({ item }) {
  const image = firstImage(item);
  return (
    <div className="space-y-4">
      {image ? <img src={image} alt={item.title || "Listing"} className="max-h-72 w-full rounded-xl object-cover" /> : null}
      <dl className="grid gap-3 sm:grid-cols-2">
        {Object.entries({
          Price: money(item.price) || "Not set",
          Owner: item.sellerName || item.ownerName || item.userId || item.ownerId || "Unknown",
          Location: item.location || "Not set",
          Status: item.status || "Not set",
          Phone: item.phone || "Not set",
          Created: formatDate(item.createdAt || item.created_at),
        }).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-500/15 p-3">
            <dt className="text-xs font-bold uppercase tracking-wide opacity-50">{label}</dt>
            <dd className="mt-1 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="whitespace-pre-line text-sm opacity-80">{item.description || "No description."}</p>
    </div>
  );
}

function FormField({ label, value, onChange, textarea = false, mono = false }) {
  const Input = textarea ? "textarea" : "input";
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide opacity-60">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cx("w-full rounded-xl border border-slate-500/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500", textarea && "min-h-28", mono && "min-h-48 font-mono text-xs")}
      />
    </label>
  );
}

function AdminModal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-500/10" aria-label="Close modal"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailModal({ open, title, onClose, children }) {
  return <AdminModal open={open} title={title} onClose={onClose}>{children}</AdminModal>;
}

function ConfirmModal({ open, title, text, confirmLabel, busy, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <AdminModal open={open} title={title} onClose={onCancel}>
      <p className="text-sm opacity-70">{text}</p>
      <div className="mt-5 flex justify-end gap-2">
        <ActionButton onClick={onCancel}>Cancel</ActionButton>
        <ActionButton onClick={onConfirm} busy={busy}>{confirmLabel}</ActionButton>
      </div>
    </AdminModal>
  );
}

function EmptyState({ title, text, compact = false }) {
  return (
    <div className={cx("flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-500/20 text-center", compact ? "p-6" : "p-12")}>
      <Database className="mb-3 opacity-30" size={compact ? 24 : 34} />
      <div className="font-semibold">{title}</div>
      <p className="mt-1 max-w-md text-sm opacity-60">{text}</p>
    </div>
  );
}

function ErrorState({ title, message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 text-rose-500" />
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm opacity-70">{message}</p>
          <div className="mt-4"><ActionButton onClick={onRetry}>Try again</ActionButton></div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-500/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-500/10" />)}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-slate-500/10" />
    </div>
  );
}
