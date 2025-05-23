// src/modules/admin/pages/ManageRestaurantsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../api/adminApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/Button';
import { ArrowPathIcon, PlusCircleIcon, MagnifyingGlassIcon, FunnelIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import RestaurantTableRow from '../components/RestaurantTableRow';
import RestaurantFormModal from '../components/RestaurantFormModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

const ManageRestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [allGlobalCategories, setAllGlobalCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Assuming user token is needed for adminApi calls implicitly via apiService
  const { showSuccess, showError } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  
  const [confirmActionProps, setConfirmActionProps] = useState({ isOpen: false });

  const [filters, setFilters] = useState({
    activity: 'ALL', // 'ALL', 'ACTIVE', 'INACTIVE'
    approval: 'ALL', // 'ALL', 'APPROVED', 'PENDING'
    searchTerm: '',
  });

  const fetchRestaurantsAndCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass filters to API call if backend supports it
      // Example: const restaurantsData = await adminApi.fetchAllRestaurants({ 
      //   is_active: filters.activity === 'ACTIVE' ? true : filters.activity === 'INACTIVE' ? false : undefined,
      //   is_approved: filters.approval === 'APPROVED' ? true : filters.approval === 'PENDING' ? false : undefined,
      //   search: filters.searchTerm
      // });
      const [restaurantsData, categoriesData] = await Promise.all([
        adminApi.fetchAllRestaurants(), // Modify to pass filters if backend supports
        adminApi.fetchAllRestaurantCategories()
      ]);
      
      // Apply filtering on frontend if backend doesn't support it (less efficient for large datasets)
      let filteredRestaurants = restaurantsData || [];
      if (filters.activity !== 'ALL') {
        filteredRestaurants = filteredRestaurants.filter(r => r.is_active === (filters.activity === 'ACTIVE'));
      }
      if (filters.approval !== 'ALL') {
        filteredRestaurants = filteredRestaurants.filter(r => r.is_approved === (filters.approval === 'APPROVED'));
      }
      if (filters.searchTerm) {
        const lowerSearchTerm = filters.searchTerm.toLowerCase();
        filteredRestaurants = filteredRestaurants.filter(r => 
            r.name.toLowerCase().includes(lowerSearchTerm) ||
            (r.owner_details?.username && r.owner_details.username.toLowerCase().includes(lowerSearchTerm)) ||
            r.address.toLowerCase().includes(lowerSearchTerm)
        );
      }

      setRestaurants(filteredRestaurants);
      setAllGlobalCategories(categoriesData || []);
    } catch (err) {
      console.error("Failed to fetch restaurants or categories:", err);
      const errMsg = err.message || "S'u mund të ngarkoheshin të dhënat.";
      setError(errMsg);
      showError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, showError, filters]);

  useEffect(() => {
    fetchRestaurantsAndCategories();
  }, [fetchRestaurantsAndCategories]);

  const handleOpenModal = (restaurant = null) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRestaurant(null);
  };

  const handleSaveRestaurant = (savedRestaurant) => {
    // Instead of optimistic update, re-fetch for consistency, 
    // especially since mock API might not return perfectly nested objects.
    fetchRestaurantsAndCategories(); // This will re-apply filters
    handleCloseModal();
  };

  const handleToggleRestaurantActive = async (restaurantId, currentIsActive) => {
    openConfirmation(
        `Ndrysho Statusin e Aktivitetit`,
        `Jeni të sigurt që doni të ${currentIsActive ? 'çaktivizoni' : 'aktivizoni'} këtë restorant?`,
        async () => {
            try {
                setIsLoading(true); // Consider a more specific loading state
                await adminApi.toggleRestaurantActiveStatus(restaurantId, !currentIsActive);
                showSuccess(`Restoranti u ${!currentIsActive ? 'aktivizua' : 'çaktivizua'} me sukses.`);
                fetchRestaurantsAndCategories();
            } catch (err) {
                showError(err.message || "Gabim gjatë ndryshimit të statusit të aktivitetit.");
            } finally {
                setIsLoading(false);
                setConfirmActionProps({ isOpen: false });
            }
        },
        currentIsActive ? "Çaktivizo" : "Aktivizo",
        'warning'
    );
  };

  const handleApproveRestaurant = async (restaurantId) => {
     openConfirmation(
        `Mirato Restorantin`,
        `Jeni të sigurt që doni të miratoni këtë restorant? Ky veprim nuk mund të kthehet.`,
        async () => {
            try {
                setIsLoading(true); // Consider a more specific loading state
                await adminApi.approveRestaurant(restaurantId);
                showSuccess("Restoranti u miratua me sukses.");
                fetchRestaurantsAndCategories();
            } catch (err) {
                showError(err.message || "Gabim gjatë miratimit të restorantit.");
            } finally {
                setIsLoading(false);
                setConfirmActionProps({ isOpen: false });
            }
        },
        "Mirato",
        'success'
    );
  };


  const openConfirmation = (title, message, onConfirmCallback, confirmText = "Konfirmo", iconType = 'warning') => {
    setConfirmActionProps({
        isOpen: true,
        title,
        message,
        onConfirm: async () => { // Make onConfirm async to handle loading states within it
            await onConfirmCallback();
            // No need to setConfirmActionProps({ isOpen: false }) here, callback should handle it or it's handled in finally
        },
        onClose: () => setConfirmActionProps({ isOpen: false }),
        confirmText,
        iconType
    });
  };

  const handleSearchChange = (e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    // Optionally, debounce fetchRestaurantsAndCategories or call it on a search button click
  };

  useEffect(() => {
    fetchRestaurantsAndCategories();
  }, [filters.activity, filters.approval, fetchRestaurantsAndCategories]); // Add searchTerm if it should auto-search

  if (error) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Menaxho Restorantet</h1>
        <div className="flex gap-2">
            <Button onClick={fetchRestaurantsAndCategories} variant="outline" iconLeft={ArrowPathIcon} isLoading={isLoading} disabled={isLoading}>
                Rifresko
            </Button>
            <Button onClick={() => handleOpenModal()} iconLeft={PlusCircleIcon}>
                 Shto Restorant
            </Button>
        </div>
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
              placeholder="Kërko restorant (emër, email, qytet)..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="input-form w-full pl-10"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
            <select
              value={filters.activity}
              onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value }))}
              className="input-form w-full pl-10"
            >
              <option value="ALL">Të gjitha Aktivitetet</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="INACTIVE">Joaktiv</option>
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
            <select
              value={filters.approval}
              onChange={(e) => setFilters(prev => ({ ...prev, approval: e.target.value }))}
              className="input-form w-full pl-10"
            >
              <option value="ALL">Të gjitha Miratimet</option>
              <option value="APPROVED">E Miratuar</option>
              <option value="PENDING">Në Pritje</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && !isModalOpen && !confirmActionProps.isOpen && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div>
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Restoranti', 'Adresa', 'Pronari', 'Kategoritë', 'Krijuar Më', 'Aktiv', 'Miratuar', 'Veprime'].map(header => (
                  <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => (
                  <RestaurantTableRow 
                    key={restaurant.id} 
                    restaurant={restaurant} 
                    onEdit={handleOpenModal}
                    onDelete={(id) => openConfirmation("Konfirmo Fshirjen", `Jeni të sigurt që doni të fshini restorantin "${restaurants.find(r=>r.id===id)?.name || id}"? Ky veprim nuk mund të kthehet.`, () => handleDelete(id), "Fshij", "danger")}
                    onToggleActive={(id, currentVal) => openConfirmation("Ndrysho Statusin e Aktivitetit", `Ndrysho statusin e aktivitetit për restorantin "${restaurants.find(r=>r.id===id)?.name}" në "${!currentVal ? 'Aktiv' : 'Joaktiv'}"?`, () => handleToggleField(id, 'is_active', currentVal))}
                    onToggleApproval={(id, currentVal) => openConfirmation("Nrysho Statusin e Miratimit", `Ndrysho statusin e miratimit për restorantin "${restaurants.find(r=>r.id===id)?.name}" në "${!currentVal ? 'Miratuar' : 'Në Pritje'}"?`, () => handleToggleField(id, 'is_approved', currentVal))}
                    onApprove={(id) => handleApproveRestaurant(id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {restaurants.length === 0 ? "Nuk ka restorante të regjistruara." : "Nuk u gjetën restorante që përputhen me kërkimin/filtrat tuaj."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* TODO: Add Pagination */}

      <RestaurantFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        restaurant={editingRestaurant}
        onSave={handleSaveRestaurant}
      />
      <ConfirmationModal
        isOpen={confirmActionProps.isOpen}
        onClose={() => setConfirmActionProps(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmActionProps.onConfirm}
        title={confirmActionProps.title}
        message={confirmActionProps.message}
        confirmText={confirmActionProps.confirmText}
        iconType={confirmActionProps.iconType}
        isLoading={isLoading} // General loading for any action
      />
    </div>
  );
};

export default ManageRestaurantsPage;