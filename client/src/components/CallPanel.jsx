import React, { useEffect, useRef, useState } from 'react';
import useCall from '../hooks/useCall';
import useSystemState from '../hooks/useSystemState';

export default function CallPanel({ meId, targetUser }) {
  const {
    state, remoteUser, localStream, remoteStream,
    incomingOffer, incomingHasVideo,
    callAudio, callVideo, accept, decline, hangup,
    toggleMute, toggleCamera
  } = useCall(meId);

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const { running } = useSystemState();

  // 🔗 Listen to header triggers: call:start (audio|video)
  useEffect(() => {
    const onStart = (e) => {
      const { type, target } = e.detail || {};
      if (!target || !running) return;
      if (type === 'audio') callAudio(target);
      if (type === 'video') callVideo(target);
    };
    window.addEventListener('call:start', onStart);
    return () => window.removeEventListener('call:start', onStart);
  }, [callAudio, callVideo, running]);

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
    <div className="space-y-3 bg-yellow-500">
      <div className="text-sm text-paper-400">
        Call state: <b className="text-paper-200">{state}</b>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="px-3 py-2 bg-green-600 text-white rounded-xl disabled:opacity-50"
          onClick={() => callAudio(targetUser)}
          disabled={!running || !targetUser || state !== 'idle'}
        >
          Audio Call
        </button>
        <button
          className="px-3 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
          onClick={() => callVideo(targetUser)}
          disabled={!running || !targetUser || state !== 'idle'}
        >
          Video Call
        </button>
        <button
          className="px-3 py-2 bg-brand text-paper-50 rounded-xl disabled:opacity-50"
          onClick={hangup}
          disabled={state === 'idle'}
        >
          Hang up
        </button>
        <button
          className="px-3 py-2 bg-ink-700 text-paper-50 border border-ink-600 rounded-xl disabled:opacity-50"
          onClick={() => { const next = !muted; setMuted(next); toggleMute(next); }}
          disabled={state === 'idle'}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          className="px-3 py-2 bg-ink-700 text-paper-50 border border-ink-600 rounded-xl disabled:opacity-50"
          onClick={() => { const next = !camOn; setCamOn(next); toggleCamera(next); }}
          disabled={state === 'idle'}
          title="Pause/Resume camera (if negotiated)"
        >
          {camOn ? 'Camera Off' : 'Camera On'}
        </button>
      </div>

      {state === 'incoming' && remoteUser && (
        <div className="p-3 border border-ink-700 rounded-xl bg-ink-800/70 flex items-center justify-between">
          <div className="text-paper-200">
            Incoming {incomingHasVideo ? 'video' : 'audio'} call from <b>{remoteUser.userId}</b>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-brand text-paper-50 rounded-xl" onClick={accept}>Accept</button>
            <button className="px-3 py-1.5 bg-ink-700 text-paper-50 border border-ink-600 rounded-xl" onClick={decline}>Decline</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <div>
          <div className="text-xs text-paper-400 mb-1">Me</div>
          <video ref={localRef} autoPlay playsInline muted className="w-full rounded-xl bg-black border border-ink-700" />
        </div>
        <div>
          <div className="text-xs text-paper-400 mb-1">Remote</div>
          <video ref={remoteRef} autoPlay playsInline className="w-full rounded-xl bg-black border border-ink-700" />
        </div>
      </div>
    </div>
  );
}
