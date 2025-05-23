// src/modules/restaurant/pages/ManageOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom'; // Added
import { restaurantApi } from '../../../api/restaurantApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from "../../../components/Button";
import { ArrowPathIcon, ShoppingCartIcon, FunnelIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // EyeIcon will be in OrderTableRow
import OrderTableRow from "../components/OrderTableRow";
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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const handleSearchAndFilter = () => {
    // This function can be used to trigger search and filter manually if needed
    fetchOrders(1);
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white flex items-center">
            <ShoppingCartIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
            Menaxho Porositë
        </h1>
        <Button onClick={() => fetchOrders(1)} variant="outline" iconLeft={ArrowPathIcon} isLoading={isLoading} disabled={isLoading}>
            Rifresko Porositë
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Kërko (ID porosie, klient)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => fetchOrders(1)}
              className="input-form w-full pl-10"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {setFilterStatus(e.target.value); fetchOrders(1);}}
              className="input-form w-full pl-10"
            >
              <option value="">Të gjitha Statuset</option>
              <option value="PENDING">Në Pritje</option>
              <option value="CONFIRMED">Konfirmuar</option>
              <option value="PREPARING">Në Përgatitje</option>
              <option value="READY_FOR_PICKUP">Gati për Marrje</option>
              <option value="OUT_FOR_DELIVERY">Në Dërgesë</option>
              <option value="DELIVERED">Dorëzuar</option>
              <option value="CANCELLED">Anuluar</option>
            </select>
          </div>
        </div>
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
      
      {error && !isLoading && orders.length === 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
            <Button onClick={() => fetchOrders(1)} variant="outline" size="sm" className="ml-auto">Provo Përsëri</Button>
        </div>
      )}

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