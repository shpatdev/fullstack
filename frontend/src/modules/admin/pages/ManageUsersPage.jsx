// src/modules/admin/pages/ManageUsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../api/adminApi';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import Button from '../../../components/Button';
import HeroIcon from '../../../components/HeroIcon';
import UserTableRow from '../components/UserTableRow';
import UserFormModal from '../components/UserFormModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

const ManageUsersPage = () => {
  const { user: adminUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [confirmActionProps, setConfirmActionProps] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      confirmText: 'Konfirmo',
      iconType: 'warning'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ role: 'ALL', status: 'ALL' });

  const fetchUsers = useCallback(async () => {
    if (!adminUser?.token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.fetchAllUsers(adminUser.token);
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      const errMsg = err.message || "S'u mund të ngarkoheshin përdoruesit.";
      setError(errMsg);
      showError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [adminUser?.token, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = (savedUser) => {
    fetchUsers(); // Re-fetch for consistency
  };

  const openConfirmation = (title, message, onConfirmCallback, confirmText = "Konfirmo", iconType = 'warning') => {
    setConfirmActionProps({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
            onConfirmCallback();
            setConfirmActionProps(prev => ({ ...prev, isOpen: false }));
        },
        confirmText,
        iconType
    });
  };

  const handleDelete = async (userId) => {
    try {
        setIsLoading(true);
        await adminApi.deleteUser(userId, adminUser.token);
        setUsers(prev => prev.filter(u => u.id !== userId));
        showSuccess(`Përdoruesi (ID: ${userId}) u fshi me sukses.`);
    } catch (err) { showError(err.message || `Gabim gjatë fshirjes.`); }
    finally { setIsLoading(false); }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    let newStatus;
    // Define status transition logic
    if (currentStatus === 'ACTIVE') newStatus = 'SUSPENDED';
    else if (currentStatus === 'SUSPENDED') newStatus = 'ACTIVE';
    else if (currentStatus === 'PENDING_APPROVAL') newStatus = 'ACTIVE'; // Example: Approve
    else {
        showError("Veprim i panjohur për statusin aktual.");
        return;
    }
    
    try {
        setIsLoading(true);
        const updatedUser = await adminApi.updateUser(userId, { status: newStatus }, adminUser.token);
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        showSuccess(`Statusi i përdoruesit (ID: ${userId}) u ndryshua në ${newStatus}.`);
    } catch (err) { showError(err.message || `Gabim gjatë ndryshimit të statusit.`); }
    finally { setIsLoading(false); }
  };
  
  const handleResetPassword = async (userId) => {
    // For a real app, this would trigger an email or show a new generated password.
    // For mock, just show a success message.
    try {
        setIsLoading(true);
        // await adminApi.resetUserPassword(userId, adminUser.token); // TODO: Implement API
        await new Promise(resolve => setTimeout(resolve, 500)); // Mock
        showSuccess(`Kërkesa për resetimin e fjalëkalimit për përdoruesin (ID: ${userId}) u dërgua (mock).`);
    } catch (err) { showError(err.message || `Gabim gjatë resetimit të fjalëkalimit.`); }
    finally { setIsLoading(false); }
  };
  
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    let matchesSearch = true;
    if (searchTerm) {
        matchesSearch = (
            user.username.toLowerCase().includes(searchTermLower) ||
            user.email.toLowerCase().includes(searchTermLower) ||
            (user.first_name && user.first_name.toLowerCase().includes(searchTermLower)) ||
            (user.last_name && user.last_name.toLowerCase().includes(searchTermLower)) ||
            user.id.toString().includes(searchTermLower)
        );
    }
    let matchesRole = filters.role === 'ALL' || user.role === filters.role;
    let matchesStatus = filters.status === 'ALL' || user.status === filters.status;
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => new Date(b.date_joined) - new Date(a.date_joined));


  return (
    <div className="container mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Menaxho Përdoruesit</h1>
         <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchUsers} isLoading={isLoading} disabled={isLoading}
                    iconLeft={<HeroIcon icon="ArrowPathIcon" className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`}/>}>
                Rifresko
            </Button>
            <Button variant="primary" onClick={() => handleOpenModal()}
                    iconLeft={<HeroIcon icon="UserPlusIcon" className="h-5 w-5"/>}>
                 Shto Përdorues
            </Button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2 md:col-span-1">
            <label htmlFor="searchUsers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kërko</label>
            <input id="searchUsers" type="text" placeholder="ID, emër, email..." value={searchTerm} onChange={handleSearchChange} className="input-form"/>
          </div>
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roli</label>
            <select id="roleFilter" name="role" value={filters.role} onChange={handleFilterChange} className="input-form">
                <option value="ALL">Të gjitha Rolet</option>
                <option value="CUSTOMER">Klient</option>
                <option value="RESTAURANT_OWNER">Pronar Restoranti</option>
                <option value="DELIVERY_PERSONNEL">Furnizues</option>
                <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="statusFilterUsers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statusi</label>
            <select id="statusFilterUsers" name="status" value={filters.status} onChange={handleFilterChange} className="input-form">
                <option value="ALL">Të gjitha Statuset</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="SUSPENDED">Pezulluar</option>
                <option value="PENDING_APPROVAL">Në Pritje</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && !isModalOpen && !confirmActionProps.isOpen && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500"></div>
        </div>
      )}
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-700/20 dark:text-red-300 p-4 rounded-md mb-6" role="alert">
        <p className="font-bold">Gabim</p> <p>{error}</p>
      </div>}

      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['ID', 'Përdoruesi', 'Email', 'Roli', 'Regjistruar Më', 'Statusi', 'Veprime'].map(header => (
                  <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <UserTableRow 
                    key={user.id} 
                    user={user} 
                    onEdit={handleOpenModal}
                    onDelete={(id) => openConfirmation("Konfirmo Fshirjen", `Jeni të sigurt që doni të fshini përdoruesin "${users.find(u=>u.id===id)?.username || id}"?`, () => handleDelete(id), "Fshij", "danger")}
                    onToggleStatus={(id, currentStatus) => openConfirmation("Ndrysho Statusin", `Ndrysho statusin e përdoruesit "${users.find(u=>u.id===id)?.username}"?`, () => handleToggleStatus(id, currentStatus))}
                    onResetPassword={(id) => openConfirmation("Reset Fjalëkalimin", `Dëshironi të resetoni fjalëkalimin për "${users.find(u=>u.id===id)?.username}"? (Mock: Kjo do të simulojë dërgimin e një linku).`, () => handleResetPassword(id), "Po, Reseto")}
                  />
                ))
              ) : (
                 <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {users.length === 0 ? "Nuk ka përdorues të regjistruar." : "Nuk u gjetën përdorues që përputhen me kërkimin/filtrat tuaj."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* TODO: Add Pagination */}

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={editingUser}
        onSave={handleSaveUser}
      />
      <ConfirmationModal
        isOpen={confirmActionProps.isOpen}
        onClose={() => setConfirmActionProps(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmActionProps.onConfirm}
        title={confirmActionProps.title}
        message={confirmActionProps.message}
        confirmText={confirmActionProps.confirmText}
        iconType={confirmActionProps.iconType}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ManageUsersPage;