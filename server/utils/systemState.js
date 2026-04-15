// server/utils/systemState.js
import SystemState from '../models/SystemState.js';

let cached = { running: true, reason: '', updated_at: null };
let initialized = false;

export async function loadSystemState() {
  let doc = await SystemState.findOne().lean();
  if (!doc) {
    doc = await SystemState.create({ running: true, reason: '' });
    doc = doc.toObject();
  }
  cached = {
    running: !!doc.running,
    reason: doc.reason || '',
    updated_at: doc.updated_at || doc.updatedAt || new Date(),
  };
  initialized = true;
  return cached;
}

export function getSystemState() {
  if (!initialized) {
    // If you call before load, default to running
    return { running: true, reason: '', updated_at: null };
  }
  return cached;
}

export async function setSystemState({ running, reason }, io) {
  const doc = await SystemState.findOneAndUpdate(
    {},
    { $set: { running, reason: reason || '' } },
    { upsert: true, new: true }
  ).lean();

  cached = {
    running: !!doc.running,
    reason: doc.reason || '',
    updated_at: doc.updated_at || doc.updatedAt || new Date(),
  };

  // Notify all clients
  if (io) io.emit('system:state', cached);
  return cached;
}
