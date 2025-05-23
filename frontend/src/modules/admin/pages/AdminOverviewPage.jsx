// src/modules/admin/pages/AdminOverviewPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
    UsersIcon, BuildingStorefrontIcon, ClockIcon, ShoppingCartIcon, CurrencyEuroIcon, 
    ChartPieIcon, ArrowPathIcon, UserPlusIcon, CheckBadgeIcon, UserMinusIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminApi } from '../../../api/adminApi';
import Button from '../../../components/Button'; // Assuming path

// Modified StatCard to accept IconComponent
const StatCard = ({ title, value, icon: IconComponent, unit, linkTo, color = "primary", isLoading }) => (
    <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-xl p-4 sm:p-5 flex items-center justify-between transition-all hover:shadow-xl`}>
        <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            {isLoading ? (
                <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400 dark:text-slate-500 my-1" />
            ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                    {value} {unit && <span className="text-sm font-normal">{unit}</span>}
                </p>
            )}
            {linkTo && !isLoading && (
                <Link to={linkTo} className={`text-xs text-${color}-600 dark:text-${color}-400 hover:underline`}>
                    Shiko më shumë
                </Link>
            )}
        </div>
        {IconComponent && (
            <div className={`p-2.5 bg-${color}-100 dark:bg-${color}-500/20 rounded-full`}>
                <IconComponent className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
            </div>
        )}
    </div>
);

// Helper Component for Activity Items
const ActivityItem = ({ icon: IconComponent, color = "gray", children }) => (
    <li className="flex items-start space-x-3 py-2">
        {IconComponent && (
            <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-${color}-100 dark:bg-${color}-500/20 flex items-center justify-center`}>
                <IconComponent className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
        )}
        <div className="flex-1 text-sm text-gray-700 dark:text-slate-300">
            {children}
        </div>
    </li>
);


const AdminOverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState({ stats: true, activities: true });
  const [error, setError] = useState(null);

  const fetchOverviewData = useCallback(async () => {
    setIsLoading({ stats: true, activities: true });
    setError(null);
    try {
      // Simulating fetching multiple data points.
      // In a real scenario, you might have a single dashboard API endpoint or multiple specific ones.
      const [usersData, restaurantsData /*, ordersTodayData */] = await Promise.all([
        adminApi.fetchAllUsers(), // Using existing mock API
        adminApi.fetchAllRestaurants(), // Using existing mock API
        // adminApi.fetchOrdersSummaryForToday(), // Placeholder for orders data
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
      setRecentActivity(activities.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,5));
      setIsLoading(prev => ({ ...prev, stats: false }));

    } catch (err) {
      console.error("Failed to load overview data", err);
      setError(err.message || "S'u mund të ngarkoheshin të dhënat.");
      setIsLoading({ stats: false, activities: false });
    } finally {
      // Simulate activities loading separately or if it's part of a different flow
      setTimeout(() => setIsLoading(prev => ({ ...prev, activities: false })), 500);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Pasqyra e Administratorit</h1>
        <Button variant="outline" onClick={fetchOverviewData} isLoading={isLoading.stats || isLoading.activities} disabled={isLoading.stats || isLoading.activities}
                iconLeft={<ArrowPathIcon className={`h-4 w-4 ${ (isLoading.stats || isLoading.activities) ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-700/20 dark:text-red-300 p-4 rounded-md mb-6" role="alert">
        <p className="font-bold">Gabim</p>
        <p>{error}</p>
      </div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
        <StatCard title="Përdorues Gjithsej" value={stats?.totalUsers} icon={UsersIcon} linkTo="/admin/users" color="blue" isLoading={isLoading.stats} />
        <StatCard title="Restorante Aktive" value={stats?.activeRestaurants} icon={BuildingStorefrontIcon} linkTo="/admin/restaurants" color="green" isLoading={isLoading.stats} />
        <StatCard title="Miratime në Pritje" value={stats?.pendingApprovals} icon={ClockIcon} linkTo="/admin/restaurants?approval=PENDING" color="yellow" isLoading={isLoading.stats}/>
        <StatCard title="Porosi Sot" value={stats?.totalOrdersToday} icon={ShoppingCartIcon} linkTo="/admin/orders" color="purple" isLoading={isLoading.stats} />
        <StatCard title="Të Ardhura Sot" value={stats?.totalRevenueToday?.toFixed(2)} unit="€" icon={CurrencyEuroIcon} linkTo="/admin/orders" color="teal" isLoading={isLoading.stats}/>
      </div>

      {/* Main Content Area: Charts and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-3">Analitika e Shitjeve (Shembull)</h2>
          <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-400 dark:text-slate-500">
                <ChartPieIcon className="h-10 w-10 mx-auto mb-2 text-gray-400 dark:text-gray-500"/>
                Grafiku i shitjeve do të shfaqet këtu.
            </p>
            {/* Example: <LineChart width={500} height={300} data={chartData}>...</LineChart> */}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-3">Aktivitetet e Fundit</h2>
          {isLoading.activities ? (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-80 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                  <ActivityItem 
                    key={activity.id} 
                    icon={
                        activity.type === 'NEW_USER' ? UserPlusIcon :
                        activity.type === 'NEW_RESTAURANT' ? BuildingStorefrontIcon :
                        activity.type === 'ORDER_PLACED' ? ShoppingCartIcon :
                        activity.type === 'USER_SUSPENDED' ? UserMinusIcon :
                        activity.type === 'RESTAURANT_APPROVED' ? CheckBadgeIcon :
                        ClockIcon // Default icon
                    }
                    color={
                        activity.type === 'NEW_USER' ? 'green' :
                        activity.type === 'NEW_RESTAURANT' ? 'sky' :
                        activity.type === 'ORDER_PLACED' ? 'blue' :
                        activity.type === 'USER_SUSPENDED' ? 'red' :
                        activity.type === 'RESTAURANT_APPROVED' ? 'teal' :
                        'gray'
                    }
                  >
                    <p dangerouslySetInnerHTML={{ __html: activity.description }} /> {/* Assuming description is safe HTML or plain text */}
                    <time className="text-xs text-gray-400 dark:text-slate-500">{new Date(activity.timestamp).toLocaleString('sq-AL')}</time>
                  </ActivityItem>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400 py-5 text-center">Nuk ka aktivitete të fundit për të shfaqur.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;