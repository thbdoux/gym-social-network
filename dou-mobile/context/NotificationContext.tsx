// context/NotificationContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  isSocketConnected: boolean;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  isSocketConnected: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { isConnected, markAsRead, markAllAsRead } = useNotificationSocket();
  
  return (
    <NotificationContext.Provider
      value={{
        isSocketConnected: isConnected,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};