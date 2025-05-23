// src/components/ModalShell.jsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline'; // Importing XMarkIcon for the close button

const ModalShell = ({ isOpen, onClose, title, children, size = "md", footerContent }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        full: "max-w-full mx-4 sm:mx-auto"
    };
    
    // Add keyframes for modal animation if not already in your global CSS
    // You can put this in your main CSS file or a global style component
    // @keyframes modalShow {
    //   0% { transform: scale(0.95); opacity: 0; }
    //   100% { transform: scale(1); opacity: 1; }
    // }
    // .animate-modalShow { animation: modalShow 0.2s ease-out forwards; }


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" 
            onClick={onClose} // Close when clicking overlay
        >
            <div 
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl m-4 flex flex-col ${sizeClasses[size]} w-full max-h-[90vh] sm:max-h-[85vh] transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            >
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" /> 
                    </button>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                    {children}
                </div>
                {footerContent && (
                    <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30 rounded-b-xl">
                        {footerContent}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalShell;