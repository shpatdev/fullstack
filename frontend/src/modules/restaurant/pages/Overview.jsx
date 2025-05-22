// src/modules/restaurant/pages/Overview.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom'; // Added useOutletContext
import HeroIcon from '../../../components/HeroIcon';
import Button from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import { restaurantApi } from '../../../api/restaurantApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'; // Added Recharts

// Mock Data for Charts
const mockMonthlySalesData = [
  { name: 'Jan', Shitjet: 4000 }, { name: 'Shk', Shitjet: 3000 },
  { name: 'Mar', Shitjet: 5000 }, { name: 'Pri', Shitjet: 4500 },
  { name: 'Maj', Shitjet: 6000 }, { name: 'Qer', Shitjet: 5500 },
];
const mockPopularItemsData = [
  { name: 'Pizza Margherita', value: 120 }, { name: 'Burger Special', value: 95 },
  { name: 'Pasta Carbonara', value: 80 }, { name: 'Coca-Cola', value: 250 },
];
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];


const OverviewPage = () => {
  const { user, token } = useAuth(); // Token from useAuth
  const { currentRestaurantId, currentRestaurantName } = useOutletContext(); // Get from layout

  const [stats, setStats] = useState({
    activeOrders: 0, pendingOrders: 0, totalMenuItems: 0,
    averageRating: 0, dailyRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState({ stats: true, orders: true });
  const [error, setError] = useState(null);

  const fetchOverviewData = useCallback(async () => {
    if (!currentRestaurantId || !token) return;
    setIsLoading({ stats: true, orders: true });
    setError(null);
    try {
      // Simulate parallel fetching
      const [ordersData, menuItemsData, detailsData] = await Promise.all([
        restaurantApi.fetchRestaurantOrders(currentRestaurantId, token), // Fetch all orders to filter
        restaurantApi.fetchMenuItems(currentRestaurantId, token),
        restaurantApi.fetchRestaurantDetails(currentRestaurantId, token) // For rating
      ]);

      const activeStatuses = ['PREPARING', 'CONFIRMED', 'READY_FOR_PICKUP'];
      const pendingStatuses = ['PENDING'];
      
      const activeOrdersCount = ordersData.filter(o => activeStatuses.includes(o.status?.toUpperCase())).length;
      const pendingOrdersCount = ordersData.filter(o => pendingStatuses.includes(o.status?.toUpperCase())).length;
      
      // For daily revenue, filter orders from "today" (more complex logic needed for real app)
      // Mocking daily revenue from all non-cancelled orders for simplicity
      const dailyRevenueCalc = ordersData
        .filter(o => !o.status?.startsWith('CANCELLED'))
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

      setStats({
        activeOrders: activeOrdersCount,
        pendingOrders: pendingOrdersCount,
        totalMenuItems: menuItemsData.length,
        averageRating: detailsData?.average_rating || 0, // Assuming detailsData has average_rating
        dailyRevenue: dailyRevenueCalc,
      });
      
      // Sort orders by date and take the most recent ones
      setRecentOrders(
        ordersData
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      );
      setIsLoading(prev => ({ ...prev, stats: false, orders: false }));

    } catch (err) {
      console.error("Overview: Failed to fetch overview data:", err);
      setError(err.message || "S'u mund të ngarkoheshin të dhënat e pasqyrës.");
      setIsLoading({ stats: false, orders: false });
    }
  }, [currentRestaurantId, token]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const StatCard = ({ title, value, icon, unit, linkTo, color = "primary", isLoadingCard }) => (
    <Link to={linkTo || '#'} className={`block bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 hover:shadow-xl transition-all duration-300 border-l-4 border-${color}-500 dark:border-${color}-400 relative overflow-hidden`}>
      {isLoadingCard && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
          </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-white mt-1">
            {value} {unit && <span className="text-xs">{unit}</span>}
          </p>
        </div>
        <div className={`p-2.5 bg-${color}-100 dark:bg-${color}-500/20 rounded-full`}>
            <HeroIcon icon={icon} className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </Link>
  );

  if (error) {
    return <div className="text-center text-red-500 dark:text-red-400 p-5">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
          Pasqyra: <span className="text-primary-600 dark:text-primary-400">{currentRestaurantName || "Restoranti"}</span>
        </h1>
         <Button variant="outline" onClick={fetchOverviewData} isLoading={isLoading.stats || isLoading.orders} disabled={isLoading.stats || isLoading.orders}
                iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${ (isLoading.stats || isLoading.orders) ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        <StatCard title="Porosi Aktive" value={stats.activeOrders} icon="ClockIcon" linkTo="../orders" color="blue" isLoadingCard={isLoading.stats} />
        <StatCard title="Porosi në Pritje" value={stats.pendingOrders} icon="ExclamationCircleIcon" linkTo="../orders" color="yellow" isLoadingCard={isLoading.stats}/>
        <StatCard title="Artikuj në Menu" value={stats.totalMenuItems} icon="QueueListIcon" linkTo="../menu" color="purple" isLoadingCard={isLoading.stats} />
        <StatCard title="Vlerësimi Mesatar" value={stats.averageRating.toFixed(1)} unit="★" icon="StarIcon" linkTo="../reviews" color="amber" isLoadingCard={isLoading.stats}/>
        <StatCard title="Të Ardhura Sot" value={stats.dailyRevenue.toFixed(2)} unit="€" icon="CurrencyEuroIcon" linkTo="../analytics" color="green" isLoadingCard={isLoading.stats}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Porositë e Fundit</h2>
          {isLoading.orders ? (
            <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div></div>
          ) : recentOrders.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto custom-scrollbar-thin pr-1">
              {recentOrders.map(order => (
                <li key={order.id} className="py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-1 rounded">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <Link to={`../orders`} onClick={() => {/* TODO: Potentially filter orders page or open specific order */}} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">Porosia #{order.id}</Link>
                      <p className="text-gray-600 dark:text-gray-300">Klienti: {order.user_details?.username || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-white">{parseFloat(order.total_amount).toFixed(2)} €</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium
                        ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : 
                          ['PREPARING', 'CONFIRMED', 'READY_FOR_PICKUP'].includes(order.status) ? 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300' : 
                          'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}`}>
                        {order.status?.replace('_',' ').toLowerCase() || 'E panjohur'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-5 text-center">Nuk ka porosi të fundit.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-5">Veprime të Shpejta</h2>
          <div className="space-y-3">
            <Button as={Link} to="../menu" fullWidth variant="primary" iconLeft={<HeroIcon icon="QueueListIcon" className="h-5 w-5"/>}> Menaxho Menunë </Button>
            <Button as={Link} to="../orders" fullWidth variant="secondary" iconLeft={<HeroIcon icon="ShoppingCartIcon" className="h-5 w-5"/>}> Shiko Porositë </Button>
            <Button as={Link} to="../settings" fullWidth variant="outline" iconLeft={<HeroIcon icon="Cog6ToothIcon" className="h-5 w-5"/>}> Konfigurimet </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Shitjet Mujore (Mock)</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockMonthlySalesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? "#4B5563" : "#E5E7EB"}/>
                    <XAxis dataKey="name" tick={{ fill: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280', fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${value}€`} tick={{ fill: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280', fontSize: 12 }}/>
                    <Tooltip
                        contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                        labelStyle={{ color: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#1F2937', fontWeight: 'bold' }}
                        itemStyle={{ color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151' }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="Shitjet" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
         <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Artikujt Popullorë (Mock)</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={mockPopularItemsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                         label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                         legendType="circle"
                         
                    >
                        {mockPopularItemsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF', borderRadius: '0.5rem' }}/>
                    <Legend wrapperStyle={{ fontSize: "12px" }}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;