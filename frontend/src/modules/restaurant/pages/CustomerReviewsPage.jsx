// src/modules/restaurant/pages/CustomerReviewsPage.jsx
import React from 'react';

const CustomerReviewsPage = () => {
  // const { currentRestaurant } = useAuth(); // Get current restaurant to fetch its reviews
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Customer Reviews</h1>
      <p className="mt-2 text-gray-600">Customer reviews for your restaurant will appear here.</p>
      {/* TODO: Fetch and display reviews for currentRestaurant.id */}
    </div>
  );
};
export default CustomerReviewsPage;