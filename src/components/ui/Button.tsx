import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'white' | 'icon-edit' | 'icon-delete';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
    let variantClass = '';

    switch (variant) {
        case 'primary':
            variantClass = 'bg-brand-primary text-white px-6 py-3 rounded-xl hover:opacity-90 flex items-center justify-center transition-all shadow-lg hover:shadow-brand-primary/20 font-bold text-sm';
            break;
        case 'secondary':
            variantClass = 'bg-gray-50 border border-gray-200 text-gray-600 px-6 py-3 rounded-xl hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all font-bold text-sm shadow-sm';
            break;
        case 'white':
            variantClass = 'bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-all shadow-lg shadow-black/5 font-bold text-sm';
            break;
        case 'icon-edit':
            variantClass = 'text-brand-primary hover:opacity-80 p-2 transition-colors inline-flex items-center justify-center';
            break;
        case 'icon-delete':
            variantClass = 'text-red-500 hover:text-red-700 p-2 transition-colors inline-flex items-center justify-center';
            break;
    }

    return (
        <button
            className={`${variantClass} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
