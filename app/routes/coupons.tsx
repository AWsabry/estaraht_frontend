import { useEffect, useState, type FormEvent } from 'react';
import { api, type Coupon } from '../lib/api';
import { Search, Plus, Edit, Trash2, Ticket, CheckCircle, XCircle, Calendar, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    coupon_code: '',
    coupon_value: '',
    valid_until: '',
    one_use: false,
    number_of_uses: 1,
    for_user: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response: any = await api.coupons.getAll();
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.coupon_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.for_user?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (couponId: string) => {
    if (!confirm(t('coupons.deleteConfirm') || t('users.deleteConfirm'))) return;

    try {
      await api.coupons.delete(couponId);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate percentage is between 0-100
      const percentageValue = parseFloat(formData.coupon_value);
      if (isNaN(percentageValue) || percentageValue < 0 || percentageValue > 100) {
        setError('Discount percentage must be between 0 and 100');
        setSubmitting(false);
        return;
      }

      const couponData = {
        coupon_code: formData.coupon_code,
        coupon_value: formData.coupon_value || null,
        valid_until: formData.valid_until,
        one_use: formData.one_use,
        number_of_uses: formData.one_use ? 1 : formData.number_of_uses,
        for_user: formData.for_user || null,
      };

      const response: any = await api.coupons.create(couponData);
      
      if (response.success) {
        setShowCreateModal(false);
        setFormData({
          coupon_code: '',
          coupon_value: '',
          valid_until: '',
          one_use: false,
          number_of_uses: 1,
          for_user: '',
        });
        fetchCoupons();
      } else {
        setError(response.message || 'Failed to create coupon');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCoupons = coupons.filter(
    (c) => !c.is_used && new Date(c.valid_until) > new Date()
  );
  const usedCoupons = coupons.filter((c) => c.is_used);
  const expiredCoupons = coupons.filter(
    (c) => !c.is_used && new Date(c.valid_until) <= new Date()
  );

  const isExpired = (date: string) => new Date(date) <= new Date();

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('coupons.title')}</h1>
          <p className="text-gray-600 mt-1">{t('coupons.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('coupons.addCoupon')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('coupons.total')}</p>
              <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-[#204FCF]" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('coupons.active')}</p>
              <p className="text-2xl font-bold text-gray-900">{activeCoupons.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('coupons.used')}</p>
              <p className="text-2xl font-bold text-gray-900">{usedCoupons.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('coupons.expired')}</p>
              <p className="text-2xl font-bold text-gray-900">{expiredCoupons.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
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
            placeholder={t('coupons.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${
              isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('coupons.table.code')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('coupons.table.value')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('coupons.table.forUser')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('coupons.table.validUntil')}
                  </th>
         
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('coupons.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {t('coupons.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => {
                    const expired = isExpired(coupon.valid_until);
                    const isActive = !coupon.is_used && !expired;

                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-[#204FCF]" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {coupon.coupon_code}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {coupon.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {coupon.coupon_value ? `${coupon.coupon_value}%` : t('users.notAvailable')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.for_user || t('coupons.allUsers')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(coupon.valid_until).toLocaleDateString()}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                              isActive
                                ? 'bg-green-100 text-green-800'
                                : coupon.is_used
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                {t('coupons.status.active')}
                              </>
                            ) : coupon.is_used ? (
                              <>
                                <Ticket className="w-3 h-3" />
                                {t('coupons.status.used')}
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                {t('coupons.status.expired')}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {/* <button className="text-[#204FCF] hover:text-[#1a3fa6]" title={t('common.edit')}>
                              <Edit className="w-5 h-5" />
                            </button> */}
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="text-red-600 hover:text-red-900"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">{t('coupons.createTitle')}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                  setFormData({
                    coupon_code: '',
                    coupon_value: '',
                    valid_until: '',
                    one_use: false,
                    number_of_uses: 1,
                    for_user: '',
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coupon Code */}
                <div>
                  <label htmlFor="coupon_code" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('coupons.form.code')} *
                  </label>
                  <input
                    type="text"
                    id="coupon_code"
                    required
                    value={formData.coupon_code}
                    onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                    placeholder="SUMMER2024"
                  />
                </div>

                {/* Coupon Value - Percentage Only */}
                <div>
                  <label htmlFor="coupon_value" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('coupons.form.value')} (Percentage) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="coupon_value"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.coupon_value}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Ensure value is between 0-100
                        if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                          setFormData({ ...formData, coupon_value: value });
                        }
                      }}
                      className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                      placeholder="0-100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter discount percentage (0-100)</p>
                </div>

                {/* Valid Until */}
                <div>
                  <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('coupons.form.validUntil')} *
                  </label>
                  <input
                    type="date"
                    id="valid_until"
                    required
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                  />
                </div>

                {/* For User */}
                <div>
                  {/* <label htmlFor="for_user" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('coupons.form.forUser')}
                  </label> */}
                  {/* <input
                    type="text"
                    id="for_user"
                    value={formData.for_user}
                    onChange={(e) => setFormData({ ...formData, for_user: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                    placeholder={t('coupons.form.forUserPlaceholder')}
                  /> */}
                  {/* <p className="text-xs text-gray-500 mt-1">{t('coupons.form.forUserHelp')}</p> */}
                </div>
              </div>

              {/* One Use Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="one_use"
                  checked={formData.one_use}
                  onChange={(e) => setFormData({ ...formData, one_use: e.target.checked })}
                  className="w-5 h-5 text-[#204FCF] border-gray-300 rounded focus:ring-[#204FCF]"
                />
                <label htmlFor="one_use" className="text-sm font-medium text-gray-700">
                  {t('coupons.form.oneTimeUse')}
                </label>
              </div>

              {/* Number of Uses */}
              {/* {!formData.one_use && (
                <div>
                  <label htmlFor="number_of_uses" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('coupons.form.numberOfUses')}
                  </label>
                  <input
                    type="number"
                    id="number_of_uses"
                    min="1"
                    value={formData.number_of_uses}
                    onChange={(e) => setFormData({ ...formData, number_of_uses: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                  />
                </div>
              )} */}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setFormData({
                      coupon_code: '',
                      coupon_value: '',
                      valid_until: '',
                      one_use: false,
                      number_of_uses: 1,
                      for_user: '',
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('coupons.form.creating') : t('coupons.form.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
