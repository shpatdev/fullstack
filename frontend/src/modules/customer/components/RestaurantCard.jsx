// src/modules/customer/components/RestaurantCard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for navigation

// Icon component (assuming it's global or imported)
const ChevronRightIcon = () => ( <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path> </svg> );

const RestaurantCard = ({ restaurant }) => {
  return (
    <Link 
      to={`/restaurants/${restaurant.id}`} // Navigate to the detail page
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col"
    >
      <img 
        className="w-full h-48 object-cover" 
        src={restaurant.image || 'https://placehold.co/600x400/E2E8F0/A0AEC0?text=No+Image'} 
        alt={restaurant.name} 
        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E2E8F0/A0AEC0?text=No+Image'; }}
      />
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 truncate">{restaurant.name}</h3>
        <p className="text-sm text-gray-600 mb-1 truncate">
          {restaurant.categories?.map(cat => cat.name).join(', ') || 'Cuisine not specified'}
        </p>
        <p className="text-sm text-gray-500 mb-3 truncate flex-grow">{restaurant.address || 'Address not available'}</p>
        <div className="flex items-center justify-between text-sm text-indigo-600 font-medium mt-auto">
          <span>View Menu</span>
          <ChevronRightIcon />
        </div>
      </div>
    </Link>
  );
};
export default RestaurantCard;