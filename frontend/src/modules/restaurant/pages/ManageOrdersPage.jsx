// src/modules/restaurant/pages/ManageOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom'; // Added
import { restaurantApi } from '../../../api/restaurantApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/Button';
import HeroIcon from '../../../components/HeroIcon';
import OrderTableRow from '../components/OrderTableRow';
import OrderDetailModal from '../components/OrderDetailModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

const ManageOrdersPage = () => {
  const { token } = useAuth(); // Only token needed
  const { currentRestaurantId } = useOutletContext(); // Get from layout
  const { showSuccess, showError } = useNotification();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [orderToConfirm, setOrderToConfirm] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [activeFilter, setActiveFilter] = useState('ALL');
  
  const fetchOrders = useCallback(async () => {
    if (!currentRestaurantId || !token) {
      setError("Restoranti nuk është zgjedhur ose nuk jeni të kyçur.");
      setOrders([]); // Clear orders if no restaurant ID
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.fetchRestaurantOrders(currentRestaurantId, token);
      setOrders(data || []);
    } catch (err) {
      console.error("ManageOrders: Failed to fetch orders:", err);
      setError(err.message || "S'u mund të ngarkoheshin porositë.");
      showError(err.message || "S'u mund të ngarkoheshin porositë.");
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurantId, token, showError]);

  useEffect(() => {
    fetchOrders();
    const pollInterval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, [fetchOrders]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatusRequest = (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    setOrderToConfirm({ 
        orderId, 
        newStatus, 
        currentStatus: order?.status, // Pass current status for confirmation message
        customerName: order?.user_details?.username 
    });
    setIsConfirmModalOpen(true);
  };
  
  const confirmStatusUpdate = async () => {
    if (!orderToConfirm || !token) return;
    const { orderId, newStatus } = orderToConfirm;
    setIsConfirmModalOpen(false);

    setIsLoading(true); // General loading for the action
    try {
        const updatedOrder = await restaurantApi.updateOrderStatus(orderId, newStatus, token);
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
        showSuccess(`Statusi i porosisë #${orderId} u përditësua.`);
        if(isDetailModalOpen && selectedOrder?.id === orderId){
            setSelectedOrder(updatedOrder);
        }
    } catch (err) {
        console.error("Failed to update order status:", err);
        showError(err.message || "Gabim gjatë përditësimit të statusit.");
    } finally {
        setOrderToConfirm(null);
        setIsLoading(false);
    }
  };

  const orderStatusFilters = [
    { label: "Të gjitha Aktive", value: "ACTIVE_ONES" }, // Custom filter value
    { label: "Në Pritje", value: "PENDING" },
    { label: "Konfirmuar", value: "CONFIRMED" },
    { label: "Në Përgatitje", value: "PREPARING" },
    { label: "Gati për Marrje", value: "READY_FOR_PICKUP" },
    { label: "Të gjitha", value: "ALL_HISTORY" }, // To see delivered/cancelled
    { label: "Dërguar", value: "DELIVERED" },
    { label: "Anuluar", value: "CANCELLED" },
  ];

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'ALL_HISTORY') return true;
    if (activeFilter === 'ACTIVE_ONES') return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ON_THE_WAY'].includes(order.status?.toUpperCase());
    if (activeFilter === 'CANCELLED') return order.status?.startsWith('CANCELLED');
    return order.status === activeFilter;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Menaxho Porositë</h1>
        <Button variant="outline" onClick={fetchOrders} isLoading={isLoading} disabled={isLoading}
                iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filtro:</span>
          {orderStatusFilters.map(filter => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && filteredOrders.length === 0 && (
        <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div></div>
      )}
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-700/20 dark:text-red-300 p-4 rounded-md" role="alert"><p className="font-bold">Gabim:</p><p>{error}</p></div>}

      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['ID', 'Klienti', 'Data', 'Artikuj', 'Totali', 'Statusi', 'Veprime'].map(header => (
                  <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderTableRow 
                    key={order.id} 
                    order={order} 
                    onViewDetails={handleViewDetails}
                    // onUpdateStatus is now handled by OrderDetailModal or other specific UIs
                  />
                ))
              ) : (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">{orders.length === 0 ? "Nuk ka porosi." : `Nuk ka porosi me filtrin "${activeFilter}".`}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          order={selectedOrder}
          onUpdateStatus={handleUpdateStatusRequest} // This will trigger confirmation
        />
      )}
      {isConfirmModalOpen && orderToConfirm && ( // Ensure orderToConfirm is not null
        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmStatusUpdate}
            title="Konfirmo Ndryshimin e Statusit"
            message={`Jeni të sigurt që doni të ndryshoni statusin e porosisë #${orderToConfirm.orderId} (${orderToConfirm.customerName || ''}) nga "${orderToConfirm.currentStatus?.replace(/_/g, ' ')?.toLowerCase() || 'i tanishëm'}" në "${orderToConfirm.newStatus.replace(/_/g, ' ').toLowerCase()}"?`}
            confirmText="Po, Ndrysho"
            iconType="warning"
            isLoading={isLoading} // Use general loading state
        />
      )}
    </div>
  );
};

export default ManageOrdersPage;