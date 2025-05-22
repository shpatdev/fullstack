// src/modules/courier/pages/DriverDashboardPage.jsx
import React, { useContext } from 'react';
import AvailableTasksSection from '../components/AvailableTasksSection.jsx';
import ActiveDeliverySection from '../components/ActiveDeliverySection.jsx';
import DeliveryHistorySection from '../components/DeliveryHistorySection.jsx'; // Corrected import path
import { AuthContext } from '../../../context/AuthContext.jsx';

const DriverDashboardPage = () => {
  const { agent } = useContext(AuthContext);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800">Welcome, {agent?.name || agent?.username || 'Driver'}!</h2>
        <p className="text-gray-600">
          You are currently {agent?.isOnline
            ? <span className="text-green-600 font-medium">Online</span>
            : <span className="text-red-600 font-medium">Offline</span>}.
          Check for new tasks below.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AvailableTasksSection />
        <ActiveDeliverySection />
      </div>
      <DeliveryHistorySection />
    </div>
  );
};
export default DriverDashboardPage;