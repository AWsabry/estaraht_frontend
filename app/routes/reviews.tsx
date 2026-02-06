import { useEffect, useState } from 'react';
import { api, type Review } from '../lib/api';
import { Search, Edit, Trash2, Star, MessageSquare } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response: any = await api.reviews.getAll();
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const term = searchTerm.toLowerCase();
    return (
      review.comment?.toLowerCase().includes(term) ||
      review.rating?.includes(searchTerm) ||
      review.booking_id?.toLowerCase().includes(term) ||
      review.patient_id?.toLowerCase().includes(term) ||
      review.doctor_id?.toLowerCase().includes(term)
    );
  });

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t('reviews.deleteConfirm') || t('users.deleteConfirm'))) return;

    try {
      await api.reviews.delete(reviewId);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const renderStars = (rating: string) => {
    const numRating = parseInt(rating) || 0;
    return (
      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= numRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span
          className={`text-sm text-gray-600 ${isRTL ? 'mr-1' : 'ml-1'}`}
        >
          ({rating})
        </span>
      </div>
    );
  };

  const totalReviews = reviews.length;
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0) /
          reviews.length
        ).toFixed(2)
      : '0.00';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold text-gray-900 ${isRTL ? 'text-right' : ''}`}>
              {t('reviews.title')}
            </h1>
            <p className={`text-gray-600 mt-1 ${isRTL ? 'text-right' : ''}`}>
              {t('reviews.subtitle')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reviews.totalReviews')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
              </div>
              <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#204FCF]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reviews.averageRating')}</p>
                <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="relative">
            <Search
              className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${
                isRTL ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              placeholder={t('reviews.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${
                isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'
              }`}
            />
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('reviews.reviewId')}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('reviews.bookingId')}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('reviews.patientEmail')}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('reviews.doctorEmail')}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('reviews.rating')}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('reviews.comment')}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('reviews.createdAt')}
                    </th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        {t('reviews.noReviews')}
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-sm font-medium text-gray-900">
                            {review.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-sm text-gray-900">
                            {review.booking_id ? review.booking_id.substring(0, 8) + '...' : t('users.notAvailable')}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-sm text-gray-900">
                            {review.patients?.email || review.patient_id || t('users.notAvailable')}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-sm text-gray-900">
                            {review.doctors?.email || review.doctor_id || t('users.notAvailable')}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          {renderStars(review.rating)}
                        </td>
                        <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {review.comment || t('reviews.noComment')}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString()
                            : t('users.notAvailable')}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`flex gap-2 ${isRTL ? 'justify-end flex-row-reverse' : ''}`}>
                            <button className="text-[#204FCF] hover:text-[#1a3fa6]" title={t('common.edit')}>
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="text-red-600 hover:text-red-900"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

