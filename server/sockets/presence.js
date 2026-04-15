// ESM
// Keeps track of who is online and broadcasts join/leave/status updates.
// presence.js

import User from "../models/userModel.js";

const usersOnline = new Map();
// Map<userId, { sockets:Set<string>, status:'online'|'away'|'busy', lastSeen:number, name?:string, image?:string, tag?:string }>

const serializeEntry = (userId, entry, online = true) => ({
  userId,
  name: entry.name || "User",
  image: entry.image || null,
  tag: entry.tag || "",
  status: online ? entry.status || "online" : "offline",
  lastSeen: entry.lastSeen,
  online,
});

function getOnlineList() {
  // return minimal public info
  return [...usersOnline.entries()].map(([userId, entry]) =>
    serializeEntry(userId, entry, true)
  );
}

async function hydrateUserMeta(userId, fallbackName) {
  try {
    const user = await User.findById(userId).select("name image tag");
    if (!user) {
      return {
        name: fallbackName || "User",
        image: null,
        tag: "",
      };
    }
    return {
      name: user.name || fallbackName || "User",
      image: user.image || null,
      tag: user.tag || "",
    };
  } catch (err) {
    console.error("presence:hydrateUserMeta", err);
    return {
      name: fallbackName || "User",
      image: null,
      tag: "",
    };
  }
}

export function registerPresence(io) {
  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    const fallbackName = socket.user.name;

    if (!usersOnline.has(userId)) {
      usersOnline.set(userId, {
        sockets: new Set(),
        status: "online",
        lastSeen: Date.now(),
        name: fallbackName || "User",
        image: null,
        tag: "",
      });
    }

    const entry = usersOnline.get(userId);
    entry.sockets.add(socket.id);
    entry.lastSeen = Date.now();

    const meta = await hydrateUserMeta(userId, fallbackName);
    entry.name = meta.name;
    entry.image = meta.image;
    entry.tag = meta.tag;

    // Join rooms (already handled in sockets/index, but safe here too)
    socket.join(`u:${userId}`);
    socket.join("broadcast");

    // Send full list to the newly connected socket
    socket.emit("presence:list", getOnlineList());

    // Notify others that this user came online
    socket.broadcast.emit("presence:update", serializeEntry(userId, entry, true));

    // Optional: allow client to set status
    socket.on("presence:set", ({ status } = {}) => {
      if (!["online", "away", "busy"].includes(status)) return;
      const e = usersOnline.get(userId);
      if (!e) return;
      e.status = status;
      e.lastSeen = Date.now();
      io.emit("presence:update", serializeEntry(userId, e, true));
    });

    socket.on("disconnect", () => {
      const e = usersOnline.get(userId);
      if (!e) return;
      e.sockets.delete(socket.id);
      e.lastSeen = Date.now();
      if (e.sockets.size === 0) {
        usersOnline.delete(userId);
        io.emit(
          "presence:update",
          serializeEntry(userId, e, false)
        );
      }
    });
  });
}
