import { useEffect, useState } from 'react';
import type { Route } from "./+types/home";
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import { Users, Stethoscope, UserRound, Ticket, FileText, ClipboardList } from 'lucide-react';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Estraht Dashboard - Admin Panel" },
    { name: "description", content: "Manage doctors, patients, and medical services" },
  ];
}

export default function Home() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    activeCoupons: 0,
    totalPlans: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [usersRes, doctorsRes, patientsRes, couponsRes, plansRes, subsRes] = await Promise.all([
        api.users.getStats(),
        api.doctors.getStats(),
        api.patients.getStats(),
        api.coupons.getStats(),
        api.paymentPlans.getStats(),
        api.patientPlanSubscriptions.getStats(),
      ]);

      setStats({
        totalUsers: (usersRes as any).data?.totalUsers || 0,
        totalDoctors: (doctorsRes as any).data?.totalDoctors || 0,
        totalPatients: (patientsRes as any).data?.totalPatients || 0,
        activeCoupons: (couponsRes as any).data?.activeCoupons || 0,
        totalPlans: (plansRes as any).data?.totalPlans || 0,
        activeSubscriptions: (subsRes as any).data?.activeSubscriptions || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('dashboard.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-[#e8edfc] text-[#204FCF]',
      link: '/users',
    },
    {
      title: t('dashboard.totalDoctors'),
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: 'bg-green-100 text-green-600',
      link: '/doctors',
    },
    {
      title: t('dashboard.totalPatients'),
      value: stats.totalPatients,
      icon: UserRound,
      color: 'bg-purple-100 text-purple-600',
      link: '/patients',
    },
    {
      title: t('nav.paymentPlans'),
      value: stats.totalPlans,
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
      link: '/payment-plans',
    },
    {
      title: t('dashboard.activeCoupons'),
      value: stats.activeCoupons,
      icon: Ticket,
      color: 'bg-pink-100 text-pink-600',
      link: '/coupons',
    },
    {
      title: t('nav.patientPlanSubscriptions'),
      value: stats.activeSubscriptions,
      icon: ClipboardList,
      color: 'bg-yellow-100 text-yellow-600',
      link: '/patient-plan-subscriptions',
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.welcome')}</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.link}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${card.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/users"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#e8edfc] rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-[#204FCF]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('dashboard.manageUsers')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.manageUsers')}</p>
              </div>
            </Link>
            <Link
              to="/doctors"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('dashboard.manageDoctors')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.manageDoctors')}</p>
              </div>
            </Link>
            <Link
              to="/patients"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <UserRound className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('dashboard.managePatients')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.managePatients')}</p>
              </div>
            </Link>
            <Link
              to="/payment-plans"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('nav.paymentPlans')}</p>
                <p className="text-sm text-gray-500">{t('nav.paymentPlans')}</p>
              </div>
            </Link>
            <Link
              to="/patient-plan-subscriptions"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('nav.patientPlanSubscriptions')}</p>
                <p className="text-sm text-gray-500">{t('nav.patientPlanSubscriptions')}</p>
              </div>
            </Link>
            <Link
              to="/coupons"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <Ticket className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('dashboard.manageCoupons')}</p>
                <p className="text-sm text-gray-500">{t('dashboard.manageCoupons')}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
