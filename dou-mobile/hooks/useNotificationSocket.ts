// hooks/useNotificationSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../api/config';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from './query/useNotificationQuery';
import { useAuth } from './useAuth';

export const useNotificationSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const socketRef = useRef(null);
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds

  const connectSocket = useCallback(async () => {
    // Only try to connect if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('Not connecting WebSocket: User not authenticated');
      return;
    }
    
    try {
      // Get authentication token
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.error('No authentication token available');
        return;
      }
      
      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Extract base URL without the /api path
      const baseUrl = API_BASE_URL.split('//')[1];
      
      // Create WebSocket connection with token
      const wsUrl = `ws://${baseUrl}/ws/notifications/?token=${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionAttempts(0); // Reset connection attempts on success
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received notification:', data);
          
          // Update last received message
          setLastMessage(data);
          
          // Invalidate notification queries to refresh data
          queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
          queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
          queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
        setIsConnected(false);
        
        // Try to reconnect if not a normal closure and under max attempts
        if (event.code !== 1000 && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Attempting to reconnect (${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
          setConnectionAttempts(prev => prev + 1);
          setTimeout(connectSocket, RECONNECT_DELAY);
        }
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Error connecting to notification socket:', error);
    }
  }, [isAuthenticated, user?.id]);
  
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('Manually disconnecting WebSocket');
      socketRef.current.close(1000, 'User logout or page change');
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  const sendMessage = useCallback((message) => {
    if (socketRef.current && isConnected) {
      console.log('Sending WebSocket message:', message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [isConnected]);
  
  // Mark a notification as read
  const markAsRead = useCallback((notificationId) => {
    sendMessage({
      type: 'mark_read',
      notification_id: notificationId
    });
  }, [sendMessage]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    sendMessage({
      type: 'mark_all_read'
    });
  }, [sendMessage]);
  
  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User authenticated, connecting WebSocket');
      connectSocket();
    } else {
      console.log('User not authenticated, disconnecting WebSocket');
      disconnectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, connectSocket, disconnectSocket]);
  
  return {
    isConnected,
    lastMessage,
    markAsRead,
    markAllAsRead
  };
};