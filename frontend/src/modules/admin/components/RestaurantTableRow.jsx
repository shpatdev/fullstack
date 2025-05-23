// src/modules/admin/components/RestaurantTableRow.jsx
import React from "react";
// import HeroIcon from "../../../components/HeroIcon"; // FSHIJE KËTË
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, ShieldExclamationIcon, EyeIcon } from '@heroicons/react/24/outline';
import Button from "../../../components/Button";

const RestaurantTableRow = ({ restaurant, onEdit, onDelete, onToggleActive, onToggleApproval }) => {
  const getApprovalStatusPill = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"><ShieldCheckIcon className="h-4 w-4 mr-1 text-green-500 dark:text-green-300"/>Aprovuar</span>;
      case 'PENDING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"><ShieldExclamationIcon className="h-4 w-4 mr-1 text-yellow-500 dark:text-yellow-300"/>Në Pritje</span>;
      case 'REJECTED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"><ShieldExclamationIcon className="h-4 w-4 mr-1 text-red-500 dark:text-red-300"/>Refuzuar</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">{status}</span>;
    }
  };

  const getActivityStatusPill = (isActive) => {
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
            <img className="h-10 w-10 rounded-md object-cover" src={restaurant.logo_url || `https://ui-avatars.com/api/?name=${restaurant.name[0]}&background=0D8ABC&color=fff`} alt={restaurant.name} />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{restaurant.name}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{restaurant.address_summary || restaurant.city}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{restaurant.owner_email || 'N/A'}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">{restaurant.phone_number || 'N/A'}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {getApprovalStatusPill(restaurant.approval_status)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {getActivityStatusPill(restaurant.is_active)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
        <Button variant="icon" onClick={() => onEdit(restaurant)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200" title="Modifiko">
          <PencilIcon className="h-5 w-5" />
        </Button>
        {restaurant.approval_status !== 'APPROVED' && (
          <Button variant="icon" onClick={() => onToggleApproval(restaurant.id, 'APPROVED')} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200" title="Aprovo">
            <ShieldCheckIcon className="h-5 w-5" />
          </Button>
        )}
        {restaurant.approval_status === 'APPROVED' && restaurant.approval_status !== 'REJECTED' && (
           <Button variant="icon" onClick={() => onToggleApproval(restaurant.id, 'REJECTED')} className="text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300" title="Refuzo">
             <ShieldExclamationIcon className="h-5 w-5" />
           </Button>
        )}
         <Button variant="icon" onClick={() => onToggleActive(restaurant.id, !restaurant.is_active)} 
            className={restaurant.is_active ? "text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300" : "text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"}
            title={restaurant.is_active ? "Çaktivizo" : "Aktivizo"}
        >
          {restaurant.is_active ? <XCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
        </Button>
        <Button variant="icon" onClick={() => onDelete(restaurant.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" title="Fshij">
          <TrashIcon className="h-5 w-5" />
        </Button>
      </td>
    </tr>
  );
};

export default RestaurantTableRow;