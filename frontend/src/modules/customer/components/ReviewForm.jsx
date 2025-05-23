import React, { useState } from 'react';
import Button from '../../../components/Button.jsx'; // Sigurohu që ky path është korrekt
import { StarIcon as StarIconSolid } from '@heroicons/react/20/solid'; // Për yje të mbushur
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline'; // Për yje bosh (opsionale)
import { customerApi } from '../../../api/customerApi.js'; // Për të dërguar review-in
import { useNotification } from '../../../context/NotificationContext.jsx';

const ReviewForm = ({ restaurantId, onReviewSubmitted, onCancel }) => {
  const [rating, setRating] = useState(0); // 0 do të thotë pa vlerësim
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showError("Ju lutem jepni një vlerësim (rating) duke klikuar mbi yje.");
      return;
    }
    setIsLoading(true);
    try {
      // Backend-i pret: restaurant (ID), user (nga token), rating, comment
      // 'restaurant' do të jetë restaurantId i kaluar si prop
      // 'user' do të merret nga backend-i bazuar te tokeni
      const newReview = await customerApi.submitRestaurantReview(restaurantId, { rating, comment });
      showSuccess("Vlerësimi u dërgua me sukses!");
      if (onReviewSubmitted) {
        onReviewSubmitted(newReview); // Kalo review-in e ri te prindi
      }
      setRating(0); // Reset form
      setComment('');
    } catch (error) {
      console.error("Error submitting review:", error);
      showError(error.message || "Gabim gjatë dërgimit të vlerësimit.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-md mt-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vlerësimi Juaj:</label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none p-0.5 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <StarIconSolid
                className={`h-6 w-6 cursor-pointer transition-colors 
                            ${(hoverRating >= star || rating >= star) 
                                ? 'text-yellow-400 dark:text-yellow-300' 
                                : 'text-gray-300 dark:text-slate-600 hover:text-yellow-300/70'}`}
              />
            </button>
          ))}
        </div>
        {rating === 0 && <p className="text-xs text-red-500 mt-1">Zgjidhni një vlerësim.</p>}
      </div>
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Komenti Juaj (opsional):</label>
        <textarea
          id="comment"
          name="comment"
          rows="3"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input-form mt-1 w-full"
          placeholder="Shkruani komentin tuaj këtu..."
        />
      </div>
      <div className="flex justify-end space-x-3">
        {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                Anulo
            </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || rating === 0}>
          Dërgo Vlerësimin
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
