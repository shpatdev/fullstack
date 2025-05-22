// src/modules/admin/pages/AdminOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../api/adminApi'; // Using mock API
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/Button';
import HeroIcon from '../../../components/HeroIcon';
// import OrderDetailModal from '../../restaurant/components/OrderDetailModal'; // Can reuse or create admin specific
// import ConfirmationModal from '../../../components/ConfirmationModal';

const AdminOrdersPage = () => {
  const { user } = useAuth();
  const { showError } = useNotification(); // showSuccess can be used for actions
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'ALL', dateFrom: '', dateTo: '' });
  
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // const [orderToUpdate, setOrderToUpdate] = useState(null); // For status updates
  // const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // TODO: This mock API for all orders should be implemented in adminApi.js
  // For now, using a modified version of restaurant's mock data
  const fetchAllOrders = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    setError(null);
    try {
      // const data = await adminApi.fetchAllPlatformOrders(user.token, filters); // Implement this
      // Mocking data fetching
      const mockAllOrders = [
        { id: 'ORD78901', customer: { id: 101, name: 'Alba K.', email: 'alba@example.com' }, restaurant: { id: 1, name: "Luigi's Pizzeria" }, driver: { id: 201, name: 'Ben D.'}, items_count: 3, total_amount: "32.00", status: 'DELIVERED', created_at: '2024-05-20T10:00:00Z', delivery_address: 'Rr. Kavajes, Tirane', items: [{id: 1, menu_item_details: {name: "Pizza"}, quantity: 3, price_at_purchase: "10.00"}] },
        { id: 'ORD78902', customer: { id: 102, name: 'Genti P.', email: 'genti@example.com' }, restaurant: { id: 2, name: "Burger Queen" }, driver: { id: 202, name: 'Era S.'}, items_count: 2, total_amount: "18.50", status: 'PREPARING', created_at: '2024-05-22T14:30:00Z', delivery_address: 'Blv. Deshmoret, Tirane', items: [] },
        { id: 'ORD78903', customer: { id: 103, name: 'Linda M.', email: 'linda@example.com' }, restaurant: { id: 3, name: "Sushi Spot" }, driver: null, items_count: 5, total_amount: "55.70", status: 'PENDING', created_at: '2024-05-22T18:15:00Z', delivery_address: 'Rr. Elbasanit, Tirane', items: [] },
        { id: 'ORD78904', customer: { id: 104, name: 'Dritan B.', email: 'dritan@example.com' }, restaurant: {id: 4, name: "Era Restaurant" }, driver: { id: 203, name: 'Leo G.'}, items_count: 1, total_amount: "12.00", status: 'CANCELLED_BY_USER', created_at: '2024-05-19T12:00:00Z', delivery_address: 'Komuna Parisit, Tirane', items: [] },
        { id: 'ORD78905', customer: { id: 105, name: 'Besa C.', email: 'besa@example.com' }, restaurant: { id: 1, name: "Luigi's Pizzeria" }, driver: null, items_count: 2, total_amount: "22.00", status: 'READY_FOR_PICKUP', created_at: '2024-05-23T11:00:00Z', delivery_address: 'Rr. Durresit, Tirane', items: [] },
      ];
      // Simulate filtering based on mock 'filters' state
      let filtered = mockAllOrders;
      if (filters.status !== 'ALL') {
        if (filters.status === 'CANCELLED') filtered = filtered.filter(o => o.status.startsWith('CANCELLED'));
        else filtered = filtered.filter(o => o.status === filters.status);
      }
      // TODO: Add date filtering logic here if dateFrom/dateTo are set

      setOrders(filtered);
    } catch (err) {
      console.error("Failed to fetch all orders:", err);
      setError(err.message || "S'u mund të ngarkoheshin porositë.");
      showError(err.message || "S'u mund të ngarkoheshin porositë.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, filters, showError]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]); // Re-fetch when filters change

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleViewDetails = (order) => {
    setSelectedOrderForDetails(order);
    setIsDetailModalOpen(true); // You would need an OrderDetailModal component
  };

  // const handleUpdateStatus = (orderId, newStatus) => { /* ... for admin actions on order */ };
  // const confirmUpdateStatus = async () => { /* ... */ };


  const displayedOrders = orders.filter(order => {
    const searchTermLower = searchTerm.toLowerCase();
    if (!searchTermLower) return true;
    return (
      order.id.toLowerCase().includes(searchTermLower) ||
      order.customer.name.toLowerCase().includes(searchTermLower) ||
      (order.customer.email && order.customer.email.toLowerCase().includes(searchTermLower)) ||
      order.restaurant.name.toLowerCase().includes(searchTermLower) ||
      (order.driver?.name && order.driver.name.toLowerCase().includes(searchTermLower)) ||
      order.delivery_address.toLowerCase().includes(searchTermLower)
    );
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getStatusPill = (status) => {
    let colorClasses = "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200";
    if (status === 'DELIVERED') colorClasses = 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
    else if (['PREPARING', 'ON_THE_WAY', 'READY_FOR_PICKUP', 'CONFIRMED'].includes(status)) colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
    else if (status === 'PENDING') colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
    else if (status?.startsWith('CANCELLED')) colorClasses = 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
    return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{status?.replace(/_/g, ' ').toLowerCase() || 'E panjohur'}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' });
  };


  return (
    <div className="container mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Të gjitha Porositë e Platformës</h1>
        <Button variant="outline" onClick={fetchAllOrders} isLoading={isLoading} disabled={isLoading}
                iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2 md:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kërko</label>
            <input
              type="text" name="search" id="search" value={searchTerm} onChange={handleSearchChange}
              placeholder="ID, klient, restorant..."
              className="input-form"
            />
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statusi</label>
            <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} className="input-form">
                <option value="ALL">Të gjitha</option>
                <option value="PENDING">Në Pritje</option>
                <option value="CONFIRMED">Konfirmuar</option>
                <option value="PREPARING">Në Përgatitje</option>
                <option value="READY_FOR_PICKUP">Gati për Marrje</option>
                <option value="ON_THE_WAY">Në Rrugë</option>
                <option value="DELIVERED">Dërguar</option>
                <option value="CANCELLED">Anuluar (Të gjitha)</option>
                {/* <option value="CANCELLED_BY_USER">Anuluar nga Klienti</option>
                <option value="CANCELLED_BY_RESTAURANT">Anuluar nga Restoranti</option> */}
            </select>
          </div>
          {/* TODO: Date Filters
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nga Data</label>
            <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="input-form"/>
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deri më Datë</label>
            <input type="date" name="dateTo" id="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="input-form"/>
          </div>
          */}
           <div className="sm:col-span-2 md:col-span-1"> {/* For date filters or apply button */}
                {/* <Button variant="primary" onClick={fetchAllOrders} className="w-full" isLoading={isLoading} disabled={isLoading}>
                    <HeroIcon icon="FunnelIcon" className="h-5 w-5 mr-2"/> Apliko Filtrat
                </Button> */}
            </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div>
        </div>
      )}
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-700/20 dark:text-red-300 p-4 rounded-md mb-6" role="alert">
        <p className="font-bold">Gabim</p> <p>{error}</p>
      </div>}

      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['ID Porosie', 'Klienti', 'Restoranti', 'Shoferi', 'Artikuj', 'Totali', 'Statusi', 'Data', 'Adresa', 'Veprime'].map(header => (
                  <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {displayedOrders.length > 0 ? (
                displayedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">{order.id}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                        <div title={order.customer.name}>{order.customer.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400" title={order.customer.email}>{order.customer.email}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300" title={order.restaurant.name}>{order.restaurant.name}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{order.driver?.name || <span className="italic text-gray-400 dark:text-gray-500">Nuk ka</span>}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">{order.items_count}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 font-semibold">{parseFloat(order.total_amount).toFixed(2)} €</td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">{getStatusPill(order.status)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate" title={order.delivery_address}>{order.delivery_address}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
                       <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)} title="Shiko Detajet" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                         <HeroIcon icon="EyeIcon" className="h-4 w-4" />
                       </Button>
                       {/* Placeholder for more actions
                       <Button variant="ghost" size="sm" title="Ndrysho Statusin" className="text-yellow-600 hover:text-yellow-700">
                         <HeroIcon icon="PencilIcon" className="h-4 w-4" />
                       </Button> */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {orders.length === 0 ? "Nuk ka porosi në platformë." : "Nuk u gjetën porosi që përputhen me kërkimin/filtrat tuaj."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* TODO: Add Pagination */}

      {/* Re-use OrderDetailModal from restaurant module or create a specific one for admin view */}
      {isDetailModalOpen && selectedOrderForDetails && (
         <ModalShell isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Detajet e Porosisë #${selectedOrderForDetails.id}`} className="max-w-lg">
            <div className="p-4 space-y-3">
                <p><strong>Klienti:</strong> {selectedOrderForDetails.customer.name} ({selectedOrderForDetails.customer.email})</p>
                <p><strong>Restoranti:</strong> {selectedOrderForDetails.restaurant.name}</p>
                <p><strong>Shoferi:</strong> {selectedOrderForDetails.driver?.name || "Nuk ka"}</p>
                <p><strong>Statusi:</strong> {selectedOrderForDetails.status}</p>
                <p><strong>Totali:</strong> {parseFloat(selectedOrderForDetails.total_amount).toFixed(2)} €</p>
                <p><strong>Adresa:</strong> {selectedOrderForDetails.delivery_address}</p>
                <p><strong>Data:</strong> {formatDate(selectedOrderForDetails.created_at)}</p>
                <h4 className="font-semibold pt-2 border-t mt-2">Artikujt:</h4>
                {selectedOrderForDetails.items && selectedOrderForDetails.items.length > 0 ? (
                    <ul className="list-disc list-inside text-sm">
                        {selectedOrderForDetails.items.map(item => (
                            <li key={item.id}>{item.quantity}x {item.menu_item_details.name}</li>
                        ))}
                    </ul>
                ) : <p className="text-sm italic">Nuk ka detaje artikujsh (mock).</p>}
                 <div className="flex justify-end pt-3">
                    <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Mbylle</Button>
                </div>
            </div>
         </ModalShell>
      )}
    </div>
  );
};

export default AdminOrdersPage;