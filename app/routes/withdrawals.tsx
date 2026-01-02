import { useEffect, useState } from 'react';
import { api, type Doctor, type Withdrawal } from '../lib/api';
import { Search, DollarSign, CheckCircle, XCircle, Clock, Eye, X, Stethoscope, ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<Doctor | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [doctorEmailMap, setDoctorEmailMap] = useState<Map<string, string>>(new Map());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    fetchWithdrawals();
  }, [refreshTrigger]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response: any = await api.withdrawals.getAll();
      const withdrawalsData = response.data || [];
      setWithdrawals(withdrawalsData);

      // Get unique doctor IDs
      const doctorIds = [...new Set(withdrawalsData.map((w: Withdrawal) => w.doctor_id).filter(Boolean))];

      // Fetch doctors in parallel
      const doctorsRes = doctorIds.length > 0
        ? await api.doctors.getAll().catch(() => ({ data: [] } as { data: Doctor[] }))
        : { data: [] } as { data: Doctor[] };

      // Create email map
      const doctorMap = new Map<string, string>();
      ((doctorsRes as { data?: Doctor[] })?.data || []).forEach((doctor: Doctor) => {
        if (doctor.doctor_id && doctor.email) {
          doctorMap.set(doctor.doctor_id, doctor.email);
        }
      });

      setDoctorEmailMap(doctorMap);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const doctorEmail = doctorEmailMap.get(withdrawal.doctor_id || '') || '';
    
    const matchesSearch =
      withdrawal.doctor_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.id.toString().includes(searchTerm.toLowerCase());

    const matchesStatusFilter =
      filterStatus === 'all' || withdrawal.operation_status === filterStatus;

    return matchesSearch && matchesStatusFilter;
  });

  // Calculate totals
  const totalAmount = filteredWithdrawals.reduce((sum, w) => {
    const amount = parseFloat(w.total_amount || '0') || 0;
    return sum + amount;
  }, 0);

  const totalActualAmount = filteredWithdrawals.reduce((sum, w) => {
    const amount = parseFloat(w.total_actual_amount || '0') || 0;
    return sum + amount;
  }, 0);

  const successfulWithdrawals = filteredWithdrawals.filter(w => w.operation_status === 'success');
  const pendingWithdrawals = filteredWithdrawals.filter(w => w.operation_status === 'pending');
  const failedWithdrawals = filteredWithdrawals.filter(w => w.operation_status === 'failed');

  // Pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'waiting':
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'waiting':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
    setDetailsLoading(true);
    setDoctorDetails(null);

    try {
      if (withdrawal.doctor_id) {
        const doctorRes = await api.doctors.getById(withdrawal.doctor_id).catch(() => null);
        if (doctorRes && typeof doctorRes === 'object' && 'data' in doctorRes) {
          setDoctorDetails((doctorRes as { data: Doctor }).data);
        }
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this withdrawal?')) return;

    try {
      await api.withdrawals.delete(id.toString());
      // Trigger refresh by updating refreshTrigger
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      alert('Failed to delete withdrawal');
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      // Get the current withdrawal data
      const withdrawal = withdrawals.find(w => w.id === id);
      if (!withdrawal) return;

      // Update only the operation_status
      await api.withdrawals.update(id.toString(), {
        ...withdrawal,
        operation_status: newStatus
      });
      
      // Trigger refresh by updating refreshTrigger
      setRefreshTrigger(prev => prev + 1);
      
      // Also update local state immediately for better UX
      setWithdrawals(prevWithdrawals => 
        prevWithdrawals.map(w => 
          w.id === id ? { ...w, operation_status: newStatus } : w
        )
      );
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      alert('Failed to update withdrawal status');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Withdrawals</h1>
            <p className="text-gray-600 mt-1">Manage doctor withdrawal requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{totalAmount.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#204FCF]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Actual Amount</p>
                <p className="text-2xl font-bold text-gray-900">{totalActualAmount.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">{successfulWithdrawals.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingWithdrawals.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${
                  isRTL ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                placeholder="Search by doctor email or withdrawal ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${
                  isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                }`}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF]"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      ID
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Doctor Email
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Total Amount
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Actual Amount
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Income History
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Status
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Action Type
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Payment Date
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Created At
                    </th>
                    <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        No withdrawals found
                      </td>
                    </tr>
                  ) : (
                    paginatedWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-xs font-mono text-gray-900">
                            {withdrawal.id}
                          </div>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-xs text-gray-900 break-all">
                            {withdrawal.doctor_id ? (
                              doctorEmailMap.get(withdrawal.doctor_id) || (
                                <span className="text-gray-400 italic font-mono text-[10px]">
                                  {withdrawal.doctor_id}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-xs font-semibold text-gray-900">
                            {withdrawal.total_amount || '-'}
                          </div>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-xs font-semibold text-gray-900">
                            {withdrawal.total_actual_amount || '-'}
                          </div>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-xs text-gray-900">
                            {withdrawal.income_history !== null ? withdrawal.income_history : '-'}
                          </div>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <select
                            value={withdrawal.operation_status || ''}
                            onChange={(e) => handleStatusUpdate(withdrawal.id, e.target.value)}
                            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#204FCF] transition-colors ${getStatusColor(
                              withdrawal.operation_status
                            )} ${isRTL ? 'text-right' : ''}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="text-xs text-gray-900">
                            {withdrawal.action_type || '-'}
                          </div>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {withdrawal.payment_date ? new Date(withdrawal.payment_date).toLocaleString() : '-'}
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {new Date(withdrawal.created_at).toLocaleString()}
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(withdrawal)}
                              className="text-[#204FCF] hover:text-[#1a3fa6] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(withdrawal.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
          
          {/* Pagination */}
          {filteredWithdrawals.length > 0 && (
            <div className={`bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredWithdrawals.length)} of {filteredWithdrawals.length} results
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${isRTL ? 'text-right' : ''}`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium border-2 rounded-md flex items-center gap-1 transition-colors ${
                    currentPage === 1
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-[#204FCF] text-[#204FCF] bg-white hover:bg-[#204FCF] hover:text-white'
                  } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  Previous
                </button>
                
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 text-sm font-medium border-2 rounded-md min-w-[40px] transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#204FCF] text-white border-[#204FCF]'
                            : 'border-gray-300 text-gray-700 bg-white hover:border-[#204FCF] hover:text-[#204FCF] hover:bg-blue-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm font-medium border-2 rounded-md flex items-center gap-1 transition-colors ${
                    currentPage === totalPages
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-[#204FCF] text-[#204FCF] bg-white hover:bg-[#204FCF] hover:text-white'
                  } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  Next
                  <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Withdrawal Detail Modal */}
        {showDetailModal && selectedWithdrawal && (
          <div 
            className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className={`sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-bold text-gray-900">Withdrawal Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {detailsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : (
                  <>
                    {/* Withdrawal Information */}
                    <div>
                      <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : ''}`}>
                        Withdrawal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Withdrawal ID</p>
                          <p className="text-sm font-mono text-gray-900">{selectedWithdrawal.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Amount</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedWithdrawal.total_amount || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Actual Amount</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedWithdrawal.total_actual_amount || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Income History</p>
                          <p className="text-sm text-gray-900">{selectedWithdrawal.income_history !== null ? selectedWithdrawal.income_history : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Status</p>
                          <select
                            value={selectedWithdrawal.operation_status || ''}
                            onChange={(e) => {
                              handleStatusUpdate(selectedWithdrawal.id, e.target.value);
                              // Update local state to reflect change immediately
                              setSelectedWithdrawal({
                                ...selectedWithdrawal,
                                operation_status: e.target.value
                              });
                            }}
                            className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#204FCF] transition-colors ${getStatusColor(
                              selectedWithdrawal.operation_status
                            )} ${isRTL ? 'text-right' : ''}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Action Type</p>
                          <p className="text-sm text-gray-900">{selectedWithdrawal.action_type || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Payment Date</p>
                          <p className="text-sm text-gray-900">
                            {selectedWithdrawal.payment_date ? new Date(selectedWithdrawal.payment_date).toLocaleString() : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Created At</p>
                          <p className="text-sm text-gray-900">{new Date(selectedWithdrawal.created_at).toLocaleString()}</p>
                        </div>
                        {selectedWithdrawal.withrowl_history && (
                          <div className="md:col-span-2">
                            <p className="text-xs text-gray-600">Withdrawal History</p>
                            <p className="text-sm text-gray-900 break-all">{selectedWithdrawal.withrowl_history}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Doctor Information */}
                    {selectedWithdrawal.doctor_id && (
                      <div>
                        <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 ${isRTL ? 'text-right flex-row-reverse' : ''}`}>
                          <Stethoscope className="w-5 h-5 text-[#204FCF]" />
                          Doctor
                        </h3>
                        {doctorDetails ? (
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div>
                              <p className="text-xs text-gray-600">ID</p>
                              <p className="text-sm font-mono text-gray-900 break-all">{selectedWithdrawal.doctor_id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Name</p>
                              <p className="text-sm font-semibold text-gray-900">{doctorDetails.full_name || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Email</p>
                              <p className="text-sm text-gray-900">{doctorDetails.email || '-'}</p>
                            </div>
                            {doctorDetails.specialization && (
                              <div>
                                <p className="text-xs text-gray-600">Specialization</p>
                                <p className="text-sm text-gray-900">{doctorDetails.specialization}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500">ID: <span className="font-mono break-all">{selectedWithdrawal.doctor_id}</span></p>
                            <p className="text-sm text-gray-500 mt-2">Doctor details not found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

