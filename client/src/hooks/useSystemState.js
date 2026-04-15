import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '../lib/socket';
import { fetchSystemState } from '../api/admin';

export default function useSystemState() {
  const [state, setState] = useState({ running: true, reason: '' });

  useEffect(() => {
    // Fetch once on mount (in case socket is late)
    fetchSystemState().then(setState).catch(() => {});
    const s = getSocket() || connectSocket();
    const onState = (st) => setState(st);
    s.on('system:state', onState);
    return () => s.off('system:state', onState);
  }, []);

  return state;
}
