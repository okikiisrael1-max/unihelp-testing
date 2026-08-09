import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Reply,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  UploadCloud,
  UserMinus,
  Users,
  Users2,
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

/**
 * ---------------------------------------------------------------------------
 * DESIGN SYSTEM — "The Quad" ledger aesthetic
 * A campus-directory feel: index cards, folder-tab navigation, ledger stamps.
 * Fraunces carries headings, Work Sans carries body copy, IBM Plex Mono
 * carries anything that reads like data (timestamps, counts, tags, labels).
 * ---------------------------------------------------------------------------
 */

const CATEGORIES = ["All", "Academics", "Campus Life", "Marketplace", "Study Group"];
const TABS = ["Feed", "Members", "Chat", "Media", "Files", "About"];
const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏"];

const FONT_DISPLAY = "";
const FONT_MONO = "";

const paletteVars = (dark) =>
  dark
    ? {
        "--paper": "#090d16",
        "--paper-raised": "#111827",
        "--paper-sunken": "#0f172a",
        "--ink": "#f8fafc",
        "--ink-soft": "#cbd5e1",
        "--ink-faint": "#94a3b8",
        "--line": "#334155",
        "--brass": "#6366f1",
        "--brass-soft": "rgba(99,102,241,0.16)",
        "--moss": "#0884ff",
        "--moss-soft": "rgba(34,197,94,0.14)",
        "--clay": "#ef4444",
        "--clay-soft": "rgba(239,68,68,0.14)",
        "--on-brass": "#f8fafc",
      }
    : {
        "--paper": "#f8fafc",
        "--paper-raised": "#ffffff",
        "--paper-sunken": "#f3f4f6",
        "--ink": "#0f172a",
        "--ink-soft": "#475569",
        "--ink-faint": "#94a3b8",
        "--line": "#e2e8f0",
        "--brass": "#4f46e5",
        "--brass-soft": "#e0e7ff",
        "--moss": "#3813cb",
        "--moss-soft": "#dcfce7",
        "--clay": "#dc2626",
        "--clay-soft": "#fee2e2",
        "--on-brass": "#ffffff",
      };

const cx = {
  panel: "rounded-2xl border [border-color:var(--line)] [background:var(--paper-raised)]",
  soft: "rounded-xl border [border-color:var(--line)] [background:var(--paper-sunken)]",
  muted: "[color:var(--ink-soft)]",
  faint: "[color:var(--ink-faint)]",
  input:
    "w-full rounded-lg border [border-color:var(--line)] [background:var(--paper-raised)] px-4 py-3 text-sm outline-none transition placeholder:[color:var(--ink-faint)] focus:[border-color:var(--brass)]",
  ghostIcon:
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border [border-color:var(--line)] [color:var(--ink-soft)] transition hover:[border-color:var(--brass)] hover:[color:var(--ink)]",
  primaryBtn:
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg [background:var(--brass)] px-4 text-sm font-semibold [color:var(--on-brass)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
  ghostBtn:
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg border [border-color:var(--line)] px-4 text-sm font-semibold [color:var(--ink)] transition hover:[border-color:var(--brass)]",
};

function GlobalStyle() {
  return (
    <style>{`
      .quad-scope {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .quad-scope ::selection { background: var(--brass-soft); color: var(--ink); }
      .quad-scope *:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }
      .quad-scope ::-webkit-scrollbar { width: 8px; height: 8px; }
      .quad-scope ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 999px; }
      .quad-scope ::-webkit-scrollbar-track { background: transparent; }

      @keyframes quad-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .quad-rise { animation: quad-rise 0.28s ease both; }

      @keyframes quad-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      .quad-pop { animation: quad-pop 0.14s ease both; }

      @media (prefers-reduced-motion: reduce) {
        .quad-scope * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
}

function PageChrome({ dark, children }) {
  const vars = useMemo(() => paletteVars(dark), [dark]);
  return (
    <div style={vars} className="quad-scope min-h-screen [background:var(--paper)] [color:var(--ink)] antialiased">
      <GlobalStyle />
      {children}
    </div>
  );
}

/** Lightweight dropdown menu — click-outside aware, no external deps. */
function Menu({ trigger, children, align = "right", width = "w-56" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`quad-pop absolute z-30 mt-2 ${width} ${align === "right" ? "right-0" : "left-0"} overflow-hidden rounded-xl border py-1 shadow-xl [border-color:var(--line)] [background:var(--paper-raised)]`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, tone = "default", disabled = false }) {
  const toneClass = tone === "danger" ? "[color:var(--clay)] hover:[background:var(--clay-soft)]" : "hover:[background:var(--paper-sunken)]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );
}

const fileKind = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "document";
};

const EmptyState = ({ icon: Icon, title, text }) => (
  <div className={`p-10 text-center ${cx.soft}`}>
    <Icon className="mx-auto [color:var(--ink-faint)]" size={36} strokeWidth={1.5} />
    <h3 className={`mt-4 text-base font-semibold ${FONT_DISPLAY}`}>{title}</h3>
    <p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${cx.muted}`}>{text}</p>
  </div>
);

const SkeletonCards = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className={`h-56 animate-pulse ${cx.soft}`} />
    ))}
  </div>
);

