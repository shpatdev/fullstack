// src/modules/admin/pages/AdminSettingsPage.jsx
import React, { useState } from 'react';
// import { adminApi } from '../../../api/adminApi.js';
// import { useAuth } from '../../../context/AuthContext.jsx';
// import Button from '../../../components/Button.jsx';
// import { useNotification } from '../../../context/NotificationContext.jsx';

const AdminSettingsPage = () => {
    // const { token } = useAuth();
    // const { showNotification } = useNotification();
    const [settings, setSettings] = useState({ commissionRate: 15, deliveryFee: 2.50, globalAnnouncement: '' });
    const [isLoading, setIsLoading] = useState(false);

    // useEffect to fetch current settings
    // const fetchSettings = async () => {
    //  setIsLoading(true);
    //  try {
    //      const data = await adminApi.getPlatformSettings(token);
    //      setSettings(data);
    //  } catch (error) { showNotification('Failed to load settings', 'error'); }
    //  finally { setIsLoading(false); }
    // }
    // fetchSettings();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // try {
        //  await adminApi.updatePlatformSettings(settings, token);
        //  showNotification('Settings saved!', 'success');
        // } catch (error) { showNotification('Failed to save settings', 'error'); }
        // finally { setIsLoading(false); }
        console.log("Saving settings (mock):", settings);
        await new Promise(r => setTimeout(r, 500));
        setIsLoading(false);
        alert("Settings saved (mock)!");
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-gray-800">Platform Settings</h1>
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl shadow-lg space-y-4 max-w-2xl">
                <div>
                    <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
                    <input type="number" id="commissionRate" name="commissionRate" value={settings.commissionRate} onChange={handleChange}
                           className="mt-1 block w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                           min="0" max="100" step="0.1" />
                </div>
                <div>
                    <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700">Base Delivery Fee (€)</label>
                    <input type="number" id="deliveryFee" name="deliveryFee" value={settings.deliveryFee} onChange={handleChange}
                           className="mt-1 block w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                           min="0" step="0.01" />
                </div>
                <div>
                    <label htmlFor="globalAnnouncement" className="block text-sm font-medium text-gray-700">Global Announcement (Optional)</label>
                    <textarea id="globalAnnouncement" name="globalAnnouncement" value={settings.globalAnnouncement} onChange={handleChange}
                              rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                              placeholder="E.g., Platform maintenance scheduled for Sunday at 2 AM."></textarea>
                </div>
                <div className="pt-2">
                    <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center disabled:opacity-50">
                        {isLoading ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default AdminSettingsPage;