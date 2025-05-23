// src/layouts/DriverLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import { TruckIcon, Squares2X2Icon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const DriverLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Paneli', href: '/driver/dashboard', IconComponent: Squares2X2Icon },
    // Add more driver-specific links here
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <header className="bg-blue-600 dark:bg-blue-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/driver/dashboard" className="flex-shrink-0 flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
                <TruckIcon className="h-7 w-7 text-white" />
                <h1 className="text-xl font-semibold">Driver Panel</h1>
              </Link>
              <nav className="hidden md:ml-10 md:flex md:items-baseline md:space-x-1">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5
                      ${isActive
                        ? 'bg-blue-700 dark:bg-blue-900 text-white'
                        : 'text-blue-100 dark:text-blue-200 hover:bg-blue-500 dark:hover:bg-blue-700 hover:text-white'}`
                    }
                  >
                    {item.IconComponent && <item.IconComponent className="h-4 w-4 opacity-80"/>}
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-blue-100 dark:text-blue-200">Mirësevjen, {user?.first_name || user?.email}</span>
              <Button onClick={handleLogout} variant="light" size="sm" iconLeft={ArrowRightOnRectangleIcon}>
                Dilni
              </Button>
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">Hap menunë</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2
                    ${isActive
                      ? 'bg-blue-700 dark:bg-blue-900 text-white'
                      : 'text-blue-100 dark:text-blue-200 hover:bg-blue-500 dark:hover:bg-blue-700 hover:text-white'}`
                  }
                >
                  {item.IconComponent && <item.IconComponent className="h-5 w-5"/>}
                  {item.name}
                </NavLink>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-blue-500 dark:border-blue-700">
              <div className="flex items-center px-5">
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user?.first_name || user?.email}</div>
                  <div className="text-sm font-medium text-blue-200">{user?.role}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  variant="ghost"
                  className="w-full justify-start text-blue-100 dark:text-blue-200 hover:bg-blue-500 dark:hover:bg-blue-700 hover:text-white"
                  iconLeft={ArrowRightOnRectangleIcon}
                >
                  Dilni
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
};
export default DriverLayout;