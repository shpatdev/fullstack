const RestaurantSettingsPage = () => {
    const { currentRestaurant, token, user, login } = useAuth(); // login për refresh të user data nëse duhet
    const restaurantId = currentRestaurant?.id;
    const { showNotification } = useNotification();

    const [details, setDetails] = useState({
        name: '', address: '', phone: '', image: '', description: '', cuisine_type_ids: []
    });
    const [openingHours, setOpeningHours] = useState([]);
    const [allCuisines, setAllCuisines] = useState([]); // Për dropdown-in e kategorive të restorantit

    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isLoadingOpeningHours, setIsLoadingOpeningHours] = useState(true);
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
            const [restaurantData, fetchedAllCuisines] = await Promise.all([
                restaurantApi.fetchRestaurantDetails(restaurantId, token),
                restaurantApi.fetchAllRestaurantCategoriesGlobal(token) // Merr kategoritë globale të restoranteve
            ]);

            if (restaurantData) {
                setDetails({
                    name: restaurantData.name || '',
                    address: restaurantData.address || '',
                    phone: restaurantData.phone || '',
                    image: restaurantData.image || '',
                    description: restaurantData.description || '',
                    // Sigurohu që backend-i kthen kategoritë e restorantit (jo të menuve) si array objektesh me ID
                    cuisine_type_ids: (restaurantData.categories || []).map(cat => cat.id) 
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
    }, [restaurantId, token, showNotification]); // weekdays hiqet nga dependencies

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDetailsChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleCuisineChange = (e) => { // Për <select multiple>
        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setDetails(prev => ({ ...prev, cuisine_type_ids: selectedIds }));
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        if (!token || !restaurantId) { showNotification("Authentication error or no restaurant selected.", "error"); return; }
        setIsSavingDetails(true);
        try {
            const payload = { ...details };
            // Backend-i duhet të presë `categories` si listë ID-sh për ManyToManyField
            // Ose `category_ids` nëse Serializer yt është konfiguruar kështu
            payload.categories = payload.cuisine_type_ids; // Dërgo ID-të e kategorive
            delete payload.cuisine_type_ids; 

            await restaurantApi.updateRestaurantDetails(restaurantId, payload, token);
            showNotification('Restaurant details updated successfully!', 'success');
            // Për të përditësuar emrin e restorantit në AuthContext nëse ndryshon:
            if (details.name !== currentRestaurant.name && user && user.ownsRestaurants) {
                const updatedOwnsRestaurants = user.ownsRestaurants.map(r => 
                    r.id === restaurantId ? { ...r, name: details.name } : r
                );
                // Duhet një mënyrë për të përditësuar user-in në AuthContext dhe localStorage
                // Kjo është pak e komplikuar pa një funksion të dedikuar në AuthContext
                // Për momentin, thjesht logojmë ose përdoruesi duhet të bëjë re-login për të parë ndryshimin në sidebar/header
                console.log("Restaurant name changed. AuthContext/localStorage for user.ownsRestaurants might need an update.");
                // Ose, thirr fetchData() për të rifreskuar të dhënat e restorantit lokal,
                // por kjo nuk e përditëson direkt emrin në AuthContext.selectRestaurant
            }
            fetchData(); // Rifresko të dhënat pas ruajtjes
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
                    // Mund të pastrosh kohët nëse mbyllet, ose të vendosësh default nëse hapet
                    // open_time: isNowClosed ? '' : (day.open_time || "09:00"),
                    // close_time: isNowClosed ? '' : (day.close_time || "17:00"),
                };
            }
            return day;
        }));
    };

    const handleSaveOpeningHours = async (e) => {
        e.preventDefault();
        if (!token || !restaurantId) { showNotification("Authentication error or no restaurant selected.", "error"); return; }
        setIsSavingOpeningHours(true);
        const formattedHours = openingHours.map(h => ({
            day_of_week: h.day_of_week,
            open_time: h.is_closed ? null : (h.open_time || "00:00"), // Dërgo null ose kohë default
            close_time: h.is_closed ? null : (h.close_time || "00:00"),
            is_closed: h.is_closed,
            // id: h.id // Dërgo ID nëse API-ja jote për oraret bën update individualisht
        }));

        try {
            // Kjo thirrje API duhet të pranojë një listë të plotë orësh dhe t'i menaxhojë ato në backend
            // (krijim, përditësim, fshirje)
            await restaurantApi.setOpeningHours(restaurantId, formattedHours, token);
            showNotification('Opening hours updated successfully!', 'success');
            fetchData(); // Rifresko për të marrë ID-të e reja/përditësuara nëse backend-i i kthen
        } catch (err) { showNotification(err.message || 'Failed to update opening hours.', 'error'); } 
        finally { setIsSavingOpeningHours(false); }
    };

    if (!currentRestaurant) {
        return <div className="p-6 text-center text-gray-500">Please select a restaurant to manage its settings.</div>;
    }
    if (isLoadingDetails || isLoadingOpeningHours) return <div className="p-6 flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /> <p className="ml-3">Loading Settings...</p></div>;
    if (error) return <div className="p-6 text-red-500 bg-red-100 rounded-md">Error: {error} <button onClick={fetchData} className="ml-2 text-blue-600 underline">Try again</button></div>;
    
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Restaurant Settings: {details.name || currentRestaurant.name}</h1>

            <form onSubmit={handleSaveDetails} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
                <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-5 flex items-center"><FileText size={20} className="mr-2 text-blue-600"/>Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="res-settings-name" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                        <input type="text" name="name" id="res-settings-name" value={details.name} onChange={handleDetailsChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label htmlFor="res-settings-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={16} className="text-gray-400"/></div>
                            <input type="tel" name="phone" id="res-settings-phone" value={details.phone} onChange={handleDetailsChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" />
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="res-settings-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                     <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin size={16} className="text-gray-400"/></div>
                        <input type="text" name="address" id="res-settings-address" value={details.address} onChange={handleDetailsChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                </div>
                <div>
                    <label htmlFor="res-settings-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" id="res-settings-description" value={details.description} onChange={handleDetailsChange} rows="4" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label htmlFor="res-settings-image" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                     <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ImageIcon size={16} className="text-gray-400"/></div>
                        <input type="url" name="image" id="res-settings-image" value={details.image} onChange={handleDetailsChange} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" placeholder="https://example.com/image.jpg"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="res-settings-cuisine_type_ids" className="block text-sm font-medium text-gray-700 mb-1">Cuisine Categories (Tags)</label>
                    <select multiple name="cuisine_type_ids" id="res-settings-cuisine_type_ids" value={details.cuisine_type_ids} onChange={handleCuisineChange}
                            className="mt-1 block w-full h-32 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {(allCuisines || []).map(cuisine => (
                            <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                </div>
                <div className="flex justify-end pt-3">
                    <Button type="submit" disabled={isSavingDetails} isLoading={isSavingDetails} iconLeft={<Save size={18}/>}>
                        Save Details
                    </Button>
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
                    <Button type="submit" disabled={isSavingOpeningHours} isLoading={isSavingOpeningHours} variant="success" iconLeft={<Save size={18}/>}>
                        Save Opening Hours
                    </Button>
                </div>
            </form>
        </div>
    );
};
export default RestaurantSettingsPage;