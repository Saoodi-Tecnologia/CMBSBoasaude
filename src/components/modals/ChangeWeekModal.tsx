import React, { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Copy, ArrowRight, X } from 'lucide-react';

interface ChangeWeekModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: string;
    onCopy: (newDate: string) => Promise<void>;
    isLoading: boolean;
}

export default function ChangeWeekModal({
    isOpen,
    onClose,
    currentDate,
    onCopy,
    isLoading
}: ChangeWeekModalProps) {
    const [targetDate, setTargetDate] = useState('');

    if (!isOpen) return null;

    const handleTargetDateChange = (val: string) => {
        if (!val) return;
        const date = new Date(val + 'T12:00:00');
        setTargetDate(format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    };

    const getTargetWeekLabel = () => {
        if (!targetDate) return '';
        const weekStart = new Date(targetDate + 'T12:00:00');
        const weekEnd = addDays(weekStart, 5);
        return `${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`;
    };

    const currentWeekStart = new Date(currentDate + 'T12:00:00');
    const currentWeekEnd = addDays(currentWeekStart, 5);
    const currentLabel = `${format(currentWeekStart, 'dd/MM/yyyy')} a ${format(currentWeekEnd, 'dd/MM/yyyy')}`;

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-white rounded-2xl shadow-xl border border-gray-100 w-[95%] max-w-[450px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <RefreshCw className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Transferir Semana</h3>
                                <p className="text-sm text-gray-500">Mover ou copiar a grade atual</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Semana de Origem</p>
                            <p className="text-sm font-bold text-gray-800">{currentLabel}</p>
                        </div>

                        <div className="flex justify-center text-gray-300">
                            <ArrowRight className="w-5 h-5 rotate-90" />
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Para qual semana?</p>
                            <input
                                type="date"
                                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                onChange={(e) => handleTargetDateChange(e.target.value)}
                            />
                            {targetDate && targetDate !== currentDate && (
                                <p className="text-xs font-bold text-blue-600 mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                                    Destino: {getTargetWeekLabel()}
                                </p>
                            )}
                            {targetDate === currentDate && (
                                <p className="text-xs font-bold text-red-600 mt-2 ml-1">
                                    A semana de destino deve ser diferente da atual.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onCopy(targetDate)}
                            disabled={isLoading || !targetDate || targetDate === currentDate}
                            className="w-full py-3 px-4 bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 text-blue-700 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copiar e apagar a semana retrasada
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
