// src/modules/restaurant/components/MenuCategoryCard.jsx
import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

const MenuCategoryCard = ({ category, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex justify-between items-center">
            <div>
                <h3 className="text-md font-semibold text-gray-800">{category.name}</h3>
                {category.description && <p className="text-xs text-gray-500 mt-1">{category.description}</p>}
                {/* <p className="text-xs text-gray-400 mt-1">Order: {category.order || 0}</p> */}
            </div>
            <div className="flex space-x-2">
                <button 
                    onClick={() => onEdit(category)} 
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    aria-label={`Edit category ${category.name}`}
                >
                    <Edit3 size={16} />
                </button>
                <button 
                    onClick={() => onDelete(category)} // Pass category object for name in confirm modal
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    aria-label={`Delete category ${category.name}`}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};
export default MenuCategoryCard;