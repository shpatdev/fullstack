// src/modules/admin/pages/ManageRestaurantsPage.jsx
import React, { useState, useEffect, useCallback, useContext, use } from 'react';
import Button from '../../../components/Button.jsx';
import RestaurantTableRow from '../components/RestaurantTableRow.jsx';
import RestaurantFormModal from '../components/RestaurantFormModal.jsx'; // Corrected import path
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import ToastNotification from '../../../components/ToastNotification.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';
import { adminApi } from '../../../api/adminApi.js';
import { useAuth } from '../../../context/AuthContext.jsx'; // Changed import

const ManageRestaurantsPage = () => {
    const { token } = useAuth(); // Changed usage
    const [restaurants, setRestaurants] = useState([]);
    const [potentialOwners, setPotentialOwners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [restaurantActionTarget, setRestaurantActionTarget] = useState(null);

    const [toast, setToast] = useState({ message: '', type: '', key: 0 });

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type, key: Date.now() });
    }, []);

    const fetchData = useCallback(async () => {
        if (!token) {
            setError("Admin not authenticated.");
            setIsLoading(false);
            setRestaurants([]); setPotentialOwners([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedRestaurants, fetchedOwners] = await Promise.all([
                adminApi.fetchAllRestaurants(token),
                adminApi.fetchPotentialOwners(token) // Ensure this returns users with 'RESTAURANT_OWNER' role or suitable candidates
            ]);
            setRestaurants(fetchedRestaurants);
            setPotentialOwners(fetchedOwners.filter(owner => owner.role === 'RESTAURANT_OWNER' || !owner.role)); // Example filter
        } catch (err) {
            const errMsg = err.message || "Failed to fetch restaurant data.";
            setError(errMsg);
            showToast(errMsg, "error");
            setRestaurants([]); setPotentialOwners([]);
        } finally {
            setIsLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenCreateRestaurantModal = () => {
        setEditingRestaurant(null);
        setIsRestaurantModalOpen(true);
    };

    const handleOpenEditRestaurantModal = (restaurant) => {
        setEditingRestaurant(restaurant);
        setIsRestaurantModalOpen(true);
    };

    const handleCloseRestaurantModal = () => {
        setIsRestaurantModalOpen(false);
        setEditingRestaurant(null);
    };

    const handleSaveRestaurant = async (restaurantData) => { // restaurantData is expected to be FormData
        setActionLoading(true);
        try {
            if (editingRestaurant) {
                await adminApi.updateRestaurant(editingRestaurant.id, restaurantData, token);
                showToast("Restaurant updated successfully!", "success");
            } else {
                await adminApi.createRestaurant(restaurantData, token);
                showToast("Restaurant created successfully!", "success");
            }
            handleCloseRestaurantModal();
            fetchData();
        } catch (err) {
            console.error("Save restaurant error:", err);
            showToast(err.response?.data?.detail || err.message || "Failed to save restaurant.", "error");
            // Do not close modal on error if it's a validation error from backend
            if (err.response?.status === 400) { // Example: Bad request due to validation
                 // Keep modal open
            } else {
                handleCloseRestaurantModal();
            }
            throw err; // Re-throw for form modal to catch if needed for more specific handling
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangeRestaurantStatus = (restaurantId, statusType, newStatusValue) => {
        const restaurant = restaurants.find(r => r.id === restaurantId);
        if (!restaurant) return;

        let actionMessage = "";
        if (statusType === 'approval') {
            actionMessage = `Are you sure you want to ${newStatusValue ? 'approve' : 'reject approval for'} restaurant "${restaurant.name}"?`;
        } else if (statusType === 'activation') {
            actionMessage = `Are you sure you want to ${newStatusValue ? 'activate' : 'suspend'} restaurant "${restaurant.name}"?`;
        }

        setRestaurantActionTarget({
            id: restaurantId,
            actionType: 'changeStatus',
            statusType,
            newStatusValue,
            message: actionMessage
        });
        setIsConfirmModalOpen(true);
    };

    const confirmRestaurantAction = async () => {
        if (!restaurantActionTarget) return;
        setActionLoading(true);
        const { id, actionType, statusType, newStatusValue } = restaurantActionTarget;
        try {
            // For status change, the payload for PATCH should be specific
            const payload = {};
            if (statusType === 'approval') payload.is_approved = newStatusValue;
            if (statusType === 'activation') payload.is_active = newStatusValue;

            await adminApi.updateRestaurant(id, payload, token); // Send only changed fields
            showToast(`Restaurant status updated.`, "success");
            fetchData();
        } catch (err) {
            console.error("Restaurant action error:", err);
            showToast(err.message || "Action failed.", "error");
        } finally {
            setIsConfirmModalOpen(false);
            setRestaurantActionTarget(null);
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <ToastNotification key={toast.key} message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: ''})} />
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800">Restaurant Management</h1>
                <Button onClick={handleOpenCreateRestaurantModal} variant="primary" size="md" disabled={actionLoading || isLoading} iconLeft={<HeroIcon name="plus" className="w-5 h-5"/>}>
                    Create Restaurant
                </Button>
            </div>

            {isLoading && <div className="flex justify-center items-center h-64"><div className="text-xl font-semibold text-gray-700">Loading restaurants...</div></div>}
            {error && restaurants.length === 0 && <div className="text-red-500 bg-red-100 p-4 rounded-md">Error: {error} <Button onClick={fetchData} variant="secondary" size="sm" className="ml-2">Retry</Button></div>}

            {!isLoading && !error && (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3">ID</th>
                            <th scope="col" className="px-4 py-3">Name</th>
                            <th scope="col" className="px-4 py-3">Address</th>
                            <th scope="col" className="px-4 py-3">Owner</th>
                            <th scope="col" className="px-4 py-3">Categories</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                             <th scope="col" className="px-4 py-3">Created</th>
                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                        <tbody>
                            {restaurants.length > 0 ? (
                                restaurants.map(restaurant => (
                                    <RestaurantTableRow
                                        key={restaurant.id}
                                        restaurant={restaurant}
                                        onEdit={handleOpenEditRestaurantModal}
                                        onChangeStatus={handleChangeRestaurantStatus}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-4 py-10 text-center text-gray-500">No restaurants found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <RestaurantFormModal
                isOpen={isRestaurantModalOpen}
                onClose={handleCloseRestaurantModal}
                onSave={handleSaveRestaurant}
                restaurantToEdit={editingRestaurant}
                potentialOwners={potentialOwners}
                isLoading={actionLoading}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmRestaurantAction}
                title={restaurantActionTarget?.actionType === 'delete' ? "Confirm Deletion" : "Confirm Action"}
                message={restaurantActionTarget?.message || "Are you sure?"}
                isLoading={actionLoading}
            />
        </div>
    );
};
export default ManageRestaurantsPage;