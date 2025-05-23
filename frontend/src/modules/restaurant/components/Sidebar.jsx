// frontend/src/modules/restaurant/components/Sidebar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';
import { 
    HomeIcon, ShoppingCartIcon, QueueListIcon, Cog6ToothIcon, StarIcon, ChartBarIcon, 
    ShieldCheckIcon, XMarkIcon, UserCircleIcon, ChevronUpIcon, ChevronDownIcon, ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen: setIsMobileSidebarOpen }) => { // Renamed prop for clarity
  const { user, token, currentRestaurant, selectRestaurant, logout: authLogout } = useAuth();
  const { showSuccess } = useNotification(); // Renamed from showNotification to showSuccess for specific use
  
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const restaurantIdFromContext = currentRestaurant?.id; // Use the one from context primarily

  const getActiveSection = (pathname) => {
    if (pathname.includes('/restaurant/orders')) return 'orders';
    if (pathname.includes('/restaurant/menu')) return 'menu';
    if (pathname.includes('/restaurant/settings')) return 'settings';
    if (pathname.includes('/restaurant/reviews')) return 'reviews';
    if (pathname.includes('/restaurant/analytics')) return 'analytics';
    // Check for overview/dashboard, ensure it handles trailing slashes
    if (pathname.match(/^\/restaurant(\/dashboard|\/)?$/)) return 'overview'; 
    return 'overview'; // Default
  };
  const activeSection = getActiveSection(location.pathname);

  const navItems = [
    { id: 'overview', label: 'Pasqyra', IconComponent: HomeIcon, path: 'overview' }, // Relative paths
    { id: 'orders', label: 'Porositë', IconComponent: ShoppingCartIcon, count: pendingOrdersCount, path: 'orders' },
    { id: 'menu', label: 'Menuja', IconComponent: QueueListIcon, path: 'menu' },
    { id: 'settings', label: 'Konfigurimet', IconComponent: Cog6ToothIcon, path: 'settings' },
    { id: 'reviews', label: 'Vlerësimet', IconComponent: StarIcon, path: 'reviews' },
    { id: 'analytics', label: 'Analitika', IconComponent: ChartBarIcon, path: 'analytics' },
  ];
  
  const fetchPendingOrders = useCallback(async () => {
      if (restaurantIdFromContext && token) {
        try {
          const orders = await restaurantApi.fetchRestaurantOrders(restaurantIdFromContext, token);
          const pending = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status?.toUpperCase())).length;
          setPendingOrdersCount(pending);
        } catch (error) { 
          console.error("Sidebar: Failed to fetch pending orders count:", error); 
          setPendingOrdersCount(0); 
        }
      } else {
        setPendingOrdersCount(0);
      }
    }, [restaurantIdFromContext, token]);


  useEffect(() => {
    fetchPendingOrders(); // Fetch once on mount or when restaurantId changes
    if (activeSection === 'orders' || activeSection === 'overview') {
        const intervalId = setInterval(fetchPendingOrders, 30000); // Poll every 30 seconds
        return () => clearInterval(intervalId);
    }
  }, [fetchPendingOrders, activeSection]);

  const handleLogout = async () => {
    await authLogout();
    showSuccess('Largimi u krye me sukses.'); // Using showSuccess
    navigate('/auth/login'); // Navigate to general login
  };

  const handleLinkClick = () => {
    if (isSidebarOpen && window.innerWidth < 768) { // md breakpoint for Tailwind is 768px
      setIsMobileSidebarOpen(false);
    }
  };
  
  // Auth check is primarily handled by ProtectedRoute in RestaurantOwnerLayout
  if (!user || (user.role !== "RESTAURANT_OWNER" && user.role !== "ADMIN")) {
    return null; // Layout's ProtectedRoute should handle redirection
  }

  return (
    <>
      {/* Overlay for mobile, ensure this is the same prop as in RestaurantOwnerLayout */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 print:hidden
                   transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 
                   ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
        aria-label="Menuja e restorantit"
      >
        <Link 
            to="overview" // Relative path
            onClick={handleLinkClick}
            className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center space-y-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-500 dark:bg-primary-600 text-white text-xl font-bold ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-primary-300 dark:ring-primary-500">
              {currentRestaurant?.name ? currentRestaurant.name[0].toUpperCase() : 'R'}
            </span>
            <span className="text-md font-semibold text-gray-800 dark:text-white text-center truncate w-full max-w-[180px]" title={currentRestaurant?.name}>
              {currentRestaurant?.name || 'Restoranti Im'}
            </span>
            <button
                onClick={(e) => { e.stopPropagation(); setIsMobileSidebarOpen(false); }} // Prevent link navigation if clicking X
                className="absolute top-4 right-4 md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Mbyll menunë anësore"
            >
                <XMarkIcon className="h-6 w-6" />
            </button>
        </Link>
      
        {user.ownsRestaurants && user.ownsRestaurants.length > 1 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <label htmlFor="restaurantSelectSidebar" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Menaxho Restorantin:</label>
            <select 
                id="restaurantSelectSidebar" 
                value={currentRestaurant?.id || ''} 
                onChange={(e) => { 
                const selectedId = parseInt(e.target.value); 
                const restaurantToSelect = user.ownsRestaurants.find(r => r.id === selectedId); 
                if (restaurantToSelect) selectRestaurant(restaurantToSelect); // selectRestaurant from AuthContext
                }} 
                className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-primary-500 focus:ring focus:ring-primary-200 dark:focus:ring-primary-500/50 focus:ring-opacity-50 shadow-sm py-1.5"
            >
                {user.ownsRestaurants.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
            </div>
        )}

        <nav className="flex-grow p-3 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
            <Link // Changed NavLink to Link for simpler active state management with activeSection
                key={item.id} 
                to={item.path} // Already relative from parent route
                onClick={handleLinkClick}
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group
                ${activeSection === item.id 
                    ? 'bg-primary-600 text-white font-medium shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
                {item.IconComponent && (
                <item.IconComponent 
                  className={`flex-shrink-0 h-5 w-5 
                              ${activeSection !== item.id ? 'text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400' : 'text-white'}`} 
                />
                )}
                <span className="truncate flex-grow">{item.label}</span>
                {item.id === 'orders' && item.count > 0 && (
                    <span className={`ml-auto text-xs font-semibold rounded-full px-2 py-0.5 ${activeSection === item.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300'}`}>
                        {item.count}
                    </span>
                )}
            </Link>
            ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="relative">
            <button onClick={() => setIsProfileDropdownOpen(prev => !prev)} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-left focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 mr-2.5 flex-shrink-0">
                    <UserCircleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </span>
                <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user?.username || 'Pronar'}</p>
                    {/* <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p> */}
                </div>
                {isProfileDropdownOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-1 flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-1 flex-shrink-0" />}
            </button>
            {isProfileDropdownOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black/5 py-1 z-20">
                <Link to="settings" onClick={() => { setIsProfileDropdownOpen(false); handleLinkClick(); }} className="w-full text-left block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center">
                    <Cog6ToothIcon className="inline w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" /> Profili & Konfigurimet
                </Link>
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 flex items-center">
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
export default Sidebar;