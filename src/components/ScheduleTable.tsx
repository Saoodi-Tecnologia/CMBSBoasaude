import React from 'react';
import { Schedule } from '../types';

interface ScheduleTableProps {
  schedules: Schedule[];
  disabled: boolean;
  dayLabel: string;
  formattedDate: string;
  labelUpper?: string;
}

export default function ScheduleTable({ schedules, disabled, dayLabel, formattedDate, labelUpper }: ScheduleTableProps) {
  if (disabled) {
    return (
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 opacity-75">
        <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
          <h2 className="text-lg font-bold text-gray-700">
            DIA {formattedDate} / {labelUpper || dayLabel.toUpperCase()}
          </h2>
        </div>
        <div className="p-8 text-center text-gray-500 italic">
          Não haverá atendimento (Feriado/Recesso)
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 mb-6 transition-all hover:shadow-2xl">
      <div className="bg-gray-100/80 px-4 md:px-6 py-3 border-b border-gray-200">
        <h2 className="text-base md:text-lg font-black text-gray-800 tracking-tight">
          DIA {formattedDate} / {labelUpper || dayLabel.toUpperCase()}
        </h2>
      </div>

      <div className="overflow-x-auto -mx-0">
        <table className="min-w-full border-collapse">
          <thead style={{ display: 'table-header-group' }}>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="px-3 md:px-4 py-3 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-100">Consultório</th>
              <th className="px-3 md:px-4 py-3 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-100">Profissional</th>
              <th className="px-3 md:px-4 py-3 text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-100">Horário</th>
              <th className="hidden md:table-cell px-3 md:px-4 py-3 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Especialidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400 italic text-sm">
                  Nenhuma alocação registrada para este dia.
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="last:border-0 hover:bg-gray-50/50 transition-colors" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td
                    className="px-3 md:px-4 py-3 text-[11px] md:text-sm font-bold border-r border-gray-100 text-gray-900"
                    style={{
                      backgroundColor: (schedule.shift === 'MANHÃ' || schedule.shift === 'MANHA') ? 'rgba(34, 197, 94, 0.05)' : schedule.shift === 'TARDE' ? 'rgba(234, 88, 12, 0.05)' : 'rgba(37, 99, 235, 0.05)'
                    }}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor: (schedule.shift === 'MANHÃ' || schedule.shift === 'MANHA') ? '#22c55e' : schedule.shift === 'TARDE' ? '#ea580c' : '#2563eb'
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="truncate max-w-[80px] md:max-w-none">{schedule.room_name}</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 font-medium">({schedule.shift})</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-[11px] md:text-sm text-gray-800 border-r border-gray-100 font-semibold bg-white">
                    {schedule.doctor_name}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-[10px] md:text-xs text-gray-600 text-center border-r border-gray-100 font-medium whitespace-nowrap bg-white">
                    {schedule.time_slot}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500 uppercase tracking-tighter bg-white">
                    {schedule.doctor_specialty}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
