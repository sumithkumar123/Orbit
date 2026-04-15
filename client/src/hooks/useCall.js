// client/src/hooks/useCall.js
import { useEffect, useRef, useState } from "react";
import { connectSocket, getSocket } from "../lib/socket";

// MVP: no TURN. Works best on same AP. (We'll add TURN later.)
export default function useCall(meId) {
  // idle | calling | incoming | connecting | in_call
  const [state, setState] = useState("idle");
  const [remoteUser, setRemoteUser] = useState(null); // { userId }
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [incomingHasVideo, setIncomingHasVideo] = useState(false);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const pcRef = useRef(null);

  // 🧠 NEW: queue for early ICE candidates
  const pendingRemoteCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);

  const ensureSocket = () => getSocket() || connectSocket();

  // --- utils ---
  const sdpHasVideo = (desc) =>
    typeof desc?.sdp === "string" && /m=video/.test(desc.sdp);

  // --- Peer Connection setup ---
  const ensurePc = () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: [] });

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const to = remoteUser?.userId || remoteUser;
      if (!to) return;
      ensureSocket().emit("call:ice", { to, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => {
        remoteStreamRef.current.addTrack(t);
      });
    };

    pc.onconnectionstatechange = () => {
      console.log("[pc] connectionState:", pc.connectionState);
      if (pc.connectionState === "connected") setState("in_call");
      if (
        ["failed", "disconnected", "closed"].includes(pc.connectionState)
      ) {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // --- Media handling ---
  const startLocalMedia = async (withVideo) => {
    // stop previous tracks if any
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
    }

    const constraints = withVideo
      ? { audio: true, video: { width: 640, height: 360, frameRate: 24 } }
      : { audio: true, video: false };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;

    const pc = ensurePc();
    // clear old senders before adding new tracks
    pc.getSenders().forEach((s) => {
      try {
        pc.removeTrack(s);
      } catch {}
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    return stream;
  };

  // --- ICE candidate queue logic ---
  const addIceCandidateSafe = async (candidate) => {
    const pc = ensurePc();
    if (!candidate) return;

    if (!remoteDescSetRef.current || !pc.remoteDescription) {
      // queue ICE until remote SDP is ready
      pendingRemoteCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[sig] addIceCandidate deferred; queued again", err);
      pendingRemoteCandidatesRef.current.push(candidate);
    }
  };

  const flushQueuedIce = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingRemoteCandidatesRef.current.splice(0);
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn("flush ICE failed", e);
      }
    }
  };

  const cleanup = () => {
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;

    remoteStreamRef.current = new MediaStream();

    remoteDescSetRef.current = false;
    pendingRemoteCandidatesRef.current = [];

    setRemoteUser(null);
    setIncomingOffer(null);
    setIncomingHasVideo(false);
    setState("idle");
  };

  // --- signaling listeners ---
  useEffect(() => {
    const s = ensureSocket();

    const onRing = ({ from, offer }) => {
      console.log("[sig] incoming offer from", from);
      setRemoteUser({ userId: from });
      setIncomingOffer(offer);
      setIncomingHasVideo(sdpHasVideo(offer));
      setState("incoming");
    };

    const onAnswer = async ({ from, answer }) => {
      console.log("[sig] got answer from", from);
      const pc = ensurePc();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      remoteDescSetRef.current = true;
      await flushQueuedIce();
      setState("connecting");
    };

    const onIce = async ({ from, candidate }) => {
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

  // --- actions ---
  const callAudio = async (toUser) => callUserInternal(toUser, false);
  const callVideo = async (toUser) => callUserInternal(toUser, true);

  const callUserInternal = async (toUser, withVideo) => {
    const to = toUser?.userId || toUser;
    if (!to) return;

    setRemoteUser({ userId: to });
    setState("calling");

    await startLocalMedia(withVideo);
    const pc = ensurePc();

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: withVideo,
    });
    await pc.setLocalDescription(offer);

    ensureSocket().emit("call:ring", { to, offer }, (ack) => {
      if (!ack?.ok) {
        console.warn("[sig] call:ring failed", ack?.error);
        cleanup();
      }
    });
  };

  const accept = async () => {
    if (!incomingOffer || !remoteUser) return;

    const needVideo = incomingHasVideo;
    await startLocalMedia(needVideo);
    const pc = ensurePc();

    await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
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
      ensureSocket().emit("call:end", {
        to: remoteUser.userId,
        reason: "decline",
      });
    }
    cleanup();
  };

  const hangup = () => {
    if (remoteUser) {
      ensureSocket().emit("call:end", {
        to: remoteUser.userId,
        reason: "hangup",
      });
    }
    cleanup();
  };

  // Controls during call (no renegotiation)
  const toggleMute = (mute) => {
    localStreamRef.current?.getAudioTracks().forEach(
      (t) => (t.enabled = !mute)
    );
  };

  const toggleCamera = (on) => {
    const v = localStreamRef.current?.getVideoTracks?.()[0];
    if (v) v.enabled = on;
  };

  return {
    state,
    remoteUser,
    incomingOffer,
    incomingHasVideo,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    callAudio,
    callVideo,
    accept,
    decline,
    hangup,
    toggleMute,
    toggleCamera,
  };
}

export { useCall } from "../context/CallContext";