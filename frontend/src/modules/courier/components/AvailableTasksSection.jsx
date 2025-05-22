// src/modules/courier/components/AvailableTasksSection.jsx
import React, { useContext } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx'; // Adjust path as per your TaskContext location
import { Loader2 } from 'lucide-react'; // Or your preferred loader icon
import { useAuth } from '../../../context/AuthContext'; // Shto këtë

const AvailableTasksSection = () => {
  const { availableTasks, acceptTask, fetchAvailableTasks, isLoading, isDriverOnline, activeTask } = useTasks();
  const { user } = useAuth(); // Merr user për ID e profilit të shoferit

  // ... useEffect siç ishte ...
  useEffect(() => {
    if (isDriverOnline && user?.driverProfile?.id) { // Sigurohu që kemi driverProfileId
      fetchAvailableTasks(); // Fetch fillestar
      const intervalId = setInterval(() => {
        if (!activeTask) { 
            fetchAvailableTasks();
        }
      }, 30000);
      return () => clearInterval(intervalId);
    } else if (!isDriverOnline) {
        // availableTasks duhet të pastrohen nga TaskContext kur shoferi bëhet offline
    }
  }, [isDriverOnline, fetchAvailableTasks, activeTask, user?.driverProfile?.id]);


  const handleAcceptTask = (taskId) => {
    if (user?.driverProfile?.id) {
      acceptTask(taskId); // acceptTask te TaskContext tashmë e di driverProfileId nga user
    } else {
      console.error("Nuk mund të pranohet detyra: ID e profilit të shoferit mungon.");
      // Mund të shfaqësh një njoftim gabimi këtu
    }
  };

  const TaskCard = ({ task }) => (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
            <h4 className="text-lg font-semibold text-primary-700 dark:text-primary-400">Porosi #{task.id}</h4>
            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-100 dark:bg-green-600/30 rounded-full">
            Gati për Marrje
            </span>
        </div>
        <div className="mb-3 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
            <p className="flex items-center">
            <HeroIcon icon="BuildingStorefrontIcon" className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="font-medium mr-1">Restoranti:</span> <span className="truncate" title={task.restaurant_details.name}>{task.restaurant_details.name}</span>
            </p>
            <p className="flex items-center">
            <HeroIcon icon="MapIcon" className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="font-medium mr-1">Adresa e Rest.:</span> <span className="truncate" title={task.restaurant_details.address}>{task.restaurant_details.address}</span>
            </p>
            <p className="flex items-center">
            <HeroIcon icon="MapPinIcon" className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="font-medium mr-1">Adresa e Kli.:</span> <span className="truncate" title={`${task.delivery_address_street}, ${task.delivery_address_city}`}>{task.delivery_address_street}, {task.delivery_address_city}</span>
            </p>
            <p className="flex items-center">
            <HeroIcon icon="CurrencyEuroIcon" className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="font-medium mr-1">Vlera:</span> {parseFloat(task.total_amount).toFixed(2)} €
            </p>
        </div>
      </div>
      <Button 
        variant="primary" 
        fullWidth 
        onClick={() => handleAcceptTask(task.id)}
        isLoading={isLoading.accept && isLoading.taskId === task.id}
        disabled={isLoading.accept || !!activeTask} // Disable if already has active task
        iconLeft={<HeroIcon icon="CheckCircleIcon" className="h-5 w-5"/>}
        className="mt-auto"
      >
        Prano Dërgesën
      </Button>
    </div>
  );

  // ... pjesa tjetër e renderimit siç ishte ...
  if (!isDriverOnline) {
    return (
      <div className="text-center p-6 bg-white dark:bg-gray-700/30 rounded-lg shadow-md">
        <HeroIcon icon="InformationCircleIcon" className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300">Ju lutem aktivizohuni për të parë detyrat e disponueshme.</p>
      </div>
    );
  }
  
  if (isLoading.available && availableTasks.length === 0) {
     return (
      <div className="text-center p-6">
        <HeroIcon icon="ArrowPathIcon" className="animate-spin h-8 w-8 text-primary-500 dark:text-primary-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300">Duke kërkuar për dërgesa...</p>
      </div>
    );
  }

  if (activeTask) {
    return (
      <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-800/30 border border-yellow-300 dark:border-yellow-700/50 rounded-lg shadow-md">
        <HeroIcon icon="ExclamationTriangleIcon" className="h-10 w-10 text-yellow-500 dark:text-yellow-400 mx-auto mb-3" />
        <p className="text-yellow-700 dark:text-yellow-300 font-medium">
          Keni një dërgesë aktive. Kompletojeni atë për të parë detyra të reja.
        </p>
      </div>
    );
  }
  
  if (availableTasks.length === 0 && !isLoading.available) { // Shfaq vetëm nëse nuk po ngarkohet dhe nuk ka detyra
    return (
      <div className="text-center p-6 bg-white dark:bg-gray-700/30 rounded-lg shadow-md">
        <HeroIcon icon="FaceFrownIcon" className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-300">Nuk ka dërgesa të disponueshme për momentin.</p>
        <Button variant="ghost" onClick={fetchAvailableTasks} isLoading={isLoading.available} className="mt-4 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10">
            <HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 mr-2 ${isLoading.available ? 'animate-spin':''}`}/> Rifresko
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Dërgesa të Disponueshme ({availableTasks.length})</h3>
            <Button variant="ghost" onClick={fetchAvailableTasks} isLoading={isLoading.available} disabled={isLoading.available || !!activeTask} size="sm" className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10">
                <HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading.available ? 'animate-spin':''}`}/>
            </Button>
        </div>
        {availableTasks.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"> {/* Updated grid for better fit */}
                {availableTasks.map(task => (
                <TaskCard key={task.id} task={task} />
                ))}
            </div>
        )}
    </div>
  );
};

export default AvailableTasksSection;