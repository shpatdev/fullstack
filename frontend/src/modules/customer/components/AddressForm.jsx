// src/modules/customer/components/AddressForm.jsx
import React, { useState, useEffect } from 'react';

const AddressForm = ({ initialData = {}, onSubmit, onCancel, submitButtonText = "Save Address", isLoading = false }) => {
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [error, setError] = useState(''); // Local form error

    useEffect(() => {
        setStreet(initialData.street || '');
        setCity(initialData.city || '');
        setZipCode(initialData.zip_code || '');
        setCountry(initialData.country || 'USA'); // Default country or from initialData
        setIsDefault(initialData.is_default_shipping || false);
        setError(''); // Clear error when initialData changes
    }, [initialData]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        // Basic validation
        if (!street.trim() || !city.trim() || !zipCode.trim() || !country.trim()) {
            setError("All fields are required.");
            return;
        }
        try {
            await onSubmit({ 
                street, 
                city, 
                zip_code: zipCode, // Match backend field name
                country, 
                is_default_shipping: isDefault // Match backend field name
            });
            // Parent component (CheckoutPage) will handle success (e.g., closing form, re-fetching addresses)
        } catch (err) {
            setError(err.message || "Failed to save address. Please try again.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50 shadow">
            {error && <p className="text-red-600 text-sm bg-red-100 p-2 rounded-md">{error}</p>}
            <div>
                <label htmlFor="address-street" className="block text-sm font-medium text-gray-700">Street Address</label>
                <input type="text" name="street" id="address-street" value={street} onChange={(e) => setStreet(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="address-city" className="block text-sm font-medium text-gray-700">City</label>
                    <input type="text" name="city" id="address-city" value={city} onChange={(e) => setCity(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="address-zipCode" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                    <input type="text" name="zipCode" id="address-zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
             <div>
                <label htmlFor="address-country" className="block text-sm font-medium text-gray-700">Country</label>
                <input type="text" name="country" id="address-country" value={country} onChange={(e) => setCountry(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex items-center">
                <input id="address-isDefault" name="isDefault" type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="address-isDefault" className="ml-2 block text-sm text-gray-900">Set as default shipping address</label>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                {onCancel && <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70">Cancel</button>}
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {isLoading ? 'Saving...' : submitButtonText}
                </button>
            </div>
        </form>
    );
};
export default AddressForm;