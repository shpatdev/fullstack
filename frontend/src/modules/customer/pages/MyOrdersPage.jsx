// src/modules/customer/pages/MyOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { customerApi } from '../../../api/customerApi.js';
import OrderHistoryItem from '../components/OrderHistoryItem.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';
import Button from '../../../components/Button.jsx';

const MyOrdersPage = () => {
  const { user, token } = useAuth(); // Shto token
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user || !token) {
        setIsLoading(false); // Ndalo ngarkimin nëse nuk ka user/token
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userOrders = await customerApi.fetchUserOrders(); // API reale
      setOrders(userOrders || []);
    } catch (err) {
      setError(err.message || "Nuk mund të ngarkoheshin porositë tuaja.");
    } finally {
      setIsLoading(false);
    }
  }, [user, token]); // Shto token si dependencë

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-300px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Duke ngarkuar porositë...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-md">
                <HeroIcon icon="ExclamationTriangleIcon" className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Gabim në Ngarkim</h2>
                <p className="text-red-600 dark:text-red-300">{error}</p>
                <Button onClick={fetchOrders} variant="danger" className="mt-6">
                Provo Përsëri
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-0 py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-8 md:mb-10">Porositë e Mia</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg min-h-[350px] flex flex-col justify-center items-center px-4">
          <HeroIcon icon="ArchiveBoxXMarkIcon" className="h-20 w-20 text-gray-300 dark:text-slate-600 mx-auto mb-6" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-3">Nuk keni asnjë porosi.</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Duket se nuk keni bërë ende asnjë porosi. Filloni të eksploroni!</p>
          <Button as={Link} to="/customer/restaurants" variant="primary" size="lg" iconLeft={<HeroIcon icon="BuildingStorefrontIcon" className="h-5 w-5"/>}>
            Shfleto Restorantet
          </Button>
        </div>
      ) : (
        <div className="space-y-5 md:space-y-6">
          {orders.map(order => (
            <OrderHistoryItem key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;