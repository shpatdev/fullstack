// src/modules/customer/pages/RestaurantDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerApi } from '../../../api/customerApi.js';
import HeroIcon from '../../../components/HeroIcon.jsx';
import MenuItemCard from '../components/MenuItemCard.jsx';
import Button from '../../../components/Button.jsx'; // Nëse shton butona shtesë

const RestaurantDetailPage = () => {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL'); // Default 'ALL'

  const fetchRestaurantData = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [restaurantData, menuData] = await Promise.all([
        customerApi.fetchRestaurantById(restaurantId),
        customerApi.fetchMenuItemsForRestaurant(restaurantId)
      ]);
      setRestaurant(restaurantData);
      setMenuItems(menuData || []);
      // Extract unique categories from menuData for filter buttons
      // const categories = new Set((menuData || []).map(item => item.category?.name).filter(Boolean));
      // setUniqueCategoryNames(['ALL', ...Array.from(categories).sort()]);
    } catch (err) {
      setError(err.message || "Problem në ngarkimin e detajeve.");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchRestaurantData(); }, [fetchRestaurantData]);

  const menuCategories = menuItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Të tjera';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {});
  
  const uniqueCategoryNamesForFilter = ['ALL', ...Object.keys(menuCategories).sort()];

  const filteredMenuItemsForDisplay = activeCategory === 'ALL'
    ? menuItems // Show all items if 'ALL' is selected or no category selected
    : menuCategories[activeCategory] || []; // Show items of the active category


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Duke ngarkuar detajet e restorantit...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 dark:text-red-400 py-10 text-xl px-4 bg-red-50 dark:bg-red-900/30 rounded-lg">{error}</div>;
  }
  if (!restaurant) {
    return <div className="text-center text-gray-600 dark:text-gray-300 py-10 text-xl">Restoranti nuk u gjet.</div>;
  }
  
  const displayImage = restaurant.image || `https://placehold.co/1200x400/FDC830/78350F?text=${encodeURIComponent(restaurant.name)}`;

  return (
    <div className="container mx-auto px-2 sm:px-0 py-2">
      <div className="mb-1">
        <Link to="/customer/restaurants" className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
          <HeroIcon icon="ArrowLeftIcon" className="h-4 w-4 mr-1.5" /> Kthehu te Lista
        </Link>
      </div>
      <header className="mb-8 relative">
        <div className="h-48 md:h-64 lg:h-80 rounded-xl overflow-hidden shadow-2xl group">
            <img src={displayImage} alt={restaurant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6 md:p-8 md:flex md:items-end md:justify-between -mt-12 md:-mt-16 relative z-10 mx-auto max-w-5xl border border-gray-200 dark:border-slate-700">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-1.5">{restaurant.name}</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-1">
                    {restaurant.categories?.map(cat => cat.name).join(' • ') || 'Pa kategori'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 flex items-center mb-2 sm:mb-3">
                    <HeroIcon icon="MapPinIcon" className="h-4 w-4 mr-1.5 text-gray-400 dark:text-slate-500" /> {restaurant.address}
                </p>
                <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
                    {restaurant.average_rating && (
                        <div className="flex items-center text-gray-700 dark:text-slate-300">
                            <HeroIcon icon="StarIcon" className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400 mr-1" />
                            <span className="font-semibold">{restaurant.average_rating.toFixed(1)}</span>
                        </div>
                    )}
                    {restaurant.delivery_time_estimate && (
                        <div className="flex items-center text-gray-700 dark:text-slate-300">
                            <HeroIcon icon="ClockIcon" className="h-4 sm:h-5 w-4 sm:w-5 text-primary-500 dark:text-primary-400 mr-1.5" />
                            <span className="font-medium">{restaurant.delivery_time_estimate}</span>
                        </div>
                    )}
                     {restaurant.priceRange && (
                        <div className="flex items-center text-gray-700 dark:text-slate-300">
                            <HeroIcon icon="CurrencyEuroIcon" className="h-4 sm:h-5 w-4 sm:w-5 text-green-500 dark:text-green-400 mr-1.5" />
                            <span className="font-medium">{restaurant.priceRange}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {restaurant.description && (
            <div className="max-w-3xl mx-auto mt-4 sm:mt-6 text-center text-sm sm:text-base text-gray-600 dark:text-slate-300 px-4">
                <p>{restaurant.description}</p>
            </div>
        )}
      </header>

      <section className="mt-4">
        <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Menuja e Restorantit</h2>
          {/* Dropdown for category filter on mobile, buttons on larger screens */}
        </div>
        
        {uniqueCategoryNamesForFilter.length > 1 && (
          <div className="mb-6 sm:mb-8 px-2 sm:px-0 overflow-x-auto pb-2 custom-scrollbar-thin">
            <div className="flex space-x-2 sm:space-x-3 whitespace-nowrap">
              {uniqueCategoryNamesForFilter.map(categoryName => (
                <Button key={categoryName} onClick={() => setActiveCategory(categoryName)}
                  variant={activeCategory === categoryName ? 'primary' : 'outline'}
                  size="sm" className={`transition-all duration-150 ${activeCategory === categoryName ? 'shadow-md' : 'dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                > {categoryName} </Button>
              ))}
            </div>
          </div>
        )}

        {menuItems.length > 0 ? (
          activeCategory === 'ALL' ? (
            Object.entries(menuCategories).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([category, itemsInSection]) => (
              <div key={category} className="mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-slate-200 mb-3 sm:mb-4 px-2 sm:px-0 border-b border-gray-200 dark:border-slate-700 pb-2">{category} ({itemsInSection.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 px-1 sm:px-0">
                      {itemsInSection.map(item => <MenuItemCard key={item.id} item={item} />)}
                  </div>
              </div>
            ))
          ) : (
            filteredMenuItemsForDisplay.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 px-1 sm:px-0">
                {filteredMenuItemsForDisplay.map(item => <MenuItemCard key={item.id} item={item} />)}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-slate-400 py-8">Nuk ka artikuj në kategorinë "{activeCategory}".</p>
            )
          )
        ) : (
            <div className="text-center py-10 min-h-[200px] flex flex-col justify-center items-center bg-white dark:bg-slate-800 rounded-lg shadow">
                <HeroIcon icon="ArchiveBoxXMarkIcon" className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-300 text-lg">Ky restorant nuk ka ende menu.</p>
            </div>
        )}
      </section>
    </div>
  );
};

export default RestaurantDetailPage;