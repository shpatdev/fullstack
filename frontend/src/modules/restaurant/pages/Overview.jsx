// src/modules/restaurant/pages/Overview.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
// import HeroIcon from "../../../components/HeroIcon"; // FSHIJE KËTË
import { 
    ClockIcon, ExclamationCircleIcon, QueueListIcon, StarIcon, CurrencyDollarIcon as CurrencyEuroIcon, 
    ShoppingCartIcon, Cog6ToothIcon, ChartPieIcon, ArrowPathIcon, BuildingStorefrontIcon, UsersIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from "../../../components/Button";
import { useAuth } from "../../../context/AuthContext";
import { restaurantApi } from "../../../api/restaurantApi";
import { useNotification } from "../../../context/NotificationContext";

// StatCard to accept IconComponent
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

const OverviewPage = () => {
  const { currentRestaurant } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();
  const contextRestaurant = useOutletContext()?.restaurant; // From RestaurantOwnerLayout
  const restaurantToUse = currentRestaurant || contextRestaurant;


  const fetchData = useCallback(async () => {
    if (!restaurantToUse?.id) {
        setError("Restoranti nuk është zgjedhur ose nuk ka ID.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, ordersData] = await Promise.all([
        restaurantApi.getRestaurantDashboardStats(restaurantToUse.id),
        restaurantApi.getRecentOrders(restaurantToUse.id, { limit: 5 }) 
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.results || ordersData || []);
    } catch (err) {
      console.error("Failed to load restaurant overview data:", err);
      setError(err.message || "Problem në ngarkimin e të dhënave të pasqyrës.");
      showError(err.message || "Problem në ngarkimin e të dhënave.");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantToUse?.id, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleRestaurantStatus = async () => {
    if (!restaurantToUse?.id) return;
    const newStatus = !restaurantToUse.is_active;
    try {
        // This should be ideally handled in AuthContext or a dedicated restaurant context
        // For now, making a direct API call and then trying to refresh auth context or data
        await restaurantApi.updateRestaurantDetails(restaurantToUse.id, { is_active: newStatus });
        showSuccess(`Statusi i restorantit u ndryshua në ${newStatus ? 'Aktiv' : 'Joaktiv'}.`);
        // TODO: Refresh currentRestaurant in AuthContext or refetch data
        fetchData(); // Refetch data to reflect change
    } catch (err) {
        showError("Problem në ndryshimin e statusit të restorantit.");
        console.error("Failed to toggle restaurant status:", err);
    }
  };
  
  if (!restaurantToUse) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-200 flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
        <p>Ju lutem zgjidhni ose krijoni një restorant për të parë këtë faqe.</p>
      </div>
    );
  }

  if (error && !isLoading) { // Show error only if not loading initial data
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
            <Button onClick={fetchData} variant="outline" size="sm" className="ml-auto">Provo Përsëri</Button>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
            Pasqyra e Restorantit: {restaurantToUse.name}
        </h1>
        <Button 
            onClick={handleToggleRestaurantStatus} 
            variant={restaurantToUse.is_active ? "danger" : "success"}
            iconLeft={restaurantToUse.is_active ? ExclamationCircleIcon : CheckCircleIcon}
            isLoading={isLoading} // This might need a dedicated loading state for this action
        >
            {restaurantToUse.is_active ? 'Çaktivizo Restorantin' : 'Aktivizo Restorantin'}
        </Button>
      </div>
      {!restaurantToUse.is_approved && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-800/40 rounded-lg text-yellow-700 dark:text-yellow-200 flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0"/>
            <p className="text-sm">Ky restorant është në pritje të aprovimit nga administratori. Disa funksionalitete mund të jenë të limituara.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatCard title="Porosi Sot" value={stats?.orders_today ?? 'N/A'} icon={ShoppingCartIcon} linkTo="../orders" color="blue" isLoading={isLoading} />
        <StatCard title="Të Ardhura Sot" value={stats?.revenue_today?.toFixed(2) ?? 'N/A'} unit="€" icon={CurrencyEuroIcon} color="green" isLoading={isLoading} />
        <StatCard title="Vlerësimi Mesatar" value={stats?.average_rating?.toFixed(1) ?? 'N/A'} unit="★" icon={StarIcon} linkTo="../reviews" color="yellow" isLoading={isLoading} />
        <StatCard title="Artikuj në Menu" value={stats?.menu_item_count ?? 'N/A'} icon={QueueListIcon} linkTo="../menu" color="purple" isLoading={isLoading} />
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-3">Porositë e Fundit</h2>
          {isLoading && <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400 dark:text-slate-500" />}
          {!isLoading && recentOrders.length === 0 && <p className="text-sm text-gray-500 dark:text-slate-400">Nuk ka porosi të fundit.</p>}
          <ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-80 overflow-y-auto">
            {recentOrders.map(order => (
              <li key={order.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">Porosia #{order.id} <span className="text-xs text-gray-500 dark:text-slate-400">- {order.customer_name || 'Klient'}</span></p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(order.created_at).toLocaleString('sq-AL')}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{parseFloat(order.total_price).toFixed(2)} €</p>
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200' :
                        order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200' :
                        order.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-200' :
                        order.status === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-200' :
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200' :
                        'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200'
                    }`}>{order.status_display || order.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2">Veprime të Shpejta</h2>
          <Button as={Link} to="../menu" fullWidth variant="outline" iconLeft={QueueListIcon}>Menaxho Menunë</Button>
          <Button as={Link} to="../orders" fullWidth variant="outline" iconLeft={ShoppingCartIcon}>Shiko Porositë</Button>
          <Button as={Link} to="../settings" fullWidth variant="outline" iconLeft={Cog6ToothIcon}>Konfigurimet e Restorantit</Button>
          <Button as={Link} to="../analytics" fullWidth variant="outline" iconLeft={ChartPieIcon}>Analitika</Button>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;