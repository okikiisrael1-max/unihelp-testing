import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  User2,
  Wallet,
  XCircle,
} from "lucide-react";
import { db } from "../../firebase/config";

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    approved: "bg-green-500/10 text-green-400",
    pending: "bg-yellow-500/10 text-yellow-400",
    rejected: "bg-red-500/10 text-red-400",
  };
  const icons = {
    approved: <BadgeCheck size={13} />,
    pending: <Clock3 size={13} />,
    rejected: <XCircle size={13} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${map[status] ?? map.pending}`}
    >
      {icons[status]}
      {status}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, icon, valueColor, iconBg }) => (
  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[26px] p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <h2 className={`text-4xl font-black mt-3 ${valueColor}`}>{value}</h2>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
);

// ─── Filter Tabs ──────────────────────────────────────────────
const FILTERS = ["all", "pending", "approved", "rejected"];

const FilterTabs = ({ active, onChange }) => (
  <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
    {FILTERS.map((f) => (
      <button
        key={f}
        onClick={() => onChange(f)}
        className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
          active === f
            ? "bg-white/10 text-white"
            : "text-slate-500 hover:text-slate-300"
        }`}
      >
        {f}
      </button>
    ))}
  </div>
);

// ─── User Card ────────────────────────────────────────────────
const UserCard = ({ item, onView, onApprove, onReject, processingId }) => {
  const status = item?.subscription?.status;
  const busy = processingId === item.id;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[30px] p-6 hover:border-white/20 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
        {/* Left: Avatar + Info */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
            {item?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-black">{item.name}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-slate-400">{item.email}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Crown size={13} className="text-yellow-400" />
                UniHelp Premium
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Wallet size={13} className="text-green-400" />
                ₦2,500
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
          <button
            onClick={() => onView(item)}
            className="h-11 px-5 rounded-2xl bg-white/8 hover:bg-white/14 text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <Eye size={15} />
            View
          </button>

          <button
            disabled={busy || status === "approved"}
            onClick={() => onApprove(item.id)}
            className={`h-11 px-5 rounded-2xl text-white font-semibold text-sm flex items-center gap-2 transition-all ${
              status === "approved"
                ? "bg-green-700 opacity-50 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Approve
          </button>

          <button
            disabled={busy || status === "rejected"}
            onClick={() => onReject(item.id)}
            className={`h-11 px-5 rounded-2xl text-white font-semibold text-sm flex items-center gap-2 transition-all ${
              status === "rejected"
                ? "bg-red-700 opacity-50 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            <XCircle size={15} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────
const Sidebar = ({ user, onApprove, onReject }) => {
  if (!user) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[30px] p-6 h-fit sticky top-5">
        <div className="text-center py-10">
          <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="text-purple-400" size={32} />
          </div>
          <h2 className="text-xl font-black">User Details</h2>
          <p className="mt-3 text-sm text-slate-400">
            Select a user to view their payment proof
          </p>
        </div>
      </div>
    );
  }

  const status = user?.subscription?.status;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[30px] p-6 h-fit sticky top-5">
      {/* Avatar + Name */}
      <div className="text-center pb-6 border-b border-white/8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-3xl mx-auto mb-4">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <h2 className="text-2xl font-black">{user.name}</h2>
        <p className="text-sm text-slate-400 mt-1">{user.email}</p>
      </div>

      {/* Details */}
      <div className="mt-5 space-y-3">
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Plan</p>
          <p className="text-base font-black flex items-center gap-2">
            <Crown size={15} className="text-yellow-400" />
            UniHelp Premium
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Amount</p>
          <p className="text-base font-black text-green-400 flex items-center gap-2">
            <Wallet size={15} />
            ₦2,500
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Status</p>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Payment Proof */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black">Payment Proof</h3>
          {user?.paymentProof && (
            <a
              href={user.paymentProof}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs font-semibold transition-colors"
            >
              Open <ArrowUpRight size={13} />
            </a>
          )}
        </div>

        {user?.paymentProof ? (
          <img
            src={user.paymentProof}
            alt="Payment proof"
            className="w-full rounded-[22px] border border-white/10 object-cover"
          />
        ) : (
          <div className="bg-white/5 rounded-[22px] p-8 text-center">
            <p className="text-sm text-slate-500">No proof uploaded</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => onApprove(user.id)}
          disabled={status === "approved"}
          className={`h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white ${
            status === "approved"
              ? "bg-green-700 opacity-50 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500"
          }`}
        >
          <CheckCircle2 size={16} /> Approve
        </button>
        <button
          onClick={() => onReject(user.id)}
          disabled={status === "rejected"}
          className={`h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white ${
            status === "rejected"
              ? "bg-red-700 opacity-50 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          <XCircle size={16} /> Reject
        </button>
      </div>
    </div>
  );
};


const AdminSubscriptionPanel = ({dark}) => {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [processingId, setProcessingId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // ── Fetch ──
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "subscriptions"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setSubscriptions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  // ── Approve ──
  const approvePayment = async (userId) => {
    try {
      setProcessingId(userId);
      await updateDoc(doc(db, "subscriptions", userId), {
        "subscription.status": "approved",
        "subscription.active": true,
        reviewed: true,
        approvedAt: serverTimestamp(),
      });
      fetchSubscriptions();
      setSelectedUser((prev) =>
        prev?.id === userId
          ? { ...prev, subscription: { ...prev.subscription, status: "approved", active: true } }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId("");
    }
  };

  // ── Reject ──
  const rejectPayment = async (userId) => {
    try {
      setProcessingId(userId);
      await updateDoc(doc(db, "subscriptions", userId), {
        "subscription.status": "rejected",
        "subscription.active": false,
        reviewed: true,
        rejectedAt: serverTimestamp(),
      });
      fetchSubscriptions();
      setSelectedUser((prev) =>
        prev?.id === userId
          ? { ...prev, subscription: { ...prev.subscription, status: "rejected", active: false } }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId("");
    }
  };

  const filteredUsers = useMemo(
    () =>
      subscriptions.filter((item) => {
        const matchesSearch =
          item?.name?.toLowerCase().includes(search.toLowerCase()) ||
          item?.email?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
          filter === "all" || item?.subscription?.status === filter;
        return matchesSearch && matchesFilter;
      }),
    [subscriptions, search, filter]
  );

  // ── Stats ──
  const stats = useMemo(
    () => ({
      total: subscriptions.length,
      approved: subscriptions.filter((i) => i?.subscription?.status === "approved").length,
      pending: subscriptions.filter((i) => i?.subscription?.status === "pending").length,
      rejected: subscriptions.filter((i) => i?.subscription?.status === "rejected").length,
    }),
    [subscriptions]
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-5" />
          <h2 className="text-2xl font-black">Loading Admin Panel…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen rounded-lg ${dark ? 'bg-slate-900 ' : 'bg-white'} relative overflow-hidden`}>
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-5">
            <Sparkles size={14} />
            Subscription Management
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Admin Panel</h1>
              <p className="mt-3 text-slate-400 text-sm">
                Review and approve premium subscription payments manually.
              </p>
            </div>
            <button
              onClick={fetchSubscriptions}
              className="h-14 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 transition-all text-white font-semibold flex items-center justify-center gap-3 self-start lg:self-auto"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users"  value={stats.total}    valueColor=""                iconBg="bg-indigo-500/10"  icon={<User2 className="text-indigo-400" size={22} />} />
          <StatCard label="Approved"     value={stats.approved} valueColor="text-green-400"  iconBg="bg-green-500/10"   icon={<CheckCircle2 className="text-green-500" size={22} />} />
          <StatCard label="Pending"      value={stats.pending}  valueColor="text-yellow-400" iconBg="bg-yellow-500/10"  icon={<Clock3 className="text-yellow-500" size={22} />} />
          <StatCard label="Rejected"     value={stats.rejected} valueColor="text-red-400"    iconBg="bg-red-500/10"     icon={<XCircle className="text-red-500" size={22} />} />
        </div>

        {/* Toolbar */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[26px] p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500/50 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
              />
            </div>
            <FilterTabs active={filter} onChange={setFilter} />
          </div>
        </div>

        {/* Content */}
        <div className="grid xl:grid-cols-3 gap-6">

          {/* User List */}
          <div className="xl:col-span-2 space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[30px] p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
                  <Wallet className="text-purple-400" size={32} />
                </div>
                <h2 className="text-2xl font-black">No Subscriptions</h2>
                <p className="mt-3 text-sm text-slate-400">No users found matching your filters</p>
              </div>
            ) : (
              filteredUsers.map((item) => (
                <UserCard
                  key={item.id}
                  item={item}
                  processingId={processingId}
                  onView={setSelectedUser}
                  onApprove={approvePayment}
                  onReject={rejectPayment}
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <Sidebar
            user={selectedUser}
            onApprove={approvePayment}
            onReject={rejectPayment}
          />

        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPanel;