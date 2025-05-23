// src/modules/restaurant/pages/AnalyticsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
// import HeroIcon from "../../../components/HeroIcon.jsx"; // FSHIJE KËTË
import { ArrowPathIcon, ChartPieIcon, ExclamationTriangleIcon, CalendarDaysIcon, CurrencyDollarIcon, ShoppingCartIcon, StarIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { restaurantApi } from "../../../api/restaurantApi.js";
import { useNotification } from "../../../context/NotificationContext.jsx";
import Button from "../../../components/Button.jsx"; // Assuming path

const AnalyticsPage = () => {
  const { currentRestaurant } = useOutletContext() || {};
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError } = useNotification();
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Default to last 30 days
    to: new Date().toISOString().split('T')[0] 
  });

  const fetchAnalytics = useCallback(async () => {
    if (!currentRestaurant?.id) {
      setError("Restoranti nuk është zgjedhur ose nuk ka ID.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        start_date: dateRange.from,
        end_date: dateRange.to,
      };
      const data = await restaurantApi.getRestaurantAnalytics(currentRestaurant.id, params);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Problem në ngarkimin e analitikave.");
      showError(err.message || "Problem në ngarkimin e analitikave.");
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant?.id, dateRange, showError]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateChange = (e) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A230ED', '#D930ED'];

  if (!currentRestaurant) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-200 flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
        <p>Ju lutem zgjidhni ose krijoni një restorant për të parë këtë faqe.</p>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
            <Button onClick={fetchAnalytics} variant="outline" size="sm" className="ml-auto">Provo Përsëri</Button>
        </div>
    );
  }
  
  const StatCard = ({ title, value, icon: IconComponent, unit, color = "primary" }) => (
    <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-xl p-4 flex items-center justify-between`}>
        <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{title}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
                {value ?? <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-400" />} {unit}
            </p>
        </div>
        {IconComponent && (
            <div className={`p-2 bg-${color}-100 dark:bg-${color}-500/20 rounded-full`}>
                <IconComponent className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
        )}
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white flex items-center">
            <ChartPieIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
            Analitikat e Restorantit
        </h1>
        <Button onClick={fetchAnalytics} variant="outline" iconLeft={ArrowPathIcon} isLoading={isLoading} disabled={isLoading}>
            Rifresko Analitikat
        </Button>
      </div>
      
      {/* Date Range Picker */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
                <label htmlFor="dateFrom" className="label-form text-xs">Nga Data:</label>
                <input type="date" name="from" id="dateFrom" value={dateRange.from} onChange={handleDateChange} className="input-form w-full"/>
            </div>
            <div>
                <label htmlFor="dateTo" className="label-form text-xs">Deri më Datë:</label>
                <input type="date" name="to" id="dateTo" value={dateRange.to} onChange={handleDateChange} className="input-form w-full"/>
            </div>
            <Button onClick={fetchAnalytics} iconLeft={CalendarDaysIcon} isLoading={isLoading} disabled={isLoading} className="sm:mt-5">
                Apliko Filtrimin
            </Button>
        </div>
      </div>

      {isLoading && !analyticsData && (
         <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-primary-500" />
         </div>
      )}

      {analyticsData && !isLoading && (
        <>
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Të Ardhurat Totale" value={analyticsData.summary?.total_revenue?.toFixed(2)} unit="€" icon={CurrencyDollarIcon} color="green"/>
            <StatCard title="Porosi Gjithsej" value={analyticsData.summary?.total_orders} icon={ShoppingCartIcon} color="blue"/>
            <StatCard title="Vlerësimi Mesatar" value={analyticsData.summary?.average_rating?.toFixed(1)} unit="★" icon={StarIcon} color="yellow"/>
            <StatCard title="Klientë të Rinj" value={analyticsData.summary?.new_customers} icon={UserPlusIcon} color="purple"/>
          </div>
          
          {/* Revenue Over Time Chart */}
          {analyticsData.revenue_over_time && analyticsData.revenue_over_time.length > 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-3">Të Ardhurat Gjatë Kohës</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.revenue_over_time}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700"/>
                  <XAxis dataKey="date" tick={{fontSize: 12}} className="fill-gray-500 dark:fill-slate-400"/>
                  <YAxis tick={{fontSize: 12}} className="fill-gray-500 dark:fill-slate-400" unit="€"/>
                  <Tooltip formatter={(value) => `${value.toFixed(2)} €`} wrapperClassName="tooltip-recharts"/>
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Të ardhurat" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Popular Menu Items Chart */}
          {analyticsData.popular_menu_items && analyticsData.popular_menu_items.length > 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-3">Artikujt Më Popullorë të Menusë</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.popular_menu_items} layout="vertical" margin={{left: 100}}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700"/>
                    <XAxis type="number" tick={{fontSize: 12}} className="fill-gray-500 dark:fill-slate-400"/>
                    <YAxis dataKey="name" type="category" tick={{fontSize: 10, width: 95, textAnchor: 'start'}} interval={0} className="fill-gray-500 dark:fill-slate-400"/>
                    <Tooltip formatter={(value) => `${value} porosi`} wrapperClassName="tooltip-recharts"/>
                    <Legend />
                    <Bar dataKey="order_count" name="Numri i Porosive" fill="#82ca9d" barSize={20}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Order Status Distribution */}
          {analyticsData.order_status_distribution && analyticsData.order_status_distribution.length > 0 && (
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-3">Shpërndarja e Statusit të Porosive</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={analyticsData.order_status_distribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="status_display"
                        >
                            {analyticsData.order_status_distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} porosi`, name]} wrapperClassName="tooltip-recharts"/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;