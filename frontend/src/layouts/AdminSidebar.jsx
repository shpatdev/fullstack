import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    HomeIcon, UsersIcon, BuildingStorefrontIcon, Cog6ToothIcon, ChartBarIcon, 
    ShieldCheckIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, ChevronUpIcon, TagIcon, ListBulletIcon
} from '@heroicons/react/24/outline';
// import Button from '../components/Button'; // If needed for logout or other actions

const AdminSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    
    const navItems = [
        { name: 'Paneli Kryesor', href: '/admin/dashboard', IconComponent: HomeIcon },
        { name: 'Përdoruesit', href: '/admin/users', IconComponent: UsersIcon },
        { name: 'Restorantet', href: '/admin/restaurants', IconComponent: BuildingStorefrontIcon },
        { name: 'Llojet e Kuzhinave', href: '/admin/cuisine-types', IconComponent: TagIcon },
        { name: 'Porositë', href: '/admin/orders', IconComponent: ListBulletIcon },
        { name: 'Analitika', href: '/admin/analytics', IconComponent: ChartBarIcon },
        { name: 'Konfigurime', href: '/admin/settings', IconComponent: Cog6ToothIcon },
    ];

    const handleLinkClick = () => {
        if (window.innerWidth < 768) { // md breakpoint
          setIsSidebarOpen(false);
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                  className="fixed inset-0 z-30 bg-black/30 md:hidden" 
                  onClick={() => setIsSidebarOpen(false)}
                  aria-hidden="true"
                ></div>
            )}
            <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-800 text-slate-100 shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-20'}`}
            >
                <div className={`flex items-center justify-between p-4 border-b border-slate-700 ${isSidebarOpen ? '' : 'md:justify-center'}`}>
                    <Link to="/admin/dashboard" onClick={handleLinkClick} className={`flex items-center gap-2 ${isSidebarOpen ? '' : 'md:w-full md:justify-center'}`}>
                        <ShieldCheckIcon className={`h-8 w-8 text-primary-400 ${isSidebarOpen ? '' : 'md:h-7 md:w-7'}`} />
                        {isSidebarOpen && <span className="text-xl font-bold">Admin</span>}
                    </Link>
                    {/* Mobile close button can be added here if needed, or handled by AdminLayout */}
                </div>

                <nav className="flex-1 overflow-y-auto py-4 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={handleLinkClick}
                            className={({ isActive }) =>
                                `group flex items-center px-4 py-2.5 text-sm font-medium rounded-md mx-2 transition-colors
                                ${isActive
                                    ? 'bg-primary-500 text-white'
                                    : 'hover:bg-slate-700 hover:text-white'}
                                ${!isSidebarOpen ? 'md:justify-center md:px-0 md:py-3 md:mx-auto md:w-12 md:h-12' : ''}`
                            }
                            title={isSidebarOpen ? '' : item.name}
                        >
                            <item.IconComponent className={`h-5 w-5 flex-shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mr-0'}`} />
                            {isSidebarOpen && <span>{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-2 border-t border-slate-700">
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className={`w-full flex items-center p-2 rounded-md text-left text-sm font-medium hover:bg-slate-700 focus:outline-none
                                ${!isSidebarOpen ? 'md:justify-center md:py-3' : ''}`}
                            title={isSidebarOpen ? '' : (user?.first_name || user?.email)}
                        >
                             <img 
                                src={user?.profile_picture_url || `https://ui-avatars.com/api/?name=${user?.first_name || 'A'}&background=0D8ABC&color=fff&size=128`} 
                                alt="Admin" 
                                className={`h-8 w-8 rounded-full object-cover flex-shrink-0 ${isSidebarOpen ? 'mr-2.5' : 'md:mr-0'}`} 
                            />
                            {isSidebarOpen && (
                                <>
                                    <span className="truncate flex-1">{user?.first_name || user?.email}</span>
                                    {isProfileDropdownOpen ? <ChevronUpIcon className="w-4 h-4 ml-1 flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 ml-1 flex-shrink-0" />}
                                </>
                            )}
                        </button>
                        {isProfileDropdownOpen && isSidebarOpen && (
                            <div className="mt-1 py-1 w-full rounded-md bg-slate-700 shadow-xs ring-1 ring-black ring-opacity-5">
                                <NavLink
                                    to="/admin/profile" // Or /admin/settings if that's the profile page
                                    onClick={() => { setIsProfileDropdownOpen(false); handleLinkClick(); }}
                                    className={({isActive}) => `block px-3 py-2 text-sm hover:bg-slate-600 flex items-center ${isActive ? 'text-primary-300' : ''}`}
                                >
                                    <Cog6ToothIcon className="inline w-4 h-4 mr-2" /> Profili
                                </NavLink>
                                <button
                                    onClick={() => { handleLogout(); setIsProfileDropdownOpen(false); }}
                                    className="w-full text-left block px-3 py-2 text-sm hover:bg-slate-600 flex items-center"
                                >
                                    <ArrowRightOnRectangleIcon className="inline w-4 h-4 mr-2" /> Dilni
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
