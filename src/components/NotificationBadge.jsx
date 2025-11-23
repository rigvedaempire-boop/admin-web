import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import socketService from '../services/socket';

const NotificationBadge = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Fetch initial count
    fetchUnreadCount();

    // Connect socket and listen for new orders
    const socket = socketService.connect();

    const handleNewOrder = () => {
      setCount(prev => prev + 1);
    };

    socketService.on('order_created', handleNewOrder);

    return () => {
      socketService.off('order_created', handleNewOrder);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  if (count === 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse-soft">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;
