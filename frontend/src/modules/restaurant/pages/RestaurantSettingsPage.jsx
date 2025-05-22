// filepath: frontend/src/modules/restaurant/pages/RestaurantSettingsPage.jsx
import React, { useState, useEffect } from 'react'; // Removed useContext if not used elsewhere
import { Loader2, Save, Image as ImageIcon, Clock, Phone, Info, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx'; // Changed import
import { useNotification } from '../../../context/NotificationContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';
import HeroIcon from '../../../components/HeroIcon.jsx';

const RestaurantSettingsPage = () => {
    const { currentRestaurant, token, selectRestaurant } = useAuth(); // Usage is correct
    const { showNotification } = useNotification();

    const [details, setDetails] = useState({
        name: '', address: '', phone: '', description: '', image: null, image_url: '',
    });
    const [openingHours, setOpeningHours] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHoursLoading, setIsHoursLoading] = useState(false);
    const [newImageFile, setNewImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        if (currentRestaurant) {
            setDetails({
                name: currentRestaurant.name || '',
                address: currentRestaurant.address || '',
                phone: currentRestaurant.phone || '',
                description: currentRestaurant.description || '',
                image_url: currentRestaurant.image || '', // Assuming backend provides 'image' as URL
                image: null, // Reset file input
            });
            setImagePreview(currentRestaurant.image || null);
            fetchOpeningHours();
        }
    }, [currentRestaurant]);

    const fetchOpeningHours = async () => {
        if (!currentRestaurant?.id || !token) return;
        setIsHoursLoading(true);
        try {
            const hours = await restaurantApi.fetchOpeningHours(currentRestaurant.id, token);
            // Ensure all days are present, even if not in API response (for UI consistency)
            const allDaysHours = weekdays.map((day, index) => {
                const existing = hours.find(h => h.day_of_week === index);
                return existing || { day_of_week: index, open_time: '', close_time: '', is_closed: true, restaurant: currentRestaurant.id };
            });
            setOpeningHours(allDaysHours.sort((a,b) => a.day_of_week - b.day_of_week));
        } catch (error) {
            showNotification('Failed to load opening hours: ' + error.message, 'error');
        } finally {
            setIsHoursLoading(false);
        }
    };

    const handleDetailsChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        if (!currentRestaurant?.id || !token) return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', details.name);
            formData.append('address', details.address);
            formData.append('phone', details.phone);
            formData.append('description', details.description);
            if (newImageFile) {
                formData.append('image', newImageFile);
            }

            const updatedRestaurant = await restaurantApi.updateRestaurantDetails(currentRestaurant.id, formData, token);
            selectRestaurant(updatedRestaurant); // Update currentRestaurant in AuthContext
            showNotification('Restaurant details updated successfully!', 'success');
            setNewImageFile(null); // Reset file input state
        } catch (error) {
            showNotification('Failed to update details: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHourChange = (index, field, value) => {
        const updatedHours = [...openingHours];
        updatedHours[index] = { ...updatedHours[index], [field]: value };
        if (field === 'is_closed' && value === true) {
            updatedHours[index].open_time = '';
            updatedHours[index].close_time = '';
        }
        setOpeningHours(updatedHours);
    };

    const handleSaveOpeningHours = async () => {
        if (!currentRestaurant?.id || !token) return;
        setIsHoursLoading(true);
        try {
            // API should handle create or update for each day
            await restaurantApi.updateOpeningHours(currentRestaurant.id, openingHours, token);
            showNotification('Opening hours updated successfully!', 'success');
            fetchOpeningHours(); // Re-fetch to confirm
        } catch (error) {
            showNotification('Failed to update opening hours: ' + error.message, 'error');
        } finally {
            setIsHoursLoading(false);
        }
    };


    if (!currentRestaurant) {
        return <div className="p-6 text-center text-gray-600">Please select a restaurant to manage its settings.</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800">Restaurant Settings: {currentRestaurant.name}</h1>

            {/* Restaurant Details Form */}
            <form onSubmit={handleSaveDetails} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-5">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="res-settings-name" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                        <input type="text" name="name" id="res-settings-name" value={details.name} onChange={handleDetailsChange} className="input-style w-full" required />
                    </div>
                    <div>
                        <label htmlFor="res-settings-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="w-4 h-4 text-gray-400"/></div>
                           <input type="tel" name="phone" id="res-settings-phone" value={details.phone} onChange={handleDetailsChange} className="input-style w-full pl-10" />
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="res-settings-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HeroIcon name="map-pin" className="w-4 h-4 text-gray-400"/> {/* Changed to HeroIcon */}
                        </div>
                        <input type="text" name="address" id="res-settings-address" value={details.address} onChange={handleDetailsChange} className="input-style w-full pl-10" />
                    </div>
                </div>
                <div>
                    <label htmlFor="res-settings-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" id="res-settings-desc" value={details.description} onChange={handleDetailsChange} rows="4" className="input-style w-full"></textarea>
                </div>
                <div>
                    <label htmlFor="res-settings-image" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Image</label>
                    <div className="mt-1 flex items-center space-x-4">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Restaurant preview" className="w-24 h-24 object-cover rounded-md shadow"/>
                        ) : (
                            <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                <ImageIcon size={32}/>
                            </div>
                        )}
                        <input type="file" id="res-settings-image" name="image" onChange={handleImageChange} accept="image/*" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isLoading} className="btn-primary flex items-center">
                        {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>} Save Details
                    </button>
                </div>
            </form>

            {/* Opening Hours Form */}
            <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-5">Opening Hours</h2>
                {isHoursLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-blue-600"/></div>}
                {!isHoursLoading && openingHours.map((hour, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center p-3 border-b last:border-b-0">
                        <label className="text-sm font-medium text-gray-700 sm:col-span-1">{weekdays[hour.day_of_week]}</label>
                        <div className="sm:col-span-1">
                            <input type="time" value={hour.is_closed ? '' : hour.open_time || ''} onChange={(e) => handleHourChange(index, 'open_time', e.target.value)} disabled={hour.is_closed} className="input-style w-full text-sm"/>
                        </div>
                        <div className="sm:col-span-1">
                            <input type="time" value={hour.is_closed ? '' : hour.close_time || ''} onChange={(e) => handleHourChange(index, 'close_time', e.target.value)} disabled={hour.is_closed} className="input-style w-full text-sm"/>
                        </div>
                        <div className="sm:col-span-1 flex items-center justify-end space-x-2">
                            <input type="checkbox" id={`closed-${index}`} checked={hour.is_closed} onChange={(e) => handleHourChange(index, 'is_closed', e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                            <label htmlFor={`closed-${index}`} className="text-sm text-gray-600">Closed</label>
                        </div>
                    </div>
                ))}
                 <div className="flex justify-end pt-4">
                    <button onClick={handleSaveOpeningHours} disabled={isHoursLoading} className="btn-primary flex items-center">
                        {isHoursLoading ? <Loader2 className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>} Save Opening Hours
                    </button>
                </div>
            </div>
             {/* Placeholder for other settings like delivery zones, payment options etc. */}
        </div>
    );
};

export default RestaurantSettingsPage;