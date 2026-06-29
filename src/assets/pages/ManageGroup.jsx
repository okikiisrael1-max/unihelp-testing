import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  Loader2,
  Lock,
  Save,
  Search,
  Settings,
  ShieldCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

import { db } from "../../firebase/config";
import { uploadImage } from "../../services/cloudinary";
import { AuthContext } from "../context/AuthContext";
import {
  approveJoinRequest,
  formatShortTime,
  getGroup,
  getMembership,
  rejectJoinRequest,
  removeGroupMember,
  updateGroupDetails,
  updateGroupMemberRole,
} from "../service/communityService";

const CATEGORIES = ["Academics", "JAMB", "Campus Life", "Marketplace", "Tutorials", "Study Group"];
const TABS = ["Details", "Requests", "Members"];
const ROLE_OPTIONS = ["member", "moderator", "admin"];

const baseInput = "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30";

const themeClasses = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark ? `${baseInput} border-white/10 bg-white/5 text-white placeholder:text-white/40` : `${baseInput} border-slate-200 bg-white text-slate-900`,
  muted: dark ? "text-slate-400" : "text-slate-500",
});

const EmptyState = ({ dark, icon: Icon, title, text }) => {
  const t = themeClasses(dark);
  return (
    <div className={`rounded-3xl border p-8 text-center ${t.soft}`}>
      <Icon className="mx-auto opacity-35" size={42} />
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className={`mt-2 text-sm ${t.muted}`}>{text}</p>
    </div>
  );
};

