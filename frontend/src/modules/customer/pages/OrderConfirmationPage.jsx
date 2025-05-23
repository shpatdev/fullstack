// src/modules/customer/pages/OrderConfirmationPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customerApi } from '../../../api/customerApi.js'; // Për të tërhequr detajet e porosisë
import HeroIcon from '../../../components/HeroIcon.jsx';
import Button from '../../../components/Button.jsx';
import { useAuth } from '../../../context/AuthContext.jsx'; // Për token

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId || !token) {
        setError("ID e porosisë ose autorizimi mungon.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await customerApi.fetchOrderById(orderId); // API reale
      setOrderDetails(data);
    } catch (err) {
      setError(err.message || "Nuk mund të ngarkoheshin detajet e porosisë.");
      console.error("OrderConfirmation: Failed to fetch order details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Duke ngarkuar konfirmimin...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-md">
                <HeroIcon icon="ExclamationTriangleIcon" className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Gabim</h2>
                <p className="text-red-600 dark:text-red-300">{error}</p>
                <Button as={Link} to="/customer/my-orders" variant="outline" className="mt-6">
                    Shiko Porositë
                </Button>
            </div>
        </div>
    );
  }
  
  if (!orderDetails) {
    return <div className="text-center text-gray-600 dark:text-gray-300 py-10 text-xl">Detajet e porosisë nuk u gjetën.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 text-center">
        <HeroIcon icon="CheckBadgeIcon" className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-green-500 dark:text-green-400 mx-auto mb-6" />
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3">
          Porosia u Krye me Sukses!
        </h1>
        
        <p className="text-md sm:text-lg text-gray-600 dark:text-slate-300 mb-2">
          Faleminderit për besimin tuaj.
        </p>
        <p className="text-sm sm:text-md text-gray-700 dark:text-slate-200 font-semibold mb-6">
          ID e Porosisë: <span className="text-primary-600 dark:text-primary-400 tracking-wider">{orderDetails.id}</span>
        </p>
        
        <div className="text-left bg-gray-50 dark:bg-slate-700/50 p-4 sm:p-5 rounded-lg mb-6 space-y-1.5 text-sm border border-gray-200 dark:border-slate-600">
            <p><strong>Restoranti:</strong> {orderDetails.restaurant?.name || 'N/A'}</p>
            <p><strong>Totali i Paguar:</strong> {parseFloat(orderDetails.order_total).toFixed(2)} €</p>
            <p><strong>Adresa e Dërgesës:</strong> {orderDetails.delivery_address_street}, {orderDetails.delivery_address_city}</p>
            {orderDetails.estimated_delivery_time && <p><strong>Pritet të dërgohet rreth:</strong> {formatDate(orderDetails.estimated_delivery_time)}</p>}
        </div>

        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-8">
          Do të njoftoheni për statusin e porosisë suaj. Ju mund ta ndiqni te faqja "Porositë e Mia".
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
          <Button as={Link} to="/customer/my-orders" variant="primary" size="md" smSize="lg" iconLeft={<HeroIcon icon="ArchiveBoxIcon" className="h-5 w-5"/>}>
            Shiko Porositë e Mia
          </Button>
          <Button as={Link} to="/customer/restaurants" variant="outline" size="md" smSize="lg" iconLeft={<HeroIcon icon="ArrowUturnLeftIcon" className="h-5 w-5"/>}>
            Kthehu te Restorantet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;