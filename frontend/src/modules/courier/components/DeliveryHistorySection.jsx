// src/modules/courier/components/DeliveryHistorySection.jsx
import React, { useEffect } from 'react'; // Hiq useContext pasi nuk përdoret direkt këtu
import { useTasks } from '../../../context/TaskContext.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';
import Button from '../../../components/Button.jsx'; // Për butonin Refresh

const DeliveryHistorySection = () => {
  // Përdor emrat e props-ave nga TaskContext i përditësuar
  const { deliveryHistory, totalEarnings, isLoadingHistory, fetchDeliveryHistory } = useTasks();

  // fetchDeliveryHistory thirret nga useEffect kryesor te TaskContext tani

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' });
  };

  const getStatusPill = (statusText) => { // Merr statusin e formatuar nga frontend-i
    let colorClasses = 'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-slate-200';
    const lowerStatus = statusText.toLowerCase();
    if (lowerStatus === 'delivered') {
      colorClasses = 'bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-200';
    } else if (lowerStatus.includes('cancelled')) {
      colorClasses = 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-200';
    } else if (lowerStatus === 'failed delivery') {
       colorClasses = 'bg-orange-100 text-orange-700 dark:bg-orange-600/30 dark:text-orange-200';
    }
    return <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} capitalize`}>{statusText}</span>;
  };

  if (isLoadingHistory && deliveryHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 text-center min-h-[200px] flex flex-col justify-center items-center">
        <HeroIcon icon="ArrowPathIcon" className="animate-spin h-8 w-8 text-primary-500 dark:text-primary-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-slate-300">Duke ngarkuar historikun...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2 sm:mb-0">Historiku i Dërgesave</h3>
        <Button variant="ghost" onClick={fetchDeliveryHistory} isLoading={isLoadingHistory} disabled={isLoadingHistory} size="sm" className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 p-1.5 self-start sm:self-center">
            <HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin':''}`}/>
        </Button>
      </div>
      <p className="text-md text-gray-700 dark:text-slate-200 mb-3">
        Fitimet Totale: <span className="font-semibold text-green-600 dark:text-green-400">{totalEarnings?.toFixed(2) || '0.00'} €</span>
      </p>

      {deliveryHistory.length === 0 && !isLoadingHistory ? (
        <div className="text-center py-8">
            <HeroIcon icon="ArchiveBoxXMarkIcon" className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">Nuk ka histori dërgesash.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar-thin pr-2">
          {deliveryHistory.map(task => ( // Task këtu ka fushat e transformuara nga TaskContext
            <div key={task.id} className="p-3 border border-gray-200 dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-700/40 text-xs sm:text-sm">
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium text-gray-700 dark:text-slate-100">Porosia #{task.orderId}</p>
                {getStatusPill(task.status)}
              </div>
              <p className="text-gray-500 dark:text-slate-400">Data: {formatDate(task.date)}</p>
              <p className="text-gray-500 dark:text-slate-400">Nga: {task.restaurantName}</p>
              <p className="text-gray-500 dark:text-slate-400">Pagesa: {task.payout?.toFixed(2)} €</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistorySection;