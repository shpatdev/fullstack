// src/modules/courier/pages/DriverDashboardPage.jsx
import React from 'react';
// Nuk ka nevojë për useAuth këtu pasi DriverLayout e menaxhon
import ActiveDeliverySection from '../components/ActiveDeliverySection.jsx';
import AvailableTasksSection from '../components/AvailableTasksSection.jsx';
import DeliveryHistorySection from '../components/DeliveryHistorySection.jsx';
import AvailabilityToggle from '../components/AvailabilityToggle.jsx'; 
// TaskProvider mbështjell DriverLayout, kështu që useTasks() funksionon te komponentët fëmijë.

const DriverDashboardPage = () => {
  return (
    <div className="container mx-auto px-2 sm:px-0 py-2 md:py-6 space-y-6 md:space-y-8">
      {/* 
        AvailabilityToggle tani është te DriverLayout.jsx (header).
        Nëse dëshiron ta kesh edhe këtu si një kartë më të madhe, mund ta shtosh:
        <section aria-labelledby="availability-heading-main">
          <h2 id="availability-heading-main" className="sr-only">Disponueshmëria</h2>
          <AvailabilityToggle />
        </section> 
        Por kujdes mos të kesh dy instanca që kontrollojnë të njëjtin state pa sinkronizim.
        Mënyra më e mirë është që AvailabilityToggle të marrë props nga TaskContext.
      */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
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
          {/* Mund të shtosh këtu një kartë përmbledhëse për statistika të shoferit nëse dëshiron */}
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