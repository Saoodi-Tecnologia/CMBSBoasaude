import React, { SelectHTMLAttributes } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    containerClassName?: string;
}

export function Select({ label, options, className = '', containerClassName = '', ...props }: SelectProps) {
    return (
        <div className={`flex flex-col w-full ${containerClassName}`}>
            {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>}
            <select
                className={`border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all bg-white appearance-none w-full ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
