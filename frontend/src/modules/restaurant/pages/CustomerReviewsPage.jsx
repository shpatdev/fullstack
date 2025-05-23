// src/modules/restaurant/pages/CustomerReviewsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon.jsx';
import Button from '../../../components/Button.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';

const CustomerReviewsPage = () => {
  const { token } = useAuth();
  const { currentRestaurantId, currentRestaurantName } = useOutletContext();
  const { showError, showSuccess } = useNotification();

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  
  const [replyingTo, setReplyingTo] = useState(null); // reviewId to reply to
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!currentRestaurantId || !token) {
        setError("Restoranti nuk është zgjedhur ose nuk jeni të kyçur.");
        setIsLoading(false);
        setReviews([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.fetchReviewsForRestaurant(currentRestaurantId); // Token shtohet nga apiService
      const fetchedReviews = data.reviews || data || []; // Supozojmë se API kthen {reviews: [...]} ose direkt [...]
      setReviews(fetchedReviews);

      if (fetchedReviews.length > 0) {
        const totalRating = fetchedReviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(parseFloat((totalRating / fetchedReviews.length).toFixed(1)));
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        fetchedReviews.forEach(review => { 
            if (review.rating >= 1 && review.rating <= 5) { // Sigurohemi që rating është valid
                dist[Math.floor(review.rating)]++; 
            }
        });
        setRatingDistribution(dist);
      } else {
        setAverageRating(0);
        setRatingDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      }
    } catch (err) {
      console.error("CustomerReviewsPage: Failed to fetch reviews", err);
      setError(err.message || "S'u mund të ngarkoheshin vlerësimet.");
      showError(err.message || "S'u mund të ngarkoheshin vlerësimet.");
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurantId, token, showError]);

  useEffect(() => {
    if (currentRestaurantId) { // Thirr vetëm nëse ka ID restoranti
        fetchReviews();
    } else {
        setIsLoading(false); // Ndalo ngarkimin nëse nuk ka ID
        setReviews([]); // Pastro vlerësimet
        setError("Zgjidhni një restorant për të parë vlerësimet.");
    }
  }, [fetchReviews, currentRestaurantId]);

  const handleStartReply = (reviewId, existingReplyText = '') => {
    setReplyingTo(reviewId);
    setReplyText(existingReplyText);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) {
        showError("Përgjigja nuk mund të jetë bosh.");
        return;
    }
    setIsSubmittingReply(true);
    try {
        const updatedReview = await restaurantApi.submitReviewReply(reviewId, replyText); // API reale
        showSuccess("Përgjigja u dërgua/përditësua me sukses!");
        setReviews(prev => prev.map(r => r.id === reviewId ? {...r, reply: updatedReview.reply } : r)); // Përditëso me përgjigjen nga API
        handleCancelReply();
    } catch (err) {
        showError(err.message || "Gabim gjatë dërgimit të përgjigjes.");
    } finally {
        setIsSubmittingReply(false);
    }
  };

  const StarRatingDisplay = ({ rating, size = "h-5 w-5" }) => ( /* ... si më parë ... */ 
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <HeroIcon key={i} icon="StarIcon" className={`${size} ${i < Math.floor(rating) ? 'text-yellow-400 dark:text-yellow-300' : i < rating ? 'text-yellow-400/70 dark:text-yellow-300/70' : 'text-gray-300 dark:text-slate-600'}`} />
      ))}
    </div>
  );

  const RatingBar = ({ rating, count, totalReviews }) => { /* ... si më parë ... */ 
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-600 dark:text-slate-400 w-6 text-right">{rating}★</span>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div className="bg-yellow-400 dark:bg-yellow-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
        </div>
        <span className="text-gray-600 dark:text-slate-400 w-8 text-right tabular-nums">{count}</span>
      </div>
    );
  };
  
  if (isLoading && reviews.length === 0) { /* ... si më parë ... */ }
  if (error && !isLoading) { /* ... si më parë ... */ }
  if (!currentRestaurantId && !isLoading) {
      return <div className="text-center py-10 text-lg text-gray-500 dark:text-slate-400">Ju lutem zgjidhni një restorant nga paneli juaj (nëse keni më shumë se një) për të parë vlerësimet.</div>
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Vlerësimet për {currentRestaurantName || "Restorantin"}</h1>
         <Button variant="outline" onClick={fetchReviews} isLoading={isLoading} disabled={isLoading}
                iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>

      {error && !isLoading && <div className="text-center text-red-500 dark:text-red-400 py-6 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 md:mb-10">
        <div className="md:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 text-center border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-medium text-gray-700 dark:text-slate-300 mb-1">Vlerësimi Mesatar</h2>
          {isLoading ? <div className="h-20 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400"></div></div> : 
            <>
              <p className="text-5xl font-bold text-gray-800 dark:text-white mb-2">{averageRating.toFixed(1)}</p>
              <div className="flex justify-center"><StarRatingDisplay rating={averageRating} size="h-7 w-7" /></div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Bazuar në {reviews.length} vlerësime</p>
            </>
          }
        </div>
        <div className="md:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-medium text-gray-700 dark:text-slate-300 mb-4">Shpërndarja e Vlerësimeve</h2>
          {isLoading ? <div className="h-32 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400"></div></div> :
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar key={star} rating={star} count={ratingDistribution[star]} totalReviews={reviews.length} />
              ))}
            </div>
          }
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length > 0 ? reviews.map(review => (
          <div key={review.id} className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2 sm:mb-3">
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-white">{review.customerName || 'Anonim'}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {new Date(review.date).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="mt-1.5 sm:mt-0"><StarRatingDisplay rating={review.rating} /></div>
            </div>
            <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed mb-2.5">{review.comment}</p>
            {review.items_ordered && review.items_ordered.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                    <span className="font-medium">Porositur:</span> {review.items_ordered.join(', ')}
                </p>
            )}

            {review.reply ? (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 p-3 rounded-md">
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">Përgjigja Juaj:</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300 italic mt-1">{review.reply.text}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 text-right mt-1">
                        {new Date(review.reply.date).toLocaleDateString('sq-AL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                    </p>
                </div>
            ) : (
                replyingTo === review.id ? (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-600">
                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Shkruani përgjigjen tuaj..."
                            rows="2" className="input-form w-full text-sm" />
                        <div className="flex justify-end space-x-2 mt-2">
                            <Button variant="ghost" size="sm" onClick={handleCancelReply} disabled={isSubmittingReply}>Anulo</Button>
                            <Button variant="primary" size="sm" onClick={() => handleSubmitReply(review.id)} isLoading={isSubmittingReply} disabled={isSubmittingReply}>Dërgo</Button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleStartReply(review.id)} iconLeft={<HeroIcon icon="PencilSquareIcon" className="h-3.5 w-3.5"/>}> Përgjigju </Button>
                    </div>
                )
            )}
          </div>
        )) : (
            !isLoading && <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md min-h-[200px] flex flex-col justify-center items-center">
                 <HeroIcon icon="ChatBubbleLeftEllipsisIcon" className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-300 text-lg">Nuk ka vlerësime për t'u shfaqur.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviewsPage;