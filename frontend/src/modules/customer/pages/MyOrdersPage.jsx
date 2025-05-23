// src/modules/customer/pages/MyOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { customerApi } from '../../../api/customerApi.js';
import OrderHistoryItem from '../components/OrderHistoryItem.jsx';
import { ArchiveBoxXMarkIcon, BuildingStorefrontIcon, EyeIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/Button.jsx';

const MyOrdersPage = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]); // Initialize as an empty array
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    if (!user || !token) {
      setIsLoading(false);
      setOrders([]); // Ensure orders is an empty array if no user/token
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userOrdersData = await customerApi.fetchUserOrders(); // customerApi.fetchUserOrders should return an array
      // Defensively ensure that what we set is an array.
      // customerApi.fetchUserOrders is expected to return response.results || []
      setOrders(Array.isArray(userOrdersData) ? userOrdersData : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(err.message || "Nuk mund të ngarkoheshin porositë tuaja.");
      setOrders([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div>
        <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Duke ngarkuar porositë...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Gabim në Ngarkim</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button onClick={fetchOrders} variant="danger" className="mt-6" iconLeft={ArrowPathIcon} iconLeftClassName="h-5 w-5">
            Provo Përsëri
          </Button>
        </div>
      </div>
    );
  }

  // At this point, isLoading is false, error is null, and orders is guaranteed to be an array.
  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <ArchiveBoxXMarkIcon className="h-20 w-20 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">Nuk Ka Porosi</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">Ju nuk keni bërë ende asnjë porosi.</p>
        <Button
          onClick={() => navigate('/customer/restaurants')}
          variant="primary"
          iconLeft={BuildingStorefrontIcon} 
          iconLeftClassName="h-5 w-5"
        >
          Shfleto Restorantet
        </Button>
      </div>
    );
  }

  // Orders is an array and has items
  return (
    <div className="container mx-auto py-6 sm:py-8 px-2">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-8 md:mb-10">Porositë e Mia</h1>
      <div className="space-y-5 md:space-y-6">
        {orders.map(order => (
          <OrderHistoryItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default MyOrdersPage;