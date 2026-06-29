import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { deleteGroupPostWithMedia } from "../../services/mediaCleanup";

export const PAGE_SIZE = 20;
export const MESSAGE_PAGE_SIZE = 25;

export const userSummary = (user, profile = {}) => ({
  uid: user.uid,
  name: profile.username || user.displayName || user.email || "Student",
  email: user.email || "",
  avatar: profile.photo || user.photoURL || "",
});

export const normalizeSearch = (value = "") => value.trim().toLowerCase();

export const timestampToMillis = (value) => value?.toDate?.()?.getTime?.() || 0;

export const formatShortTime = (value) => {
  if (!value?.toDate) return "";
  const date = value.toDate();
  const sameDay = new Date().toDateString() === date.toDateString();
  return date.toLocaleString([], sameDay ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric" });
};

export const getCurrentUserProfile = async (user) => {
  if (!user?.uid) return null;
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? snap.data() : {};
};

export const searchUsers = async (term, currentUid, pageSize = 12) => {
  const value = normalizeSearch(term);
  if (value.length < 2) return [];

  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    orderBy("usernameLower"),
    where("usernameLower", ">=", value),
    where("usernameLower", "<=", `${value}\uf8ff`),
    limit(pageSize)
  );

  const snap = await getDocs(q);
  return snap.docs
    .filter((entry) => entry.id !== currentUid)
    .map((entry) => ({ id: entry.id, ...entry.data() }));
};

export const listGroups = async ({ search = "", category = "All", cursor = null } = {}) => {
  const groupsRef = collection(db, "groups");
  const clauses = [];

  if (category && category !== "All") clauses.push(where("category", "==", category));
  if (search.trim()) {
    const value = normalizeSearch(search);
    clauses.push(orderBy("nameLower"), where("nameLower", ">=", value), where("nameLower", "<=", `${value}\uf8ff`));
  } else {
    clauses.push(orderBy("lastActivityAt", "desc"));
  }
  if (cursor) clauses.push(startAfter(cursor));
  clauses.push(limit(PAGE_SIZE));

  const snap = await getDocs(query(groupsRef, ...clauses));
  return {
    groups: snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
    cursor: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === PAGE_SIZE,
  };
};

export const createGroup = async ({ form, user, profile, uploads }) => {
  const summary = userSummary(user, profile);
  const groupRef = doc(collection(db, "groups"));
  const batch = writeBatch(db);
  const now = serverTimestamp();

  batch.set(groupRef, {
    name: form.name.trim(),
    nameLower: normalizeSearch(form.name),
    description: form.description.trim(),
    category: form.category,
    privacy: form.privacy,
    rules: form.rules.trim(),
    coverUrl: uploads.coverUrl || "",
    avatarUrl: uploads.avatarUrl || "",
    coverAsset: uploads.coverAsset || null,
    avatarAsset: uploads.avatarAsset || null,
    ownerId: user.uid,
    adminIds: [user.uid],
    moderatorIds: [],
    memberCount: 1,
    postCount: 0,
    mediaCount: 0,
    fileCount: 0,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  });

  batch.set(doc(db, "groups", groupRef.id, "members", user.uid), {
    ...summary,
    role: "owner",
    joinedAt: now,
  });

  batch.set(doc(db, "users", user.uid, "groups", groupRef.id), {
    groupId: groupRef.id,
    name: form.name.trim(),
    role: "owner",
    joinedAt: now,
  });

  batch.set(doc(db, "notifications", user.uid, "items", groupRef.id), {
    type: "group_created",
    title: "Group created",
    body: `${form.name.trim()} is ready.`,
    groupId: groupRef.id,
    read: false,
    createdAt: now,
  });

  await batch.commit();
  return groupRef.id;
};

