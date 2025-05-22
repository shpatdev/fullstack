// src/modules/restaurant/pages/RestaurantSettingsPage.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Loader2, Save, Clock, Image as ImageIcon, Phone, MapPin, FileText } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';

const RestaurantSettingsPage = () => {
    const { currentRestaurant, token, login } = useAuth(); // Added login to refresh user context if ownsRestaurants changes
    const restaurantId = currentRestaurant?.id;
    const { showNotification } = useNotification();

    const [details, setDetails] = useState({
        name: '', address: '', phone: '', image: '', description: '', cuisine_type_ids: []
    });
    const [openingHours, setOpeningHours] = useState([]);
    const [allCuisines, setAllCuisines] = useState([]);

    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isLoadingOpeningHours, setIsLoadingOpeningHours] = useState(true); // Can be combined if fetched together
    const [isSavingOpeningHours, setIsSavingOpeningHours] = useState(false);
    const [error, setError] = useState(null);

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const fetchData = useCallback(async () => {
        if (!restaurantId || !token) {
            setIsLoadingDetails(false); setIsLoadingOpeningHours(false);
            return;
        }
        setIsLoadingDetails(true); setIsLoadingOpeningHours(true); setError(null);
        try {
            // Fetch restaurant details (which should include opening_hours and current categories)
            // And fetch all possible cuisine categories for the multi-select
            const [restaurantData, fetchedAllCuisines] = await Promise.all([
                restaurantApi.fetchRestaurantDetails(restaurantId, token),
                restaurantApi.fetchAllCuisineCategories(token) 
            ]);

            if (restaurantData) {
                setDetails({
                    name: restaurantData.name || '',
                    address: restaurantData.address || '',
                    phone: restaurantData.phone || '',
                    image: restaurantData.image || '',
                    description: restaurantData.description || '',
                    cuisine_type_ids: (restaurantData.categories || []).map(cat => cat.id) // Assuming API returns categories as array of objects with id
                });
                const initialHours = weekdays.map((_, index) => {
                    const dayData = restaurantData.opening_hours?.find(h => h.day_of_week === index);
                    return {
                        day_of_week: index,
                        open_time: dayData?.open_time?.substring(0,5) || "09:00",
                        close_time: dayData?.close_time?.substring(0,5) || "17:00",
                        is_closed: dayData?.is_closed || false,
                        id: dayData?.id 
                    };
                });
                setOpeningHours(initialHours);
            }
             setAllCuisines(fetchedAllCuisines || []);

        } catch (err) { setError(err.message); showNotification(err.message || "Failed to load settings.", 'error'); } 
        finally { setIsLoadingDetails(false); setIsLoadingOpeningHours(false); }
    }, [restaurantId, token, showNotification]); // Removed weekdays

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDetailsChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleCuisineChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setDetails(prev => ({ ...prev, cuisine_type_ids: selectedIds }));
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        if (!token) { showNotification("Authentication error.", "error"); return; }
        setIsSavingDetails(true);
        try {
            // Prepare payload, ensure cuisine_type_ids is what backend expects
            const payload = { ...details }; 
            // Backend should expect 'categories' as list of IDs if it's a M2M field in serializer
            // If your serializer expects `category_ids` for M2M use that name
            payload.category_ids = payload.cuisine_type_ids; 
            delete payload.cuisine_type_ids;

            await restaurantApi.updateRestaurantDetails(restaurantId, payload, token);
            showNotification('Restaurant details updated successfully!', 'success');
            // Optionally, update AuthContext's currentRestaurant if name changed
            if (details.name !== currentRestaurant.name && user) {
                const updatedOwnsRestaurants = user.ownsRestaurants.map(r => 
                    r.id === restaurantId ? { ...r, name: details.name } : r
                );
                // This assumes login function can update user in AuthContext and localStorage
                // A more direct way would be an updateUserInContext function in AuthContext
                // For now, just log, or trigger a re-fetch of user data if needed
                console.log("Restaurant name changed, AuthContext might need update.");
            }
        } catch (err) { showNotification(err.message || 'Failed to update details.', 'error'); } 
        finally { setIsSavingDetails(false); }
    };

    const handleOpeningHourChange = (dayIndex, field, value) => {
        setOpeningHours(prev => prev.map((day, index) => 
            index === dayIndex ? { ...day, [field]: value } : day
        ));
    };
    
    const handleToggleClosed = (dayIndex) => {
        setOpeningHours(prev => prev.map((day, index) => {
            if (index === dayIndex) {
                const isNowClosed = !day.is_closed;
                return { 
                    ...day, 
                    is_closed: isNowClosed,
                    // Optionally clear times if now closed, or set defaults if now open
                    // open_time: isNowClosed ? '' : (day.open_time || '09:00'),
                    // close_time: isNowClosed ? '' : (day.close_time || '17:00'),
                };
            }
            return day;
        }));
    };

    const handleSaveOpeningHours = async (e) => {
        e.preventDefault();
        if (!token) { showNotification("Authentication error.", "error"); return; }
        setIsSavingOpeningHours(true);
        const formattedHours = openingHours.map(h => ({
            day_of_week: h.day_of_week,
            open_time: h.is_closed ? null : h.open_time,
            close_time: h.is_closed ? null : h.close_time,
            is_closed: h.is_closed,
            id: h.id // Pass ID for updates if your backend handles PUT/PATCH per opening hour
        }));
        try {
            await restaurantApi.setOpeningHours(restaurantId, formattedHours, token); // This assumes your API takes the full list
            showNotification('Opening hours updated successfully!', 'success');
            fetchData(); // Re-fetch to confirm and get any new IDs
        } catch (err) { showNotification(err.message || 'Failed to update opening hours.', 'error'); } 
        finally { setIsSavingOpeningHours(false); }
    };

    if (isLoadingDetails || isLoadingOpeningHours) return <div className="p-6 flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /> <p className="ml-3">Loading Settings...</p></div>;
    if (error) return <div className="p-6 text-red-500 bg-red-100 rounded-md">Error: {error} <button onClick={fetchData} className="ml-2 text-blue-600 underline">Try again</button></div>;
    
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Restaurant Settings: {details.name || currentRestaurant?.name}</h1>

            <form onSubmit={handleSaveDetails} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-5 flex items-center"><FileText size={20} className="mr-2 text-blue-600"/>Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                        <input type="text" name="name" id="name" value={details.name} onChange={handleDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={16} className="text-gray-400"/></div>
                            <input type="tel" name="phone" id="phone" value={details.phone} onChange={handleDetailsChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" />
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                     <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin size={16} className="text-gray-400"/></div>
                        <input type="text" name="address" id="address" value={details.address} onChange={handleDetailsChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" id="description" value={details.description} onChange={handleDetailsChange} rows="4" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                     <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ImageIcon size={16} className="text-gray-400"/></div>
                        <input type="url" name="image" id="image" value={details.image} onChange={handleDetailsChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" placeholder="https://example.com/image.jpg"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="cuisine_type_ids" className="block text-sm font-medium text-gray-700 mb-1">Cuisine Categories</label>
                    <select multiple name="cuisine_type_ids" id="cuisine_type_ids" value={details.cuisine_type_ids} onChange={handleCuisineChange}
                            className="mt-1 block w-full h-32 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {(allCuisines || []).map(cuisine => (
                            <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple. These are general tags for your restaurant.</p>
                </div>
                <div className="flex justify-end pt-3">
                    <button type="submit" disabled={isSavingDetails} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center disabled:opacity-50">
                        {isSavingDetails ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                        Save Restaurant Details
                    </button>
                </div>
            </form>

            <form onSubmit={handleSaveOpeningHours} className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-5 flex items-center"><Clock size={20} className="mr-2 text-green-600"/>Opening Hours</h2>
                {openingHours.map((day, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_auto] gap-x-4 gap-y-2 items-center py-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                        <label className="text-sm font-medium text-gray-700 self-center pr-2">{weekdays[index]}</label>
                        <input type="time" value={day.is_closed ? '' : day.open_time} onChange={(e) => handleOpeningHourChange(index, 'open_time', e.target.value)} disabled={day.is_closed} className="mt-1 sm:mt-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        <input type="time" value={day.is_closed ? '' : day.close_time} onChange={(e) => handleOpeningHourChange(index, 'close_time', e.target.value)} disabled={day.is_closed} className="mt-1 sm:mt-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        <label className="flex items-center space-x-2 cursor-pointer sm:justify-self-end mt-2 sm:mt-0">
                            <input type="checkbox" checked={day.is_closed} onChange={() => handleToggleClosed(index)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                            <span className="text-sm text-gray-600">Closed</span>
                        </label>
                    </div>
                ))}
                 <div className="flex justify-end pt-5">
                    <button type="submit" disabled={isSavingOpeningHours} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center disabled:opacity-50">
                        {isSavingOpeningHours ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                        Save Opening Hours
                    </button>
                </div>
            </form>
        </div>
    );
};
export default RestaurantSettingsPage;