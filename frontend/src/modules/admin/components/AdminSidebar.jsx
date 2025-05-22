// src/modules/admin/components/AdminSidebar.jsx
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon'; 

const AdminSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const baseLinkClasses = "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 group";
  const activeLinkClasses = "bg-primary-600 text-white shadow-sm";
  const inactiveLinkClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white";

  const navigation = [
    { name: 'Pasqyra', href: '/admin/overview', icon: 'HomeIcon' },
    { name: 'Përdoruesit', href: '/admin/users', icon: 'UsersIcon' },
    { name: 'Restorantet', href: '/admin/restaurants', icon: 'BuildingStorefrontIcon' },
    { name: 'Porositë', href: '/admin/orders', icon: 'ShoppingCartIcon' },
    { name: 'Konfigurimet', href: '/admin/settings', icon: 'Cog6ToothIcon' },
    // { name: 'Raportet', href: '/admin/reports', icon: 'ChartBarIcon' }, // Placeholder for future
    // { name: 'Marketingu', href: '/admin/marketing', icon: 'MegaphoneIcon' }, // Placeholder for future
  ];

  const handleLinkClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 print:hidden
                   transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 
                   ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
        aria-label="Menuja kryesore e administratorit"
      >
        {/* Logo and Close Button for Mobile */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/admin/overview" className="flex items-center gap-2" onClick={handleLinkClick}>
            <HeroIcon icon="ShieldCheckIcon" className="h-7 w-7 text-primary-600 dark:text-primary-400"/>
            <span className="text-xl font-bold text-gray-800 dark:text-white">
                Admin<span className="text-primary-600 dark:text-primary-400">Panel</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Mbyll menunë anësore"
          >
            <HeroIcon icon="XMarkIcon" className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
              }
            >
              <HeroIcon icon={item.icon} className={`h-5 w-5 mr-3 
                ${inactiveLinkClasses.includes('group-hover') ? 'group-hover:text-primary-600 dark:group-hover:text-primary-400' : ''}`} 
              />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer Section (Optional) */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Food Delivery Pro
          </p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;