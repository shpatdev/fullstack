// filepath: frontend/src/modules/customer/components/RestaurantCard.jsx
import React from 'react';
// import { Link } from 'react-router-dom'; // KOMENTOJE KETE
import { useNavigate } from 'react-router-dom'; // SHTO KETE
import { StarIcon as StarIconSolid, ChevronRightIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate(); // SHTO KETE

  if (!restaurant) {
    return null; // Or some placeholder/error display
  }

  const imageUrl = restaurant.main_image_url || restaurant.image_url || restaurant.image || 'https://placehold.co/600x400/E2E8F0/A0AEC0?text=Restaurant';
  
  // Log for debugging
  console.log("RestaurantCard - restaurant.id:", restaurant.id);
  const targetPath = `/customer/restaurants/${restaurant.id}`;
  console.log("RestaurantCard - targetPath:", targetPath);

  const ratingValue = parseFloat(restaurant.average_rating);
  const starCount = 5;

  const handleCardClick = () => {
    // const path = `/customer/restaurants/${restaurant.id}`; // Already defined as targetPath
    console.log("Navigating programmatically to:", targetPath);
    navigate(targetPath);
  };

  return (
    // NDRYSHO Link ME DIV DHE onClick
    <div
      onClick={handleCardClick} // SHTO KETE
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col group"
      role="link" // Added for accessibility, as it behaves like a link
      tabIndex={0} // Make it focusable
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }} // Keyboard navigation
    >
      <div className="w-full h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={restaurant.name || 'Restaurant image'} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E2E8F0/A0AEC0?text=Image+Not+Found'; }}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" title={restaurant.name}>
          {restaurant.name || 'Unnamed Restaurant'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 truncate" title={restaurant.cuisine_type || 'N/A'}>
          {restaurant.cuisine_type || 'Cuisine not specified'}
        </p>
        
        <div className="flex items-center my-2">
          {/* Star Rating Display */}
          {Array.from({ length: starCount }, (_, index) => {
            const starValue = index + 1;
            if (starValue <= Math.floor(ratingValue)) {
              return <StarIconSolid key={index} className="h-5 w-5 text-yellow-400" />;
            } else if (starValue - 0.5 <= ratingValue) {
              // This logic for half star might need a specific half-star icon or more complex SVG
              // For now, let's treat it as an outline or solid based on rounding, or simplify
              return <StarIconSolid key={index} className="h-5 w-5 text-yellow-400" />; // Simplified: show solid for .5 or more
            } else {
              return <StarIconOutline key={index} className="h-5 w-5 text-yellow-400" />;
            }
          })}
          <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">
            {ratingValue ? ratingValue.toFixed(1) : 'N/A'} ({restaurant.reviews_count || 0} reviews)
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400">
          {restaurant.address?.street || 'Address not available'}
        </p>

        <div className="mt-auto pt-3">
          <span className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
              Shiko Menunë
              <ChevronRightIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;