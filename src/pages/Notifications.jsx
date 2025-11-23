import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiBell, FiCheck, FiCheckCircle, FiPackage, FiShoppingCart } from 'react-icons/fi';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    is_read: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.is_read !== '') params.is_read = filters.is_read;

      const response = await notificationsAPI.getAll(params);
      setNotifications(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      is_read: ''
    });
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      toast.success('Marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => notificationsAPI.markAsRead(n._id))
      );
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <FiShoppingCart className="text-blue-600" size={20} />;
      case 'product':
        return <FiPackage className="text-green-600" size={20} />;
      case 'review':
        return <FiBell className="text-purple-600" size={20} />;
      default:
        return <FiBell className="text-gray-600" size={20} />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      order: 'Order',
      product: 'Product',
      review: 'Review',
      system: 'System'
    };
    return labels[type] || 'Notification';
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FiCheckCircle size={16} />
              Mark All Read
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiFilter size={18} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="order">Orders</option>
                <option value="product">Products</option>
                <option value="review">Reviews</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Read Status Filter */}
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={filters.is_read}
                onChange={(e) => handleFilterChange('is_read', e.target.value)}
              >
                <option value="">All Notifications</option>
                <option value="false">Unread Only</option>
                <option value="true">Read Only</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <FiBell className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">
            {activeFiltersCount > 0 ? 'No notifications found matching filters' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`card hover:shadow-md transition-all cursor-pointer ${
                !notification.is_read ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => !notification.is_read && handleMarkAsRead(notification._id)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {getTypeLabel(notification.type)}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <h4 className={`text-sm mb-1 ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {notification.title}
                  </h4>

                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>

                  {/* Action Button */}
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                      className="mt-3 flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <FiCheck size={14} />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {notifications.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
        </div>
      )}
    </div>
  );
};

export default Notifications;
