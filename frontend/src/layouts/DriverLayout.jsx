// src/layouts/DriverLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeroIcon from '../components/HeroIcon.jsx';
import { useTasks } from '../context/TaskContext.jsx'; // Për statusin online

const DriverLayout = () => {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDriverOnline } = useTasks(); // Merr statusin online nga TaskContext
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // ProtectedRoute në AppRoutes.jsx duhet të trajtojë këtë, por një kontroll shtesë nuk dëmton
  if (authLoading && !isAuthenticated) { // Tregohet vetëm nëse po ngarkohet dhe ende s'është autentikuar
    return (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
        </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'DRIVER' && user?.role !== 'DELIVERY_PERSONNEL' && user?.role !== 'ADMIN')) {
    // ADMIN mund të jetë për testim, por normalisht vetëm DRIVER/DELIVERY_PERSONNEL
    return <Navigate to="/auth/login" replace />; 
  }

  const navLinks = [
    { name: 'Paneli', href: '/driver/dashboard', icon: 'Squares2X2Icon' },
    // { name: 'Fitimet', href: '/driver/earnings', icon: 'CurrencyEuroIcon' },
    // { name: 'Profili', href: '/driver/profile', icon: 'UserCircleIcon' },
  ];

  const driverName = user?.driverProfile?.name || user?.username || 'Shofer';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <nav className="bg-secondary-600 dark:bg-gray-800 shadow-lg print:hidden sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/driver/dashboard" className="flex-shrink-0 flex items-center gap-2">
                <HeroIcon icon="TruckIcon" className="h-7 w-7 text-white" />
                <h1 className="text-xl font-bold text-white">Shoferi<span className="text-yellow-300">Dash</span></h1>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-1">
                  {navLinks.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors
                        ${ isActive
                            ? 'bg-secondary-700 dark:bg-gray-900 text-white'
                            : 'text-secondary-100 dark:text-gray-300 hover:bg-secondary-500 dark:hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      <HeroIcon icon={item.icon} className="h-4 w-4"/>
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-3">
                <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${isDriverOnline ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' 
                                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'}`}>
                    <span className={`h-2 w-2 rounded-full mr-1.5 ${isDriverOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {isDriverOnline ? 'Online' : 'Offline'}
                </div>
                <span className="text-white text-sm hidden lg:block">Mirësevjen, {driverName}!</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-secondary-100 dark:text-gray-300 hover:bg-secondary-500/80 dark:hover:bg-gray-700/80 hover:text-white"
                iconLeft={<HeroIcon icon="ArrowRightOnRectangleIcon" className="h-5 w-5" />}
              >
                <span className="hidden sm:inline">Dilni</span>
              </Button>
            </div>

            <div className="-mr-2 flex md:hidden"> {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                type="button"
                className="bg-secondary-600 dark:bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-secondary-200 dark:text-gray-400 hover:text-white hover:bg-secondary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu" aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Hap menunë</span>
                <HeroIcon icon={mobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-secondary-700 dark:border-gray-700" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((item) => (
                <NavLink key={item.name} to={item.href} onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2
                    ${isActive ? 'bg-secondary-700 dark:bg-gray-900 text-white' : 'text-secondary-100 dark:text-gray-300 hover:bg-secondary-500 dark:hover:bg-gray-700 hover:text-white'}`}
                > <HeroIcon icon={item.icon} className="h-5 w-5"/> {item.name} </NavLink>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-secondary-500 dark:border-gray-700">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                   <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-secondary-700 dark:bg-gray-700">
                    <span className="text-base font-medium leading-none text-white">{driverName ? driverName[0].toUpperCase() : 'D'}</span>
                  </span>
                </div>
                <div className="ml-3 min-w-0">
                  <div className="text-base font-medium leading-none text-white truncate">{driverName}</div>
                  <div className="text-sm font-medium leading-none text-secondary-200 dark:text-gray-400 truncate">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium
                    ${isDriverOnline ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
                    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${isDriverOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {isDriverOnline ? 'Online' : 'Offline'} - Ndrysho te paneli
                </div>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-secondary-100 dark:text-gray-300 hover:bg-secondary-500 dark:hover:bg-gray-700 hover:text-white"
                > Dilni </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full container mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet /> {/* Faqet specifike për shoferin do të renderizohen këtu */}
      </main>
      
      <footer className="bg-gray-200 dark:bg-gray-800/50 mt-auto print:hidden">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            © {new Date().getFullYear()} ShoferiDash. FoodDash Platform.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DriverLayout;