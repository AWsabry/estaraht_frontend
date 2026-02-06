import { useEffect, useState, type FormEvent } from 'react';
import { api, type AdminUser } from '../lib/api';
import { UserPlus, Search, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'admin',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { t, isRTL } = useLanguage();
  const normalizedSearch = searchTerm.toLowerCase();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response: any = await api.users.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const email = user.email?.toLowerCase() || '';
    const name = user.full_name?.toLowerCase() || '';
    return email.includes(normalizedSearch) || name.includes(normalizedSearch);
  });

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload: Partial<AdminUser> = {
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim() || null,
        role: formData.role || 'admin',
        status: formData.status || 'active',
      };

      await api.users.create(payload);
      setShowCreateModal(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'admin',
        status: 'active',
      });
      await fetchUsers();
      alert(t('users.createSuccess'));
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || t('users.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t('users.deleteConfirm'))) return;

    try {
      await api.users.delete(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getStatusLabel = (status?: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'active') return t('users.status.active');
    if (normalized === 'inactive') return t('users.status.inactive');
    return status || t('users.notAvailable');
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 ${isRTL ? 'text-right' : ''}`}>{t('users.title')}</h1>
          <p className={`text-gray-600 mt-1 ${isRTL ? 'text-right' : ''}`}>{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center gap-2 px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors ${
            isRTL ? 'flex-row-reverse' : ''
          }`}
        >
          <UserPlus className="w-5 h-5" />
          {t('users.addUser')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-[#204FCF]" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.activeUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.inactiveUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.status !== 'active').length}
              </p>
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
            placeholder={t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${
              isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'
            }`}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('users.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.lastLogin')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {t('users.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#e8edfc] rounded-full flex items-center justify-center">
                            <span className="text-[#204FCF] font-semibold">
                              {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || t('users.notAvailable')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : t('users.never')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button className="text-[#204FCF] hover:text-[#1a3fa6]">
                            <Edit className="w-5 h-5" />
                          </button>
                          {user.role?.toLowerCase() !== 'admin' && (
                            <button
                              onClick={() => handleDelete(user.user_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setError('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div
              className={`sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <h2 className="text-xl font-bold text-gray-900">{t('users.createTitle')}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}
                  >
                    {t('users.form.fullName')}
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${
                      isRTL ? 'text-right' : ''
                    }`}
                    placeholder={t('users.form.fullNamePlaceholder')}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}
                  >
                    {t('login.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${
                      isRTL ? 'text-right' : ''
                    }`}
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}
                  >
                    {t('login.password')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${
                      isRTL ? 'text-right' : ''
                    }`}
                    placeholder={t('users.form.passwordPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}
                    >
                      {t('users.table.role')}
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                    >
                      <option value="admin">{t('users.form.roleAdmin')}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('users.form.roleHelp')}
                    </p>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}
                    >
                      {t('users.table.status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                    >
                      <option value="active">{t('users.status.active')}</option>
                      <option value="inactive">{t('users.status.inactive')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                className={`flex gap-3 pt-4 border-t border-gray-200 mt-4 ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('users.form.creating') : t('users.form.create')}
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
