import React, { useContext, useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { 
  Ban, 
  Check, 
  MessageCircle, 
  Save, 
  Search, 
  Settings, 
  ShieldAlert, 
  VolumeX, 
  UserX,
  BellOff
} from "lucide-react";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { searchUsers } from "../service/communityService";

const theme = (dark) => ({
  page: dark 
    ? "bg-[#070913] text-slate-100 selection:bg-indigo-500/30" 
    : "bg-slate-50 text-slate-900 selection:bg-indigo-100",
  panel: dark 
    ? "border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/40" 
    : "border-slate-200/80 bg-white shadow-xl shadow-slate-200/50",
  soft: dark 
    ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]" 
    : "border-slate-200/80 bg-slate-50/80 hover:bg-slate-100/80",
  input: dark 
    ? "border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-indigo-500/60 focus:bg-white/[0.07]" 
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
  muted: dark ? "text-slate-400" : "text-slate-500",
  cardActive: dark 
    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30" 
    : "border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600/20",
});

export default function CommunitySettings({ dark = false }) {
  const t = theme(dark);
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    dmPolicy: "everyone",
    dmsDisabled: false,
    blockedUsers: [],
    mutedConversations: [],
  });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const data = snap.exists() ? snap.data() : {};
      setSettings({
        dmPolicy: data.dmPolicy || "everyone",
        dmsDisabled: Boolean(data.dmsDisabled),
        blockedUsers: data.blockedUsers || [],
        mutedConversations: data.mutedConversations || [],
      });
    });
  }, [user]);

  useEffect(() => {
    if (search.trim().length < 2 || !user?.uid) {
      setResults([]);
      setIsSearching(false);
      return undefined;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchUsers(search, user.uid, 8);
      setResults(res || []);
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, user]);

  const save = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid), 
        { ...settings, updatedAt: serverTimestamp() }, 
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  const block = (item) => {
    setSettings((current) => ({
      ...current,
      blockedUsers: current.blockedUsers.some((userItem) => userItem.uid === item.id)
        ? current.blockedUsers
        : [
            ...current.blockedUsers, 
            { 
              uid: item.id, 
              name: item.username || item.email || "Student", 
              avatar: item.photo || "" 
            }
          ],
    }));
    setSearch("");
    setResults([]);
  };

  const unblock = (uid) => {
    setSettings((current) => ({
      ...current,
      blockedUsers: current.blockedUsers.filter((item) => item.uid !== uid),
    }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 md:py-10 ${t.page}`}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        
        {/* Header Banner */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 ${t.panel}`}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Settings size={13} className="animate-spin-slow" /> Preferences
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight">
            Community Settings
          </h1>
          <p className={`mt-1.5 text-sm leading-relaxed ${t.muted}`}>
            Manage your interaction preferences, safety boundaries, and privacy options across the platform.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          
          {/* Direct Messages Section */}
          <section className={`rounded-3xl border p-6 transition-all ${t.panel}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <MessageCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Direct Messaging</h2>
                <p className={`text-xs ${t.muted}`}>Configure who can initiate direct conversations with you</p>
              </div>
            </div>

            {/* Custom iOS Toggle */}
            <div className={`mt-6 flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${t.soft}`}>
              <div>
                <span className="block text-sm font-semibold">Disable Direct Messages</span>
                <span className={`mt-0.5 block text-xs ${t.muted}`}>
                  Prevents new conversations. Existing chats remain unaffected.
                </span>
              </div>
              
              <button
                type="button"
                role="switch"
                aria-checked={settings.dmsDisabled}
                onClick={() => setSettings({ ...settings, dmsDisabled: !settings.dmsDisabled })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  settings.dmsDisabled ? "bg-indigo-600" : dark ? "bg-white/10" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.dmsDisabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Policy Selection Cards */}
            <div className="mt-4">
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-wider ${t.muted}`}>
                Allowed Senders
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "everyone", label: "Everyone", desc: "Anyone in the community can send a message request" },
                  { value: "mutual_groups", label: "Mutual Groups Only", desc: "Only members sharing a group with you" },
                ].map((item) => {
                  const active = settings.dmPolicy === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={settings.dmsDisabled}
                      onClick={() => setSettings({ ...settings, dmPolicy: item.value })}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                        settings.dmsDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                      } ${active ? t.cardActive : t.soft}`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{item.label}</span>
                          {active && <Check size={16} className="text-indigo-400" />}
                        </div>
                        <p className={`mt-1 text-xs leading-relaxed ${t.muted}`}>{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Blocked Users Section */}
          <section className={`rounded-3xl border p-6 transition-all ${t.panel}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Ban size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Blocked Users</h2>
                <p className={`text-xs ${t.muted}`}>Blocked users cannot message you or see your direct activity</p>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative mt-5">
              <div className={`flex items-center gap-3 rounded-2xl border px-4 transition-all ${t.input}`}>
                <Search size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username or email to block..."
                  className="h-11 w-full bg-transparent text-sm outline-none"
                />
                {isSearching && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                )}
              </div>

              {/* Autocomplete Dropdown Results */}
              {results.length > 0 && (
                <div className={`absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border shadow-xl ${t.panel}`}>
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => block(item)}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-rose-500/10 border-b border-white/5 last:border-none"
                    >
                      <div className="flex items-center gap-3">
                        {item.photo ? (
                          <img src={item.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                            {(item.username || item.email || "S")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold">{item.username || item.email || "Student"}</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400">
                        <ShieldAlert size={14} /> Block
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Blocked List */}
            <div className="mt-4 space-y-2">
              {settings.blockedUsers.length === 0 ? (
                <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed py-8 text-center ${t.soft}`}>
                  <UserX size={32} className={`mb-2 opacity-40 ${t.muted}`} />
                  <p className={`text-xs font-medium ${t.muted}`}>No blocked users on your list.</p>
                </div>
              ) : (
                settings.blockedUsers.map((item) => (
                  <div
                    key={item.uid}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${t.soft}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.avatar ? (
                        <img src={item.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-500/20 text-xs font-bold">
                          {item.name[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="text-sm font-bold">{item.name}</span>
                    </div>
                    
                    <button
                      onClick={() => unblock(item.uid)}
                      className="rounded-xl border border-slate-200/20 bg-slate-500/10 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-rose-600 hover:text-white hover:border-transparent"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Muted Conversations Info */}
          <section className={`rounded-3xl border p-6 transition-all ${t.panel}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <VolumeX size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Muted Conversations</h2>
                <p className={`text-xs ${t.muted}`}>Manage notification preferences for chats</p>
              </div>
            </div>
            
            <div className={`mt-4 flex items-center justify-between rounded-2xl border p-4 ${t.soft}`}>
              <div className="flex items-center gap-3">
                <BellOff size={18} className="text-amber-400" />
                <span className="text-xs font-medium">Currently muted chats count</span>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                {settings.mutedConversations?.length || 0}
              </span>
            </div>
          </section>

          {/* Toast Notification */}
          {saved && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-sm font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
              <Check size={18} className="text-emerald-400" />
              Settings saved successfully!
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/35 active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save size={18} /> Save Settings
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}