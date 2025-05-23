// src/components/Button.jsx
import React from 'react';
import { Loader2 } from 'lucide-react'; // Assuming you use lucide-react for loader

// Define or import your style objects/functions if they are complex
const baseStyle = "inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-colors duration-150";

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
  xl: 'px-7 py-3 text-lg',
  icon: 'p-2', // For icon-only buttons
};

const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 disabled:bg-primary-300 dark:disabled:bg-primary-700 dark:disabled:text-primary-500',
  secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-400 disabled:bg-secondary-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-400 disabled:bg-yellow-300',
  success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 disabled:bg-green-300',
  light: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
  ghost: 'text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-500/10',
  link: 'text-primary-600 hover:text-primary-700 underline focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300',
  outline: 'border border-primary-500 text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-500/10',
};


const Button = ({ 
    onClick, 
    children, 
    variant = 'primary', 
    size = 'md', 
    className = '', 
    disabled = false, 
    type = "button",
    isLoading = false,
    iconLeft: IconLeft, // Expect a component
    iconRight: IconRight, // Expect a component
    iconLeftClassName = "w-4 h-4", // Default icon class
    iconRightClassName = "w-4 h-4", // Default icon class
    fullWidth = false,
    // ... any other props you might have
}) => {
    const currentDisabled = disabled || isLoading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={currentDisabled}
            className={`
                ${baseStyle} 
                ${sizeStyles[size]} 
                ${variantStyles[variant]} 
                ${fullWidth ? 'w-full' : ''}
                ${className} 
                ${currentDisabled ? 'cursor-not-allowed opacity-70' : ''}
            `}
        >
            {isLoading && <Loader2 className={`w-4 h-4 animate-spin ${children ? 'mr-2' : ''}`} />}
            {IconLeft && !isLoading && <IconLeft className={`${iconLeftClassName} ${children ? 'mr-2' : ''}`} />}
            {children}
            {IconRight && !isLoading && <IconRight className={`${iconRightClassName} ${children ? 'ml-2' : ''}`} />}
        </button>
    );
};
export default Button;