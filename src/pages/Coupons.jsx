import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiTag, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { couponsAPI } from '../services/api';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await couponsAPI.getAll();
      setCoupons(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare data
    const submitData = {
      code: formData.code.toUpperCase(),
      description: formData.description,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      valid_from: formData.valid_from || new Date().toISOString(),
      valid_until: formData.valid_until,
      is_active: formData.is_active
    };

    try {
      if (editingCoupon) {
        await couponsAPI.update(editingCoupon._id, submitData);
        toast.success('Coupon updated successfully');
      } else {
        await couponsAPI.create(submitData);
        toast.success('Coupon created successfully');
      }

      resetForm();
      fetchCoupons();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save coupon';
      toast.error(message);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount ? coupon.min_order_amount.toString() : '',
      max_discount_amount: coupon.max_discount_amount ? coupon.max_discount_amount.toString() : '',
      usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().split('T')[0] : '',
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : '',
      is_active: coupon.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;

    try {
      await couponsAPI.delete(id);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete coupon';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await couponsAPI.toggleStatus(id);
      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchCoupons();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to toggle coupon status';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      is_active: true
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus />
          {showForm ? 'Cancel' : 'Add Coupon'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold mb-4">
            {editingCoupon ? 'Edit Coupon' : 'New Coupon'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coupon Code */}
              <div>
                <label className="label">Coupon Code *</label>
                <input
                  type="text"
                  className="input uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g., SAVE20, WELCOME100"
                  maxLength={20}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="label">Discount Type *</label>
                <select
                  className="input"
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="label">
                  Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(Rs.)'}
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder={formData.discount_type === 'percentage' ? 'e.g., 10, 20, 50' : 'e.g., 50, 100, 200'}
                />
              </div>

              {/* Min Order Amount */}
              <div>
                <label className="label">Minimum Order Amount (Rs.)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 500, 1000"
                />
              </div>

              {/* Max Discount Amount (for percentage) */}
              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="label">Maximum Discount Cap (Rs.)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 100, 200, 500"
                  />
                </div>
              )}

              {/* Usage Limit */}
              <div>
                <label className="label">Usage Limit</label>
                <input
                  type="number"
                  className="input"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  min="1"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Valid From */}
              <div>
                <label className="label">Valid From *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="label">Valid Until *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  required
                  min={formData.valid_from}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Get 20% off on orders above Rs.500"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active (Visible to users)
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn btn-primary">
                {editingCoupon ? 'Update' : 'Create'} Coupon
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="card text-center py-12">
          <FiTag className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No coupons yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon, index) => (
                  <motion.tr
                    key={coupon._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiTag className="text-primary-600 mr-2" size={16} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {coupon.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : `Rs.${coupon.discount_value}`}
                      </div>
                      {coupon.discount_type === 'percentage' && coupon.max_discount_amount && (
                        <div className="text-xs text-gray-500">
                          Max: Rs.{coupon.max_discount_amount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.min_order_amount > 0
                          ? `Rs.${coupon.min_order_amount}`
                          : 'No minimum'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.used_count}/{coupon.usage_limit || '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(coupon.valid_until)}
                      </div>
                      {new Date(coupon.valid_until) < new Date() && (
                        <div className="text-xs text-red-600">Expired</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(coupon._id, coupon.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            coupon.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={coupon.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {coupon.is_active ? (
                            <FiToggleRight size={20} />
                          ) : (
                            <FiToggleLeft size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id, coupon.code)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
