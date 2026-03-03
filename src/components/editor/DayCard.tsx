import React from 'react';
import { CheckSquare, Square, Trash2 } from 'lucide-react';
import { Schedule } from '../../types';

interface WeekDay {
    index: number;
    label: string;
    fullDate: string;
}

interface DayCardProps {
    day: WeekDay;
    schedules: Schedule[];
    isDisabled: boolean;
    onToggleDisabled: (dayIndex: number) => void;
    onDeleteSchedule: (id: string) => void;
}

export default function DayCard({
    day,
    schedules,
    isDisabled,
    onToggleDisabled,
    onDeleteSchedule,
}: DayCardProps) {
    return (
        <div className={`bg-white shadow rounded-lg overflow-hidden ${isDisabled ? 'opacity-60' : ''}`}>
            <div className="bg-gray-100 px-4 md:px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-base md:text-lg font-medium text-gray-900 capitalize">
                    {day.label} - {day.fullDate}
                </h3>
                <button
                    onClick={() => onToggleDisabled(day.index)}
                    className={`flex items-center text-xs md:text-sm ${isDisabled ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {isDisabled ? (
                        <CheckSquare className="w-4 h-4 mr-1" />
                    ) : (
                        <Square className="w-4 h-4 mr-1" />
                    )}
                    {isDisabled ? 'Dia Desabilitado (Feriado)' : 'Marcar como Feriado'}
                </button>
            </div>

            {!isDisabled && (
                <div className="p-0 md:p-6">
                    {schedules.length === 0 ? (
                        <p className="text-gray-500 text-center py-8 text-sm">
                            Nenhuma alocacao registrada para este dia.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Consultorio
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Profissional
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Horario
                                        </th>
                                        <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Especialidade
                                        </th>
                                        <th className="px-4 md:px-6 py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acoes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {schedules.map((schedule) => (
                                        <tr key={schedule.id} className="text-sm md:text-base">
                                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-2"
                                                        style={{
                                                            backgroundColor:
                                                                schedule.shift === 'MANHA'
                                                                    ? '#16a34a'
                                                                    : schedule.shift === 'TARDE'
                                                                        ? '#ea580c'
                                                                        : '#2563eb',
                                                        }}
                                                    />
                                                    <span className="font-semibold text-xs md:text-sm">{schedule.room_name}</span>
                                                    <span className="text-[10px] md:text-xs text-gray-500 ml-1">
                                                        ({schedule.shift})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                                                {schedule.doctor_name}
                                            </td>
                                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-[10px] md:text-xs text-gray-500">
                                                {schedule.time_slot}
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {schedule.doctor_specialty}
                                            </td>
                                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => onDeleteSchedule(schedule.id)}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
