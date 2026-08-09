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
  ArrowLeft,
  CheckCheck,
  Clock,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Reply,
  Search,
  Send,
  Settings,
  Smile,
  Trash2,
  UploadCloud,
  User2,
  UserCheck,
  UserPlus,
  UserRoundPlus,
  UserX,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

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
import {
  listenFriends,
  listenIncomingFriendRequests,
  listenOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "../service/friendshipService";

const TABS = [
  { key: "chats", label: "Chats", icon: MessageCircle },
  { key: "friends", label: "Friends", icon: Users },
  { key: "requests", label: "Requests", icon: UserRoundPlus },
];

const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : "bg-white border-slate-200 text-slate-900",
  muted: dark ? "text-slate-400" : "text-slate-500",
  tabActive: dark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700",
  tabInactive: dark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700",
  menu: dark ? "border-white/10 bg-[#0f1729]" : "border-slate-200 bg-white",
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

const messagePreview = (message) => {
  if (message?.deleted) return "This message was deleted";
  if (message?.text) return message.text.slice(0, 120);
  return message?.attachments?.[0]?.name || "Attachment";
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const firstLetter = (name = "Student") => name.trim().charAt(0).toUpperCase() || "S";

const ChatAvatar = ({ src, name, mine = false }) => (
  <div
    className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-black text-white shadow-sm ${
      mine ? "bg-emerald-600" : "bg-indigo-600"
    }`}
    title={name || "Student"}
  >
    {src ? <img src={src} alt={name || "Student"} className="h-full w-full object-cover" /> : firstLetter(name)}
  </div>
);

export default function Messenger({ dark = false }) {
  const t = theme(dark);
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState({});
  const [activeTab, setActiveTab] = useState("chats");

  // Chats state
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const openedUserRef = useRef("");
  const openedConversationRef = useRef("");
  const bottomRef = useRef(null);

  // Message action state (menu / edit)
  const [openMenuId, setOpenMenuId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editText, setEditText] = useState("");
  const menuRef = useRef(null);

  // Friends state
  const [friends, setFriends] = useState([]);

  // Requests state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Find friend state
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showFindModal, setShowFindModal] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) || null,
    [activeId, conversations]
  );

  const otherUser = useMemo(() => {
    if (!activeConversation || !user?.uid) return null;
    const otherId = activeConversation.memberIds?.find((id) => id !== user.uid);
    return activeConversation.memberInfo?.[otherId] || null;
  }, [activeConversation, user]);

  const activeOtherId = useMemo(() => {
    if (!activeConversation || !user?.uid) return "";
    return activeConversation.memberIds?.find((id) => id !== user.uid) || "";
  }, [activeConversation, user]);

  // Load profile
  useEffect(() => {
    getCurrentUserProfile(user).then((data) => setProfile(data || {}));
  }, [user]);

  // Listen conversations (no auto-open — WhatsApp always starts on the list)
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
    });
  }, [user]);

  // Handle URL params for opening a chat directly
  useEffect(() => {
    const targetConversation = searchParams.get("conversation") || searchParams.get("conversationId");
    const targetUid = searchParams.get("user");

    if (targetConversation && activeId !== targetConversation && openedConversationRef.current !== targetConversation) {
      openedConversationRef.current = targetConversation;
      setActiveTab("chats");
      setActiveId(targetConversation);
      setSearchParams({}, { replace: true });
      return;
    }

    if (!targetUid || !user?.uid || targetUid === user.uid || openedUserRef.current === targetUid) return;

    openedUserRef.current = targetUid;
    getDoc(doc(db, "users", targetUid))
      .then((snap) => {
        if (!snap.exists()) {
          setNotice("User profile was not found.");
          return;
        }
        openUser({ id: snap.id, ...snap.data() });
        setSearchParams({}, { replace: true });
      })
      .catch(() => setNotice("Could not open that conversation."));
  }, [searchParams, setSearchParams, user, activeId]);

  // Listen messages for active conversation
  useEffect(() => {
    if (!activeId || !user?.uid) return undefined;
    markConversationRead(activeId, user.uid).catch(console.error);
    return listenConversationMessages(activeId, (items) => {
      setMessages(items);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
  }, [activeId, user]);

  // Reset per-message UI state whenever the open chat changes
  useEffect(() => {
    setOpenMenuId("");
    setEditingId("");
    setEditText("");
  }, [activeId]);

  // Close the actions dropdown on outside click
  useEffect(() => {
    if (!openMenuId) return undefined;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  // Search users
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

  // Typing indicator
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

  // Listen friends
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenFriends(user.uid, (data) => setFriends(data));
    return unsub;
  }, [user]);

  // Listen incoming requests
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenIncomingFriendRequests(user.uid, (data) => setIncomingRequests(data));
    return unsub;
  }, [user]);

  // Listen outgoing requests
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenOutgoingFriendRequests(user.uid, (data) => setOutgoingRequests(data));
    return unsub;
  }, [user]);

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
    setActiveTab("chats");
    setSearch("");
    setResults([]);
    setShowFindModal(false);
  };

  const send = async () => {
    if (!activeConversation || (!text.trim() && !file)) return;
    setSending(true);
    setNotice("");
    try {
      const attachments = [];
      if (file) {
        const uploaded = await uploadFile(file);
        attachments.push({
          type: kindFor(file),
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          resourceType: uploaded.resource_type,
          name: uploaded.original_filename || file.name,
          bytes: uploaded.bytes || file.size,
        });
      }
      await sendDirectMessage(activeConversation, user, profile, {
        text: text.trim(),
        attachments,
        replyTo: replyTo ? {
          id: replyTo.id,
          senderId: replyTo.senderId || "",
          senderName: replyTo.senderName || "Student",
          text: messagePreview(replyTo),
        } : null,
      });
      setText("");
      setFile(null);
      setReplyTo(null);
      setTyping(false);
    } catch (err) {
      setNotice(err.message || "Failed to send message. You may need to be friends first.");
    } finally {
      setSending(false);
    }
  };

  // --- Message actions: edit / delete ---
  const canEditMessage = (message) => {
    if (!message || message.deleted || message.senderId !== user?.uid) return false;
    const sentAt = toDate(message.createdAt);
    if (!sentAt) return false;
    return Date.now() - sentAt.getTime() <= EDIT_WINDOW_MS;
  };

  const canDeleteMessage = (message) => !!message && !message.deleted && message.senderId === user?.uid;

  const startEditMessage = (message) => {
    setEditingId(message.id);
    setEditText(message.text || "");
    setOpenMenuId("");
  };

  const cancelEditMessage = () => {
    setEditingId("");
    setEditText("");
  };

  const saveEditMessage = async (message) => {
    const trimmed = editText.trim();
    if (!trimmed || !activeId) return;
    if (!canEditMessage(message)) {
      setNotice("This message can no longer be edited (30 minute window passed).");
      setEditingId("");
      return;
    }
    try {
      await updateDoc(doc(db, "conversations", activeId, "messages", message.id), {
        text: trimmed,
        edited: true,
        editedAt: serverTimestamp(),
      });
      setEditingId("");
      setEditText("");
    } catch (err) {
      setNotice(err.message || "Could not edit message.");
    }
  };

  const deleteMessage = async (message) => {
    if (!activeId) return;
    const confirmed = window.confirm("Delete this message for everyone? This can't be undone.");
    if (!confirmed) return;
    try {
      await updateDoc(doc(db, "conversations", activeId, "messages", message.id), {
        deleted: true,
        text: "",
        attachments: [],
        deletedAt: serverTimestamp(),
      });
      setOpenMenuId("");
    } catch (err) {
      setNotice(err.message || "Could not delete message.");
    }
  };

  const handleSendRequest = async (targetUser) => {
    try {
      await sendFriendRequest({
        currentUid: user.uid,
        targetUid: targetUser.id,
        currentProfile: profile,
        targetProfile: targetUser,
      });
    } catch (err) {
      console.log("Send request error:", err.message);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      await acceptFriendRequest({
        request,
        currentUid: user.uid,
        currentProfile: profile,
      });
    } catch (err) {
      console.log("Accept error:", err.message);
    }
  };

  const handleDeclineRequest = async (request) => {
    try {
      await declineFriendRequest({
        request,
        currentUid: user.uid,
        currentProfile: profile,
      });
    } catch (err) {
      console.log("Decline error:", err.message);
    }
  };

  const handleCancelRequest = async (request) => {
    try {
      await cancelFriendRequest({
        requestId: request.id,
        currentUid: user.uid,
      });
    } catch (err) {
      console.log("Cancel error:", err.message);
    }
  };

  const openFriendChat = (friend) => {
    const otherUid = friend.users?.find((id) => id !== user?.uid);
    if (!otherUid) return;
    const conversationId = [user?.uid, otherUid].sort().join("_");
    setActiveId(conversationId);
    setActiveTab("chats");
  };

  const getFriendProfile = (friend) => {
    const otherUid = friend.users?.find((id) => id !== user?.uid);
    return otherUid ? friend.profiles?.[otherUid] || {} : {};
  };

  const getFriendUid = (friend) => friend.users?.find((id) => id !== user?.uid) || "";

  const friendIds = useMemo(() => {
    const ids = new Set();
    friends.forEach((friend) => {
      friend.users?.forEach?.((id) => {
        if (id !== user?.uid) ids.add(id);
      });
    });
    return ids;
  }, [friends, user?.uid]);

  const incomingRequestByUser = useMemo(() => {
    const map = new Map();
    incomingRequests.forEach((request) => {
      if (request.from) map.set(request.from, request);
    });
    return map;
  }, [incomingRequests]);

  const outgoingRequestByUser = useMemo(() => {
    const map = new Map();
    outgoingRequests.forEach((request) => {
      if (request.to) map.set(request.to, request);
    });
    return map;
  }, [outgoingRequests]);

  const getRelationshipLabel = (peerId) => {
    if (!peerId || friendIds.has(peerId)) return null;
    if (incomingRequestByUser.has(peerId)) return { text: "Friend request received", icon: UserRoundPlus, tone: "info" };
    if (outgoingRequestByUser.has(peerId)) return { text: "Friend request sent", icon: Clock, tone: "info" };
    return { text: "Not friends yet", icon: UserPlus, tone: "warning" };
  };

  const activeRelationshipLabel = getRelationshipLabel(activeOtherId);
  const activeIncomingRequest = activeOtherId ? incomingRequestByUser.get(activeOtherId) : null;
  const activeOutgoingRequest = activeOtherId ? outgoingRequestByUser.get(activeOtherId) : null;
  const activeAreFriends = !activeOtherId || friendIds.has(activeOtherId);
  const nonFriendMessageUsed = !activeAreFriends && Number(activeConversation?.messageCount || 0) >= 1;
  const canUseComposer = activeAreFriends || !nonFriendMessageUsed;

  const sendActiveFriendRequest = async () => {
    if (!activeOtherId) return;
    await handleSendRequest({
      id: activeOtherId,
      uid: activeOtherId,
      ...(otherUser || {}),
    });
    setNotice("Friend request sent.");
  };

  const acceptActiveFriendRequest = async () => {
    if (!activeIncomingRequest) return;
    await handleAcceptRequest(activeIncomingRequest);
    setNotice("Friend request accepted. You can chat freely now.");
  };

  const RelationshipPrompt = () => {
    if (!activeRelationshipLabel) return null;
    const PromptIcon = activeRelationshipLabel.icon;
    const isIncoming = !!activeIncomingRequest;
    const isOutgoing = !!activeOutgoingRequest;
    const title = isIncoming
      ? "Friend request waiting"
      : isOutgoing
        ? "Friend request sent"
        : "Add friend to keep chatting";
    const body = isIncoming
      ? `${otherUser?.name || "This student"} wants to connect. Accept to continue this chat freely.`
      : isOutgoing
        ? "You can continue chatting after the request is accepted."
        : nonFriendMessageUsed
          ? "You have used your one intro message. Add them as a friend to send more."
          : "You can send one intro message before becoming friends.";

    return (
      <div className={`mx-3 mb-3 flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-center ${dark ? "border-indigo-400/20 bg-indigo-400/10" : "border-indigo-100 bg-indigo-50"}`}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
          <PromptIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{title}</p>
          <p className={`mt-1 text-sm ${t.muted}`}>{body}</p>
        </div>
        {isIncoming ? (
          <button onClick={acceptActiveFriendRequest} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-600">
            <UserCheck size={16} /> Accept
          </button>
        ) : isOutgoing ? (
          <span className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-extrabold ${t.soft}`}>
            <Clock size={16} /> Pending
          </span>
        ) : (
          <button onClick={sendActiveFriendRequest} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700">
            <UserPlus size={16} /> Add friend
          </button>
        )}
      </div>
    );
  };

  // --- Tab Bar ---
  const TabBar = () => (
    <div className="flex gap-1 rounded-2xl border p-1 mb-4" style={{ borderColor: dark ? "rgba(255,255,255,0.1)" : "#E2E8F0", background: dark ? "rgba(255,255,255,0.03)" : "#FFFFFF" }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        const badge = tab.key === "requests" ? incomingRequests.length + outgoingRequests.length : 0;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all relative ${
              isActive ? t.tabActive : t.tabInactive
            }`}
          >
            <Icon size={16} />
            <span className="inline">{tab.label}</span>
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // --- Chats Tab ---
  const ChatsTab = () => (
    <div>
      {conversations.length === 0 ? (
        <div className={`rounded-3xl border p-6 text-center ${t.soft}`}>
          <MessageCircle className="mx-auto opacity-40" size={40} />
          <p className="mt-3 font-bold">No conversations yet</p>
          <p className={`mt-1 text-sm ${t.muted}`}>Search for a student to start one.</p>
        </div>
      ) : conversations.map((item) => {
        const otherId = item.memberIds?.find((id) => id !== user?.uid);
        const other = item.memberInfo?.[otherId] || {};
        const unread = item.unread?.[user?.uid] || 0;
        const relationshipLabel = getRelationshipLabel(otherId);
        const RelationshipIcon = relationshipLabel?.icon;
        return (
          <button key={item.id} onClick={() => setActiveId(item.id)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${activeId === item.id ? "border-indigo-500 bg-indigo-500/10" : t.soft}`}>
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">{other.avatar ? <img src={other.avatar} alt="" className="h-full w-full object-cover" /> : <User2 className="m-3" />}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-bold">{other.name || "Student"}</p>
                <span className={`shrink-0 text-[11px] ${t.muted}`}>{formatShortTime(item.updatedAt)}</span>
              </div>
              <p className={`truncate text-sm ${t.muted}`}>{item.lastMessage || "Say hello"}</p>
              {relationshipLabel && RelationshipIcon ? (
                <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold ${
                  relationshipLabel.tone === "warning"
                    ? dark ? "bg-amber-400/10 text-amber-300" : "bg-amber-50 text-amber-700"
                    : dark ? "bg-indigo-400/10 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                }`}>
                  <RelationshipIcon size={12} />
                  {relationshipLabel.text}
                </span>
              ) : null}
            </div>
            {unread > 0 && <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs font-bold text-white">{unread}</span>}
          </button>
        );
      })}
    </div>
  );

  // --- Friends Tab ---
  const FriendsTab = () => (
    <div>
      {/* Find Friend Button */}
      <button
        onClick={() => setShowFindModal(true)}
        className={`mb-4 flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${t.soft} hover:opacity-80 transition-opacity`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
          <UserPlus size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Find Friends</p>
          <p className={`text-xs ${t.muted}`}>Search and connect with students</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="opacity-40"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <div className={`text-xs font-extrabold uppercase tracking-wide mb-3 ${t.muted}`}>
        Friends {friends.length > 0 ? `(${friends.length})` : ""}
      </div>

      {friends.length > 0 ? friends.map((friend) => {
        const friendProfile = getFriendProfile(friend);
        const friendUid = getFriendUid(friend);
        const name = friendProfile.name || friendProfile.username || "Student";
        const avatar = friendProfile.avatar || "";
        const school = friendProfile.school || friendProfile.university || "";
        const department = friendProfile.department || "";

        return (
          <div
            key={friend.id}
            className={`mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 ${t.soft}`}
          >
            <button onClick={() => openFriendChat(friend)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-indigo-500">{name[0]}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{name}</p>
                {school && <p className={`truncate text-xs ${t.muted}`}>{school}</p>}
                {department && <p className={`truncate text-xs ${t.muted}`}>{department}</p>}
              </div>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              {friendUid && (
                <Link
                  to={`/profile/${friendUid}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${t.soft}`}
                  aria-label={`View ${name}'s profile`}
                  title="View profile"
                >
                  <Eye size={16} />
                </Link>
              )}
              <button
                onClick={() => openFriendChat(friend)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"
                aria-label={`Message ${name}`}
              >
                <MessageCircle size={16} />
              </button>
            </div>
          </div>
        );
      }) : (
        <div className={`rounded-3xl border p-6 text-center ${t.soft}`}>
          <Users className="mx-auto opacity-40" size={40} />
          <p className="mt-3 font-bold">No friends yet</p>
          <p className={`mt-1 text-sm ${t.muted}`}>Find and connect with other students to start chatting.</p>
        </div>
      )}
    </div>
  );

  // --- Requests Tab ---
  const RequestsTab = () => (
    <div className="space-y-6">
      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div>
          <div className={`flex items-center gap-2 mb-3 ${t.muted}`}>
            <div className="flex-1 h-px bg-current opacity-20" />
            <span className="text-xs font-extrabold uppercase tracking-wider shrink-0">
              Received ({incomingRequests.length})
            </span>
            <div className="flex-1 h-px bg-current opacity-20" />
          </div>
          <div className="space-y-2">
            {incomingRequests.map((request) => {
              const fromProfile = request.fromProfile || {};
              const name = fromProfile.name || fromProfile.username || "Student";
              const avatar = fromProfile.avatar || "";
              const school = fromProfile.school || fromProfile.university || "";
              const department = fromProfile.department || "";
              return (
                <div key={request.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border p-3 sm:p-4 ${t.soft} hover:shadow-sm transition-shadow`}>
                  <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">
                      {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-indigo-500">{name[0]}</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm sm:text-base truncate">{name}</p>
                      <p className={`text-xs ${t.muted} truncate`}>
                        {school || department ? `${school || department}` : "Wants to connect"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0 sm:ml-auto shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(request)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 sm:px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
                      title="Accept"
                    >
                      <UserCheck size={15} />
                      <span className="hidden xs:inline sm:inline">Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors"
                      title="Decline"
                    >
                      <UserX size={15} />
                      <span className="hidden xs:inline sm:inline">Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoingRequests.length > 0 && (
        <div>
          <div className={`flex items-center gap-2 mb-3 ${t.muted}`}>
            <div className="flex-1 h-px bg-current opacity-20" />
            <span className="text-xs font-extrabold uppercase tracking-wider shrink-0">
              Sent ({outgoingRequests.length})
            </span>
            <div className="flex-1 h-px bg-current opacity-20" />
          </div>
          <div className="space-y-2">
            {outgoingRequests.map((request) => {
              const toProfile = request.toProfile || {};
              const name = toProfile.name || toProfile.username || "Student";
              const avatar = toProfile.avatar || "";
              const school = toProfile.school || toProfile.university || "";
              const department = toProfile.department || "";
              return (
                <div key={request.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border p-3 sm:p-4 ${t.soft} hover:shadow-sm transition-shadow`}>
                  <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">
                      {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-indigo-500">{name[0]}</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm sm:text-base truncate">{name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} className="opacity-50 shrink-0" />
                        <p className={`text-xs ${t.muted} truncate`}>
                          {school || department ? `Request sent • ${school || department}` : "Request sent"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0 sm:ml-auto shrink-0">
                    <button
                      onClick={() => handleCancelRequest(request)}
                      className="rounded-xl border px-3 sm:px-4 py-2 text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
        <div className={`rounded-3xl border p-8 sm:p-10 text-center ${t.soft}`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <UserRoundPlus className="text-indigo-500" size={28} />
          </div>
          <p className="text-base sm:text-lg font-bold">No pending requests</p>
          <p className={`mt-2 text-sm ${t.muted} max-w-xs mx-auto`}>
            Friend requests you send or receive will appear here. Find students to connect with in the Friends tab.
          </p>
        </div>
      )}
    </div>
  );

  // --- Find Friend Modal ---
  const FindFriendModal = () => {
    if (!showFindModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => { setShowFindModal(false); setSearch(""); setResults([]); }}>
        <div
          className="w-full max-w-lg sm:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
          style={{ backgroundColor: dark ? "#0f1729" : "#FFFFFF" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold">Find Friends</h2>
            <button onClick={() => { setShowFindModal(false); setSearch(""); setResults([]); }} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>

          <div className={`flex items-center gap-2 rounded-2xl border px-3 mb-4 ${t.soft}`}>
            <Search size={17} className="opacity-40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or school..."
              className="h-11 w-full bg-transparent text-sm outline-none"
              autoFocus
            />
            {search.length > 0 && (
              <button onClick={() => setSearch("")} className="opacity-40 hover:opacity-70">
                <X size={16} />
              </button>
            )}
          </div>

          <div>
            {results.length > 0 ? results.map((item) => {
              const name = item.username || item.name || item.email || "Student";
              const avatar = item.photo || item.avatar || "";
              const detail = item.school || item.department || item.email || "";
              return (
                <div key={item.id} className={`mb-2 flex items-center gap-3 rounded-2xl border p-3 ${t.soft}`}>
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">
                    {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-base font-extrabold text-indigo-500">{name[0]}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm">{name}</p>
                    {detail && <p className={`text-xs truncate ${t.muted}`}>{detail}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleSendRequest(item)}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                    >
                      <UserPlus size={14} />
                      Add
                    </button>
                    <button
                      onClick={() => openUser(item)}
                      className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      style={{ borderColor: dark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }}
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            }) : search.length >= 2 ? (
              <div className="py-10 text-center">
                <Search className="mx-auto opacity-30" size={36} />
                <p className={`mt-3 text-sm ${t.muted}`}>No students found</p>
              </div>
            ) : (
              <div className="py-10 text-center">
                <Users className="mx-auto opacity-30" size={36} />
                <p className={`mt-3 text-sm ${t.muted}`}>Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Message bubble ---
  const MessageBubble = ({ message }) => {
    const mine = message.senderId === user?.uid;
    const senderName = mine
      ? profile.username || user?.displayName || "You"
      : message.senderName || otherUser?.name || "Student";
    const senderAvatar = mine
      ? message.senderAvatar || profile.photo || user?.photoURL || ""
      : message.senderAvatar || otherUser?.avatar || "";
    const isEditing = editingId === message.id;
    const isMenuOpen = openMenuId === message.id;
    const editable = canEditMessage(message);
    const deletable = canDeleteMessage(message);
    const showActions = !message.deleted && !isEditing;

    return (
      <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
        {!mine && <ChatAvatar src={senderAvatar} name={senderName} />}
        <div className={`relative max-w-[86%] rounded-3xl border px-3 py-1 ${mine ? "border-indigo-500 bg-indigo-600 text-white" : t.soft} ${message.deleted ? "opacity-70" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-bold opacity-75">
              {formatShortTime(message.createdAt)}
              {message.edited && !message.deleted ? " · edited" : ""}
            </p>
            {showActions && (
              <div className="relative" ref={isMenuOpen ? menuRef : null}>
                <button
                  onClick={() => setOpenMenuId(isMenuOpen ? "" : message.id)}
                  className="rounded-lg p-1 opacity-80 hover:bg-white/10"
                  aria-label="Message actions"
                >
                  <MoreVertical size={16} />
                </button>
                {isMenuOpen && (
                  <div className={`absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-2xl border shadow-lg ${t.menu} ${mine ? "text-slate-900 dark:text-white" : ""}`}>
                    <button
                      onClick={() => { setReplyTo(message); setOpenMenuId(""); }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
                    >
                      <Reply size={14} /> Reply
                    </button>
                    {mine && (
                      <button
                        onClick={() => editable ? startEditMessage(message) : setNotice("Editing is only available within 30 minutes of sending.")}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold ${editable ? (dark ? "hover:bg-white/10" : "hover:bg-slate-100") : "opacity-40 cursor-not-allowed"}`}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    )}
                    {mine && deletable && (
                      <button
                        onClick={() => deleteMessage(message)}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-red-500 ${dark ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {message.deleted ? (
            <p className={`mt-1 flex items-center gap-1.5 text-sm italic ${mine ? "text-white/70" : t.muted}`}>
              <Trash2 size={13} /> This message was deleted
            </p>
          ) : isEditing ? (
            <div className="mt-1 min-w-[220px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                autoFocus
                className={`w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none ${mine ? "border-white/30 bg-white/10 text-white placeholder:text-white/50" : t.input}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    saveEditMessage(message);
                  } else if (event.key === "Escape") {
                    cancelEditMessage();
                  }
                }}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={cancelEditMessage} className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${mine ? "bg-white/10 text-white" : t.soft}`}>
                  <XCircle size={13} /> Cancel
                </button>
                <button onClick={() => saveEditMessage(message)} disabled={!editText.trim()} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                  <CheckCheck size={13} /> Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.replyTo && (
                <div className={`mb-2 rounded-2xl border-l-4 p-2 text-xs ${mine ? "border-white/60 bg-white/10" : "border-indigo-400 bg-indigo-500/10"}`}>
                  <p className="font-bold opacity-80">{message.replyTo.senderName}</p>
                  <p className="mt-1 line-clamp-2 opacity-75">{message.replyTo.text}</p>
                </div>
              )}
              {message.text && <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
              {(message.attachments || []).map((item, index) => <Attachment key={index} item={item} />)}
              {mine && <div className="mt-2 flex justify-end"><CheckCheck size={14} /></div>}
            </>
          )}
        </div>
        {mine && <ChatAvatar src={senderAvatar} name={senderName} mine />}
      </div>
    );
  };

  return (
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto grid max-w-8xl gap-0 px-0 py-0 sm:gap-4 sm:px-4 sm:py-6 md:px-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Left Panel — conversation list / tabs. Full-screen on mobile until a chat is opened. */}
        <aside
          className={`${activeId ? "hidden" : "flex"} lg:flex flex-col h-[calc(100vh-var(--nav-offset,0px))] lg:h-[90vh] rounded-none border-0 sm:rounded-3xl sm:border ${t.panel}`}>
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black">Messenger</h1>
              </div>
              <Link to="/community-settings" className={`rounded-2xl border p-3 ${t.soft}`} aria-label="Messaging settings"><Settings size={18} /></Link>
            </div>

            {/* Tab Bar */}
            <div className="mt-4">
              <TabBar />
            </div>

            {/* Notice */}
            {notice && (
              <div className="mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-semibold text-amber-400">
                {notice}
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === "chats" && <ChatsTab />}
            {activeTab === "friends" && <FriendsTab />}
            {activeTab === "requests" && <RequestsTab />}
          </div>
        </aside>

        {/* Right Panel — Chat. Full-screen on mobile once a chat is opened, hidden otherwise. */}
        <main
          className={`${activeId ? "flex" : "hidden"} lg:flex flex-col h-[calc(100vh-var(--nav-offset,0px))] lg:h-[90vh] overflow-hidden rounded-none border-0 sm:rounded-3xl sm:border ${t.panel}`}
        >
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={() => setActiveId("")}
                    className="lg:hidden -ml-1 shrink-0 rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Back to chats"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  {activeAreFriends && activeOtherId ? (
                    <Link to={`/profile/${activeOtherId}`} className="flex min-w-0 items-center gap-3 group">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">{otherUser?.avatar ? <img src={otherUser.avatar} alt="" className="h-full w-full object-cover" /> : <User2 className="m-3" />}</div>
                      <div className="min-w-0">
                        <h2 className="truncate font-black group-hover:underline">{otherUser?.name || "Student"}</h2>
                        <p className={`truncate text-xs ${t.muted}`}>View profile</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-indigo-500/10">{otherUser?.avatar ? <img src={otherUser.avatar} alt="" className="h-full w-full object-cover" /> : <User2 className="m-3" />}</div>
                      <div className="min-w-0">
                        <h2 className="truncate font-black">{otherUser?.name || "Student"}</h2>
                        <p className={`truncate text-xs ${t.muted}`}>Delivered, read receipts, attachments</p>
                      </div>
                    </div>
                  )}
                </div>
                <CheckCheck className="shrink-0 text-indigo-400" size={20} />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                  <div ref={bottomRef} />
                </div>
              </div>

              <RelationshipPrompt />

              <div className="border-t border-white/10 p-3">
                {replyTo && (
                  <div className={`mb-3 flex items-start justify-between gap-3 rounded-2xl border p-3 text-xs ${t.soft}`}>
                    <div className="min-w-0">
                      <p className="font-bold">Replying to {replyTo.senderName || "Student"}</p>
                      <p className={`mt-1 line-clamp-1 ${t.muted}`}>{messagePreview(replyTo)}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="rounded-lg p-1 hover:bg-red-500/10" aria-label="Cancel reply"><X size={15} /></button>
                  </div>
                )}
                {file && <div className={`mb-3 flex items-center justify-between rounded-2xl border p-3 text-xs ${t.soft}`}><span>{file.name}</span><button onClick={() => setFile(null)}><X size={15} /></button></div>}
                {canUseComposer ? (
                  <div className={`flex items-end gap-2 rounded-3xl border p-3 ${t.soft}`}>
                    <button className="rounded-2xl p-3 hover:bg-indigo-500/10" aria-label="Emoji"><Smile size={18} /></button>
                    <label className="cursor-pointer rounded-2xl p-3 hover:bg-indigo-500/10" aria-label="Attach file">
                      <UploadCloud size={18} />
                      <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                    <textarea value={text} onChange={(e) => { setText(e.target.value); setTyping(true); }} rows={1} placeholder={activeAreFriends ? "Message..." : "Send one intro message..."} className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
                    <button onClick={send} disabled={sending || (!text.trim() && !file)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white disabled:opacity-50">
                      {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </button>
                  </div>
                ) : (
                  <div className={`rounded-3xl border p-4 text-center text-sm font-semibold ${t.soft}`}>
                    Add each other as friends to send more messages in this chat.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden flex-1 items-center justify-center p-8 text-center lg:flex">
              <div>
                <MessageCircle className="mx-auto opacity-35" size={54} />
                <h2 className="mt-4 text-2xl font-black">Choose a conversation</h2>
                <p className={`mt-2 text-sm ${t.muted}`}>Select a chat or start a new one from the sidebar.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Find Friend Modal */}
      <FindFriendModal />
    </div>
  );
}