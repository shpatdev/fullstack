// src/modules/restaurant/pages/CustomerReviewsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon';
import Button from '../../../components/Button'; // If adding reply button
import { restaurantApi } from '../../../api/restaurantApi'; // Assuming API for reviews
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

// Mock data (replace with API call)
const mockReviewsData = [
  { id: 'rev1', customerName: 'Ana K.', rating: 5, comment: 'Ushqim fantastik dhe shërbim i shkëlqyer! Pica ishte perfekte. Do të porosis përsëri pa dyshim.', date: '2024-05-15T10:30:00Z', items_ordered: ['Pizza Margherita', 'Coca-Cola'], reply: null },
  { id: 'rev2', customerName: 'Bledi M.', rating: 4, comment: 'Vendi ishte shumë i këndshëm dhe stafi miqësor. Burgeri ishte i shijshëm, por patatet mund të ishin më krokante.', date: '2024-05-14T18:00:00Z', items_ordered: ['Burger Special', 'Patate të Skuqura'], reply: { text: "Faleminderit Bledi! Do ta kemi parasysh sugjerimin për patatet.", date: '2024-05-15T09:00:00Z'} },
  { id: 'rev3', customerName: 'Lira G.', rating: 3, comment: 'Ushqimi ishte OK, por pritëm pak gjatë për porosinë. Kamarieri dukej i mbingarkuar.', date: '2024-05-12T20:15:00Z', items_ordered: ['Pasta Carbonara'], reply: null },
  { id: 'rev4', customerName: 'Genti P.', rating: 5, comment: 'Supa e ditës ishte e jashtëzakonshme. Shërbim i shpejtë dhe çmime të arsyeshme. Rekomandoj!', date: '2024-05-10T13:00:00Z', items_ordered: ['Supë Pule', 'Bukë e Thekur'], reply: null },
  { id: 'rev5', customerName: 'Ema T.', rating: 2, comment: 'Peshku nuk ishte i freskët siç pritej. Pak zhgënjim këtë herë.', date: '2024-05-09T19:00:00Z', items_ordered: ['Fileto Peshku Zgare'], reply: null },
];

const CustomerReviewsPage = () => {
  const { token } = useAuth();
  const { currentRestaurantId } = useOutletContext();
  const { showError, showSuccess } = useNotification();

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  
  const [replyingTo, setReplyingTo] = useState(null); // reviewId to reply to
  const [replyText, setReplyText] = useState('');

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
      // const data = await restaurantApi.fetchReviewsForRestaurant(currentRestaurantId, token);
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
      const data = { reviews: mockReviewsData, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }; // Placeholder structure
      
      const fetchedReviews = data.reviews || [];
      setReviews(fetchedReviews);

      if (fetchedReviews.length > 0) {
        const totalRating = fetchedReviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(parseFloat((totalRating / fetchedReviews.length).toFixed(1)));
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        fetchedReviews.forEach(review => { dist[review.rating]++; });
        setRatingDistribution(dist);
      } else {
        setAverageRating(0);
        setRatingDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      }

    } catch (err) {
      console.error("Reviews: Failed to fetch reviews", err);
      setError(err.message || "S'u mund të ngarkoheshin vlerësimet.");
      showError(err.message || "S'u mund të ngarkoheshin vlerësimet.");
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurantId, token, showError]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStartReply = (reviewId) => {
    setReplyingTo(reviewId);
    setReplyText(''); // Clear previous text
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
    // setIsLoadingReply(true); // Specific loading state for replying
    try {
        // await restaurantApi.submitReviewReply(reviewId, replyText, token);
        await new Promise(resolve => setTimeout(resolve, 500)); // Mock API
        showSuccess("Përgjigja u dërgua me sukses (mock).");
        // Optimistically update UI or re-fetch reviews
        setReviews(prev => prev.map(r => r.id === reviewId ? {...r, reply: {text: replyText, date: new Date().toISOString()}} : r));
        handleCancelReply();
    } catch (err) {
        showError(err.message || "Gabim gjatë dërgimit të përgjigjes.");
    } finally {
        // setIsLoadingReply(false);
    }
  };


  const StarRatingDisplay = ({ rating, size = "h-5 w-5" }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <HeroIcon key={i} icon="StarIcon" className={`${size} ${i < Math.floor(rating) ? 'text-yellow-400 dark:text-yellow-300' : i < rating ? 'text-yellow-400/70 dark:text-yellow-300/70' : 'text-gray-300 dark:text-gray-600'}`} />
      ))}
    </div>
  );

  const RatingBar = ({ rating, count, totalReviews }) => {
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400 w-6 text-right">{rating}★</span>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div className="bg-yellow-400 dark:bg-yellow-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
        </div>
        <span className="text-gray-600 dark:text-gray-400 w-8 text-right tabular-nums">{count}</span>
      </div>
    );
  };
  
  if (isLoading && reviews.length === 0) { // Show main loader only on initial full load
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  }
   if (error && !isLoading) { // Show error if not loading
    return <div className="text-center text-red-500 dark:text-red-400 py-10 bg-red-50 dark:bg-red-900/30 p-6 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Vlerësimet e Klientëve</h1>
         <Button variant="outline" onClick={fetchReviews} isLoading={isLoading} disabled={isLoading}
                iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`}/>}>
          Rifresko
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-1 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Vlerësimi Mesatar</h2>
          <p className="text-5xl font-bold text-gray-800 dark:text-white mb-2">{averageRating.toFixed(1)}</p>
          <div className="flex justify-center"><StarRatingDisplay rating={averageRating} size="h-7 w-7" /></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Bazuar në {reviews.length} vlerësime</p>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Shpërndarja e Vlerësimeve</h2>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => (
              <RatingBar key={star} rating={star} count={ratingDistribution[star]} totalReviews={reviews.length} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length > 0 ? reviews.map(review => (
          <div key={review.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3">
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-white">{review.customerName}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(review.date).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="mt-2 sm:mt-0"><StarRatingDisplay rating={review.rating} /></div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">{review.comment}</p>
            {review.items_ordered && review.items_ordered.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="font-medium">Porositur:</span> {review.items_ordered.join(', ')}
                </p>
            )}

            {/* Reply Section */}
            {review.reply ? (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">Përgjigja e Restorantit:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-1">{review.reply.text}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">
                        {new Date(review.reply.date).toLocaleDateString('sq-AL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                    </p>
                </div>
            ) : (
                replyingTo === review.id ? (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Shkruani përgjigjen tuaj..."
                            rows="2"
                            className="input-form w-full text-sm"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                            <Button variant="ghost" size="sm" onClick={handleCancelReply}>Anulo</Button>
                            <Button variant="primary" size="sm" onClick={() => handleSubmitReply(review.id)} /*isLoading={isLoadingReply}*/>Dërgo</Button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleStartReply(review.id)} iconLeft={<HeroIcon icon="PencilIcon" className="h-3.5 w-3.5"/>}>
                            Përgjigju
                        </Button>
                    </div>
                )
            )}
          </div>
        )) : (
            !isLoading && <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                 <HeroIcon icon="ChatBubbleLeftEllipsisIcon" className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 text-lg">Nuk ka vlerësime për t'u shfaqur.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviewsPage;