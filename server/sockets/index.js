// server/sockets/index.js
import { registerPresence } from './presence.js';
import { registerChat } from './chat.js';
import { registerCall } from './call.js';

export function registerSockets(io, opts = {}) {
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log('[sockets] join rooms for', userId);
    socket.join(`u:${userId}`);
    socket.join('broadcast');
    socket.emit('socket:ready', { userId });
  });

  registerPresence(io);
  registerChat(io, opts);
  registerCall(io);
}
