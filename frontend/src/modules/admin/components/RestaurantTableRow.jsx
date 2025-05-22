// src/modules/admin/components/RestaurantTableRow.jsx
import React from 'react';
import HeroIcon from '../../../components/HeroIcon';
import Button from '../../../components/Button';

const RestaurantTableRow = ({ restaurant, onEdit, onDelete, onToggleActive, onToggleApproval }) => {
  
  const truncateText = (text, maxLength) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('sq-AL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Datë invalide';
    }
  };
  
  const categoriesString = restaurant.categories && restaurant.categories.length > 0 
    ? restaurant.categories.map(cat => cat.name).join(', ') 
    : <span className="italic text-gray-400 dark:text-gray-500">Pa kategori</span>;

  const activeStatusText = restaurant.is_active ? 'Aktiv' : 'Joaktiv';
  const activeStatusColor = restaurant.is_active ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
  
  const approvalStatusText = restaurant.is_approved ? 'Miratuar' : 'Në Pritje';
  const approvalStatusColor = restaurant.is_approved ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';

  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
      <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        <div className="flex items-center">
            {restaurant.image ? (
                 <img src={restaurant.image} alt={restaurant.name} className="h-10 w-10 rounded-md object-cover mr-3 shadow-sm" />
            ) : (
                <span className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0">
                    <HeroIcon icon="BuildingStorefrontIcon" className="h-5 w-5"/>
                </span>
            )}
            <div>
                <div className="font-semibold text-gray-800 dark:text-gray-100" title={restaurant.name}>{truncateText(restaurant.name, 25) || 'N/A'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {restaurant.id}</div>
            </div>
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs" title={restaurant.address}>
        {truncateText(restaurant.address, 35)}
      </td>
       <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
        {restaurant.owner_details ? (
            <div title={`${restaurant.owner_details.username} (${restaurant.owner_details.email || ''})`}>
                <div>{truncateText(restaurant.owner_details.username, 20)}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{truncateText(restaurant.owner_details.email || '', 20)}</div>
            </div>
        ) : (
            <span className="italic text-gray-400 dark:text-gray-500">Pa pronar</span>
        )}
      </td>
       <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs" title={restaurant.categories?.map(cat => cat.name).join(', ')}>
        {truncateText(restaurant.categories?.map(cat => cat.name).join(', ') || '', 30) || <span className="italic text-gray-400 dark:text-gray-500">Pa kategori</span>}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
        {formatDate(restaurant.date_created)}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-center">
        <button
          onClick={() => onToggleActive(restaurant.id, !restaurant.is_active)}
          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${activeStatusColor} hover:opacity-80 transition-opacity`}
          title={`Kliko për ta bërë ${restaurant.is_active ? 'Joaktiv' : 'Aktiv'}`}
        >
          {activeStatusText}
        </button>
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-center">
        <button
          onClick={() => onToggleApproval(restaurant.id, !restaurant.is_approved)}
          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${approvalStatusColor} hover:opacity-80 transition-opacity`}
          title={`Kliko për ta bërë ${restaurant.is_approved ? 'Në Pritje' : 'të Miratuar'}`}
        >
          {approvalStatusText}
        </button>
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
        <Button variant="ghost" size="sm" onClick={() => onEdit(restaurant)} title="Modifiko Restorantin" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          <HeroIcon icon="PencilSquareIcon" className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(restaurant.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Fshij Restorantin">
          <HeroIcon icon="TrashIcon" className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default RestaurantTableRow;