import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import {
  Bell,
  Check,
  ChevronLeft,
  FileText,
  Image,
  Loader2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  UploadCloud,
  UserMinus,
  Users,
  Video,
  X,
} from "lucide-react";

import { db } from "../../firebase/config";
import { toCloudinaryAsset, uploadFile, uploadImage } from "../../services/cloudinary";
import { AuthContext } from "../context/AuthContext";
import {
  approveJoinRequest,
  createGroup,
  createPost,
  deleteOwnPost,
  formatShortTime,
  getCurrentUserProfile,
  getGroup,
  getMembership,
  joinPublicGroup,
  leaveGroup,
  listGroups,
  listenGroupMessages,
  listenGroupPosts,
  loadOlderGroupMessages,
  reactToPost,
  rejectJoinRequest,
  requestJoinGroup,
  sendGroupMessage,
} from "../service/communityService";

const CATEGORIES = ["All", "Academics", "JAMB", "Campus Life", "Marketplace", "Tutorials", "Study Group"];
const TABS = ["Feed", "Members", "Chat", "Media", "Files", "About"];
const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏"];

const baseInput = "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30";

const themeClasses = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark ? `${baseInput} border-white/10 bg-white/5 text-white placeholder:text-white/40` : `${baseInput} border-slate-200 bg-white text-slate-900`,
  muted: dark ? "text-slate-400" : "text-slate-500",
});

const fileKind = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "document";
};

const EmptyState = ({ icon: Icon, title, text, dark }) => {
  const t = themeClasses(dark);
  return (
    <div className={`rounded-3xl border p-8 text-center ${t.soft}`}>
      <Icon className="mx-auto opacity-35" size={42} />
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className={`mt-2 text-sm ${t.muted}`}>{text}</p>
    </div>
  );
};

const SkeletonCards = ({ dark }) => {
  const t = themeClasses(dark);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={`h-52 animate-pulse rounded-3xl border ${t.soft}`} />
      ))}
    </div>
  );
};

const AttachmentPreview = ({ attachment }) => {
  if (!attachment?.url) return null;
  if (attachment.type === "image") {
    return <img src={attachment.url} alt={attachment.name || "Attachment"} className="mt-4 max-h-80 w-full rounded-2xl object-cover" />;
  }
  if (attachment.type === "video") {
    return <video src={attachment.url} controls className="mt-4 max-h-80 w-full rounded-2xl bg-black" />;
  }
  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm font-semibold text-indigo-400">
      <FileText size={18} />
      {attachment.name || "Open file"}
    </a>
  );
};

