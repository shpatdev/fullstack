// src/modules/restaurant/components/MenuItemFormModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext.jsx';

const MenuItemFormModal = ({ isOpen, onClose, onSave, itemToEdit, categories = [], isLoading }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [image, setImage] = useState('');
    const { currentRestaurant } = useContext(AuthContext);

    useEffect(() => {
        if (isOpen) { // Reset form when modal opens
            if (itemToEdit) {
                setName(itemToEdit.name || '');
                setDescription(itemToEdit.description || '');
                setPrice(itemToEdit.price || '');
                // Ensure categoryId from itemToEdit is a string for select value comparison if category IDs are strings
                setCategoryId(itemToEdit.categoryId?.toString() || itemToEdit.category?.id?.toString() || (categories.length > 0 ? categories[0].id.toString() : ''));
                setIsAvailable(itemToEdit.is_available !== undefined ? itemToEdit.is_available : true);
                setImage(itemToEdit.image || '');
            } else {
                setName('');
                setDescription('');
                setPrice('');
                setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
                setIsAvailable(true);
                setImage('');
            }
        }
    }, [itemToEdit, isOpen, categories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !price.trim() || !categoryId) {
            alert("Name, price, and category are required."); // Simple validation
            return;
        }
        // Find the default menuId for the current restaurant.
        // Your backend `MenuItem` model needs a `menu` ForeignKey.
        // Your backend API for creating MenuItem needs to accept `menu` (ID of a Menu instance).
        // This implies that for a restaurant, you first need to ensure at least one Menu exists.
        // For now, we'll pass a placeholder or rely on backend to assign to a default.
        const menuId = currentRestaurant?.defaultMenuId || 'UNKNOWN_MENU_ID'; // From AuthContext or fetched

        onSave({
            id: itemToEdit?.id,
            name,
            description,
            price: parseFloat(price).toFixed(2),
            category: categoryId, // Send category ID
            is_available: isAvailable,
            image,
            menu: menuId, // Send the menu ID
            // restaurant field will be inferred by backend based on the menu or explicitly passed if your API needs it.
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"> {/* Increased z-index */}
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{itemToEdit ? 'Edit' : 'Create New'} Menu Item</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                </div>
                <form id="menuItemFormInner" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-grow"> {/* Added id for submit button */}
                    <div>
                        <label htmlFor="itemFormName" className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
                        <input type="text" id="itemFormName" value={name} onChange={(e) => setName(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                     <div>
                        <label htmlFor="itemFormCategory" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                        <select id="itemFormCategory" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required 
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white">
                            <option value="" disabled>Select a category</option>
                            {(categories || []).map(cat => (
                                <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="itemFormPrice" className="block text-sm font-medium text-gray-700 mb-1">Price (€) <span className="text-red-500">*</span></label>
                        <input type="number" id="itemFormPrice" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" min="0" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="itemFormDesc" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea id="itemFormDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div>
                        <label htmlFor="itemFormImage" className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                        <input type="url" id="itemFormImage" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.jpg" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div className="flex items-center pt-1">
                        <input type="checkbox" id="itemFormAvailable" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                        <label htmlFor="itemFormAvailable" className="ml-2 text-sm font-medium text-gray-700">Available for ordering</label>
                    </div>
                </form>
                 <div className="flex justify-end space-x-3 pt-6 border-t mt-auto">
                    <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50">Cancel</button>
                    <button 
                        type="submit" 
                        form="menuItemFormInner" // Associate with the form
                        disabled={isLoading || !categoryId} 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {itemToEdit ? 'Save Changes' : 'Create Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default MenuItemFormModal;