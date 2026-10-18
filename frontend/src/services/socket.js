import { io } from 'socket.io-client';
import { getAuth } from './auth';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      autoConnect: false,
      auth: (callback) => callback({ token: getAuth()?.token }),
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Noor Gateway:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from Noor Gateway:', reason);
    });
  }
  return socket;
};