export const getGroup = async (groupId) => {
  const snap = await getDoc(doc(db, "groups", groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getMembership = async (groupId, uid) => {
  if (!groupId || !uid) return null;
  const snap = await getDoc(doc(db, "groups", groupId, "members", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const joinPublicGroup = async (group, user, profile) => {
  const summary = userSummary(user, profile);
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "groups", group.id, "members", user.uid);
    const userGroupRef = doc(db, "users", user.uid, "groups", group.id);
    const memberSnap = await transaction.get(memberRef);
    if (memberSnap.exists()) return;

    transaction.set(memberRef, { ...summary, role: "member", joinedAt: serverTimestamp() });
    transaction.set(userGroupRef, {
      groupId: group.id,
      name: group.name,
      role: "member",
      joinedAt: serverTimestamp(),
    });
    transaction.update(doc(db, "groups", group.id), {
      memberCount: increment(1),
      lastActivityAt: serverTimestamp(),
    });
  });
};

export const requestJoinGroup = async (group, user, profile) => {
  const summary = userSummary(user, profile);
  const requestRef = doc(db, "groups", group.id, "joinRequests", user.uid);
  await setDoc(requestRef, {
    ...summary,
    uid: user.uid,
    status: "pending",
    requestedAt: serverTimestamp(),
  });

  if (group.ownerId) {
    await addDoc(collection(db, "notifications", group.ownerId, "items"), {
      type: "group_join_request",
      title: "New join request",
      body: `${summary.name} wants to join ${group.name}.`,
      groupId: group.id,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
};

export const leaveGroup = async (group, uid) => {
  if (group.ownerId === uid) throw new Error("Transfer ownership before leaving this group.");
  const batch = writeBatch(db);
  batch.delete(doc(db, "groups", group.id, "members", uid));
  batch.delete(doc(db, "users", uid, "groups", group.id));
  batch.update(doc(db, "groups", group.id), {
    memberCount: increment(-1),
    lastActivityAt: serverTimestamp(),
  });
  await batch.commit();
};

export const approveJoinRequest = async (group, request) => {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  batch.set(doc(db, "groups", group.id, "members", request.id), {
    uid: request.id,
    name: request.name,
    email: request.email || "",
    avatar: request.avatar || "",
    role: "member",
    joinedAt: now,
  });
  batch.set(doc(db, "users", request.id, "groups", group.id), {
    groupId: group.id,
    name: group.name,
    role: "member",
    joinedAt: now,
  });
  batch.delete(doc(db, "groups", group.id, "joinRequests", request.id));
  batch.update(doc(db, "groups", group.id), {
    memberCount: increment(1),
    lastActivityAt: now,
  });
  batch.set(doc(collection(db, "notifications", request.id, "items")), {
    type: "group_request_approved",
    title: "Request approved",
    body: `You can now access ${group.name}.`,
    groupId: group.id,
    read: false,
    createdAt: now,
  });
  await batch.commit();
};

export const rejectJoinRequest = async (group, request) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, "groups", group.id, "joinRequests", request.id));
  batch.set(doc(collection(db, "notifications", request.id, "items")), {
    type: "group_request_rejected",
    title: "Request rejected",
    body: `Your request to join ${group.name} was not approved.`,
    groupId: group.id,
    read: false,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
};

export const listenGroupMessages = (groupId, callback) => {
  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt", "desc"),
    limit(MESSAGE_PAGE_SIZE)
  );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })).reverse(), snap.docs[snap.docs.length - 1] || null);
  });
};

export const loadOlderGroupMessages = async (groupId, cursor) => {
  if (!cursor) return { messages: [], cursor: null, hasMore: false };
  const snap = await getDocs(query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt", "desc"),
    startAfter(cursor),
    limit(MESSAGE_PAGE_SIZE)
  ));
  return {
    messages: snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })).reverse(),
    cursor: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === MESSAGE_PAGE_SIZE,
  };
};

export const sendGroupMessage = async (groupId, user, profile, payload) => {
  const summary = userSummary(user, profile);
  await addDoc(collection(db, "groups", groupId, "messages"), {
    ...payload,
    senderId: user.uid,
    senderName: summary.name,
    senderAvatar: summary.avatar,
    reactions: {},
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "groups", groupId), { lastActivityAt: serverTimestamp() });
};

export const createPost = async (groupId, user, profile, payload) => {
  const summary = userSummary(user, profile);
  const batch = writeBatch(db);
  const postRef = doc(collection(db, "groups", groupId, "posts"));
  batch.set(postRef, {
    ...payload,
    authorId: user.uid,
    authorName: summary.name,
    authorAvatar: summary.avatar,
    commentCount: 0,
    reactionCount: 0,
    reactions: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "groups", groupId), {
    postCount: increment(1),
    mediaCount: payload.attachments?.some((item) => item.type === "image" || item.type === "video") ? increment(1) : increment(0),
    fileCount: payload.attachments?.some((item) => item.type === "pdf" || item.type === "document") ? increment(1) : increment(0),
    lastActivityAt: serverTimestamp(),
  });
  await batch.commit();
};

export const listenGroupPosts = (groupId, callback) => {
  const q = query(collection(db, "groups", groupId, "posts"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })), snap.docs[snap.docs.length - 1] || null);
  });
};

export const reactToPost = async (groupId, postId, emoji) => {
  await updateDoc(doc(db, "groups", groupId, "posts", postId), {
    [`reactions.${emoji}`]: increment(1),
    reactionCount: increment(1),
  });
};

export const deleteOwnPost = async (groupId, postId) => {
  await deleteGroupPostWithMedia(groupId, postId);
};

