import React from 'react';

interface BrandLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-xl',
        xl: 'w-24 h-24 text-3xl',
    };

    return (
        <div
            className={`flex items-center justify-center bg-brand-primary rounded-xl font-bold text-white shadow-md select-none transform transition-all hover:scale-105 ${sizeClasses[size]} ${className}`}
            aria-label="BS Logo"
        >
            BS
        </div>
    );
};

export default BrandLogo;
