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
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  
  const [confirmActionProps, setConfirmActionProps] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      confirmText: 'Konfirmo',
      iconType: 'warning'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ activity: 'ALL', approval: 'ALL', category: 'ALL' });
  const [allGlobalCategories, setAllGlobalCategories] = useState([]); // For filter dropdown


  const fetchRestaurantsAndCategories = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [restaurantsData, categoriesData] = await Promise.all([
        adminApi.fetchAllRestaurants(user.token),
        adminApi.fetchAllRestaurantCategories(user.token) // Global categories for filter
      ]);
      setRestaurants(restaurantsData || []);
      setAllGlobalCategories(categoriesData || []);
    } catch (err) {
      console.error("Failed to fetch restaurants or categories:", err);
      const errMsg = err.message || "S'u mund të ngarkoheshin të dhënat.";
      setError(errMsg);
      showError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, showError]);

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
    fetchRestaurantsAndCategories();
  };

  const openConfirmation = (title, message, onConfirmCallback, confirmText = "Konfirmo", iconType = 'warning') => {
    setConfirmActionProps({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
            onConfirmCallback();
            setConfirmActionProps(prev => ({ ...prev, isOpen: false }));
        },
        confirmText,
        iconType
    });
  };


  const handleDelete = async (restaurantId) => {
     try {
        setIsLoading(true);
        // await adminApi.deleteRestaurant(restaurantId, user.token); // TODO: Implement delete in API
        await new Promise(resolve => setTimeout(resolve, 500)); // Mock
        setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
        showSuccess(`Restoranti (ID: ${restaurantId}) u fshi (mock).`);
    } catch (err) { showError(err.message || `Gabim gjatë fshirjes.`); }
    finally { setIsLoading(false); }
  };

  const handleToggleField = async (restaurantId, field, currentValue) => {
    try {
        setIsLoading(true);
        const updatedRestaurant = await adminApi.updateRestaurant(
            restaurantId, 
            { [field]: !currentValue }, 
            user.token
        );
        setRestaurants(prev => prev.map(r => r.id === updatedRestaurant.id ? updatedRestaurant : r));
        showSuccess(`Statusi "${field.replace('is_', '')}" i restorantit u ndryshua.`);
    } catch (err) { showError(err.message || `Gabim gjatë ndryshimit të statusit.`); }
    finally { setIsLoading(false); }
  };


  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const searchTermLower = searchTerm.toLowerCase();
    let matchesSearch = true;
    if (searchTerm) {
        matchesSearch = (
            restaurant.name.toLowerCase().includes(searchTermLower) ||
            (restaurant.address && restaurant.address.toLowerCase().includes(searchTermLower)) ||
            (restaurant.owner_details?.username && restaurant.owner_details.username.toLowerCase().includes(searchTermLower)) ||
            (restaurant.id.toString().includes(searchTermLower))
        );
    }
    
    let matchesActivity = true;
    if (filters.activity !== 'ALL') {
        matchesActivity = restaurant.is_active === (filters.activity === 'ACTIVE');
    }

    let matchesApproval = true;
    if (filters.approval !== 'ALL') {
        matchesApproval = restaurant.is_approved === (filters.approval === 'APPROVED');
    }
    
    let matchesCategory = true;
    if (filters.category !== 'ALL') {
        matchesCategory = restaurant.categories?.some(cat => cat.id.toString() === filters.category);
    }

    return matchesSearch && matchesActivity && matchesApproval && matchesCategory;
  }).sort((a,b) => new Date(b.date_created) - new Date(a.date_created));


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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-form w-full pl-10"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-form w-full pl-10"
            >
              <option value="">Të gjitha Statuset</option>
              <option value="PENDING">Në Pritje</option>
              <option value="APPROVED">Aprovuar</option>
              <option value="REJECTED">Refuzuar</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="INACTIVE">Joaktiv</option>
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