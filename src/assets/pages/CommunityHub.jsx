import React from "react";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Community from "./Community";
import Messenger from "./Messenger";

const CommunityHub = ({ dark = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const showChats = location.pathname === "/messages";
  const tabs = [
    { label: "Chats", path: "/messages", icon: MessageCircle, selected: showChats },
    { label: "Groups", path: "/community", icon: Users, selected: !showChats },
  ];

  return (
    <div className={dark ? "min-h-screen bg-[#050816] text-slate-100" : "min-h-screen bg-[#f5f7ff] text-slate-900"}>
      <header className={`border-b ${dark ? "border-slate-800 bg-[#0b1224]" : "border-slate-200 bg-white"}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(window.history.state?.idx > 0 ? -1 : "/", { replace: window.history.state?.idx <= 0 })}
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  dark
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-indigo-300" : "text-indigo-600"}`}>
                  UniHelp community
                </p>
                <p className={`mt-1 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  Connect with students and your groups.
                </p>
              </div>
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Community section"
            className={`inline-flex w-full rounded-xl border p-1 sm:w-auto ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-100"}`}
          >
            {tabs.map(({ label, path, icon: Icon, selected }) => (
              <button
                key={path}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="community-section-panel"
                onClick={() => {
                  if (location.pathname !== path) navigate(path);
                }}
                className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition sm:flex-none ${
                  selected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : dark
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div id="community-section-panel" role="tabpanel">
        {showChats ? <Messenger dark={dark} /> : <Community dark={dark} />}
      </div>
    </div>
  );
};

export default CommunityHub;