export const startConversation = async (currentUser, otherUser, profile) => {
  const members = [currentUser.uid, otherUser.id].sort();
  const conversationId = members.join("_");
  const currentSummary = userSummary(currentUser, profile);
  const otherSummary = {
    uid: otherUser.id,
    name: otherUser.username || otherUser.name || otherUser.email || "Student",
    email: otherUser.email || "",
    avatar: otherUser.photo || otherUser.avatar || "",
  };

  await setDoc(doc(db, "conversations", conversationId), {
    memberIds: members,
    memberInfo: {
      [currentUser.uid]: currentSummary,
      [otherUser.id]: otherSummary,
    },
    mutedBy: [],
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return conversationId;
};

export const listenConversationMessages = (conversationId, callback) => {
  const q = query(collection(db, "conversations", conversationId, "messages"), orderBy("createdAt", "desc"), limit(MESSAGE_PAGE_SIZE));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })).reverse(), snap.docs[snap.docs.length - 1] || null);
  });
};

export const sendDirectMessage = async (conversation, user, profile, payload) => {
  const summary = userSummary(user, profile);
  const receiverId = conversation.memberIds.find((id) => id !== user.uid);
  const batch = writeBatch(db);
  const messageRef = doc(collection(db, "conversations", conversation.id, "messages"));
  const now = serverTimestamp();
  batch.set(messageRef, {
    ...payload,
    senderId: user.uid,
    senderName: summary.name,
    senderAvatar: summary.avatar,
    deliveredTo: [user.uid],
    readBy: [user.uid],
    reactions: {},
    createdAt: now,
  });
  batch.update(doc(db, "conversations", conversation.id), {
    lastMessage: payload.text || payload.attachments?.[0]?.name || "Attachment",
    lastSenderId: user.uid,
    updatedAt: now,
    [`unread.${receiverId}`]: increment(1),
  });
  if (receiverId) {
    batch.set(doc(collection(db, "notifications", receiverId, "items")), {
      type: "direct_message",
      title: summary.name,
      body: payload.text || "Sent an attachment",
      conversationId: conversation.id,
      read: false,
      createdAt: now,
    });
  }
  await batch.commit();
};

export const markConversationRead = async (conversationId, uid) => {
  await setDoc(doc(db, "conversations", conversationId), {
    unread: { [uid]: 0 },
    readAt: { [uid]: serverTimestamp() },
  }, { merge: true });
};

export const updateGroupDetails = async (groupId, form) => {
  const payload = {
    name: form.name.trim(),
    nameLower: normalizeSearch(form.name),
    description: form.description.trim(),
    category: form.category,
    privacy: form.privacy,
    rules: form.rules.trim(),
    updatedAt: serverTimestamp(),
  };

  if (form.coverUrl !== undefined) payload.coverUrl = form.coverUrl;
  if (form.avatarUrl !== undefined) payload.avatarUrl = form.avatarUrl;
  if (form.coverAsset !== undefined) payload.coverAsset = form.coverAsset;
  if (form.avatarAsset !== undefined) payload.avatarAsset = form.avatarAsset;

  await updateDoc(doc(db, "groups", groupId), payload);
};

export const updateGroupMemberRole = async (group, member, role) => {
  if (!group?.id || !member?.id) return;
  if (member.role === "owner") throw new Error("The owner role cannot be changed here.");

  const batch = writeBatch(db);
  const groupRef = doc(db, "groups", group.id);
  const memberRef = doc(db, "groups", group.id, "members", member.id);
  const userGroupRef = doc(db, "users", member.id, "groups", group.id);

  batch.update(memberRef, { role });
  batch.set(userGroupRef, { role, name: group.name, groupId: group.id }, { merge: true });

  const groupUpdates = {
    updatedAt: serverTimestamp(),
    adminIds: role === "admin" ? arrayUnion(member.id) : arrayRemove(member.id),
    moderatorIds: role === "moderator" ? arrayUnion(member.id) : arrayRemove(member.id),
  };

  batch.update(groupRef, groupUpdates);
  await batch.commit();
};

export const removeGroupMember = async (group, member) => {
  if (!group?.id || !member?.id) return;
  if (member.role === "owner" || group.ownerId === member.id) {
    throw new Error("Transfer ownership before removing the owner.");
  }

  const batch = writeBatch(db);
  batch.delete(doc(db, "groups", group.id, "members", member.id));
  batch.delete(doc(db, "users", member.id, "groups", group.id));
  batch.update(doc(db, "groups", group.id), {
    memberCount: increment(-1),
    adminIds: arrayRemove(member.id),
    moderatorIds: arrayRemove(member.id),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });
  await batch.commit();
};
