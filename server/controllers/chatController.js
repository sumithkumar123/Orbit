import Thread from '../models/Thread.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';

function sortedPair(a, b) {
  const A = new mongoose.Types.ObjectId(a).toString();
  const B = new mongoose.Types.ObjectId(b).toString();
  return A < B ? [A, B] : [B, A];
}

// GET /api/chat/threads
export async function listMyThreads(req, res) {
  const me = req.user.id;
  const threads = await Thread.find({
    $or: [{ type: 'broadcast' }, { members: me }],
  })
    .sort({ last_msg_at: -1 })
    .lean();

  res.json({ threads });
}

// POST /api/chat/thread   { to }
export async function getOrCreateDirectThread(req, res) {
  const me = req.user.id;
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: 'to required' });
  const [a, b] = sortedPair(me, to);

  let t = await Thread.findOne({ type: 'direct', members: { $all: [a, b], $size: 2 } });
  if (!t) {
    t = await Thread.create({ type: 'direct', members: [a, b], last_msg_at: new Date() });
  }
  res.json({ thread: t });
}

// GET /api/chat/messages?threadId=...&before=ISO&limit=30
export async function listMessages(req, res) {
  const me = req.user.id;
  const { threadId, before, limit = 30 } = req.query;
  if (!threadId) return res.status(400).json({ message: 'threadId required' });

  const t = await Thread.findById(threadId).lean();
  if (!t) return res.status(404).json({ message: 'thread not found' });
  if (t.type === 'direct' && !t.members.map(String).includes(me)) {
    return res.status(403).json({ message: 'not a member' });
  }

  const q = { thread_id: threadId };
  if (before) q.created_at = { $lt: new Date(before) };

  const msgs = await Message.find(q)
    .sort({ created_at: -1 })
    .limit(Math.min(parseInt(limit, 10) || 30, 100))
    .lean();

  res.json({ messages: msgs.reverse() });
}
