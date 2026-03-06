import React from 'react';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { Doctor, Room, MonthlyAllocation } from '../../types';

interface MonthlyDashboardProps {
    getOccupancyRate: () => number;
    currentWeekIndex: number;
    setCurrentWeekIndex: React.Dispatch<React.SetStateAction<number>>;
    weeksLength: number;
    currentWeekDays: Date[];
    filterShift: string;
    setFilterShift: (shift: string) => void;
    allocations: MonthlyAllocation[];
    doctors: Doctor[];
    rooms: Room[];
    formatDoctorName: (name: string) => string;
}

export default function MonthlyDashboard({
    getOccupancyRate,
    currentWeekIndex,
    setCurrentWeekIndex,
    weeksLength,
    currentWeekDays,
    filterShift,
    setFilterShift,
    allocations,
    doctors,
    rooms,
    formatDoctorName
}: MonthlyDashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50/50 p-6 rounded-3xl">

            {/* Dashboard Header & Metrics */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6">

                {/* Occupancy Rate */}
                <div className="flex items-center gap-4 border-r border-gray-100 pr-6 min-w-[200px]">
                    <div className="bg-green-50 p-3 rounded-xl">
                        <PieChart className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa de Ocupação</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-900">{getOccupancyRate()}%</span>
                            <span className="text-[10px] font-bold text-green-600">do mês</span>
                        </div>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentWeekIndex === 0}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="text-center min-w-[180px]">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Visualizando
                        </span>
                        <span className="text-base font-black text-gray-800 uppercase">
                            Semana {currentWeekIndex + 1}
                        </span>
                        <span className="block text-[10px] font-bold text-green-600">
                            {currentWeekDays.length > 0 && `De ${format(currentWeekDays[0], 'dd/MM')} a ${format(currentWeekDays[currentWeekDays.length - 1], 'dd/MM')}`}
                        </span>
                    </div>

                    <button
                        onClick={() => setCurrentWeekIndex(prev => Math.min(weeksLength - 1, prev + 1))}
                        disabled={currentWeekIndex === weeksLength - 1}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Shift Filter */}
                <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-200 flex">
                    {['MANHÃ', 'TARDE'].map(shift => (
                        <button
                            key={shift}
                            onClick={() => setFilterShift(shift)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${filterShift === shift
                                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                }`}
                        >
                            {shift.charAt(0) + shift.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weekly Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentWeekDays.map(day => {
                    const dayOfWeek = getDay(day);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayName = format(day, 'EEEE', { locale: ptBR });

                    // Calculate stats for this specific day and shift
                    let totalSlots = 0;
                    let occupiedSlots = 0;

                    const doctorGroups: { id: string, name: string, specialty: string }[] = [];
                    const specificRoomVacancies: { room: Room }[] = [];

                    // 1. Doctors for this specific date
                    const dayAllocations = allocations.filter(a => {
                        if (a.date !== dateStr) return false;
                        if (filterShift === 'ALL') return true;
                        // If filterShift is 'MANHÃ', include 'MANHÃ' and 'MANHÃ/TARDE'
                        if (filterShift === 'MANHÃ') return a.shift === 'MANHÃ' || a.shift === 'MANHÃ/TARDE';
                        // If filterShift is 'TARDE', include 'TARDE' and 'MANHÃ/TARDE'
                        if (filterShift === 'TARDE') return a.shift === 'TARDE' || a.shift === 'MANHÃ/TARDE';
                        // If filterShift is 'MANHÃ/TARDE', ONLY include 'MANHÃ/TARDE' assignments
                        if (filterShift === 'MANHÃ/TARDE') return a.shift === 'MANHÃ/TARDE';
                        return true;
                    });

                    dayAllocations.forEach(alloc => {
                        // Ignore interdicted allocations (null doctor_id) and unknown doctors
                        if (!alloc.doctor_id) return;

                        const doc = doctors.find(d => d.id === alloc.doctor_id);
                        // Add doctor to doctorGroups only if not already present
                        if (!doctorGroups.find(d => d.id === alloc.doctor_id)) {
                            doctorGroups.push({
                                id: alloc.doctor_id,
                                name: alloc.doctor_name || 'Médico',
                                specialty: doc?.specialty || ''
                            });
                        }
                    });

                    // 2. Vacancies for this specific date
                    // A room is NOT available if it has any allocation (including interdiction)
                    rooms.forEach(room => {
                        const roomAllocations = dayAllocations.filter(a => a.room_id === room.id);
                        const isOccupied = roomAllocations.length > 0;

                        if (!isOccupied) {
                            specificRoomVacancies.push({ room });
                        } else {
                            occupiedSlots++;
                        }
                        totalSlots++;
                    });

                    const occupancyPercent = Math.round((occupiedSlots / totalSlots) * 100) || 0;

                    return (
                        <div key={dateStr} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                            {/* Card Header */}
                            <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <h4 className="text-lg font-black text-gray-800 capitalize leading-none">{dayName}</h4>
                                        <span className="text-xs font-bold text-gray-400">{format(day, "dd 'de' MMMM", { locale: ptBR })}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${occupancyPercent >= 80 ? 'bg-red-100 text-red-700' :
                                        occupancyPercent >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {occupancyPercent}% Ocupado
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
                                    <div
                                        className={`h-full rounded-full ${occupancyPercent >= 80 ? 'bg-red-500' :
                                            occupancyPercent >= 50 ? 'bg-yellow-500' :
                                                'bg-green-500'
                                            }`}
                                        style={{ width: `${occupancyPercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col gap-6">

                                {/* Doctors Section */}
                                <div>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Users className="w-3 h-3" />
                                        Equipe Alocada
                                    </h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        {doctorGroups.map((doc, idx) => (
                                            <div key={`${doc.id}-${idx}`} className="flex items-center gap-2 group bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 shadow-sm">
                                                    {doc.name.charAt(0)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-gray-800 leading-tight truncate">{formatDoctorName(doc.name)}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{doc.specialty}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {doctorGroups.length === 0 && (
                                        <p className="text-sm text-gray-400 italic mt-2">Nenhum médico alocado.</p>
                                    )}
                                </div>

                                {/* Vacancies Section */}
                                {specificRoomVacancies.length > 0 && (
                                    <div className="mt-auto pt-4 border-t border-gray-50">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" />
                                            Salas Disponíveis
                                        </h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            {specificRoomVacancies.map((item, idx) => (
                                                <div
                                                    key={`${item.room.id}-${idx}`}
                                                    className="rounded-xl p-2 border shadow-sm bg-white flex items-center gap-2"
                                                    style={{
                                                        borderColor: item.room.color + '40'
                                                    }}
                                                >
                                                    <div className="w-2 h-2 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.room.color }}></div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black uppercase text-gray-700 truncate leading-tight">
                                                            {item.room.name}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-400 truncate leading-tight">
                                                            {item.room.type === 'Gine/Obst' ? 'GINECO' : item.room.type === 'General' ? 'GERAL' : 'PED'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
