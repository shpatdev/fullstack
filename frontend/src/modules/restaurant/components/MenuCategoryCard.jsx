// filepath: frontend/src/modules/restaurant/components/MenuCategoryCard.jsx
import React from 'react';
import Button from '../../../components/Button';
import { PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const MenuCategoryCard = ({ category, onEdit, onDelete, onToggleVisibility, onViewItems, isVisible = true }) => {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-400">{category.name}</h3>
          {category.description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 pr-2">{category.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center space-x-1.5">
          {onToggleVisibility && (
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onToggleVisibility(category.id, !isVisible)} 
              title={isVisible ? "Fshih Kategorinë" : "Shfaq Kategorinë"}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {isVisible ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
            </Button>
          )}
          {onEdit && (
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onEdit(category)} 
              title="Modifiko Kategorinë"
              className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(category.id)} 
              title="Fshij Kategorinë"
              className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {category.item_count !== undefined && (
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
          {category.item_count} artikuj në menu
        </p>
      )}

      {onViewItems && (
        <Button onClick={() => onViewItems(category)} variant="outline" size="sm" fullWidth>
          Shiko Artikujt
        </Button>
      )}
    </div>
  );
};

export default MenuCategoryCard;