// filepath: frontend/src/modules/customer/components/RestaurantCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon.jsx'; // Added import

// Removed inline ChevronRightIcon definition if it was here

const RestaurantCard = ({ restaurant }) => {
  // Fallback image if restaurant.image is not available
  const imageUrl = restaurant.image || 'https://placehold.co/600x400/E2E8F0/A0AEC0?text=Restaurant';

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col group"
    >
      <div className="w-full h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={restaurant.name || 'Restaurant image'}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E2E8F0/A0AEC0?text=No+Image'; }}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate" title={restaurant.name}>
            {restaurant.name || 'Unnamed Restaurant'}
        </h3>
        <p className="text-xs text-gray-500 mb-2 truncate" title={restaurant.address}>
            {restaurant.address || 'Address not available'}
        </p>
        <div className="text-xs text-gray-600 mb-3">
            {restaurant.categories?.length > 0 ? restaurant.categories.map(cat => cat.name).join(', ') : 'No categories'}
        </div>
        
        <div className="mt-auto pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Rating: {restaurant.average_rating?.toFixed(1) || 'N/A'} ★</span>
                <span>{restaurant.delivery_time_estimate || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-indigo-600 group-hover:text-indigo-700 font-medium mt-1">
                <span>View Menu</span>
                <HeroIcon name="chevron-right" className="w-5 h-5" />
            </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;