// src/modules/admin/pages/AdminOrdersPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../../api/adminApi";
import { useNotification } from "../../../context/NotificationContext";
import Button from "../../../components/Button"; // Assuming Button.jsx or Button/index.jsx
// import HeroIcon from "../../../components/HeroIcon"; // FSHIJE KËTË
import { ArrowPathIcon, EyeIcon, ShoppingCartIcon, FunnelIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import OrderDetailModal from "../../restaurant/components/OrderDetailModal"; // Assuming path, adjust if necessary

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: 0,
  });

  const fetchOrders = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { 
        page,
        search: searchTerm,
        status: filterStatus,
      };
      const data = await adminApi.getAllOrders(params);
      setOrders(data.results || []);
      setPagination({
        currentPage: data.current_page || 1,
        totalPages: data.total_pages || 1,
        count: data.count || 0,
      });
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(err.message || "Problem në ngarkimin e porosive.");
      showError(err.message || "Problem në ngarkimin e porosive.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterStatus, showError]);

  useEffect(() => {
    fetchOrders(pagination.currentPage);
  }, [fetchOrders, pagination.currentPage]);

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      showSuccess(`Statusi i porosisë #${orderId} u ndryshua.`);
      fetchOrders(pagination.currentPage); // Refresh orders
    } catch (err) {
      showError(err.message || "Problem në ndryshimin e statusit të porosisë.");
      console.error("Failed to update order status:", err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };
  
  const getStatusColor = (status) => {
    // ... (same as in ManageOrdersPage for restaurant if applicable)
    const colors = {
        PENDING: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-700/30",
        CONFIRMED: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-700/30",
        PREPARING: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-700/30",
        READY_FOR_PICKUP: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-700/30",
        OUT_FOR_DELIVERY: "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-700/30",
        DELIVERED: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-700/30",
        CANCELLED: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-700/30",
        FAILED: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/30",
    };
    return colors[status] || "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/30";
  };


  if (error && !isLoading && orders.length === 0) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
            <Button onClick={() => fetchOrders(1)} variant="outline" size="sm" className="ml-auto">Provo Përsëri</Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white flex items-center">
            <ShoppingCartIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
            Të Gjitha Porositë
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
              placeholder="Kërko (ID, klient, restorant)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => fetchOrders(1)} // Fetch on blur or use a search button
              className="input-form w-full pl-10"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); fetchOrders(1);}}
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
              <option value="FAILED">Dështuar</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && orders.length === 0 && (
         <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-primary-500" />
         </div>
      )}
      
      {!isLoading && orders.length === 0 && !error && (
        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow">
          <ShoppingCartIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-slate-300">Nuk u gjet asnjë porosi.</p>
          { (searchTerm || filterStatus) && <p className="text-sm text-gray-500 dark:text-slate-400">Provoni të ndryshoni filtrat.</p>}
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            {/* ... table head ... */}
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">ID Porosie</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Klienti</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Restoranti</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Statusi</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Totali</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{order.customer_name || order.customer_email || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{order.restaurant_name || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status_display || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{parseFloat(order.total_price).toFixed(2)} €</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{new Date(order.created_at).toLocaleDateString('sq-AL')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <Button variant="icon" onClick={() => handleViewOrderDetails(order)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200" title="Shiko Detajet">
                      <EyeIcon className="h-5 w-5" />
                    </Button>
                    {/* Add other actions like change status if needed */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination */}
      {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center pt-4">
              <Button 
                  onClick={() => handlePageChange(pagination.currentPage - 1)} 
                  disabled={pagination.currentPage === 1 || isLoading}
                  variant="outline"
              >
                  Para
              </Button>
              <span className="text-sm text-gray-700 dark:text-slate-300">
                  Faqja {pagination.currentPage} nga {pagination.totalPages} (Totali: {pagination.count} porosi)
              </span>
              <Button 
                  onClick={() => handlePageChange(pagination.currentPage + 1)} 
                  disabled={pagination.currentPage === pagination.totalPages || isLoading}
                  variant="outline"
              >
                  Pas
              </Button>
          </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={selectedOrder}
          onUpdateStatus={handleStatusChange} // Admin might have different status update logic
          // isAdminView={true} // Potentially pass a prop if modal behaves differently for admin
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;