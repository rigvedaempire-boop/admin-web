import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiPrinter, FiDownload, FiTrash2, FiFileText, FiPhone, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const XeroxOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    payment_status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.payment_status) params.payment_status = filters.payment_status;

      const response = await api.get('/admin/xerox/orders', { params });
      setOrders(response.data.orders || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching xerox orders:', error);
      toast.error('Failed to fetch xerox orders');
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
      status: '',
      search: '',
      payment_status: ''
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/xerox/orders/${orderId}/status`, {
        order_status: newStatus
      });
      toast.success('Status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Delete this xerox order?')) return;

    try {
      await api.delete(`/admin/xerox/orders/${orderId}`);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handlePrint = (order) => {
    // Open PDF in new tab for printing
    window.open(order.pdf_url, '_blank');
  };

  const handleUpdateOrder = async (orderId, updateData) => {
    try {
      await api.put(`/admin/xerox/orders/${orderId}`, updateData);
      toast.success('Order updated successfully');
      fetchOrders();
      setShowModal(false);
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
      printing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Printing' },
      ready: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Ready' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
      refunded: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

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
        <h1 className="text-2xl font-bold text-gray-900">Xerox Orders</h1>
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

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="label">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Order number, name, mobile..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Order Status */}
            <div>
              <label className="label">Order Status</label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="printing">Printing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="label">Payment Status</label>
              <select
                className="input"
                value={filters.payment_status}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              >
                <option value="">All Payment Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <FiFileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">
            {activeFiltersCount > 0 ? 'No xerox orders found matching filters' : 'No xerox orders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      #{order.order_number}
                    </h3>
                    {getStatusBadge(order.order_status)}
                    {getPaymentBadge(order.payment_status)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <FiUser size={14} />
                      <span className="font-medium">{order.customer_name}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <FiPhone size={14} />
                      {order.customer_mobile}
                    </p>
                    <p className="flex items-center gap-2">
                      <FiFileText size={14} />
                      {order.pdf_file_name} ({formatFileSize(order.pdf_file_size)})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.number_of_copies} copies × {order.total_pages || 1} pages
                  </p>
                </div>
              </div>

              {/* Print Details */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Color</p>
                    <p className="font-medium">{order.color_type === 'color' ? 'Color' : 'B&W'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paper</p>
                    <p className="font-medium">{order.paper_size}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Print Side</p>
                    <p className="font-medium">{order.print_side === 'double' ? 'Double' : 'Single'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {order.special_instructions && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-500 text-xs">Instructions:</p>
                    <p className="text-sm">{order.special_instructions}</p>
                  </div>
                )}
              </div>

              {/* Status Update & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Update Status:</label>
                  <select
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                    value={order.order_status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="printing">Printing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint(order)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    title="Open PDF for printing"
                  >
                    <FiPrinter size={16} />
                    Print
                  </button>
                  <a
                    href={order.pdf_url}
                    download={order.pdf_file_name}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Download PDF"
                  >
                    <FiDownload size={16} />
                  </a>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Edit Order"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(order._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete Order"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {orders.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {orders.length} xerox {orders.length === 1 ? 'order' : 'orders'}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">Edit Order #{selectedOrder.order_number}</h3>
            <EditOrderForm
              order={selectedOrder}
              onSave={(data) => handleUpdateOrder(selectedOrder._id, data)}
              onCancel={() => {
                setShowModal(false);
                setSelectedOrder(null);
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Edit Order Form Component
const EditOrderForm = ({ order, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    total_pages: order.total_pages || 1,
    price_per_page: order.price_per_page || 2,
    number_of_copies: order.number_of_copies || 1,
    color_type: order.color_type || 'black_white',
    paper_size: order.paper_size || 'A4',
    print_side: order.print_side || 'single',
    admin_notes: order.admin_notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Total Pages</label>
          <input
            type="number"
            className="input"
            value={formData.total_pages}
            onChange={(e) => setFormData({ ...formData, total_pages: parseInt(e.target.value) })}
            min="1"
          />
        </div>
        <div>
          <label className="label">Price/Page (₹)</label>
          <input
            type="number"
            className="input"
            value={formData.price_per_page}
            onChange={(e) => setFormData({ ...formData, price_per_page: parseFloat(e.target.value) })}
            min="0"
            step="0.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Copies</label>
          <input
            type="number"
            className="input"
            value={formData.number_of_copies}
            onChange={(e) => setFormData({ ...formData, number_of_copies: parseInt(e.target.value) })}
            min="1"
          />
        </div>
        <div>
          <label className="label">Color Type</label>
          <select
            className="input"
            value={formData.color_type}
            onChange={(e) => setFormData({ ...formData, color_type: e.target.value })}
          >
            <option value="black_white">Black & White</option>
            <option value="color">Color</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Paper Size</label>
          <select
            className="input"
            value={formData.paper_size}
            onChange={(e) => setFormData({ ...formData, paper_size: e.target.value })}
          >
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </div>
        <div>
          <label className="label">Print Side</label>
          <select
            className="input"
            value={formData.print_side}
            onChange={(e) => setFormData({ ...formData, print_side: e.target.value })}
          >
            <option value="single">Single Side</option>
            <option value="double">Double Side</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Admin Notes</label>
        <textarea
          className="input"
          rows={2}
          value={formData.admin_notes}
          onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
          placeholder="Internal notes..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn btn-primary flex-1">
          Save Changes
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default XeroxOrders;
