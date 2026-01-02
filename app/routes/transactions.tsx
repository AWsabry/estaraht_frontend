import { useEffect, useState } from 'react';
import { api, type Doctor, type Patient } from '../lib/api';
import { Search, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle, Clock, Eye, X, User, Stethoscope, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';

type CombinedTransaction = {
  id: string;
  type: 'transaction' | 'payment';
  doctor_id: string;
  patient_id: string;
  amount: number;
  status: string;
  created_at: string;
  booking_id: string | null;
  operation_id?: string | null;
  action_type?: string;
  payment_gateway?: string | null;
  payment_currency?: string | null;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<CombinedTransaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<Doctor | null>(null);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [doctorEmailMap, setDoctorEmailMap] = useState<Map<string, string>>(new Map());
  const [patientEmailMap, setPatientEmailMap] = useState<Map<string, string>>(new Map());
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response: any = await api.transactions.getAll();
      const transactionsData = response.data || [];
      setTransactions(transactionsData);

      // Get unique doctor and patient IDs
      const doctorIds = [...new Set(transactionsData.map((t: CombinedTransaction) => t.doctor_id).filter(Boolean))];
      const patientIds = [...new Set(transactionsData.map((t: CombinedTransaction) => t.patient_id).filter(Boolean))];

      // Fetch doctors and patients in parallel
      const [doctorsRes, patientsRes] = await Promise.all([
        doctorIds.length > 0
          ? api.doctors.getAll().catch(() => ({ data: [] } as { data: Doctor[] }))
          : Promise.resolve({ data: [] } as { data: Doctor[] }),
        patientIds.length > 0
          ? api.patients.getAll().catch(() => ({ data: [] } as { data: Patient[] }))
          : Promise.resolve({ data: [] } as { data: Patient[] })
      ]);

      // Create email maps
      const doctorMap = new Map<string, string>();
      ((doctorsRes as { data?: Doctor[] })?.data || []).forEach((doctor: Doctor) => {
        if (doctor.doctor_id && doctor.email) {
          doctorMap.set(doctor.doctor_id, doctor.email);
        }
      });

      const patientMap = new Map<string, string>();
      ((patientsRes as { data?: Patient[] })?.data || []).forEach((patient: Patient) => {
        if (patient.id && patient.email) {
          patientMap.set(patient.id, patient.email);
        }
      });

      setDoctorEmailMap(doctorMap);
      setPatientEmailMap(patientMap);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const doctorEmail = doctorEmailMap.get(txn.doctor_id) || '';
    const patientEmail = patientEmailMap.get(txn.patient_id) || '';
    
    const matchesSearch =
      txn.doctor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.booking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.operation_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatusFilter =
      filterStatus === 'all' || txn.status === filterStatus;

    const matchesCurrencyFilter =
      filterCurrency === 'all' || 
      (filterCurrency === 'USD' && txn.payment_currency?.toUpperCase() === 'USD') ||
      (filterCurrency === 'MRU' && txn.payment_currency?.toUpperCase() === 'MRU');

    return matchesSearch && matchesStatusFilter && matchesCurrencyFilter;
  });

  // Calculate totals by currency
  const totalAmountUSD = filteredTransactions
    .filter(t => t.payment_currency?.toUpperCase() === 'USD')
    .reduce((sum, txn) => sum + txn.amount, 0);
  
  const totalAmountMRU = filteredTransactions
    .filter(t => t.payment_currency?.toUpperCase() === 'MRU')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalAmount = filterCurrency === 'USD' 
    ? totalAmountUSD 
    : filterCurrency === 'MRU' 
    ? totalAmountMRU 
    : totalAmountUSD + totalAmountMRU; // This won't be used when "all" is selected

  const successfulTransactions = filteredTransactions.filter(t => t.status === 'success');
  const pendingTransactions = filteredTransactions.filter(t => t.status === 'waiting');
  const failedTransactions = filteredTransactions.filter(t => t.status === 'failed');

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCurrency, searchTerm]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'waiting':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = async (transaction: CombinedTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
    setDetailsLoading(true);
    setDoctorDetails(null);
    setPatientDetails(null);

    try {
      const [doctorRes, patientRes] = await Promise.all([
        api.doctors.getById(transaction.doctor_id).catch(() => null),
        api.patients.getById(transaction.patient_id).catch(() => null),
      ]);

      if (doctorRes && typeof doctorRes === 'object' && 'data' in doctorRes) {
        setDoctorDetails((doctorRes as { data: Doctor }).data);
      }
      if (patientRes && typeof patientRes === 'object' && 'data' in patientRes) {
        setPatientDetails((patientRes as { data: Patient }).data);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('transactions.title')}</h1>
          <p className="text-gray-600 mt-1">{t('transactions.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('transactions.totalAmount') || 'Total Amount'}</p>
              {filterCurrency === 'all' ? (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-gray-900">USD: ${totalAmountUSD.toFixed(2)}</p>
                  <p className="text-xl font-bold text-gray-900">MRU: {totalAmountMRU.toFixed(2)} MRU</p>
                </div>
              ) : filterCurrency === 'USD' ? (
                <p className="text-2xl font-bold text-gray-900">${totalAmountUSD.toFixed(2)}</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{totalAmountMRU.toFixed(2)} MRU</p>
              )}
            </div>
            <div className="w-12 h-12 bg-[#e8edfc] rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#204FCF]" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('transactions.successful') || 'Successful'}</p>
              <p className="text-2xl font-bold text-gray-900">{successfulTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('transactions.pending') || 'Pending'}</p>
              <p className="text-2xl font-bold text-gray-900">{pendingTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('transactions.failed') || 'Failed'}</p>
              <p className="text-2xl font-bold text-gray-900">{failedTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
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
              placeholder={t('transactions.searchPlaceholder') || 'Search by doctor email, patient email, or booking ID...'}
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
            <option value="all">{t('transactions.filter.all') || 'All Status'}</option>
            <option value="success">{t('transactions.filter.success') || 'Success'}</option>
            <option value="waiting">{t('transactions.filter.waiting') || 'Pending'}</option>
            <option value="failed">{t('transactions.filter.failed') || 'Failed'}</option>
          </select>
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204FCF] ${isRTL ? 'text-right' : ''}`}
          >
            <option value="all">{t('transactions.filter.currencyAll') || 'All Currencies'}</option>
            <option value="USD">{t('transactions.filter.currencyUSD') || 'USD'}</option>
            <option value="MRU">{t('transactions.filter.currencyMRU') || 'MRU'}</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('transactions.table.id') || 'Transaction ID'}
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {/* {t('transactions.table.doctorEmail') || 'Doctor Email'} */}
                    Doctor Email
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {/* {t('transactions.table.patientEmail') || 'Patient Email'} */}
                    Patient Email
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('transactions.table.amount') || 'Amount'}
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('transactions.table.status') || 'Status'}
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('transactions.table.date') || 'Date'}
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('transactions.table.paymentGateway') || 'Payment Gateway'}
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('transactions.table.paymentCurrency') || 'Currency'}
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('transactions.table.operationId') || 'Operation ID'}
                  </th>
                  <th className={`px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('common.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      {t('transactions.empty') || 'No transactions found'}
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs font-mono text-gray-900 break-all">
                          {txn.id}
                        </div>
                        {txn.booking_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            Booking: <span className="font-mono break-all">{txn.booking_id}</span>
                          </div>
                        )}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs text-gray-900 break-all">
                          {doctorEmailMap.get(txn.doctor_id) || (
                            <span className="text-gray-400 italic font-mono text-[10px]">
                              {txn.doctor_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs text-gray-900 break-all">
                          {patientEmailMap.get(txn.patient_id) || (
                            <span className="text-gray-400 italic font-mono text-[10px]">
                              {txn.patient_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs font-semibold text-gray-900">
                          {txn.payment_currency?.toUpperCase() === 'USD' 
                            ? `$${txn.amount.toFixed(2)}` 
                            : txn.payment_currency?.toUpperCase() === 'MRU'
                            ? `${txn.amount.toFixed(2)} MRU`
                            : `${txn.amount.toFixed(2)}`}
                        </div>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <span
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full w-fit ${getStatusColor(
                            txn.status
                          )} ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          {getStatusIcon(txn.status)}
                          {txn.status}
                        </span>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {new Date(txn.created_at).toLocaleString()}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs text-gray-900">
                          {txn.payment_gateway || '-'}
                        </div>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs text-gray-900">
                          {txn.payment_currency || '-'}
                        </div>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs font-mono text-gray-900 break-all">
                          {txn.operation_id || '-'}
                        </div>
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <button
                          onClick={() => handleViewDetails(txn)}
                          className="text-[#204FCF] hover:text-[#1a3fa6] transition-colors"
                          title={t('transactions.viewDetails') || 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className={`bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm text-gray-700">
                {t('common.showing') || 'Showing'} {startIndex + 1} {t('common.to') || 'to'} {Math.min(endIndex, filteredTransactions.length)} {t('common.of') || 'of'} {filteredTransactions.length} {t('common.results') || 'results'}
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
                {t('common.previous') || 'Previous'}
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
                {t('common.next') || 'Next'}
                <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
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
              <h2 className="text-xl font-bold text-gray-900">{t('transactions.detailTitle') || 'Transaction Details'}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {detailsLoading ? (
                <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
              ) : (
                <>
                  {/* Transaction Information */}
                  <div>
                    <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : ''}`}>
                      {t('transactions.detail.transactionInfo') || 'Transaction Information'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600">{t('transactions.table.id') || 'Transaction ID'}</p>
                        <p className="text-sm font-mono text-gray-900 break-all">{selectedTransaction.id}</p>
                      </div>
                      {selectedTransaction.operation_id && (
                        <div>
                          <p className="text-xs text-gray-600">{t('transactions.table.operationId') || 'Operation ID'}</p>
                          <p className="text-sm font-mono text-gray-900 break-all">{selectedTransaction.operation_id}</p>
                        </div>
                      )}
                      {selectedTransaction.booking_id && (
                        <div>
                          <p className="text-xs text-gray-600">{t('bookings.title') || 'Booking ID'}</p>
                          <p className="text-sm font-mono text-gray-900 break-all">{selectedTransaction.booking_id}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600">{t('transactions.table.amount') || 'Amount'}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedTransaction.payment_currency?.toUpperCase() === 'USD' 
                            ? `$${selectedTransaction.amount.toFixed(2)}` 
                            : selectedTransaction.payment_currency?.toUpperCase() === 'MRU'
                            ? `${selectedTransaction.amount.toFixed(2)} MRU`
                            : `${selectedTransaction.amount.toFixed(2)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('transactions.table.status') || 'Status'}</p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            selectedTransaction.status
                          )} ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          {getStatusIcon(selectedTransaction.status)}
                          {selectedTransaction.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('transactions.table.paymentGateway') || 'Payment Gateway'}</p>
                        <p className="text-sm text-gray-900">{selectedTransaction.payment_gateway || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('transactions.table.paymentCurrency') || 'Currency'}</p>
                        <p className="text-sm text-gray-900">{selectedTransaction.payment_currency || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('transactions.table.date') || 'Date'}</p>
                        <p className="text-sm text-gray-900">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Information */}
                  <div>
                    <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 ${isRTL ? 'text-right flex-row-reverse' : ''}`}>
                      <Stethoscope className="w-5 h-5 text-[#204FCF]" />
                      {t('transactions.detail.doctor') || 'Doctor'}
                    </h3>
                    {doctorDetails ? (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">{t('transactions.detail.id') || 'ID'}</p>
                          <p className="text-sm font-mono text-gray-900 break-all">{selectedTransaction.doctor_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">{t('transactions.detail.name') || 'Name'}</p>
                          <p className="text-sm font-semibold text-gray-900">{doctorDetails.full_name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">{t('transactions.detail.email') || 'Email'}</p>
                          <p className="text-sm text-gray-900">{doctorDetails.email || '-'}</p>
                        </div>
                        {doctorDetails.specialization && (
                          <div>
                            <p className="text-xs text-gray-600">{t('doctors.specialization') || 'Specialization'}</p>
                            <p className="text-sm text-gray-900">{doctorDetails.specialization}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">{t('transactions.detail.id') || 'ID'}: <span className="font-mono break-all">{selectedTransaction.doctor_id}</span></p>
                        <p className="text-sm text-gray-500 mt-2">{t('doctors.noDoctors') || 'Doctor details not found'}</p>
                      </div>
                    )}
                  </div>

                  {/* Patient Information */}
                  <div>
                    <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 ${isRTL ? 'text-right flex-row-reverse' : ''}`}>
                      <User className="w-5 h-5 text-[#204FCF]" />
                      {t('transactions.detail.patient') || 'Patient'}
                    </h3>
                    {patientDetails ? (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-gray-600">{t('transactions.detail.id') || 'ID'}</p>
                          <p className="text-sm font-mono text-gray-900 break-all">{selectedTransaction.patient_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">{t('transactions.detail.name') || 'Name'}</p>
                          <p className="text-sm font-semibold text-gray-900">{patientDetails.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">{t('transactions.detail.email') || 'Email'}</p>
                          <p className="text-sm text-gray-900">{patientDetails.email || '-'}</p>
                        </div>
                        {patientDetails.phone && (
                          <div>
                            <p className="text-xs text-gray-600">{t('patients.phone') || 'Phone'}</p>
                            <p className="text-sm text-gray-900">{patientDetails.phone}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">{t('transactions.detail.id') || 'ID'}: <span className="font-mono break-all">{selectedTransaction.patient_id}</span></p>
                        <p className="text-sm text-gray-500 mt-2">{t('patients.noPatients') || 'Patient details not found'}</p>
                      </div>
                    )}
                  </div>
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
