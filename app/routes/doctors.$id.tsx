import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { api, type Doctor, type Bookings } from '../lib/api';
import { 
  Star, DollarSign, Users, Calendar, Clock, Mail, Phone, User, Briefcase, 
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Search
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [approvalStatus, setApprovalStatus] = useState<string>('pending');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [updatingApproval, setUpdatingApproval] = useState(false);

  useEffect(() => {
    if (doctor) {
      setApprovalStatus(doctor.approval_status || 'pending');
      setRejectionReason(doctor.rejection_reason || '');
    }
  }, [doctor]);

  useEffect(() => {
    if (id) {
      fetchDoctorDetails();
      fetchDoctorAppointments();
    }
  }, [id]);

  const fetchDoctorDetails = async () => {
    setLoading(true);
    try {
      const response: any = await api.doctors.getById(id!);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const response: any = await api.bookings.getByDoctor(id!);
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleUpdateApprovalStatus = async () => {
    if (!id) return;
    setUpdatingApproval(true);
    try {
      const payload: Partial<typeof doctor> = {
        approval_status: approvalStatus as 'pending' | 'approved' | 'rejected',
      };
      if (approvalStatus === 'rejected' && rejectionReason.trim()) {
        payload.rejection_reason = rejectionReason.trim();
      } else if (approvalStatus !== 'rejected') {
        payload.rejection_reason = null;
      }
      await api.doctors.update(id, payload);
      setDoctor((prev) => prev ? { ...prev, ...payload } : null);
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Failed to update approval status');
    } finally {
      setUpdatingApproval(false);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.booking_date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.booking_time.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || appointment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { icon: CheckCircle, color: 'bg-[#e8edfc] text-[#204FCF]', label: 'Confirmed' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' },
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading doctor details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-gray-500 mb-4">Doctor not found</div>
          <Link
            to="/doctors"
            className="text-[#204FCF] hover:text-[#1a3fa6] flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Doctors
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Doctors
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {doctor.profile_img_url ? (
                <img
                  src={doctor.profile_img_url}
                  alt={doctor.full_name || 'Doctor'}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#e8edfc]"
                  />
                  ) : (
                    <div className="w-32 h-32 bg-[#e8edfc] rounded-full flex items-center justify-center border-4 border-[#d1dbf9]">
                      <span className="text-[#204FCF] font-bold text-4xl">
                    {doctor.full_name?.[0]?.toUpperCase() || 'D'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {doctor.full_name || 'N/A'}
              </h1>
              {doctor.specialization && (
                <p className="text-xl text-[#204FCF] font-medium mb-4">
                  {doctor.specialization}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                {doctor.avg_rating !== null && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-lg">{doctor.avg_rating.toFixed(1)}</span>
                    <span className="text-gray-500">({doctor.number_review || 0} reviews)</span>
                  </div>
                )}
                {doctor.years_of_exp !== null && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-5 h-5" />
                    <span>{doctor.years_of_exp} years experience</span>
                  </div>
                )}
                {doctor.booking_price !== null && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-5 h-5" />
                    <span>${doctor.booking_price.toFixed(2)} per session</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Approval Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Approval Status
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {approvalStatus === 'rejected' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (optional)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] focus:border-[#204FCF]"
                />
              </div>
            )}
            <button
              onClick={handleUpdateApprovalStatus}
              disabled={updatingApproval}
              className="px-4 py-2 bg-[#204FCF] text-white rounded-lg hover:bg-[#1a3fa6] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingApproval ? 'Updating...' : 'Update Status'}
            </button>
          </div>
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
              approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
              approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {approvalStatus === 'approved' && <CheckCircle className="w-3 h-3" />}
              {approvalStatus === 'rejected' && <XCircle className="w-3 h-3" />}
              {approvalStatus === 'pending' && <AlertCircle className="w-3 h-3" />}
              Current: {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Doctor Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Doctor ID</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.doctor_id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.phone_number || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.age || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.gender || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Professional Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#e8edfc] rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-[#204FCF]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Specialization</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.specialization || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#e8edfc] rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#204FCF]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Years of Experience</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.years_of_exp || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Booking Price</p>
                  <p className="text-sm font-medium text-gray-900">
                    {doctor.booking_price !== null ? `$${doctor.booking_price.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Number of Patients</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.numb_patients || 0}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Number of Sessions</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.numb_session || 0}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Average Rating</p>
                  <p className="text-sm font-medium text-gray-900">
                    {doctor.avg_rating !== null ? doctor.avg_rating.toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Number of Reviews</p>
                  <p className="text-sm font-medium text-gray-900">{doctor.number_review || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Bio</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {doctor.bio || 'No biography available'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Profile Image URL</p>
                    <p className="text-sm font-medium text-gray-900 break-all">
                      {doctor.profile_img_url || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">FCM Token</p>
                    <p className="text-sm font-medium text-gray-900 break-all">
                      {doctor.fcm_token || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {doctor.updated_at 
                        ? new Date(doctor.updated_at).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
            <p className="text-gray-600 mt-1">All appointments for this doctor</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
                <div className="w-10 h-10 bg-[#e8edfc] rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#204FCF]" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{confirmedCount}</p>
                </div>
                <div className="w-10 h-10 bg-[#e8edfc] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#204FCF]" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient, date, or time..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="overflow-x-auto">
            {appointmentsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading appointments...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No appointments found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {appointment.patient?.profile_img_url ? (
                            <img
                              src={appointment.patient.profile_img_url}
                              alt={appointment.patient.name || 'Patient'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient?.name || 'Unknown Patient'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.patient?.email || 'N/A'}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

