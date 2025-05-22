// src/modules/admin/components/RestaurantFormModal.jsx
import React, { useState, useEffect } from 'react';
import ModalShell from '../../../components/ModalShell.jsx';
import Button from '../../../components/Button.jsx';

const RestaurantFormModal = ({ isOpen, onClose, onSave, restaurantToEdit, potentialOwners, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone_number: '',
    description: '',
    owner: '', // Will store owner ID
    // category_ids: [], // For multi-select categories if you implement that
    image: null, // For file upload
    is_active: true,
    is_approved: false, // Default for new restaurants might be pending/false
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (restaurantToEdit) {
      setFormData({
        name: restaurantToEdit.name || '',
        address: restaurantToEdit.address || '',
        city: restaurantToEdit.city || '',
        postal_code: restaurantToEdit.postal_code || '',
        phone_number: restaurantToEdit.phone_number || '',
        description: restaurantToEdit.description || '',
        owner: restaurantToEdit.owner || (restaurantToEdit.owner_details?.id || ''),
        // category_ids: restaurantToEdit.categories?.map(cat => cat.id) || [],
        image: null, // Don't pre-fill file input, but show current image
        is_active: restaurantToEdit.is_active !== undefined ? restaurantToEdit.is_active : true,
        is_approved: restaurantToEdit.is_approved !== undefined ? restaurantToEdit.is_approved : false,
      });
      setPreviewImage(restaurantToEdit.image_url || restaurantToEdit.image || null); // Assuming image_url from serializer
    } else {
      setFormData({
        name: '', address: '', city: '', postal_code: '', phone_number: '', description: '', owner: '',
        image: null, is_active: true, is_approved: false,
      });
      setPreviewImage(null);
    }
    setError('');
  }, [restaurantToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file || null }));
      if (file) {
        setPreviewImage(URL.createObjectURL(file));
      } else {
        // Revert to original image if file selection is cleared, only if editing
        setPreviewImage(restaurantToEdit?.image_url || restaurantToEdit?.image || null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.address || !formData.city || !formData.owner) {
      setError("Name, Address, City, and Owner are required.");
      return;
    }

    const dataToSubmit = new FormData();
    Object.keys(formData).forEach(key => {
        if (key === 'image') {
            if (formData.image instanceof File) { // Only append if it's a new file
                dataToSubmit.append(key, formData.image, formData.image.name);
            }
            // If formData.image is null (meaning user cleared selection or didn't pick one while editing),
            // we don't append it. The backend PATCH should ideally not clear the image if not provided.
            // If it's a new restaurant and image is null, that's fine.
        } else if (formData[key] !== null && formData[key] !== undefined) {
            if (typeof formData[key] === 'boolean') {
                 dataToSubmit.append(key, formData[key] ? 'true' : 'false');
            } else {
                dataToSubmit.append(key, formData[key]);
            }
        }
    });

    try {
      await onSave(dataToSubmit);
    } catch (err) {
      setError(err.message || "Failed to save restaurant. Please try again.");
    }
  };

  const modalTitle = restaurantToEdit ? "Edit Restaurant" : "Create New Restaurant";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={modalTitle} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Restaurant Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700">Owner</label>
            <select name="owner" id="owner" value={formData.owner} onChange={handleChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white">
              <option value="">Select an Owner</option>
              {potentialOwners && potentialOwners.map(owner => (
                <option key={owner.id} value={owner.id}>{owner.username} (ID: {owner.id})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Street Address</label>
          <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
            <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} required
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">Postal Code</label>
            <input type="text" name="postal_code" id="postal_code" value={formData.postal_code} onChange={handleChange}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleChange}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>

        <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Restaurant Image</label>
            <input type="file" name="image" id="image" onChange={handleChange} accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            {previewImage && <img src={previewImage} alt="Preview" className="mt-2 h-32 w-auto object-cover rounded"/>}
        </div>

        <div className="space-y-2 pt-2">
            <div className="flex items-center">
                <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Restaurant is Active</label>
            </div>
            <div className="flex items-center">
                <input id="is_approved" name="is_approved" type="checkbox" checked={formData.is_approved} onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                <label htmlFor="is_approved" className="ml-2 block text-sm text-gray-900">Restaurant is Approved</label>
            </div>
        </div>


        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            {restaurantToEdit ? "Save Changes" : "Create Restaurant"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default RestaurantFormModal;