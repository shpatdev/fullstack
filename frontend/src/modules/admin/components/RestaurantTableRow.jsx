// src/modules/admin/components/RestaurantTableRow.jsx
import React from 'react';
import Button from '../../../components/Button'; // Assuming Button component is in this path
import HeroIcon from '../../../components/HeroIcon'; // Assuming HeroIcon component is in this path

const RestaurantTableRow = ({ restaurant, onEdit, onChangeStatus }) => {
    const {
        id,
        name,
        address,
        owner_details, // Assuming owner details are nested
        categories,
        is_approved,
        is_active,
        created_at
    } = restaurant;

    const formattedDate = new Date(created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const getStatusPill = () => {
        if (!is_approved) {
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending Approval</span>;
        }
        if (is_active) {
            return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Active</span>;
        }
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Suspended</span>;
    };

    const ownerName = owner_details ? owner_details.username : 'N/A'; // Example: Accessing owner's username
    const categoryNames = categories && categories.length > 0 ? categories.map(cat => cat.name).join(', ') : 'No categories';


    return (
        <tr className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{id}</td>
            <td className="px-4 py-3 text-gray-700">{name}</td>
            <td className="px-4 py-3 text-gray-600">{address || 'N/A'}</td>
            <td className="px-4 py-3 text-gray-600">{ownerName}</td>
            <td className="px-4 py-3 text-gray-500 text-xs">{categoryNames}</td>
            <td className="px-4 py-3">{getStatusPill()}</td>
            <td className="px-4 py-3 text-gray-500 text-xs">{formattedDate}</td>
            <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                <Button
                    variant="icon"
                    size="sm"
                    onClick={() => onEdit(restaurant)}
                    aria-label="Edit restaurant"
                    className="text-blue-600 hover:text-blue-800"
                >
                    <HeroIcon name="pencil" className="w-4 h-4" />
                </Button>
                {!is_approved && (
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onChangeStatus(id, 'approval', true)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                        Approve
                    </Button>
                )}
                 {is_approved && is_active && (
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onChangeStatus(id, 'activation', false)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                        Suspend
                    </Button>
                )}
                {is_approved && !is_active && (
                     <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onChangeStatus(id, 'activation', true)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                        Activate
                    </Button>
                )}
            </td>
        </tr>
    );
};

export default RestaurantTableRow;