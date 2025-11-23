import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiEye, FiEyeOff, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/admin/reviews');
      setReviews(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
    try {
      await api.put(`/admin/reviews/${reviewId}/visibility`);
      toast.success(`Review ${currentVisibility ? 'hidden' : 'shown'} successfully`);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const handleAddResponse = async (reviewId) => {
    if (!adminResponse.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await api.put(`/admin/reviews/${reviewId}/response`, {
        admin_response: adminResponse
      });
      toast.success('Response added successfully');
      setAdminResponse('');
      setRespondingTo(null);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to add response');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
        <div className="text-sm text-gray-600">
          Total Reviews: <span className="font-semibold">{reviews.length}</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="card text-center py-12">
          <FiStar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card ${!review.is_visible ? 'border-2 border-red-200 bg-red-50/30' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {/* Product Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {review.product_id?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        SKU: {review.product_id?.sku || 'N/A'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(review.rating)}`}>
                      {review.rating}.0 ⭐
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {review.is_verified_purchase && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Rating Stars */}
                  <div className="mb-3">
                    {renderStars(review.rating)}
                  </div>

                  {/* Review Text */}
                  {review.review_text && (
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{review.review_text}</p>
                  )}

                  {/* Admin Response */}
                  {review.admin_response && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FiMessageSquare className="text-blue-600" size={16} />
                        <span className="text-sm font-medium text-blue-900">Admin Response:</span>
                      </div>
                      <p className="text-sm text-blue-800">{review.admin_response}</p>
                    </div>
                  )}

                  {/* Add Response Form */}
                  {respondingTo === review._id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <textarea
                        className="input mb-2"
                        placeholder="Type your response..."
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        rows={3}
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddResponse(review._id)}
                          className="btn btn-primary text-sm"
                        >
                          Submit Response
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setAdminResponse('');
                          }}
                          className="btn btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                {!review.admin_response && (
                  <button
                    onClick={() => setRespondingTo(review._id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiMessageSquare size={16} />
                    Respond
                  </button>
                )}
                <button
                  onClick={() => handleToggleVisibility(review._id, review.is_visible)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    review.is_visible
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {review.is_visible ? (
                    <>
                      <FiEyeOff size={16} />
                      Hide Review
                    </>
                  ) : (
                    <>
                      <FiEye size={16} />
                      Show Review
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
