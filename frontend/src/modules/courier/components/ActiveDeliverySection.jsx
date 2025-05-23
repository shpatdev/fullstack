// src/modules/courier/components/ActiveDeliverySection.jsx
import React from 'react';
import Button from '../../../components/Button.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';
import { useTasks } from '../../../context/TaskContext.jsx';

const ActiveDeliverySection = () => {
  // Përdor emrat e props-ave nga TaskContext i përditësuar
  const { activeTask, updateActiveTaskStatus, isLoadingActiveTask, isLoadingUpdateStatus } = useTasks();

  if (isLoadingActiveTask && !activeTask) { // Trego loader vetëm nëse nuk ka detyrë të ngarkuar ende
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 text-center min-h-[300px] flex flex-col justify-center items-center">
        <HeroIcon icon="ArrowPathIcon" className="animate-spin h-10 w-10 text-primary-500 dark:text-primary-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-slate-300">Duke ngarkuar detyrën aktive...</p>
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 text-center min-h-[300px] flex flex-col justify-center items-center">
        <HeroIcon icon="TruckIcon" className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-slate-300">Nuk ka Dërgesë Aktive</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Pasi të pranoni një detyrë, detajet do të shfaqen këtu.</p>
      </div>
    );
  }

  // Supozojmë se activeTask ka fushat: id, orderId, status, restaurantName, restaurantAddress, 
  // customerName, customerAddress, itemsSummary, deliveryInstructions, payout
  // Këto vijnë nga transformTaskDataForFrontend te TaskContext

  const handleStatusUpdate = (newFrontendStatus) => {
    if (activeTask) {
      updateActiveTaskStatus(newFrontendStatus); // Ky funksion te TaskContext e bën konvertimin në backend status
    }
  };

  // Përcakto veprimet bazuar në statusin e frontend-it (me hapësira, shkronja të vogla)
  const getNextAction = () => {
    switch (activeTask.status) {
      case 'assigned': // Ose çfarëdo statusi që kthen API pasi shoferi e pranon
      case 'confirmed': // Nëse API kthen 'confirmed' pasi shoferi pranon
        return { label: "Kam Marrë Porosinë", action: () => handleStatusUpdate('picked up'), icon: "ArchiveBoxArrowDownIcon", variant:"yellow" };
      case 'picked up':
        return { label: "Nis Dërgesën", action: () => handleStatusUpdate('en route'), icon: "TruckIcon", variant:"indigo" };
      case 'en route':
        return { label: "Dërgesa u Krye", action: () => handleStatusUpdate('delivered'), icon: "CheckBadgeIcon", variant:"green" };
      default:
        return null;
    }
  };

  const nextActionDetails = getNextAction();
  const currentStatusDisplay = activeTask.status.charAt(0).toUpperCase() + activeTask.status.slice(1);

  return (
    <div className="bg-gradient-to-br from-primary-600 to-secondary-600 dark:from-slate-800 dark:to-slate-900 shadow-2xl rounded-xl p-5 sm:p-6 md:p-8 text-white">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-0">Dërgesa Aktive: #{activeTask.orderId}</h2>
        <span className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full shadow-sm
            ${activeTask.status === 'delivered' ? 'bg-green-400 text-green-900' : 
              activeTask.status === 'picked up' || activeTask.status === 'en route' ? 'bg-blue-400 text-blue-900' :
              activeTask.status === 'assigned' || activeTask.status === 'confirmed' ? 'bg-yellow-400 text-yellow-900' :
              'bg-gray-300 text-gray-800'}`}>
          {currentStatusDisplay}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="bg-white/10 dark:bg-black/20 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="text-md sm:text-lg font-semibold text-yellow-300 mb-2 flex items-center">
            <HeroIcon icon="BuildingStorefrontIcon" className="h-5 w-5 mr-2 flex-shrink-0" /> Merr Nga:
          </h3>
          <p className="text-sm font-medium text-primary-50 dark:text-slate-100">{activeTask.restaurantName}</p>
          <p className="text-xs text-primary-100 dark:text-slate-300 truncate" title={activeTask.restaurantAddress}>{activeTask.restaurantAddress}</p>
        </div>
        <div className="bg-white/10 dark:bg-black/20 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="text-md sm:text-lg font-semibold text-yellow-300 mb-2 flex items-center">
            <HeroIcon icon="MapPinIcon" className="h-5 w-5 mr-2 flex-shrink-0" /> Dërgo Tek:
          </h3>
          <p className="text-sm font-medium text-primary-50 dark:text-slate-100">{activeTask.customerName}</p>
          <p className="text-xs text-primary-100 dark:text-slate-300 truncate" title={activeTask.customerAddress}>{activeTask.customerAddress}</p>
        </div>
      </div>
      
      {activeTask.deliveryInstructions && 
        <div className="mb-5 bg-white/5 dark:bg-black/10 p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-200 dark:text-yellow-300"><span className="font-semibold">Udhëzime:</span> {activeTask.deliveryInstructions}</p>
        </div>
      }
      
      <div className="mb-6 bg-white/10 dark:bg-black/20 p-4 rounded-lg backdrop-blur-sm">
        <h3 className="text-md sm:text-lg font-semibold text-yellow-300 mb-2 flex items-center">
            <HeroIcon icon="QueueListIcon" className="h-5 w-5 mr-2" /> Përmbledhja e Porosisë
        </h3>
        <p className="text-xs sm:text-sm text-primary-100 dark:text-slate-300 mb-2 truncate" title={activeTask.itemsSummary}>Artikujt: {activeTask.itemsSummary}</p>
        <p className="text-right text-md sm:text-lg font-semibold mt-2 text-yellow-300">Pagesa për Ty: {activeTask.payout?.toFixed(2)} €</p>
      </div>

      {nextActionDetails && (
        <div className="mt-6 sm:mt-8 text-center">
          <Button
            variant={nextActionDetails.variant || "primary"}
            size="lg"
            onClick={nextActionDetails.action}
            isLoading={isLoadingUpdateStatus} // Përdor këtë nga context
            className={`font-bold w-full md:w-auto shadow-lg transition-transform hover:scale-105 text-white 
                        ${nextActionDetails.variant === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-400' :
                          nextActionDetails.variant === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-400' :
                          nextActionDetails.variant === 'green' ? 'bg-green-500 hover:bg-green-400' :
                         'bg-primary-500 hover:bg-primary-400'}`} // Siguro ngjyra te sakta
            iconLeft={<HeroIcon icon={nextActionDetails.icon} className="h-5 w-5"/>}
          >
            {nextActionDetails.label}
          </Button>
        </div>
      )}
      {activeTask.status === 'delivered' && (
         <p className="text-center mt-5 text-green-300 font-semibold text-lg flex items-center justify-center gap-2">
            <HeroIcon icon="CheckCircleIcon" className="h-6 w-6"/> Dërgesa u kompletua me sukses!
         </p>
      )}
    </div>
  );
};

export default ActiveDeliverySection;