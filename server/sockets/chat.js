// server/sockets/chat.js
import Joi from 'joi';
import Thread from '../models/Thread.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import { getSystemState } from '../utils/systemState.js';

function assertRunning(cb) {
  const s = getSystemState();
  if (!s.running) {
    cb && cb({ ok: false, error: 'SYSTEM_PAUSED', reason: s.reason });
    return false;
  }
  return true;
}


const directSchema = Joi.object({
  to: Joi.string().required(),                 // userId (for direct)
  body: Joi.string().trim().min(1).max(2000).required(),
  tempId: Joi.string().optional(),             // client-generated optimistic id
});

const broadcastSchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required(),
  tempId: Joi.string().optional(),
});

function pair(a, b) {
  const A = new mongoose.Types.ObjectId(a).toString();
  const B = new mongoose.Types.ObjectId(b).toString();
  return A < B ? [A, B] : [B, A];
}

export function registerChat(io, opts = {}) {
  const { broadcastThreadId } = opts;

  io.on('connection', (socket) => {
    const me = socket.user.id;

    // -------- 1) DIRECT MESSAGES --------
    socket.on('chat:send', async (payload, cb) => {
      if (!assertRunning(cb)) return;
      try {
        const { value, error } = directSchema.validate(payload);
        if (error) throw new Error(error.details[0].message);
        const { to, body, tempId } = value;

        // upsert/find direct thread
        const [a, b] = pair(me, to);
        let thread = await Thread.findOne({
          type: 'direct',
          members: { $all: [a, b], $size: 2 },
        });

        if (!thread) {
          thread = await Thread.create({
            type: 'direct',
            members: [a, b],
            last_msg_at: new Date(),
          });
        }

        const msg = await Message.create({
          thread_id: thread._id,
          from: me,
          to,
          body,
          created_at: new Date(),
        });

        await Thread.updateOne(
          { _id: thread._id },
          { $set: { last_msg_at: msg.created_at } }
        );

        const wire = {
          _id: msg._id.toString(),
          thread_id: thread._id.toString(),
          from: me,
          to,
          body,
          created_at: msg.created_at,
        };

        // ACK to sender
        cb && cb({ ok: true, tempId, msg: wire });
        socket.emit('chat:ack', { tempId, msg: wire });

        // Deliver to recipient
        io.to(`u:${to}`).emit('chat:recv', wire);
      } catch (e) {
        cb && cb({ ok: false, error: e.message });
      }
    });

    // -------- 2) BROADCAST MESSAGES --------
    socket.on('chat:broadcast', async (payload, cb) => {
      if (!assertRunning(cb)) return;
      try {
        if (!broadcastThreadId) throw new Error('Broadcast channel not ready');
        const { value, error } = broadcastSchema.validate(payload);
        if (error) throw new Error(error.details[0].message);
        const { body, tempId } = value;

        const msg = await Message.create({
          thread_id: broadcastThreadId,
          from: me,
          to: null,
          body,
          created_at: new Date(),
        });

        await Thread.updateOne(
          { _id: broadcastThreadId },
          { $set: { last_msg_at: msg.created_at } }
        );

        const wire = {
          _id: msg._id.toString(),
          thread_id: broadcastThreadId.toString(),
          from: me,
          body,
          created_at: msg.created_at,
        };

        // ACK to sender (replace optimistic)
        cb && cb({ ok: true, tempId, msg: wire });

        // Deliver to everyone in the broadcast room
        io.to('broadcast').emit('chat:broadcast:recv', wire);
      } catch (e) {
        cb && cb({ ok: false, error: e.message });
      }
    });
  });
}
