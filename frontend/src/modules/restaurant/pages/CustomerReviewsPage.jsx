// src/modules/restaurant/pages/CustomerReviewsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { StarIcon, PencilSquareIcon, ChatBubbleLeftEllipsisIcon, ArrowPathIcon, ExclamationTriangleIcon, InboxIcon } from '@heroicons/react/24/outline';
import Button from "../../../components/Button.jsx";
import { restaurantApi } from "../../../api/restaurantApi.js";
import { useNotification } from "../../../context/NotificationContext.jsx";
import ModalShell from "../../../components/ModalShell.jsx"; // Assuming path

const CustomerReviewsPage = () => {
  const { currentRestaurant } = useOutletContext() || {};
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();
  
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [currentReviewToReply, setCurrentReviewToReply] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!currentRestaurant?.id) {
        setError("Restoranti nuk është zgjedhur ose nuk ka ID.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.getRestaurantReviews(currentRestaurant.id);
      setReviews(data.results || data || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError(err.message || "Problem në ngarkimin e vlerësimeve.");
      showError(err.message || "Problem në ngarkimin e vlerësimeve.");
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant?.id, showError]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenReplyModal = (review) => {
    setCurrentReviewToReply(review);
    setReplyText(review.reply || "");
    setIsReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    setIsReplyModalOpen(false);
    setCurrentReviewToReply(null);
    setReplyText("");
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!currentReviewToReply || !replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const updatedReview = await restaurantApi.replyToReview(currentRestaurant.id, currentReviewToReply.id, replyText);
      setReviews(prevReviews => 
        prevReviews.map(r => r.id === updatedReview.id ? updatedReview : r)
      );
      showSuccess("Përgjigja u dërgua me sukses!");
      handleCloseReplyModal();
    } catch (err) {
      console.error("Failed to submit reply:", err);
      showError(err.message || "Problem gjatë dërgimit të përgjigjes.");
    } finally {
      setIsSubmittingReply(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!currentRestaurant) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-200 flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
        <p>Ju lutem zgjidhni ose krijoni një restorant për të parë këtë faqe.</p>
      </div>
    );
  }
  
  if (error && !isLoading) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-md text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
            <p>{error}</p>
            <Button onClick={fetchReviews} variant="outline" size="sm" className="ml-auto">Provo Përsëri</Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white flex items-center">
            <ChatBubbleLeftEllipsisIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
            Vlerësimet e Klientëve
        </h1>
        <Button onClick={fetchReviews} variant="outline" iconLeft={ArrowPathIcon} isLoading={isLoading} disabled={isLoading}>
            Rifresko Vlerësimet
        </Button>
      </div>

      {isLoading && reviews.length === 0 && (
         <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-primary-500" />
         </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow">
          <InboxIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-slate-300">Nuk ka vlerësime për këtë restorant ende.</p>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-4 sm:p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{review.user_full_name || review.user_email || 'Anonim'}</p>
                  <div className="flex items-center mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`} />
                    ))}
                    <span className="ml-1.5 text-xs text-gray-500 dark:text-slate-400">({review.rating}.0)</span>
                  </div>
                </div>
                <time className="text-xs text-gray-400 dark:text-slate-500">{formatDate(review.created_at)}</time>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 leading-relaxed">{review.comment}</p>
              
              {review.reply && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Përgjigja e Restorantit:</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300 italic">{review.reply}</p>
                  <time className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 block">{formatDate(review.replied_at)}</time>
                </div>
              )}

              <div className="mt-3 text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenReplyModal(review)}
                  iconLeft={PencilSquareIcon}
                >
                  {review.reply ? 'Modifiko Përgjigjen' : 'Përgjigju'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isReplyModalOpen && currentReviewToReply && (
        <ModalShell isOpen={isReplyModalOpen} onClose={handleCloseReplyModal} title={`Përgjigju Vlerësimit #${currentReviewToReply.id}`}>
            <form onSubmit={handleReplySubmit} className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Vlerësimi nga: {currentReviewToReply.user_full_name || currentReviewToReply.user_email}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 italic mt-1">"{currentReviewToReply.comment}"</p>
                </div>
                <div>
                    <label htmlFor="replyText" className="label-form">Përgjigja Juaj:</label>
                    <textarea 
                        id="replyText"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows="4"
                        className="input-form w-full"
                        required
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={handleCloseReplyModal}>Anulo</Button>
                    <Button type="submit" isLoading={isSubmittingReply} disabled={isSubmittingReply}>
                        Dërgo Përgjigjen
                    </Button>
                </div>
            </form>
        </ModalShell>
      )}
    </div>
  );
};

export default CustomerReviewsPage;