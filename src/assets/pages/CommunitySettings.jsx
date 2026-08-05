import React, { useContext, useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Ban, MessageCircle, Save, Search, Settings, ShieldAlert, VolumeX } from "lucide-react";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { searchUsers } from "../service/communityService";

const theme = (dark) => ({
  page: dark ? "bg-[#050816] text-white" : "bg-[#f6f8fc] text-slate-950",
  panel: dark ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white",
  soft: dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50",
  input: dark ? "border-white/10 bg-white/5 text-white placeholder:text-white/40" : "border-slate-200 bg-white text-slate-900",
  muted: dark ? "text-slate-400" : "text-slate-500",
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
  const [saved, setSaved] = useState(false);

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
      return undefined;
    }
    const timer = setTimeout(async () => {
      setResults(await searchUsers(search, user.uid, 8));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, user]);

  const save = async () => {
    await setDoc(doc(db, "users", user.uid), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const block = (item) => {
    setSettings((current) => ({
      ...current,
      blockedUsers: current.blockedUsers.some((userItem) => userItem.uid === item.id)
        ? current.blockedUsers
        : [...current.blockedUsers, { uid: item.id, name: item.username || item.email || "Student", avatar: item.photo || "" }],
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
    <div className={`min-h-screen md:mt-20 ${t.page}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className={`rounded-3xl border p-5 md:p-7 ${t.panel}`}>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400">
            <Settings size={14} /> Settings
          </div>
          <h1 className="mt-4 text-3xl font-black">Community Settings</h1>
          <p className={`mt-2 text-sm ${t.muted}`}>Control who can message you, blocked users, and muted conversation metadata.</p>
        </div>

        <div className="mt-5 space-y-5">
          <section className={`rounded-3xl border p-5 ${t.panel}`}>
            <div className="flex items-center gap-3">
              <MessageCircle className="text-indigo-400" />
              <h2 className="text-xl font-black">Direct messages</h2>
            </div>

            <label className={`mt-5 flex items-center justify-between gap-4 rounded-2xl border p-4 ${t.soft}`}>
              <span>
                <span className="block font-bold">Disable DMs</span>
                <span className={`text-sm ${t.muted}`}>Existing conversations stay visible, but new starts can be blocked by rules.</span>
              </span>
              <input type="checkbox" checked={settings.dmsDisabled} onChange={(e) => setSettings({ ...settings, dmsDisabled: e.target.checked })} className="h-5 w-5" />
            </label>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { value: "everyone", label: "Allow everyone" },
                { value: "mutual_groups", label: "Mutual groups only" },
              ].map((item) => (
                <button key={item.value} onClick={() => setSettings({ ...settings, dmPolicy: item.value })} className={`rounded-2xl border p-4 text-left font-bold ${settings.dmPolicy === item.value ? "border-indigo-500 bg-indigo-500/10" : t.soft}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className={`rounded-3xl border p-5 ${t.panel}`}>
            <div className="flex items-center gap-3">
              <Ban className="text-red-400" />
              <h2 className="text-xl font-black">Blocked users</h2>
            </div>

            <div className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 ${t.soft}`}>
              <Search size={17} className="opacity-50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users to block" className="h-12 w-full bg-transparent text-sm outline-none" />
            </div>

            {results.length > 0 && (
              <div className={`mt-3 overflow-hidden rounded-2xl border ${t.soft}`}>
                {results.map((item) => (
                  <button key={item.id} onClick={() => block(item)} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-red-500/10">
                    <span className="font-bold">{item.username || item.email || "Student"}</span>
                    <ShieldAlert size={17} className="text-red-400" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {settings.blockedUsers.length === 0 ? (
                <div className={`rounded-2xl border p-4 text-sm ${t.soft} ${t.muted}`}>No blocked users.</div>
              ) : settings.blockedUsers.map((item) => (
                <div key={item.uid} className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${t.soft}`}>
                  <span className="font-bold">{item.name}</span>
                  <button onClick={() => unblock(item.uid)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Unblock</button>
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-3xl border p-5 ${t.panel}`}>
            <div className="flex items-center gap-3">
              <VolumeX className="text-amber-400" />
              <h2 className="text-xl font-black">Muted conversations</h2>
            </div>
            <p className={`mt-3 text-sm ${t.muted}`}>Muted conversation IDs are stored on your profile as `mutedConversations` for notification filtering.</p>
          </section>

          {saved && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm font-bold text-emerald-400">Settings saved</div>}

          <button onClick={save} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 font-bold text-white">
            <Save size={18} /> Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
