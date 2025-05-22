// src/modules/admin/components/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import ModalShell from '../../../components/ModalShell.jsx';
import Button from '../../../components/Button.jsx';

const USER_ROLES = ["CUSTOMER", "RESTAURANT_OWNER", "DRIVER", "ADMIN"]; // Or fetch from constant
const USER_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"]; // Or fetch from constant

const UserFormModal = ({ isOpen, onClose, onSave, userToEdit, isLoading }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    status: 'ACTIVE', // Default status for new users
    // Add other fields as necessary: name, phone_number, etc.
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        password: '', // Password should generally not be pre-filled for editing
        role: userToEdit.role || 'CUSTOMER',
        status: userToEdit.status || 'ACTIVE',
        // ... map other fields from userToEdit
      });
    } else {
      // Reset for new user
      setFormData({
        username: '', email: '', password: '', role: 'CUSTOMER', status: 'ACTIVE',
      });
    }
    setError(''); // Clear error when modal opens or user changes
  }, [userToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.email) {
      setError("Username and Email are required.");
      return;
    }
    if (!userToEdit && !formData.password) { // Password required for new user
        setError("Password is required for new users.");
        return;
    }
    // Add more validation as needed

    try {
      // For editing, you might not want to send an empty password
      const payload = { ...formData };
      if (userToEdit && !payload.password) {
        delete payload.password; // Don't send password if it's not being changed
      }
      await onSave(payload);
      // onClose(); // onSave in ManageUsersPage handles closing on success
    } catch (err) {
      setError(err.message || "Failed to save user. Please try again.");
      // Don't close modal on error, let user correct
    }
  };

  const modalTitle = userToEdit ? "Edit User" : "Create New User";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password {userToEdit ? "(leave blank to keep current)" : ""}
          </label>
          <input type="password" name="password" id="password" value={formData.password} onChange={handleChange}
                 autoComplete="new-password"
                 required={!userToEdit}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
          <select name="role" id="role" value={formData.role} onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            {USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
         <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" id="status" value={formData.status} onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            {USER_STATUSES.map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        {/* Add more form fields here */}
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            {userToEdit ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default UserFormModal;