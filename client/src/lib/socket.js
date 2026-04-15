import { io } from 'socket.io-client';
import { getToken } from './authToken';
import { API_BASE_URL } from './apiBase';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  if (socket) return socket; // already created (connected or connecting)

  const token = getToken();
  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[socket] connect_error:', err.message);
  });

  return socket;
}
