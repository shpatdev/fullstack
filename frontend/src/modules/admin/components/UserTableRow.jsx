// src/modules/admin/components/UserTableRow.jsx
import React from "react";
// import HeroIcon from "../../../components/HeroIcon"; // FSHIJE KËTË
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, KeyIcon, ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Button from "../../../components/Button";

const UserTableRow = ({ user, onEdit, onDelete, onToggleStatus, onResetPassword }) => {
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'CUSTOMER':
        return 'Klient';
      case 'RESTAURANT_OWNER':
        return 'Pronar Restoranti';
      case 'DELIVERY_PERSONNEL':
        return 'Furnizues';
      default:
        return role;
    }
  };

  const getStatusPill = (isActive) => {
    return isActive ? (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">
        <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500 dark:text-green-300" /> Aktiv
      </span>
    ) : (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100">
        <XCircleIcon className="h-4 w-4 mr-1 text-red-500 dark:text-red-300" /> Joaktiv
      </span>
    );
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img 
                className="h-10 w-10 rounded-full object-cover" 
                src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${user.first_name || user.email[0]}&background=random&color=fff`} 
                alt={`${user.first_name} ${user.last_name}`} 
            />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.first_name} {user.last_name}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{getRoleDisplay(user.role)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{user.phone_number || 'N/A'}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{new Date(user.date_joined).toLocaleDateString('sq-AL')}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {getStatusPill(user.is_active)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
        <Button variant="icon" onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200" title="Modifiko">
          <PencilIcon className="h-5 w-5" />
        </Button>
        <Button variant="icon" onClick={() => onToggleStatus(user.id, !user.is_active)} 
            className={user.is_active ? "text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200" : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"}
            title={user.is_active ? "Çaktivizo" : "Aktivizo"}
        >
          {user.is_active ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
        </Button>
        <Button variant="icon" onClick={() => onResetPassword(user.id)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Reset Fjalëkalimin">
          <KeyIcon className="h-5 w-5" />
        </Button>
        <Button variant="icon" onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" title="Fshij">
          <TrashIcon className="h-5 w-5" />
        </Button>
      </td>
    </tr>
  );
};

export default UserTableRow;