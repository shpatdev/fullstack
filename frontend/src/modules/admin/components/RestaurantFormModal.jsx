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
    owner: '', // Will store owner ID
    is_active: true,
    is_approved: false,
    image: null, // For file object
    image_url: '', // For displaying existing or new image preview
    categories_text: '', // Comma-separated category names for input
    // category_ids: [], // If backend expects array of IDs directly
    description: '', // Added description field
  };

  const [formData, setFormData] = useState(initialFormData);
  const [potentialOwners, setPotentialOwners] = useState([]);
  const [allGlobalCategories, setAllGlobalCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formError, setFormError] = useState(null);
  const isSaving = isLoading; // Reuse isLoading for saving state

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
          address: restaurant.address || '',
          phone: restaurant.phone || '',
          owner: restaurant.owner || '',
          is_active: restaurant.is_active !== undefined ? restaurant.is_active : true,
          is_approved: restaurant.is_approved !== undefined ? restaurant.is_approved : false,
          image: null,
          image_url: restaurant.image || '', // Keep existing image URL for display
          categories_text: restaurant.categories ? restaurant.categories.map(c => c.name).join(', ') : '',
          description: restaurant.description || '',
        });
        setImagePreview(restaurant.image || '');
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
      if (file) {
        setFormData(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
      }
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
    if (!formData.categories_text.trim()) newErrors.categories_text = "Duhet të specifikoni të paktën një kategori.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    
    // For a real API, you'd use FormData for file uploads.
    // The mock API `adminApi.js` expects a JSON-like object and handles image as a string.
    // We will prepare a payload suitable for the mock API.
    const payload = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      owner: formData.owner ? parseInt(formData.owner) : null,
      is_active: formData.is_active,
      is_approved: formData.is_approved,
      categories_text: formData.categories_text, // Mock API will parse this
      description: formData.description,
    };

    if (formData.image) {
      // For mock: if a new image is selected, use a placeholder. A real API would handle the file.
      payload.image = `https://placehold.co/100x100/E81123/white?text=${formData.name.substring(0,3)}`;
    } else if (restaurant?.image) {
      // If no new image, but an old one exists, keep it (mock behavior)
      payload.image = restaurant.image;
    }


    try {
      let savedRestaurant;
      if (restaurant?.id) {
        savedRestaurant = await adminApi.updateRestaurant(restaurant.id, payload, user.token);
        showSuccess("Restoranti u përditësua me sukses!");
      } else {
        savedRestaurant = await adminApi.createRestaurant(payload, user.token);
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
      setIsLoading(false);
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
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange}
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
                    <label htmlFor="owner" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pronari (Opsional)</label>
                    <select name="owner" id="owner" value={formData.owner} onChange={handleChange}
                            className="input-form">
                        <option value="">Zgjidh Pronarin</option>
                        {potentialOwners.map(owner => (
                        <option key={owner.id} value={owner.id}>{owner.username} ({owner.email})</option>
                        ))}
                    </select>
                    </div>
                    <div>
                        <label htmlFor="categories_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Kategoritë (ndani me presje)
                        </label>
                        <input type="text" name="categories_text" id="categories_text" value={formData.categories_text} onChange={handleChange} required
                                placeholder="P.sh. Italiane, Pica, Ushqim i Shpejtë"
                                className={`input-form ${errors.categories_text ? 'input-form-error' : ''}`}/>
                        {errors.categories_text && <p className="input-error-message">{errors.categories_text}</p>}
                        {allGlobalCategories.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Sugjerime: {allGlobalCategories.slice(0,5).map(c => c.name).join(', ')}{allGlobalCategories.length > 5 ? '...' : ''}
                            </p>
                        )}
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
                             <Button variant="danger" size="sm" type="button" 
                                    onClick={() => { setFormData(prev => ({...prev, image: null, image_url: restaurant?.image || ''})); setImagePreview(restaurant?.image || '');}}
                                    className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity !rounded-full"
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
          <Button type="button" variant="ghost" onClick={onClose} iconLeft={XMarkIcon}>
            Anulo
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isSaving} iconLeft={CheckCircleIcon}>
            {restaurant ? 'Ruaj Ndryshimet' : 'Shto Restorantin'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default RestaurantFormModal;