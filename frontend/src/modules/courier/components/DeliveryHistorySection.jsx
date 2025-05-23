// src/modules/courier/components/DeliveryHistorySection.jsx
import React, { useEffect, useState } from "react"; // Added useState
import { useTasks } from "../../../context/TaskContext.jsx";
// import HeroIcon from "../../../components/HeroIcon.jsx"; // FSHIJE KËTË
import { ArrowPathIcon, ArchiveBoxXMarkIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from "../../../components/Button.jsx";

const DeliveryHistorySection = () => {
  const { completedTasks, fetchCompletedTasks, isLoadingCompleted } = useTasks();
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    fetchCompletedTasks();
  }, [fetchCompletedTasks]);

  const loadMore = () => {
    setVisibleCount(prevCount => prevCount + 5);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('sq-AL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoadingCompleted && completedTasks.length === 0) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[200px]">
            <ArrowPathIcon className="animate-spin h-10 w-10 text-primary-500 mb-3" />
            <p className="text-gray-500 dark:text-slate-400">Duke ngarkuar historikun...</p>
        </div>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 text-center">
        <ArchiveBoxXMarkIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">Nuk keni histori dërgesash.</h3>
        <p className="text-gray-500 dark:text-slate-400">Dërgesat e kompletuara do të shfaqen këtu.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-5 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Historiku i Dërgesave</h2>
         <Button onClick={fetchCompletedTasks} variant="ghost" size="sm" isLoading={isLoadingCompleted && completedTasks.length > 0} disabled={isLoadingCompleted} iconLeft={ArrowPathIcon} className="text-sm">
          {isLoadingCompleted && completedTasks.length > 0 ? 'Rifreskim...' : 'Rifresko'}
        </Button>
      </div>
      <div className="space-y-3">
        {completedTasks.slice(0, visibleCount).map((task) => (
          <div key={task.id} className="border dark:border-slate-700 rounded-md p-3 bg-slate-50 dark:bg-slate-700/30">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-200">Porosia #{task.order_id}</h4>
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1" /> Kompletuar
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              <ClockIcon className="h-3.5 w-3.5 mr-1 inline align-text-bottom"/>
              Dorëzuar më: {formatDate(task.delivered_at || task.updated_at)}
            </p>
            <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">Pagesa: {task.delivery_fee ? `${parseFloat(task.delivery_fee).toFixed(2)} €` : 'N/A'}</p>
            {/* Add more details if needed, e.g., restaurant, customer */}
          </div>
        ))}
      </div>
      {visibleCount < completedTasks.length && (
        <div className="mt-4 text-center">
          <Button onClick={loadMore} variant="outline" size="sm">
            Shfaq Më Shumë
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeliveryHistorySection;