// src/components/ModalShell.jsx
import React from 'react';
import HeroIcon from './HeroIcon'; // Assuming HeroIcon is in the same directory or adjust path

const ModalShell = ({ isOpen, onClose, title, children, size = "md", footerContent }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
        xl: "max-w-5xl",
        '2xl': "max-w-2xl", // Added for flexibility
        '3xl': "max-w-3xl",
        '4xl': "max-w-4xl",
        'full': "max-w-full h-full sm:max-h-[95vh] sm:m-4", // Example for full screen like modal
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" 
            onClick={onClose} // Close on overlay click
        >
            <div 
                className={`bg-white rounded-xl shadow-2xl m-4 flex flex-col ${sizeClasses[size]} w-full max-h-[90vh] sm:max-h-[85vh] transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
            >
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        aria-label="Close modal"
                    >
                        <HeroIcon name="x" className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                    {children}
                </div>
                {footerContent && (
                    <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                        {footerContent}
                    </div>
                )}
            </div>
        </div>
    );
};

// Add keyframes for animation in your global CSS (e.g., src/index.css) if you want animate-modalShow
// @keyframes modalShow {
//   0% { opacity: 0; transform: scale(0.95) translateY(10px); }
//   100% { opacity: 1; transform: scale(1) translateY(0); }
// }
// .animate-modalShow {
//   animation: modalShow 0.3s ease-out forwards;
// }
export default ModalShell;