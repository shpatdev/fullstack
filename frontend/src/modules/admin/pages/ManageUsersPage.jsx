// src/modules/admin/pages/ManageUsersPage.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import Button from '../../../components/Button.jsx';
import UserTableRow from '../components/UserTableRow.jsx';
import UserFormModal from '../components/UserFormModal.jsx'; // This is the import in question
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import ToastNotification from '../../../components/ToastNotification.jsx';
import { adminApi } from '../../../api/adminApi.js';
import { useAuth } from '../../../context/AuthContext.jsx'; // Changed import
import HeroIcon from '../../../components/HeroIcon.jsx';

const USER_ROLES = ["CUSTOMER", "RESTAURANT_OWNER", "DRIVER", "ADMIN"];
const USER_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"];


const ManageUsersPage = () => {
    const { token } = useAuth(); // Changed usage
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userActionTarget, setUserActionTarget] = useState(null);

    const [toast, setToast] = useState({ message: '', type: '', key: 0 });

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type, key: Date.now() });
    }, []);

    const fetchUsers = useCallback(async () => {
        if (!token) {
            setError("Admin not authenticated.");
            setIsLoading(false);
            setUsers([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsers = await adminApi.fetchAllUsers(token);
            setUsers(fetchedUsers);
        } catch (err) {
            const errMsg = err.message || "Failed to fetch users.";
            setError(errMsg);
            showToast(errMsg, "error");
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenCreateUserModal = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditUserModal = (user) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData) => {
        setActionLoading(true);
        try {
            if (editingUser) {
                await adminApi.updateUser(editingUser.id, userData, token);
                showToast("User updated successfully!", "success");
            } else {
                await adminApi.createUser(userData, token);
                showToast("User created successfully!", "success");
            }
            handleCloseUserModal();
            fetchUsers();
        } catch (err) {
            console.error("Save user error:", err);
            showToast(err.message || "Failed to save user.", "error");
            throw err;
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangeUserStatus = (userId, newStatus) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        setUserActionTarget({
            id: userId,
            actionType: 'changeStatus',
            newStatus,
            message: `Are you sure you want to change status of user "${user.username || user.email}" to ${newStatus.replace(/_/g, ' ').toUpperCase()}?`
        });
        setIsConfirmModalOpen(true);
    };

    const handleDeleteUser = (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        setUserActionTarget({
            id: userId,
            actionType: 'delete',
            message: `Are you sure you want to delete user "${user.username || user.email}" (ID: ${userId})? This action cannot be undone.`
        });
        setIsConfirmModalOpen(true);
    };

    const confirmUserAction = async () => {
        if (!userActionTarget) return;
        setActionLoading(true);
        const { id, actionType, newStatus } = userActionTarget;
        try {
            if (actionType === 'delete') {
                await adminApi.deleteUser(id, token);
                showToast("User deleted successfully.", "success");
            } else if (actionType === 'changeStatus') {
                await adminApi.updateUser(id, { status: newStatus }, token);
                showToast(`User status changed to ${newStatus.replace(/_/g, ' ').toUpperCase()}.`, "success");
            }
            fetchUsers();
        } catch (err) {
            console.error("User action error:", err);
            showToast(err.message || "Action failed.", "error");
        } finally {
            setIsConfirmModalOpen(false);
            setUserActionTarget(null);
            setActionLoading(false);
        }
    };
    return (
        <div className="space-y-6 p-4 md:p-6">
            <ToastNotification key={toast.key} message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: ''})} />
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
                <Button onClick={handleOpenCreateUserModal} variant="primary" size="md" disabled={actionLoading || isLoading} iconLeft={<HeroIcon name="plus" className="w-5 h-5"/>}>
                    Create User
                </Button>
            </div>

            {isLoading && <div className="flex justify-center items-center h-64"><div className="text-xl font-semibold text-gray-700">Loading users...</div></div>}
            {error && users.length === 0 && <div className="text-red-500 bg-red-100 p-4 rounded-md">Error: {error} <Button onClick={fetchUsers} variant="secondary" size="sm" className="ml-2">Retry</Button></div>}

            {!isLoading && !error && (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3">ID</th>
                            <th scope="col" className="px-4 py-3">Username</th>
                            <th scope="col" className="px-4 py-3">Email</th>
                            <th scope="col" className="px-4 py-3">Role</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3">Joined</th>
                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map(user => (
                                    <UserTableRow
                                        key={user.id}
                                        user={user}
                                        onEdit={handleOpenEditUserModal}
                                        onDelete={handleDeleteUser}
                                        onChangeStatus={handleChangeUserStatus}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-4 py-10 text-center text-gray-500">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={handleCloseUserModal}
                onSave={handleSaveUser}
                userToEdit={editingUser}
                isLoading={actionLoading}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmUserAction}
                title={userActionTarget?.actionType === 'delete' ? "Confirm Deletion" : "Confirm Status Change"}
                message={userActionTarget?.message || "Are you sure?"}
                isLoading={actionLoading}
            />
        </div>
    );
};
export default ManageUsersPage;