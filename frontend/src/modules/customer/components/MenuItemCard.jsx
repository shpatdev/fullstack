// filepath: frontend/src/modules/customer/components/MenuItemCard.jsx
import React, { useState } from 'react';
import HeroIcon from '../../../components/HeroIcon.jsx'; // Added import

// Removed inline PlusCircleIcon definition if it was here

const MenuItemCard = ({ menuItem, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1); // Example: if you implement quantity selector directly on card

  const handleAdd = async () => {
    if (!menuItem.is_available || isAdding) return;
    setIsAdding(true);
    try {
      // Pass the full menuItem object if onAddToCart expects it for details
      await onAddToCart(menuItem, quantity);
    } catch (error) {
      // Error already logged in RestaurantDetailPage's handler or CartContext
    } finally {
      setIsAdding(false);
    }
  };

  const imageUrl = menuItem.image || 'https://placehold.co/300x200/E2E8F0/A0AEC0?text=Item';

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md flex flex-col justify-between transition-all duration-200 hover:shadow-xl ${!menuItem.is_available ? 'opacity-60' : ''}`}>
      <div className="flex-grow">
        {menuItem.image && (
            <img 
                src={imageUrl} 
                alt={menuItem.name} 
                className="w-full h-32 object-cover rounded-md mb-3"
                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/300x200/E2E8F0/A0AEC0?text=No+Image'; }}
            />
        )}
        <h4 className="text-md font-semibold text-gray-800 truncate" title={menuItem.name}>{menuItem.name || 'Menu Item'}</h4>
        <p className="text-xs text-gray-500 mb-1 truncate" title={menuItem.description}>{menuItem.description || 'No description available.'}</p>
        <p className="text-sm font-bold text-gray-900 mb-2">€{parseFloat(menuItem.price || 0).toFixed(2)}</p>
      </div>
      
      {/* Optional: Quantity selector directly on card - simplistic example
      <div className="flex items-center justify-center my-2">
        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2 py-0.5 border rounded-l-md text-sm">-</button>
        <span className="px-3 py-0.5 border-t border-b text-sm">{quantity}</span>
        <button onClick={() => setQuantity(q => q + 1)} className="px-2 py-0.5 border rounded-r-md text-sm">+</button>
      </div>
      */}

      <button
        onClick={handleAdd}
        disabled={!menuItem.is_available || isAdding}
        className={`w-full mt-2 px-3 py-2 text-xs font-medium rounded-md flex items-center justify-center transition-colors
                    ${menuItem.is_available 
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-indigo-300' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        {isAdding ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : menuItem.is_available ? (
          <HeroIcon name="plus-circle" className="w-4 h-4" />
        ) : null}
        <span className="ml-1">{isAdding ? 'Adding...' : (menuItem.is_available ? 'Add to Cart' : 'Unavailable')}</span>
      </button>
    </div>
  );
};

export default MenuItemCard;