const AttachmentPreview = ({ attachment }) => {
  if (!attachment?.url) return null;
  if (attachment.type === "image") {
    return <img src={attachment.url} alt={attachment.name || "Attachment"} className="mt-3 max-h-80 w-full rounded-xl object-cover" />;
  }
  if (attachment.type === "video") {
    return <video src={attachment.url} controls className="mt-3 max-h-80 w-full rounded-xl bg-black" />;
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`mt-3 flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold [border-color:var(--line)] [background:var(--brass-soft)] [color:var(--brass)]`}
    >
      <FileText size={17} />
      {attachment.name || "Open file"}
    </a>
  );
};

const messagePreview = (message) => {
  if (message?.text) return message.text.slice(0, 120);
  return message?.attachments?.[0]?.name || "Attachment";
};

const firstLetter = (name = "Student") => name.trim().charAt(0).toUpperCase() || "S";

const ChatAvatar = ({ src, name, mine = false }) => (
  <div
    className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold ${
      mine ? "[border-color:var(--moss)] [background:var(--moss-soft)] [color:var(--moss)]" : "[border-color:var(--brass)] [background:var(--brass-soft)] [color:var(--brass)]"
    }`}
    title={name || "Student"}
  >
    {src ? <img src={src} alt={name || "Student"} className="h-full w-full object-cover" /> : firstLetter(name)}
  </div>
);

const roleRing = (role) => {
  if (role === "owner") return "[border-color:var(--brass)]";
  if (role === "admin") return "[border-color:var(--moss)]";
  return "[border-color:var(--line)]";
};

const mentionToken = (member) => `@${(member?.name || "Student").replace(/\s+/g, "")}`;

/** Small perforated strip that reads as a punched index-card edge. */
const Perforation = () => (
  <div
    className="h-2.5 w-full"
    style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--line) 0px, var(--line) 3px, transparent 3px, transparent 9px)" }}
  />
);

const CoverPattern = ({ url }) =>
  url ? (
    <img src={url} alt="" className="h-full w-full object-cover" />
  ) : (
    <div
      className="h-full w-full"
      style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--moss) 0px, var(--moss) 12px, var(--brass) 12px, var(--brass) 14px)", opacity: 0.75 }}
    />
  );

function ReactionBar({ post, groupId, uid }) {
  const active = REACTIONS.filter((emoji) => (post.reactions?.[emoji] || 0) > 0);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      {active.map((emoji) => {
        const selected = post.userReactions?.[uid] === emoji;
        return (
          <button
            key={emoji}
            onClick={() => reactToPost(groupId, post.id, emoji, uid)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${FONT_MONO} transition ${
              selected ? "[border-color:var(--brass)] [background:var(--brass-soft)] [color:var(--brass)]" : "[border-color:var(--line)] [color:var(--ink-soft)] hover:[border-color:var(--brass)]"
            }`}
          >
            <span>{emoji}</span>
            <span>{post.reactions[emoji]}</span>
          </button>
        );
      })}
      <Menu width="w-auto" trigger={<span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border [border-color:var(--line)] transition hover:[border-color:var(--brass)]`}><Smile size={14} /></span>}>
        {(close) => (
          <div className="flex gap-1 p-1.5">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  reactToPost(groupId, post.id, emoji, uid);
                  close();
                }}
                className="rounded-lg p-1.5 text-lg transition hover:[background:var(--paper-sunken)]"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </Menu>
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated, user, profile }) {
  const [form, setForm] = useState({ name: "", description: "", category: "Academics", privacy: "public", rules: "" });
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
    <div className="fixed inset-0 top-0 z-[550] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-sm">
      <form onSubmit={submit} className={`quad-rise md:mt-10 w-full md:w-[70%] p-5 shadow-2xl md:p-7 ${cx.panel}`}>
        <div className="flex items-start justify-between gap-4 border-b pb-5 [border-color:var(--line)]">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${cx.muted} ${FONT_MONO}`}>New listing</p>
            <h2 className={`mt-1 text-2xl font-semibold ${FONT_DISPLAY}`}>Start a group</h2>
          </div>
          <button type="button" onClick={onClose} className={cx.ghostIcon} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input className={cx.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name" />
          <select className={cx.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.filter((item) => item !== "All").map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <textarea
            className={`${cx.input} md:col-span-2`}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this group for?"
          />

          <div className="md:col-span-2">
            <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.1em] ${cx.faint} ${FONT_MONO}`}>Privacy</p>
            <div className={`inline-flex rounded-lg border p-1 [border-color:var(--line)]`}>
              {["public", "private"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setForm({ ...form, privacy: option })}
                  className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
                    form.privacy === option ? "[background:var(--brass)] [color:var(--on-brass)]" : "[color:var(--ink-soft)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <input className={`${cx.input} md:col-span-2`} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Optional rules" />

          <label className={`cursor-pointer p-4 text-sm font-semibold ${cx.soft}`}>
            <span className="flex items-center gap-2"><ImageIcon size={16} /> Cover image</span>
            <input type="file" accept="image/*" className={`mt-3 w-full text-xs ${cx.muted}`} onChange={(e) => setCover(e.target.files?.[0] || null)} />
          </label>
          <label className={`cursor-pointer p-4 text-sm font-semibold ${cx.soft}`}>
            <span className="flex items-center gap-2"><UploadCloud size={16} /> Group avatar</span>
            <input type="file" accept="image/*" className={`mt-3 w-full text-xs ${cx.muted}`} onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
          </label>
        </div>

        {error && <div className="mt-4 rounded-lg border p-3 text-sm [border-color:var(--clay)] [background:var(--clay-soft)] [color:var(--clay)]">{error}</div>}

        <button disabled={saving} className={`${cx.primaryBtn} mt-6 w-full`}>
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
          {saving ? "Creating…" : "Create group"}
        </button>
      </form>
    </div>
  );
}

function GroupDiscovery() {
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
      setGroups((current) => (reset ? result.groups : [...current, ...result.groups]));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  return (
    <div className="md:mt-20">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className={`p-5 md:p-8 ${cx.panel}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${FONT_MONO} [color:var(--brass)]`}>Student-run · directory</p>
              <h1 className={`mt-3 text-4xl font-semibold leading-[1.05] md:text-5xl ${FONT_DISPLAY}`}>Campus Groups</h1>
              <p className={`mt-3 max-w-2xl text-sm leading-7 md:text-base ${cx.muted}`}>
                Find a group, request access where it's private, and keep chat scoped to the room you're actually in.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/messages" title="Messenger" className={cx.ghostIcon}>
                <MessageCircle size={18} />
              </Link>
              <Link to="/notifications" title="Notifications" className={cx.ghostIcon}>
                <Bell size={18} />
              </Link>
              <button onClick={() => setCreateOpen(true)} className={cx.primaryBtn}>
                <Plus size={17} /> Create group
              </button>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className={`flex flex-1 items-center gap-3 rounded-lg border px-4 [border-color:var(--line)] [background:var(--paper-sunken)]`}>
              <Search size={17} className={cx.faint} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search groups"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:[color:var(--ink-faint)]"
              />
            </div>

            {/* Mobile: compact select. Desktop: folder-tab style pills. */}
            <div className="relative sm:hidden">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${cx.input} appearance-none pr-10 text-xs font-semibold uppercase tracking-wide ${FONT_MONO}`}>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={15} className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${cx.faint}`} />
            </div>
            <div className="hidden gap-2 overflow-x-auto pb-1 sm:flex">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(category === item ? "All" : item)}
                  className={`h-11 shrink-0 rounded-lg px-4 text-xs font-semibold uppercase tracking-wide ${FONT_MONO} transition ${
                    category === item ? "[background:var(--brass)] [color:var(--on-brass)]" : `border [border-color:var(--line)] ${cx.muted} hover:[border-color:var(--brass)]`
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading && groups.length === 0 ? (
            <SkeletonCards />
          ) : groups.length === 0 ? (
            <EmptyState icon={Users} title="No groups found" text="Try another category or start the first group in this space." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/community/${group.id}`}
                  className={`quad-rise overflow-visible transition hover:-translate-y-1 hover:shadow-xl ${cx.panel}`}>
                  <div className="h-24 overflow-hidden">
                    <CoverPattern url={group.coverUrl} />
                  </div>
                  <Perforation />
                  <div className="p-5">
                    <div className="-mt-11 mb-4 flex items-end justify-between">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-xl font-bold [border-color:var(--paper-raised)] [background:var(--brass-soft)] [color:var(--brass)]">
                        {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : group.name?.charAt(0)}
                      </div>
                      {group.privacy === "private" && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold [background:var(--clay-soft)] [color:var(--clay)]`}>
                          <Lock size={11} /> Private
                        </span>
                      )}
                    </div>
                    <h2 className={`text-lg font-semibold ${FONT_DISPLAY}`}>{group.name}</h2>
                    <p className={`mt-2 line-clamp-2 text-sm leading-6 ${cx.muted}`}>{group.description}</p>
                    <div className={`mt-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wide ${FONT_MONO}`}>
                      <span className="[color:var(--brass)]">{group.category}</span>
                      <span className={cx.faint}>·</span>
                      <span className={cx.muted}>{group.memberCount || 0} members</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button onClick={() => load()} disabled={loading} className={cx.ghostBtn}>
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateGroupModal user={user} profile={profile} onClose={() => setCreateOpen(false)} onCreated={(id) => navigate(`/community/${id}`)} />
      )}
    </div>
  );
}

