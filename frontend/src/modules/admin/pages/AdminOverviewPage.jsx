// src/modules/admin/pages/AdminOverviewPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon';
import { adminApi } from '../../../api/adminApi'; // Using mock API
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/Button';

// Mock Data (replace with API calls)
const initialStats = {
  totalUsers: 0,
  activeRestaurants: 0,
  pendingApprovals: 0,
  totalOrdersToday: 0,
  totalRevenueToday: 0,
};

const initialRecentActivities = [
  // Will be populated by API or remain empty
];

// Helper Component for Stat Cards
const StatCard = ({ title, value, icon, unit, linkTo, color = "primary", isLoading }) => (
  <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 border-l-4 border-${color}-500 dark:border-${color}-400 relative overflow-hidden`}>
    {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
        </div>
    )}
    <Link to={linkTo || '#'} className="block hover:opacity-90 transition-opacity">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">
            {value} {unit && <span className="text-xs font-normal">{unit}</span>}
          </p>
        </div>
        <div className={`p-2.5 bg-${color}-100 dark:bg-${color}-500/20 rounded-full`}>
            <HeroIcon icon={icon} className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </Link>
  </div>
);


const AdminOverviewPage = () => {
  const [stats, setStats] = useState(initialStats);
  const [recentActivities, setRecentActivities] = useState(initialRecentActivities); // Example activities
  const [isLoading, setIsLoading] = useState({ stats: true, activities: true });
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showError } = useNotification();

  const fetchOverviewData = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading({ stats: true, activities: true });
    setError(null);
    try {
      // Simulating fetching multiple data points.
      // In a real scenario, you might have a single dashboard API endpoint or multiple specific ones.
      const [usersData, restaurantsData /*, ordersTodayData */] = await Promise.all([
        adminApi.fetchAllUsers(user.token), // Using existing mock API
        adminApi.fetchAllRestaurants(user.token), // Using existing mock API
        // adminApi.fetchOrdersSummaryForToday(user.token), // Placeholder for orders data
      ]);

      const mockOrdersToday = [ // Mocking some orders for revenue calculation
        { total_amount: "25.50", status: "DELIVERED" },
        { total_amount: "15.00", status: "DELIVERED" },
        { total_amount: "30.00", status: "PREPARING" }, // Active order
      ];

      const activeRestaurants = restaurantsData.filter(r => r.is_active && r.is_approved).length;
      const pendingApprovals = restaurantsData.filter(r => !r.is_approved).length; // Restaurants pending approval
      
      const totalOrdersToday = mockOrdersToday.length;
      const totalRevenueToday = mockOrdersToday
        .filter(o => o.status === 'DELIVERED') // Only count delivered for revenue
        .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

      setStats({
        totalUsers: usersData.length,
        activeRestaurants: activeRestaurants,
        pendingApprovals: pendingApprovals,
        totalOrdersToday: totalOrdersToday,
        totalRevenueToday: totalRevenueToday,
      });

      // Mock recent activities based on fetched data or a separate API call
      const activities = [];
      if (usersData.length > 0) activities.push({ id: `user-${usersData[usersData.length-1].id}`, type: 'NEW_USER', description: `Përdoruesi "${usersData[usersData.length-1].username}" u shtua.`, timestamp: usersData[usersData.length-1].date_joined });
      if (restaurantsData.length > 0 && pendingApprovals > 0) {
        const pendingRestaurant = restaurantsData.find(r => !r.is_approved);
        if (pendingRestaurant) activities.push({ id: `rest-${pendingRestaurant.id}`, type: 'NEW_RESTAURANT', description: `Restoranti "${pendingRestaurant.name}" kërkon miratim.`, timestamp: pendingRestaurant.date_created });
      }
      // Sort activities by timestamp desc, take latest 5
      setRecentActivities(activities.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,5));
      setIsLoading(prev => ({ ...prev, stats: false }));

    } catch (err) {
      console.error("Failed to load overview data", err);
      setError(err.message || "S'u mund të ngarkoheshin të dhënat.");
      showError(err.message || "S'u mund të ngarkoheshin të dhënat e pasqyrës.");
      setIsLoading({ stats: false, activities: false });
    } finally {
      // Simulate activities loading separately or if it's part of a different flow
      setTimeout(() => setIsLoading(prev => ({ ...prev, activities: false })), 500);
    }
  }, [user?.token, showError]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);


  const ActivityItem = ({ activity }) => {
    let iconName = "InformationCircleIcon";
    let iconColor = "text-blue-500 dark:text-blue-400";
    switch(activity.type) {
        case 'NEW_USER': iconName = "UserPlusIcon"; iconColor = "text-green-500 dark:text-green-400"; break;
        case 'NEW_RESTAURANT': iconName = "BuildingStorefrontIcon"; iconColor = "text-sky-500 dark:text-sky-400"; break;
        case 'ORDER_PLACED': iconName = "ShoppingCartIcon"; iconColor = "text-indigo-500 dark:text-indigo-400"; break;
        case 'USER_SUSPENDED': iconName = "UserMinusIcon"; iconColor = "text-red-500 dark:text-red-400"; break;
        case 'RESTAURANT_APPROVED': iconName = "CheckBadgeIcon"; iconColor = "text-teal-500 dark:text-teal-400"; break;
        default: break;
    }
    return (
        <li className="py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 rounded-md transition-colors duration-150">
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <HeroIcon icon={iconName} className={`h-4 w-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={activity.description}>
                        {activity.description}
                    </p>
                </div>
                <div className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(activity.timestamp).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </li>
    );
  };


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Pasqyra e Administratorit</h1>
        <Button variant="outline" onClick={fetchOverviewData} isLoading={isLoading.stats || isLoading.activities} disabled={isLoading.stats || isLoading.activities}
                iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${ (isLoading.stats || isLoading.activities) ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-700/20 dark:text-red-300 p-4 rounded-md mb-6" role="alert">
        <p className="font-bold">Gabim</p>
        <p>{error}</p>
      </div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        <StatCard title="Përdorues Gjithsej" value={stats.totalUsers} icon="UsersIcon" linkTo="/admin/users" color="blue" isLoading={isLoading.stats} />
        <StatCard title="Restorante Aktive" value={stats.activeRestaurants} icon="BuildingStorefrontIcon" linkTo="/admin/restaurants" color="green" isLoading={isLoading.stats} />
        <StatCard title="Miratime në Pritje" value={stats.pendingApprovals} icon="ClockIcon" linkTo="/admin/restaurants?approval=PENDING" color="yellow" isLoading={isLoading.stats}/>
        <StatCard title="Porosi Sot" value={stats.totalOrdersToday} icon="ShoppingCartIcon" linkTo="/admin/orders" color="purple" isLoading={isLoading.stats} />
        <StatCard title="Të Ardhura Sot" value={stats.totalRevenueToday.toFixed(2)} unit="€" icon="CurrencyEuroIcon" linkTo="/admin/orders" color="teal" isLoading={isLoading.stats}/>
      </div>

      {/* Main Content Area: Charts and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Analitika e Shitjeve (Shembull)</h2>
          <div className="h-72 bg-gray-50 dark:bg-gray-700/30 rounded-md flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
                <HeroIcon icon="ChartPieIcon" className="h-10 w-10 mx-auto mb-2 text-gray-400 dark:text-gray-500"/>
                Grafiku i shitjeve do të shfaqet këtu.
            </p>
            {/* Example: <LineChart width={500} height={300} data={chartData}>...</LineChart> */}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Aktivitetet e Fundit</h2>
          {isLoading.activities ? (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto custom-scrollbar-thin pr-1">
              {recentActivities.length > 0 ? (
                recentActivities.map(activity => <ActivityItem key={activity.id} activity={activity} />)
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-5 text-center">Nuk ka aktivitete të fundit për të shfaqur.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;