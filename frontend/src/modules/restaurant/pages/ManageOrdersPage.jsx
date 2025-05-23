// src/modules/restaurant/pages/ManageOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { restaurantApi } from '../../../api/restaurantApi';
// AuthContext nuk nevojitet direkt këtu, tokeni menaxhohet nga apiService
import { useNotification } from '../../../context/NotificationContext.jsx';
import Button from "../../../components/Button.jsx";
import { ArrowPathIcon, ShoppingCartIcon, FunnelIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, EyeIcon } from '@heroicons/react/24/outline'; // Shto EyeIcon
import OrderTableRow from "../components/OrderTableRow.jsx";
import OrderDetailModal from '../components/OrderDetailModal.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx'; // Sigurohu që path është korrekt

const ManageOrdersPage = () => {
  const { currentRestaurantId, currentRestaurantName } = useOutletContext() || {}; // Merr nga layout
  const { showSuccess, showError } = useNotification();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [orderToConfirm, setOrderToConfirm] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Për loading te ConfirmationModal

  const [activeFilter, setActiveFilter] = useState('ACTIVE_ONES'); // Default te porosite aktive
  const [searchTerm, setSearchTerm] = useState('');
  // filterStatus nuk nevojitet më pasi përdorim activeFilter me butona

  const fetchOrdersCallback = useCallback(async () => { // Riemërtoje për qartësi
    if (!currentRestaurantId) {
      setError("Restoranti nuk është zgjedhur. Ju lutem zgjidhni një restorant nga paneli.");
      setOrders([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // restaurantApi.fetchRestaurantOrders tani duhet të marrë vetëm restaurantId
      // tokeni menaxhohet nga apiService
      const data = await restaurantApi.fetchRestaurantOrders(currentRestaurantId);
      setOrders(data.results || data || []); // DRF PageNumberPagination kthen 'results'
    } catch (err) {
      console.error("ManageOrders: Failed to fetch orders:", err);
      const errMsg = err.response?.data?.detail || err.message || "S'u mund të ngarkoheshin porositë.";
      setError(errMsg);
      showError(errMsg);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurantId, showError]);

  useEffect(() => {
    fetchOrdersCallback();
    // Shto interval polling vetëm nëse dëshiron rifreskim automatik
    // const pollInterval = setInterval(fetchOrdersCallback, 30000); 
    // return () => clearInterval(pollInterval);
  }, [fetchOrdersCallback]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatusRequestFromModal = (orderId, newStatus) => {
    // Kjo thirret nga OrderDetailModal
    const order = orders.find(o => o.id === orderId);
    setOrderToConfirm({ 
        orderId, 
        newStatus, 
        currentStatus: order?.status,
        customerName: order?.customer_email || order?.customer?.email || 'Klient' // Merr email
    });
    setIsDetailModalOpen(false); // Mbyll modalin e detajeve
    setIsConfirmModalOpen(true); // Hap modalin e konfirmimit
  };
  
  const confirmAndUpdateStatus = async () => {
    if (!orderToConfirm) return;
    const { orderId, newStatus } = orderToConfirm;
    
    setIsUpdatingStatus(true); // Për butonin e konfirmimit
    try {
        // restaurantApi.updateOrderStatus tani merr vetëm orderId dhe newStatus
        const updatedOrder = await restaurantApi.updateOrderStatus(orderId, newStatus);
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
        showSuccess(`Statusi i porosisë #${orderId} u përditësua në ${updatedOrder.status_display || newStatus}.`);
        
        // Përditëso selectedOrder nëse modali i detajeve ishte hapur për këtë porosi
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(updatedOrder);
        }
    } catch (err) {
        console.error("Failed to update order status:", err);
        showError(err.response?.data?.detail || err.message || "Gabim gjatë përditësimit të statusit.");
    } finally {
        setIsConfirmModalOpen(false);
        setOrderToConfirm(null);
        setIsUpdatingStatus(false);
    }
  };

  const orderStatusFilters = [
    { label: "Të gjitha Aktive", value: "ACTIVE_ONES" },
    { label: "Në Pritje", value: "PENDING" },
    { label: "Konfirmuar", value: "CONFIRMED" },
    { label: "Në Përgatitje", value: "PREPARING" },
    { label: "Gati për Marrje", value: "READY_FOR_PICKUP" },
    { label: "Në Dërgesë", value: "ON_THE_WAY"},
    { label: "Të Gjitha Historiku", value: "ALL_HISTORY" },
    { label: "Dërguar", value: "DELIVERED" },
    { label: "Anuluar", value: "CANCELLED" }, // Ky do të kapë të dy llojet e anulimit
  ];

  const filteredOrders = orders.filter(order => {
    const searchTermLower = searchTerm.toLowerCase();
    let matchesSearch = true;
    if (searchTerm) {
        matchesSearch = (
            order.id.toString().includes(searchTermLower) ||
            (order.customer_email && order.customer_email.toLowerCase().includes(searchTermLower)) ||
            (order.customer?.email && order.customer.email.toLowerCase().includes(searchTermLower))
            // Mund të shtosh kërkim sipas artikujve nëse API e suporton ose nëse ke të dhënat e plota
        );
    }

    let matchesFilter = true;
    if (activeFilter === 'ALL_HISTORY') {
        matchesFilter = true;
    } else if (activeFilter === 'ACTIVE_ONES') {
        matchesFilter = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ON_THE_WAY'].includes(order.status?.toUpperCase());
    } else if (activeFilter === 'CANCELLED') {
        matchesFilter = order.status?.toUpperCase().startsWith('CANCELLED');
    } else {
        matchesFilter = order.status === activeFilter;
    }
    return matchesSearch && matchesFilter;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));


  if (!currentRestaurantId && !isLoading) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-200 flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
        <p>Ju lutem zgjidhni një restorant nga paneli për të menaxhuar porositë.</p>
      </div>
    );
  }
  
  // Kjo është për rastin kur ka një gabim gjatë ngarkimit fillestar të porosive
  if (error && orders.length === 0 && !isLoading) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
            <Button onClick={fetchOrdersCallback} variant="outline" size="sm" className="ml-auto">Provo Përsëri</Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-2"> {/* Reduktuar padding y */}
      <div className="mb-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white flex items-center">
            <ShoppingCartIcon className="h-6 w-6 sm:h-7 sm:w-7 mr-2 text-primary-600 dark:text-primary-400" />
            Menaxho Porositë {currentRestaurantName && <span className="text-lg sm:text-xl text-gray-500 dark:text-slate-400 ml-2 truncate hidden md:inline">për "{currentRestaurantName}"</span>}
        </h1>
        <Button onClick={fetchOrdersCallback} variant="outline" iconLeft={ArrowPathIcon} isLoading={isLoading} disabled={isLoading} size="sm">
            Rifresko Porositë
        </Button>
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="relative md:col-span-3"> {/* Bëje të marrë më shumë hapësirë */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Kërko (ID porosie, email klienti)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-form w-full pl-10"
            />
          </div>
          {/* Filter select-i është hequr, përdoren butonat më poshtë */}
        </div>
      </div>

      <div className="mb-5 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg shadow-sm overflow-x-auto">
        <div className="flex flex-nowrap gap-2 items-center">
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mr-1 sm:mr-2 flex-shrink-0">Filtro:</span>
          {orderStatusFilters.map(filter => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'primary' : 'ghost'}
              size="xs" // Bëje më të vogël për mobile
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap !px-2 !py-1 sm:!px-2.5 sm:!py-1.5" // Përdor !important për override
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && filteredOrders.length === 0 && (
        <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div></div>
      )}
      
      {!isLoading && (
        filteredOrders.length === 0 && currentRestaurantId ? ( // Trego "Nuk ka porosi" vetëm nëse currentRestaurantId është valid
            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                <ShoppingCartIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-slate-300">
                    {orders.length === 0 ? "Nuk keni asnjë porosi për këtë restorant." : `Nuk u gjet asnjë porosi me filtrin e zgjedhur.`}
                </p>
                 {orders.length > 0 && searchTerm && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Provoni të ndryshoni termin e kërkimit.</p>}
            </div>
        ) : (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {['ID', 'Klienti', 'Data', 'Artikuj', 'Totali', 'Statusi', 'Veprime'].map(header => (
                  <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredOrders.map((order) => (
                  <OrderTableRow 
                    key={order.id} 
                    order={order} 
                    onViewUpdate={handleViewDetails} // Riemërto prop-in për qartësi
                  />
                ))}
            </tbody>
          </table>
        </div>
        )
      )}

      {selectedOrder && (
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          order={selectedOrder}
          onUpdateStatus={handleUpdateStatusRequestFromModal} // Kjo thërret confirmation
        />
      )}
      {isConfirmModalOpen && orderToConfirm && (
        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => { setIsConfirmModalOpen(false); setOrderToConfirm(null); }}
            onConfirm={confirmAndUpdateStatus}
            title="Konfirmo Ndryshimin e Statusit"
            message={`Jeni të sigurt që doni të ndryshoni statusin e porosisë #${orderToConfirm.orderId} (${orderToConfirm.customerName}) nga "${orderToConfirm.currentStatus?.replace(/_/g, ' ').toLowerCase() || 'i tanishëm'}" në "${orderToConfirm.newStatus.replace(/_/g, ' ').toLowerCase()}"?`}
            confirmText="Po, Ndrysho"
            confirmButtonVariant="primary" // Ose "warning" / "success" bazuar në status
            isLoading={isUpdatingStatus}
        />
      )}
    </div>
  );
};

export default ManageOrdersPage;