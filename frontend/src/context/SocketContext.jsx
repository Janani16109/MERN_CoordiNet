import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Connect to socket server
    const socketUrl = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8003';
    console.debug('SocketContext connecting to', socketUrl);
    const socketInstance = io(socketUrl, {
      // prefer native websocket transport for lower latency
      transports: ['websocket'],
      withCredentials: true,
      path: '/socket.io',
      timeout: 10000,
      // reconnection settings tuned for faster recovery
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 200,
      reconnectionDelayMax: 2000,
      rememberUpgrade: true,
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.debug('SocketContext connected', socketInstance.id, socketInstance.io?.uri);
      setConnected(true);
      
      // Join user role room
      if (user && user.role) {
        socketInstance.emit('joinUserRole', user.role);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error, error?.message);
      setConnected(false);
    });

    setSocket(socketInstance);

    // Clean up on unmount (safe disconnect)
    return () => {
      try {
        if (socketInstance) {
          // remove all listeners before disconnecting to avoid noisy stack traces
          socketInstance.removeAllListeners();
          socketInstance.disconnect();
        }
      } catch (cleanupErr) {
        console.debug('Socket cleanup error (ignored):', cleanupErr?.message || cleanupErr);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Function to join an event room
  const joinEventRoom = (eventId) => {
    if (socket && connected && eventId) {
      socket.emit('joinEvent', eventId);
    }
  };

  // Function to leave an event room
  const leaveEventRoom = (eventId) => {
    if (socket && connected && eventId) {
      socket.emit('leaveEvent', eventId);
    }
  };

  const value = {
    socket,
    connected,
    joinEventRoom,
    leaveEventRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;