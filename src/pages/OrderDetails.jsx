import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiUser, FiMapPin, FiCreditCard, FiPhone, FiMail, FiCheck } from 'react-icons/fi';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getById(id);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      await ordersAPI.updateStatus(id, newStatus);
      toast.success('Order status updated successfully');
      // Refresh order details
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      await ordersAPI.updatePaymentStatus(id, newStatus);
      toast.success('Payment status updated successfully');
      // Refresh order details
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
      packed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Packed' },
      dispatched: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Dispatched' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
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
      <span className={`px-3 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Get available next statuses based on current status
  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['packed', 'cancelled'],
      packed: ['dispatched', 'cancelled'],
      dispatched: ['delivered'],
      delivered: [],
      cancelled: []
    };

    return statusFlow[currentStatus] || [];
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      packed: 'Out for Delivery',
      dispatched: 'Dispatched',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const availableStatuses = getAvailableStatuses(order.order_status);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-500 mt-1">Order #{order.order_number}</p>
        </div>
      </div>

      {/* Payment Status Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Payment Status</h2>
            <div className="flex items-center gap-3">
              {getPaymentBadge(order.payment_status)}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Payment Status Update Actions */}
        {order.payment_status === 'pending' && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Confirm Payment</h3>
            <p className="text-sm text-gray-600 mb-3">
              ⚠️ Payment must be confirmed before you can update order status
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePaymentStatusUpdate('paid')}
                disabled={updating}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FiCheck size={16} />
                Confirm Payment Received
              </button>
              <button
                onClick={() => handlePaymentStatusUpdate('failed')}
                disabled={updating}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Mark as Failed
              </button>
            </div>
          </div>
        )}

        {order.payment_status === 'paid' && (
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-green-600 flex items-center gap-2">
              <FiCheck size={16} />
              Payment has been confirmed. You can now update the order status below.
            </p>
          </div>
        )}
      </div>

      {/* Order Status and Actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Order Status</h2>
            <div className="flex items-center gap-3">
              {getStatusBadge(order.order_status)}
            </div>
          </div>
        </div>

        {/* Show warning if payment is not confirmed */}
        {order.payment_status !== 'paid' && order.order_status !== 'cancelled' && (
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              ⚠️ Please confirm payment status first before updating order status
            </p>
          </div>
        )}

        {/* Status Update Actions */}
        {availableStatuses.length > 0 && order.payment_status === 'paid' && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Update Order Status</h3>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    status === 'cancelled'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  <FiCheck size={16} />
                  Mark as {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Allow cancel even if payment is pending */}
        {order.order_status === 'pending' && order.payment_status === 'pending' && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Order Actions</h3>
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={updating}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheck size={16} />
              Cancel Order
            </button>
          </div>
        )}

        {(order.order_status === 'delivered' || order.order_status === 'cancelled') && (
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {order.order_status === 'delivered'
                ? 'This order has been completed and delivered to the customer.'
                : 'This order has been cancelled.'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUser className="text-primary-600" />
            Customer Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <FiPhone size={14} /> Mobile
              </p>
              <p className="font-medium">{order.customer_mobile}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <FiMail size={14} /> Email
              </p>
              <p className="font-medium">{order.customer_email}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiMapPin className="text-primary-600" />
            Shipping Address
          </h2>
          <p className="text-gray-700 leading-relaxed">{order.shipping_address}</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiPackage className="text-primary-600" />
          Order Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-4 px-4 text-right text-gray-700">
                    ₹{parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-gray-900">
                    ₹{parseFloat(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center max-w-md ml-auto">
            <div>
              <p className="text-gray-600 mb-2">Subtotal</p>
              <p className="text-gray-600 mb-2">Delivery Charges</p>
              <p className="text-lg font-bold text-gray-900">Total Amount</p>
            </div>
            <div className="text-right">
              <p className="text-gray-900 mb-2">
                ₹{parseFloat(order.subtotal || order.total_amount).toFixed(2)}
              </p>
              <p className="text-gray-900 mb-2">
                ₹{parseFloat(order.delivery_charges || 0).toFixed(2)}
              </p>
              <p className="text-2xl font-bold text-primary-600">
                ₹{parseFloat(order.total_amount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiCreditCard className="text-primary-600" />
          Payment Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="font-medium uppercase">
              {order.payment_gateway_data?.payment_method || 'COD'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Status</p>
            <div className="mt-1">{getPaymentBadge(order.payment_status)}</div>
          </div>
          {order.payment_gateway_data?.razorpay_payment_id && (
            <div>
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="font-medium font-mono text-sm">
                {order.payment_gateway_data.razorpay_payment_id}
              </p>
            </div>
          )}
          {order.payment_gateway_data?.razorpay_order_id && (
            <div>
              <p className="text-sm text-gray-500">Gateway Order ID</p>
              <p className="font-medium font-mono text-sm">
                {order.payment_gateway_data.razorpay_order_id}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
