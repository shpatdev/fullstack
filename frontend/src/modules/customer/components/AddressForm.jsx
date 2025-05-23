// src/modules/customer/components/AddressForm.jsx
import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button.jsx'; // Sigurohu që ky path është korrekt
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // Importo ikonat

// Shto props: onSubmit, onCancel, isLoading, submitButtonText
const AddressForm = ({ initialData = {}, onSubmit, onCancel, submitButtonText = "Ruaj Adresën", isLoading = false }) => {
    const [formData, setFormData] = useState({
        street: '',
        city: '',
        postal_code: '', // Përdor postal_code siç e pret backend-i
        country: 'Kosovo', // Default
        is_default_shipping: false,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        setFormData({
            street: initialData.street || '',
            city: initialData.city || '',
            postal_code: initialData.postal_code || initialData.zipCode || '', // Mbulo të dy rastet
            country: initialData.country || 'Kosovo',
            is_default_shipping: initialData.is_default_shipping || false,
        });
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if(error) setError(''); // Clear error on change
    };

    const handleSubmitLocal = async (e) => {
        e.preventDefault();
        setError(''); 
        if (!formData.street.trim() || !formData.city.trim() || !formData.postal_code.trim() || !formData.country.trim()) {
            setError("Të gjitha fushat e adresës janë të detyrueshme.");
            return;
        }
        // Thirr onSubmit të kaluar nga prindi (AddressFormModal -> CheckoutPage)
        if (onSubmit) {
            onSubmit(formData); 
        }
    };

    return (
        <form onSubmit={handleSubmitLocal} className="space-y-4">
            {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-2 rounded-md">{error}</p>}
            <div>
                <label htmlFor="address-street" className="label-form">Rruga</label>
                <input type="text" name="street" id="address-street" value={formData.street} onChange={handleChange} required className="input-form w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="address-city" className="label-form">Qyteti</label>
                    <input type="text" name="city" id="address-city" value={formData.city} onChange={handleChange} required className="input-form w-full" />
                </div>
                <div>
                    <label htmlFor="address-postal_code" className="label-form">Kodi Postar</label>
                    <input type="text" name="postal_code" id="address-postal_code" value={formData.postal_code} onChange={handleChange} required className="input-form w-full" />
                </div>
            </div>
             <div>
                <label htmlFor="address-country" className="label-form">Shteti</label>
                <input type="text" name="country" id="address-country" value={formData.country} onChange={handleChange} required className="input-form w-full" />
            </div>
            <div className="flex items-center">
                <input id="address-is_default_shipping" name="is_default_shipping" type="checkbox" checked={formData.is_default_shipping} onChange={handleChange} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-600 rounded" />
                <label htmlFor="address-is_default_shipping" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">Cakto si adresë primare</label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onCancel && (
                    <Button type="button" onClick={onCancel} variant="outline" fullWidth>
                        Anulo
                    </Button>
                )}
                <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading} fullWidth
                        iconLeft={isLoading ? ArrowPathIcon : CheckCircleIcon}
                        iconLeftClassName="h-5 w-5" // Assuming h-5 w-5 was intended
                >
                    {submitButtonText}
                </Button>
            </div>
        </form>
    );
};

export default AddressForm;