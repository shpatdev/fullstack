// src/modules/customer/pages/RestaurantDetailPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Use real react-router-dom
import { customerApi } from '../../../api/customerApi.js'; // Adjust path
import { CartContext } from '../../../context/CartContext.jsx'; // Adjust path
import { AuthContext } from '../../../context/AuthContext.jsx'; // Adjust path
import MenuItemCard from '../components/MenuItemCard.jsx'; // Adjust path

const RestaurantDetailPage = () => {
  const { restaurantId } = useParams(); // Get ID from URL
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { addItemToCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (!restaurantId) {
        setError("No restaurant ID provided.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true); setError(null);
      try {
        const [resDetails, resMenuItems] = await Promise.all([
          customerApi.fetchRestaurantById(restaurantId),
          customerApi.fetchMenuItemsForRestaurant(restaurantId)
        ]);
        setRestaurant(resDetails);
        setMenuItems(resMenuItems);
      } catch (err) {
        console.error("Error fetching restaurant data:", err);
        setError(err.message || "Failed to load restaurant information.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [restaurantId]);

  const handleAddToCartAttempt = async (menuItemId, quantity, menuItemDetails) => {
    if (!isAuthenticated) {
      // Consider using a modal or a redirect with a message for better UX
      window.alert("Please login to add items to your cart.");
      navigate('/login', { state: { from: `/restaurants/${restaurantId}` } }); // Redirect to login, save current location
      return;
    }
    try {
      await addItemToCart(menuItemId, quantity, menuItemDetails); // From CartContext
      // Feedback is handled by CartContext's addItemToCart
    } catch(err) {
      // Error feedback is also handled by CartContext or could be a global notification
      console.error("Add to cart failed on detail page:", err);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div><p className="ml-4 text-lg text-gray-700">Loading Restaurant...</p></div>;
  if (error) return <div className="text-center p-10 min-h-[calc(100vh-10rem)]"><h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2><p className="text-gray-700">{error}</p></div>;
  if (!restaurant) return <div className="text-center p-10 min-h-[calc(100vh-10rem)]"><p className="text-lg text-gray-700">Restaurant not found.</p></div>;

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other Items';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {});
  
  const openingHoursString = restaurant.opening_hours?.map(oh => 
        `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][oh.day_of_week]}: ${oh.is_closed ? 'Closed' : `${oh.open_time?.substring(0,5)} - ${oh.close_time?.substring(0,5)}`}`
    ).join(' | ');

  return (
    // ... JSX from Gemini's RestaurantDetailPage, but use handleAddToCartAttempt for MenuItemCard's onAddToCart
    // Pass the real addItemToCart (via handleAddToCartAttempt) to MenuItemCard
    <div className="container mx-auto px-2 sm:px-4 py-8">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <img 
                className="w-full h-48 sm:h-64 md:h-80 object-cover" 
                src={restaurant.image || 'https://placehold.co/1200x400/E2E8F0/A0AEC0?text=Restaurant'} 
                alt={restaurant.name} 
                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/1200x400/E2E8F0/A0AEC0?text=No+Image'; }}
            />
            <div className="p-4 sm:p-6 md:p-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                <p className="text-md text-gray-600 mb-1">{restaurant.categories?.map(cat => cat.name).join(' • ') || 'Cuisine not specified'}</p>
                <p className="text-sm text-gray-500 mb-2">{restaurant.address}</p>
                {restaurant.phone && <p className="text-sm text-gray-500 mb-4">Phone: {restaurant.phone}</p>}
                {restaurant.description && <p className="text-md text-gray-700 mb-6">{restaurant.description}</p>}
                {openingHoursString && <p className="text-xs text-gray-500 mb-6 bg-gray-50 p-2 rounded-md">Hours: {openingHoursString}</p>}
                
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-t pt-6">Menu</h2>
                {Object.keys(groupedMenuItems).length > 0 ? (
                    Object.entries(groupedMenuItems).map(([categoryName, items]) => (
                        <div key={categoryName} className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">{categoryName}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items.map(item => (
                                    <MenuItemCard 
                                        key={item.id} 
                                        menuItem={item} 
                                        onAddToCart={handleAddToCartAttempt} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-600">Menu not available for this restaurant yet.</p>
                )}
            </div>
        </div>
    </div>
  );
};
export default RestaurantDetailPage;