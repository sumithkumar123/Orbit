// utils/initBroadcastThread.js (ESM)
import Thread from '../models/Thread.js';

export async function initBroadcastThread() {
  let t = await Thread.findOne({ type: 'broadcast' }).lean();
  if (!t) {
    t = await Thread.create({ type: 'broadcast', members: [], last_msg_at: null });
    console.log('[seed] Created broadcast thread:', t._id.toString());
  } else {
    console.log('[seed] Broadcast thread exists:', t._id.toString());
  }
  return t._id;
}
