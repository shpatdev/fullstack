// src/modules/customer/pages/RestaurantListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../../api/customerApi.js'; // Adjust path
import RestaurantCard from '../components/RestaurantCard.jsx'; // Adjust path

const RestaurantListPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRestaurants = async () => {
      setIsLoading(true); setError(null);
      try {
        const data = await customerApi.fetchActiveRestaurants();
        setRestaurants(data);
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
        setError(err.message || "Could not fetch restaurants.");
      } finally {
        setIsLoading(false);
      }
    };
    loadRestaurants();
  }, []);

  if (isLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div><p className="ml-4 text-lg text-gray-700">Loading Restaurants...</p></div>;
  if (error) return <div className="text-center p-10 min-h-[calc(100vh-10rem)]"><h2 className="text-2xl font-semibold text-red-600 mb-4">Oops!</h2><p className="text-gray-700">{error}</p><button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Try Again</button></div>;
  if (restaurants.length === 0) return <div className="text-center p-10 min-h-[calc(100vh-10rem)]"><p className="text-lg text-gray-700">No restaurants available at the moment.</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center sm:text-left">Discover Restaurants</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
        {restaurants.map(restaurant => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};
export default RestaurantListPage;