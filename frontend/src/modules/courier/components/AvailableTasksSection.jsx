// src/modules/courier/components/AvailableTasksSection.jsx
import React, { useEffect, useCallback } from 'react'; // Shtuar useCallback
import Button from '../../../components/Button.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx'; // Nuk nevojitet më këtu pasi TaskContext e menaxhon userin

const AvailableTasksSection = () => {
  const { 
    availableTasks, 
    acceptTask, 
    fetchAvailableTasks, 
    isDriverOnline, 
    activeTask,
    isLoadingAvailableTasks, // Nga contexti i ri
    isLoadingAcceptTask,     // Nga contexti i ri
    taskIdBeingAccepted    // Nga contexti i ri
  } = useTasks();
  // const { user } = useAuth(); // Nuk nevojitet më këtu

  // useEffect për rifreskim periodik
  useEffect(() => {
    if (isDriverOnline) {
      // fetchAvailableTasks(); // Thirrja fillestare bëhet nga useEffect kryesor te TaskContext
      const intervalId = setInterval(() => {
        if (!activeTask) { // Rifresko vetëm nëse nuk ka detyrë aktive
            fetchAvailableTasks();
        }
      }, 30000); // Rifresko çdo 30 sekonda
      return () => clearInterval(intervalId);
    }
  }, [isDriverOnline, fetchAvailableTasks, activeTask]);


  const handleAcceptTaskClick = (taskId) => {
    // acceptTask te TaskContext tashmë e di shoferin nga user-i i AuthContext
    acceptTask(taskId);
  };

  const TaskCard = ({ task }) => (
    // Supozojmë se 'task' objekti këtu ka fushat: id, restaurant_details.name, 
    // restaurant_details.address, delivery_address_street, delivery_address_city, total_amount
    // Këto vijnë nga transformTaskDataForFrontend te TaskContext
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-700 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
            <h4 className="text-lg font-semibold text-primary-700 dark:text-primary-400">Porosi #{task.id}</h4>
            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-100 dark:bg-green-600/30 rounded-full">
            Gati për Marrje
            </span>
        </div>
        <div className="mb-3 space-y-1.5 text-sm text-gray-700 dark:text-slate-300">
            <p className="flex items-start"> {/* Ndryshuar në items-start për tekste të gjata */}
                <HeroIcon icon="BuildingStorefrontIcon" className="h-4 w-4 mt-0.5 mr-2 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <span className="font-medium mr-1">Nga:</span> <span className="truncate" title={task.restaurant_details?.name}>{task.restaurant_details?.name || 'N/A'}</span>
            </p>
            <p className="flex items-start">
                <HeroIcon icon="MapIcon" className="h-4 w-4 mt-0.5 mr-2 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <span className="font-medium mr-1">Adresa Rest.:</span> <span title={task.restaurant_details?.address}>{task.restaurant_details?.address || 'N/A'}</span>
            </p>
            <p className="flex items-start">
                <HeroIcon icon="MapPinIcon" className="h-4 w-4 mt-0.5 mr-2 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <span className="font-medium mr-1">Adresa Kli.:</span> <span title={`${task.delivery_address_street}, ${task.delivery_address_city}`}>{task.delivery_address_street}, {task.delivery_address_city}</span>
            </p>
            <p className="flex items-center">
                <HeroIcon icon="CurrencyEuroIcon" className="h-4 w-4 mr-2 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <span className="font-medium mr-1">Vlera:</span> {parseFloat(task.total_amount || 0).toFixed(2)} €
            </p>
        </div>
      </div>
      <Button 
        variant="primary" 
        fullWidth 
        onClick={() => handleAcceptTaskClick(task.id)}
        isLoading={isLoadingAcceptTask && taskIdBeingAccepted === task.id} // Përdor props të reja
        disabled={isLoadingAcceptTask || !!activeTask}
        iconLeft={<HeroIcon icon="CheckCircleIcon" className="h-5 w-5"/>}
        className="mt-auto"
      > Prano Dërgesën </Button>
    </div>
  );

  if (!isDriverOnline) { /* ... mbetet si më parë ... */ }  
  if (isLoadingAvailableTasks && availableTasks.length === 0) { /* ... mbetet si më parë ... */ }
  if (activeTask) { /* ... mbetet si më parë ... */ }
  if (availableTasks.length === 0 && !isLoadingAvailableTasks) { /* ... mbetet si më parë ... */ }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Dërgesa të Disponueshme ({availableTasks.length})</h3>
            <Button variant="ghost" onClick={fetchAvailableTasks} isLoading={isLoadingAvailableTasks} disabled={isLoadingAvailableTasks || !!activeTask} size="sm" className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 p-1.5">
                <HeroIcon icon="ArrowPathIcon" className={`h-5 w-5 ${isLoadingAvailableTasks ? 'animate-spin':''}`}/>
            </Button>
        </div>
        {availableTasks.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5 md:gap-6"> {/* Ndryshuar grid për më pak kolona */}
                {availableTasks.map(task => (
                <TaskCard key={task.id} task={task} />
                ))}
            </div>
        )}
    </div>
  );
};

export default AvailableTasksSection;