function CreateGroupModal({ dark, onClose, onCreated, user, profile }) {
  const t = themeClasses(dark);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Academics",
    privacy: "public",
    rules: "",
  });
  const [cover, setCover] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      setError("Group name and description are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const uploads = {};
      if (cover) {
        const result = await uploadImage(cover);
        uploads.coverUrl = result.secure_url;
        uploads.coverAsset = toCloudinaryAsset(result);
      }
      if (avatar) {
        const result = await uploadImage(avatar);
        uploads.avatarUrl = result.secure_url;
        uploads.avatarAsset = toCloudinaryAsset(result);
      }
      const id = await createGroup({ form, user, profile, uploads });
      onCreated(id);
    } catch (err) {
      setError(err?.errors?.[0] || err.message || "Could not create group.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto bg-black/60 py-10 top-0 px-4 backdrop-blur">
      <form onSubmit={submit} className={`w-full md:w-[70%] rounded-3xl border p-5 shadow-2xl md:p-7 ${t.panel}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Create Group</h2>
            <p className={`mt-1 text-sm ${t.muted}`}>Build a focused space for students.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl p-3 hover:bg-red-500/10" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input className={t.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name" />
          <select className={t.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}
          </select>
          <textarea className={`${t.input} md:col-span-2`} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          <select className={t.input} value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value })}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <input className={t.input} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Optional rules" />
          <label className={`rounded-2xl border p-4 text-sm font-semibold ${t.soft}`}>
            <span className="flex items-center gap-2"><Image size={17} /> Cover image</span>
            <input type="file" accept="image/*" className="mt-3 text-xs" onChange={(e) => setCover(e.target.files?.[0] || null)} />
          </label>
          <label className={`rounded-2xl border p-4 text-sm font-semibold ${t.soft}`}>
            <span className="flex items-center gap-2"><UploadCloud size={17} /> Group avatar</span>
            <input type="file" accept="image/*" className="mt-3 text-xs" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
          </label>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

        <button disabled={saving} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {saving ? "Creating..." : "Create group"}
        </button>
      </form>
    </div>
  );
}

function GroupDiscovery({ dark }) {
  const t = themeClasses(dark);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [groups, setGroups] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async ({ reset = false } = {}) => {
    setLoading(true);
    try {
      const result = await listGroups({ search, category, cursor: reset ? null : cursor });
      setGroups((current) => reset ? result.groups : [...current, ...result.groups]);
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
    }
  }, [category, cursor, search]);

  useEffect(() => {
    getCurrentUserProfile(user).then((data) => setProfile(data || {}));
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => load({ reset: true }), 250);
    return () => clearTimeout(timer);
  }, [category, search]);

  return (
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className={`rounded-3xl border p-5 md:p-8 ${t.panel}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
                <Users size={14} /> Groups
              </div>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">Community Groups</h1>
              <p className={`mt-3 max-w-2xl text-sm leading-7 md:text-base ${t.muted}`}>
                Discover student communities, request access to private groups, and keep group chat scoped to the space you are actually using.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/messages" className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}>
                <MessageCircle size={18} /> Messenger
              </Link>
              <Link to="/notifications" className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}>
                <Bell size={18} /> Notifications
              </Link>
              <button onClick={() => setCreateOpen(true)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-4 font-bold text-white">
                <Plus size={18} /> Create
              </button>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row">
            <div className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 ${t.soft}`}>
              <Search size={18} className="opacity-50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups" className="h-12 w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((item) => (
                <button key={item} onClick={() => setCategory(item)} className={`h-12 shrink-0 rounded-2xl px-4 text-sm font-bold ${category === item ? "bg-indigo-600 text-white" : t.soft}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading && groups.length === 0 ? (
            <SkeletonCards dark={dark} />
          ) : groups.length === 0 ? (
            <EmptyState dark={dark} icon={Users} title="No groups found" text="Try another category or create the first group in this space." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <Link key={group.id} to={`/community/${group.id}`} className={`overflow-hidden rounded-3xl border transition hover:-translate-y-1 hover:shadow-xl ${t.panel}`}>
                  <div className="h-28 bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-400">
                    {group.coverUrl && <img src={group.coverUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-5">
                    <div className="-mt-12 mb-4 flex items-end justify-between">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-indigo-600 text-2xl font-black text-white">
                        {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full rounded-[20px] object-cover" /> : group.name?.charAt(0)}
                      </div>
                      {group.privacy === "private" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500"><Lock size={13} /> Private</span>}
                    </div>
                    <h2 className="text-xl font-black">{group.name}</h2>
                    <p className={`mt-2 line-clamp-2 text-sm leading-6 ${t.muted}`}>{group.description}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-400">{group.category}</span>
                      <span className={t.muted}>{group.memberCount || 0} members</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button onClick={() => load()} disabled={loading} className={`rounded-2xl border px-5 py-3 text-sm font-bold ${t.soft}`}>
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateGroupModal
          dark={dark}
          user={user}
          profile={profile}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => navigate(`/community/${id}`)}
        />
      )}
    </div>
  );
}

function Composer({ dark, placeholder, onSend, allowVideo = true }) {
  const t = themeClasses(dark);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!text.trim() && !file) return;
    setSending(true);
    setError("");
    try {
      const attachments = [];
      if (file) {
        const kind = fileKind(file);
        if (kind === "video" && !allowVideo) throw new Error("Video uploads are available for premium users.");
        const uploaded = await uploadFile(file);
        attachments.push({
          type: kind,
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          resourceType: uploaded.resource_type,
          name: uploaded.original_filename || file.name,
          bytes: uploaded.bytes || file.size,
        });
      }
      await onSend({ text: text.trim(), attachments });
      setText("");
      setFile(null);
    } catch (err) {
      setError(err?.errors?.[0] || err.message || "Could not send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`rounded-3xl border p-3 ${t.panel}`}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={placeholder} className={`${t.input} resize-none border-0`} />
      {file && <div className={`mt-3 flex items-center justify-between rounded-2xl border p-3 text-xs ${t.soft}`}><span>{file.name}</span><button onClick={() => setFile(null)}><X size={15} /></button></div>}
      {error && <div className="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${t.soft}`}>
          <UploadCloud size={17} /> Attach
          <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button onClick={submit} disabled={sending || (!text.trim() && !file)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-5 font-bold text-white disabled:opacity-50">
          {sending ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Send
        </button>
      </div>
    </div>
  );
}

function GroupDetail({ dark, groupId }) {
  const t = themeClasses(dark);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [group, setGroup] = useState(null);
  const [membership, setMembership] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [tab, setTab] = useState("Feed");
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageCursor, setMessageCursor] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  const isMember = Boolean(membership);
  const canManage = membership?.role === "owner" || membership?.role === "admin" || group?.ownerId === user?.uid;
  const isPremium = profile?.plan === "premium" || profile?.premium === true;

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [groupData, profileData, membershipData] = await Promise.all([
        getGroup(groupId),
        getCurrentUserProfile(user),
        getMembership(groupId, user.uid),
      ]);
      setGroup(groupData);
      setProfile(profileData || {});
      setMembership(membershipData);

      if (!membershipData && groupData?.privacy === "private") {
        const requestSnap = await getDocs(query(collection(db, "groups", groupId, "joinRequests"), where("uid", "==", user.uid), limit(1)));
        setPendingRequest(!requestSnap.empty);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isMember || tab !== "Feed") return undefined;
    return listenGroupPosts(groupId, (items) => setPosts(items));
  }, [groupId, isMember, tab]);

  useEffect(() => {
    if (!isMember || tab !== "Chat") return undefined;
    return listenGroupMessages(groupId, (items, cursor) => {
      setMessages(items);
      setMessageCursor(cursor);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
  }, [groupId, isMember, tab]);

  useEffect(() => {
    if (!isMember || tab !== "Members") return undefined;
    const q = query(collection(db, "groups", groupId, "members"), orderBy("joinedAt", "desc"), limit(50));
    const run = async () => {
      const snap = await getDocs(q);
      setMembers(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    };
    run();
    if (canManage) {
      getDocs(query(collection(db, "groups", groupId, "joinRequests"), orderBy("requestedAt", "desc"), limit(30)))
        .then((snap) => setRequests(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }))));
    }
    return undefined;
  }, [canManage, groupId, isMember, tab]);

  const join = async () => {
    setBusy(true);
    try {
      if (group.privacy === "private") {
        await requestJoinGroup(group, user, profile);
        setPendingRequest(true);
      } else {
        await joinPublicGroup(group, user, profile);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const sendPost = async (payload) => createPost(groupId, user, profile, payload);
  const sendChat = async (payload) => sendGroupMessage(groupId, user, profile, payload);

  const mediaItems = posts.flatMap((post) => (post.attachments || []).filter((item) => item.type === "image" || item.type === "video").map((item) => ({ ...item, postId: post.id })));
  const fileItems = posts.flatMap((post) => (post.attachments || []).filter((item) => item.type === "pdf" || item.type === "document").map((item) => ({ ...item, postId: post.id })));

  if (loading) {
    return <div className={`min-h-screen ${t.page}`}><div className="mx-auto max-w-7xl px-4 py-10"><SkeletonCards dark={dark} /></div></div>;
  }

  if (!group) {
    return <div className={`min-h-screen ${t.page}`}><div className="mx-auto max-w-3xl px-4 py-10"><EmptyState dark={dark} icon={Users} title="Group not found" text="This group may have been deleted." /></div></div>;
  }

  return (
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <button onClick={() => navigate("/community")} className={`mb-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${t.soft}`}>
          <ChevronLeft size={17} /> Groups
        </button>

        <div className={`overflow-hidden rounded-3xl border ${t.panel}`}>
          <div className="h-44 bg-gradient-to-r from-indigo-700 via-sky-500 to-emerald-400 md:h-64">
            {group.coverUrl && <img src={group.coverUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="p-5 md:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="-mt-20 flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-indigo-600 text-4xl font-black text-white">
                  {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full rounded-[20px] object-cover" /> : group.name?.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-black md:text-5xl">{group.name}</h1>
                    {group.privacy === "private" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500"><Lock size={13} /> Private</span>}
                  </div>
                  <p className={`mt-3 max-w-3xl text-sm leading-7 ${t.muted}`}>{group.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-400">{group.category}</span>
                    <span className={`rounded-full px-3 py-1 ${t.soft}`}>{group.memberCount || 0} members</span>
                    <span className={`rounded-full px-3 py-1 ${t.soft}`}>Created {formatShortTime(group.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isMember ? (
                  <>
                    <button onClick={() => setTab("Chat")} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-4 font-bold text-white"><MessageCircle size={17} /> Chat</button>
                    {membership?.role !== "owner" && <button onClick={async () => { await leaveGroup(group, user.uid); await refresh(); }} className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}><UserMinus size={17} /> Leave</button>}
                  </>
                ) : (
                  <button onClick={join} disabled={busy || pendingRequest} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-4 font-bold text-white disabled:opacity-60">
                    {busy ? <Loader2 className="animate-spin" size={17} /> : group.privacy === "private" ? <Lock size={17} /> : <Plus size={17} />}
                    {pendingRequest ? "Request pending" : group.privacy === "private" ? "Request to join" : "Join group"}
                  </button>
                )}
                {canManage && <Link to={`/community/${groupId}/manage`} className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 font-bold ${t.soft}`}><Settings size={17} /> Manage</Link>}
              </div>
            </div>
          </div>
        </div>

        {!isMember ? (
          <div className="mt-6">
            <EmptyState dark={dark} icon={Lock} title={group.privacy === "private" ? "Private group" : "Join to participate"} text="Membership is required before posts, chat, media, and files are loaded." />
          </div>
        ) : (
          <>
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
              {TABS.map((item) => (
                <button key={item} onClick={() => setTab(item)} className={`h-11 shrink-0 rounded-2xl px-4 text-sm font-bold ${tab === item ? "bg-indigo-600 text-white" : t.soft}`}>
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0">
                {tab === "Feed" && (
                  <div className="space-y-5">
                    <Composer dark={dark} placeholder="Share an update, question, PDF, poll idea, image, or study resource..." onSend={sendPost} allowVideo={isPremium} />
                    {posts.length === 0 ? <EmptyState dark={dark} icon={MessageCircle} title="No posts yet" text="Start the group feed with a helpful update." /> : posts.map((post) => (
                      <article key={post.id} className={`rounded-3xl border p-5 ${t.panel}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">{post.authorAvatar && <img src={post.authorAvatar} alt="" className="h-full w-full object-cover" />}</div>
                            <div className="min-w-0">
                              <p className="truncate font-bold">{post.authorName}</p>
                              <p className={`text-xs ${t.muted}`}>{formatShortTime(post.createdAt)}</p>
                            </div>
                          </div>
                          {post.authorId === user.uid && <button onClick={() => deleteOwnPost(groupId, post.id)} className="rounded-xl p-2 text-red-400 hover:bg-red-500/10"><X size={17} /></button>}
                        </div>
                        {post.text && <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{post.text}</p>}
                        {(post.attachments || []).map((item, index) => <AttachmentPreview key={`${post.id}-${index}`} attachment={item} />)}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {REACTIONS.map((emoji) => <button key={emoji} onClick={() => reactToPost(groupId, post.id, emoji)} className={`rounded-full border px-3 py-1 text-sm ${t.soft}`}>{emoji} {post.reactions?.[emoji] || ""}</button>)}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {tab === "Chat" && (
                  <div className={`overflow-hidden rounded-3xl border ${t.panel}`}>
                    <div className="max-h-[58vh] overflow-y-auto p-4">
                      {messageCursor && <button onClick={async () => {
                        const older = await loadOlderGroupMessages(groupId, messageCursor);
                        setMessages((current) => [...older.messages, ...current]);
                        setMessageCursor(older.cursor || messageCursor);
                      }} className={`mx-auto mb-4 block rounded-2xl border px-4 py-2 text-xs font-bold ${t.soft}`}>Load older</button>}
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const mine = message.senderId === user.uid;
                          return (
                            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[86%] rounded-3xl border p-3 ${mine ? "border-indigo-500 bg-indigo-600 text-white" : t.soft}`}>
                                <p className="text-xs font-bold opacity-80">{message.senderName} · {formatShortTime(message.createdAt)}</p>
                                {message.text && <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
                                {(message.attachments || []).map((item, index) => <AttachmentPreview key={index} attachment={item} />)}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={bottomRef} />
                      </div>
                    </div>
                    <div className="border-t border-white/10 p-3">
                      <Composer dark={dark} placeholder="Message this group..." onSend={sendChat} allowVideo={isPremium} />
                    </div>
                  </div>
                )}

                {tab === "Members" && (
                  <div className="space-y-4">
                    {canManage && requests.length > 0 && (
                      <div className={`rounded-3xl border p-5 ${t.panel}`}>
                        <h2 className="font-black">Join requests</h2>
                        <div className="mt-4 space-y-3">
                          {requests.map((request) => (
                            <div key={request.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${t.soft}`}>
                              <span className="font-bold">{request.name}</span>
                              <div className="flex gap-2">
                                <button onClick={async () => { await approveJoinRequest(group, request); setRequests((items) => items.filter((item) => item.id !== request.id)); }} className="rounded-xl bg-emerald-600 px-3 py-2 text-white"><Check size={16} /></button>
                                <button onClick={async () => { await rejectJoinRequest(group, request); setRequests((items) => items.filter((item) => item.id !== request.id)); }} className="rounded-xl bg-red-600 px-3 py-2 text-white"><X size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                      {members.map((member) => (
                        <div key={member.id} className={`flex items-center gap-3 rounded-3xl border p-4 ${t.panel}`}>
                          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-indigo-500/10">{member.avatar && <img src={member.avatar} alt="" className="h-full w-full object-cover" />}</div>
                          <div className="min-w-0">
                            <p className="truncate font-bold">{member.name}</p>
                            <p className={`text-xs capitalize ${t.muted}`}>{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "Media" && (
                  mediaItems.length ? <div className="grid gap-4 md:grid-cols-2">{mediaItems.map((item, index) => <AttachmentPreview key={index} attachment={item} />)}</div> : <EmptyState dark={dark} icon={Image} title="No media yet" text="Images and videos from posts will appear here." />
                )}

                {tab === "Files" && (
                  fileItems.length ? <div className="space-y-3">{fileItems.map((item, index) => <AttachmentPreview key={index} attachment={item} />)}</div> : <EmptyState dark={dark} icon={FileText} title="No files yet" text="PDFs and documents from posts will appear here." />
                )}

                {tab === "About" && (
                  <div className={`rounded-3xl border p-6 ${t.panel}`}>
                    <h2 className="text-2xl font-black">About</h2>
                    <p className={`mt-3 leading-7 ${t.muted}`}>{group.description}</p>
                    <h3 className="mt-6 font-black">Rules</h3>
                    <p className={`mt-2 leading-7 ${t.muted}`}>{group.rules || "No rules added yet."}</p>
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <div className={`rounded-3xl border p-5 ${t.panel}`}>
                  <h3 className="font-black">Group Health</h3>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className={`rounded-2xl border p-3 ${t.soft}`}><p className="font-black">{group.memberCount || 0}</p><p className={`text-xs ${t.muted}`}>Members</p></div>
                    <div className={`rounded-2xl border p-3 ${t.soft}`}><p className="font-black">{group.postCount || 0}</p><p className={`text-xs ${t.muted}`}>Posts</p></div>
                    <div className={`rounded-2xl border p-3 ${t.soft}`}><p className="font-black">{group.fileCount || 0}</p><p className={`text-xs ${t.muted}`}>Files</p></div>
                  </div>
                </div>
                <Link to="/messages" className={`flex items-center justify-between rounded-3xl border p-5 font-bold ${t.panel}`}>
                  Direct messages <MessageCircle size={18} />
                </Link>
                <Link to="/community-settings" className={`flex items-center justify-between rounded-3xl border p-5 font-bold ${t.panel}`}>
                  Messaging settings <Settings size={18} />
                </Link>
                {canManage && <Link to={`/community/${groupId}/manage`} className={`block rounded-3xl border p-5 ${t.panel}`}><ShieldCheck className="text-indigo-400" /><p className="mt-3 text-sm font-bold">Manage members, requests, and moderation actions for this group.</p></Link>}
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Community({ dark = false }) {
  const { groupId } = useParams();
  return groupId ? <GroupDetail dark={dark} groupId={groupId} /> : <GroupDiscovery dark={dark} />;
}
