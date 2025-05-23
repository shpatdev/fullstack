import React from 'react';
// import HeroIcon from '../../../components/HeroIcon'; // Remove this
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline'; // For empty stars if needed
import { UserCircleIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'; // For user and reply icon
import Button from '../../../components/Button'; // If you have reply functionality

const ReviewCard = ({ review, onReply, currentUserId, onEditReply, onDeleteReply }) => {
  const renderStars = (rating) => {
    const totalStars = 5;
    let stars = [];
    for (let i = 1; i <= totalStars; i++) {
      stars.push(
        i <= rating ? (
          <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIconOutline key={i} className="h-5 w-5 text-yellow-400" />
        )
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Datë e panjohur';
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 sm:p-5">
      <div className="flex items-start mb-2">
        <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500 mr-3 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
            {review.user_details?.first_name || review.user_details?.email || 'Përdorues Anonim'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-slate-400">{formatDate(review.created_at)}</p>
        </div>
        <div className="ml-auto flex items-center">{renderStars(review.rating)}</div>
      </div>
      <p className="text-sm text-gray-700 dark:text-slate-300 mb-3 leading-relaxed">{review.comment}</p>

      {review.reply && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
          <div className="flex items-start">
            <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-primary-500 dark:text-primary-400 mr-2.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-300 mb-0.5">
                Përgjigje nga Restoranti ({formatDate(review.reply.created_at)})
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{review.reply.text}</p>
            </div>
          </div>
           {/* Optional: Edit/Delete reply for restaurant owner */}
           {currentUserId && review.reply.user === currentUserId && onEditReply && onDeleteReply && (
             <div className="mt-2 text-right">
                <Button size="xs" variant="ghost" onClick={() => onEditReply(review.id, review.reply)} className="mr-1">Modifiko</Button>
                <Button size="xs" variant="ghost" onClick={() => onDeleteReply(review.id, review.reply.id)} className="text-red-500">Fshij</Button>
             </div>
           )}
        </div>
      )}
      
      {/* Placeholder for reply button if the current user is the restaurant owner and there's no reply yet */}
      {/* This logic would typically be in a different view (Restaurant Owner's review management) */}
      {/* {onReply && !review.reply && currentUserId === review.restaurant_owner_id && (
        <div className="mt-3 text-right">
          <Button onClick={() => onReply(review.id)} size="sm" variant="outline">
            Përgjigju
          </Button>
        </div>
      )} */}
    </div>
  );
};

export default ReviewCard;
