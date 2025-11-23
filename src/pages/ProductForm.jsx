import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSave, FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import { productsAPI, uploadAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock_qty: '',
    category: '',
    images: []
  });

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?is_active=true');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      const product = response.data.data;
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        price: product.price || '',
        stock_qty: product.stock_qty || '',
        category: product.category || '',
        images: product.images || []
      });
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/products');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const imageUrl = response.data.url;

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));

      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index, imageUrl) => {
    try {
      // Extract public_id from Cloudinary URL if needed
      const publicIdMatch = imageUrl.match(/\/([^\/]+)\.[^\.]+$/);
      const publicId = publicIdMatch ? publicIdMatch[1] : null;

      if (publicId) {
        await uploadAPI.deleteImage(publicId);
      }

      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));

      toast.success('Image removed');
    } catch (error) {
      // Remove from UI even if deletion fails
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
      console.error('Failed to delete image:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock_qty: parseInt(formData.stock_qty)
      };

      if (isEditMode) {
        await productsAPI.update(id, submitData);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(submitData);
        toast.success('Product created successfully');
      }

      navigate('/products');
    } catch (error) {
      const message = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} product`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <button
            onClick={() => navigate('/products')}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="label">Product Name *</label>
            <input
              type="text"
              name="name"
              className="input"
              placeholder="e.g., A4 Size Notebook"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          {/* SKU */}
          <div>
            <label className="label">SKU (Stock Keeping Unit) *</label>
            <input
              type="text"
              name="sku"
              className="input"
              placeholder="e.g., NB-A4-200"
              value={formData.sku}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                className="input"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input
                type="number"
                name="stock_qty"
                className="input"
                placeholder="0"
                value={formData.stock_qty}
                onChange={handleChange}
                required
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              name="category"
              className="input"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No categories available. <a href="/categories" className="text-primary-600 hover:underline">Create one first</a>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              className="input min-h-[100px]"
              placeholder="Enter product description..."
              value={formData.description}
              onChange={handleChange}
              maxLength={2000}
              rows={4}
            />
          </div>

          {/* Images */}
          <div>
            <label className="label">Product Images</label>

            {/* Image Upload Button */}
            <div className="mb-4">
              <label className="btn btn-secondary inline-flex items-center gap-2 cursor-pointer">
                <FiUpload />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Max file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>

            {/* Image Gallery */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, image)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <motion.button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiSave />
              {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductForm;
