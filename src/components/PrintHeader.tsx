import React from 'react';

interface PrintHeaderProps {
  startDate?: string;
  endDate?: string;
  subtitle?: string;
}

export default function PrintHeader({ startDate, endDate, subtitle }: PrintHeaderProps) {
  return (
    <div className="text-left mb-8">
      <div className="text-lg font-black text-brand-primary uppercase tracking-wider">Boa Saúde</div>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">Salas Centro Médico</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      {startDate && endDate && (
        <p className="text-sm text-gray-500 mt-0.5">{startDate} — {endDate}</p>
      )}
    </div>
  );
}
