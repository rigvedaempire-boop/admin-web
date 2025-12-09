import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiEdit2, FiTrash2, FiPlus, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const XeroxPricing = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await api.get('/admin/xerox-pricing');
      setPricing(response.data.pricing || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast.error('Failed to fetch pricing');
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm('This will create default pricing configurations. Continue?')) return;

    try {
      const response = await api.post('/admin/xerox-pricing/seed');
      toast.success(response.data.message);
      fetchPricing();
    } catch (error) {
      toast.error('Failed to seed default pricing');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pricing configuration?')) return;

    try {
      await api.delete(`/admin/xerox-pricing/${id}`);
      toast.success('Pricing deleted successfully');
      fetchPricing();
    } catch (error) {
      toast.error('Failed to delete pricing');
    }
  };

  const handleEdit = (price) => {
    setEditingPrice(price);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingPrice(null);
    setShowModal(true);
  };

  const colorTypeLabels = {
    black_white: 'Black & White',
    color: 'Color'
  };

  const printSideLabels = {
    single: 'Single Side',
    double: 'Double Side'
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xerox Pricing</h1>
          <p className="text-gray-500 mt-1">Manage pricing for different xerox configurations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiRefreshCw size={18} />
            Seed Defaults
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus size={18} />
            Add Pricing
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      {pricing.length === 0 ? (
        <div className="card text-center py-12">
          <FiDollarSign className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 mb-4">No pricing configurations yet</p>
          <button
            onClick={handleSeedDefaults}
            className="btn btn-primary"
          >
            Seed Default Pricing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricing.map((price, index) => (
            <motion.div
              key={price._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card hover:shadow-md transition-shadow ${!price.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {colorTypeLabels[price.color_type]}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Paper: {price.paper_size}</p>
                    <p>Side: {printSideLabels[price.print_side]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    ₹{parseFloat(price.price_per_page).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">per page</p>
                </div>
              </div>

              {!price.is_active && (
                <div className="mb-3">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                    Inactive
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(price)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FiEdit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(price._id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pricing Summary */}
      {pricing.length > 0 && (
        <div className="card bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">Pricing Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Configs</p>
              <p className="text-xl font-bold text-gray-900">{pricing.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Active</p>
              <p className="text-xl font-bold text-green-600">
                {pricing.filter(p => p.is_active).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Min Price</p>
              <p className="text-xl font-bold text-blue-600">
                ₹{Math.min(...pricing.map(p => p.price_per_page)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Max Price</p>
              <p className="text-xl font-bold text-purple-600">
                ₹{Math.max(...pricing.map(p => p.price_per_page)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <PricingModal
          pricing={editingPrice}
          onClose={() => {
            setShowModal(false);
            setEditingPrice(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingPrice(null);
            fetchPricing();
          }}
        />
      )}
    </div>
  );
};

// Pricing Modal Component
const PricingModal = ({ pricing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    color_type: pricing?.color_type || 'black_white',
    paper_size: pricing?.paper_size || 'A4',
    print_side: pricing?.print_side || 'single',
    price_per_page: pricing?.price_per_page || 2,
    is_active: pricing?.is_active !== undefined ? pricing.is_active : true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/admin/xerox-pricing', formData);
      toast.success(pricing ? 'Pricing updated successfully' : 'Pricing created successfully');
      onSave();
    } catch (error) {
      toast.error('Failed to save pricing');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">
          {pricing ? 'Edit Pricing' : 'Add New Pricing'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Color Type</label>
            <select
              className="input"
              value={formData.color_type}
              onChange={(e) => setFormData({ ...formData, color_type: e.target.value })}
              required
            >
              <option value="black_white">Black & White</option>
              <option value="color">Color</option>
            </select>
          </div>

          <div>
            <label className="label">Paper Size</label>
            <select
              className="input"
              value={formData.paper_size}
              onChange={(e) => setFormData({ ...formData, paper_size: e.target.value })}
              required
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
              required
            >
              <option value="single">Single Side</option>
              <option value="double">Double Side</option>
            </select>
          </div>

          <div>
            <label className="label">Price per Page (₹)</label>
            <input
              type="number"
              className="input"
              value={formData.price_per_page}
              onChange={(e) => setFormData({ ...formData, price_per_page: parseFloat(e.target.value) })}
              min="0"
              step="0.5"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default XeroxPricing;
