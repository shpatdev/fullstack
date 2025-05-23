import React from 'react';
import Button from '../../../components/Button'; // Assuming Button is in src/components
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const AddressCard = ({ address, onSelect, onEdit, onDelete, isSelected }) => {
  if (!address) return null;

  return (
    <div 
      className={`p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-300 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'}`}
      onClick={() => onSelect && onSelect(address.id.toString())} // Ensure address.id is passed if onSelect expects it
    >
      <div className="flex justify-between items-start">
          <div>
              <p className="font-medium text-gray-800 dark:text-slate-100">{address.street}</p>
              <p className="text-sm text-gray-600 dark:text-slate-300">{address.city}, {address.postal_code}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{address.country}</p>
          </div>
          <div className="flex-shrink-0 space-x-1">
              {onEdit && 
                <Button variant="icon" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(address);}} title="Modifiko">
                    <PencilIcon className="h-4 w-4 text-blue-500"/>
                </Button>
              }
              {onDelete && 
                <Button variant="icon" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(address.id);}} title="Fshij">
                    <TrashIcon className="h-4 w-4 text-red-500"/>
                </Button>
              }
          </div>
      </div>
      {address.is_default_shipping && (
        <span className="mt-1 inline-block text-xs bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full">Primare</span>
      )}
    </div>
  );
};

export default AddressCard;
