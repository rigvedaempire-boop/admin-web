import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiShoppingCart, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { ordersAPI, productsAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Listen for new orders via socket
    const socket = socketService.connect();

    const handleNewOrder = (data) => {
      toast.success(`New order received: ${data.order_number}`, {
        duration: 5010,
        icon: '🛒'
      });
      fetchDashboardData(); // Refresh data
    };

    socketService.on('order_created', handleNewOrder);

    return () => {
      socketService.off('order_created', handleNewOrder);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        ordersAPI.getAll({ limit: 5 }),
        productsAPI.getAll({ limit: 100 })
      ]);

      const orders = ordersRes.data.data || [];
      const products = productsRes.data.data || [];

      // Calculate stats
      const totalRevenue = orders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

      const today = new Date().toDateString();
      const todayOrders = orders.filter(
        o => new Date(o.created_at).toDateString() === today
      ).length;

      const lowStock = products.filter(p => p.stock_qty < 10).length;

      setStats({
        totalOrders: ordersRes.data.pagination.total || 0,
        todayOrders,
        totalRevenue,
        lowStockProducts: lowStock
      });

      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: FiShoppingCart,
      color: 'blue',
      trend: `+${stats.todayOrders} today`
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: FiTrendingUp,
      color: 'green'
    },
    {
      title: 'Products',
      value: '—',
      icon: FiPackage,
      color: 'purple',
      link: '/products'
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockProducts,
      icon: FiAlertCircle,
      color: 'red',
      trend: stats.lowStockProducts > 0 ? 'Needs attention' : 'All good'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            red: 'bg-red-100 text-red-600'
          };

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${colors[stat.color]}`}>
                  <Icon size={24} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Order Number
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{order.customer_name}</td>
                    <td className="py-3 px-4 text-gray-900">
                      ₹{parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.order_status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.order_status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
