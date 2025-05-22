// src/modules/restaurant/pages/RestaurantSettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom'; // Added
import { useAuth } from '../../../context/AuthContext';
import { restaurantApi } from '../../../api/restaurantApi';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/Button';
import HeroIcon from '../../../components/HeroIcon';

const daysOfWeek = [
  { id: 0, name: 'E Diel' }, { id: 1, name: 'E Hënë' }, { id: 2, name: 'E Martë' },
  { id: 3, name: 'E Mërkurë' }, { id: 4, name: 'E Enjte' }, { id: 5, name: 'E Premte' },
  { id: 6, name: 'E Shtunë' },
];

const RestaurantSettingsPage = () => {
  const { user, token, fetchAndSetUser } = useAuth(); // Added fetchAndSetUser for updating restaurant name in AuthContext
  const { currentRestaurantId, currentRestaurantName: nameFromContext } = useOutletContext();
  const { showSuccess, showError } = useNotification();
  
  const initialDetails = {
    name: '', address: '', phone: '', description: '', image: null, image_url: '',
    deliveryTime: '20-30 min', priceRange: '€€', category_ids: [],
  };
  const initialOpeningHours = daysOfWeek.map(day => ({ 
      day_of_week: day.id, 
      open_time: "09:00", 
      close_time: "22:00", 
      is_closed: day.id === 0 // Example: Sunday closed by default
  }));

  const [details, setDetails] = useState(initialDetails);
  const [openingHours, setOpeningHours] = useState(initialOpeningHours);
  const [allGlobalCategories, setAllGlobalCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState('');

  const [isLoading, setIsLoading] = useState({ details: false, hours: false, page: true });
  const [errors, setErrors] = useState({});

  const loadRestaurantData = useCallback(async () => {
    if (!currentRestaurantId || !token) {
        setIsLoading(prev => ({ ...prev, page: false })); // Stop page loading if no ID/token
        setDetails(initialDetails); // Reset to initial if no data can be fetched
        setOpeningHours(initialOpeningHours);
        setImagePreview('');
        return;
    }
    setIsLoading(prev => ({ ...prev, page: true, details: true, hours: true })); // Indicate sub-sections loading
    setErrors({});
    try {
      const [restaurantData, globalCategoriesData] = await Promise.all([
        restaurantApi.fetchRestaurantDetails(currentRestaurantId, token),
        restaurantApi.fetchAllRestaurantCategoriesGlobal(token)
      ]);

      if (restaurantData) {
        setDetails({
          name: restaurantData.name || nameFromContext || '',
          address: restaurantData.address || '',
          phone: restaurantData.phone || '',
          description: restaurantData.description || '',
          image: null, // Reset file input
          image_url: restaurantData.image || '',
          deliveryTime: restaurantData.deliveryTime || '20-30 min',
          priceRange: restaurantData.priceRange || '€€',
          category_ids: restaurantData.categories ? restaurantData.categories.map(cat => cat.id) : [],
        });
        setImagePreview(restaurantData.image || '');

        if (restaurantData.opening_hours && restaurantData.opening_hours.length > 0) {
            const fetchedHours = restaurantData.opening_hours;
            const fullHours = daysOfWeek.map(day => {
                const found = fetchedHours.find(h => h.day_of_week === day.id);
                return found 
                    ? { ...found, open_time: found.open_time?.substring(0,5) || "09:00", close_time: found.close_time?.substring(0,5) || "22:00" } // Ensure HH:MM
                    : { day_of_week: day.id, open_time: "09:00", close_time: "22:00", is_closed: true }; // Default for missing days
            });
            setOpeningHours(fullHours);
        } else {
            setOpeningHours(initialOpeningHours);
        }
      } else {
        // If no restaurant data, use name from context if available, else reset
        setDetails(prev => ({ ...initialDetails, name: nameFromContext || '' }));
        setOpeningHours(initialOpeningHours);
        setImagePreview('');
      }
      setAllGlobalCategories(globalCategoriesData || []);
      setIsLoading(prev => ({ ...prev, details: false, hours: false }));

    } catch (error) {
      console.error("Settings: Failed to load restaurant data:", error);
      showError(error.message || "S'u mund të ngarkoheshin të dhënat e restorantit.");
      setIsLoading({ details: false, hours: false, page: false });
    } finally {
        setIsLoading(prev => ({ ...prev, page: false }));
    }
  }, [currentRestaurantId, token, showError, nameFromContext]); // Added nameFromContext

  useEffect(() => {
    loadRestaurantData();
  }, [loadRestaurantData]);

  const handleDetailChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        setDetails(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setDetails(prev => ({ ...prev, [name]: value }));
    }
     if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };
  
  const handleCategoryChange = (categoryId) => {
    setDetails(prev => {
        const newCategoryIds = prev.category_ids.includes(categoryId)
            ? prev.category_ids.filter(id => id !== categoryId)
            : [...prev.category_ids, categoryId];
        return {...prev, category_ids: newCategoryIds };
    });
    if(errors.category_ids) setErrors(prev => ({...prev, category_ids: null}));
  };

  const handleHourChange = (index, field, value) => {
    const newHours = [...openingHours];
    if (field === 'is_closed') {
        newHours[index][field] = value; // This is a boolean
    } else {
        newHours[index][field] = value; // For time inputs
    }
    setOpeningHours(newHours);
  };

  const validateDetails = () => { /* ... same as before ... */ 
    const newErrors = {};
    if (!details.name.trim()) newErrors.name = "Emri është i detyrueshëm.";
    if (!details.address.trim()) newErrors.address = "Adresa është e detyrueshme.";
    if (!details.phone.trim()) newErrors.phone = "Telefoni është i detyrueshëm.";
    else if (!/^[0-9\s+\-()]{7,15}$/.test(details.phone)) newErrors.phone = "Formati i telefonit invalid.";
    if(details.category_ids.length === 0) newErrors.category_ids = "Zgjidhni të paktën një kategori."
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!currentRestaurantId || !validateDetails()) return;
    setIsLoading(prev => ({ ...prev, details: true }));
    
    const payload = { ...details };
    if (details.image) {
        payload.image_for_mock = `https://placehold.co/300x200/ccaaee/ffffff?text=${details.name.substring(0,3)}`;
    } else if (details.image_url) {
        payload.image_for_mock = details.image_url; // Keep existing if no new file
    }
    delete payload.image; 
    delete payload.image_url;

    try {
      const updatedRestaurant = await restaurantApi.updateRestaurantDetails(currentRestaurantId, payload, token);
      if(user.ownsRestaurants && user.ownsRestaurants[0].id === currentRestaurantId && user.ownsRestaurants[0].name !== updatedRestaurant.name){
          // If the current restaurant's name changed, refetch user to update sidebar/auth context
          await fetchAndSetUser(token); 
      } else {
          // Manually update details if not refetching user (or if name didn't change)
          setDetails(prev => ({...prev, name: updatedRestaurant.name, image: null, image_url: updatedRestaurant.image}));
          setImagePreview(updatedRestaurant.image || '');
      }
      showSuccess('Detajet u ruajtën!');
    } catch (error) {
      showError(error.message || 'Gabim.');
      if(error.response?.data?.errors) setErrors(error.response.data.errors);
    } finally {
      setIsLoading(prev => ({ ...prev, details: false }));
    }
  };

  const handleSaveHours = async (e) => { /* ... same as before ... */ 
    e.preventDefault();
    if (!currentRestaurantId) return;
    setIsLoading(prev => ({ ...prev, hours: true }));
    try {
      const formattedHours = openingHours.map(h => ({
          ...h,
          open_time: h.is_closed ? null : (h.open_time.includes(':') ? h.open_time : `${h.open_time}:00`),
          close_time: h.is_closed ? null : (h.close_time.includes(':') ? h.close_time : `${h.close_time}:00`),
      }));
      await restaurantApi.setOpeningHours(currentRestaurantId, formattedHours, token);
      showSuccess('Orari u ruajt!');
    } catch (error) {
      showError(error.message || 'Gabim.');
    } finally {
      setIsLoading(prev => ({ ...prev, hours: false }));
    }
  };

  if (isLoading.page && !currentRestaurantId) { // Initial check before data can be fetched
    return <div className="flex justify-center items-center h-[calc(100vh-150px)]"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div></div>;
  }
  if (!currentRestaurantId && !isLoading.page) {
     return <div className="text-center text-red-500 dark:text-red-400 py-10 bg-red-50 dark:bg-red-900/30 p-6 rounded-md">Ju lutem zgjidhni ose caktoni një restorant për të parë konfigurimet.</div>;
  }

  return (
    <div className="container mx-auto space-y-10">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Konfigurimet: {details.name || nameFromContext || "Restoranti"}</h1>

      <form onSubmit={handleSaveDetails} className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1 border-b pb-3 border-gray-200 dark:border-gray-700 flex items-center">
            <HeroIcon icon="InformationCircleIcon" className="h-5 w-5 mr-2.5 text-primary-500"/> Detajet Themelore
        </h2>
        {isLoading.details && <div className="text-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500 mx-auto"></div></div>}
        {!isLoading.details && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emri</label>
                    <input type="text" name="name" id="name" value={details.name} onChange={handleDetailChange} required className={`input-form ${errors.name ? 'input-form-error' : ''}`}/>
                    {errors.name && <p className="input-error-message">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoni</label>
                    <input type="tel" name="phone" id="phone" value={details.phone} onChange={handleDetailChange} required className={`input-form ${errors.phone ? 'input-form-error' : ''}`} />
                    {errors.phone && <p className="input-error-message">{errors.phone}</p>}
                </div>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresa</label>
                    <input type="text" name="address" id="address" value={details.address} onChange={handleDetailChange} required className={`input-form ${errors.address ? 'input-form-error' : ''}`} />
                    {errors.address && <p className="input-error-message">{errors.address}</p>}
                </div>
                <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Përshkrimi</label>
                <textarea name="description" id="description" value={details.description} onChange={handleDetailChange} rows="3" className="input-form"></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategoritë e Kuzhinës</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2 p-3 border border-gray-200 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto custom-scrollbar-thin">
                        {allGlobalCategories.length > 0 ? allGlobalCategories.map(cat => (
                            <label key={cat.id} htmlFor={`cat-${cat.id}`} className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                <input type="checkbox" id={`cat-${cat.id}`} name="category_ids" value={cat.id}
                                    checked={details.category_ids.includes(cat.id)} onChange={() => handleCategoryChange(cat.id)}
                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">{cat.name}</span>
                            </label>
                        )) : <p className="text-xs text-gray-500 dark:text-gray-400 col-span-full text-center">Nuk ka kategori globale.</p>}
                    </div>
                    {errors.category_ids && <p className="input-error-message mt-1">{errors.category_ids}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Koha e Dërgesës</label>
                        <select name="deliveryTime" id="deliveryTime" value={details.deliveryTime} onChange={handleDetailChange} className="input-form">
                            <option value="10-20 min">10-20 min</option> <option value="20-30 min">20-30 min</option>
                            <option value="30-45 min">30-45 min</option> <option value="45-60 min">45-60 min</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gama e Çmimeve</label>
                        <select name="priceRange" id="priceRange" value={details.priceRange} onChange={handleDetailChange} className="input-form">
                            <option value="€">€ (Lirë)</option> <option value="€€">€€ (Mesatare)</option> <option value="€€€">€€€ (Shtrenjtë)</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto Kryesore</label>
                    <input type="file" name="imageFile" id="imageFile" accept="image/*" onChange={handleDetailChange}
                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:shadow-sm file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-gray-600 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-gray-500 cursor-pointer"/>
                    {imagePreview && <img src={imagePreview} alt="Parapamje" className="mt-3 h-32 w-auto rounded-lg shadow-md object-cover"/>}
                </div>

                <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isLoading.details} disabled={isLoading.details || isLoading.page}>Ruaj Detajet</Button>
                </div>
            </>
        )}
      </form>

      <form onSubmit={handleSaveHours} className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1 border-b pb-3 border-gray-200 dark:border-gray-700 flex items-center">
            <HeroIcon icon="ClockIcon" className="h-5 w-5 mr-2.5 text-primary-500"/> Orari i Punës
        </h2>
        {isLoading.hours && <div className="text-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500 mx-auto"></div></div>}
        {!isLoading.hours && (
            <>
                <div className="space-y-3">
                {openingHours.map((day, index) => (
                    <div key={day.day_of_week} className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-2 p-3 border border-gray-200 dark:border-gray-600 rounded-md hover:shadow-sm transition-shadow">
                    <label htmlFor={`day-${day.day_of_week}-name`} className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">{daysOfWeek.find(d => d.id === day.day_of_week)?.name}</label>
                    <div className="sm:col-span-1">
                        <input type="time" id={`open-${day.day_of_week}`} value={day.is_closed ? '' : day.open_time} disabled={day.is_closed} onChange={(e) => handleHourChange(index, 'open_time', e.target.value)} className={`w-full input-form ${day.is_closed ? 'input-disabled' : ''}`} />
                    </div>
                    <div className="sm:col-span-1">
                        <input type="time" id={`close-${day.day_of_week}`} value={day.is_closed ? '' : day.close_time} disabled={day.is_closed} onChange={(e) => handleHourChange(index, 'close_time', e.target.value)} className={`w-full input-form ${day.is_closed ? 'input-disabled' : ''}`} />
                    </div>
                    <div className="sm:col-span-1 flex items-center justify-end sm:justify-start">
                        <input type="checkbox" id={`closed-${day.day_of_week}`} checked={day.is_closed} onChange={(e) => handleHourChange(index, 'is_closed', e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>
                        <label htmlFor={`closed-${day.day_of_week}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">Mbyllur</label>
                    </div>
                    </div>
                ))}
                </div>
                <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isLoading.hours} disabled={isLoading.hours || isLoading.page}>Ruaj Orarin</Button>
                </div>
            </>
        )}
      </form>
    </div>
  );
};

export default RestaurantSettingsPage;