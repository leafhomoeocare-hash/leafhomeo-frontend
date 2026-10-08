import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
console.log('Socket URL:', SOCKET_URL);

let socket = null;

export const initSocket = () => {
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    console.error('No token found for socket connection');
    return null;
  }

  if (socket?.connected) {
    console.log('♻️ Reusing existing socket connection:', socket.id);
    return socket;
  }

  console.log('🔌 Initializing new socket connection to:', SOCKET_URL);
  socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default initSocket;