import React from 'react';

interface PrintHeaderProps {
  startDate: string;
  endDate: string;
}

export default function PrintHeader({ startDate, endDate }: PrintHeaderProps) {
  return (
    <div className="text-left mb-8">
      <div className="text-lg font-black text-brand-primary uppercase tracking-wider">Boa Saúde</div>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">Salas Centro Médico</h1>
    </div>
  );
}
