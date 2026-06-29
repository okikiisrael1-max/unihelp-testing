import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  CheckCheck,
  FileText,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Settings,
  Smile,
  UploadCloud,
  User2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { db } from "../../firebase/config";
import { uploadFile } from "../../services/cloudinary";
import { AuthContext } from "../context/AuthContext";
import {
  formatShortTime,
  getCurrentUserProfile,
  listenConversationMessages,
  markConversationRead,
  searchUsers,
  sendDirectMessage,
  startConversation,
} from "../service/communityService";

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : "bg-white border-slate-200 text-slate-900",
  muted: dark ? "text-slate-400" : "text-slate-500",
});

const kindFor = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "document";
};

const Attachment = ({ item }) => {
  if (item.type === "image") return <img src={item.url} alt={item.name || ""} className="mt-3 max-h-72 rounded-2xl object-cover" />;
  if (item.type === "video") return <video src={item.url} controls className="mt-3 max-h-72 rounded-2xl bg-black" />;
  return <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-400"><FileText size={17} /> {item.name || "Open file"}</a>;
};

export default function Messenger({ dark = false }) {
  const t = theme(dark);
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({});
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState("");
  const bottomRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) || null,
    [activeId, conversations]
  );

  const otherUser = useMemo(() => {
    if (!activeConversation || !user?.uid) return null;
    const otherId = activeConversation.memberIds?.find((id) => id !== user.uid);
    return activeConversation.memberInfo?.[otherId] || null;
  }, [activeConversation, user]);

  useEffect(() => {
    getCurrentUserProfile(user).then((data) => setProfile(data || {}));
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const q = query(
      collection(db, "conversations"),
      where("memberIds", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
      limit(30)
    );
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      setConversations(items);
      setActiveId((current) => current || items[0]?.id || "");
    });
  }, [user]);

  useEffect(() => {
    if (!activeId || !user?.uid) return undefined;
    markConversationRead(activeId, user.uid).catch(console.error);
    return listenConversationMessages(activeId, (items) => {
      setMessages(items);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
  }, [activeId, user]);

  useEffect(() => {
    const value = search.trim();
    if (value.length < 2 || !user?.uid) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      const found = await searchUsers(value, user.uid);
      setResults(found);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, user]);

  useEffect(() => {
    if (!activeId || !user?.uid) return undefined;
    const typingRef = doc(db, "conversations", activeId, "typing", user.uid);
    if (!typing) {
      setDoc(typingRef, { active: false, updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
      return undefined;
    }
    setDoc(typingRef, { active: true, name: profile.username || user.displayName || "Student", updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
    const timer = setTimeout(() => setTyping(false), 1500);
    return () => clearTimeout(timer);
  }, [activeId, profile, typing, user]);

  const openUser = async (item) => {
    setNotice("");
    const targetSnap = await getDoc(doc(db, "users", item.id));
    const target = targetSnap.exists() ? targetSnap.data() : {};

    if (target.dmsDisabled) {
      setNotice("This user has disabled direct messages.");
      return;
    }

    if (target.dmPolicy === "mutual_groups") {
      const [mine, theirs] = await Promise.all([
        getDocs(query(collection(db, "users", user.uid, "groups"), limit(20))),
        getDocs(query(collection(db, "users", item.id, "groups"), limit(20))),
      ]);
      const myGroups = new Set(mine.docs.map((entry) => entry.id));
      const hasMutualGroup = theirs.docs.some((entry) => myGroups.has(entry.id));

      if (!hasMutualGroup) {
        setNotice("This user only accepts DMs from mutual groups.");
        return;
      }
    }

    const id = await startConversation(user, item, profile);
    setActiveId(id);
    setSearch("");
    setResults([]);
  };

  const send = async () => {
    if (!activeConversation || (!text.trim() && !file)) return;
    setSending(true);
    try {
      const attachments = [];
      if (file) {
        const uploaded = await uploadFile(file);
        attachments.push({
          type: kindFor(file),
          url: uploaded.secure_url,
          name: uploaded.original_filename || file.name,
          bytes: uploaded.bytes || file.size,
        });
      }
      await sendDirectMessage(activeConversation, user, profile, { text: text.trim(), attachments });
      setText("");
      setFile(null);
      setTyping(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto grid min-h-screen max-w-7xl gap-4 px-4 py-6 md:px-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className={`rounded-3xl border ${t.panel}`}>
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black">Messenger</h1>
                <p className={`text-sm ${t.muted}`}>Direct messages</p>
              </div>
              <Link to="/community-settings" className={`rounded-2xl border p-3 ${t.soft}`} aria-label="Messaging settings"><Settings size={18} /></Link>
            </div>
            <div className={`mt-4 flex items-center gap-3 rounded-2xl border px-3 ${t.soft}`}>
              <Search size={17} className="opacity-50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" className="h-11 w-full bg-transparent text-sm outline-none" />
            </div>
            {results.length > 0 && (
              <div className={`mt-3 max-h-64 overflow-y-auto rounded-2xl border ${t.soft}`}>
                {results.map((item) => (
                  <button key={item.id} onClick={() => openUser(item)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-indigo-500/10">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-indigo-500/10">{item.photo ? <img src={item.photo} alt="" className="h-full w-full object-cover" /> : <User2 size={18} />}</div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item.username || item.email || "Student"}</p>
                      <p className={`truncate text-xs ${t.muted}`}>{item.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {notice && (
              <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-semibold text-amber-400">
                {notice}
              </div>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-3">
            {conversations.length === 0 ? (
              <div className={`rounded-3xl border p-6 text-center ${t.soft}`}>
                <MessageCircle className="mx-auto opacity-40" />
                <p className="mt-3 font-bold">No conversations yet</p>
                <p className={`mt-1 text-sm ${t.muted}`}>Search for a student to start one.</p>
              </div>
            ) : conversations.map((item) => {
              const otherId = item.memberIds?.find((id) => id !== user?.uid);
              const other = item.memberInfo?.[otherId] || {};
              const unread = item.unread?.[user?.uid] || 0;
              return (
                <button key={item.id} onClick={() => setActiveId(item.id)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${activeId === item.id ? "border-indigo-500 bg-indigo-500/10" : t.soft}`}>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">{other.avatar ? <img src={other.avatar} alt="" className="h-full w-full object-cover" /> : <User2 className="m-3" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold">{other.name || "Student"}</p>
                      <span className={`shrink-0 text-[11px] ${t.muted}`}>{formatShortTime(item.updatedAt)}</span>
                    </div>
                    <p className={`truncate text-sm ${t.muted}`}>{item.lastMessage || "Say hello"}</p>
                  </div>
                  {unread > 0 && <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs font-bold text-white">{unread}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        <main className={`flex min-h-[80vh] flex-col overflow-hidden rounded-3xl border ${t.panel}`}>
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-indigo-500/10">{otherUser?.avatar ? <img src={otherUser.avatar} alt="" className="h-full w-full object-cover" /> : <User2 className="m-3" />}</div>
                  <div>
                    <h2 className="font-black">{otherUser?.name || "Student"}</h2>
                    <p className={`text-xs ${t.muted}`}>Delivered, read receipts, attachments</p>
                  </div>
                </div>
                <CheckCheck className="text-indigo-400" size={20} />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {messages.map((message) => {
                    const mine = message.senderId === user?.uid;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[86%] rounded-3xl border p-3 ${mine ? "border-indigo-500 bg-indigo-600 text-white" : t.soft}`}>
                          <p className="text-xs font-bold opacity-75">{formatShortTime(message.createdAt)}</p>
                          {message.text && <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
                          {(message.attachments || []).map((item, index) => <Attachment key={index} item={item} />)}
                          {mine && <div className="mt-2 flex justify-end"><CheckCheck size={14} /></div>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="border-t border-white/10 p-3">
                {file && <div className={`mb-3 flex items-center justify-between rounded-2xl border p-3 text-xs ${t.soft}`}><span>{file.name}</span><button onClick={() => setFile(null)}><X size={15} /></button></div>}
                <div className={`flex items-end gap-2 rounded-3xl border p-3 ${t.soft}`}>
                  <button className="rounded-2xl p-3 hover:bg-indigo-500/10" aria-label="Emoji"><Smile size={18} /></button>
                  <label className="cursor-pointer rounded-2xl p-3 hover:bg-indigo-500/10" aria-label="Attach file">
                    <UploadCloud size={18} />
                    <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <textarea value={text} onChange={(e) => { setText(e.target.value); setTyping(true); }} rows={1} placeholder="Message..." className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
                  <button onClick={send} disabled={sending || (!text.trim() && !file)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white disabled:opacity-50">
                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto opacity-35" size={54} />
                <h2 className="mt-4 text-2xl font-black">Choose a conversation</h2>
                <p className={`mt-2 text-sm ${t.muted}`}>Only the opened conversation gets a real-time listener.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
