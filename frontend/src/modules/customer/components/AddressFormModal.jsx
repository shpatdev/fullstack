import React from 'react';
import ModalShell from '../../../components/ModalShell.jsx'; // Verifiko path-in e saktë
import AddressForm from './AddressForm.jsx'; // Supozojmë se AddressForm është në të njëjtin folder

const AddressFormModal = ({ isOpen, onClose, onSaveAddress, existingAddress, userId }) => {
  // userId kalohet te AddressForm nëse AddressForm bën direkt API calls,
  // por në CheckoutPage, logjika e API call bëhet te CheckoutPage vetë.

  const handleFormSubmit = async (addressData) => {
    // Kjo funksion do të thirret nga AddressForm kur forma bëhet submit.
    // Pastaj, ne thërrasim onSaveAddress (që është handleAddressSave te CheckoutPage).
    if (onSaveAddress) {
      // onSaveAddress te CheckoutPage pret (savedAddress), jo (addressData, existingAddress?.id)
      // Pra, AddressForm duhet të bëjë API call dhe të kthejë adresën e ruajtur,
      // OSE ky modal duhet të bëjë API call.
      // Për momentin, po e kalojmë thjesht te onSaveAddress.
      // Do të jetë më mirë që onSaveAddress te CheckoutPage të bëjë API call.
      onSaveAddress(addressData, existingAddress?.id); 
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={existingAddress ? "Modifiko Adresën" : "Shto Adresë të Re"}
      size="md"
    >
      <AddressForm
        initialData={existingAddress || {}} // Të dhënat fillestare për formën
        onSubmit={handleFormSubmit} // Funksioni që thirret kur forma bëhet submit brenda AddressForm
        onCancel={onClose} // Funksioni për të mbyllur modalin nga butoni Cancel i AddressForm
        // isLoading={...} // Duhet një state për loading nëse API call bëhet këtu
        submitButtonText={existingAddress ? "Ruaj Ndryshimet" : "Shto Adresën"}
      />
    </ModalShell>
  );
};

export default AddressFormModal;
