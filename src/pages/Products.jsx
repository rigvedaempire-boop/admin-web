import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiStar } from 'react-icons/fi';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;

    try {
      await productsAPI.delete(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link to="/products/new" className="btn btn-primary flex items-center gap-2">
          <FiPlus /> Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No products yet</p>
          <Link to="/products/new" className="btn btn-primary inline-flex items-center gap-2">
            <FiPlus /> Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-md transition-shadow"
            >
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <FiPlus className="text-gray-400" size={48} />
                </div>
              )}

              <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>

              {/* Rating Display */}
              {product.total_reviews > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <FiStar className="text-yellow-500 fill-yellow-500" size={16} />
                  <span className="text-sm font-medium text-gray-900">
                    {product.average_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({product.total_reviews} {product.total_reviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              <p className="text-lg font-bold text-primary-600 mb-2">
                ₹{parseFloat(product.price).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Stock: {product.stock_qty} units
              </p>

              <div className="flex gap-2">
                <Link
                  to={`/products/edit/${product._id}`}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                >
                  <FiEdit size={16} /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(product._id, product.name)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
