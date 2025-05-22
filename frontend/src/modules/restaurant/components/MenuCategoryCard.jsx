// filepath: frontend/src/modules/restaurant/components/MenuCategoryCard.jsx
import React from 'react';
// Removed Edit3, Trash2 from lucide-react
import HeroIcon from '../../../components/HeroIcon.jsx'; // Added HeroIcon

const MenuCategoryCard = ({ category, onEdit, onDelete, itemcount }) => { // Added itemcount
    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow flex justify-between items-center">
            <div>
                <h4 className="text-md font-semibold text-gray-800">{category.name}</h4>
                {category.description && <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>}
                {/* Display item count if provided */}
                {typeof itemcount === 'number' && <p className="text-xs text-gray-400 mt-0.5">{itemcount} item(s) in this category</p>}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                    onClick={() => onEdit(category)}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                    aria-label={`Edit category ${category.name}`}
                    title={`Edit ${category.name}`}
                >
                    <HeroIcon name="pencil" className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(category.id, 'category', category.name)} // Pass type and name for better confirm message
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors"
                    aria-label={`Delete category ${category.name}`}
                    title={`Delete ${category.name}`}
                >
                    <HeroIcon name="trash" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
export default MenuCategoryCard;