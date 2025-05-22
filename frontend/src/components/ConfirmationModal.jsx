// src/components/ConfirmationModal.jsx
import React from 'react';
import ModalShell from './ModalShell.jsx';
import Button from './Button.jsx';
import { Loader2 } from 'lucide-react'; // For loading state

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    isLoading = false,
    confirmButtonVariant = "danger" // 'danger', 'primary', 'success' etc.
}) => {
    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                    {cancelText}
                </Button>
                <Button 
                    variant={confirmButtonVariant} 
                    onClick={onConfirm} 
                    disabled={isLoading}
                    isLoading={isLoading} // Pass isLoading to Button component
                >
                    {/* Button component will handle rendering loader if isLoading is true */}
                    {confirmText}
                </Button>
            </div>
        </ModalShell>
    );
};
export default ConfirmationModal;