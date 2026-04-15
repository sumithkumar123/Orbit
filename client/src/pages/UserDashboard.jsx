import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Radio,
  LogOut,
  Search,
  Megaphone,
  User,
  ListFilter,
  CheckCircle2,
  CircleOff,
} from "lucide-react";
import OnlineList from "../components/OnlineList";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50 relative">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Radio className="h-5 w-5 text-brand" />
            <span className="font-semibold tracking-tight">OfflineOrbit</span>
          </div>

          {/* Global search */}
          <div className="relative w-full md:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-paper-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search or start a new chat"
              className="w-full rounded-xl bg-ink-800/70 border border-ink-600 pl-9 pr-3 py-2.5 text-sm text-paper-50 placeholder:text-paper-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Profile + Logout */}
          <div className="flex items-center gap-3 justify-end flex-shrink-0">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-800/60 px-3 py-2 text-sm font-medium text-paper-50 hover:bg-ink-700 transition"
              aria-label="Open profile"
            >
              <User className="h-4 w-4" />
              
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-paper-50 hover:bg-brand-600 transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body: user list */}
      <main className="mx-auto max-w-6xl px-4 py-4 pb-20">
        <section className="rounded-2xl border border-ink-700 bg-ink-800/60 backdrop-blur">
          <div className="px-4 py-3 border-b border-ink-700 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold text-paper-100">Chats</h2>
            <span className="text-xs text-paper-400">
              Select someone to start messaging
            </span>
          </div>

          <div className="px-4 py-3 border-b border-ink-800/80 flex flex-wrap gap-2">
            {[
              {
                value: "all",
                label: "All",
                icon: ListFilter,
                color: "text-paper-200",
              },
              {
                value: "online",
                label: "Online",
                icon: CheckCircle2,
                color: "text-emerald-400",
              },
              {
                value: "offline",
                label: "Offline",
                icon: CircleOff,
                color: "text-paper-400",
              },
            ].map(({ value, label, icon: Icon, color }) => {
              const active = statusFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-brand bg-brand/10 text-paper-50"
                      : "border-ink-600 bg-ink-800/60 text-paper-300 hover:bg-ink-700/60"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "" : color}`} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Online user list (already supports filterQuery + navigateOnClick) */}
          <OnlineList
            filterQuery={q}
            statusFilter={statusFilter}
            navigateOnClick
          />
        </section>
      </main>

      {/* Floating Broadcast Button */}
      <Link
        to="/broadcast"
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-paper-50 shadow-lg shadow-brand/40 hover:bg-brand-600 active:scale-95 transition-transform"
        aria-label="Open broadcast channel"
      >
        <Megaphone className="h-4 w-4" />
        <span className="hidden sm:inline">Broadcast</span>
      </Link>
    </div>
  );
};

export default UserDashboard;
