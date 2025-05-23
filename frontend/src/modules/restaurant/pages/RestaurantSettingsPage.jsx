// src/modules/restaurant/pages/RestaurantSettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';
import { useNotification } from '../../../context/NotificationContext.jsx';
import Button from "../../../components/Button.jsx";
import { 
    InformationCircleIcon, ClockIcon, MegaphoneIcon, TagIcon, CheckCircleIcon, BanknotesIcon, 
    BuildingStorefrontIcon, ArrowPathIcon, PhotoIcon, MapPinIcon, PhoneIcon, ExclamationTriangleIcon, Cog6ToothIcon
} from '@heroicons/react/24/outline';

const daysOfWeek = [
  { id: 0, name: 'E Diel' }, { id: 1, name: 'E Hënë' }, { id: 2, name: 'E Martë' },
  { id: 3, name: 'E Mërkurë' }, { id: 4, name: 'E Enjte' }, { id: 5, name: 'E Premte' },
  { id: 6, name: 'E Shtunë' },
];

const SettingSection = ({ title, description, icon: IconComponent, children }) => (
  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
    <div className="flex items-start mb-3">
      {IconComponent && <IconComponent className="h-7 w-7 text-primary-500 dark:text-primary-400 mr-3 mt-1 flex-shrink-0" />}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
        {description && <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const RestaurantSettingsPage = () => {
  const { user, token, fetchAndSetUser } = useAuth();
  const { currentRestaurantId, currentRestaurantName: nameFromContext } = useOutletContext();
  const { showSuccess, showError } = useNotification();
  
  const initialDetails = {
    name: nameFromContext || '', address: '', phone: '', description: '', 
    main_image_url_placeholder: '', // Kjo do të jetë fusha që backend-i pret për URL-në e imazhit
    deliveryTime: '20-30 min', priceRange: '€€', category_ids: [],
  };
  const initialOpeningHours = daysOfWeek.map(day => ({ 
      day_of_week: day.id, open_time: "09:00", close_time: "22:00", is_closed: day.id === 0 
  }));

  const [details, setDetails] = useState(initialDetails);
  const [openingHours, setOpeningHours] = useState(initialOpeningHours);
  const [allGlobalCategories, setAllGlobalCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null); // Për skedarin e ri të fotos
  const [imagePreview, setImagePreview] = useState('');

  const [isLoading, setIsLoading] = useState({ details: false, hours: false, page: true });
  const [errors, setErrors] = useState({});

  const loadRestaurantData = useCallback(async () => {
    if (!currentRestaurantId || !token) {
        setIsLoading({ details: false, hours: false, page: false });
        setDetails(prev => ({ ...initialDetails, name: nameFromContext || '' }));
        setOpeningHours(initialOpeningHours);
        setImagePreview('');
        return;
    }
    setIsLoading({ details: true, hours: true, page: true });
    setErrors({});
    try {
      const [restaurantData, globalCategoriesData] = await Promise.all([
        restaurantApi.fetchRestaurantDetails(currentRestaurantId), // Token shtohet nga apiService
        restaurantApi.fetchAllRestaurantCategoriesGlobal(), // Token shtohet nga apiService
      ]);

      if (restaurantData) {
        setDetails({
          name: restaurantData.name || nameFromContext || '',
          address: restaurantData.address_details?.street ? `${restaurantData.address_details.street}, ${restaurantData.address_details.city}` : (restaurantData.address || ''), // Supozon se address_details mund të jetë nested ose një string i thjeshtë
          phone: restaurantData.phone_number || '',
          description: restaurantData.description || '',
          main_image_url_placeholder: restaurantData.main_image_url_placeholder || '',
          deliveryTime: restaurantData.delivery_time_estimate || '20-30 min',
          priceRange: restaurantData.price_range || '€€',
          category_ids: restaurantData.cuisine_types ? restaurantData.cuisine_types.map(cat => cat.id) : [],
        });
        setImagePreview(restaurantData.main_image_url_placeholder || '');

        if (restaurantData.operating_hours && restaurantData.operating_hours.length > 0) {
            const fetchedHours = restaurantData.operating_hours;
            const fullHours = daysOfWeek.map(day => {
                const found = fetchedHours.find(h => h.day_of_week === day.id);
                return found 
                    ? { ...found, open_time: found.open_time?.substring(0,5) || "09:00", close_time: found.close_time?.substring(0,5) || "22:00" }
                    : { day_of_week: day.id, open_time: "09:00", close_time: "22:00", is_closed: true };
            });
            setOpeningHours(fullHours);
        } else {
            setOpeningHours(initialOpeningHours);
        }
      }
      setAllGlobalCategories(globalCategoriesData || []);
    } catch (error) {
      showError(error.message || "S'u mund të ngarkoheshin të dhënat.");
    } finally {
      setIsLoading({ details: false, hours: false, page: false });
    }
  }, [currentRestaurantId, token, showError, nameFromContext]);

  useEffect(() => { loadRestaurantData(); }, [loadRestaurantData]);

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setImageFile(file); // Ruaj skedarin
        setImagePreview(URL.createObjectURL(file)); // Trego parapamjen
        setDetails(prev => ({ ...prev, main_image_url_placeholder: ''})); // Pastro URL-në e vjetër nëse ka
    }
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
    newHours[index][field] = field === 'is_closed' ? value : value;
    setOpeningHours(newHours);
  };

  const validateDetails = () => { /* ... mbetet si më parë ... */ 
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
    
    const payload = {
        name: details.name,
        description: details.description,
        phone_number: details.phone, // Sigurohu që emrat e fushave përputhen me serializerin e backend-it
        address_str: details.address, // Nëse backend-i pret adresën si string për ta krijuar/përditësuar
        delivery_time_estimate: details.deliveryTime,
        price_range: details.priceRange,
        cuisine_type_ids: details.category_ids, // Backend-i do të presë ID
        // Për imazhin:
        // Nëse ke një endpoint të veçantë për ngarkim fotosh, thirre atë këtu.
        // Përndryshe, nëse RestaurantDetailSerializer pret URL, dërgo URL-në e re (nëse ka)
        // ose lëre backend-in të ruajë atë ekzistuese.
        // Tani për tani, do të dërgojmë vetëm URL-në placeholder nëse ka ndryshuar.
        main_image_url_placeholder: imageFile ? "DO_TE_NGARKOHET_FOTO_E_RE" : details.main_image_url_placeholder,
    };

    // NËSE DO TË DËRGOSH FOTO ME FORMDATA (DUHET MODIFIKIM I APISERVICE DHE BACKEND)
    // const formDataToSubmit = new FormData();
    // Object.keys(payload).forEach(key => {
    //   if (key === 'cuisine_type_ids') {
    //     payload[key].forEach(id => formDataToSubmit.append('cuisine_types', id)); // DRF pret 'cuisine_types' për M2M
    //   } else {
    //     formDataToSubmit.append(key, payload[key]);
    //   }
    // });
    // if (imageFile) {
    //   formDataToSubmit.append('main_image', imageFile, imageFile.name);
    // }

    try {
      // await restaurantApi.updateRestaurantDetails(currentRestaurantId, formDataToSubmit); // NËSE PËRDOR FORMDATA
      const updatedRestaurant = await restaurantApi.updateRestaurantDetails(currentRestaurantId, payload); // Për JSON Payload
      
      // Rifresko emrin te AuthContext nëse ka ndryshuar
      if(user.ownsRestaurants && user.ownsRestaurants[0].id === currentRestaurantId && nameFromContext !== updatedRestaurant.name){
          await fetchAndSetUser(token); 
      } else {
          // Përditëso state-in lokal me përgjigjen nga API
          setDetails(prev => ({
              ...prev,
              name: updatedRestaurant.name,
              main_image_url_placeholder: updatedRestaurant.main_image_url_placeholder,
              // ...përditëso fushat e tjera sipas nevojës
          }));
          setImagePreview(updatedRestaurant.main_image_url_placeholder || '');
          setImageFile(null); // Pastro skedarin e zgjedhur
      }
      showSuccess('Detajet e restorantit u ruajtën me sukses!');
    } catch (error) {
      showError(error.message || 'Gabim gjatë ruajtjes së detajeve.');
      if(error.response?.data) setErrors(error.response.data); // Shfaq gabimet e fushave nga backend-i
    } finally {
      setIsLoading(prev => ({ ...prev, details: false }));
    }
  };

  const handleSaveHours = async (e) => { /* ... mbetet si më parë ... */ 
    e.preventDefault();
    if (!currentRestaurantId) return;
    setIsLoading(prev => ({ ...prev, hours: true }));
    try {
      const formattedHours = openingHours.map(h => ({
          day_of_week: h.day_of_week,
          open_time: h.is_closed ? null : (h.open_time.includes(':') ? h.open_time : `${h.open_time}:00`),
          close_time: h.is_closed ? null : (h.close_time.includes(':') ? h.close_time : `${h.close_time}:00`),
          is_closed: h.is_closed,
      }));
      // Thirrja e restaurantApi.setOpeningHours tani është mock dhe kthen success direkt.
      // Kur të implementosh endpoint-in real, kjo do të bëjë thirrjen.
      await restaurantApi.setOpeningHours(currentRestaurantId, formattedHours);
      showSuccess('Orari i punës u ruajt me sukses!');
    } catch (error) {
      showError(error.message || 'Gabim gjatë ruajtjes së orarit.');
    } finally {
      setIsLoading(prev => ({ ...prev, hours: false }));
    }
  };

  if (isLoading.page) { /* ... mbetet si më parë ... */ }
  if (!currentRestaurantId && !isLoading.page) { /* ... mbetet si më parë ... */ }

  if (error && !isLoading) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
            <Button onClick={fetchRestaurantData} variant="outline" size="sm" className="ml-auto">Provo Përsëri</Button>
        </div>
    );
  }
  
  if (!restaurantData && isLoading) {
    return (
        <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-primary-500" />
        </div>
    );
  }

  if (!restaurantData && !isLoading) {
     return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-200 flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
        <p>Nuk u gjetën të dhëna për restorantin. Sigurohuni që keni zgjedhur një restorant.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white flex items-center">
            <Cog6ToothIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
            Konfigurimet e Restorantit
        </h1>
         <Button onClick={fetchRestaurantData} variant="outline" iconLeft={ArrowPathIcon} isLoading={isLoading && !!restaurantData} disabled={isLoading && !!restaurantData}>
            Rifresko
        </Button>
      </div>

      {isLoading && !restaurantData && (
         <div className="flex justify-center items-center py-10">
            <ArrowPathIcon className="h-10 w-10 animate-spin text-primary-500" />
         </div>
      )}

      {restaurantData && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <SettingSection title="Informacioni Bazë" description="Emri, përshkrimi dhe detajet e kontaktit." icon={BuildingStorefrontIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Emri i Restorantit</label>
                    <input type="text" name="name" id="name" value={details.name} onChange={handleDetailChange} required 
                        className={`input-form mt-1 ${errors.name ? 'input-form-error' : ''}`}/>
                    {errors.name && <p className="input-error-message">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Numri i Telefonit</label>
                    <input type="tel" name="phone" id="phone" value={details.phone} onChange={handleDetailChange} required
                        className={`input-form mt-1 ${errors.phone ? 'input-form-error' : ''}`} />
                    {errors.phone && <p className="input-error-message">{errors.phone}</p>}
                </div>
            </div>
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Adresa e Plotë</label>
                <input type="text" name="address" id="address" value={details.address} onChange={handleDetailChange} required
                    className={`input-form mt-1 ${errors.address ? 'input-form-error' : ''}`} 
                    placeholder="P.sh. Rr. Nëna Terezë, Nr. 10, Prishtinë"
                />
                {errors.address && <p className="input-error-message">{errors.address}</p>}
            </div>
            <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Përshkrimi</label>
            <textarea name="description" id="description" value={details.description} onChange={handleDetailChange} rows="3"
                        className="input-form mt-1"></textarea>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kategoritë e Kuzhinës</label>
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 p-3 border rounded-md max-h-48 overflow-y-auto custom-scrollbar-thin ${errors.category_ids ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}`}>
                    {allGlobalCategories.length > 0 ? allGlobalCategories.map(cat => (
                        <label key={cat.id} htmlFor={`cat-settings-${cat.id}`} className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                            <input type="checkbox" id={`cat-settings-${cat.id}`} name="category_ids" value={cat.id}
                                checked={details.category_ids.includes(cat.id)} onChange={() => handleCategoryChange(cat.id)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-slate-200">{cat.name}</span>
                        </label>
                    )) : <p className="text-xs text-gray-500 dark:text-slate-400 col-span-full text-center italic">Nuk ka kategori globale të definuara.</p>}
                </div>
                {errors.category_ids && <p className="input-error-message mt-1">{errors.category_ids}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div>
                    <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Koha e Dërgesës</label>
                    <select name="deliveryTime" id="deliveryTime" value={details.deliveryTime} onChange={handleDetailChange} className="input-form mt-1">
                        <option value="10-20 min">10-20 min</option> <option value="20-30 min">20-30 min</option>
                        <option value="30-45 min">30-45 min</option> <option value="45-60 min">45-60 min</option> <option value="60-90 min">60-90 min</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Gama e Çmimeve</label>
                    <select name="priceRange" id="priceRange" value={details.priceRange} onChange={handleDetailChange} className="input-form mt-1">
                        <option value="€">€ (Lirë)</option> <option value="€€">€€ (Mesatare)</option> <option value="€€€">€€€ (Shtrenjtë)</option> <option value="€€€€">€€€€ (Shumë Shtrenjtë)</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label htmlFor="imageFileDetails" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Foto Kryesore e Restorantit</label>
                <input type="file" name="imageFileDetails" id="imageFileDetails" accept="image/*" onChange={handleImageChange}
                    className="input-form file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-slate-600 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-slate-500 cursor-pointer"/>
                {imagePreview && <img src={imagePreview} alt="Parapamje" className="mt-3 h-32 w-auto rounded-lg shadow-md object-cover border border-gray-200 dark:border-slate-600"/>}
            </div>

            <div className="pt-3 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isLoading.details} disabled={isLoading.details || isLoading.page}>Ruaj Detajet</Button>
            </div>
          </SettingSection>

          <SettingSection title="Orari i Punës" description="Specifikoni orarin e hapjes dhe mbylljes për çdo ditë." icon={ClockIcon}>
            <div className="space-y-3">
            {openingHours.map((day, index) => (
                <div key={day.day_of_week} className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-3 gap-y-2 p-2 sm:p-3 border border-gray-200 dark:border-slate-600 rounded-md hover:shadow-sm transition-shadow">
                <label htmlFor={`day-${day.day_of_week}-name`} className="text-sm font-medium text-gray-700 dark:text-slate-300 sm:col-span-1">{daysOfWeek.find(d => d.id === day.day_of_week)?.name}</label>
                <div className="sm:col-span-1">
                    <input type="time" id={`open-${day.day_of_week}`} value={day.is_closed ? '' : day.open_time} disabled={day.is_closed} onChange={(e) => handleHourChange(index, 'open_time', e.target.value)} className={`input-form text-sm ${day.is_closed ? 'input-disabled' : ''}`} />
                </div>
                <div className="sm:col-span-1">
                    <input type="time" id={`close-${day.day_of_week}`} value={day.is_closed ? '' : day.close_time} disabled={day.is_closed} onChange={(e) => handleHourChange(index, 'close_time', e.target.value)} className={`input-form text-sm ${day.is_closed ? 'input-disabled' : ''}`} />
                </div>
                <div className="sm:col-span-1 flex items-center justify-start sm:justify-end">
                    <input type="checkbox" id={`closed-${day.day_of_week}`} checked={day.is_closed} onChange={(e) => handleHourChange(index, 'is_closed', e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>
                    <label htmlFor={`closed-${day.day_of_week}`} className="ml-2 text-sm text-gray-700 dark:text-slate-300">Mbyllur</label>
                </div>
                </div>
            ))}
            </div>
            <div className="pt-3 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isLoading.hours} disabled={isLoading.hours || isLoading.page}>Ruaj Orarin</Button>
            </div>
          </SettingSection>
        </form>
      )}
    </div>
  );
};

export default RestaurantSettingsPage;