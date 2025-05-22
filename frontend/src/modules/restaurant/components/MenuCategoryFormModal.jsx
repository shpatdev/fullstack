// src/modules/restaurant/components/MenuCategoryFormModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx'; // Adjust the import path as necessary

const MenuCategoryFormModal = ({ isOpen, onClose, onSave, categoryToEdit, isLoading }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { currentRestaurant } = useAuth();

    useEffect(() => {
        if (isOpen) { // Reset form when modal becomes visible or categoryToEdit changes
            if (categoryToEdit) {
                setName(categoryToEdit.name || '');
                setDescription(categoryToEdit.description || '');
            } else {
                setName('');
                setDescription('');
            }
        }
    }, [categoryToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Category name cannot be empty."); // Simple validation
            return;
        }
        onSave({
            id: categoryToEdit?.id,
            name,
            description,
            restaurant: currentRestaurant?.id, // Ensure restaurant ID is passed
            order: categoryToEdit?.order || 0 
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"> {/* Increased z-index */}
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">{categoryToEdit ? 'Edit' : 'Create New'} Menu Category</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="catFormName" className="block text-sm font-medium text-gray-700 mb-1">Category Name <span className="text-red-500">*</span></label>
                        <input type="text" id="catFormName" value={name} onChange={(e) => setName(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="catFormDesc" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea id="catFormDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center">
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {categoryToEdit ? 'Save Changes' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default MenuCategoryFormModal;