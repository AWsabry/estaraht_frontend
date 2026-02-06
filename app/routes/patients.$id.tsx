import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { api, type Patient, type Bookings } from '../lib/api';
import { 
  Mail, Phone, User, Calendar, Clock, ArrowLeft, CheckCircle, XCircle, 
  AlertCircle, Search, Stethoscope
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (id) {
      fetchPatientDetails();
      fetchPatientAppointments();
    }
  }, [id]);

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      const response: any = await api.patients.getById(id!);
      setPatient(response.data);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const response: any = await api.bookings.getByPatient(id!);
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <div className="text-gray-500">Loading patient details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-gray-500 mb-4">Patient not found</div>
          <Link
            to="/patients"
            className="text-[#204FCF] hover:text-[#1a3fa6] flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
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
          to="/patients"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Patients
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {patient.profile_img_url ? (
                <img
                  src={patient.profile_img_url}
                  alt={patient.name || 'Patient'}
                  className="w-32 h-32 rounded-full object-cover border-4 border-green-100"
                />
              ) : (
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200">
                  <span className="text-green-600 font-bold text-4xl">
                    {patient.name?.[0]?.toUpperCase() || 'P'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {patient.name || 'N/A'}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                {patient.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-5 h-5" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-5 h-5" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.age && (
                  <div className="flex items-center gap-1">
                    <User className="w-5 h-5" />
                    <span>Age: {patient.age}</span>
                  </div>
                )}
                {patient.gender && (
                  <div className="flex items-center gap-1">
                    <User className="w-5 h-5" />
                    <span>{patient.gender}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Details Grid */}
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
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Patient ID</p>
                  <p className="text-sm font-medium text-gray-900">{patient.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-gray-900">{patient.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{patient.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
                  <p className="text-sm font-medium text-gray-900">{patient.age || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                  <p className="text-sm font-medium text-gray-900">{patient.gender || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                  <p className="text-sm font-medium text-gray-900">{patient.role || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Additional Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Login ID</p>
                  <p className="text-sm font-medium text-gray-900">{patient.login_id || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Registered Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.created_at 
                      ? new Date(patient.created_at).toLocaleString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
            <p className="text-gray-600 mt-1">All appointments for this patient</p>
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
                  placeholder="Search by doctor, date, or time..."
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
                      Doctor
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
                          {appointment.doctor?.profile_img_url ? (
                            <img
                              src={appointment.doctor.profile_img_url}
                              alt={appointment.doctor.full_name || 'Doctor'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Stethoscope className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.doctor?.full_name || 'Unknown Doctor'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.doctor?.specialization || 'N/A'}
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

