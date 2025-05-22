// src/modules/admin/components/AdminHeader.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import HeroIcon from '../../../components/HeroIcon';
// import { useNotification } from '../../../context/NotificationContext'; // If you plan to fetch notifications

const AdminHeader = ({ setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  // const { notifications } = useNotification(); // Example: get unread notifications count
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // const unreadNotificationsCount = notifications?.filter(n => !n.isRead).length || 0; // Example

  const handleLogout = async () => {
    await logout();
    navigate('/auth/admin-login'); // Redirect to admin login after logout
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Mobile Sidebar Toggle & Page Title (Optional) */}
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden mr-3"
              aria-label="Hap menunë anësore"
            >
              <HeroIcon icon="Bars3Icon" className="h-6 w-6" />
            </button>
            {/* <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200 hidden md:block">Admin Panel</h1> */}
          </div>

          {/* Center: Search Bar (more prominent on desktop) */}
          <div className={`flex-1 mx-4 ${mobileSearchOpen ? 'block absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 p-2 shadow-lg z-20' : 'hidden md:block'}`}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HeroIcon icon="MagnifyingGlassIcon" className="h-5 w-5 text-gray-400" />
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                type="search"
                placeholder="Kërko..."
              />
               {mobileSearchOpen && (
                <button 
                    onClick={() => setMobileSearchOpen(false)} 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label="Mbyll kërkimin"
                >
                    <HeroIcon icon="XMarkIcon" className="h-5 w-5" />
                </button>
               )}
            </div>
          </div>


          {/* Right Side Icons & User Menu */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
                onClick={() => setMobileSearchOpen(true)} 
                className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Kërko"
            >
                <HeroIcon icon="MagnifyingGlassIcon" className="h-6 w-6" />
            </button>
            {/* Notifications (Example with count) */}
            <button className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Njoftimet">
              <HeroIcon icon="BellIcon" className="h-6 w-6" />
              {/* {unreadNotificationsCount > 0 && ( */}
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-0.5 translate-x-0.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              {/* )} */}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Menuja e përdoruesit"
              >
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-500 dark:bg-primary-600 text-white">
                  <span className="text-sm font-medium leading-none">
                    {user?.username ? user.username[0].toUpperCase() : 'A'}
                  </span>
                </span>
                <span className="hidden lg:inline text-gray-700 dark:text-gray-200 text-sm font-medium">
                  {user?.username || 'Admin User'}
                </span>
                <HeroIcon icon="ChevronDownIcon" className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} hidden lg:inline`} />
              </button>

              {/* Dropdown Panel */}
              {dropdownOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/admin/settings" // Assuming a general admin settings page for profile too
                    onClick={() => setDropdownOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    role="menuitem"
                  >
                    <HeroIcon icon="Cog6ToothIcon" className="h-4 w-4 mr-2 inline-block" />
                    Konfigurimet e Llogarisë
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    role="menuitem"
                  >
                     <HeroIcon icon="ArrowRightOnRectangleIcon" className="h-4 w-4 mr-2 inline-block" />
                    Dilni
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;