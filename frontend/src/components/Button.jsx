// src/components/Button.jsx
import React from 'react';
import HeroIcon from './HeroIcon'; // If icons are used within buttons
import { Loader2 } from 'lucide-react'; // Example for loading spinner

const Button = ({ 
    onClick, 
    children, 
    variant = 'primary', 
    size = 'md', 
    className = '', 
    disabled = false, 
    type = "button",
    isLoading = false, // New prop for loading state
    iconLeft, // Optional icon component or name for HeroIcon
    iconRight // Optional icon component or name for HeroIcon
}) => {
    const baseStyle = "font-semibold rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center";
    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };
    const variantStyles = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-400",
        secondary: "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400 disabled:bg-gray-100",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-400",
        success: "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 disabled:bg-green-300",
        warning: "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400 disabled:bg-yellow-300",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400 disabled:text-gray-400"
    };

    const currentDisabled = disabled || isLoading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={currentDisabled}
            className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className} ${currentDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {iconLeft && !isLoading && (typeof iconLeft === 'string' ? <HeroIcon name={iconLeft} className="w-4 h-4 mr-2" /> : iconLeft)}
            {children}
            {iconRight && !isLoading && (typeof iconRight === 'string' ? <HeroIcon name={iconRight} className="w-4 h-4 ml-2" /> : iconRight)}
        </button>
    );
};
export default Button;