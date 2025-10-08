Enhanced React Components with Real-time Features
client/src/hooks/useSocket.js:

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      
      socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      // Listen for notifications
      socketRef.current.on('notification', (notification) => {
        toast.success(notification.message, {
          duration: 5000,
          position: 'top-right'
        });
      });

      // Listen for assessment submissions (for teachers)
      socketRef.current.on('new_submission', (data) => {
        if (user.role === 'teacher') {
          toast.info(`New submission: ${data.message}`, {
            duration: 6000,
            position: 'top-right'
          });
        }
      });

      // Listen for graded assessments (for students)
      socketRef.current.on('assessment_graded', (data) => {
        if (user.role === 'student') {
          toast.success(`Assessment graded: ${data.message}`, {
            duration: 8000,
            position: 'top-right'
          });
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  const emitEvent = (eventName, data) => {
    if (socketRef.current) {
      socketRef.current.emit(eventName, data);
    }
  };

  return { socket: socketRef.current, emitEvent };
};

