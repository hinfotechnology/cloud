import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAWSCredentials } from '../context/AWSCredentialsContext';
import { useSSOAuth } from '../context/SSOAuthContext';
import {
  Bars3Icon,
  XMarkIcon,
  ChartPieIcon,
  ServerIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartPieIcon },
  { name: 'Resources', href: '/resources', icon: ServerIcon },
  { name: 'Policies', href: '/policies', icon: ShieldCheckIcon },
  { name: 'Service Costs', href: '/service-costs', icon: CurrencyDollarIcon },
  { name: 'List Services', href: '/listservices', icon: ServerIcon },
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { credentials, clearAWSCredentials } = useAWSCredentials();
  const { isAuthenticated, user, logout: ssoLogout } = useSSOAuth();

  const handleLogout = () => {
    // Clear AWS credentials (if any)
    clearAWSCredentials();
    
    // Log out from SSO (if authenticated)
    if (isAuthenticated) {
      ssoLogout();
    }
    
    navigate('/');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold text-gray-800">Cloud Custodian UI</h1>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      location.pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-4 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">Cloud Custodian UI</h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        location.pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
              {/* User info and logout */}
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <div className="flex items-center">
                  <div className="flex-1">
                    {isAuthenticated && user ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-500">Role: {user.role}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">Region: {credentials?.region}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 flex items-center text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow md:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
