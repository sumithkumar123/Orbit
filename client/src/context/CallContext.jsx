// src/context/CallContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { connectSocket, getSocket } from "../lib/socket";

const CallContext = createContext(null);

export function CallProvider({ children }) {
  // "idle" | "calling" | "incoming" | "connecting" | "active"
  const [state, setState] = useState("idle");
  const [remoteUser, setRemoteUser] = useState(null); // { userId, name? }
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [incomingHasVideo, setIncomingHasVideo] = useState(false);

  const [localStream, setLocalStream] = useState(null);

  // Keep one remote stream instance forever to avoid re-render loops.
  const remoteStreamRef = useRef(new MediaStream());
  const remoteStream = remoteStreamRef.current;

  const pcRef = useRef(null);
  const cleaningRef = useRef(false); // re-entrancy guard for cleanup

  // ICE ordering safety
  const pendingRemoteCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);

  const ensureSocket = () => getSocket() || connectSocket();
  const sdpHasVideo = (desc) => typeof desc?.sdp === "string" && /m=video/.test(desc.sdp);

  const ensurePc = () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [], // Force LAN-only (no STUN/TURN) for local network stability
    });

    pc.oniceconnectionstatechange = () => {
      console.log("[pc] iceConnectionState:", pc.iceConnectionState);
      // If we go to "disconnected" or "failed", we might want to show that
    };

    pc.onicecandidate = (e) => {
      // Log EVERYTHING initially to see if we are getting anything at all
      if (e.candidate) {
        console.log("[ice] RAW candidate:", e.candidate.candidate);
      } else {
        console.log("[ice] gathering finished (null candidate)");
        return;
      }

      // ⚠️ IPv6 Filter: Ignore candidates with colons (e.g. [2001:...])
      if (e.candidate.address && e.candidate.address.includes(':')) {
        console.log("[ice] ignoring IPv6 candidate:", e.candidate.address);
        return;
      }

      console.log("[ice] local candidate (v4):", e.candidate.type, e.candidate.address);
      const to = remoteUser?.userId || remoteUser;
      if (!to) return;
      ensureSocket().emit("call:ice", { to, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      // Do NOT set React state here (prevents render loops).
      if (e.streams && e.streams[0]) {
        // Add every track from the provided stream if not present
        e.streams[0].getTracks().forEach((track) => {
          const exists = remoteStream.getTracks().some((t) => t.id === track.id);
          if (!exists) remoteStream.addTrack(track);
        });
      } else if (e.track) {
        const exists = remoteStream.getTracks().some((t) => t.id === e.track.id);
        if (!exists) remoteStream.addTrack(e.track);
      }
    };

    pc.onconnectionstatechange = () => {
      const cs = pc.connectionState;
      console.log("[pc] connectionState:", cs);
      if (cs === "connected") setState("active");
      if (cs === "failed" || cs === "closed") {
        console.error("Connection failed or closed:", cs);
        if (state === "active" || state === "connecting") {
          alert("Call connection failed. Please check network/firewalls.");
        }
        cleanup();
      }
      // 'disconnected' can be temporary (e.g. flaky wifi), so we don't auto-kill
    };

    pcRef.current = pc;
    return pc;
  };

  const startLocalMedia = async (withVideo) => {
    console.log("[media] startLocalMedia requesting access...");
    // stop old tracks if any
    if (localStream) {
      try { localStream.getTracks().forEach((t) => t.stop()); } catch { }
    }
    const constraints = withVideo
      ? { audio: true, video: { width: 640, height: 360, frameRate: 24 } }
      : { audio: true, video: false };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("[media] success, got stream:", stream.id);
    setLocalStream(stream);

    const pc = ensurePc();
    // Clear old senders before adding new tracks
    pc.getSenders().forEach((s) => {
      try { pc.removeTrack(s); } catch { }
    });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    return stream;
  };

  const addIceCandidateSafe = async (candidate) => {
    const pc = ensurePc();
    if (!candidate) return;

    if (!remoteDescSetRef.current || !pc.remoteDescription) {
      pendingRemoteCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[sig] addIceCandidate failed, re-queue", err);
      pendingRemoteCandidatesRef.current.push(candidate);
    }
  };

  const flushQueuedIce = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingRemoteCandidatesRef.current.splice(0);
    for (const c of queued) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch (e) { console.warn("flush ICE failed", e); }
    }
  };

  const cleanup = () => {
    if (cleaningRef.current) return; // prevent loops
    cleaningRef.current = true;

    try { pcRef.current?.close(); } catch { }
    pcRef.current = null;

    try { localStream?.getTracks().forEach((t) => t.stop()); } catch { }
    setLocalStream(null);

    // Remove tracks from remote stream without replacing the object
    try { remoteStream.getTracks().forEach((t) => remoteStream.removeTrack(t)); } catch { }

    remoteDescSetRef.current = false;
    pendingRemoteCandidatesRef.current = [];

    setRemoteUser(null);
    setIncomingOffer(null);
    setIncomingHasVideo(false);
    setState("idle");

    cleaningRef.current = false;
  };

  // --- Signaling listeners (once) ---
  useEffect(() => {
    const s = ensureSocket();

    const onRing = ({ from, offer, fromName }) => {
      console.log("[sig] incoming offer from", from);
      setRemoteUser({ userId: from, name: fromName || undefined });
      setIncomingOffer(offer);
      setIncomingHasVideo(sdpHasVideo(offer));
      setState("incoming");
    };

    const onAnswer = async ({ from, answer }) => {
      console.log("[sig] got answer from", from);
      const pc = ensurePc();
      const rd = answer?.type ? answer : new RTCSessionDescription(answer);
      await pc.setRemoteDescription(rd);
      remoteDescSetRef.current = true;
      await flushQueuedIce();
      setState("connecting");
    };

    const onIce = async ({ from, candidate }) => {
      console.log("[ice] incoming candidate from", from, candidate?.type, candidate?.address);
      await addIceCandidateSafe(candidate);
    };

    const onEnd = ({ from, reason }) => {
      console.log("[sig] call:end", reason || "");
      cleanup();
    };

    s.on("call:ring", onRing);
    s.on("call:answer", onAnswer);
    s.on("call:ice", onIce);
    s.on("call:end", onEnd);

    return () => {
      s.off("call:ring", onRing);
      s.off("call:answer", onAnswer);
      s.off("call:ice", onIce);
      s.off("call:end", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Actions ---
  const callUserInternal = async (toUser, withVideo) => {
    const to = toUser?.userId || toUser;
    if (!to) return;

    // Set a friendly name if known
    setRemoteUser({ userId: to, name: toUser?.name || undefined });
    setState("calling");

    try {
      await startLocalMedia(withVideo);
    } catch (err) {
      console.error("Failed to get local media:", err);
      alert(
        "Could not access microphone/camera. \n\n" +
        "If you are on a different device on the network, browsers block media on 'http://'.\n" +
        "Solution: Enable 'Insecure origins treated as secure' in chrome://flags for this IP."
      );
      setState("idle");
      return;
    }
    const pc = ensurePc();

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: withVideo,
    });
    await pc.setLocalDescription(offer);

    // Try to pass my display name (optional; server just forwards if present)
    let myName;
    try {
      const token = localStorage.getItem("token") || "";
      const payload = JSON.parse(atob(token.split(".")[1] || "e30="));
      myName = payload?.name;
    } catch { }

    ensureSocket().emit("call:ring", { to, offer, fromName: myName }, (ack) => {
      if (!ack?.ok) {
        console.warn("[sig] call:ring failed", ack?.error);
        cleanup();
      }
    });
  };

  const callAudio = async (toUser) => callUserInternal(toUser, false);
  const callVideo = async (toUser) => callUserInternal(toUser, true);

  const accept = async () => {
    if (!incomingOffer || !remoteUser) return;
    const needVideo = incomingHasVideo;

    await startLocalMedia(needVideo);
    const pc = ensurePc();

    const rd = incomingOffer?.type ? incomingOffer : new RTCSessionDescription(incomingOffer);
    await pc.setRemoteDescription(rd);
    remoteDescSetRef.current = true;
    await flushQueuedIce();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    ensureSocket().emit("call:answer", { to: remoteUser.userId, answer });
    setIncomingOffer(null);
    setState("connecting");
  };

  const decline = () => {
    if (remoteUser) {
      ensureSocket().emit("call:end", { to: remoteUser.userId, reason: "decline" });
    }
    cleanup();
  };

  const hangup = () => {
    if (remoteUser) {
      ensureSocket().emit("call:end", { to: remoteUser.userId, reason: "hangup" });
    }
    cleanup();
  };

  const toggleMute = (mute) => {
    localStream?.getAudioTracks()?.forEach((t) => (t.enabled = !mute));
  };

  const toggleCamera = (on) => {
    const v = localStream?.getVideoTracks?.()[0];
    if (v) v.enabled = on;
  };

  const value = useMemo(
    () => ({
      state,
      remoteUser,
      incomingOffer,
      incomingHasVideo,
      localStream,
      remoteStream,
      callAudio,
      callVideo,
      accept,
      decline,
      hangup,
      toggleMute,
      toggleCamera,
    }),
    [
      state,
      remoteUser,
      incomingOffer,
      incomingHasVideo,
      localStream,
      // remoteStream is intentionally omitted: it’s stable (same instance)
    ]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within <CallProvider>");
  return ctx;
}
