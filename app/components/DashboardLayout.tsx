import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Users,
  UserCog,
  Stethoscope,
  UserRound,
  CreditCard,
  Ticket,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Star,
  LogOut,
  Globe,
  ChevronDown,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import logoImage from '../assets/Images/logo.png';

type MenuItem = {
  nameKey: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  { nameKey: 'nav.dashboard', path: '/', icon: LayoutDashboard },
  { nameKey: 'nav.users', path: '/users', icon: Users },
  { nameKey: 'nav.doctors', path: '/doctors', icon: Stethoscope },
  { nameKey: 'nav.patients', path: '/patients', icon: UserRound },
  { nameKey: 'nav.bookings', path: '/bookings', icon: Calendar },
  { nameKey: 'nav.transactions', path: '/transactions', icon: CreditCard },
  { nameKey: 'nav.withdrawals', path: '/withdrawals', icon: Wallet },
  { nameKey: 'nav.coupons', path: '/coupons', icon: Ticket },
  { nameKey: 'nav.reviews', path: '/reviews', icon: Star },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t, isRTL } = useLanguage();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLanguageMenu && !target.closest('.language-selector')) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    }
    navigate('/login');
  };

  const sidebarOrder: CSSProperties = { 
    order: isRTL ? 2 : 1,
  };
  const mainOrder: CSSProperties = { 
    order: isRTL ? 2 : 1,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white ${isRTL ? 'shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]' : 'shadow-lg'} transition-all duration-300 ease-in-out`}
        style={sidebarOrder}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {isSidebarOpen ? (
              <img 
                src={logoImage} 
                alt="Estraht Admin" 
                className="h-20 object-contain"
              />
            ) : (
              <img 
                src={logoImage} 
                alt="Estraht Admin" 
                className="h-8 w-8 object-contain mx-auto"
              />
            )}

          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#204FCF] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="font-medium">{t(item.nameKey)}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            {/* Language Selector */}
            {isSidebarOpen && (
              <div className="relative mb-2 language-selector">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{language === 'en' ? 'English' : 'العربية'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                </button>
                {showLanguageMenu && (
                  <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 left-0 right-0">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${language === 'en' ? 'bg-[#e8edfc]' : ''}`}
                    >
                      <span>English</span>
                      {language === 'en' && <span className="text-[#204FCF]">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('ar');
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${language === 'ar' ? 'bg-[#e8edfc]' : ''}`}
                    >
                      <span>العربية</span>
                      {language === 'ar' && <span className="text-[#204FCF]">✓</span>}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <UserCog className="w-6 h-6 text-gray-600" />
              </div>
              {isSidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@estraht.com'}</p>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 overflow-auto ${isRTL ? 'font-arabic' : ''}`} 
        dir={isRTL ? 'rtl' : 'ltr'}
        style={mainOrder}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
