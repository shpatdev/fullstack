// src/modules/restaurant/pages/MenuManagementPage.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Loader2, PlusCircle, AlertTriangle, ListFilter } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';
import MenuCategoryCard from '../components/MenuCategoryCard.jsx';
import MenuItemTableRow from '../components/MenuItemTableRow.jsx';
import MenuCategoryFormModal from '../components/MenuCategoryFormModal.jsx';
import MenuItemFormModal from '../components/MenuItemFormModal.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx'; // Global

const MenuManagementPage = () => {
    const { currentRestaurant, token } = useAuth();
    const restaurantId = currentRestaurant?.id;
    const { showNotification } = useNotification();

    const [menuCategories, setMenuCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    const [error, setError] = useState(null);
    
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { id: string, type: 'category' | 'item', name: string }
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeFilterCategory, setActiveFilterCategory] = useState('all');

    const fetchCategories = useCallback(async () => {
        if (!restaurantId || !token) { setIsLoadingCategories(false); setMenuCategories([]); return; }
        setIsLoadingCategories(true); setError(null);
        try {
            const data = await restaurantApi.fetchMenuCategories(restaurantId, token);
            setMenuCategories(data.sort((a,b) => (a.order || 0) - (b.order || 0)));
        } catch (err) { 
            setError(err.message || "Failed to load categories"); 
            showNotification(err.message || "Failed to load categories", 'error'); 
            setMenuCategories([]);
        } 
        finally { setIsLoadingCategories(false); }
    }, [restaurantId, token, showNotification]);

    const fetchItems = useCallback(async () => {
        if (!restaurantId || !token) { setIsLoadingItems(false); setMenuItems([]); return; }
        setIsLoadingItems(true); setError(null); // Clear previous general error
        try {
            const data = await restaurantApi.fetchMenuItems(restaurantId, token);
            setMenuItems(data);
        } catch (err) { 
            setError(err.message || "Failed to load menu items"); 
            showNotification(err.message || "Failed to load menu items", 'error'); 
            setMenuItems([]);
        } 
        finally { setIsLoadingItems(false); }
    }, [restaurantId, token, showNotification]);

    useEffect(() => {
        fetchCategories();
        fetchItems();
    }, [fetchCategories, fetchItems]);

    const handleOpenCategoryModal = (category = null) => { setEditingCategory(category); setIsCategoryModalOpen(true); };
    const handleCloseCategoryModal = () => { setEditingCategory(null); setIsCategoryModalOpen(false); };
    const handleSaveCategory = async (categoryData) => {
        let submittingStateSetter = setIsLoadingCategories; // Or a new state for modal submit
        submittingStateSetter(true);
        try {
            // Ensure restaurant ID is part of the payload for backend
            const payload = { ...categoryData, restaurant: restaurantId }; 
            if (payload.id) { // Editing
                await restaurantApi.updateMenuCategory(payload.id, payload, token);
                showNotification('Category updated!', 'success');
            } else { // Creating
                await restaurantApi.createMenuCategory(payload, token);
                showNotification('Category created!', 'success');
            }
            fetchCategories();
        } catch (err) { showNotification(err.message || "Failed to save category.", 'error'); } 
        finally { submittingStateSetter(false); handleCloseCategoryModal(); }
    };

    const handleOpenItemModal = (item = null) => { setEditingItem(item); setIsItemModalOpen(true); };
    const handleCloseItemModal = () => { setEditingItem(null); setIsItemModalOpen(false); };
    const handleSaveItem = async (itemData) => {
        let submittingStateSetter = setIsLoadingItems;
        submittingStateSetter(true);
        try {
             // Ensure menuId is correctly passed or handled by backend
             // The itemData from form includes restaurantId and potentially defaultMenuId for the mock
             // For real API: MenuItem needs ForeignKey to Menu. Menu needs ForeignKey to Restaurant.
             // The `itemData.menuId` from MenuItemFormModal should point to an existing Menu ID for this restaurant.
             const payload = { 
                 ...itemData, 
                 menu: itemData.menuId || currentRestaurant?.defaultMenuId, // Use a valid menu ID
                 // restaurant: restaurantId, // Backend might infer this from menu
                 category: itemData.categoryId, // Send ID
             };
             delete payload.restaurantId; // Usually not sent if menu implies it
             delete payload.menuId; // If backend takes `menu` as the FK field name
             delete payload.categoryId; // If backend takes `category` as the FK field name

            if (itemData.id) {
                await restaurantApi.updateMenuItem(itemData.id, payload, token);
                showNotification('Menu item updated!', 'success');
            } else {
                await restaurantApi.createMenuItem(payload, token);
                showNotification('Menu item created!', 'success');
            }
            fetchItems();
        } catch (err) { showNotification(err.message || "Failed to save menu item.", 'error'); } 
        finally { submittingStateSetter(false); handleCloseItemModal(); }
    };
    
    const handleDeleteRequest = (targetId, type, name) => { 
        setItemToDelete({ id: targetId, type, name }); 
        setIsConfirmDeleteModalOpen(true); 
    };
    const handleCloseConfirmDeleteModal = () => { setItemToDelete(null); setIsConfirmDeleteModalOpen(false); };
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            if (itemToDelete.type === 'category') {
                await restaurantApi.deleteMenuCategory(itemToDelete.id, token);
                showNotification('Category deleted!', 'success');
                fetchCategories(); fetchItems(); 
            } else if (itemToDelete.type === 'item') {
                await restaurantApi.deleteMenuItem(itemToDelete.id, token);
                showNotification('Menu item deleted!', 'success');
                fetchItems();
            }
        } catch (err) { showNotification(err.message || "Deletion failed.", 'error'); } 
        finally { setIsDeleting(false); handleCloseConfirmDeleteModal(); }
    };

    const handleToggleItemAvailability = async (item) => {
        const updatedItemData = { is_available: !item.is_available };
        try {
            await restaurantApi.updateMenuItem(item.id, updatedItemData, token);
            showNotification(`Item "${item.name}" availability updated.`, 'success');
            fetchItems();
        } catch (err) {
            showNotification(err.message || "Failed to update item availability.", 'error');
        }
    };
    
    const filteredMenuItems = activeFilterCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.categoryId === activeFilterCategory || item.category?.id === activeFilterCategory);

     // ... (Rest of the JSX from Gemini's MenuManagementPage) ...
     // Make sure to replace onEdit and onDelete for MenuCategoryCard and MenuItemTableRow
     // to call handleDeleteRequest with the item's name for the confirmation message.
     return (
     <div className="p-6 space-y-8">
         <h1 className="text-3xl font-bold text-gray-800">Menu Management: {currentRestaurant?.name}</h1>

         {error && <div className="p-4 text-red-600 bg-red-100 rounded-md">Error: {error} <button onClick={() => { fetchCategories(); fetchItems(); }} className="ml-2 text-blue-600 underline">Try again</button></div>}

         <section className="bg-white p-6 rounded-xl shadow-lg">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold text-gray-700">Menu Categories</h2>
                 <button onClick={() => handleOpenCategoryModal()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center disabled:opacity-70" disabled={isLoadingCategories || isLoadingItems}>
                     <PlusCircle size={18} className="mr-2" /> Add Category
                 </button>
             </div>
             {isLoadingCategories ? (
                 <div className="flex justify-center items-center h-32"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
             ) : menuCategories.length === 0 ? (
                 <p className="text-gray-500 text-sm">No categories created yet. Add one to get started!</p>
             ) : (
                 <div className="space-y-3">
                     {menuCategories.map(cat => (
                         <MenuCategoryCard 
                             key={cat.id} 
                             category={cat} 
                             onEdit={() => handleOpenCategoryModal(cat)} 
                             onDelete={() => handleDeleteRequest(cat.id, 'category', cat.name)}
                         />
                     ))}
                 </div>
             )}
         </section>

         <section className="bg-white p-6 rounded-xl shadow-lg">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                 <h2 className="text-xl font-semibold text-gray-700">Menu Items</h2>
                 <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="relative flex-grow sm:flex-grow-0">
                         <ListFilter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                         <select value={activeFilterCategory} onChange={(e) => setActiveFilterCategory(e.target.value)}
                             className="appearance-none block w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pl-10 pr-8 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                             disabled={menuCategories.length === 0 && !isLoadingCategories}>
                             <option value="all">All Categories</option>
                             {menuCategories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
                         </select>
                     </div>
                     <button onClick={() => handleOpenItemModal()} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center disabled:opacity-60" disabled={(menuCategories.length === 0 && !isLoadingCategories) || isLoadingItems}>
                         <PlusCircle size={18} className="mr-2" /> Add Menu Item
                     </button>
                 </div>
             </div>
              {menuCategories.length === 0 && !isLoadingCategories && (
                 <p className="text-orange-600 bg-orange-50 p-3 rounded-md text-sm flex items-center"><AlertTriangle size={18} className="inline mr-2 flex-shrink-0" />Please add at least one menu category before adding menu items.</p>
             )}
             {isLoadingItems ? (
                 <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
             ) : (menuCategories.length > 0 && filteredMenuItems.length === 0 && activeFilterCategory !== 'all' && !isLoadingCategories) ? (
                  <p className="text-gray-500 text-sm mt-4">No items found in the selected category "{menuCategories.find(c=>c.id === activeFilterCategory)?.name}". Add some or select 'All Categories'.</p>
             ) : (menuCategories.length > 0 && menuItems.length === 0 && !isLoadingItems && !isLoadingCategories) ? (
                  <p className="text-gray-500 text-sm mt-4">No menu items created yet for this restaurant.</p>
             ) : menuCategories.length > 0 && filteredMenuItems.length > 0 ? (
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                             <tr>
                                 <th scope="col" className="px-6 py-3">Item</th>
                                 <th scope="col" className="px-6 py-3">Category</th>
                                 <th scope="col" className="px-6 py-3">Price</th>
                                 <th scope="col" className="px-6 py-3 text-center">Available</th>
                                 <th scope="col" className="px-6 py-3 text-center">Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                             {filteredMenuItems.map(item => {
                                 const category = menuCategories.find(c => c.id === item.categoryId || c.id === item.category?.id);
                                 return (<MenuItemTableRow key={item.id} item={item} categoryName={category?.name || 'Uncategorized'} onEdit={() => handleOpenItemModal(item)} onDelete={() => handleDeleteRequest(item.id, 'item', item.name)} onToggleAvailability={handleToggleItemAvailability} />);
                             })}
                         </tbody>
                     </table>
                 </div>
             ) : null}
         </section>

         <MenuCategoryFormModal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} onSave={handleSaveCategory} categoryToEdit={editingCategory} isLoading={isLoadingCategories} />
         <MenuItemFormModal isOpen={isItemModalOpen} onClose={handleCloseItemModal} onSave={handleSaveItem} itemToEdit={editingItem} categories={menuCategories} isLoading={isLoadingItems} />
         <ConfirmationModal isOpen={isConfirmDeleteModalOpen} onClose={handleCloseConfirmDeleteModal} onConfirm={handleConfirmDelete} title={`Delete ${itemToDelete?.type === 'category' ? 'Category' : 'Menu Item'}`} message={`Are you sure you want to delete "${itemToDelete?.name || 'this item'}"? ${itemToDelete?.type === 'category' ? 'This might affect menu items associated with it if not handled by the backend.' : ''} This action cannot be undone.`} isLoading={isDeleting}/>
     </div>
 );
};
export default MenuManagementPage;