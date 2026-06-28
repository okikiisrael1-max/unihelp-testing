import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
} from "firebase/firestore";

import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
} from "firebase/database";

import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "../../firebase/config";

import {
  AtSign,
  CheckCheck,
  Clock3,
  Hash,
  Loader2,
  MessageSquareMore,
  Mic2,
  Reply,
  Search,
  SendHorizontal,
  Smile,
  Sparkles,
  User2,
  Users,
  X,
} from "lucide-react";

const ROOM_ID = "campus-global";
const INITIAL_LIMIT = 24;
const LOAD_MORE_LIMIT = 20;
const EMOJIS = [
  "\u{1F525}",
  "\u{2764}\u{FE0F}",
  "\u{1F602}",
  "\u{1F44D}",
  "\u{1F62D}",
  "\u{1F389}",
  "\u{1F60E}",
  "\u{1F64F}",
];

const formatTime = (value) => {
  if (!value?.toDate) return "";

  return value.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initialTheme = (dark) => ({
  bg: dark ? "bg-[#050816]" : "bg-[#f4f7fb]",
  text: dark ? "text-white" : "text-slate-900",
  sub: dark ? "text-white/65" : "text-slate-600",
  border: dark ? "border-white/10" : "border-slate-200",
  glass: dark ? "bg-white/[0.05]" : "bg-white/70",
  bubble: dark ? "bg-[#0f172a]" : "bg-white",
});

const StatCard = ({ dark, icon: Icon, label, value, accent }) => (
  <div
    className={`rounded-[26px] border p-4 sm:p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
      dark ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200"
    }`}
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] opacity-55">{label}</p>
        <p className="mt-2 text-2xl font-black">{value}</p>
      </div>

      <div className={`rounded-2xl p-3 ${accent}`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const MemberChip = ({ member, onClick }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-indigo-500/20 hover:bg-indigo-500/5"
  >
    <div className="relative">
      {member.avatar ? (
        <img
          src={member.avatar}
          alt=""
          className="h-10 w-10 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <User2 size={18} />
        </div>
      )}

      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 ${
          member.online ? "border-white bg-emerald-500" : "border-white bg-slate-400"
        }`}
      />
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{member.name}</p>
      <p className="text-xs opacity-55">{member.role || "Student"}</p>
    </div>
  </button>
);

const ReactionBar = ({ reactions = {}, dark }) => {
  const entries = Object.entries(reactions).filter(([, count]) => count > 0);

  if (!entries.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {entries.map(([emoji, count]) => (
        <span
          key={emoji}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
            dark
              ? "border-white/10 bg-white/10"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <span>{emoji}</span>
          <span className="opacity-70">{count}</span>
        </span>
      ))}
    </div>
  );
};

const MessageBubble = memo(function MessageBubble({
  message,
  isMe,
  dark,
  theme,
  onReply,
  onReact,
}) {
  const messageText = message.text || "";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[96%] gap-3 sm:max-w-[88%] md:max-w-[76%] ${
          isMe ? "flex-row-reverse" : ""
        }`}
      >
        {message.avatar ? (
          <img
            src={message.avatar}
            alt=""
            className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <User2 size={18} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className={`mb-1 flex items-center gap-2 ${isMe ? "justify-end" : ""}`}>
            <p className="truncate text-xs font-semibold opacity-85">{message.name}</p>
            <span className="text-[10px] opacity-50">{formatTime(message.createdAt)}</span>
          </div>

          <div
            className={`relative overflow-hidden rounded-[28px] border px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.14)] md:px-5 ${
              isMe
                ? "rounded-br-md border-transparent bg-gradient-to-br from-indigo-800  to-blue-300 text-white"
                : `${theme.bubble} ${theme.border} rounded-bl-md`
            }`}
          >
            {message.replyTo && (
              <div
                className={`mb-3 rounded-2xl border p-3 ${
                  isMe
                    ? "border-white/10 bg-black/15"
                    : dark
                      ? "border-white/10 bg-white/5"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-xs opacity-60">Replying to {message.replyTo.name}</p>
                <p className="mt-1 truncate text-sm">{message.replyTo.text}</p>
              </div>
            )}

            <p className="whitespace-pre-wrap break-words text-sm leading-7 md:text-[15px]">
              {messageText.split(/(\s+)/).map((part, index) =>
                part.startsWith("@") ? (
                  <span
                    key={index}
                    className={isMe ? "font-semibold text-cyan-200" : "font-semibold text-indigo-500"}
                  >
                    {part}
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                )
              )}
            </p>

            <ReactionBar reactions={message.reactions || {}} dark={dark} />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onReply(message)}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition ${
                  isMe
                    ? "bg-white/15 hover:bg-white/25"
                    : dark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                <Reply size={14} />
                Reply
              </button>

              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className="text-lg transition hover:scale-125"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {isMe && (
              <div className="mt-2 flex justify-end">
                <CheckCheck size={14} className="opacity-75" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function LoaderIcon() {
  return (
    <Loader2 className="h-4 w-4 animate-spin" />
  );
}

export default function Community({ dark = true }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [presenceMap, setPresenceMap] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursorDoc, setCursorDoc] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [inputHeight, setInputHeight] = useState("auto");

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const skipNextAutoScroll = useRef(false);

  const realtimeDb = getDatabase();
  const messagesRef = useMemo(() => collection(db, "chats", ROOM_ID, "messages"), []);
  const theme = useMemo(() => initialTheme(dark), [dark]);
  const isSignedIn = Boolean(currentUser);

  const membersWithPresence = useMemo(() => {
    return members.map((member) => {
      const presence = presenceMap[member.id] || {};
      return {
        ...member,
        name: presence.name || member.name || "Anonymous",
        avatar: presence.avatar || member.avatar || "",
        online: Boolean(presence.online),
      };
    });
  }, [members, presenceMap]);

  const currentOnlineMembers = useMemo(() => {
    return membersWithPresence.filter((member) => member.online);
  }, [membersWithPresence]);

  const filteredMentions = useMemo(() => {
    const value = mentionQuery.trim().toLowerCase();

    if (!value) {
      return membersWithPresence.slice(0, 6);
    }

    return membersWithPresence
      .filter((member) => member.name?.toLowerCase().includes(value))
      .slice(0, 6);
  }, [membersWithPresence, mentionQuery]);

  const filteredMessages = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return messages;

    return messages.filter((message) =>
      `${message.name || ""} ${message.text || ""}`.toLowerCase().includes(value)
    );
  }, [messages, search]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;

    const presenceRef = ref(realtimeDb, `presence/${ROOM_ID}/${currentUser.uid}`);
    const roomPresenceRef = ref(realtimeDb, `presence/${ROOM_ID}`);

    set(presenceRef, {
      online: true,
      name: currentUser.displayName || currentUser.email || "Anonymous",
      avatar: currentUser.photoURL || "",
    });

    onDisconnect(presenceRef).remove();

    const unsubscribe = onValue(roomPresenceRef, (snapshot) => {
      setPresenceMap(snapshot.val() || {});
    });

    return () => unsubscribe();
  }, [currentUser?.uid, realtimeDb]);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;

    const memberRef = doc(db, "rooms", ROOM_ID, "members", currentUser.uid);
    setDoc(
      memberRef,
      {
        name: currentUser.displayName || currentUser.email || "Anonymous",
        avatar: currentUser.photoURL || "",
        email: currentUser.email || "",
        role: "Student",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(console.error);
  }, [currentUser?.uid]);

  useEffect(() => {
    const typingRef = ref(realtimeDb, `typing/${ROOM_ID}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTypingUsers(Object.values(data).filter(Boolean));
    });

    return () => unsubscribe();
  }, [realtimeDb]);

  useEffect(() => {
    const membersRef = collection(db, "rooms", ROOM_ID, "members");
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      setMembers(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(INITIAL_LIMIT));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).reverse();
      setMessages(data);
      setCursorDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setLoading(false);
      setHasMore(snapshot.docs.length === INITIAL_LIMIT);
    });

    return () => unsubscribe();
  }, [messagesRef]);

  useEffect(() => {
    if (skipNextAutoScroll.current) {
      skipNextAutoScroll.current = false;
      return;
    }

    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowEmojiPicker(false);
        setShowMentions(false);
        setReplyingTo(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    return () => clearTimeout(typingTimeout.current);
  }, []);

  const sendTyping = useCallback(
    (value) => {
      const user = auth.currentUser;
      if (!user) return;

      const typingRef = ref(realtimeDb, `typing/${ROOM_ID}/${user.uid}`);
      onDisconnect(typingRef).remove();

      clearTimeout(typingTimeout.current);

      if (!value.trim()) {
        remove(typingRef);
        return;
      }

      set(typingRef, {
        name: user.displayName || "Someone",
      });

      typingTimeout.current = setTimeout(() => {
        remove(typingRef);
      }, 1400);
    },
    [realtimeDb]
  );

  const handleChange = useCallback(
    (value) => {
      setText(value);
      sendTyping(value);

      const parts = value.split(/\s+/);
      const last = parts[parts.length - 1] || "";

      if (last.startsWith("@")) {
        setShowMentions(true);
        setMentionQuery(last.slice(1));
      } else {
        setShowMentions(false);
        setMentionQuery("");
      }

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        setInputHeight(`${inputRef.current.scrollHeight}px`);
      }
    },
    [sendTyping]
  );

  const selectMention = useCallback(
    (name) => {
      const parts = text.split(/\s+/);
      parts[parts.length - 1] = `@${name}`;
      const next = `${parts.join(" ")} `;

      setText(next);
      setShowMentions(false);
      setMentionQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
      handleChange(next);
    },
    [handleChange, text]
  );

  const sendMessage = useCallback(async () => {
    if (!text.trim() || !auth.currentUser || sending) return;

    setSending(true);
    try {
      const mentions = text.match(/@\w+/g) || [];

      await addDoc(messagesRef, {
        text: text.trim(),
        mentions,
        userId: auth.currentUser.uid,
        name: auth.currentUser.displayName || auth.currentUser.email || "Anonymous",
        avatar: auth.currentUser.photoURL || "",
        createdAt: serverTimestamp(),
        reactions: {},
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              name: replyingTo.name,
              text: replyingTo.text,
            }
          : null,
      });

      setText("");
      setReplyingTo(null);
      setShowEmojiPicker(false);
      setShowMentions(false);
      sendTyping("");

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  }, [messagesRef, replyingTo, sendTyping, sending, text]);

  const addReaction = useCallback(async (messageId, emoji) => {
    if (!auth.currentUser) return;

    await updateDoc(doc(db, "chats", ROOM_ID, "messages", messageId), {
      [`reactions.${emoji}`]: increment(1),
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursorDoc || !hasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const q = query(
        messagesRef,
        orderBy("createdAt", "desc"),
        startAfter(cursorDoc),
        limit(LOAD_MORE_LIMIT)
      );

      const snapshot = await getDocs(q);
      const older = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).reverse();

      if (older.length > 0) {
        skipNextAutoScroll.current = true;
        setMessages((current) => {
          const byId = new Map(current.map((item) => [item.id, item]));
          older.forEach((item) => byId.set(item.id, item));
          return Array.from(byId.values()).sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
            return aTime - bTime;
          });
        });
        setHasMore(snapshot.docs.length === LOAD_MORE_LIMIT);
        setCursorDoc(snapshot.docs[snapshot.docs.length - 1] || cursorDoc);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }, [cursorDoc, hasMore, loadingMore, messagesRef]);

  const roomStats = [
    {
      label: "Online now",
      value: currentOnlineMembers.length.toString(),
      icon: Users,
      accent: "bg-emerald-500/10 text-emerald-500",
    },
    {
      label: "Messages",
      value: messages.length.toString(),
      icon: MessageSquareMore,
      accent: "bg-indigo-500/10 text-indigo-500",
    },
    {
      label: "Members",
      value: membersWithPresence.length.toString(),
      icon: Hash,
      accent: "bg-violet-500/10 text-violet-500",
    },
  ];

  return (
    <div className={`min-h-screen md:mt-20 overflow-hidden ${theme.bg} ${theme.text}`}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute left-1/2 top-[18%] h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[110px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 md:px-6 md:py-8">
        <div
          className={`rounded-[34px] border p-5 shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-xl ${
            dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85"
          }`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-500">
                <Sparkles size={14} />
                Group
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                Campus Global
              </h1>

              <p className={`mt-3 max-w-2xl text-sm leading-7 sm:text-base ${theme.sub}`}>
                Student group chat.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${theme.border} ${theme.glass}`}>
                  <Mic2 size={14} />
                  Live
                </span>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${theme.border} ${theme.glass}`}>
                  <Users size={14} />
                  {currentOnlineMembers.length} online
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_360px]">
          <div className="flex min-h-[72vh] flex-col overflow-hidden rounded-[34px] border shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <div
              className={`border-b px-4 py-4 sm:px-6 ${
                dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85"
              }`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">Messages</h2>
                  <p className={`mt-1 text-sm ${theme.sub}`}>
                    {typingUsers.length > 0 ? "Typing..." : `${currentOnlineMembers.length} online`}
                  </p>
                </div>

                <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${theme.border} ${theme.glass}`}>
                  <Search size={16} className="opacity-55" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {loading ? (
                <div className="flex min-h-[42vh] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-indigo-500/15" />
                    <p className={`mt-4 text-sm ${theme.sub}`}>Loading...</p>
                  </div>
                </div>
              ) : (
                <>
                  {hasMore && (
                    <div className="mb-5 flex justify-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          dark
                            ? "border-white/10 bg-white/5 hover:bg-white/10"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        {loadingMore ? (
                          <>
                            <LoaderIcon />
                            Loading
                          </>
                        ) : (
                          "Load more"
                        )}
                      </button>
                    </div>
                  )}

                  <div className="space-y-5">
                    {filteredMessages.length === 0 ? (
                      <div className={`rounded-[28px] border p-10 text-center ${theme.border} ${dark ? "bg-white/[0.03]" : "bg-white"}`}>
                        <MessageSquareMore size={46} className="mx-auto opacity-30" />
                        <h3 className="mt-4 text-xl font-bold">No messages yet</h3>
                      </div>
                    ) : (
                      filteredMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isMe={message.userId === currentUser?.uid}
                          dark={dark}
                          theme={theme}
                          onReply={setReplyingTo}
                          onReact={addReaction}
                        />
                      ))
                    )}
                  </div>

                  <div ref={bottomRef} />
                </>
              )}
            </div>

            <div
              className={`relative border-t px-4 py-4 sm:px-6 ${
                dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white/90"
              }`}
            >
              {replyingTo && (
                <div className={`mb-4 rounded-[26px] border p-4 ${theme.border} ${dark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] opacity-55">Replying to</p>
                      <p className="mt-1 truncate text-sm font-semibold">{replyingTo.name}</p>
                      <p className={`mt-1 line-clamp-2 text-sm ${theme.sub}`}>{replyingTo.text}</p>
                    </div>

                    <button
                      onClick={() => setReplyingTo(null)}
                      className={`rounded-full border p-2 ${theme.border} ${dark ? "bg-white/[0.04]" : "bg-white"}`}
                      aria-label="Cancel reply"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {showMentions && (
                <div className={`mb-4 grid gap-2 rounded-[26px] border p-3 shadow-xl backdrop-blur-xl ${theme.border} ${dark ? "bg-[#0b1220]" : "bg-white"}`}>
                  <p className="px-2 text-xs uppercase tracking-[0.2em] opacity-55">Mention a member</p>
                  {filteredMentions.length > 0 ? (
                    filteredMentions.map((member) => (
                      <MemberChip key={member.id} member={member} onClick={() => selectMention(member.name)} />
                    ))
                  ) : (
                    <div className={`rounded-[22px] px-3 py-4 text-sm ${theme.sub}`}>
                      No members match that mention.
                    </div>
                  )}
                </div>
              )}

              <div
                className={`rounded-[30px] border p-3 shadow-[0_18px_50px_rgba(0,0,0,0.08)] ${
                  dark ? "border-white/10 bg-[#0b1220]" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-end gap-3">
                  <button
                    onClick={() => setShowEmojiPicker((current) => !current)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                      dark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"
                    }`}
                    aria-label="Toggle emoji picker"
                  >
                    <Smile size={18} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <textarea
                      ref={inputRef}
                      value={text}
                      onChange={(event) => handleChange(event.target.value)}
                      placeholder={
                        isSignedIn
                          ? "Message..."
                          : "Sign in to chat..."
                      }
                      disabled={!isSignedIn}
                      rows={1}
                      style={{ minHeight: inputHeight }}
                      className="max-h-40 w-full resize-none bg-transparent px-1 py-3 text-sm outline-none placeholder:opacity-50 disabled:cursor-not-allowed"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!isSignedIn || !text.trim() || sending}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {sending ? <LoaderIcon /> : <SendHorizontal size={18} />}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 text-xs opacity-60">
                <div className="flex items-center gap-2">
                  <Clock3 size={13} />
                  Live
                </div>
                <div className="flex items-center gap-2">
                  <AtSign size={13} />
                  Mentions
                </div>
              </div>

              {showEmojiPicker && (
                <div
                  className={`absolute bottom-full left-4 z-20 mb-3 w-[300px] rounded-[26px] border p-4 shadow-2xl backdrop-blur-xl ${
                    dark ? "border-white/10 bg-[#0b1220]" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] opacity-55">Quick reactions</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setText((current) => `${current}${emoji}`)}
                        className="rounded-2xl border border-transparent px-3 py-2 text-2xl transition hover:border-indigo-500/20 hover:bg-indigo-500/5 hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside
            className={`flex h-fit flex-col gap-6 rounded-[34px] border p-5 shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-xl ${
              dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] opacity-55">Room</p>
                  <h2 className="mt-1 text-2xl font-black">Campus Global</h2>
                </div>
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-500">
                  <Hash size={18} />
                </div>
              </div>

              <p className={`mt-3 text-sm leading-7 ${theme.sub}`}>Short posts. Fast replies.</p>
            </div>

            <div className={`rounded-[28px] border p-4 ${theme.border} ${dark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] opacity-55">Online</p>
                  <p className="text-xl font-black">{currentOnlineMembers.length}</p>
                </div>
              </div>
              <p className={`mt-3 text-sm ${theme.sub}`}>
                {typingUsers.length > 0 ? "Typing..." : "Quiet now."}
              </p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">Members</h3>
                <span className="text-xs opacity-55">{membersWithPresence.length} total</span>
              </div>

              <div className="space-y-2">
                {membersWithPresence.slice(0, 8).map((member) => (
                  <MemberChip
                    key={member.id}
                    member={member}
                    onClick={() => selectMention(member.name)}
                  />
                ))}

                {membersWithPresence.length === 0 && (
                  <div className={`rounded-[24px] border p-4 text-sm ${theme.border} ${theme.sub}`}>
                    No members available yet.
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-[28px] border p-4 ${theme.border} ${dark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-500">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] opacity-55">Info</p>
                  <h3 className="font-bold">Group chat</h3>
                </div>
              </div>

              <p className={`mt-3 text-sm leading-6 ${theme.sub}`}>Quick updates. Questions. Replies.</p>
            </div>

            {!isSignedIn && (
              <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                Sign in to chat.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
