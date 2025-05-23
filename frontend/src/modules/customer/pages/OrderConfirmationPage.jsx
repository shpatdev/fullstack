// src/modules/customer/pages/OrderConfirmationPage.jsx
import React, { useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import Button from '../../../components/Button';
import { CheckBadgeIcon, ArchiveBoxIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../../context/CartContext';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const { clearCart } = useCart();
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    // Clear the cart when the confirmation page is loaded
    // Only if orderDetails are present, indicating a successful order placement
    if (orderDetails) {
      clearCart();
    }
  }, [clearCart, orderDetails]);

  if (!orderDetails) {
    // If there are no order details, redirect to home or orders page
    // This prevents accessing the page directly without placing an order
    return <Navigate to="/customer/my-orders" replace />;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 sm:p-8 text-center">
        <CheckBadgeIcon className="h-16 w-16 sm:h-20 sm:w-20 text-green-500 dark:text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-3">Porosia u Konfirmua!</h1>
        <p className="text-gray-600 dark:text-slate-300 mb-1">
          Faleminderit për porosinë tuaj. ID e porosisë suaj është: 
          <strong className="text-primary-600 dark:text-primary-400"> #{orderDetails.id}</strong>
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          Ju do të merrni një email konfirmimi së shpejti.
        </p>

        <div className="text-left bg-gray-50 dark:bg-slate-700 p-4 rounded-md mb-6 space-y-2">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2">Detajet e Porosisë:</h2>
          <p className="text-sm text-gray-600 dark:text-slate-300"><strong>Restoranti:</strong> {orderDetails.restaurant_name || 'N/A'}</p>
          <p className="text-sm text-gray-600 dark:text-slate-300"><strong>Data e Porosisë:</strong> {formatDate(orderDetails.created_at)}</p>
          <p className="text-sm text-gray-600 dark:text-slate-300"><strong>Totali:</strong> {parseFloat(orderDetails.total_price).toFixed(2)} €</p>
          <p className="text-sm text-gray-600 dark:text-slate-300"><strong>Statusi:</strong> {orderDetails.status_display || orderDetails.status || 'Në Pritje'}</p>
          <p className="text-sm text-gray-600 dark:text-slate-300"><strong>Adresa e Dërgesës:</strong> {orderDetails.delivery_address_str || 'N/A'}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button 
            onClick={() => navigate('/customer/my-orders')} 
            variant="primary"
            iconLeft={ArchiveBoxIcon}
          >
            Shiko Porositë e Mia
          </Button>
          <Button 
            onClick={() => navigate('/customer/restaurants')} 
            variant="outline"
            iconLeft={ArrowUturnLeftIcon}
          >
            Kthehu te Restorantet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;