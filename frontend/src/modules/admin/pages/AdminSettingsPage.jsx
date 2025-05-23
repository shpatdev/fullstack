// src/modules/admin/pages/AdminSettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/Button';
import { IdentificationIcon, BanknotesIcon, MegaphoneIcon, TagIcon, CheckCircleIcon, ArrowPathIcon, Cog6ToothIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../../../api/adminApi'; // Using mock API
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const initialSettings = {
    platformName: 'FoodDash Pro',
    platformEmail: 'support@fooddash.com',
    commissionRate: '0.10', // 10%
    deliveryFeeFixed: '1.50', // 1.50 EUR
    minOrderValue: '5.00', // Minimum order value for delivery
    currencySymbol: '€',
    globalAnnouncement: '',
    maintenanceMode: false,
  };
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchSettings = useCallback(async () => {
    if (!user?.token) {
        setIsFetching(false); // Ensure fetching stops if no token
        return;
    }
    setIsFetching(true);
    setErrors({});
    try {
      // const currentSettings = await adminApi.getPlatformSettings(user.token);
      setSettings(initialSettings); 
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      showError(error.message || "S'u mund të ngarkoheshin konfigurimet.");
    } finally {
      setIsFetching(false);
    }
  }, [user?.token, showError]); // Removed initialSettings from deps as it's constant here

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    if (['commissionRate', 'deliveryFeeFixed', 'minOrderValue'].includes(name)) {
        if (value === '' || isNaN(parseFloat(value)) || parseFloat(value) < 0) { // Check for empty string too
            errorMsg = "Vlera duhet të jetë një numër pozitiv.";
        } else if (name === 'commissionRate' && (parseFloat(value) > 1)) { // Max 100%
            errorMsg = "Komisioni duhet të jetë ndërmjet 0 dhe 1 (p.sh., 0.1 për 10%).";
        }
    }
    if (name === 'platformEmail' && value && !/\S+@\S+\.\S+/.test(value)) {
        errorMsg = "Formati i email-it është invalid.";
    }
    // Update errors state only if there's a change to avoid infinite loops if validateField is in useEffect
    setErrors(prev => {
        if (prev[name] !== (errorMsg || null)) {
            return {...prev, [name]: errorMsg || null};
        }
        return prev;
    });
    return !errorMsg;
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!user?.token) return;

    let formIsValid = true;
    // Create a temporary errors object to collect all validation messages at once
    const currentValidationErrors = {};
    Object.keys(settings).forEach(key => {
        if (!validateField(key, settings[key])) { // validateField now updates errors state directly
            formIsValid = false; // though its direct return value indicates validity for this field
            // We re-check errors state after loop to be sure
        }
    });
    // After all fields validated, check the errors state
     if (Object.values(errors).some(err => err !== null)) { // Re-check based on state after all validations
        formIsValid = false;
    }


    if (!formIsValid) {
        showError("Ju lutem korrigjoni gabimet në formular.");
        return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Settings saved (mock):", settings);
      showSuccess("Konfigurimet u ruajtën me sukses!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      showError(error.message || "Gabim gjatë ruajtjes së konfigurimeve.");
    } finally {
      setIsLoading(false);
    }
  };

  // SettingSection is defined outside if it doesn't depend on AdminSettingsPage's state/props directly
  // Or inside if it needs access to its scope (less common for this kind of structure)

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-150px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }
  
  // JSX return part:
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white mb-8">Konfigurimet e Platformës</h1>

      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 md:p-8 space-y-8">
        
        <SettingSection title="Informacionet Bazë të Platformës" description="Emri dhe logoja e platformës." icon={IdentificationIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label htmlFor="platformName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emri i Platformës</label>
                    <input type="text" name="platformName" id="platformName" value={settings.platformName} onChange={handleChange} className="input-form"/>
                </div>
                <div>
                    <label htmlFor="platformEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Kryesor i Suportit</label>
                    <input type="email" name="platformEmail" id="platformEmail" value={settings.platformEmail} onChange={(e) => {handleChange(e); validateField(e.target.name, e.target.value);}} className={`input-form ${errors.platformEmail ? 'input-form-error' : ''}`}/>
                    {errors.platformEmail && <p className="input-error-message">{errors.platformEmail}</p>}
                </div>
            </div>
        </SettingSection> {/* Correctly closed */}

        <SettingSection title="Financat & Pagesat" description="Konfigurime për monedhën, tarifat, etj." icon={BanknotesIcon}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Norma e Komisionit (0.0 - 1.0)</label>
              <input type="number" name="commissionRate" id="commissionRate" value={settings.commissionRate} onChange={(e) => {handleChange(e); validateField(e.target.name, e.target.value);}} step="0.01" min="0" max="1" className={`input-form ${errors.commissionRate ? 'input-form-error' : ''}`} placeholder="P.sh., 0.10"/>
              {errors.commissionRate && <p className="input-error-message">{errors.commissionRate}</p>}
            </div>
            <div>
              <label htmlFor="deliveryFeeFixed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tarifa Fikse e Dërgesës ({settings.currencySymbol})</label>
              <input type="number" name="deliveryFeeFixed" id="deliveryFeeFixed" value={settings.deliveryFeeFixed} onChange={(e) => {handleChange(e); validateField(e.target.name, e.target.value);}} step="0.01" min="0" className={`input-form ${errors.deliveryFeeFixed ? 'input-form-error' : ''}`} placeholder="P.sh., 1.50"/>
               {errors.deliveryFeeFixed && <p className="input-error-message">{errors.deliveryFeeFixed}</p>}
            </div>
            <div>
              <label htmlFor="minOrderValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vlera Minimale e Porosisë ({settings.currencySymbol})</label>
              <input type="number" name="minOrderValue" id="minOrderValue" value={settings.minOrderValue} onChange={(e) => {handleChange(e); validateField(e.target.name, e.target.value);}} step="0.01" min="0" className={`input-form ${errors.minOrderValue ? 'input-form-error' : ''}`} placeholder="P.sh., 5.00"/>
              {errors.minOrderValue && <p className="input-error-message">{errors.minOrderValue}</p>}
            </div>
          </div>
        </SettingSection> {/* Correctly closed */}

        <SettingSection title="Njoftimet & Marketingu" description="Menaxho shabllonet e email-eve dhe fushatat." icon={MegaphoneIcon}>
          <div>
            <label htmlFor="globalAnnouncement" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Njoftim Global (shfaqet në krye)</label>
            <textarea name="globalAnnouncement" id="globalAnnouncement" rows="3" value={settings.globalAnnouncement} onChange={handleChange} className="input-form" placeholder="Shkruani njoftimin tuaj këtu..."></textarea>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lëreni bosh për të mos shfaqur asnjë njoftim.</p>
          </div>
           <div className="flex items-center pt-2">
                <input id="maintenanceMode" name="maintenanceMode" type="checkbox" checked={settings.maintenanceMode} onChange={handleChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"/>
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Aktivizo Modin e Mirëmbajtjes</label>
            </div>
            {settings.maintenanceMode && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Kujdes: Aktivizimi i këtij modi do të kufizojë aksesin në platformë për përdoruesit e rregullt.</p>}
        </SettingSection> {/* Correctly closed */}
        
         <SettingSection title="Kategoritë & Etiketat" description="Menaxho llojet e kuzhinave dhe etiketat e tjera." icon={TagIcon}>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ky seksion do të lejojë shtimin, modifikimin, dhe fshirjen e kategorive globale të kuzhinës (p.sh., "Italiane", "Kineze", "Tradicionale") që restorantet mund të zgjedhin.</p>
            <div className="mt-3">
                 <span className="text-xs italic text-gray-500 dark:text-gray-400">(Funksionalitet në zhvillim)</span>
            </div>
        </SettingSection> {/* Correctly closed */}

        <div className="pt-6 flex justify-end border-t border-gray-200 dark:border-gray-700">
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={isLoading || isFetching}>
            <CheckCircleIcon className="h-5 w-5 mr-2"/>
            Ruaj Konfigurimet
          </Button>
        </div>
      </form> {/* Correctly closed form */}
    </div> // Correctly closed main div
  ); // Correctly closed return parenthesis
}; // Correctly closed component

// Define SettingSection here if it's not imported
const SettingSection = ({ title, description, icon: IconComponent, children }) => (
  <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
    <div className="flex items-start mb-3">
      {IconComponent && <IconComponent className="h-7 w-7 text-primary-500 dark:text-primary-400 mr-3 flex-shrink-0" />}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
        {description && <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

export default AdminSettingsPage;