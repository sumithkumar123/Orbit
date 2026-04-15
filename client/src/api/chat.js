import http from './http';

export async function ensureThread(toUserId) {
  const { data } = await http.post('/chat/thread', { to: toUserId });
  return data.thread;
}

export async function fetchMessages(threadId, before, limit = 30) {
  const params = { threadId, limit };
  if (before) params.before = before;
  const { data } = await http.get('/chat/messages', { params });
  return data.messages;
}

export async function listThreads() {
  const { data } = await http.get('/chat/threads');
  return data.threads;
}

export async function getBroadcastThreadId() {
  const threads = await listThreads();
  const t = threads.find(x => x.type === 'broadcast');
  return t?._id || null;
}
