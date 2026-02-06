import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { api, type PaymentPlan } from '../lib/api';
import { Search, Plus, Trash2, FileText, CheckCircle, XCircle, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useLanguage } from '../contexts/LanguageContext';

export default function PaymentPlans() {
  const { t, isRTL } = useLanguage();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_name_ar: '',
    plan_name_fr: '',
    description: '',
    description_ar: '',
    description_fr: '',
    price: '',
    payment_currency: 'USD',
    sessions: '',
    is_first_time_only: false,
    is_active: true,
    sort_order: '0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response: any = await api.paymentPlans.getAll();
      setPlans(response.data || []);
    } catch (err) {
      console.error('Error fetching payment plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const name = (plan.plan_name || '').toLowerCase();
    const nameAr = (plan.plan_name_ar || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || nameAr.includes(term);
  });

  const activePlans = plans.filter((p) => p.is_active !== false);

  const handleDelete = async (id: string) => {
    if (!confirm(t('paymentPlans.deleteConfirm'))) return;
    try {
      await api.paymentPlans.delete(id);
      fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.paymentPlans.create({
        plan_name: formData.plan_name,
        plan_name_ar: formData.plan_name_ar || null,
        plan_name_fr: formData.plan_name_fr || null,
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        description_fr: formData.description_fr || null,
        price: parseFloat(formData.price) || 0,
        payment_currency: formData.payment_currency || 'USD',
        sessions: parseInt(formData.sessions, 10) || 0,
        is_first_time_only: formData.is_first_time_only,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      });
      setShowCreateModal(false);
      setFormData({
        plan_name: '',
        plan_name_ar: '',
        plan_name_fr: '',
        description: '',
        description_ar: '',
        description_fr: '',
        price: '',
        payment_currency: 'USD',
        sessions: '',
        is_first_time_only: false,
        is_active: true,
        sort_order: '0',
      });
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('paymentPlans.title')}</h1>
              <p className="text-gray-600 mt-1">{t('paymentPlans.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('paymentPlans.addPlan')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('paymentPlans.total')}</p>
                  <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#204FCF]" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('paymentPlans.active')}</p>
                  <p className="text-2xl font-bold text-gray-900">{activePlans.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="relative">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`}
              />
              <input
                type="text"
                placeholder={t('paymentPlans.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('paymentPlans.table.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('paymentPlans.table.price')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First time only
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('paymentPlans.table.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          {t('paymentPlans.empty')}
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-[#204FCF]" />
                              <div>
                                <span className="font-medium text-gray-900">{plan.plan_name}</span>
                                {plan.plan_name_ar && (
                                  <div className="text-xs text-gray-500">{plan.plan_name_ar}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {plan.payment_currency === 'MRU' ? (
                              `${Number(plan.price).toFixed(0)} MRU`
                            ) : (
                              `${Number(plan.price).toFixed(2)}`
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {plan.payment_currency || 'USD'}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {plan.sessions}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {plan.is_first_time_only ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                                plan.is_active !== false
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {plan.is_active !== false ? (
                                <><CheckCircle className="w-3 h-3" /> Active</>
                              ) : (
                                <><XCircle className="w-3 h-3" /> Inactive</>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Link
                                to={`/patient-plan-subscriptions?plan=${plan.id}`}
                                className="text-[#204FCF] hover:text-[#1a3fa6]"
                                title="View subscriptions"
                              >
                                {t('common.view')}
                              </Link>
                              <button
                                onClick={() => handleDelete(plan.id)}
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

          {showCreateModal && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">{t('paymentPlans.addPlan')}</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('paymentPlans.table.name')} (EN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plan_name}
                      onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                      placeholder="e.g. Monthly Plan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan name (AR)
                      </label>
                      <input
                        type="text"
                        value={formData.plan_name_ar}
                        onChange={(e) => setFormData({ ...formData, plan_name_ar: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan name (FR)
                      </label>
                      <input
                        type="text"
                        value={formData.plan_name_fr}
                        onChange={(e) => setFormData({ ...formData, plan_name_fr: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('paymentPlans.table.price')} *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.payment_currency}
                        onChange={(e) => setFormData({ ...formData, payment_currency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                      >
                        <option value="USD">USD</option>
                        <option value="MRU">MRU</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sessions *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.sessions}
                        onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_first_time_only"
                        checked={formData.is_first_time_only}
                        onChange={(e) => setFormData({ ...formData, is_first_time_only: e.target.checked })}
                        className="w-4 h-4 text-[#204FCF] border-gray-300 rounded"
                      />
                      <label htmlFor="is_first_time_only" className="text-sm text-gray-700">
                        First time only
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-[#204FCF] border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : t('common.create')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
