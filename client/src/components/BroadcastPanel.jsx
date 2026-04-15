// src/components/BroadcastPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { connectSocket, getSocket } from "../lib/socket";
import { fetchMessages, getBroadcastThreadId } from "../api/chat";
import MessageInput from "./MessageInput";
import useSystemState from "../hooks/useSystemState";

export default function BroadcastPanel({ meId }) {
  const [threadId, setThreadId] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const listRef = useRef(null);
  const { running } = useSystemState();

  // ensure socket
  useEffect(() => {
    connectSocket();
  }, []);

  // load thread id + history
  useEffect(() => {
    (async () => {
      const id = await getBroadcastThreadId();
      setThreadId(id);
      if (id) {
        const history = await fetchMessages(id);
        setMsgs(history);
        setTimeout(() => listRef.current?.scrollTo({ top: 1e9 }), 0);
      }
    })();
  }, []);

  // live receive
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onRecv = (m) => {
      if (!threadId || m.thread_id !== threadId) return;
      setMsgs((prev) => [...prev, m]);
      setTimeout(
        () =>
          listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }),
        0
      );
    };
    s.on("chat:broadcast:recv", onRecv);
    return () => s.off("chat:broadcast:recv", onRecv);
  }, [threadId]);

  const onSend = (text) => {
    const s = getSocket();
    if (!s || !threadId) return;

    if (!running) {
      console.warn("System paused by admin — broadcast disabled.");
      return;
    }

    const tempId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const optimistic = {
      _id: tempId,
      thread_id: threadId,
      from: meId,
      body: text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMsgs((prev) => [...prev, optimistic]);
    setTimeout(
      () =>
        listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }),
      0
    );

    s.emit("chat:broadcast", { body: text, tempId }, (ack) => {
      if (!ack?.ok) {
        setMsgs((prev) =>
          prev.map((m) =>
            m._id === tempId ? { ...m, failed: true } : m
          )
        );
        return;
      }
      setMsgs((prev) =>
        prev.map((m) => (m._id === tempId ? ack.msg : m))
      );
    });
  };

  return (
    // 🔑 fixed-height flex column so input stays at bottom,
    // messages area scrolls
    <div className="flex flex-col h-[min(70vh,600px)] max-h-[70vh]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-paper-100">
            Broadcast channel
          </div>
          <p className="text-xs text-paper-400">
            Everyone connected will receive these messages.
          </p>
        </div>
        {!running && (
          <span className="rounded-full bg-amber-500/15 text-amber-300 text-[11px] px-3 py-1 border border-amber-500/40">
            System paused
          </span>
        )}
      </div>

      {/* Messages list — scrollable */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto rounded-xl border border-ink-700 bg-ink-900/40 p-3 space-y-2"
      >
        {msgs.map((m) => {
          const mine = m.from === meId;
          return (
            <div
              key={m._id}
              className={`max-w-[70%] ${
                mine ? "ml-auto text-right" : ""
              }`}
            >
              <div
                className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                  mine
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

        {msgs.length === 0 && (
          <div className="text-xs text-paper-400 text-center py-10">
            No broadcast messages yet. Be the first to announce something ✨
          </div>
        )}
      </div>

      {/* Input — anchored at bottom of panel */}
      <div className="mt-3">
        <MessageInput onSend={onSend} disabled={!threadId || !running} />
      </div>
    </div>
  );
}
