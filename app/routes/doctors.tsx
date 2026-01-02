import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, type Doctor } from '../lib/api';
import { Search, Edit, Trash2, Star, DollarSign, Users, Calendar, Plus, X, Eye } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { t, isRTL } = useLanguage();
  const normalizedSearch = searchTerm.toLowerCase();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    age: '',
    gender: '',
    specialization: '',
    bio: '',
    years_of_exp: '',
    booking_price: '',
    profile_img_url: '',
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response: any = await api.doctors.getAll();
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const name = doctor.full_name?.toLowerCase() || '';
    const email = doctor.email?.toLowerCase() || '';
    const specialization = doctor.specialization?.toLowerCase() || '';
    return name.includes(normalizedSearch) || email.includes(normalizedSearch) || specialization.includes(normalizedSearch);
  });

  const handleDelete = async (doctorId: string) => {
    if (!confirm(t('doctors.deleteConfirm'))) return;

    try {
      await api.doctors.delete(doctorId);
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const doctorPayload: Partial<Doctor> = {
        full_name: formData.full_name || null,
        email: formData.email || null,
        phone_number: formData.phone_number || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        specialization: formData.specialization || null,
        bio: formData.bio || null,
        years_of_exp: formData.years_of_exp ? parseInt(formData.years_of_exp) : null,
        booking_price: formData.booking_price ? parseFloat(formData.booking_price) : null,
        profile_img_url: formData.profile_img_url || null,
        avg_rating: null,
        numb_session: 0,
        number_review: 0,
        numb_patients: 0,
      };

      await api.doctors.create(doctorPayload);
      setShowCreateModal(false);
      setFormData({
        full_name: '',
        email: '',
        phone_number: '',
        age: '',
        gender: '',
        specialization: '',
        bio: '',
        years_of_exp: '',
        booking_price: '',
        profile_img_url: '',
      });
      fetchDoctors();
    } catch (error) {
      console.error('Error creating doctor:', error);
      alert('Failed to create doctor. Please check the console for details.');
    }
  };

  const getGenderLabel = (gender?: string | null) => {
    const normalized = gender?.toLowerCase();
    if (normalized === 'male') return t('doctors.male');
    if (normalized === 'female') return t('doctors.female');
    if (normalized === 'other') return t('doctors.other');
    return gender || t('doctors.notAvailable');
  };

  const getYearsLabel = (years?: number | null) => {
    if (!years && years !== 0) return t('doctors.notAvailable');
    return `${years} ${t('doctors.yearsSuffix')}`;
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 ${isRTL ? 'text-right' : ''}`}>{t('doctors.title')}</h1>
          <p className={`text-gray-600 mt-1 ${isRTL ? 'text-right' : ''}`}>{t('doctors.subtitle')}</p>
        </div>
        {/* <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#204FCF] text-white px-4 py-2 rounded-lg hover:bg-[#1a3fa6] transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('doctors.addDoctor')}
        </button> */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('doctors.totalDoctors')}</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#204FCF]" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('doctors.avgRating')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {(
                  doctors.reduce((acc, d) => acc + (d.avg_rating || 0), 0) / doctors.length || 0
                ).toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('doctors.totalSessions')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {doctors.reduce((acc, d) => acc + (d.numb_session || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('doctors.totalPatients')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {doctors.reduce((acc, d) => acc + (d.numb_patients || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
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
            placeholder={t('doctors.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${
              isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'
            }`}
          />
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('doctors.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('doctors.doctor')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('doctors.contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('doctors.specialization')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('doctors.experience')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('doctors.rating')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('doctors.price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('doctors.patients')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      {t('doctors.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <tr key={doctor.doctor_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {doctor.profile_img_url ? (
                            <img
                              src={doctor.profile_img_url}
                              alt={doctor.full_name || t('doctors.doctor')}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#e8edfc] rounded-full flex items-center justify-center">
                              <span className="text-[#204FCF] font-semibold">
                                {doctor.full_name?.[0]?.toUpperCase() || 'D'}
                              </span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {doctor.full_name || t('doctors.notAvailable')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getGenderLabel(doctor.gender)} {doctor.age ? `(${doctor.age})` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.email || t('doctors.notAvailable')}</div>
                        <div className="text-xs text-gray-500">{doctor.phone_number || t('doctors.notAvailable')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#e8edfc] text-[#204FCF]">
                          {doctor.specialization || t('doctors.notAvailable')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.years_of_exp ? getYearsLabel(doctor.years_of_exp) : t('doctors.notAvailable')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">
                            {doctor.avg_rating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({doctor.number_review || 0})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4" />
                          {doctor.booking_price || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {doctor.wallet !== null && doctor.wallet !== undefined ? doctor.wallet.toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.numb_patients || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            to={`/doctors/${doctor.doctor_id}`}
                            className="text-green-600 hover:text-green-900"
                            title={t('doctors.viewProfile')}
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button className="text-[#204FCF] hover:text-[#1a3fa6]" title={t('common.edit')}>
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doctor.doctor_id)}
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

      {/* Create Doctor Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">{t('doctors.createTitle')}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="doctor@example.com"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.age')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="35"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="" className="text-gray-900 bg-white">{t('doctors.selectGender')}</option>
                    <option value="male" className="text-gray-900 bg-white">{t('doctors.male')}</option>
                    <option value="female" className="text-gray-900 bg-white">{t('doctors.female')}</option>
                    <option value="other" className="text-gray-900 bg-white">{t('doctors.other')}</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.specialization')}
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="Cardiology"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.yearsOfExp')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.years_of_exp}
                    onChange={(e) => setFormData({ ...formData, years_of_exp: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.bookingPrice')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.booking_price}
                    onChange={(e) => setFormData({ ...formData, booking_price: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="100.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.profileImage')}
                  </label>
                  <input
                    type="url"
                    value={formData.profile_img_url}
                    onChange={(e) => setFormData({ ...formData, profile_img_url: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('doctors.bio')}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                    placeholder="Doctor's biography and qualifications..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                {/* <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors font-medium"
                >
                  {t('doctors.addDoctor')}
                </button> */}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
