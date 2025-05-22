// src/modules/restaurant/components/MenuItemTableRow.jsx
import React from 'react';
import { Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const MenuItemTableRow = ({ item, categoryName, onEdit, onDelete, onToggleAvailability }) => {
    return (
        <tr className="bg-white border-b hover:bg-gray-50 transition-colors">
            <td className="px-6 py-3">
                <div className="flex items-center space-x-3">
                    <img 
                        src={item.image || `https://placehold.co/60x60/eee/ccc?text=${item.name?.substring(0,1) || 'I'}`} 
                        alt={item.name} 
                        className="w-10 h-10 rounded-md object-cover"
                        onError={(e) => e.target.src = 'https://placehold.co/60x60/eee/ccc?text=Img'}
                    />
                    <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500 truncate max-w-xs">{item.description}</p>}
                    </div>
                </div>
            </td>
            <td className="px-6 py-3 text-sm text-gray-600">{categoryName || 'Uncategorized'}</td>
            <td className="px-6 py-3 text-sm font-medium text-gray-700">€{parseFloat(item.price || 0).toFixed(2)}</td>
            <td className="px-6 py-3 text-center">
                <button 
                    onClick={() => onToggleAvailability(item)} 
                    className={`p-1.5 rounded-full transition-colors ${item.is_available ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                    aria-label={item.is_available ? `Deactivate ${item.name}` : `Activate ${item.name}`}
                >
                    {item.is_available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
            </td>
            <td className="px-6 py-3 text-center">
                <div className="flex items-center justify-center space-x-1">
                    <button onClick={() => onEdit(item)} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md" aria-label={`Edit ${item.name}`}>
                        <Edit3 size={16} />
                    </button>
                    <button onClick={() => onDelete(item)} className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md" aria-label={`Delete ${item.name}`}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};
export default MenuItemTableRow;