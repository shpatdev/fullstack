// src/modules/admin/components/AdminSidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for navigation
import HeroIcon from '../../../components/HeroIcon.jsx'; // Assuming global HeroIcon

const adminNavLinks = [ 
    { name: 'Overview', view: 'overview', icon: 'home', path: '/admin/dashboard' }, // Added path
    { name: 'User Management', view: 'users', icon: 'users', path: '/admin/users' },
    { name: 'Restaurant Management', view: 'restaurants', icon: 'library', path: '/admin/restaurants' },
    { name: 'All Orders', view: 'orders', icon: 'document-report', path: '/admin/orders' }, // TODO: Create this page
    { name: 'Platform Settings', view: 'settings', icon: 'cog', path: '/admin/settings' }, // TODO: Create this page
];

const AdminSidebar = ({ currentView, handleLogout }) => { // setCurrentView removed, handled by router
    return (
        <aside className="w-64 bg-white shadow-md p-0 overflow-hidden self-start sticky top-16 h-[calc(100vh-4rem)] flex flex-col">
            <nav className="p-4 flex-grow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 px-2">Admin Panel</h3>
                <ul>
                    {adminNavLinks.map((link) => (
                        <li key={link.name} className="mb-1">
                            <Link
                                to={link.path}
                                className={`flex items-center w-full px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out text-left
                                    ${currentView === link.view // currentView prop needs to be correctly passed from AdminLayout based on router
                                        ? 'bg-blue-600 text-white font-semibold'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                    }`}
                            >
                                <HeroIcon name={link.icon} className="w-5 h-5 mr-3 flex-shrink-0" />
                                {link.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 mt-auto border-t border-gray-200">
                 <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2.5 text-sm rounded-md text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors duration-150 ease-in-out"
                >
                    <HeroIcon name="logout" className="w-5 h-5 mr-3 flex-shrink-0" />
                    Logout
                </button>
            </div>
        </aside>
    );
};
export default AdminSidebar;