// src/layouts/CustomerLayout.jsx
import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import HeroIcon from '../components/HeroIcon.jsx';
import { Transition } from '@headlessui/react'; // Ende e nevojshme për dropdown-in e profilit

const CustomerLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // NUK NEVOJITET MË
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const cartItemCount = getCartItemCount ? getCartItemCount() : 0;

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/auth/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Restorantet', href: '/customer/restaurants', icon: 'BuildingStorefrontIcon' },
    { name: 'Porositë e Mia', href: '/customer/my-orders', icon: 'ArchiveBoxIcon' },
  ];
  
  const userInitial = user?.username ? user.username[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : '?');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col">
      <nav className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-slate-800 dark:to-slate-900 shadow-lg sticky top-0 z-40 print:hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/customer/restaurants" className="flex-shrink-0 flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
                 <HeroIcon icon="SparklesIcon" className="h-7 w-7 text-yellow-300"/>
                 <h1 className="text-2xl font-bold">Food<span className="text-yellow-300">Dash</span></h1>
              </Link>
              <div className="ml-10 flex items-baseline space-x-1"> {/* Nuk ka më 'hidden md:block' */}
                {navLinks.map((item) => (
                  <NavLink key={item.name} to={item.href}
                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5
                      ${ isActive ? 'bg-white/20 dark:bg-slate-700 text-white' : 'text-primary-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/70 hover:text-white' }`
                    }
                  > <HeroIcon icon={item.icon} className="h-4 w-4 opacity-80"/> {item.name} </NavLink>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4"> {/* Nuk ka më 'hidden md:flex' */}
              <Link to="/customer/cart"
                className="relative p-2 rounded-full text-primary-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/70 hover:text-white focus:outline-none transition-colors"
                aria-label="Shporta e blerjes"
              >
                <HeroIcon icon="ShoppingCartIcon" className="h-6 w-6" aria-hidden="true" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated && user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button type="button" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="max-w-xs bg-transparent rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-700 dark:focus:ring-offset-slate-800 focus:ring-white p-1"
                    id="user-menu-button" aria-expanded={profileDropdownOpen} aria-haspopup="true"
                  >
                    <span className="sr-only">Hap menunë e përdoruesit</span>
                     <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/20 dark:bg-slate-700 text-white ring-1 ring-white/30">
                      <span className="text-sm font-medium leading-none">{userInitial}</span>
                    </span>
                  </button>
                  <Transition
                    show={profileDropdownOpen}
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white dark:bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-600">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user.username}>{user.username || 'Përdorues'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate" title={user.email}>{user.email}</p>
                      </div>
                      <NavLink to="/customer/profile" onClick={() => setProfileDropdownOpen(false)} role="menuitem"
                        className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-gray-100 dark:bg-slate-600' : ''} text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 w-full text-left flex items-center gap-2`}
                      > <HeroIcon icon="UserCircleIcon" className="h-4 w-4 text-gray-400 dark:text-slate-500"/> Profili Im </NavLink>
                      <button onClick={handleLogout} role="menuitem"
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-2"
                      > <HeroIcon icon="ArrowRightOnRectangleIcon" className="h-4 w-4"/> Dilni </button>
                    </div>
                  </Transition>
                </div>
              ) : (
                <Link to="/auth/login" className="px-3 py-1.5 rounded-md text-sm font-medium text-primary-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/70 hover:text-white transition-colors">
                  Kyçu
                </Link>
              )}
            </div>
            {/* HIQ BUTONIN E MENUSË MOBILE */}
            {/* <div className="-mr-2 flex md:hidden"> ... </div> */}
          </div>
        </div>
        {/* HIQ BLLOKUN E MENUSË MOBILE */}
        {/* {mobileMenuOpen && ( <div className="md:hidden" id="mobile-menu"> ... </div> )} */}
      </nav>

      <main className="flex-grow container mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="bg-slate-200 dark:bg-slate-800/70 mt-auto print:hidden">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} FoodDash. Të gjitha të drejtat e rezervuara.
          </p>
          <div className="mt-3 space-x-4">
            <Link to="/terms" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-slate-300">Kushtet</Link>
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-slate-300">Privatësia</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;