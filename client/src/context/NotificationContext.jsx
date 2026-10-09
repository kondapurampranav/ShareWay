// client/src/context/NotificationContext.jsx
// OWNER: Member 4

import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = async () => {
    // TODO: Member 4 — fetch unread count from /api/notifications
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
