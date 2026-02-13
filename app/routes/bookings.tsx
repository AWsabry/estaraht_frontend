import { useEffect, useState } from 'react';
import { api, type Bookings } from '../lib/api';
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Stethoscope, Plus, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';

type Doctor = {
  doctor_id: string;
  full_name: string;
  specialization: string;
  email: string;
};

type Patient = {
  id: string;
  name: string;
  email: string;
};

export default function Appointments() {
  const { t, isRTL } = useLanguage();
  const [appointments, setAppointments] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    doctor_id: '',
    patient_id: '',
    booking_date: '',
    booking_time: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctorsAndPatients();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response: any = await api.bookings.getAll();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsAndPatients = async () => {
    try {
      const [doctorsRes, patientsRes]: any = await Promise.all([
        api.doctors.getAll(),
        api.patients.getAll(),
      ]);
      setDoctors(doctorsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (error) {
      console.error('Error fetching doctors/patients:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.bookings.create({
        doctor_id: formData.doctor_id,
        patient_id: formData.patient_id,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        status: 'pending',
      });
      setShowCreateModal(false);
      setFormData({
        doctor_id: '',
        patient_id: '',
        booking_date: '',
        booking_time: '',
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(t('bookings.createError'));
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.booking_date.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || appointment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.bookings.updateStatus(id.toString(), newStatus);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('bookings.deleteConfirm'))) return;

    try {
      await api.bookings.delete(id.toString());
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: t('bookings.pending') },
      confirmed: { icon: CheckCircle, color: 'bg-[#e8edfc] text-[#204FCF]', label: t('bookings.confirmed') },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: t('bookings.cancelled') },
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: t('bookings.completed') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full w-fit ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('bookings.title')}</h1>
            <p className="text-gray-600 mt-1">{t('bookings.subtitle')}</p>
          </div>
          {/* <button
            onClick={() => setShowCreateModal(true)}
            className={`flex items-center gap-2 bg-[#204FCF] text-white px-4 py-2 rounded-lg hover:bg-[#1a3fa6] transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Plus className="w-5 h-5" />
            {t('bookings.bookAppointment')}
          </button> */}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#204FCF]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.pending')}</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.confirmed')}</p>
                <p className="text-2xl font-bold text-gray-900">{confirmedCount}</p>
              </div>
              <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#204FCF]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('bookings.completed')}</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('bookings.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
            >
              <option value="all">{t('bookings.allStatus')}</option>
              <option value="pending">{t('bookings.pending')}</option>
              <option value="confirmed">{t('bookings.confirmed')}</option>
              <option value="completed">{t('bookings.completed')}</option>
              <option value="cancelled">{t('bookings.cancelled')}</option>
            </select>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">{t('bookings.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('bookings.patient')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookings.doctor')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookings.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookings.timeSlot')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookings.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {t('bookings.noAppointments')}
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {appointment.patient?.profile_img_url ? (
                              <img
                                src={appointment.patient.profile_img_url}
                                alt={appointment.patient.name || t('bookings.patient')}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-600" />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.patient?.name || t('bookings.unknownPatient')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.patient?.email || t('users.notAvailable')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {appointment.doctor?.profile_img_url ? (
                              <img
                                src={appointment.doctor.profile_img_url}
                                alt={appointment.doctor.full_name || t('bookings.doctor')}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Stethoscope className="w-6 h-6 text-green-600" />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.doctor?.full_name || t('bookings.unknownDoctor')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.doctor?.specialization || t('users.notAvailable')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(appointment.booking_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {appointment.booking_time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(appointment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <select
                              value={appointment.status}
                              onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                            >
                              <option value="pending">{t('bookings.pending')}</option>
                              <option value="confirmed">{t('bookings.confirmed')}</option>
                              <option value="completed">{t('bookings.completed')}</option>
                              <option value="cancelled">{t('bookings.cancelled')}</option>
                            </select>
                            <button
                              onClick={() => handleDelete(appointment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-5 h-5" />
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

        {/* Create Appointment Modal */}
        {showCreateModal && (
          <div 
            className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className={`sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-bold text-gray-900">{t('bookings.createTitle')}</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.doctor')}
                  </label>
                  <select
                    required
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: isRTL ? 'left 0.5rem center' : 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      [isRTL ? 'paddingLeft' : 'paddingRight']: '2.5rem'
                    }}
                  >
                    <option value="" className="text-gray-900 bg-white">{t('bookings.selectDoctor')}</option>
                    {doctors.map((doctor) => (
                      <option 
                        key={doctor.doctor_id} 
                        value={doctor.doctor_id}
                        className="text-gray-900 bg-white"
                      >
                        {doctor.full_name} - {doctor.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.patient')}
                  </label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF] appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: isRTL ? 'left 0.5rem center' : 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      [isRTL ? 'paddingLeft' : 'paddingRight']: '2.5rem'
                    }}
                  >
                    <option value="" className="text-gray-900 bg-white">{t('bookings.selectPatient')}</option>
                    {patients.map((patient) => (
                      <option 
                        key={patient.id} 
                        value={patient.id}
                        className="text-gray-900 bg-white"
                      >
                        {patient.name} - {patient.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.appointmentDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.booking_date}
                    onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.timeSlot')}
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.booking_time}
                    onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                  />
                </div>

                <div className={`flex gap-3 pt-4 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors font-medium"
                  >
                    {t('bookings.createAppointment')}
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
