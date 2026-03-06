import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Share2, BarChart3 } from 'lucide-react';
import { Button } from '../ui/Button';

interface MonthlyHeaderProps {
    currentDate: Date;
    handleMonthChange: (direction: 'prev' | 'next') => void;
    showReports: boolean;
    setShowReports: (show: boolean) => void;
    setFilterShift: (shift: string) => void;
    setIsShareModalOpen: (open: boolean) => void;
}

export default function MonthlyHeader({
    currentDate,
    handleMonthChange,
    showReports,
    setShowReports,
    setFilterShift,
    setIsShareModalOpen,
}: MonthlyHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-xl">
                    <CalendarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mapa Mensal</h1>
                    <p className="text-sm text-gray-500">Gestão de escala e ocupação de consultórios</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <button
                    onClick={() => handleMonthChange('prev')}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-lg font-bold min-w-[160px] text-center capitalize text-gray-700">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <button
                    onClick={() => handleMonthChange('next')}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => {
                        const nextState = !showReports;
                        setShowReports(nextState);
                        if (nextState) {
                            setFilterShift('MANHÃ');
                        } else {
                            setFilterShift('ALL');
                        }
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-lg font-bold text-sm border ${showReports
                        ? 'bg-brand-primary text-white border-brand-primary shadow-brand-primary/20'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-black/5'
                        }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    {showReports ? 'Ver Grade' : 'Relatórios'}
                </button>
                <Button variant="white" onClick={() => setIsShareModalOpen(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                </Button>
            </div>
        </div>
    );
}