function Composer({ placeholder, onSend, allowVideo = true, replyTo = null, onCancelReply, mentionMembers = [] }) {
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
      const mentions = mentionMembers
        .filter((member) => text.includes(mentionToken(member)))
        .map((member) => ({ uid: member.id || member.uid, name: member.name || "Student" }));

      await onSend({
        text: text.trim(),
        attachments,
        mentions,
        replyTo: replyTo
          ? { id: replyTo.id, senderId: replyTo.senderId || "", senderName: replyTo.senderName || "Student", text: messagePreview(replyTo) }
          : null,
      });
      setText("");
      setFile(null);
      onCancelReply?.();
    } catch (err) {
      setError(err?.errors?.[0] || err.message || "Could not send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`p-3 ${cx.panel}`}>
      {replyTo && (
        <div className={`mb-3 flex items-start justify-between gap-3 p-3 text-xs ${cx.soft}`}>
          <div className="min-w-0">
            <p className="font-semibold">Replying to {replyTo.senderName || "Student"}</p>
            <p className={`mt-1 line-clamp-1 ${cx.muted}`}>{messagePreview(replyTo)}</p>
          </div>
          <button type="button" onClick={onCancelReply} className="shrink-0 rounded p-1 [color:var(--clay)] hover:[background:var(--clay-soft)]" aria-label="Cancel reply">
            <X size={14} />
          </button>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none border-0 bg-transparent text-sm outline-none placeholder:[color:var(--ink-faint)]"
      />
      {mentionMembers.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {mentionMembers.slice(0, 8).map((member) => (
            <button
              key={member.id || member.uid}
              type="button"
              onClick={() => setText((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${mentionToken(member)} `)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${FONT_MONO} ${cx.soft} ${cx.muted}`}
            >
              {mentionToken(member)}
            </button>
          ))}
        </div>
      )}
      {file && (
        <div className={`mt-3 flex items-center justify-between p-2.5 text-xs ${cx.soft}`}>
          <span className="truncate">{file.name}</span>
          <button onClick={() => setFile(null)} className="shrink-0 [color:var(--clay)]"><X size={14} /></button>
        </div>
      )}
      {error && <div className="mt-3 rounded-lg p-2.5 text-xs [background:var(--clay-soft)] [color:var(--clay)]">{error}</div>}
      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 [border-color:var(--line)]">
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${cx.soft} ${cx.muted}`}>
          <UploadCloud size={15} /> Attach
          <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button onClick={submit} disabled={sending || (!text.trim() && !file)} className={cx.primaryBtn}>
          {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send
        </button>
      </div>
    </div>
  );
}

function GroupDetail({ groupId }) {
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
  const [replyTo, setReplyTo] = useState(null);
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
    if (!isMember || (tab !== "Members" && tab !== "Chat")) return undefined;
    const membersQuery = query(collection(db, "groups", groupId, "members"), orderBy("joinedAt", "desc"), limit(50));
    const run = async () => {
      const snap = await getDocs(membersQuery);
      setMembers(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    };
    run();
    if (canManage) {
      getDocs(query(collection(db, "groups", groupId, "joinRequests"), orderBy("requestedAt", "desc"), limit(30))).then((snap) =>
        setRequests(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
      );
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
  const sendChat = async (payload) => {
    await sendGroupMessage(groupId, user, profile, payload);
    setReplyTo(null);
  };

  const openDirectMessage = (uid) => {
    if (!uid || uid === user?.uid) return;
    navigate(`/messages?user=${encodeURIComponent(uid)}`);
  };

  const mediaItems = posts.flatMap((post) => (post.attachments || []).filter((item) => item.type === "image" || item.type === "video").map((item) => ({ ...item, postId: post.id })));
  const fileItems = posts.flatMap((post) => (post.attachments || []).filter((item) => item.type === "pdf" || item.type === "document").map((item) => ({ ...item, postId: post.id })));

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <SkeletonCards />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState icon={Users} title="Group not found" text="This group may have been deleted." />
      </div>
    );
  }

  return (
    <div className="md:mt-20">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <button onClick={() => navigate("/community")} className={`${cx.ghostBtn} mb-4 px-3`}>
          <ChevronLeft size={16} /> Groups
        </button>

        <div className={`${cx.panel} overflow-visible`}>
          <div className="h-40 overflow-hidden md:h-56">
            <CoverPattern url={group.coverUrl} />
          </div>
          <Perforation />
          <div className="p-5 md:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="-mt-16 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 text-3xl font-bold [border-color:var(--paper-raised)] [background:var(--brass-soft)] [color:var(--brass)]">
                  {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" /> : group.name?.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={`text-3xl font-semibold leading-tight md:text-4xl ${FONT_DISPLAY}`}>{group.name}</h1>
                    {group.privacy === "private" && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold [background:var(--clay-soft)] [color:var(--clay)]`}>
                        <Lock size={11} /> Private
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 max-w-2xl text-sm leading-7 ${cx.muted}`}>{group.description}</p>
                  <div className={`mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wide ${FONT_MONO}`}>
                    <span className="[color:var(--brass)]">{group.category}</span>
                    <span className={cx.faint}>·</span>
                    <span className={cx.muted}><Users2 size={12} className="mr-1 inline" />{group.memberCount || 0} members</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 normal-case tracking-normal [border-color:var(--line)] ${cx.muted}`}
                      style={{ transform: "rotate(-1deg)" }}
                    >
                      <Calendar size={11} /> est. {formatShortTime(group.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isMember ? (
                  <>
                    <button onClick={() => setTab("Chat")} className={cx.primaryBtn}>
                      <MessageCircle size={17} /> Open chat
                    </button>
                    <Menu trigger={<span className={cx.ghostIcon}><MoreHorizontal size={18} /></span>}>
                      {(close) => (
                        <>
                          <MenuItem icon={MessageCircle} label="Direct messages" onClick={() => { close(); navigate("/messages"); }} />
                          <MenuItem icon={Settings} label="Messaging settings" onClick={() => { close(); navigate("/community-settings"); }} />
                          {canManage && (
                            <MenuItem icon={ShieldCheck} label="Manage group" onClick={() => { close(); navigate(`/community/${groupId}/manage`); }} />
                          )}
                          {membership?.role !== "owner" && (
                            <MenuItem
                              icon={UserMinus}
                              label="Leave group"
                              tone="danger"
                              onClick={async () => {
                                close();
                                await leaveGroup(group, user.uid);
                                await refresh();
                              }}
                            />
                          )}
                        </>
                      )}
                    </Menu>
                  </>
                ) : (
                  <button onClick={join} disabled={busy || pendingRequest} className={cx.primaryBtn}>
                    {busy ? <Loader2 className="animate-spin" size={17} /> : group.privacy === "private" ? <Lock size={17} /> : <Plus size={17} />}
                    {pendingRequest ? "Request pending" : group.privacy === "private" ? "Request to join" : "Join group"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isMember ? (
          <div className="mt-6">
            <EmptyState
              icon={Lock}
              title={group.privacy === "private" ? "Private group" : "Join to participate"}
              text="Membership is required before posts, chat, media, and files are loaded."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0">
              <div className="flex gap-1 overflow-x-auto border-b [border-color:var(--line)]">
                {TABS.map((item) => {
                  const active = tab === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setTab(item)}
                      style={{
                        clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
                      }}
                      className={`relative -mb-px shrink-0 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${FONT_MONO} ${
                        active ? "z-10 [background:var(--paper-raised)] [color:var(--ink)]" : `${cx.faint} hover:[color:var(--ink)]`
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className={`space-y-5 rounded-b-2xl rounded-tr-2xl border p-4 md:p-5 [border-color:var(--line)] [background:var(--paper-raised)]`}>
                {tab === "Feed" && (
                  <>
                    <Composer placeholder="Share an update, question, PDF, or study resource…" onSend={sendPost} allowVideo={isPremium} />
                    {posts.length === 0 ? (
                      <EmptyState icon={MessageCircle} title="No posts yet" text="Start the group feed with a helpful update." />
                    ) : (
                      posts.map((post) => (
                        <article key={post.id} className={`quad-rise p-5 ${cx.soft}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl [background:var(--brass-soft)]">
                                {post.authorAvatar && <img src={post.authorAvatar} alt="" className="h-full w-full object-cover" />}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{post.authorName}</p>
                                <p className={`text-xs ${cx.faint} ${FONT_MONO}`}>{formatShortTime(post.createdAt)}</p>
                              </div>
                            </div>
                            {post.authorId === user.uid && (
                              <button onClick={() => deleteOwnPost(groupId, post.id)} className="shrink-0 rounded-lg p-1.5 [color:var(--clay)] hover:[background:var(--clay-soft)]" aria-label="Delete post">
                                <X size={16} />
                              </button>
                            )}
                          </div>
                          {post.text && <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{post.text}</p>}
                          {(post.attachments || []).map((item, index) => (
                            <AttachmentPreview key={`${post.id}-${index}`} attachment={item} />
                          ))}
                          <ReactionBar post={post} groupId={groupId} uid={user.uid} />
                        </article>
                      ))
                    )}
                  </>
                )}

                {tab === "Chat" && (
                  <div className="-m-4 overflow-hidden rounded-b-2xl rounded-tr-2xl md:-m-5">
                    <div className="max-h-[65vh] overflow-y-auto p-4 md:max-h-[70vh]">
                      {messageCursor && (
                        <button
                          onClick={async () => {
                            const older = await loadOlderGroupMessages(groupId, messageCursor);
                            setMessages((current) => [...older.messages, ...current]);
                            setMessageCursor(older.cursor || messageCursor);
                          }}
                          className={`mx-auto mb-4 block rounded-full px-4 py-1.5 text-xs font-semibold ${FONT_MONO} ${cx.soft} ${cx.muted}`}
                        >
                          Load older
                        </button>
                      )}
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const mine = message.senderId === user.uid;
                          const senderName = mine ? profile.username || user?.displayName || "You" : message.senderName || "Student";
                          const senderAvatar = mine ? message.senderAvatar || profile.photo || user?.photoURL || "" : message.senderAvatar || "";
                          return (
                            <div key={message.id} className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                              {!mine && (
                                <span onClick={() => openDirectMessage(message.senderId)} className="cursor-pointer">
                                  <ChatAvatar src={senderAvatar} name={senderName} />
                                </span>
                              )}
                              <div className={`relative max-w-[86%] p-3 ${mine ? "rounded-2xl rounded-br-sm [background:var(--moss)] [color:var(--paper)]" : `rounded-2xl rounded-bl-sm ${cx.soft}`}`}>
                                <div className="flex items-center justify-between gap-3">
                                  <p className={`text-[11px] font-semibold opacity-80 ${FONT_MONO}`}>
                                    {senderName} · {formatShortTime(message.createdAt)}
                                  </p>
                                  <button
                                    onClick={() => setReplyTo(message)}
                                    className="rounded p-1 opacity-0 transition group-hover:opacity-70 hover:!opacity-100 focus:opacity-100"
                                    aria-label="Reply to message"
                                    title="Reply"
                                  >
                                    <Reply size={13} />
                                  </button>
                                </div>
                                {message.replyTo && (
                                  <div className={`mt-2 rounded-lg border-l-2 p-2 text-xs ${mine ? "border-white/50 bg-white/10" : "[border-color:var(--brass)] [background:var(--brass-soft)]"}`}>
                                    <p className="font-semibold opacity-80">{message.replyTo.senderName}</p>
                                    <p className="mt-0.5 line-clamp-2 opacity-75">{message.replyTo.text}</p>
                                  </div>
                                )}
                                {message.mentions?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {message.mentions.map((mention) => (
                                      <button
                                        key={mention.uid || mention.name}
                                        onClick={() => openDirectMessage(mention.uid)}
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mine ? "bg-white/15" : "[background:var(--brass-soft)] [color:var(--brass)]"}`}
                                      >
                                        @{mention.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {message.text && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
                                {(message.attachments || []).map((item, index) => (
                                  <AttachmentPreview key={index} attachment={item} />
                                ))}
                              </div>
                              {mine && <ChatAvatar src={senderAvatar} name={senderName} mine />}
                            </div>
                          );
                        })}
                        <div ref={bottomRef} />
                      </div>
                    </div>
                    <div className="border-t p-3 [border-color:var(--line)]">
                      <Composer
                        placeholder="Message this group…"
                        onSend={sendChat}
                        allowVideo={isPremium}
                        replyTo={replyTo}
                        onCancelReply={() => setReplyTo(null)}
                        mentionMembers={members.filter((member) => member.id !== user?.uid)}
                      />
                    </div>
                  </div>
                )}

                {tab === "Members" && (
                  <div className="space-y-4">
                    {canManage && requests.length > 0 && (
                      <div className={`p-4 ${cx.soft}`}>
                        <h2 className={`text-sm font-semibold uppercase tracking-wide ${FONT_MONO}`}>Join requests</h2>
                        <div className="mt-3 space-y-2">
                          {requests.map((request) => (
                            <div key={request.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-3 [background:var(--paper-raised)]`}>
                              <span className="text-sm font-semibold">{request.name}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    await approveJoinRequest(group, request);
                                    setRequests((items) => items.filter((item) => item.id !== request.id));
                                  }}
                                  className="rounded-lg p-2 [background:var(--moss-soft)] [color:var(--moss)]"
                                  aria-label="Approve"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  onClick={async () => {
                                    await rejectJoinRequest(group, request);
                                    setRequests((items) => items.filter((item) => item.id !== request.id));
                                  }}
                                  className="rounded-lg p-2 [background:var(--clay-soft)] [color:var(--clay)]"
                                  aria-label="Reject"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {members.map((member) => (
                        <button key={member.id} onClick={() => openDirectMessage(member.id)} className={`flex items-center gap-3 p-3 text-left ${cx.soft}`}>
                          <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 ${roleRing(member.role)} [background:var(--brass-soft)]`}>
                            {member.avatar && <img src={member.avatar} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{member.name}</p>
                            <p className={`text-[11px] font-semibold uppercase tracking-wide ${FONT_MONO} ${cx.muted}`}>{member.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "Media" &&
                  (mediaItems.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {mediaItems.map((item, index) => (
                        <AttachmentPreview key={index} attachment={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={ImageIcon} title="No media yet" text="Images and videos from posts will appear here." />
                  ))}

                {tab === "Files" &&
                  (fileItems.length ? (
                    <div className="space-y-3">
                      {fileItems.map((item, index) => (
                        <AttachmentPreview key={index} attachment={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={FileText} title="No files yet" text="PDFs and documents from posts will appear here." />
                  ))}

                {tab === "About" && (
                  <div>
                    <h2 className={`text-xl font-semibold ${FONT_DISPLAY}`}>About</h2>
                    <p className={`mt-3 leading-7 ${cx.muted}`}>{group.description}</p>
                    <h3 className={`mt-6 text-sm font-semibold uppercase tracking-wide ${FONT_MONO}`}>Rules</h3>
                    <p className={`mt-2 leading-7 ${cx.muted}`}>{group.rules || "No rules added yet."}</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className={`p-5 ${cx.panel}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${FONT_MONO} ${cx.faint}`}>Group health</h3>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className={`p-3 ${cx.soft}`}>
                    <p className={`text-lg font-semibold ${FONT_DISPLAY}`}>{group.memberCount || 0}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${cx.faint} ${FONT_MONO}`}>Members</p>
                  </div>
                  <div className={`p-3 ${cx.soft}`}>
                    <p className={`text-lg font-semibold ${FONT_DISPLAY}`}>{group.postCount || 0}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${cx.faint} ${FONT_MONO}`}>Posts</p>
                  </div>
                  <div className={`p-3 ${cx.soft}`}>
                    <p className={`text-lg font-semibold ${FONT_DISPLAY}`}>{group.fileCount || 0}</p>
                    <p className={`text-[10px] uppercase tracking-wide ${cx.faint} ${FONT_MONO}`}>Files</p>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden ${cx.panel}`}>
                <h3 className={`px-5 pt-5 text-xs font-semibold uppercase tracking-[0.14em] ${FONT_MONO} ${cx.faint}`}>Shortcuts</h3>
                <div className="mt-3">
                  <Link to="/messages" className="flex items-center justify-between px-5 py-3 text-sm font-semibold transition hover:[background:var(--paper-sunken)]">
                    Direct messages <MessageCircle size={16} className={cx.muted} />
                  </Link>
                  <Link to="/community-settings" className="flex items-center justify-between px-5 py-3 text-sm font-semibold transition hover:[background:var(--paper-sunken)]">
                    Messaging settings <Settings size={16} className={cx.muted} />
                  </Link>
                  {canManage && (
                    <Link to={`/community/${groupId}/manage`} className="flex items-center justify-between px-5 py-3 text-sm font-semibold transition hover:[background:var(--paper-sunken)]">
                      Manage group <ShieldCheck size={16} className="[color:var(--brass)]" />
                    </Link>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Community({ dark = false }) {
  const { groupId } = useParams();
  return (
    <PageChrome dark={dark}>
      {groupId ? <GroupDetail groupId={groupId} /> : <GroupDiscovery />}
    </PageChrome>
  );
}