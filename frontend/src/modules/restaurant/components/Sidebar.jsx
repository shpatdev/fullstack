// filepath: frontend/src/modules/restaurant/components/Sidebar.jsx
import React, { useState, useEffect } from 'react'; // useContext removed
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Kept lucide-react icons that don't have an immediate match in HeroIcon or are more specific
import { ClipboardList, BookOpen, Star, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx'; // Corrected if it was wrong
import { useNotification } from '../../../context/NotificationContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';
import HeroIcon from '../../../components/HeroIcon.jsx'; // Added HeroIcon

const Sidebar = () => {
  const { user, token, currentRestaurant, selectRestaurant, logout: authLogout } = useAuth(); // Corrected if it was wrong, aliased logout
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { showNotification } = useNotification();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveSection = (pathname) => {
    if (pathname.includes('/restaurant/orders')) return 'orders';
    if (pathname.includes('/restaurant/menu')) return 'menu-management';
    if (pathname.includes('/restaurant/settings')) return 'settings';
    if (pathname.includes('/restaurant/reviews')) return 'reviews';
    if (pathname.includes('/restaurant/analytics')) return 'analytics';
    if (pathname.includes('/restaurant/dashboard') || pathname === '/restaurant' || pathname === '/restaurant/') return 'overview';
    return 'overview';
  };
  const activeSection = getActiveSection(location.pathname);

  const navItems = [
    { id: 'overview', label: 'Dashboard', iconType: 'hero', iconName: 'home', path: '/restaurant/dashboard' },
    { id: 'orders', label: 'Orders', iconType: 'lucide', LucideIcon: ClipboardList, count: pendingOrdersCount, path: '/restaurant/orders' },
    { id: 'menu-management', label: 'Menu Management', iconType: 'lucide', LucideIcon: BookOpen, path: '/restaurant/menu' },
    { id: 'settings', label: 'Restaurant Settings', iconType: 'hero', iconName: 'cog', path: '/restaurant/settings' },
    { id: 'reviews', label: 'Customer Reviews', iconType: 'lucide', LucideIcon: Star, path: '/restaurant/reviews' },
    { id: 'analytics', label: 'Analytics', iconType: 'lucide', LucideIcon: TrendingUp, path: '/restaurant/analytics' },
  ];

  useEffect(() => {
    const fetchPendingOrders = async () => {
      if (currentRestaurant?.id && token) {
        try {
          const orders = await restaurantApi.fetchRestaurantOrders(currentRestaurant.id, token);
          const pending = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status?.toUpperCase())).length;
          setPendingOrdersCount(pending);
        } catch (error) { console.error("Failed to fetch pending orders count:", error); setPendingOrdersCount(0); }
      } else {
        setPendingOrdersCount(0);
      }
    };
    fetchPendingOrders();
    if (activeSection === 'orders' || activeSection === 'overview') {
        const intervalId = setInterval(fetchPendingOrders, 30000);
        return () => clearInterval(intervalId);
    }
  }, [currentRestaurant, token, activeSection]);

  const handleLogout = async () => {
    await authLogout();
    showNotification('Logged out successfully.', 'info');
    navigate('/login');
  };
  
  // This check might be redundant if AppRoutes ProtectedRoute handles it
  if (!user || (user.role !== "RESTAURANT_OWNER" && user.role !== "ADMIN")) {
      // navigate('/login', { replace: true }); // This causes issues during initial render sometimes
      return null; // Or some loading state / unauthorized message
  }

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col h-screen sticky top-0">
      <Link to="/restaurant/dashboard" className="p-4 border-b flex items-center space-x-3 hover:bg-gray-50 transition-colors">
        <HeroIcon name="food-dash-logo" className="w-10 h-10 text-blue-600" /> {/* Assuming food-dash-logo is in HeroIcon */}
        <span className="text-xl font-bold text-blue-600">FoodDash</span>
      </Link>
      
      {user.ownsRestaurants && user.ownsRestaurants.length > 1 && (
        <div className="p-4 border-b">
          <label htmlFor="restaurantSelect" className="block text-xs font-medium text-gray-500 mb-1">Manage Restaurant:</label>
          <select 
            id="restaurantSelect" 
            value={currentRestaurant?.id || ''} 
            onChange={(e) => { 
              const selectedId = parseInt(e.target.value); 
              const restaurant = user.ownsRestaurants.find(r => r.id === selectedId); 
              if (restaurant) selectRestaurant(restaurant);
            }} 
            className="w-full form-select py-1.5 text-sm rounded-md border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {user.ownsRestaurants.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
        </div>
      )}
       {user.ownsRestaurants && user.ownsRestaurants.length === 1 && currentRestaurant && (
        <div className="p-4 border-b"> 
          <p className="text-xs font-medium text-gray-500 mb-0.5">Managing:</p> 
          <p className="text-sm font-semibold text-gray-800 truncate" title={currentRestaurant.name}>{currentRestaurant.name}</p> 
        </div>
       )}

      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link 
            key={item.id} 
            to={item.path}
            className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors 
              ${activeSection === item.id 
                ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
          >
            {item.iconType === 'hero' && item.iconName && (
              <HeroIcon name={item.iconName} className="w-5 h-5 mr-3 flex-shrink-0" />
            )}
            {item.iconType === 'lucide' && item.LucideIcon && (
              <item.LucideIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
            {item.id === 'orders' && item.count > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">{item.count}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t mt-auto">
        <div className="relative">
          <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left focus:outline-none">
            <HeroIcon name="user-circle" className="w-8 h-8 text-gray-500 mr-2 rounded-full" />
            <div className="flex-grow">
              <p className="text-sm font-medium text-gray-700 truncate">{user.name || user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            {isProfileDropdownOpen ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1 flex-shrink-0" />}
          </button>
          {isProfileDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-20">
              <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center">
                <HeroIcon name="logout" className="inline w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;