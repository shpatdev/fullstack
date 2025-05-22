// src/modules/customer/components/OrderHistoryItem.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // For future "View Order Detail" page

const OrderHistoryItem = ({ order }) => {
    // Function to get a user-friendly status display
    const getDisplayStatus = (status) => {
        return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A';
    };

    const getStatusColorClass = (status) => {
        const s = status?.toUpperCase();
        if (s === 'DELIVERED') return 'bg-green-100 text-green-700';
        if (s === 'PREPARING' || s === 'ON_THE_WAY' || s === 'CONFIRMED' || s === 'READY_FOR_PICKUP') return 'bg-yellow-100 text-yellow-700';
        if (s && s.includes('CANCELLED')) return 'bg-red-100 text-red-700';
        if (s === 'PENDING') return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow mb-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 pb-3 border-b border-gray-200">
                <div>
                    <h3 className="text-lg font-semibold text-indigo-700">
                        Order ID: <span className="font-bold">{order.id}</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                        Placed on: {new Date(order.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <span className={`mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(order.status)}`}>
                    {getDisplayStatus(order.status)}
                </span>
            </div>
            {order.restaurant_details && 
                <p className="text-sm text-gray-700 mb-2">
                    Restaurant: <span className="font-medium">{order.restaurant_details.name}</span>
                </p>
            }
            <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Items:</p>
                <ul className="list-disc list-inside pl-4 text-sm text-gray-600">
                    {(order.items && order.items.length > 0) ? order.items.map((item, index) => (
                        <li key={index /* Ideally item.id if available from backend OrderItemSerializer */}>
                            {item.quantity} x {item.menu_item_name_at_purchase || item.menu_item_details?.name || 'Unknown Item'}
                        </li>
                    )) : <li>No items information.</li>}
                </ul>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-gray-200">
                <p className="text-md font-semibold text-gray-800 mb-2 sm:mb-0">
                    Total: <span className="text-indigo-700">€{parseFloat(order.total_amount).toFixed(2)}</span>
                </p>
                <Link 
                    // TODO: Create an Order Detail page for customers too
                    to={`/my-orders/${order.id}`} // Example path for a future detailed order view
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2 px-4 rounded-md hover:bg-indigo-50 transition-colors"
                >
                    View Details / Track
                </Link>
            </div>
        </div>
    );
};
export default OrderHistoryItem;