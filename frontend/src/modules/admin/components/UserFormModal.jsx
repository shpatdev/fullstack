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
    status: 'ACTIVE',
    first_name: '', // Optional
    last_name: '', // Optional
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
          status: existingUser.status || 'ACTIVE',
          first_name: existingUser.first_name || '',
          last_name: existingUser.last_name || '',
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [existingUser, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    if (!formData.status) newErrors.status = "Statusi është i detyrueshëm.";
    
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

    try {
      let savedUser;
      if (existingUser?.id) {
        savedUser = await adminApi.updateUser(existingUser.id, payload, adminUser.token);
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
                 className={`input-form ${errors.email ? 'input-form-error' : ''}`}/>
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
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statusi</label>
            <select name="status" id="status" value={formData.status} onChange={handleChange} required
                    className={`input-form ${errors.status ? 'input-form-error' : ''}`}>
                <option value="ACTIVE">Aktiv</option>
                <option value="SUSPENDED">Pezulluar</option>
                <option value="PENDING_APPROVAL">Në Pritje Miratimi</option>
            </select>
            {errors.status && <p className="input-error-message">{errors.status}</p>}
            </div>
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