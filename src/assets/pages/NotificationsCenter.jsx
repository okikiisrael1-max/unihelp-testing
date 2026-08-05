import React, { useContext, useEffect, useState } from "react";
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
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { formatShortTime, PAGE_SIZE } from "../service/communityService";

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  muted: dark ? "text-slate-400" : "text-slate-500",
});

export default function NotificationsCenter({ dark = false }) {
  const t = theme(dark);
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

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
      setItems((current) => reset ? next : [...current, ...next]);
      setCursor(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, [user?.uid]);

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", user.uid, "items", id), { read: true });
    setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAllRead = async () => {
    await Promise.all(items.filter((item) => !item.read).slice(0, PAGE_SIZE).map((item) => updateDoc(doc(db, "notifications", user.uid, "items", item.id), { read: true })));
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className={`rounded-3xl border p-5 md:p-7 ${t.panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
                <Bell size={14} /> Notifications
              </div>
              <h1 className="mt-4 text-3xl font-black">Notification Center</h1>
              <p className={`mt-2 text-sm ${t.muted}`}>Loaded in small pages to keep Firestore usage low.</p>
            </div>
            <button onClick={markAllRead} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${t.soft}`}>
              <CheckCheck size={17} /> Mark visible as read
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading && items.length === 0 ? (
            <div className={`rounded-3xl border p-8 text-center ${t.panel}`}><Loader2 className="mx-auto animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className={`rounded-3xl border p-8 text-center ${t.panel}`}>
              <Bell className="mx-auto opacity-35" size={48} />
              <h2 className="mt-4 text-xl font-black">No notifications</h2>
              <p className={`mt-2 text-sm ${t.muted}`}>DMs, comments, reactions, replies, mentions, and group requests will appear here.</p>
            </div>
          ) : items.map((item) => {
            const href = item.conversationId ? "/messages" : item.groupId ? `/community/${item.groupId}` : "#";
            return (
              <div key={item.id} className={`rounded-3xl border p-4 ${item.read ? t.panel : "border-indigo-500 bg-indigo-500/10"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link to={href} className="min-w-0 flex-1">
                    <p className="font-black">{item.title}</p>
                    <p className={`mt-1 text-sm ${t.muted}`}>{item.body}</p>
                    <p className={`mt-2 text-xs ${t.muted}`}>{formatShortTime(item.createdAt)}</p>
                  </Link>
                  {!item.read && <button onClick={() => markRead(item.id)} className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">Mark read</button>}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => load(false)} disabled={loading} className={`rounded-2xl border px-5 py-3 text-sm font-bold ${t.soft}`}>
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
