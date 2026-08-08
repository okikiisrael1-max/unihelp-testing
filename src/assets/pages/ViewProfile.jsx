import React, { useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import {
  listenFriends,
  listenIncomingFriendRequests,
  listenOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "../service/friendshipService";

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  muted: dark ? "text-slate-400" : "text-slate-500",
  locked: dark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50/60",
});

const firstLetter = (name = "Student") => name.trim().charAt(0).toUpperCase() || "S";

const formatJoinDate = (value) => {
  if (!value) return null;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value.seconds ? value.seconds * 1000 : value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const StatPill = ({ icon: Icon, label, value, dark }) => (
  <div className={`flex items-center gap-3 rounded-2xl border p-3 ${dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-lg font-black leading-none">{value}</p>
      <p className={`mt-1 truncate text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
    </div>
  </div>
);

export default function ViewProfile({ dark = false }) {
  const t = theme(dark);
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [targetProfile, setTargetProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState("");

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  const isOwnProfile = !!user?.uid && user.uid === uid;

  // Load the target user's profile document
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setNotFound(false);
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setTargetProfile({ id: snap.id, ...snap.data() });
      })
      .catch(() => setNotice("Could not load this profile."))
      .finally(() => setLoading(false));
  }, [uid]);

  // Friendship listeners — same pattern as Messenger
  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenFriends(user.uid, (data) => setFriends(data));
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenIncomingFriendRequests(user.uid, (data) => setIncomingRequests(data));
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return listenOutgoingFriendRequests(user.uid, (data) => setOutgoingRequests(data));
  }, [user]);

  const areFriends = useMemo(() => {
    if (isOwnProfile) return true;
    return friends.some((friend) => friend.users?.includes?.(uid));
  }, [friends, uid, isOwnProfile]);

  const incomingRequest = useMemo(
    () => incomingRequests.find((request) => request.from === uid) || null,
    [incomingRequests, uid]
  );
  const outgoingRequest = useMemo(
    () => outgoingRequests.find((request) => request.to === uid) || null,
    [outgoingRequests, uid]
  );

  const canSeeFullProfile = isOwnProfile || areFriends;

  const handleSendRequest = async () => {
    if (!user?.uid || !uid) return;
    try {
      await sendFriendRequest({
        currentUid: user.uid,
        targetUid: uid,
        currentProfile: {},
        targetProfile: targetProfile || {},
      });
      setNotice("Friend request sent.");
    } catch (err) {
      setNotice(err.message || "Could not send friend request.");
    }
  };

  const handleAccept = async () => {
    if (!incomingRequest) return;
    try {
      await acceptFriendRequest({ request: incomingRequest, currentUid: user.uid, currentProfile: {} });
      setNotice("Friend request accepted.");
    } catch (err) {
      setNotice(err.message || "Could not accept friend request.");
    }
  };

  const handleDecline = async () => {
    if (!incomingRequest) return;
    try {
      await declineFriendRequest({ request: incomingRequest, currentUid: user.uid, currentProfile: {} });
    } catch (err) {
      setNotice(err.message || "Could not decline friend request.");
    }
  };

  const handleCancel = async () => {
    if (!outgoingRequest) return;
    try {
      await cancelFriendRequest({ requestId: outgoingRequest.id, currentUid: user.uid });
    } catch (err) {
      setNotice(err.message || "Could not cancel friend request.");
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center md:mt-20 ${t.page}`}>
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center md:mt-20 ${t.page}`}>
        <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${t.soft}`}>
          <UserX size={28} className="opacity-50" />
        </div>
        <div>
          <h1 className="text-xl font-black">Profile not found</h1>
          <p className={`mt-1 text-sm ${t.muted}`}>This student's profile doesn't exist or may have been removed.</p>
        </div>
        <button onClick={() => navigate(-1)} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
          Go back
        </button>
      </div>
    );
  }

  const name = targetProfile?.name || targetProfile?.username || "Student";
  const username = targetProfile?.username && targetProfile.username !== name ? `@${targetProfile.username}` : null;
  const avatar = targetProfile?.avatar || targetProfile?.photo || "";
  const school = targetProfile?.school || targetProfile?.university || "";
  const department = targetProfile?.department || "";
  const level = targetProfile?.level || targetProfile?.year || "";
  const bio = targetProfile?.bio || "";
  const joinDate = formatJoinDate(targetProfile?.createdAt);
  const xp = targetProfile?.xp ?? targetProfile?.gamification?.xp ?? 0;
  const streak = targetProfile?.streak ?? targetProfile?.gamification?.streak ?? 0;
  const gamificationLevel = targetProfile?.gamificationLevel ?? targetProfile?.gamification?.level ?? 1;
  const badges = targetProfile?.badges || targetProfile?.gamification?.badges || [];

  return (
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Back bar */}
        <button
          onClick={() => navigate(-1)}
          className={`mb-4 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold ${t.soft}`}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {notice && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-semibold text-amber-400">
            {notice}
          </div>
        )}

        {/* Header card */}
        <div className={`overflow-hidden rounded-3xl border ${t.panel}`}>
          <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 sm:h-28" />
          <div className="px-5 pb-5 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col items-start gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className={`h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 sm:h-28 sm:w-28 ${dark ? "border-[#050816]" : "border-white"} bg-indigo-500`}>
                  {avatar ? (
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">{firstLetter(name)}</div>
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-2xl font-black sm:text-3xl">{name}</h1>
                  {username && <p className={`text-sm font-semibold ${t.muted}`}>{username}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                {isOwnProfile ? (
                  <Link
                    to="/profile-settings"
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 sm:flex-none"
                  >
                    Edit profile
                  </Link>
                ) : (
                  <>
                    {canSeeFullProfile && (
                      <Link
                        to={`/messenger?user=${uid}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold hover:bg-black/5 dark:hover:bg-white/10 sm:flex-none"
                        style={{ borderColor: dark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }}
                      >
                        <MessageCircle size={16} /> Message
                      </Link>
                    )}
                    {areFriends ? null : incomingRequest ? (
                      <button onClick={handleAccept} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 sm:flex-none">
                        <UserCheck size={16} /> Accept
                      </button>
                    ) : outgoingRequest ? (
                      <button onClick={handleCancel} className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold ${t.soft} sm:flex-none`}>
                        <Clock size={16} /> Pending
                      </button>
                    ) : (
                      <button onClick={handleSendRequest} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 sm:flex-none">
                        <UserPlus size={16} /> Add friend
                      </button>
                    )}
                    {incomingRequest && (
                      <button onClick={handleDecline} className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold text-red-500 sm:flex-none ${dark ? "border-red-400/20 bg-red-400/10" : "border-red-200 bg-red-50"}`}>
                        <UserX size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Public info row */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {school && (
                <span className={`inline-flex items-center gap-1.5 font-semibold ${t.muted}`}>
                  <GraduationCap size={15} /> {school}
                </span>
              )}
              {department && (
                <span className={`inline-flex items-center gap-1.5 font-semibold ${t.muted}`}>
                  <BookOpen size={15} /> {department}
                </span>
              )}
              {level && (
                <span className={`inline-flex items-center gap-1.5 font-semibold ${t.muted}`}>
                  <MapPin size={15} /> {level}
                </span>
              )}
              {joinDate && (
                <span className={`inline-flex items-center gap-1.5 font-semibold ${t.muted}`}>
                  <Calendar size={15} /> Joined {joinDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Full profile (friends + self only) */}
        {canSeeFullProfile ? (
          <div className="mt-4 space-y-4">
            {bio && (
              <div className={`rounded-3xl border p-5 ${t.panel}`}>
                <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-indigo-500">About</h2>
                <p className="whitespace-pre-wrap text-sm leading-6">{bio}</p>
              </div>
            )}

            <div className={`rounded-3xl border p-5 ${t.panel}`}>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-indigo-500">Stats</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill icon={Sparkles} label="XP" value={xp} dark={dark} />
                <StatPill icon={Flame} label="Day streak" value={streak} dark={dark} />
                <StatPill icon={Star} label="Level" value={gamificationLevel} dark={dark} />
                <StatPill icon={Users} label="Friends" value={friends.length || "—"} dark={dark} />
              </div>
            </div>

            {badges.length > 0 && (
              <div className={`rounded-3xl border p-5 ${t.panel}`}>
                <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-indigo-500">Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <span
                      key={badge.id || badge.name || index}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${dark ? "bg-indigo-400/10 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}
                    >
                      <Trophy size={13} /> {badge.name || badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`mt-4 flex flex-col items-center gap-3 rounded-3xl border p-8 text-center ${t.locked}`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.soft}`}>
              <Lock size={20} className="opacity-60" />
            </div>
            <div>
              <p className="font-extrabold">Full profile is friends-only</p>
              <p className={`mt-1 max-w-xs text-sm ${t.muted}`}>
                Add {name.split(" ")[0]} as a friend to see their bio, stats, and badges.
              </p>
            </div>
          </div>
        )}

        {/* Award icon kept for future use (e.g. featured achievement) */}
        <span className="hidden"><Award /></span>
      </div>
    </div>
  );
}