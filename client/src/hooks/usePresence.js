import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '../lib/socket';

const normalizeUser = (user = {}) => ({
  userId: user.userId,
  name: user.name || 'User',
  status: user.status || 'online',
  lastSeen: user.lastSeen || null,
  image: user.image || null,
  tag: user.tag || '',
});

export default function usePresence() {
  const [online, setOnline] = useState([]); // [{userId, name, status, lastSeen}]

  useEffect(() => {
    // Ensure a socket exists (creates it if absent)
    const s = getSocket() || connectSocket();

    // When server says we're ready, you can optionally set status
    const onReady = () => {
      s.emit('presence:set', { status: 'online' });
    };

    const onList = (users) => {
      // full list of online users (including self)
      setOnline((users || []).map(normalizeUser));
    };

    const onUpdate = (u) => {
      setOnline((prev) => {
        const map = new Map(prev.map(x => [x.userId, x]));
        if (u.online) {
          map.set(u.userId, normalizeUser(u));
        } else {
          map.delete(u.userId);
        }
        return [...map.values()];
      });
    };

    s.on('socket:ready', onReady);
    s.on('presence:list', onList);
    s.on('presence:update', onUpdate);

    // If we are already connected (after a fast refresh), call onReady immediately
    if (s.connected) onReady();

    return () => {
      s.off('socket:ready', onReady);
      s.off('presence:list', onList);
      s.off('presence:update', onUpdate);
    };
  }, []);

  // allow UI to change status
  const setStatus = (status) => (getSocket() || connectSocket())?.emit('presence:set', { status });

  return { online, setStatus };
}