export default function ManageGroup({ dark = false }) {
  const t = themeClasses(dark);
  const { groupId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [membership, setMembership] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("Details");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Academics",
    privacy: "public",
    rules: "",
    coverUrl: "",
    avatarUrl: "",
  });
  const [cover, setCover] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const canManage = membership?.role === "owner" || membership?.role === "admin" || group?.ownerId === user?.uid;
  const isOwner = membership?.role === "owner" || group?.ownerId === user?.uid;

  const loadGroup = useCallback(async () => {
    if (!groupId || !user?.uid) return;
    setLoading(true);
    setError("");
    try {
      const [groupData, membershipData] = await Promise.all([
        getGroup(groupId),
        getMembership(groupId, user.uid),
      ]);

      setGroup(groupData);
      setMembership(membershipData);

      if (groupData) {
        setForm({
          name: groupData.name || "",
          description: groupData.description || "",
          category: groupData.category || "Academics",
          privacy: groupData.privacy || "public",
          rules: groupData.rules || "",
          coverUrl: groupData.coverUrl || "",
          avatarUrl: groupData.avatarUrl || "",
        });
      }
    } catch (err) {
      setError(err.message || "Could not load group.");
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  const loadMembers = useCallback(async () => {
    if (!groupId) return;
    const snap = await getDocs(query(collection(db, "groups", groupId, "members"), orderBy("joinedAt", "desc"), limit(100)));
    setMembers(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  }, [groupId]);

  const loadRequests = useCallback(async () => {
    if (!groupId) return;
    const snap = await getDocs(query(collection(db, "groups", groupId, "joinRequests"), orderBy("requestedAt", "desc"), limit(100)));
    setRequests(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (!canManage) return;
    loadMembers();
    loadRequests();
  }, [canManage, loadMembers, loadRequests]);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      [member.name, member.email, member.role].some((value) => value?.toLowerCase().includes(term))
    );
  }, [members, search]);

  const saveDetails = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      setError("Group name and description are required.");
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");
    try {
      const payload = { ...form };
      if (cover) payload.coverUrl = (await uploadImage(cover)).secure_url;
      if (avatar) payload.avatarUrl = (await uploadImage(avatar)).secure_url;
      await updateGroupDetails(groupId, payload);
      setNotice("Group details saved.");
      await loadGroup();
    } catch (err) {
      setError(err?.errors?.[0] || err.message || "Could not save group.");
    } finally {
      setSaving(false);
    }
  };

  const approveRequest = async (request) => {
    await approveJoinRequest(group, request);
    setRequests((items) => items.filter((item) => item.id !== request.id));
    await loadMembers();
  };

  const rejectRequest = async (request) => {
    await rejectJoinRequest(group, request);
    setRequests((items) => items.filter((item) => item.id !== request.id));
  };

  const changeRole = async (member, role) => {
    setError("");
    try {
      await updateGroupMemberRole(group, member, role);
      setMembers((items) => items.map((item) => item.id === member.id ? { ...item, role } : item));
    } catch (err) {
      setError(err.message || "Could not update role.");
    }
  };

  const removeMember = async (member) => {
    const confirmed = window.confirm(`Remove ${member.name || "this member"} from ${group.name}?`);
    if (!confirmed) return;
    setError("");
    try {
      await removeGroupMember(group, member);
      setMembers((items) => items.filter((item) => item.id !== member.id));
      setGroup((current) => current ? { ...current, memberCount: Math.max((current.memberCount || 1) - 1, 0) } : current);
    } catch (err) {
      setError(err.message || "Could not remove member.");
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${t.page}`}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className={`h-64 animate-pulse rounded-3xl border ${t.soft}`} />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={`min-h-screen ${t.page}`}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <EmptyState dark={dark} icon={Users} title="Group not found" text="This group may have been deleted." />
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className={`min-h-screen ${t.page}`}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link to={`/community/${groupId}`} className={`mb-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${t.soft}`}>
            <ChevronLeft size={17} /> Back to group
          </Link>
          <EmptyState dark={dark} icon={Lock} title="Management access required" text="Only group owners and admins can manage this group." />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.page}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <button onClick={() => navigate(`/community/${groupId}`)} className={`mb-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${t.soft}`}>
          <ChevronLeft size={17} /> Back to group
        </button>

        <div className={`rounded-3xl border p-5 md:p-7 ${t.panel}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
                <ShieldCheck size={14} /> Group Management
              </div>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">{group.name}</h1>
              <p className={`mt-3 max-w-2xl text-sm leading-7 ${t.muted}`}>
                Manage group details, membership requests, and member roles from one focused workspace.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`rounded-2xl border p-3 ${t.soft}`}><p className="font-black">{group.memberCount || 0}</p><p className={`text-xs ${t.muted}`}>Members</p></div>
              <div className={`rounded-2xl border p-3 ${t.soft}`}><p className="font-black">{requests.length}</p><p className={`text-xs ${t.muted}`}>Requests</p></div>
              <div className={`rounded-2xl border p-3 ${t.soft}`}><p className="font-black">{group.privacy}</p><p className={`text-xs ${t.muted}`}>Privacy</p></div>
            </div>
          </div>
        </div>

        {(notice || error) && (
          <div className={`mt-4 rounded-2xl border p-3 text-sm font-semibold ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}>
            {error || notice}
          </div>
        )}

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`h-11 shrink-0 rounded-2xl px-4 text-sm font-bold ${tab === item ? "bg-indigo-600 text-white" : t.soft}`}>
              {item}
            </button>
          ))}
        </div>

        {tab === "Details" && (
          <form onSubmit={saveDetails} className={`mt-6 rounded-3xl border p-5 md:p-7 ${t.panel}`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className={`text-xs font-bold uppercase ${t.muted}`}>Group name</span>
                <input className={t.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="space-y-2">
                <span className={`text-xs font-bold uppercase ${t.muted}`}>Category</span>
                <select className={t.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className={`text-xs font-bold uppercase ${t.muted}`}>Privacy</span>
                <select className={t.input} value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value })}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className={`text-xs font-bold uppercase ${t.muted}`}>Rules</span>
                <input className={t.input} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Optional group rules" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className={`text-xs font-bold uppercase ${t.muted}`}>Description</span>
                <textarea className={t.input} rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label className={`rounded-2xl border p-4 text-sm font-semibold ${t.soft}`}>
                Cover image
                <input type="file" accept="image/*" className="mt-3 block text-xs" onChange={(e) => setCover(e.target.files?.[0] || null)} />
              </label>
              <label className={`rounded-2xl border p-4 text-sm font-semibold ${t.soft}`}>
                Group avatar
                <input type="file" accept="image/*" className="mt-3 block text-xs" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
              </label>
            </div>
            <button disabled={saving} className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-5 font-bold text-white disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}

        {tab === "Requests" && (
          <div className="mt-6 space-y-3">
            {requests.length === 0 ? (
              <EmptyState dark={dark} icon={Users} title="No pending requests" text="New private group requests will appear here." />
            ) : requests.map((request) => (
              <div key={request.id} className={`flex flex-col gap-3 rounded-3xl border p-4 md:flex-row md:items-center md:justify-between ${t.panel}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">
                    {request.avatar && <img src={request.avatar} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black">{request.name}</p>
                    <p className={`truncate text-xs ${t.muted}`}>{request.email || "No email"} - {formatShortTime(request.requestedAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveRequest(request)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 font-bold text-white"><Check size={17} /> Approve</button>
                  <button onClick={() => rejectRequest(request)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-red-600 px-4 font-bold text-white"><X size={17} /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Members" && (
          <div className="mt-6 space-y-4">
            <div className={`flex items-center gap-3 rounded-2xl border px-4 ${t.soft}`}>
              <Search size={18} className="opacity-50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members" className="h-12 w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredMembers.map((member) => {
                const protectedOwner = member.role === "owner" || member.id === group.ownerId;
                const canEditMember = isOwner && member.id !== user.uid && !protectedOwner;
                return (
                  <div key={member.id} className={`rounded-3xl border p-4 ${t.panel}`}>
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">
                        {member.avatar && <img src={member.avatar} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-black">{member.name}</p>
                          <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-bold capitalize text-indigo-400">{member.role}</span>
                        </div>
                        <p className={`truncate text-xs ${t.muted}`}>{member.email || "No email"} - Joined {formatShortTime(member.joinedAt)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <select
                        disabled={!canEditMember}
                        value={ROLE_OPTIONS.includes(member.role) ? member.role : "member"}
                        onChange={(e) => changeRole(member, e.target.value)}
                        className={`${t.input} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                      <button
                        disabled={!isOwner || member.id === user.uid || protectedOwner}
                        onClick={() => removeMember(member)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 px-4 font-bold text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <UserMinus size={17} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredMembers.length === 0 && <EmptyState dark={dark} icon={Settings} title="No members found" text="Try another search term." />}
          </div>
        )}
      </div>
    </div>
  );
}
