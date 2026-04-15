import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone } from "lucide-react";
import BroadcastPanel from "../components/BroadcastPanel";

export default function BroadcastPage() {
  const navigate = useNavigate();
  const meId = JSON.parse(
    atob((localStorage.getItem("token") || "").split(".")[1] || "e30=")
  )?.id;

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-900/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-paper-300 hover:text-paper-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-brand" />
            <div className="flex flex-col">
              <span className="font-semibold leading-none">
                Broadcast Channel
              </span>
              <span className="text-[11px] text-paper-400">
                Send announcements to everyone online
              </span>
            </div>
          </div>
          <div className="w-12" /> {/* spacer */}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-4">
        <section className="rounded-2xl border border-ink-700 bg-ink-800/70 backdrop-blur p-4 sm:p-5">
          <BroadcastPanel meId={meId} />
        </section>
      </main>
    </div>
  );
}
