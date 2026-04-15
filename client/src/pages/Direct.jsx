// src/pages/Direct.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Phone, Video, Circle } from "lucide-react";
import usePresence from "../hooks/usePresence";
import useSystemState from "../hooks/useSystemState";
import { getSocket, connectSocket } from "../lib/socket";
import { ensureThread, fetchMessages } from "../api/chat";
import MessageInput from "../components/MessageInput";
import { useCall } from "../hooks/useCall";
import Avatar from "../components/Avatar";
// AVATAR constant removed

export default function Direct() {
  const { id } = useParams(); // /chat/:userId
  const navigate = useNavigate();
  const { online } = usePresence();
  const { running } = useSystemState();

  // shared call instance
  const {
    state: callState,
    remoteUser,
    incomingHasVideo,
    callAudio,
    callVideo,
    accept,
    decline,
  } = useCall();

  // decode meId from JWT
  const token = localStorage.getItem("token") || "";
  let meId = null;
  try {
    meId = JSON.parse(atob(token.split(".")[1] || "e30="))?.id || null;
  } catch { }

  // chat state
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    connectSocket();
  }, []);

  // select user from URL/presence
  useEffect(() => {
    if (!id) return;
    const found = online.find((u) => u.userId === id);
    if (found) setSelected(found);
    else if (!selected) setSelected({ userId: id, name: id, status: "online" });
  }, [id, online]); // eslint-disable-line

  // ensure/find thread + load last messages
  useEffect(() => {
    if (!selected) return;
    (async () => {
      const t = await ensureThread(selected.userId);
      setThread(t);
      const history = await fetchMessages(t._id);
      setMsgs(history);
      setTimeout(
        () => listRef.current?.scrollTo({ top: 1e9, behavior: "auto" }),
        0
      );
    })();
  }, [selected]);

  // live updates
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onRecv = (m) => {
      if (!thread || m.thread_id !== thread._id) return;
      setMsgs((prev) => [...prev, m]);
      setTimeout(
        () => listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }),
        0
      );
    };
    const onAck = ({ msg }) => {
      if (!thread || msg.thread_id !== thread._id) return;
      setMsgs((prev) => prev);
    };
    s.on("chat:recv", onRecv);
    s.on("chat:ack", onAck);
    return () => {
      s.off("chat:recv", onRecv);
      s.off("chat:ack", onAck);
    };
  }, [thread]);

  // send
  const onSend = async (text) => {
    const s = getSocket() || connectSocket();
    if (!thread || !selected) return;

    const tempId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const optimistic = {
      _id: tempId,
      thread_id: thread._id,
      from: meId,
      to: selected.userId,
      body: text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMsgs((prev) => [...prev, optimistic]);
    setTimeout(
      () => listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }),
      0
    );

    s.emit("chat:send", { to: selected.userId, body: text, tempId }, (ack) => {
      if (!ack?.ok) {
        setMsgs((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, failed: true } : m))
        );
        return;
      }
      setMsgs((prev) =>
        prev.map((m) => (m._id === tempId ? ack.msg : m))
      );
    });
  };

  const title = useMemo(
    () => selected?.name || selected?.userId || "—",
    [selected]
  );

  // START the call here using the shared engine, then navigate to call UI
  const goAudio = () => {
    if (!selected || !running) return;
    callAudio(selected);
    navigate(`/call/audio/${selected.userId}`);
  };

  const goVideo = () => {
    if (!selected || !running) return;
    callVideo(selected);
    navigate(`/call/video/${selected.userId}`);
  };

  // Incoming popup: accept first, then navigate to correct page
  const onAcceptIncoming = () => {
    if (!remoteUser) return;
    accept();
    navigate(
      `/call/${incomingHasVideo ? "video" : "audio"}/${remoteUser.userId}`
    );
  };

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50 flex justify-center">
      {/* Centered wrapper */}
      <div className="w-full max-w-5xl p-4">
        {/* Chat area card */}
        <section className="rounded-2xl border border-ink-700 bg-ink-800/60 flex flex-col h-[calc(100vh-2.5rem)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={selected?.image}
                name={selected?.name}
                className="h-9 w-9 rounded-full border border-ink-600 bg-ink-700"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium truncate max-w-[58vw] sm:max-w-[40vw]">
                    {title}
                  </h2>
                  {selected && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <Circle className="h-2 w-2 fill-green-400 text-green-400" />
                      online
                    </span>
                  )}
                </div>
                <p className="text-xs text-paper-400 truncate">
                  {selected?.tag}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goAudio}
                className="p-2 rounded-xl bg-ink-700 text-paper-50 border border-ink-600 hover:bg-ink-700/70 transition"
                title="Audio call"
                disabled={!selected || !running}
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                onClick={goVideo}
                className="p-2 rounded-xl bg-ink-700 text-paper-50 border border-ink-600 hover:bg-ink-700/70 transition"
                title="Video call"
                disabled={!selected || !running}
              >
                <Video className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages (scrollable with input fixed at bottom of card) */}
          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-ink-900/35"
          >
            {msgs.map((m) => {
              const mine = m.from === meId;
              return (
                <div
                  key={m._id}
                  className={`max-w-[72%] ${mine ? "ml-auto text-right" : ""
                    }`}
                >
                  <div
                    className={`inline-block rounded-2xl px-3 py-2 ${mine
                      ? "bg-brand text-paper-50"
                      : "bg-ink-700/70 text-paper-50 border border-ink-600"
                      }`}
                  >
                    {m.body}
                  </div>
                  <div className="text-[10px] text-paper-400 mt-0.5">
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.failed
                      ? " • failed"
                      : m.optimistic
                        ? " • sending…"
                        : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="border-t border-ink-700 p-3">
            <MessageInput onSend={onSend} disabled={!thread || !running} />
          </div>
        </section>
      </div>

      {/* INCOMING CALL POP-UP */}
      {callState === "incoming" && remoteUser && (
        <div className="fixed bottom-6 right-6 z-40 w-[320px] rounded-2xl border border-ink-700 bg-ink-800/90 backdrop-blur shadow-xl p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={remoteUser?.image}
              name={remoteUser?.name || remoteUser?.userId}
              className="h-12 w-12 rounded-full border border-ink-600 bg-ink-700"
            />
            <div className="min-w-0">
              <div className="font-medium truncate">
                {remoteUser?.name || remoteUser?.userId}
              </div>
              <div className="text-xs text-paper-400">
                Incoming {incomingHasVideo ? "video" : "audio"} call
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-xl bg-brand text-paper-50 py-2"
              onClick={onAcceptIncoming}
            >
              Accept
            </button>
            <button
              className="flex-1 rounded-xl bg-ink-700 text-paper-50 border border-ink-600 py-2"
              onClick={decline}
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
