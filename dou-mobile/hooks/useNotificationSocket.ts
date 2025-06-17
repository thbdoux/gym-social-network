// hooks/useNotificationSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../api/config';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from './query/useNotificationQuery';
import { useAuth } from './useAuth';
import { useLanguage } from '../context/LanguageContext';
import { type Notification } from '../api/services/notificationService';

interface SocketMessage {
  type: string;
  notification?: Notification;
  message?: string;
  error?: string;
}

export const useNotificationSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const connectSocket = useCallback(async () => {
    // Only try to connect if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('🔒 Not connecting WebSocket: User not authenticated');
      return;
    }
    
    try {
      // Get authentication token
      const token = await SecureStore.getItemAsync('token');
      
      if (!token) {
        console.error('❌ No authentication token available for WebSocket');
        setError('No authentication token available');
        return;
      }
      
      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      // Clear any existing heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      
      // Extract base URL without the /api path
      const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '').replace('/api', '');
      
      // Create WebSocket connection with token
      const wsUrl = `ws://${baseUrl}/ws/notifications/?token=${token}`;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl.replace(token, '[TOKEN]'));
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setConnectionAttempts(0);
        setError(null);
        
        // Start heartbeat to keep connection alive
        heartbeatRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, HEARTBEAT_INTERVAL);
      };
      
      socket.onmessage = (event) => {
        try {
          const data: SocketMessage = JSON.parse(event.data);
          console.log('📨 Received WebSocket message:', data.type);
          
          // Handle different message types
          switch (data.type) {
            case 'connection_established':
              console.log('🤝 WebSocket connection established');
              break;
              
            case 'notification_message':
              if (data.notification) {
                console.log('🔔 New notification received:', data.notification.notification_type);
                handleNewNotification(data.notification);
              }
              break;
              
            case 'pong':
              // Heartbeat response - connection is alive
              break;
              
            case 'error':
              console.error('❌ WebSocket error message:', data.error);
              setError(data.error || 'Unknown WebSocket error');
              break;
              
            default:
              console.log('📬 Unhandled message type:', data.type);
              break;
          }
          
          // Update last received message
          setLastMessage(data);
          
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
          setError('Failed to process message');
        }
      };
      
      socket.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setIsConnected(false);
        setError('WebSocket connection error');
      };
      
      socket.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: code=${event.code}, reason="${event.reason}"`);
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        
        // Handle different close codes
        switch (event.code) {
          case 1000: // Normal closure
            console.log('✅ WebSocket closed normally');
            setError(null);
            break;
            
          case 1006: // Abnormal closure
          case 1011: // Server error
          case 1012: // Service restart
            console.log('🔄 WebSocket closed abnormally, will attempt reconnect');
            setError('Connection lost, reconnecting...');
            break;
            
          case 4003: // Custom code for unauthenticated
            console.log('🔒 WebSocket closed: Authentication failed');
            setError('Authentication failed');
            return; // Don't reconnect
            
          default:
            console.log(`⚠️ WebSocket closed with code ${event.code}`);
            setError(`Connection closed (${event.code})`);
            break;
        }
        
        // Try to reconnect if not a normal closure and under max attempts
        if (event.code !== 1000 && event.code !== 4003 && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(`🔄 Attempting to reconnect (${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
          setConnectionAttempts(prev => prev + 1);
          setTimeout(connectSocket, RECONNECT_DELAY);
        } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.log('❌ Max reconnection attempts reached');
          setError('Unable to reconnect to notifications');
        }
      };
      
      socketRef.current = socket;
      
    } catch (error) {
      console.error('❌ Error connecting to notification socket:', error);
      setError('Failed to connect to notifications');
    }
  }, [isAuthenticated, user?.id, connectionAttempts]);
  
  // Handle new notification received via WebSocket
  const handleNewNotification = useCallback((notification: Notification) => {
    // Invalidate queries to refresh notification data
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
    
    // Optionally update cache directly for immediate UI updates
    queryClient.setQueryData(notificationKeys.lists(), (oldData: Notification[] = []) => {
      // Add new notification to the beginning of the list
      return [notification, ...oldData];
    });
    
    queryClient.setQueryData(notificationKeys.count(), (oldData: any) => {
      if (oldData) {
        return {
          ...oldData,
          unread: oldData.unread + 1,
          total: oldData.total + 1,
        };
      }
      return { unread: 1, unseen: 1, total: 1 };
    });
    
    // Show system notification if the app is in background
    // This would be handled by the push notification service
    
  }, [queryClient]);
  
  const disconnectSocket = useCallback(() => {
    console.log('🔌 Manually disconnecting WebSocket');
    
    // Clear heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User logout or manual disconnect');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
    setConnectionAttempts(0);
  }, []);
  
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && isConnected) {
      try {
        socketRef.current.send(JSON.stringify(message));
        console.log('📤 Sent WebSocket message:', message.type);
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
        setError('Failed to send message');
      }
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
    }
  }, [isConnected]);
  
  // Mark a notification as read
  const markAsRead = useCallback((notificationId: number) => {
    sendMessage({
      type: 'mark_read',
      notification_id: notificationId
    });
    
    // Optimistically update the cache
    queryClient.setQueryData(notificationKeys.lists(), (oldData: Notification[] = []) => {
      return oldData.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true, is_seen: true }
          : notification
      );
    });
    
    queryClient.setQueryData(notificationKeys.count(), (oldData: any) => {
      if (oldData && oldData.unread > 0) {
        return {
          ...oldData,
          unread: oldData.unread - 1,
        };
      }
      return oldData;
    });
    
  }, [sendMessage, queryClient]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    sendMessage({
      type: 'mark_all_read'
    });
    
    // Optimistically update the cache
    queryClient.setQueryData(notificationKeys.lists(), (oldData: Notification[] = []) => {
      return oldData.map(notification => ({ 
        ...notification, 
        is_read: true, 
        is_seen: true 
      }));
    });
    
    queryClient.setQueryData(notificationKeys.count(), (oldData: any) => {
      if (oldData) {
        return {
          ...oldData,
          unread: 0,
        };
      }
      return oldData;
    });
    
  }, [sendMessage, queryClient]);
  
  // Force reconnection
  const reconnect = useCallback(() => {
    console.log('🔄 Forcing WebSocket reconnection');
    setConnectionAttempts(0);
    setError(null);
    disconnectSocket();
    setTimeout(connectSocket, 1000);
  }, [connectSocket, disconnectSocket]);
  
  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('👤 User authenticated, connecting to notifications WebSocket');
      connectSocket();
    } else {
      console.log('🚪 User not authenticated, disconnecting WebSocket');
      disconnectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, connectSocket, disconnectSocket]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      disconnectSocket();
    };
  }, [disconnectSocket]);
  
  return {
    isConnected,
    lastMessage,
    error,
    connectionAttempts,
    markAsRead,
    markAllAsRead,
    reconnect,
    disconnect: disconnectSocket,
  };
};