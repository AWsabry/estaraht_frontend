import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api, type PatientPlanSubscription } from '../lib/api';
import { Search, ClipboardList, CheckCircle, XCircle, Calendar, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useLanguage } from '../contexts/LanguageContext';

export default function PatientPlanSubscriptions() {
  const { t, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();
  const planIdFilter = searchParams.get('plan') || '';
  const [subscriptions, setSubscriptions] = useState<PatientPlanSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, [planIdFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      if (planIdFilter) {
        const response: any = await api.patientPlanSubscriptions.getByPlan(planIdFilter);
        setSubscriptions(response.data || []);
      } else {
        const response: any = await api.patientPlanSubscriptions.getAll();
        setSubscriptions(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    const patientName = (sub.patients?.name || '').toLowerCase();
    const planName = (sub.payment_plans?.plan_name || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return patientName.includes(term) || planName.includes(term);
  });

  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trialing'
  );
  const expiredSubs = subscriptions.filter((s) => s.status === 'expired');

  const handleDelete = async (id: string) => {
    if (!confirm(t('subscriptions.deleteConfirm'))) return;
    try {
      await api.patientPlanSubscriptions.delete(id);
      fetchSubscriptions();
    } catch (err) {
      console.error('Error deleting subscription:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active' || status === 'trialing';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {status}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('subscriptions.title')}</h1>
              <p className="text-gray-600 mt-1">{t('subscriptions.subtitle')}</p>
              {planIdFilter && (
                <Link
                  to="/patient-plan-subscriptions"
                  className="mt-2 inline-block text-sm text-[#204FCF] hover:underline"
                >
                  Clear plan filter
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('subscriptions.total')}</p>
                  <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-[#204FCF]" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('subscriptions.active')}</p>
                  <p className="text-2xl font-bold text-gray-900">{activeSubs.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('subscriptions.expired')}</p>
                  <p className="text-2xl font-bold text-gray-900">{expiredSubs.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
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
                placeholder={t('subscriptions.search')}
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
                        {t('subscriptions.table.patient')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.plan')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscribed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSubs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                          {t('subscriptions.empty')}
                        </td>
                      </tr>
                    ) : (
                      filteredSubs.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link
                              to={`/patients/${sub.patient_id}`}
                              className="text-[#204FCF] hover:underline font-medium"
                            >
                              {sub.patients?.name || sub.patient_id}
                            </Link>
                            {sub.patients?.email && (
                              <div className="text-xs text-gray-500">{sub.patients.email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/payment-plans`}
                              className="text-gray-900 hover:text-[#204FCF]"
                            >
                              <span className="font-medium">
                                {sub.payment_plans?.plan_name || sub.plan_id}
                              </span>
                              {sub.payment_plans?.plan_name_ar && (
                                <div className="text-xs text-gray-500 mt-0.5" dir="rtl">
                                  {sub.payment_plans.plan_name_ar}
                                </div>
                              )}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                          {sub.sessions_purchased}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {sub.payment_currency === 'MRU'
                              ? `${Number(sub.price_paid).toFixed(0)} MRU`
                              : `${Number(sub.price_paid).toFixed(2)}`}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {sub.payment_currency || 'USD'}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {sub.subscribed_at
                                ? new Date(sub.subscribed_at).toLocaleDateString()
                                : '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {sub.expires_at
                                ? new Date(sub.expires_at).toLocaleDateString()
                                : '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="text-red-600 hover:text-red-900"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
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
    </ProtectedRoute>
  );
}
