// src/modules/customer/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import Button from '../../../components/Button.jsx';
import AddressForm from '../components/AddressForm.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';
import { UserCircleIcon, KeyIcon, MapPinIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { customerApi } from '../../../api/customerApi.js';

const ProfilePage = () => {
  const { user, fetchAndSetUser, isLoading: authLoading, error: authError, setError: setAuthError, token } = useAuth();
  const { showSuccess, showError } = useNotification();

  const initialProfileData = { username: '', email: '', first_name: '', last_name: '', phone_number: '', bio: '', profile_picture_url_placeholder: '' };
  const [profileData, setProfileData] = useState(initialProfileData);
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(null); // For loading state on delete button

  useEffect(() => {
    if (user) {
      setProfileData({ 
        username: user.username || '', // Username nuk duhet të jetë i modifikueshëm nga useri zakonisht
        email: user.email || '',       // Email zakonisht nuk modifikohet lehtë
        first_name: user.first_name || '', 
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        bio: user.bio || '',
        profile_picture_url_placeholder: user.profile_picture_url_placeholder || '',
      });
      fetchAddresses();
    } else {
      setProfileData(initialProfileData); // Reset nëse useri bën logout
      setAddresses([]);
    }
  }, [user]);

  const fetchAddresses = useCallback(async () => {
    if (!user?.id || !token) return; // Sigurohu që useri dhe tokeni ekzistojnë
    setIsLoadingAddresses(true);
    try {
      const userAddresses = await customerApi.fetchUserAddresses(); // Kjo tani thërret API reale
      setAddresses(userAddresses || []);
    } catch (error) {
      showError(error.message || "Nuk mund të ngarkoheshin adresat.");
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [user?.id, token, showError]); // Shto token si dependencë

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setAuthError(null); // Pastro gabimet e AuthContext
    try {
      // Dërgo vetëm fushat që lejohen të modifikohen
      const dataToUpdate = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
        bio: profileData.bio,
        profile_picture_url_placeholder: profileData.profile_picture_url_placeholder,
        // Nuk dërgojmë email ose username për modifikim këtu
      };
      // Supozojmë se UserMeAPIView.update pranon PATCH me këto fusha
      await apiService.request('/auth/me/', { method: 'PATCH', body: JSON.stringify(dataToUpdate) }); // Thirrje direkte me apiService
      await fetchAndSetUser(token); // Rifresko të dhënat e userit në AuthContext
      showSuccess('Profili u përditësua me sukses!');
    } catch (error) {
      showError(error.message || 'Gabim gjatë përditësimit të profilit.');
      setAuthError(error.message || 'Gabim.'); // Vendos gabimin te AuthContext për t'u shfaqur ndoshta
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showError('Fjalëkalimet e reja nuk përputhen.');
      return;
    }
    if (passwordData.new_password.length < 6) {
        showError('Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere.');
        return;
    }
    setIsUpdatingPassword(true);
    setAuthError(null);
    try {
      // Ky endpoint duhet të krijohet në backend, p.sh., /api/auth/change-password/
      await apiService.request('/auth/change-password/', { // KRIJO KËTË ENDPOINT
          method: 'POST', 
          body: JSON.stringify({
              old_password: passwordData.current_password,
              new_password: passwordData.new_password,
          }) 
      });
      showSuccess('Fjalëkalimi u ndryshua me sukses!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      showError(error.message || 'Gabim gjatë ndryshimit të fjalëkalimit. Sigurohuni që fjalëkalimi aktual është i saktë.');
      setAuthError(error.message || 'Gabim.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAddressSave = (savedAddress) => {
    fetchAddresses(); 
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (addressId) => {
    // Mund të shtosh një ConfirmationModal këtu
    setIsDeletingAddress(addressId); // Për loading state
    try {
        await customerApi.deleteUserAddress(addressId);
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        showSuccess("Adresa u fshi me sukses!");
    } catch (error) {
        showError(error.message || "Gabim gjatë fshirjes së adresës.");
    } finally {
        setIsDeletingAddress(null);
    }
  };
  
  // Import apiService nëse e përdor direkt
  // Ensure apiService is properly imported if used directly, or remove this placeholder if not.
  // For now, assuming it's needed for handleProfileUpdate and handlePasswordUpdate.
  // If those use a global apiService instance, this local one might be conflicting or unnecessary.
  // const apiService = { request: async (url, options) => { /* ... implementimi yt i apiService ... */ } }; // Placeholder, duhet ta importosh nga /api/apiService.js


  if (authLoading && !user) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div></div>;
  }
  if (!user) {
    return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Ju lutem kyçuni për të parë profilin tuaj.</div>;
  }

  return (
    <div className="container mx-auto px-2 sm:px-0 py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-8 md:mb-10">Profili Im</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-5 border-b border-gray-200 dark:border-slate-700 pb-3 flex items-center">
              <UserCircleIcon className="h-6 w-6 mr-2.5 text-primary-500" /> Informacionet Personale
            </h2>
            {authError && <p className="text-sm text-red-500 dark:text-red-400 mb-4 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">{authError}</p>}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Emri</label>
                  <input type="text" name="first_name" id="first_name" value={profileData.first_name} onChange={handleProfileChange} required className="input-form mt-1" />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Mbiemri</label>
                  <input type="text" name="last_name" id="last_name" value={profileData.last_name} onChange={handleProfileChange} required className="input-form mt-1" />
                </div>
              </div>
              <div>
                <label htmlFor="email_display" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email (Nuk modifikohet)</label>
                <input type="email" name="email_display" id="email_display" value={profileData.email} readOnly disabled className="input-form mt-1 bg-gray-100 dark:bg-slate-700 cursor-not-allowed" />
              </div>
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Numri i Telefonit</label>
                <input type="tel" name="phone_number" id="phone_number" value={profileData.phone_number} onChange={handleProfileChange} className="input-form mt-1" />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Bio</label>
                <textarea name="bio" id="bio" value={profileData.bio} onChange={handleProfileChange} rows="3" className="input-form mt-1"></textarea>
              </div>
              <div>
                <label htmlFor="profile_picture_url_placeholder" className="block text-sm font-medium text-gray-700 dark:text-slate-300">URL e Fotos së Profilit</label>
                <input type="url" name="profile_picture_url_placeholder" id="profile_picture_url_placeholder" value={profileData.profile_picture_url_placeholder} onChange={handleProfileChange} placeholder="https://example.com/profile.jpg" className="input-form mt-1" />
                {profileData.profile_picture_url_placeholder && <img src={profileData.profile_picture_url_placeholder} alt="Profile preview" className="mt-2 h-20 w-20 rounded-full object-cover"/>}
              </div>
              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isUpdatingProfile || authLoading} disabled={isUpdatingProfile || authLoading}> Ruaj Ndryshimet </Button>
              </div>
            </div>
          </form>

          <form onSubmit={handlePasswordChangeSubmit} className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-5 border-b border-gray-200 dark:border-slate-700 pb-3 flex items-center">
              <KeyIcon className="h-6 w-6 mr-2.5 text-primary-500" /> Ndrysho Fjalëkalimin
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Fjalëkalimi Aktual</label>
                <input type="password" name="current_password" id="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required className="input-form mt-1" />
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Fjalëkalimi i Ri</label>
                <input type="password" name="new_password" id="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required className="input-form mt-1" />
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Konfirmo Fjalëkalimin e Ri</label>
                <input type="password" name="confirm_password" id="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required className="input-form mt-1" />
              </div>
              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isUpdatingPassword || authLoading} disabled={isUpdatingPassword || authLoading}> Ndrysho Fjalëkalimin </Button>
              </div>
            </div>
          </form>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
           <section className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center border-b border-gray-200 dark:border-slate-700 pb-3">
              <MapPinIcon className="h-6 w-6 mr-2.5 text-primary-500" /> Adresat e Mia
            </h2>
            {isLoadingAddresses && <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-400 mx-auto"></div></div>}
            {!isLoadingAddresses && addresses.length > 0 && !showAddressForm && (
              <div className="space-y-3 mt-4 max-h-80 overflow-y-auto custom-scrollbar-thin pr-2">
                {addresses.map(addr => (
                  <div key={addr.id} className={`p-3 border rounded-lg ${addr.is_default_shipping ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/40'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium text-sm text-gray-800 dark:text-slate-100">{addr.street}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-300">{addr.city}, {addr.postal_code}, {addr.country}</p>
                        </div>
                         {addr.is_default_shipping && (<span className="text-xs bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-200 px-2 py-0.5 rounded-full font-medium">Primare</span>)}
                    </div>
                    <div className="mt-2.5 space-x-2 flex items-center">
                        <Button variant="link" size="xs" className="p-0 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300" onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }}> Modifiko </Button>
                        <span className="text-gray-300 dark:text-slate-600">|</span>
                        <Button variant="link" size="xs" className="p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" onClick={() => handleDeleteAddress(addr.id)} isLoading={isDeletingAddress === addr.id} disabled={isDeletingAddress === addr.id}> Fshij </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
             {!isLoadingAddresses && addresses.length === 0 && !showAddressForm && (<p className="text-sm text-gray-500 dark:text-slate-400 mt-4 py-4 text-center">Nuk keni adresa të ruajtura.</p>)}

            <Button
              variant={showAddressForm ? "danger" : "outline"}
              size="md"
              onClick={() => { setShowAddressForm(prev => !prev); setEditingAddress(null); }}
              className="mt-5 w-full"
              iconLeft={showAddressForm ? XMarkIcon : PlusCircleIcon}
              iconLeftClassName="h-5 w-5"
            >
              {showAddressForm ? (editingAddress ? 'Anulo Modifikimin' : 'Anulo Shto Adresë') : 'Shto Adresë të Re'}
            </Button>

            {showAddressForm && (
              <div className="mt-5 border-t border-gray-200 dark:border-slate-700 pt-5">
                <h3 className="text-md font-medium text-gray-700 dark:text-slate-300 mb-3"> {editingAddress ? 'Modifiko Adresën' : 'Shto Adresë të Re'} </h3>
                <AddressForm existingAddress={editingAddress} onSave={handleAddressSave} onCancel={() => { setShowAddressForm(false); setEditingAddress(null);}} userId={user.id} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;