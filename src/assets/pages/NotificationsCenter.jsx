import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import {
  AtSign,
  Bell,
  CheckCheck,
  Heart,
  Loader2,
  MessageCircle,
  MessageSquare,
  Reply,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { formatShortTime, PAGE_SIZE } from "../service/communityService";

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  card: dark
    ? "bg-white/[0.05] border border-white/10"
    : "bg-white border border-slate-200/80 shadow-sm",
  soft: dark ? "bg-white/[0.04] border border-white/10" : "bg-slate-50 border border-slate-200",
  iconTint: dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600",
  muted: dark ? "text-slate-400" : "text-slate-500",
  faint: dark ? "text-slate-500" : "text-slate-400",
  border: dark ? "border-white/10" : "border-slate-200",
});

// Icon + color per notification type, purely cosmetic. Extend this as you
// add notification types on the backend.
const NOTIF_META = (dark) => ({
  dm: { icon: MessageCircle, tint: dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600" },
  message: { icon: MessageCircle, tint: dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600" },
  comment: { icon: MessageSquare, tint: dark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600" },
  reply: { icon: Reply, tint: dark ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-600" },
  mention: { icon: AtSign, tint: dark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600" },
  reaction: { icon: Heart, tint: dark ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-600" },
  group_request: { icon: Users, tint: dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600" },
  group_invite: { icon: UserPlus, tint: dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600" },
});

const getMeta = (item, dark) =>
  NOTIF_META(dark)[item.type] || {
    icon: Bell,
    tint: dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500",
  };

/**
 * Where a notification should take the user when clicked.
 *
 * ASSUMPTION: this expects your notification docs to carry a `type` field
 * ("dm" | "comment" | "reply" | "mention" | "reaction" | "group_request" |
 * "group_invite") plus whichever of conversationId / groupId / postId /
 * commentId apply. If your actual schema or route paths differ, adjust the
 * cases below — the important part is that every notification type resolves
 * to a specific destination instead of a generic page.
 */
const resolveHref = (item) => {
  switch (item.type) {
    case "dm":
    case "message":
      return item.conversationId ? `/messages/${item.conversationId}` : "/messages";

    case "comment":
    case "reply":
    case "mention":
      if (item.groupId && item.postId) {
        return `/community/${item.groupId}/posts/${item.postId}${
          item.commentId ? `#comment-${item.commentId}` : ""
        }`;
      }
      return item.groupId ? `/community/${item.groupId}` : null;

    case "reaction":
      if (item.groupId && item.postId) {
        return `/community/${item.groupId}/posts/${item.postId}`;
      }
      return item.groupId ? `/community/${item.groupId}` : null;

    case "group_request":
    case "group_invite":
      return item.groupId ? `/community/${item.groupId}/requests` : "/community";

    default:
      // No known type — fall back to whatever identifiers are present.
      if (item.conversationId) return `/messages/${item.conversationId}`;
      if (item.groupId && item.postId) return `/community/${item.groupId}/posts/${item.postId}`;
      if (item.groupId) return `/community/${item.groupId}`;
      return null;
  }
};

export default function NotificationsCenter({ dark = false }) {
  const t = theme(dark);
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async (reset = false) => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const clauses = [
        collection(db, "notifications", user.uid, "items"),
        orderBy("createdAt", "desc"),
      ];
      if (!reset && cursor) clauses.push(startAfter(cursor));
      clauses.push(limit(PAGE_SIZE));
      const snap = await getDocs(query(...clauses));
      const next = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      setItems((current) => (reset ? next : [...current, ...next]));
      setCursor(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const markRead = async (id) => {
    if (!user?.uid) return;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    try {
      await updateDoc(doc(db, "notifications", user.uid, "items", id), { read: true });
    } catch (err) {
      console.log(err);
    }
  };

  const markVisibleRead = async () => {
    const unread = items.filter((item) => !item.read);
    if (unread.length === 0) return;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await Promise.all(
        unread.map((item) => updateDoc(doc(db, "notifications", user.uid, "items", item.id), { read: true }))
      );
    } catch (err) {
      console.log(err);
    }
  };

  // Clicking a notification opens its destination immediately; marking it
  // read happens in the background so navigation is never blocked on it.
  const handleOpen = (item) => {
    if (!item.read) markRead(item.id);
  };

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const visibleItems = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.read);
    return items;
  }, [items, filter]);

  return (
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className={`rounded-[28px] border p-5 md:p-7 ${t.card}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${t.iconTint}`}>
                <Bell size={14} /> Notifications
              </div>
              <h1 className="mt-4 text-2xl md:text-3xl font-black">Notification Center</h1>
              <p className={`mt-2 text-sm ${t.muted}`}>
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                  : "You're all caught up."}
              </p>
            </div>

            <button
              onClick={markVisibleRead}
              disabled={unreadCount === 0}
              className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition hover:border-indigo-400/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${t.soft}`}
            >
              <CheckCheck size={17} /> Mark loaded as read
            </button>
          </div>

          {/* FILTER TABS */}
          <div className="mt-6 flex gap-2">
            {[
              { key: "all", label: `All (${items.length})` },
              { key: "unread", label: `Unread (${unreadCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  filter === tab.key
                    ? "bg-indigo-500 text-white"
                    : `${t.soft} hover:text-indigo-500`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================================================= */}
        {/* LIST */}
        {/* ================================================= */}

        <div className="mt-5 space-y-3">
          {loading && items.length === 0 ? (
            <div className={`rounded-[24px] border p-8 text-center ${t.card}`}>
              <Loader2 className="mx-auto animate-spin text-indigo-500" />
            </div>
          ) : visibleItems.length === 0 ? (
            <div className={`rounded-[24px] border p-8 text-center ${t.card}`}>
              <Bell className="mx-auto opacity-35" size={48} />
              <h2 className="mt-4 text-xl font-black">
                {filter === "unread" ? "Nothing unread" : "No notifications"}
              </h2>
              <p className={`mt-2 text-sm ${t.muted}`}>
                {filter === "unread"
                  ? "You've read everything that's loaded so far."
                  : "DMs, comments, reactions, replies, mentions, and group requests will appear here."}
              </p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const href = resolveHref(item);
              const meta = getMeta(item, dark);
              const Icon = meta.icon;

              const cardClasses = `group flex items-start gap-3.5 rounded-[24px] border p-4 md:p-5 transition-all duration-200 ${
                item.read
                  ? `${t.card} hover:-translate-y-0.5`
                  : `${dark ? "bg-indigo-500/[0.07]" : "bg-indigo-500/[0.05]"} border-indigo-500/40 hover:-translate-y-0.5`
              }`;

              const body = (
                <>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.tint}`}>
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                      <p className={item.read ? "font-bold" : "font-black"}>{item.title}</p>
                    </div>
                    <p className={`mt-1 text-sm leading-6 ${t.muted}`}>{item.body}</p>
                    <p className={`mt-2 text-xs ${t.faint}`}>{formatShortTime(item.createdAt)}</p>
                  </div>
                </>
              );

              return (
                <div key={item.id} className="flex items-start gap-2">
                  {href ? (
                    <Link
                      to={href}
                      onClick={() => handleOpen(item)}
                      className={`${cardClasses} min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={`${cardClasses} min-w-0 flex-1 cursor-default`}>{body}</div>
                  )}

                  {!item.read && (
                    <button
                      onClick={() => markRead(item.id)}
                      aria-label="Mark notification as read"
                      title="Mark as read"
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition hover:border-indigo-400/60 hover:text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${t.soft}`}
                    >
                      <CheckCheck size={15} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ================================================= */}
        {/* LOAD MORE */}
        {/* ================================================= */}

        {hasMore && filter === "all" && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => load(false)}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition hover:border-indigo-400/60 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${t.soft}`}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}