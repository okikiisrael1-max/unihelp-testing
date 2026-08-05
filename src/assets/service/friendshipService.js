import {
  addDoc,
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
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase/config";

export const FRIEND_PAGE_SIZE = 20;
export const REQUEST_PAGE_SIZE = 20;
export const DAILY_FRIEND_REQUEST_LIMIT = 40;

export const RELATIONSHIP = {
  NONE: "none",
  SENT: "sent",
  RECEIVED: "received",
  FRIENDS: "friends",
  BLOCKED: "blocked",
};

const mapDocs = (snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

export const pairId = (uidA, uidB) => [uidA, uidB].sort().join("_");
export const directedId = (from, to) => `${from}_${to}`;

const todayKey = () => new Date().toISOString().slice(0, 10);

const userName = (profile = {}, fallback = "Student") => (
  profile.username || profile.name || profile.displayName || profile.email || fallback
);

const profileSummary = (uid, profile = {}) => ({
  uid,
  name: userName(profile),
  username: profile.username || profile.name || "",
  email: profile.email || "",
  avatar: profile.photo || profile.avatar || profile.photoURL || "",
  university: profile.university || profile.school || "",
  school: profile.school || profile.university || "",
  faculty: profile.faculty || "",
  department: profile.department || "",
  level: profile.level || "",
  interests: Array.isArray(profile.interests) ? profile.interests : [],
  role: profile.role || "",
  verifiedTutor: !!profile.verifiedTutor,
  online: profile.online === true,
  lastActiveAt: profile.lastActiveAt || null,
});

export const listenFriends = (uid, callback, pageSize = FRIEND_PAGE_SIZE) => {
  if (!uid) return () => {};
  const q = query(
    collection(db, "friends"),
    where("users", "array-contains", uid),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(q, (snap) => callback(mapDocs(snap)));
};

export const listenIncomingFriendRequests = (uid, callback) => {
  if (!uid) return () => {};
  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", uid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(REQUEST_PAGE_SIZE)
  );
  return onSnapshot(q, (snap) => callback(mapDocs(snap)));
};

export const listenOutgoingFriendRequests = (uid, callback) => {
  if (!uid) return () => {};
  const q = query(
    collection(db, "friendRequests"),
    where("from", "==", uid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(REQUEST_PAGE_SIZE)
  );
  return onSnapshot(q, (snap) => callback(mapDocs(snap)));
};

export const sendFriendRequest = async ({ currentUid, targetUid, currentProfile = {}, targetProfile = {} }) => {
  await runTransaction(db, async (transaction) => {
    if (!currentUid || !targetUid) throw new Error("Missing user information.");
    if (currentUid === targetUid) throw new Error("You cannot interact with yourself.");

    const friendshipRef = doc(db, "friends", pairId(currentUid, targetUid));
    const requestRef = doc(db, "friendRequests", pairId(currentUid, targetUid));
    const [friendshipSnap, requestSnap] = await Promise.all([
      transaction.get(friendshipRef),
      transaction.get(requestRef),
    ]);

    if (friendshipSnap.exists()) throw new Error("You are already friends.");
    if (requestSnap.exists() && requestSnap.data()?.status === "pending") {
      throw new Error("A pending friend request already exists.");
    }

    transaction.set(requestRef, {
      from: currentUid,
      to: targetUid,
      status: "pending",
      fromProfile: profileSummary(currentUid, currentProfile),
      toProfile: profileSummary(targetUid, targetProfile),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
};

export const acceptFriendRequest = async ({ request, currentUid, currentProfile = {} }) => {
  if (!request?.id) throw new Error("Missing friend request.");
  if (request.to !== currentUid) throw new Error("Only the receiver can accept this request.");

  await runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "friendRequests", request.id);
    const snap = await transaction.get(requestRef);
    if (!snap.exists() || snap.data()?.status !== "pending") throw new Error("This request is no longer pending.");

    const senderProfile = request.fromProfile || {};
    const friendshipId = pairId(request.from, currentUid);

    transaction.set(doc(db, "friends", friendshipId), {
      users: [request.from, currentUid].sort(),
      memberIds: [request.from, currentUid].sort(),
      profiles: {
        [request.from]: profileSummary(request.from, senderProfile),
        [currentUid]: profileSummary(currentUid, currentProfile),
      },
      createdAt: serverTimestamp(),
    }, { merge: true });

    transaction.update(requestRef, {
      status: "accepted",
      updatedAt: serverTimestamp(),
      respondedAt: serverTimestamp(),
      respondedBy: currentUid,
    });
  });
};

export const declineFriendRequest = async ({ request, currentUid }) => {
  if (!request?.id) throw new Error("Missing friend request.");
  if (request.to !== currentUid) throw new Error("Only the receiver can decline this request.");
  await updateDoc(doc(db, "friendRequests", request.id), {
    status: "declined",
    updatedAt: serverTimestamp(),
    respondedAt: serverTimestamp(),
    respondedBy: currentUid,
  });
};

export const cancelFriendRequest = async ({ requestId, currentUid }) => {
  const ref = doc(db, "friendRequests", requestId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.from !== currentUid) throw new Error("Only the sender can cancel this request.");
    if (data.status !== "pending") throw new Error("This request is no longer pending.");
    transaction.delete(ref);
  });
};