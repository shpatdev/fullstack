// src/modules/restaurant/pages/AnalyticsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { restaurantApi } from '../../../api/restaurantApi'; // Assuming API for analytics
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

// Mock Data - replace with API calls
const mockSalesDataMonthly = [
  { name: 'Jan', total: 4250, orders: 240 }, { name: 'Shk', total: 3100, orders: 190 },
  { name: 'Mar', total: 5300, orders: 320 }, { name: 'Pri', total: 4800, orders: 280 },
  { name: 'Maj', total: 6150, orders: 350 }, { name: 'Qer', total: 5600, orders: 310 },
];
const mockSalesDataDaily = [ // Last 7 days
  { name: 'E Hënë', total: 320, orders: 20 }, { name: 'E Martë', total: 450, orders: 25 },
  { name: 'E Mërk.', total: 300, orders: 18 }, { name: 'E Enjte', total: 550, orders: 30 },
  { name: 'E Premte', total: 750, orders: 40 }, { name: 'E Shtunë', total: 900, orders: 50 },
  { name: 'E Diel', total: 650, orders: 35 },
];
const mockPopularItems = [
  { name: 'Pizza Margherita', orders: 125, revenue: 1000 }, { name: 'Burger Special', orders: 98, revenue: 1176 },
  { name: 'Pasta Carbonara', orders: 82, revenue: 902 },  { name: 'Coca-Cola', orders: 255, revenue: 382.5 },
  { name: 'Sallatë Cezar', orders: 63, revenue: 441 },
];
const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

// StatCard Component (can be moved to a shared components folder if used elsewhere)
const StatCard = ({ title, value, icon, unit, trend, color = "primary", isLoading }) => (
  <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 border-l-4 border-${color}-500 dark:border-${color}-400 relative overflow-hidden`}>
    {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
        </div>
    )}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
          {value} {unit && <span className="text-xs font-normal">{unit}</span>}
        </p>
      </div>
      <div className={`p-2.5 bg-${color}-100 dark:bg-${color}-500/20 rounded-full`}>
          <HeroIcon icon={icon} className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </div>
    {trend && <p className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{trend}</p>}
  </div>
);


const AnalyticsPage = () => {
  const { token } = useAuth();
  const { currentRestaurantId } = useOutletContext();
  const { showError } = useNotification();

  const [analyticsData, setAnalyticsData] = useState({
    totalRevenueMonth: 0, totalOrdersMonth: 0, avgOrderValue: 0, newCustomersMonth: 0,
    salesMonthly: mockSalesDataMonthly, salesDaily: mockSalesDataDaily, popularItems: mockPopularItems,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!currentRestaurantId || !token) {
        setError("Restoranti nuk është zgjedhur ose nuk jeni të kyçur.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // const data = await restaurantApi.fetchRestaurantAnalytics(currentRestaurantId, token);
      // For now, use mock data and derive some stats
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const totalRevenueMonth = mockSalesDataMonthly.reduce((sum, item) => sum + item.total, 0);
      const totalOrdersMonth = mockSalesDataMonthly.reduce((sum, item) => sum + item.orders, 0);
      const avgOrderValue = totalOrdersMonth > 0 ? totalRevenueMonth / totalOrdersMonth : 0;

      setAnalyticsData({
        totalRevenueMonth: totalRevenueMonth,
        totalOrdersMonth: totalOrdersMonth,
        avgOrderValue: avgOrderValue,
        newCustomersMonth: 67, // Mock
        salesMonthly: mockSalesDataMonthly,
        salesDaily: mockSalesDataDaily,
        popularItems: mockPopularItems.sort((a,b) => b.orders - a.orders).slice(0,5), // Top 5
      });

    } catch (err) {
      console.error("Analytics: Failed to fetch data", err);
      setError(err.message || "S'u mund të ngarkoheshin të dhënat analitike.");
      showError(err.message || "S'u mund të ngarkoheshin të dhënat analitike.");
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurantId, token, showError]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const isDark = document.documentElement.classList.contains('dark');
  const chartTextColor = isDark ? '#9CA3AF' : '#6B7280'; // gray-400 : gray-500
  const chartGridColor = isDark ? '#374151' : '#E5E7EB'; // gray-700 : gray-200
  const tooltipBg = isDark ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)'; // gray-700 : white
  const tooltipBorder = isDark ? '#4B5563' : '#D1D5DB'; // gray-600 : gray-300


  if (isLoading && analyticsData.totalOrdersMonth === 0) { // Show main loader only on initial full load
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  }
   if (error && !isLoading) {
    return <div className="text-center text-red-500 dark:text-red-400 py-10 bg-red-50 dark:bg-red-900/30 p-6 rounded-md">{error}</div>;
  }


  return (
    <div className="container mx-auto">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white mb-8">Analitika e Restorantit</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Të Ardhura (30 Ditët e Fundit)" value={analyticsData.totalRevenueMonth.toFixed(2)} unit="€" icon="CurrencyEuroIcon" color="green" isLoading={isLoading} trend="+5.2%"/>
        <StatCard title="Porosi (30 Ditët e Fundit)" value={analyticsData.totalOrdersMonth} icon="ShoppingCartIcon" color="blue" isLoading={isLoading} trend="-1.5%"/>
        <StatCard title="Vlera Mes. e Porosisë" value={analyticsData.avgOrderValue.toFixed(2)} unit="€" icon="ScaleIcon" color="purple" isLoading={isLoading} trend="+0.8%"/>
        <StatCard title="Klientë të Rinj (30 Ditët e Fundit)" value={analyticsData.newCustomersMonth} icon="UserPlusIcon" color="teal" isLoading={isLoading} trend="+12%"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Shitjet Ditore (7 Ditët e Fundit)</h2>
          {isLoading ? <div className="h-72 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400"></div></div> :
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.salesDaily} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${value}€`} tick={{ fill: chartTextColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.375rem' }} labelStyle={{ color: isDark ? '#FFF' : '#000' }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="total" name="Shitjet Totale" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="orders" name="Numri i Porosive" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Artikujt Më Popullorë (sipas porosive)</h2>
          {isLoading ? <div className="h-72 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400"></div></div> :
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analyticsData.popularItems} dataKey="orders" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}
                   labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {analyticsData.popularItems.map((entry, index) => ( <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} /> ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.375rem' }}/>
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px", bottom: -5 }}/>
            </PieChart>
          </ResponsiveContainer>}
        </div>
      </div>
      
       <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">Shitjet Mujore (6 Muajt e Fundit)</h2>
          {isLoading ? <div className="h-72 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400"></div></div> :
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.salesMonthly} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${value}€`} tick={{ fill: chartTextColor, fontSize: 12 }}/>
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.375rem' }} labelStyle={{ color: isDark ? '#FFF' : '#000' }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="total" name="Shitjet Totale" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30}/>
              <Bar dataKey="orders" name="Numri i Porosive" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={30}/>
            </BarChart>
          </ResponsiveContainer>}
        </div>

    </div>
  );
};

export default AnalyticsPage;