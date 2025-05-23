// src/modules/customer/pages/RestaurantListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { customerApi } from '../../../api/customerApi'; 
import RestaurantCard from '../components/RestaurantCard'; 
import Button from '../../../components/Button'; 
import { MagnifyingGlassIcon, XCircleIcon, FaceFrownIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../../context/NotificationContext.jsx';

const RestaurantListPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  const [activeFilters, setActiveFilters] = useState({ category: '', rating: 0 });
  const [visibleCount, setVisibleCount] = useState(12); // Initial number of restaurants to show
  const { showSuccess, showError } = useNotification(); // Assuming you might use notifications

  useEffect(() => {
    console.log("RestaurantListPage - Restaurants:", restaurants);
    console.log("RestaurantListPage - IsLoading:", isLoading);
    console.log("RestaurantListPage - Error:", error);
  }, [restaurants, isLoading, error]);

  const fetchRestaurantsAndCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customerApi.fetchActiveRestaurants(); 
      setRestaurants(data.results || data || []); 
      const categories = new Set();
      (data.results || data || []).forEach(r => r.cuisine_types?.forEach(cat => categories.add(cat.name)));
      setAllCategories(Array.from(categories).sort());
    } catch (err) {
      setError(err.message || "Problem në ngarkimin e restoranteve.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRestaurantsAndCategories(); }, [fetchRestaurantsAndCategories]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (filterName, value) => {
    setVisibleCount(8); 
    setActiveFilters(prev => ({ ...prev, [filterName]: value }));
  }
  const handleClearFilters = () => {
    setActiveFilters({ category: '', rating: 0 });
    setSearchTerm('');
    setVisibleCount(8);
  };
  const showMoreRestaurants = () => setVisibleCount(prev => prev + 8);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const searchTermLower = searchTerm.toLowerCase(); // DEFINOHET KËTU

    let matchesSearch = true; 
    if (searchTerm) {
        matchesSearch = (
            (restaurant.name && restaurant.name.toLowerCase().includes(searchTermLower)) ||
            (restaurant.address_summary && restaurant.address_summary.toLowerCase().includes(searchTermLower)) ||
            (restaurant.cuisine_types && restaurant.cuisine_types.some(cat => cat.name.toLowerCase().includes(searchTermLower)))
        );
    }
    
    const categoryFilterMatch = activeFilters.category 
        ? (restaurant.cuisine_types && restaurant.cuisine_types.some(cat => cat.name === activeFilters.category)) 
        : true;
    
    const ratingFilterMatch = activeFilters.rating > 0 
        ? ((parseFloat(restaurant.average_rating) || 0) >= activeFilters.rating) 
        : true;

    return matchesSearch && categoryFilterMatch && ratingFilterMatch;
  });
  
  if (isLoading && restaurants.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-300px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Duke ngarkuar restorantet...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-0 py-2">
      <section className="mb-8 text-center bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 dark:from-slate-800 dark:to-slate-900 py-10 sm:py-16 px-4 sm:px-6 rounded-xl shadow-2xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 leading-tight">
          Gjeni Ushqimin Tuaj <span className="text-yellow-300">Perfekt</span>
        </h1>
        <p className="text-md sm:text-lg text-primary-100 dark:text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Eksploroni një larmi restorantesh dhe kuzhinash. Porositni lehtë dhe shijoni!
        </p>
        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
          </div>
          <input type="search" placeholder="Kërko restorant, kuzhinë..." value={searchTerm} onChange={handleSearchChange}
            className="w-full py-3 px-4 pl-12 text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border-2 border-transparent focus:border-yellow-400 dark:focus:border-yellow-500 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-600 transition-colors"
          />
        </div>
      </section>
      
      <section className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md sticky top-16 z-20 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end">
            <div>
                <label htmlFor="categoryFilter" className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Kategoria:</label>
                <select id="categoryFilter" name="category" value={activeFilters.category} onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full input-form py-2 text-sm">
                    <option value="">Të gjitha</option>
                    {allCategories.map(catName => <option key={catName} value={catName}>{catName}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="ratingFilter" className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Vlerësimi Min:</label>
                <select id="ratingFilter" name="rating" value={activeFilters.rating} onChange={(e) => handleFilterChange('rating', parseInt(e.target.value))}
                    className="w-full input-form py-2 text-sm">
                    <option value="0">Çdo Vlerësim</option> <option value="5">5 ★</option> <option value="4">4+ ★</option> <option value="3">3+ ★</option>
                </select>
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
                <Button onClick={handleClearFilters} variant="ghost" size="md" fullWidth className="text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700">
                    <XCircleIcon className="h-4 w-4 mr-1.5"/>Pastro Filtrat
                </Button>
            </div>
            <div className="md:col-span-1 text-right text-xs text-gray-500 dark:text-slate-400 self-center hidden md:block">
                 {isLoading ? 'Duke kërkuar...' : `${filteredRestaurants.length} restorante u gjetën`}
            </div>
          </div>
      </section>

      {isLoading && restaurants.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-slate-400">Duke rifreskuar listën...</div>
      )}

      {error && <div className="text-center text-red-500 dark:text-red-400 py-10 text-xl px-4 bg-red-50 dark:bg-red-900/30 rounded-lg">{error}</div>}

      {!isLoading && !error && filteredRestaurants.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {filteredRestaurants.slice(0, visibleCount).map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
          {visibleCount < filteredRestaurants.length && (
            <div className="mt-10 text-center">
              <Button variant="primary" size="lg" onClick={showMoreRestaurants} isLoading={isLoading}>
                Shfaq Më Shumë ({filteredRestaurants.length - visibleCount} mbetur)
              </Button>
            </div>
          )}
        </>
      ) : (
        !isLoading && !error && <div className="text-center py-12 min-h-[200px] flex flex-col justify-center items-center bg-white dark:bg-slate-800 rounded-lg shadow">
            <FaceFrownIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-gray-600 dark:text-slate-300"> Asnjë restorant nuk përputhet me kërkimin. </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Provoni të ndryshoni filtrat ose termin e kërkimit.</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantListPage;