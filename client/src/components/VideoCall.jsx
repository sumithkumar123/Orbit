// src/components/VideoCall.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Video as CamOn, VideoOff, ChevronLeft } from "lucide-react";
import { useCall } from "../hooks/useCall";

export default function VideoCall() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { state, remoteUser, localStream, remoteStream, toggleMute, toggleCamera, hangup } = useCall();

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);

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
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
      localRef.current.muted = true;
      localRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
      remoteRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  return (
    <div className="min-h-screen bg-black text-paper-50 relative">
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-ink-900/40 backdrop-blur">
        <button onClick={() => { hangup(); navigate(-1); }} className="inline-flex items-center gap-2 text-paper-300 hover:text-paper-50">
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <div className="text-center">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-paper-300">{subtitle}</div>
        </div>
        <div className="w-5" />
      </header>

      {/* remote full screen */}
      <video ref={remoteRef} className="absolute inset-0 w-full h-full object-cover bg-black" playsInline autoPlay />

      {/* local PiP */}
      <video ref={localRef} className="absolute right-4 bottom-28 sm:bottom-24 w-36 h-24 rounded-lg border border-ink-700 bg-black object-cover" playsInline autoPlay muted />

      {/* controls */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-6 w-[min(680px,92vw)]">
        <div className="rounded-2xl bg-ink-900/70 border border-ink-700 px-4 py-3 grid grid-cols-5 gap-3">
          <button
            className="rounded-xl bg-ink-700 text-paper-50 border border-ink-600 py-3"
            onClick={() => { const next = !camOn; setCamOn(next); toggleCamera(next); }}
            title={camOn ? "Turn camera off" : "Turn camera on"}
          >
            {camOn ? <VideoOff className="mx-auto h-5 w-5" /> : <CamOn className="mx-auto h-5 w-5" />}
          </button>
          <button
            className="rounded-xl bg-ink-700 text-paper-50 border border-ink-600 py-3"
            onClick={() => { const next = !muted; setMuted(next); toggleMute(next); }}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff className="mx-auto h-5 w-5" /> : <Mic className="mx-auto h-5 w-5" />}
          </button>
          <div />
          <div />
          <button className="rounded-xl bg-brand text-paper-50 py-3" onClick={() => { hangup(); navigate(-1); }}>
            <PhoneOff className="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
