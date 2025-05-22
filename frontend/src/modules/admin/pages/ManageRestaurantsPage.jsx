// src/modules/admin/pages/ManageRestaurantsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../api/adminApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/Button';
import HeroIcon from '../../../components/HeroIcon';
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


  return (
    <div className="container mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Menaxho Restorantet</h1>
        <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchRestaurantsAndCategories} isLoading={isLoading} disabled={isLoading}
                    iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`}/>}>
                Rifresko
            </Button>
            <Button variant="primary" onClick={() => handleOpenModal()}
                    iconLeft={<HeroIcon icon="PlusCircleIcon" className="h-5 w-5"/>}>
                 Shto Restorant
            </Button>
        </div>
      </div>

       {/* Filters and Search */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2 md:col-span-1">
            <label htmlFor="searchRestaurants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kërko</label>
            <input id="searchRestaurants" type="text" placeholder="Emri, adresa, pronari..." value={searchTerm} onChange={handleSearchChange} className="input-form"/>
          </div>
          <div>
            <label htmlFor="activityFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aktiviteti</label>
            <select id="activityFilter" name="activity" value={filters.activity} onChange={handleFilterChange} className="input-form">
                <option value="ALL">Të gjitha</option> <option value="ACTIVE">Aktiv</option> <option value="INACTIVE">Joaktiv</option>
            </select>
          </div>
          <div>
            <label htmlFor="approvalFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Miratimi</label>
            <select id="approvalFilter" name="approval" value={filters.approval} onChange={handleFilterChange} className="input-form">
                <option value="ALL">Të gjitha</option> <option value="APPROVED">Miratuar</option> <option value="PENDING">Në Pritje</option>
            </select>
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategoria e Kuzhinës</label>
            <select id="categoryFilter" name="category" value={filters.category} onChange={handleFilterChange} className="input-form">
                <option value="ALL">Të gjitha</option>
                {allGlobalCategories.map(cat => <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading && !isModalOpen && !confirmActionProps.isOpen && (
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