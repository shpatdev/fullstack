// src/modules/restaurant/components/Sidebar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, BookOpen, Settings, Star, TrendingUp, LogOut, UserCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js'; // Assuming this path

const Sidebar = () => {
  const { user, token, currentRestaurant, selectRestaurant, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { showNotification } = useNotification();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const location = useLocation(); // To determine active section
  const navigate = useNavigate();

  // Determine active section based on current path
  const getActiveSection = (pathname) => {
    if (pathname.includes('/restaurant/orders')) return 'orders';
    if (pathname.includes('/restaurant/menu')) return 'menu-management';
    if (pathname.includes('/restaurant/settings')) return 'settings';
    if (pathname.includes('/restaurant/reviews')) return 'reviews';
    if (pathname.includes('/restaurant/analytics')) return 'analytics';
    if (pathname.includes('/restaurant/dashboard') || pathname === '/restaurant') return 'overview';
    return 'overview';
  };
  const activeSection = getActiveSection(location.pathname);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Home, path: '/restaurant/dashboard' },
    { id: 'orders', label: 'Orders', icon: ClipboardList, count: pendingOrdersCount, path: '/restaurant/orders' },
    { id: 'menu-management', label: 'Menu Management', icon: BookOpen, path: '/restaurant/menu' },
    { id: 'settings', label: 'Restaurant Settings', icon: Settings, path: '/restaurant/settings' }, // TODO: create this route
    { id: 'reviews', label: 'Customer Reviews', icon: Star, path: '/restaurant/reviews' }, // TODO: create this route
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/restaurant/analytics' }, // TODO: create this route
  ];

  useEffect(() => {
    const fetchPendingOrders = async () => {
      if (currentRestaurant?.id && token) {
        try {
          const orders = await restaurantApi.fetchRestaurantOrders(currentRestaurant.id, token);
          const pending = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status.toUpperCase())).length;
          setPendingOrdersCount(pending);
        } catch (error) { console.error("Failed to fetch pending orders count:", error); setPendingOrdersCount(0); }
      } else {
        setPendingOrdersCount(0);
      }
    };
    // Fetch count when component mounts or relevant data changes
    fetchPendingOrders();
    // Optionally, refresh on interval or when navigating to orders/overview
    if (activeSection === 'orders' || activeSection === 'overview') {
        const intervalId = setInterval(fetchPendingOrders, 30000); // Refresh every 30s
        return () => clearInterval(intervalId);
    }

  }, [currentRestaurant, token, activeSection]);

  const handleLogout = async () => { 
    await logout(); 
    showNotification('Logged out successfully.', 'info');
    navigate('/login'); // Navigate to a general login or owner login
  };
  
  if (!user) return null;

  return (
    <aside className="lg:w-64 bg-white shadow-md flex flex-col h-screen sticky top-0">
      <Link to="/restaurant/dashboard" className="p-4 border-b flex items-center space-x-3 hover:bg-gray-50">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M5 6h14M5 10h14M5 14h14M5 18h14"></path></svg>
        <span className="text-2xl font-bold text-blue-600">FoodDash</span>
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
            className="w-full form-input py-1.5 text-sm rounded-md border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {user.ownsRestaurants.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
        </div>
      )}
       {user.ownsRestaurants && user.ownsRestaurants.length === 1 && currentRestaurant && (
        <div className="p-4 border-b"> 
          <p className="text-xs font-medium text-gray-500 mb-0.5">Managing:</p> 
          <p className="text-sm font-semibold text-gray-800">{currentRestaurant.name}</p> 
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
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" /> 
            <span className="truncate">{item.label}</span>
            {item.id === 'orders' && item.count > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">{item.count}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t mt-auto">
        <div className="relative">
          <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
            <UserCircle className="w-8 h-8 text-gray-500 mr-2 rounded-full" />
            <div className="flex-grow">
              <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            {isProfileDropdownOpen ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
          </button>
          {isProfileDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-20"> {/* Increased z-index */}
              <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="inline w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar; // Assuming Sidebar is in its own file