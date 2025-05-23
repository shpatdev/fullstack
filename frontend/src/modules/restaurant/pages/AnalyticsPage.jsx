// src/modules/restaurant/pages/AnalyticsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon.jsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { restaurantApi } from '../../../api/restaurantApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';
import Button from '../../../components/Button.jsx'; // Shtuar butonin

const PIE_CHART_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']; // sky, emerald, amber, red, violet, pink

const StatCard = ({ title, value, icon, unit, trend, color = "primary", isLoading }) => ( /* ... si më parë ... */ 
  <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 border-l-4 border-${color}-500 dark:border-${color}-400 relative overflow-hidden`}>
    {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
        </div>
    )}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium truncate" title={title}>{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
          {value} {unit && <span className="text-xs font-normal">{unit}</span>}
        </p>
      </div>
      <div className={`p-2.5 bg-${color}-100 dark:bg-${color}-500/20 rounded-full flex-shrink-0`}>
          <HeroIcon icon={icon} className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </div>
    {trend && <p className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{trend}</p>}
  </div>
);

const AnalyticsPage = () => {
  const { token } = useAuth();
  const { currentRestaurantId, currentRestaurantName } = useOutletContext();
  const { showError } = useNotification();

  const initialAnalyticsData = {
    totalRevenueMonth: 0, totalOrdersMonth: 0, avgOrderValue: 0, newCustomersMonth: 0,
    salesMonthly: [], salesDaily: [], popularItems: [],
  };
  const [analyticsData, setAnalyticsData] = useState(initialAnalyticsData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!currentRestaurantId || !token) {
        setError("Restoranti nuk është zgjedhur ose nuk jeni të kyçur.");
        setIsLoading(false);
        setAnalyticsData(initialAnalyticsData);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.fetchRestaurantAnalytics(currentRestaurantId);
      // Supozojmë se API kthen një objekt me strukturën e pritur
      setAnalyticsData({
        totalRevenueMonth: data.totalRevenueMonth || 0,
        totalOrdersMonth: data.totalOrdersMonth || 0,
        avgOrderValue: data.avgOrderValue || 0,
        newCustomersMonth: data.newCustomersMonth || 0,
        salesMonthly: data.salesMonthly || [],
        salesDaily: data.salesDaily || [],
        popularItems: (data.popularItems || []).sort((a,b) => b.orders - a.orders).slice(0,5),
      });
    } catch (err) {
      setError(err.message || "S'u mund të ngarkoheshin të dhënat analitike.");
      showError(err.message || "S'u mund të ngarkoheshin të dhënat analitike.");
      setAnalyticsData(initialAnalyticsData); // Kthehu te mock/initial në rast gabimi
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurantId, token, showError]);

  useEffect(() => {
    if (currentRestaurantId) {
        fetchAnalytics();
    } else {
        setIsLoading(false);
        setError("Zgjidhni një restorant për të parë analitikat.");
    }
  }, [fetchAnalytics, currentRestaurantId]);

  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const chartGridColor = isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.7)'; // gray-700/50 : gray-200/70
  const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)'; // slate-800 : white
  const tooltipBorder = isDark ? '#475569' : '#E2E8F0'; // slate-600 : slate-300

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent * 100 < 5) return null; // Mos shfaq label për pjesë shumë të vogla

    return (
      <text x={x} y={y} fill={isDark? "#F1F5F9" : "#334155"} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px" fontWeight="medium">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  if (isLoading && analyticsData.totalOrdersMonth === 0) { /* ...si më parë... */ }
  if (error && !isLoading) { /* ...si më parë... */ }
   if (!currentRestaurantId && !isLoading) {
      return <div className="text-center py-10 text-lg text-gray-500 dark:text-slate-400">Ju lutem zgjidhni një restorant nga paneli juaj për të parë analitikat.</div>
  }

  return (
    <div className="container mx-auto">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Analitika: {currentRestaurantName || "Restoranti"}</h1>
         <Button variant="outline" onClick={fetchAnalytics} isLoading={isLoading} disabled={isLoading}
                iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>
      {error && !isLoading && <div className="text-center text-red-500 dark:text-red-400 py-6 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Të Ardhura (30 Ditët e Fundit)" value={analyticsData.totalRevenueMonth.toFixed(2)} unit="€" icon="CurrencyEuroIcon" color="green" isLoading={isLoading} trend="+5.2%"/>
        <StatCard title="Porosi (30 Ditët e Fundit)" value={analyticsData.totalOrdersMonth} icon="ShoppingCartIcon" color="blue" isLoading={isLoading} trend="-1.5%"/>
        <StatCard title="Vlera Mes. e Porosisë" value={analyticsData.avgOrderValue.toFixed(2)} unit="€" icon="ScaleIcon" color="purple" isLoading={isLoading} trend="+0.8%"/>
        <StatCard title="Klientë të Rinj (30 Ditët e Fundit)" value={analyticsData.newCustomersMonth} icon="UserPlusIcon" color="teal" isLoading={isLoading} trend="+12%"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 mb-8">
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-700 pb-3">Shitjet Ditore (7 Ditët e Fundit)</h2>
          {isLoading ? <div className="h-72 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400 dark:border-slate-500"></div></div> :
          analyticsData.salesDaily.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.salesDaily} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 10 }} />
              <YAxis tickFormatter={(value) => `${value}€`} tick={{ fill: chartTextColor, fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.375rem' }} labelStyle={{ color: isDark ? '#FFF' : '#000', fontWeight:'bold' }} itemStyle={{fontSize: '12px'}} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="total" name="Shitjet" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 6 }} dot={{r:3}} />
              <Line type="monotone" dataKey="orders" name="Porositë" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 6 }} dot={{r:3}} />
            </LineChart>
          </ResponsiveContainer>
          ) : (<p className="h-72 flex justify-center items-center text-sm text-gray-500 dark:text-slate-400">Nuk ka të dhëna për shitjet ditore.</p>)}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-700 pb-3">Artikujt Popullorë</h2>
          {isLoading ? <div className="h-72 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400 dark:border-slate-500"></div></div> :
          analyticsData.popularItems.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analyticsData.popularItems} dataKey="orders" nameKey="name" cx="50%" cy="50%" 
                   innerRadius={50} outerRadius={80} paddingAngle={3} labelLine={false} label={renderCustomizedLabel}>
                {analyticsData.popularItems.map((entry, index) => ( <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} /> ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.375rem' }}/>
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "11px", lineHeight: "1.2" }}/>
            </PieChart>
          </ResponsiveContainer>
          ) : (<p className="h-72 flex justify-center items-center text-sm text-gray-500 dark:text-slate-400">Nuk ka të dhëna për artikujt popullorë.</p>)}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;