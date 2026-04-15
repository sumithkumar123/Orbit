// src/components/AudioCall.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Volume2, ChevronLeft } from "lucide-react";
import { useCall } from "../hooks/useCall";

import Avatar from "./Avatar";

export default function AudioCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, remoteUser, remoteStream, toggleMute, hangup } = useCall();

  const [muted, setMuted] = useState(false);
  const remoteAudioRef = useRef(null);

  const title = useMemo(() => remoteUser?.name || remoteUser?.userId || id, [remoteUser, id]);

  const subtitle = useMemo(() => {
    switch (state) {
      case "calling": return "Ringing…";
      case "incoming": return "Incoming call…";
      case "connecting": return "Connecting…";
      case "active": return "On call";
      default: return state;
    }
  }, [state]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => { });
    }
  }, [remoteStream]);

  // ❌ No auto-hangup on re-renders; user leaves via Back/End.
  // If you want to hang up on page leave only, add a beforeunload listener instead.

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50 relative">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <header className="flex items-center justify-between px-4 py-3 border-b border-ink-700 bg-ink-800/60">
        <button onClick={() => { hangup(); navigate(-1); }} className="inline-flex items-center gap-2 text-paper-300 hover:text-paper-50">
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <div className="text-center">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-paper-400">{subtitle}</div>
        </div>
        <div className="w-5" />
      </header>

      <main className="px-4 pt-10 flex flex-col items-center">
        <Avatar name={title} className="h-40 w-40 rounded-full border border-ink-700 bg-ink-800" />
      </main>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-8 w-[min(680px,92vw)]">
        {/* Debug Info Overlay */}
        <div className="mb-2 p-2 bg-black/50 text-[10px] text-white rounded font-mono hidden md:block">
          State: {state} | Remote: {remoteUser?.name} <br />
          (Check console for ICE logs)
        </div>

        <div className="rounded-2xl bg-ink-800/80 border border-ink-700 px-4 py-3 grid grid-cols-3 gap-3">
          <button className="rounded-xl bg-ink-700 text-paper-50 border border-ink-600 py-3">
            <Volume2 className="mx-auto h-5 w-5" />
          </button>
          <button
            className="rounded-xl bg-ink-700 text-paper-50 border border-ink-600 py-3"
            onClick={() => { const next = !muted; setMuted(next); toggleMute(next); }}
          >
            {muted ? <MicOff className="mx-auto h-5 w-5" /> : <Mic className="mx-auto h-5 w-5" />}
          </button>
          <button className="rounded-xl bg-brand text-paper-50 py-3" onClick={() => { hangup(); navigate(-1); }}>
            <PhoneOff className="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
