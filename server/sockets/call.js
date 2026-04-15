// server/sockets/call.js (ESM)
import Joi from 'joi';
import { getSystemState } from '../utils/systemState.js';

const ringSchema = Joi.object({
  to: Joi.string().required(),
  offer: Joi.object().required(),      // SDP offer
  fromName: Joi.string().optional(),   // NEW: forward caller display name if provided
});

const answerSchema = Joi.object({
  to: Joi.string().required(),
  answer: Joi.object().required(),     // SDP answer
});

const iceSchema = Joi.object({
  to: Joi.string().required(),
  candidate: Joi.object().required(),
});

const endSchema = Joi.object({
  to: Joi.string().required(),
  reason: Joi.string().optional().default('hangup'),
});

// Helper: check if system is running
function assertRunning(cb) {
  const s = getSystemState();
  if (!s.running) {
    cb && cb({ ok: false, error: 'SYSTEM_PAUSED', reason: s.reason || '' });
    return false;
  }
  return true;
}

export function registerCall(io) {
  io.on('connection', (socket) => {
    const me = socket.user.id;

    // Caller -> Callee (ring)
    socket.on('call:ring', async (payload, cb) => {
      try {
        if (!assertRunning(cb)) return;

        const { value, error } = ringSchema.validate(payload);
        if (error) throw new Error(error.details[0].message);
        const { to, offer, fromName } = value;

        console.log('[call] ring from', me, 'to', to, fromName ? `(name: ${fromName})` : '');

        // forward to callee's personal room
        io.to(`u:${to}`).emit('call:ring', { from: me, offer, fromName });
        cb && cb({ ok: true });
      } catch (e) {
        cb && cb({ ok: false, error: e.message });
      }
    });

    // Callee -> Caller (answer)
    socket.on('call:answer', async (payload, cb) => {
      try {
        if (!assertRunning(cb)) return;

        const { value, error } = answerSchema.validate(payload);
        if (error) throw new Error(error.details[0].message);
        const { to, answer } = value;

        io.to(`u:${to}`).emit('call:answer', { from: me, answer });
        cb && cb({ ok: true });
      } catch (e) {
        cb && cb({ ok: false, error: e.message });
      }
    });

    // Either side -> the other (ICE)
    socket.on('call:ice', async (payload) => {
      try {
        // If paused, drop new ICE candidates silently
        if (!getSystemState().running) return;

        const { value, error } = iceSchema.validate(payload);
        if (error) return;
        const { to, candidate } = value;

        io.to(`u:${to}`).emit('call:ice', { from: me, candidate });
      } catch {
        // ignore
      }
    });

    // End call (hangup/decline) — allowed even when paused
    socket.on('call:end', async (payload) => {
      try {
        const { value, error } = endSchema.validate(payload);
        if (error) return;
        const { to, reason } = value;

        io.to(`u:${to}`).emit('call:end', { from: me, reason });
      } catch {
        // ignore
      }
    });
  });
}
