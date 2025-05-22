// src/modules/courier/pages/DriverDashboardPage.jsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import ActiveDeliverySection from '../components/ActiveDeliverySection.jsx';
import AvailableTasksSection from '../components/AvailableTasksSection.jsx';
import DeliveryHistorySection from '../components/DeliveryHistorySection.jsx';
import AvailabilityToggle from '../components/AvailabilityToggle.jsx'; // Ky tani është te DriverLayout header, por mund ta mbash edhe këtu si një kartë më të madhe.
// import HeroIcon from '../../../components/HeroIcon'; // Nëse nevojitet direkt këtu

const DriverDashboardPage = () => {
  const { user } = useAuth();
  const driverName = user?.driverProfile?.name || user?.username || 'Shofer';

  return (
    <div className="container mx-auto px-2 sm:px-0 py-2 md:py-6 space-y-8"> {/* Reduktuar padding horizontal për mobile */}
      
      {/* Header-i tashmë ka emrin dhe statusin online, kështu që ky seksion mund të thjeshtohet ose hiqet */}
      {/* <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                    Mirë se erdhe, {driverName}!
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Këtu mund të menaxhosh disponueshmërinë tënde dhe dërgesat.
                </p>
            </div>
             <div className="mt-4 sm:mt-0"> <AvailabilityToggle /> </div>
        </div>
      </div> */}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* AvailabilityToggle mund të vendoset këtu nëse dëshiron një vend më prominent sesa vetëm në header */}
           <section aria-labelledby="availability-heading-main" className="block lg:hidden xl:block"> {/* Shfaqe në të gjitha përveç lg, por shfaqe te xl */}
             <h2 id="availability-heading-main" className="sr-only">Disponueshmëria</h2>
            <AvailabilityToggle /> {/* Ky është komponenti i veçantë, jo vetëm switch-i */}
          </section>

          <section aria-labelledby="active-delivery-heading">
            <h2 id="active-delivery-heading" className="sr-only">Dërgesa Aktive</h2>
            <ActiveDeliverySection />
          </section>
          
          <section aria-labelledby="available-tasks-heading" className="pt-2">
             <h2 id="available-tasks-heading" className="sr-only">Dërgesa të Disponueshme</h2>
            <AvailableTasksSection />
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6 md:space-y-8">
           <section aria-labelledby="availability-heading-sidebar" className="hidden lg:block xl:hidden"> {/* Shfaqe vetëm te lg, fshihe te xl */}
             <h2 id="availability-heading-sidebar" className="sr-only">Disponueshmëria</h2>
            <AvailabilityToggle />
          </section>
          
          <section aria-labelledby="delivery-history-heading">
            <h2 id="delivery-history-heading" className="sr-only">Historiku i Dërgesave</h2>
            <DeliveryHistorySection />
          </section>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboardPage;