// src/components/MessageInput.jsx
import React, { useState } from "react";
import { Send, Smile, Paperclip } from "lucide-react";

export default function MessageInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-end gap-2 rounded-2xl border border-ink-700 bg-ink-900/70 px-3 py-2 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {/* (optional) left icon – placeholder for future emoji/attachments */}
      <button
        type="button"
        className="hidden sm:inline-flex items-center justify-center p-2 rounded-xl text-paper-400 hover:text-paper-100 hover:bg-ink-800/80 transition"
        disabled={disabled}
      >
        <Smile className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <textarea
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Messaging disabled" : "Type a message…"}
          className="w-full resize-none bg-transparent text-sm text-paper-50 placeholder:text-paper-400 outline-none border-none focus:ring-0 max-h-32"
        />
      </div>

      <button
        type="button"
        className="hidden sm:inline-flex items-center justify-center p-2 rounded-xl text-paper-400 hover:text-paper-100 hover:bg-ink-800/80 transition"
        disabled={disabled}
      >
        <Paperclip className="h-4 w-4" />
      </button>

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="inline-flex items-center justify-center rounded-xl bg-brand px-3 py-2 text-paper-50 text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Send className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Send</span>
      </button>
    </form>
  );
}
