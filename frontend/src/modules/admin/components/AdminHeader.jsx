// src/modules/admin/components/AdminHeader.jsx
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
// import HeroIcon from "../../../components/HeroIcon"; // FSHIJE KËTË
import { Bars3Icon, MagnifyingGlassIcon, BellIcon, ChevronDownIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react'; // For dropdown animation

const AdminHeader = ({ setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-30 print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="text-gray-500 dark:text-gray-400 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200 md:hidden mr-2"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="relative text-gray-400 focus-within:text-gray-600 dark:focus-within:text-slate-200 hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-10 pr-3 py-2 border-transparent rounded-md text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-transparent focus:placeholder-gray-400 dark:focus:placeholder-slate-500 sm:text-sm bg-gray-100 dark:bg-slate-700"
                placeholder="Kërko..."
                type="search"
                name="search"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">Shiko njoftimet</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <div>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="max-w-xs bg-white dark:bg-slate-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  id="user-menu-button"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Hap menunë e përdoruesit</span>
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user?.profile_picture_url || `https://ui-avatars.com/api/?name=${user?.first_name || 'A'}&background=0D8ABC&color=fff&size=128`}
                    alt="User avatar"
                  />
                  <span className="hidden md:block ml-2 text-sm font-medium text-gray-700 dark:text-slate-200">{user?.first_name || user?.email}</span>
                  <ChevronDownIcon className="hidden md:block ml-1 h-4 w-4 text-gray-400 dark:text-slate-500" />
                </button>
              </div>
              <Transition
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
                  <NavLink
                    to="/admin/profile" // Or /admin/settings
                    onClick={() => setProfileDropdownOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-2 text-sm 
                      ${isActive ? 'bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-200'} 
                      hover:bg-gray-100 dark:hover:bg-slate-600`
                    }
                  >
                    <Cog6ToothIcon className="mr-2 h-5 w-5 text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-300" />
                    Profili & Konfigurime
                  </NavLink>
                  <button
                    onClick={() => { handleLogout(); setProfileDropdownOpen(false); }}
                    className="w-full text-left group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5 text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-300" />
                    Dilni
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;