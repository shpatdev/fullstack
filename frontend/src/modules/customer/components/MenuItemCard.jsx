// src/modules/customer/components/MenuItemCard.jsx
import React, { useState } from 'react';

// Icon component (assuming it's global or imported)
const PlusCircleIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> );

const MenuItemCard = ({ menuItem, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCartClick = async () => {
    if (!menuItem.is_available || isAdding) return;
    setIsAdding(true);
    try {
      // Pass menuItem itself so CartContext can use its details if needed for optimistic updates or notifications
      await onAddToCart(menuItem.id, 1, menuItem); 
    } catch (error) {
      console.error("Error adding item from card:", error);
      // Error handling might be done globally via CartContext or notifications
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 border bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center">
      {menuItem.image && (
        <img 
          src={menuItem.image || 'https://placehold.co/100x100/E2E8F0/A0AEC0?text=Item'} 
          alt={menuItem.name} 
          className="w-full md:w-24 h-32 md:h-24 object-cover rounded-md mb-3 md:mb-0 md:mr-4"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/E2E8F0/A0AEC0?text=No+Image'; }}
        />
      )}
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-gray-800">{menuItem.name}</h3>
        <p className="text-sm text-gray-600 mt-1 mb-2">{menuItem.description || "No description available."}</p>
        <p className="text-md font-bold text-indigo-600">€{parseFloat(menuItem.price).toFixed(2)}</p>
      </div>
      <button 
        onClick={handleAddToCartClick}
        disabled={isAdding || !menuItem.is_available}
        className={`mt-3 md:mt-0 md:ml-4 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center
                    ${!menuItem.is_available ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' : ''}
                    ${isAdding ? 'opacity-70 cursor-wait' : ''}`}
      >
        {isAdding ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
        ) : (
          <PlusCircleIcon />
        )}
        <span className="ml-2">{isAdding ? 'Adding...' : (menuItem.is_available ? 'Add to Cart' : 'Unavailable')}</span>
      </button>
    </div>
  );
};
export default MenuItemCard;