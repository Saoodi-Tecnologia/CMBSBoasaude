import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    containerClassName?: string;
}

export function Input({ label, className = '', containerClassName = '', ...props }: InputProps) {
    return (
        <div className={`flex flex-col w-full ${containerClassName}`}>
            {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>}
            <input
                className={`border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all w-full ${className}`}
                {...props}
            />
        </div>
    );
}
