// src/modules/admin/components/UserTableRow.jsx
import React from 'react';
import HeroIcon from '../../../components/HeroIcon';
import Button from '../../../components/Button';

const UserTableRow = ({ user, onEdit, onDelete, onToggleStatus, onResetPassword }) => {
  const roleDisplayNames = {
    ADMIN: 'Admin',
    CUSTOMER: 'Klient',
    RESTAURANT_OWNER: 'Pronar Restoranti',
    DELIVERY_PERSONNEL: 'Furnizues',
  };

  const statusDisplayInfo = {
    ACTIVE: { text: 'Aktiv', colorClasses: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' },
    SUSPENDED: { text: 'Pezulluar', colorClasses: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' },
    PENDING_APPROVAL: { text: 'Në Pritje', colorClasses: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' },
    DEACTIVATED: { text: 'Çaktivizuar', colorClasses: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'},
  };

  const currentStatusInfo = statusDisplayInfo[user.status] || { text: user.status, colorClasses: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200' };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('sq-AL', {
        year: 'numeric', month: 'short', day: 'numeric', /* hour: '2-digit', minute: '2-digit' */
      });
    } catch (error) { return "Datë invalide"; }
  };
  
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;

  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {user.id}
      </td>
      <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">
        <div>{fullName}</div>
        {fullName !== user.username && <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</div>}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
        {user.email}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
        {roleDisplayNames[user.role] || user.role}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
        {formatDate(user.date_joined)}
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-center">
        <button
          onClick={() => onToggleStatus(user.id, user.status)}
          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${currentStatusInfo.colorClasses} hover:opacity-80 transition-opacity`}
          title={`Kliko për të ndryshuar statusin (aktual: ${currentStatusInfo.text})`}
        >
          {currentStatusInfo.text}
        </button>
      </td>
      <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(user)} title="Modifiko Përdoruesin" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          <HeroIcon icon="PencilSquareIcon" className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onResetPassword(user.id)} title="Reset Fjalëkalimin" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <HeroIcon icon="KeyIcon" className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Fshij Përdoruesin">
          <HeroIcon icon="TrashIcon" className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default UserTableRow;