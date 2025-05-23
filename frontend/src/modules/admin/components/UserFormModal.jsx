// src/modules/admin/components/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import ModalShell from '../../../components/ModalShell';
import Button from '../../../components/Button';
import { adminApi } from '../../../api/adminApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

const UserFormModal = ({ isOpen, onClose, user: existingUser, onSave }) => {
  const { user: adminUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const initialFormData = {
    username: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    status: 'ACTIVE', // This might be deprecated if is_active is used primarily
    is_active: true, // Added for clarity, maps to backend's is_active
    first_name: '', // Optional
    last_name: '', // Optional
    is_staff: false, // Added
    is_available_for_delivery: false, // Added for DELIVERY_PERSONNEL
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (existingUser) {
        setFormData({
          username: existingUser.username || '',
          email: existingUser.email || '',
          password: '', // Keep password blank unless specifically changing
          role: existingUser.role || 'CUSTOMER',
          status: existingUser.status || 'ACTIVE', // Potentially map to is_active
          is_active: existingUser.is_active !== undefined ? existingUser.is_active : true,
          first_name: existingUser.first_name || '',
          last_name: existingUser.last_name || '',
          is_staff: existingUser.is_staff || false,
          is_available_for_delivery: existingUser.is_driver_available || existingUser.is_available_for_delivery || false, // check for driverProfile field
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [existingUser, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Emri i përdoruesit është i detyrueshëm.";
    else if (formData.username.length < 3) newErrors.username = "Emri i përdoruesit duhet të jetë së paku 3 karaktere.";
    
    if (!formData.email.trim()) newErrors.email = "Email është i detyrueshëm.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Formati i email-it është invalid.";
    
    if (!existingUser && !formData.password) newErrors.password = "Fjalëkalimi është i detyrueshëm për përdorues të rinj.";
    else if (formData.password && formData.password.length < 6) newErrors.password = "Fjalëkalimi duhet të jetë së paku 6 karaktere.";
    
    if (!formData.role) newErrors.role = "Roli është i detyrueshëm.";
    // Status validation might be removed if is_active is the primary field
    // if (!formData.status) newErrors.status = "Statusi është i detyrueshëm.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    
    const payload = { ...formData };
    if (!payload.password && existingUser) delete payload.password; // Don't send empty password if not changing for existing user
    if (!payload.first_name) delete payload.first_name; // Don't send if empty
    if (!payload.last_name) delete payload.last_name;   // Don't send if empty
    delete payload.status; // Remove if is_active is primary

    // Ensure is_available_for_delivery is only sent if role is DELIVERY_PERSONNEL
    if (payload.role !== 'DELIVERY_PERSONNEL' && payload.role !== 'DRIVER') {
        delete payload.is_available_for_delivery;
    }


    try {
      let savedUser;
      if (existingUser?.id) {
        const updatePayload = { ...payload };
        delete updatePayload.email; // Email should not be updatable
        savedUser = await adminApi.updateUser(existingUser.id, updatePayload, adminUser.token);
        showSuccess("Përdoruesi u përditësua me sukses!");
      } else {
        savedUser = await adminApi.createUser(payload, adminUser.token);
        showSuccess("Përdoruesi u shtua me sukses!");
      }
      onSave(savedUser);
      onClose();
    } catch (error) {
      console.error("Failed to save user", error);
      const errorMessage = error.response?.data?.detail || error.message || "Gabim gjatë ruajtjes së përdoruesit.";
      showError(errorMessage);
      if (error.response?.data?.errors) {
        setErrors(prev => ({...prev, ...error.response.data.errors}));
      } else if (errorMessage.toLowerCase().includes("username already exists")){
        setErrors(prev => ({...prev, username: "Ky emër përdoruesi ekziston."}));
      } else if (errorMessage.toLowerCase().includes("email already exists")){
        setErrors(prev => ({...prev, email: "Ky email ekziston."}));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={existingUser ? "Modifiko Përdoruesin" : "Shto Përdorues të Ri"} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emri (Opsional)</label>
                <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleChange}
                        className="input-form" />
            </div>
            <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mbiemri (Opsional)</label>
                <input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleChange}
                        className="input-form" />
            </div>
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emri i Përdoruesit</label>
          <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required
                 className={`input-form ${errors.username ? 'input-form-error' : ''}`}/>
          {errors.username && <p className="input-error-message">{errors.username}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required
                 readOnly={!!existingUser} // Make email readOnly if editing
                 className={`input-form ${errors.email ? 'input-form-error' : ''} ${existingUser ? 'bg-gray-100 dark:bg-slate-700 cursor-not-allowed' : ''}`}/>
          {errors.email && <p className="input-error-message">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fjalëkalimi {existingUser ? '(Lëre bosh nëse nuk e ndryshon)' : ''}
          </label>
          <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} 
                 placeholder={existingUser ? "•••••••• (Nuk ndryshon)" : "Vendos fjalëkalimin"}
                 className={`input-form ${errors.password ? 'input-form-error' : ''}`}/>
          {errors.password && <p className="input-error-message">{errors.password}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Roli</label>
            <select name="role" id="role" value={formData.role} onChange={handleChange} required
                    className={`input-form ${errors.role ? 'input-form-error' : ''}`}>
                <option value="CUSTOMER">Klient</option>
                <option value="RESTAURANT_OWNER">Pronar Restoranti</option>
                <option value="DELIVERY_PERSONNEL">Furnizues</option>
                <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="input-error-message">{errors.role}</p>}
            </div>
            <div>
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statusi</label>
            <select 
                name="is_active" 
                id="is_active" 
                value={formData.is_active.toString()} // Convert boolean to string for select value
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))} 
                required
                className={`input-form ${errors.is_active ? 'input-form-error' : ''}`}
            >
                <option value="true">Aktiv</option>
                <option value="false">Joaktiv/Pezulluar</option>
            </select>
            {errors.is_active && <p className="input-error-message">{errors.is_active}</p>}
            </div>
        </div>
        <div className="space-y-2 pt-2">
            <div className="flex items-center">
                <input id="is_staff" name="is_staff" type="checkbox" checked={formData.is_staff} onChange={handleChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"/>
                <label htmlFor="is_staff" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Pjesë e Stafit (Admin Access)</label>
            </div>
            {(formData.role === 'DELIVERY_PERSONNEL' || formData.role === 'DRIVER') && (
                <div className="flex items-center">
                    <input id="is_available_for_delivery" name="is_available_for_delivery" type="checkbox" checked={formData.is_available_for_delivery} onChange={handleChange}
                        className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"/>
                    <label htmlFor="is_available_for_delivery" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Disponueshëm për Dërgesa (për Shoferët)</label>
                </div>
            )}
        </div>
        <div className="pt-3 flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Anulo</Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            {existingUser ? 'Ruaj Ndryshimet' : 'Shto Përdorues'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default UserFormModal;