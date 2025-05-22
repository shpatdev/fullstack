// src/modules/restaurant/components/OrderTableRow.jsx
import React from 'react';
import { Eye } from 'lucide-react';

const OrderTableRow = ({ order, onViewUpdate }) => {
  const { id, user_details, created_at, total_amount, status } = order;
  const formattedDate = new Date(created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusClassAndText = (statusVal) => {
    const s = statusVal?.toUpperCase() || 'UNKNOWN'; 
    let classes = 'px-2 py-0.5 text-xs font-semibold rounded-full inline-block '; 
    let text = s.replace(/_/g, ' ');
    switch (s) {
      case 'PENDING': classes += 'bg-yellow-100 text-yellow-700'; break;
      case 'CONFIRMED': classes += 'bg-blue-100 text-blue-700'; break;
      case 'PREPARING': classes += 'bg-orange-100 text-orange-700'; break;
      case 'READY_FOR_PICKUP': classes += 'bg-purple-100 text-purple-700'; text = 'READY FOR PICKUP'; break;
      case 'DELIVERED': classes += 'bg-green-100 text-green-700'; break;
      case 'CANCELLED_BY_RESTAURANT': classes += 'bg-red-100 text-red-700'; text = 'CANCELLED'; break;
      case 'CANCELLED_BY_USER': classes += 'bg-red-100 text-red-700'; text = 'CANCELLED (USER)'; break; // Example for other cancelled
      case 'ON_THE_WAY': classes += 'bg-indigo-100 text-indigo-700'; text = 'ON THE WAY'; break;
      default: classes += 'bg-gray-100 text-gray-700';
    } return { classes, text };
  };
  const { classes: statusClasses, text: statusText } = getStatusClassAndText(status);

  return (
    <tr className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{id}</td>
      <td className="px-6 py-4 text-gray-600">{user_details?.username || 'N/A'}</td>
      <td className="px-6 py-4 text-gray-500 text-xs">{formattedDate}</td>
      <td className="px-6 py-4 font-medium text-gray-700">€{parseFloat(total_amount || 0).toFixed(2)}</td>
      <td className="px-6 py-4"><span className={statusClasses}>{statusText}</span></td>
      <td className="px-6 py-4 text-center"> 
        <button onClick={() => onViewUpdate(order)} className="font-medium text-blue-600 hover:text-blue-800 text-xs flex items-center justify-center w-full hover:underline"> 
          <Eye className="w-4 h-4 mr-1" /> View/Update 
        </button> 
      </td>
    </tr>
  );
};
export default OrderTableRow;