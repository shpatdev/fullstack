// src/modules/admin/components/RestaurantFormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ModalShell from '../../../components/ModalShell';
import Button from '../../../components/Button';
import { adminApi } from '../../../api/adminApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { XMarkIcon, CheckCircleIcon, BuildingStorefrontIcon, UserCircleIcon, PhotoIcon, MapPinIcon, PhoneIcon, ClockIcon, TagIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const RestaurantFormModal = ({ isOpen, onClose, restaurant, onSave }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const initialFormData = {
    name: '',
    address: '',
    phone: '',
    owner_id: '', // Changed from owner to owner_id for clarity with backend
    is_active: true,
    is_approved: false,
    // image: null, // This will be handled by imageFile state
    // image_url: '', // This will be handled by imagePreview state
    category_ids: [], // Changed from categories_text to category_ids
    description: '', 
  };

  const [formData, setFormData] = useState(initialFormData);
  const [potentialOwners, setPotentialOwners] = useState([]);
  const [allGlobalCategories, setAllGlobalCategories] = useState([]); // For multiselect
  const [isLoading, setIsLoading] = useState(false); // General loading for modal data
  const [isSaving, setIsSaving] = useState(false); // Specific loading for save operation
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null); // State for the actual image file
  const [imagePreview, setImagePreview] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formError, setFormError] = useState(null);

  const fetchModalData = useCallback(async () => {
    if (!user?.token || !isOpen) return;
    setIsLoading(true);
    try {
      const [ownersData, categoriesData] = await Promise.all([
        adminApi.fetchPotentialOwners(user.token), // Ensure this API is robust
        adminApi.fetchAllRestaurantCategories(user.token) // Ensure this API returns global categories
      ]);
      setPotentialOwners(ownersData || []);
      setAllGlobalCategories(categoriesData || []);
    } catch (error) {
      console.error("Failed to fetch modal data for restaurant form", error);
      showError(error.message || "S'u mund të ngarkoheshin të dhënat e formularit.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, isOpen, showError]);

  useEffect(() => {
    if (isOpen) {
      fetchModalData();
      if (restaurant) {
        setFormData({
          name: restaurant.name || '',
          address: restaurant.address_details?.street ? `${restaurant.address_details.street}, ${restaurant.address_details.city}` : (restaurant.address || ''),
          phone: restaurant.phone_number || '',
          owner_id: restaurant.owner_details?.id || restaurant.owner || '', // Use owner_details.id if available
          is_active: restaurant.is_active !== undefined ? restaurant.is_active : true,
          is_approved: restaurant.is_approved !== undefined ? restaurant.is_approved : false,
          category_ids: restaurant.cuisine_types ? restaurant.cuisine_types.map(cat => cat.id) : [],
          description: restaurant.description || '',
        });
        setImagePreview(restaurant.main_image_url_placeholder || restaurant.image || '');
        setImageFile(null); // Reset image file on edit
      } else {
        setFormData(initialFormData);
        setImagePreview('');
      }
      setErrors({});
    }
  }, [restaurant, isOpen, fetchModalData]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      setImageFile(file || null); // Store the file object
      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        // If file is removed, revert to original image if editing, or clear if new
        setImagePreview(restaurant?.main_image_url_placeholder || restaurant?.image || '');
      }
    } else if (name === "category_ids") { // Handle multi-select for categories
        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({ ...prev, category_ids: selectedIds }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Emri i restorantit është i detyrueshëm.";
    if (!formData.address.trim()) newErrors.address = "Adresa është e detyrueshme.";
    if (!formData.phone.trim()) newErrors.phone = "Telefoni është i detyrueshëm.";
    else if (!/^[0-9\s+\-()]{7,15}$/.test(formData.phone)) newErrors.phone = "Formati i telefonit invalid.";
    // if (!formData.categories_text.trim()) newErrors.categories_text = "Duhet të specifikoni të paktën një kategori.";
    if (!formData.category_ids || formData.category_ids.length === 0) newErrors.category_ids = "Duhet të zgjidhni të paktën një kategori.";
    if (!restaurant && !formData.owner_id) newErrors.owner_id = "Pronari është i detyrueshëm për restorante të reja.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        setFormError("Ju lutem korrigjoni gabimet në formular.");
        return;
    }
    setFormError(null);
    setIsSaving(true);
    
    const finalPayload = {
      name: formData.name,
      address: formData.address, // Backend might need to parse this into street, city, etc. or expect structured address
      phone_number: formData.phone,
      owner_id: formData.owner_id ? parseInt(formData.owner_id) : null,
      is_active: formData.is_active,
      is_approved: formData.is_approved,
      cuisine_type_ids: formData.category_ids, // Ensure backend expects 'cuisine_type_ids'
      description: formData.description,
    };


    try {
      let savedRestaurant;
      if (restaurant?.id) {
        // Pass imageFile to updateRestaurant
        savedRestaurant = await adminApi.updateRestaurant(restaurant.id, finalPayload, imageFile);
        showSuccess("Restoranti u përditësua me sukses!");
      } else {
        // Pass imageFile to createRestaurant
        savedRestaurant = await adminApi.createRestaurant(finalPayload, imageFile);
        showSuccess("Restoranti u shtua me sukses!");
      }
      onSave(savedRestaurant);
      onClose();
    } catch (error) {
      console.error("Failed to save restaurant", error);
      const errMsg = error.response?.data?.detail || error.message || "Gabim gjatë ruajtjes.";
      showError(errMsg);
      if(error.response?.data?.errors) setErrors(error.response.data.errors);
    } finally {
      setIsSaving(false);
    }
  };

  const TabButton = ({ tabKey, children }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tabKey)}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors
        ${activeTab === tabKey 
          ? 'bg-primary-500 text-white dark:bg-primary-600' 
          : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
    >
      {children}
    </button>
  );

  const SectionIcon = ({ icon: Icon }) => Icon ? <Icon className="h-5 w-5 text-gray-400 dark:text-slate-500 mr-2" /> : null;


  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={restaurant ? "Modifiko Restorantin" : "Shto Restorant të Ri"}
      className="max-w-3xl" // Wider modal for more fields
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-4 border-b border-gray-200 dark:border-slate-700">
            <nav className="flex flex-wrap -mb-px space-x-1 sm:space-x-2" aria-label="Tabs">
                <TabButton tabKey="basic"><SectionIcon icon={BuildingStorefrontIcon}/>Bazike</TabButton>
                <TabButton tabKey="owner"><SectionIcon icon={UserCircleIcon}/>Pronari</TabButton>
                <TabButton tabKey="address"><SectionIcon icon={MapPinIcon}/>Adresa</TabButton>
                <TabButton tabKey="details"><SectionIcon icon={PhotoIcon}/>Detaje</TabButton>
                <TabButton tabKey="hours"><SectionIcon icon={ClockIcon}/>Orari</TabButton>
                <TabButton tabKey="tags"><SectionIcon icon={TagIcon}/>Etiketa</TabButton>
                <TabButton tabKey="delivery"><SectionIcon icon={CurrencyDollarIcon}/>Dërgesa</TabButton>
            </nav>
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 border-b pb-1 mb-3">Informacioni Bazë i Restorantit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emri i Restorantit</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
                                className={`input-form ${errors.name ? 'input-form-error' : ''}`}/>
                        {errors.name && <p className="input-error-message">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoni</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required
                                className={`input-form ${errors.phone ? 'input-form-error' : ''}`}/>
                        {errors.phone && <p className="input-error-message">{errors.phone}</p>}
                    </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresa e Plotë</label>
                  <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required
                         className={`input-form ${errors.address ? 'input-form-error' : ''}`}/>
                  {errors.address && <p className="input-error-message">{errors.address}</p>}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Përshkrimi (Opsional)</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3"
                              className="input-form"></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    <div>
                    <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pronari</label>
                    <select name="owner_id" id="owner_id" value={formData.owner_id} onChange={handleChange}
                            className={`input-form ${errors.owner_id ? 'input-form-error' : ''}`}
                            required={!restaurant} // Required only if creating new restaurant
                    >
                        <option value="">Zgjidh Pronarin</option>
                        {potentialOwners.map(owner => (
                        <option key={owner.id} value={owner.id}>{owner.username} ({owner.email})</option>
                        ))}
                    </select>
                    {errors.owner_id && <p className="input-error-message">{errors.owner_id}</p>}
                    </div>
                    <div>
                        <label htmlFor="category_ids" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Kategoritë e Kuzhinës
                        </label>
                        <select 
                            multiple 
                            name="category_ids" 
                            id="category_ids" 
                            value={formData.category_ids.map(String)} // Value should be array of strings for multi-select
                            onChange={handleChange} 
                            required
                            className={`input-form h-32 ${errors.category_ids ? 'input-form-error' : ''}`}
                        >
                            {allGlobalCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {errors.category_ids && <p className="input-error-message">{errors.category_ids}</p>}
                        
                    </div>
                </div>


                <div className="flex items-center space-x-6 pt-2">
                    <div className="flex items-center">
                        <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange}
                            className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"/>
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Aktiv</label>
                    </div>
                    <div className="flex items-center">
                        <input id="is_approved" name="is_approved" type="checkbox" checked={formData.is_approved} onChange={handleChange}
                            className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"/>
                        <label htmlFor="is_approved" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Miratuar</label>
                    </div>
                </div>
            </div>
        )}

        {/* Owner Info Tab */}
        {activeTab === 'owner' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 border-b pb-1 mb-3">Informacioni i Pronarit</h3>
                {/* Owner information fields can be added here if needed */}
            </div>
        )}
        
        {/* Address Tab */}
        {activeTab === 'address' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 border-b pb-1 mb-3">Adresa e Restorantit</h3>
                {/* Address fields are already in the Basic Info tab, consider removing duplicates */}
            </div>
        )}

        {/* Details Tab (Logo, Cover, etc.) */}
        {activeTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 border-b pb-1 mb-3">Detajet Vizuale</h3>
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto e Restorantit (Opsionale)</label>
                    <input type="file" name="image" id="image" accept="image/*" onChange={handleChange}
                           className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-md file:border-0 file:shadow-sm
                                      file:text-sm file:font-semibold
                                      file:bg-primary-50 dark:file:bg-gray-600 file:text-primary-700 dark:file:text-primary-300
                                      hover:file:bg-primary-100 dark:hover:file:bg-gray-500 cursor-pointer" />
                    {imagePreview && (
                        <div className="mt-3 relative group w-32 h-32">
                            <img src={imagePreview} alt="Parapamje" className="h-32 w-32 rounded-md object-cover shadow-md"/>
                             <Button variant="icon" color="danger" size="xs" type="button" 
                                    onClick={() => { 
                                        setImageFile(null); 
                                        // If editing, revert to original image, else clear
                                        setImagePreview(restaurant?.main_image_url_placeholder || restaurant?.image || '');
                                    }}
                                    className="absolute top-1 right-1 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity !rounded-full bg-red-500 hover:bg-red-600 text-white"
                                    title="Hiq foton e re / Kthe foton origjinale">
                                <XMarkIcon className="h-3 w-3"/>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Opening Hours Tab */}
        {activeTab === 'hours' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 border-b pb-1 mb-3">Orari i Punës</h3>
                {/* Opening hours fields can be added here */}
            </div>
        )}

        {/* Tags & Categories Tab */}
        {activeTab === 'tags' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 border-b pb-1 mb-3">Kategoritë dhe Etiketat</h3>
                {/* Tags and categories management can be added here */}
            </div>
        )}

        {/* Delivery Options Tab */}
        {activeTab === 'delivery' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 border-b pb-1 mb-3">Opsionet e Dërgesës</h3>
                {/* Delivery options fields can be added here */}
            </div>
        )}


        <div className="pt-5 flex flex-col sm:flex-row justify-end items-center gap-3 border-t border-gray-200 dark:border-slate-700">
          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
          <Button type="button" variant="ghost" onClick={onClose} iconLeft={XMarkIcon} disabled={isSaving}>
            Anulo
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isSaving || isLoading} iconLeft={CheckCircleIcon}>
            {restaurant ? 'Ruaj Ndryshimet' : 'Shto Restorantin'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default RestaurantFormModal;