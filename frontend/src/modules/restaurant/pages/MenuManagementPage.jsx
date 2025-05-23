// src/modules/restaurant/pages/MenuManagementPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom'; // Added
import { restaurantApi } from '../../../api/restaurantApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from "../../../components/Button";
import { TagIcon, PlusCircleIcon, QueueListIcon, ArrowPathIcon, ExclamationTriangleIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import MenuCategoryCard from "../components/MenuCategoryCard";
import MenuItemTableRow from '../components/MenuItemTableRow';
import MenuCategoryFormModal from '../components/MenuCategoryFormModal';
import MenuItemFormModal from '../components/MenuItemFormModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

const MenuManagementPage = () => {
  const { token } = useAuth();
  const { currentRestaurantId } = useOutletContext(); // Get from layout
  const { showSuccess, showError } = useNotification();

  const [menuCategories, setMenuCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState({ categories: false, items: false, page: true });
  const [error, setError] = useState(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Assuming one menu per restaurant for simplicity, can be fetched or static
  const menuId = currentRestaurantId ? `MENU_RESTAURANT_${currentRestaurantId}` : null; // Example menuId derivation


  const fetchMenuData = useCallback(async () => {
    if (!currentRestaurantId || !token) {
      setError("Restoranti nuk është zgjedhur ose nuk jeni të kyçur.");
      setIsLoading({ categories: false, items: false, page: false });
      return;
    }
    setIsLoading({ categories: true, items: true, page: false }); // page false after initial load attempt
    setError(null);
    try {
      const [categoriesData, itemsData] = await Promise.all([
        restaurantApi.fetchMenuCategories(currentRestaurantId, token),
        restaurantApi.fetchMenuItems(currentRestaurantId, token) // Assuming this fetches all items for the restaurant
      ]);
      setMenuCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (err) {
      console.error("MenuManagement: Failed to fetch menu data:", err);
      const errMsg = err.message || "S'u mund të ngarkoheshin të dhënat e menusë.";
      setError(errMsg);
      showError(errMsg);
    } finally {
      setIsLoading({ categories: false, items: false, page: false });
    }
  }, [currentRestaurantId, token, showError]);

  useEffect(() => {
    if(currentRestaurantId){ // Only fetch if restaurantId is available
        setIsLoading(prev => ({...prev, page: false})); // Initial "page" load is done
        fetchMenuData();
    } else {
        setIsLoading({ categories: false, items: false, page: false });
        setError("Ju lutem zgjidhni një restorant për të menaxhuar menunë.");
    }
  }, [fetchMenuData, currentRestaurantId]);

  const handleOpenCategoryModal = (category = null) => { setEditingCategory(category); setIsCategoryModalOpen(true); };
  const handleSaveCategory = () => { fetchMenuData(); };

  const handleOpenItemModal = (item = null) => { setEditingItem(item); setIsItemModalOpen(true); };
  const handleSaveItem = () => { fetchMenuData(); };
  
  const handleDeleteClick = (id, type, name) => { setItemToDelete({ id, type, name }); setIsConfirmModalOpen(true); };
  
  const confirmDeletion = async () => {
    if (!itemToDelete || !token) return;
    setIsConfirmModalOpen(false);
    const { id, type } = itemToDelete;
    setIsLoading(prev => ({ ...prev, [type === 'category' ? 'categories' : 'items']: true }));
    try {
      if (type === 'category') {
        await restaurantApi.deleteMenuCategory(id, token);
        showSuccess('Kategoria u fshi me sukses.');
      } else {
        await restaurantApi.deleteMenuItem(id, token);
        showSuccess('Artikulli u fshi me sukses.');
      }
      fetchMenuData();
    } catch (err) {
      showError(err.message || `Gabim gjatë fshirjes.`);
    } finally {
       setIsLoading(prev => ({ ...prev, [type === 'category' ? 'categories' : 'items']: false }));
       setItemToDelete(null);
    }
  };
  
  const handleToggleAvailability = async (itemId, newAvailability) => {
    setIsLoading(prev => ({ ...prev, items: true }));
    try {
        const updatedItem = await restaurantApi.updateMenuItem(itemId, { is_available: newAvailability, restaurantId: currentRestaurantId }, token); // Pass restaurantId for mock
        setMenuItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
        showSuccess(`Disponueshmëria e artikullit u ndryshua.`);
    } catch (err) { showError(err.message || "Gabim."); } 
    finally { setIsLoading(prev => ({ ...prev, items: false })); }
  };
  
  const getCategoryName = (categoryId) => menuCategories.find(c => c.id === categoryId)?.name || 'E pa kategorizuar';

  if (isLoading.page) {
    return <div className="flex justify-center items-center h-[calc(100vh-150px)]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  }
  if (error && !currentRestaurantId) { // Show specific error if no restaurant selected
    return <div className="text-center text-red-500 dark:text-red-400 py-10 bg-red-50 dark:bg-red-900/30 p-6 rounded-md">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white flex items-center">
            <QueueListIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
            Menaxhimi i Menusë
        </h1>
        <div className="flex items-center gap-2">
            <Button onClick={fetchMenuData} variant="outline" iconLeft={ArrowPathIcon} isLoading={isLoading} disabled={isLoading}>
                Rifresko
            </Button>
            <Button onClick={() => { setSelectedMenuItem(null); setIsMenuItemModalOpen(true); }} iconLeft={PlusCircleIcon}>
                Shto Artikull të Ri
            </Button>
            <Button onClick={() => { setSelectedCategory(null); setIsCategoryModalOpen(true); }} variant="secondary" iconLeft={TagIcon}>
                Shto Kategori
            </Button>
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white">Kategoritë e Menusë ({menuCategories.length})</h2>
            {isLoading.categories && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>}
        </div>
        {!isLoading.categories && menuCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {menuCategories.sort((a,b) => (a.order || 0) - (b.order || 0)).map(category => (
              <MenuCategoryCard key={category.id} category={category} onEdit={handleOpenCategoryModal}
                onDelete={(id) => handleDeleteClick(id, 'category', category.name)}
                itemCount={menuItems.filter(item => item.categoryId === category.id).length} />
            ))}
          </div>
        )}
        {!isLoading.categories && menuCategories.length === 0 && !error && (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md"><HeroIcon icon="TagIcon" className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"/><p className="text-gray-500 dark:text-gray-400">Nuk ka kategori.</p></div>
        )}
      </section>

      <section>
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-white">Artikujt e Menusë ({menuItems.length})</h2>
            {isLoading.items && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>}
        </div>
        {!isLoading.items && menuItems.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700"><tr>{['Artikulli', 'Përshkrimi', 'Kategoria', 'Çmimi', 'Disponueshmëria', 'Veprime'].map(h=><th key={h} scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {menuItems.sort((a,b) => (getCategoryName(a.categoryId) || '').localeCompare(getCategoryName(b.categoryId) || '') || a.name.localeCompare(b.name)).map((item) => (
                  <MenuItemTableRow key={item.id} item={item} categoryName={getCategoryName(item.categoryId)}
                    onEdit={handleOpenItemModal} onDelete={(id) => handleDeleteClick(id, 'item', item.name)}
                    onToggleAvailability={handleToggleAvailability} />
                ))}
              </tbody>
            </table>
          </div>
        )}
         {!isLoading.items && menuItems.length === 0 && !error && (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md"><HeroIcon icon="QueueListIcon" className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"/><p className="text-gray-500 dark:text-gray-400">Nuk ka artikuj në menu.</p></div>
        )}
         {error && currentRestaurantId && <div className="text-center text-red-500 dark:text-red-400 py-5">{error}</div>}
      </section>
      
      <MenuCategoryFormModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}
        category={editingCategory} onSave={handleSaveCategory} restaurantId={currentRestaurantId} />
      <MenuItemFormModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)}
        item={editingItem} categories={menuCategories} onSave={handleSaveItem}
        restaurantId={currentRestaurantId} menuId={menuId} />
       <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeletion} title={`Konfirmo Fshirjen`}
        message={`Jeni të sigurt që doni të fshini ${itemToDelete?.type === 'category' ? 'kategorinë' : 'artikullin'} "${itemToDelete?.name || ''}"? ${itemToDelete?.type === 'category' ? 'Artikujt brenda saj do mbeten pa kategori.' : ''} Veprim i pakthyeshëm.`}
        confirmText="Fshij" iconType="danger" isLoading={isLoading.categories || isLoading.items} />
    </div>
  );
};

export default MenuManagementPage;