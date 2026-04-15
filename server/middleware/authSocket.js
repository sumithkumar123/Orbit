// server/middleware/authSocket.js
import jwt from 'jsonwebtoken';

export function attachSocketAuth(io) {
  io.use((socket, next) => {
    try {
      // Prefer token from handshake.auth; fallback to Authorization header
      const hdr =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || '').split(' ')[1];

      if (!hdr) return next(new Error('UNAUTHORIZED: no token'));

      const payload = jwt.verify(hdr, process.env.JWT_SECRET);

      // 🔧 normalize id to STRING so rooms are consistent
      const uid = String(payload.id || payload._id);

      if (!uid) return next(new Error('UNAUTHORIZED: bad token payload'));

      socket.user = {
        id: uid,
        role: payload.role,
        name: payload.name || null,
      };

      next();
    } catch (err) {
      next(new Error('UNAUTHORIZED: invalid token'));
    }
  });
}
