// src/layouts/CustomerLayout.jsx
import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { Transition } from '@headlessui/react';
import { 
    ShoppingCartIcon, BuildingStorefrontIcon, ArchiveBoxIcon, UserCircleIcon, 
    ArrowRightOnRectangleIcon, ChevronDownIcon, SparklesIcon 
} from '@heroicons/react/24/outline'; 
import Button from '../components/Button.jsx'; // Assuming Button is here
// import Logo from '../components/Logo.jsx'; // Komentuar, por përdoret një Link i thjeshtë për logon

const CustomerLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartItemCount } = useCart(); // !!! KJO DO TE DESHTONTE PA IMPORTIN E useCart !!! -> FIXED: Used getCartItemCount
  const cartItemCount = getCartItemCount(); // Get the actual count
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login'); // Ndryshuar nga /login te /auth/login per konsistence me AppRoutes
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Restorantet', href: '/customer/restaurants', IconComponent: BuildingStorefrontIcon },
    { name: 'Porositë e Mia', href: '/customer/my-orders', IconComponent: ArchiveBoxIcon },
  ];

  const profileLinks = [
    { name: 'Profili Im', href: '/customer/profile', IconComponent: UserCircleIcon },
    // Add more profile related links here if needed
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col">
      <header className="bg-primary-600 dark:bg-slate-800 shadow-lg sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/customer/restaurants" className="flex-shrink-0 flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
                <SparklesIcon className="h-7 w-7 text-yellow-300"/>
                <h1 className="text-2xl font-bold">Food<span className="text-yellow-300">Dash</span></h1>
              </Link>
              {/* Navigation Links */}
              <nav className="hidden md:ml-10 md:flex md:items-baseline md:space-x-1">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5
                      ${isActive
                        ? 'bg-white/20 dark:bg-slate-700 text-white'
                        : 'text-primary-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/70 hover:text-white'}`
                    }
                  >
                    {item.IconComponent && <item.IconComponent className="h-4 w-4 opacity-80"/>}
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right side of the header: Cart and Profile */}
            <div className="flex items-center space-x-3">
              {/* !!! KETU DUHET TE SHTOHET IKONA DHE LINKU I SHPORTES !!! */}
              {/* Shembull per ikonen e shportes: */}
                {isAuthenticated && (
                  <Link to="/customer/cart" className="relative p-2 text-primary-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/70 rounded-full">
                    <ShoppingCartIcon className="h-6 w-6" />
                    {cartItemCount > 0 && (
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-primary-600 dark:ring-slate-800 bg-red-500 text-white text-xs flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}
              

              {isAuthenticated && user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} // KJO DUHET TE FUNKSIONOJE
                    className="flex items-center text-sm rounded-full text-primary-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/70 p-2 focus:outline-none"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="ml-2 hidden lg:inline">{user.first_name || user.email}</span> {/* Shfaq emrin ose email-in */}
                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ml-1 ${profileDropdownOpen ? 'rotate-180' : ''} hidden lg:inline`} />
                  </button>
                  <Transition // Headless UI Transition per dropdown
                    as={Fragment}
                    show={profileDropdownOpen}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {profileLinks.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setProfileDropdownOpen(false)} // Mbyll dropdown pas klikimit
                          className={({ isActive }) =>
                            `flex items-center px-4 py-2 text-sm 
                            ${isActive ? 'bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-200'} 
                            hover:bg-gray-100 dark:hover:bg-slate-600`
                          }
                        >
                          {item.IconComponent && <item.IconComponent className="h-4 w-4 mr-2 text-gray-400 dark:text-slate-500"/>}
                          {item.name}
                        </NavLink>
                      ))}
                      <button
                        onClick={() => { handleLogout(); setProfileDropdownOpen(false); }} // Mbyll dropdown
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-slate-500"/>
                        Dilni
                      </button>
                    </div>
                  </Transition>
                </div>
              ) : (
                <Button onClick={() => navigate('/auth/login')} variant="light" size="sm">Kyçu</Button> // Ndryshuar nga /login te /auth/login
              )}
            </div>
          </div>
        </div>
        {/* Mobile Menu (optional, if you want to add it later) */}
      </header>
      <main className="flex-grow container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <Outlet />
      </main>
      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-6 text-center print:hidden">
        <p className="text-sm text-gray-500 dark:text-slate-400">&copy; {new Date().getFullYear()} FoodDash. Të gjitha të drejtat e rezervuara.</p>
      </footer>
    </div>
  );
};
export default CustomerLayout;