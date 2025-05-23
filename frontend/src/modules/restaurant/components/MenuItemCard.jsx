import React from 'react';
import Button from '../../../components/Button';
// import HeroIcon from '../../../components/HeroIcon'; // Remove this
import { PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, PlusCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const MenuItemCard = ({ item, onEdit, onDelete, onToggleAvailability, onAddToCart, isRestaurantView = false }) => {
  const displayImage = item.image_url || `https://placehold.co/300x200/FDC830/78350F?text=${encodeURIComponent(item.name)}`;
  
  return (
    <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl ${!item.is_available && !isRestaurantView ? 'opacity-60' : ''}`}>
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img 
          src={displayImage}
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-semibold px-2 py-1 bg-red-600 rounded">
              {isRestaurantView ? 'Jo Aktiv' : 'I Padisponueshëm'}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md sm:text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate" title={item.name}>
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-2 line-clamp-2" title={item.description}>
            {item.description}
          </p>
        )}
        
        <div className="mt-auto"> {/* Pushes price and actions to the bottom */}
          <p className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400 mb-3">
            {parseFloat(item.price).toFixed(2)} €
          </p>

          {isRestaurantView ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => onEdit(item)} variant="outline" size="sm" iconLeft={PencilIcon} fullWidth className="text-xs">
                Modifiko
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => onToggleAvailability(item.id, !item.is_available)} 
                  variant="ghost" 
                  size="icon" 
                  title={item.is_available ? "Bëje jo të disponueshëm" : "Bëje të disponueshëm"}
                  className="p-2"
                >
                  {item.is_available ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                </Button>
                <Button 
                  onClick={() => onDelete(item.id)} 
                  variant="ghost" 
                  size="icon" 
                  title="Fshij Artikullin"
                  className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 p-2"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            item.is_available ? (
              <Button onClick={() => onAddToCart(item)} variant="primary" fullWidth iconLeft={PlusCircleIcon}>
                Shto në Shportë
              </Button>
            ) : (
              <Button variant="secondary" fullWidth disabled iconLeft={InformationCircleIcon}>
                I Padisponueshëm
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
