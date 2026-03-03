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
    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
        <h2 className="text-lg font-bold text-gray-700">
          DIA {formattedDate} / {labelUpper || dayLabel.toUpperCase()}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-r border-gray-200 w-1/4">Consultório</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-r border-gray-200 w-1/4">Profissional</th>
              <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 w-1/6">Horário</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 w-1/3">Especialidade</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                  Nenhuma alocação registrada para este dia.
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td
                    className="px-4 py-3 text-sm font-medium border-r border-gray-200 text-gray-900"
                    style={{
                      backgroundColor: schedule.shift === 'MANHÃ' ? '#dcfce7' : schedule.shift === 'TARDE' ? '#ffedd5' : '#dbeafe' // green, orange, blue
                    }}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2 shadow-sm"
                        style={{
                          backgroundColor: schedule.shift === 'MANHÃ' ? '#16a34a' : schedule.shift === 'TARDE' ? '#ea580c' : '#2563eb' // green, orange, blue
                        }}
                      />
                      {schedule.room_name} <span className="text-gray-600 ml-1">- {schedule.shift}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 font-medium">
                    {schedule.doctor_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center border-r border-gray-200">
                    {schedule.time_slot}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 uppercase tracking-wide">
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
