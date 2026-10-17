// client/src/pages/admin/AdminNav.jsx
// Navigation header for Admin portal

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminNav() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/admin' },
    { label: 'Members', path: '/admin/members' },
    { label: 'Commutes', path: '/admin/commutes' },
    { label: 'Reports', path: '/admin/reports' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="flex items-center gap-2.5">
              <span className="text-2xl">🚗</span>
              <span className="font-bold text-lg text-gray-900 tracking-tight">ShareWay Admin</span>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {user?.role === 'PLATFORM_ADMIN' ? 'Platform' : 'Community'}
              </span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/discover"
              className="text-xs font-medium text-gray-600 hover:text-indigo-600 transition flex items-center gap-1"
            >
              <span>User View</span>
              <span>→</span>
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
