// src/modules/customer/pages/RestaurantDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerApi } from '../../../api/customerApi.js';
import { ArrowLeftIcon, MapPinIcon, StarIcon, ClockIcon, CurrencyDollarIcon as CurrencyEuroIcon } from '@heroicons/react/24/outline';
import MenuItemCard from '../components/MenuItemCard.jsx';
import Button from "../../../components/Button.jsx";
import ReviewCard from "../components/ReviewCard.jsx";
import ReviewForm from "../components/ReviewForm.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCart } from '../../../context/CartContext.jsx';

const RestaurantDetailPage = () => {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { addItemToCart } = useCart();

  const fetchRestaurantData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detailsData, menuData, reviewsData] = await Promise.all([
        customerApi.fetchRestaurantById(restaurantId),
        customerApi.fetchMenuCategoriesWithItems(restaurantId),
        customerApi.fetchRestaurantReviews(restaurantId)
      ]);
      setRestaurant(detailsData);
      setMenuCategories(menuData || []);
      setReviews(reviewsData.results || reviewsData || []);
    } catch (err) {
      console.error("Failed to fetch restaurant data:", err.message, err.stack);
      setError(err.message || "Problem në ngarkimin e detajeve të restorantit.");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  const handleReviewSubmitted = (newReview) => {
    setReviews(prevReviews => [newReview, ...prevReviews]);
    setShowReviewForm(false);
  };
  
  const canLeaveReview = () => {
    if (!isAuthenticated || !user || !restaurant) return false;
    const existingReview = reviews.find(review => review.user === user.id || review.user?.id === user.id);
    if (existingReview) return false;
    return true; 
  };


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Duke ngarkuar detajet e restorantit...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 dark:text-red-400 py-10 text-xl bg-red-50 dark:bg-red-900/30 rounded-lg">{error}</div>;
  }

  if (!restaurant) {
    return <div className="text-center text-gray-600 dark:text-slate-300 py-10 text-xl">Restoranti nuk u gjet.</div>;
  }
  
  const displayImage = restaurant.main_image_url || `https://placehold.co/1200x400/FDC830/78350F?text=${encodeURIComponent(restaurant.name)}`;

  return (
    <div className="container mx-auto px-2 sm:px-0 py-2">
      <div className="mb-1">
        <Link to="/customer/restaurants" className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" /> Kthehu te Lista
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
                    {restaurant.cuisine_types?.map(cat => cat.name).join(' • ') || 'Pa kategori'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 flex items-center mb-2 sm:mb-3">
                    <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400 dark:text-slate-500" /> 
                    {restaurant.address_summary || restaurant.address?.street || 'Adresë e panjohur'}
                </p>
                <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
                    {restaurant.average_rating && parseFloat(restaurant.average_rating) > 0 && (
                        <div className="flex items-center text-gray-700 dark:text-slate-300">
                            <StarIcon className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400 mr-1" />
                            <span className="font-semibold">{parseFloat(restaurant.average_rating).toFixed(1)}</span>
                            <span className="ml-1 text-gray-500 dark:text-slate-400">({restaurant.review_count || 0} vlerësime)</span>
                        </div>
                    )}
                    {restaurant.delivery_time_estimate_display && (
                        <div className="flex items-center text-gray-700 dark:text-slate-300">
                            <ClockIcon className="h-4 sm:h-5 w-4 sm:w-5 text-primary-500 dark:text-primary-400 mr-1.5" />
                            <span className="font-medium">{restaurant.delivery_time_estimate_display}</span>
                        </div>
                    )}
                     {restaurant.price_range_display && (
                        <div className="flex items-center text-gray-700 dark:text-slate-300">
                            <CurrencyEuroIcon className="h-4 sm:h-5 w-4 sm:w-5 text-green-500 dark:text-green-400 mr-1.5" />
                            <span className="font-medium">{restaurant.price_range_display}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {restaurant.description && (
            <div className="max-w-3xl mx-auto mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h3 className="text-md font-semibold text-gray-700 dark:text-slate-200 mb-1.5">Rreth Restorantit</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{restaurant.description}</p>
            </div>
        )}
      </header>
      
      {/* Menu Section */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Menuja</h2>
        {menuCategories && menuCategories.length > 0 ? (
          menuCategories.map(category => (
            <div key={category.id} className="mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-slate-300 mb-3 border-b pb-1 dark:border-slate-700">{category.name}</h3>
              {category.menu_items && category.menu_items.filter(item => item.is_available).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.menu_items.filter(item => item.is_available).map(item => (
                    <MenuItemCard key={item.id} item={item} onAddToCart={() => addItemToCart(item, 1, restaurant.id)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400">Nuk ka artikuj të disponueshëm në këtë kategori.</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600 dark:text-slate-400">Menuja për këtë restorant nuk është e disponueshme ende.</p>
        )}
      </section>

      {/* Reviews Section */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Vlerësimet e Klientëve</h2>
        {isAuthenticated && canLeaveReview() && !showReviewForm && (
          <div className="mb-4">
            <Button onClick={() => setShowReviewForm(true)} variant="primary">
              Lini një Vlerësim
            </Button>
          </div>
        )}
        {showReviewForm && (
          <ReviewForm 
            restaurantId={restaurantId} 
            onReviewSubmitted={handleReviewSubmitted}
            onCancel={() => setShowReviewForm(false)} 
          />
        )}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-slate-400">Nuk ka ende vlerësime për këtë restorant.</p>
        )}
      </section>
    </div>
  );
};
export default RestaurantDetailPage;