// src/components/ToastNotification.jsx
import React, { useState, useEffect } from 'react';
import HeroIcon from './HeroIcon'; // Assuming HeroIcon component

const ToastNotification = ({ message, type, onDismiss, id }) => { // Added id for key
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                // Call onDismiss after animation to remove from parent state
                setTimeout(() => { 
                    if (onDismiss) onDismiss(id);
                }, 300); // Match transition duration
            }, 3000); // Duration toast is visible
            return () => clearTimeout(timer);
        } else {
            setVisible(false); // Hide if message becomes null/empty
        }
    }, [message, type, onDismiss, id]);


    if (!message) return null; // Don't render if no message (parent handles visibility by not rendering)

    const baseStyle = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white text-sm z-[200] transition-all duration-300 ease-in-out transform";
    const typeStyles = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
        warning: "bg-yellow-500",
    };
    const iconName = {
        success: "check-circle",
        error: "exclamation-circle",
        info: "information-circle",
        warning: "exclamation-circle"
    };

    return (
        <div className={`${baseStyle} ${typeStyles[type] || typeStyles.info} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
            <div className="flex items-center">
                <HeroIcon name={iconName[type] || 'information-circle'} className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>{message}</span>
            </div>
        </div>
    );
};
export default ToastNotification;