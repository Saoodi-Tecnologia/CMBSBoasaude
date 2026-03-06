import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSunday, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Room, MonthlyAllocation } from '../types';
import PrintHeader from '../components/PrintHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabase';

export default function MonthlyShare() {
  const firstN = (name: string) => name?.split(' ')[0] ?? name;
  const formatDoctorName = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0];
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  };

  const [searchParams] = useSearchParams();
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<MonthlyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const currentDate = new Date(year, month - 1, 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: roomsData, error: roomsError } = await supabase.from('rooms').select('*');
        if (roomsError) throw roomsError;

        const startStr = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const endStr = format(endOfMonth(currentDate), 'yyyy-MM-dd');

        const { data: allocData, error: allocError } = await supabase
          .from('monthly_allocations')
          .select(`*, doctor:doctors(name)`)
          .gte('date', startStr)
          .lte('date', endStr);

        if (allocError) throw allocError;

        const sortedRooms = (roomsData || []).sort((a: Room, b: Room) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );

        const formattedAllocs = (allocData || []).map(a => ({
          ...a,
          doctor_name: a.doctor?.name || ''
        }));

        setRooms(sortedRooms);
        setAllocations(formattedAllocs);
      } catch (err) {
        console.error('Error fetching share data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year, currentDate]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    }).filter(day => !isSunday(day));
  }, [currentDate]);

  // Weekly View Logic
  const weeks = useMemo(() => {
    const w: Date[][] = [];
    let current: Date[] = [];
    daysInMonth.forEach(day => {
      if (getDay(day) === 1 && current.length > 0) {
        w.push(current);
        current = [];
      }
      current.push(day);
    });
    if (current.length > 0) w.push(current);
    return w;
  }, [daysInMonth]);

  const currentWeekDays = weeks[currentWeekIndex] || [];

  if (loading) return <div className="p-10 text-center font-bold text-green-600">Carregando mapa mensal...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-[100vw] mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 print:mb-4">
          <div className="print:hidden">
            <PrintHeader subtitle="Mapa Mensal de Alocações" />
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="text-center md:text-right">
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest md:justify-end">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wide mt-1">
                Semana {currentWeekIndex + 1} de {weeks.length}
              </p>
            </div>

            {/* Navigation Controls (Hidden in Print) */}
            <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-gray-200 print:hidden">
              <button
                onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                disabled={currentWeekIndex === 0}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="text-center min-w-[150px]">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Visualizando
                </span>
                <span className="text-sm font-black text-gray-800 uppercase">
                  {currentWeekDays.length > 0 && `De ${format(currentWeekDays[0], 'dd/MM')} a ${format(currentWeekDays[currentWeekDays.length - 1], 'dd/MM')}`}
                </span>
              </div>

              <button
                onClick={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
                disabled={currentWeekIndex === weeks.length - 1}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="border-b border-r border-gray-200 p-3 text-left text-xs font-bold uppercase text-gray-500 sticky left-0 bg-white z-10 min-w-[150px]">
                  Salas
                </th>
                {currentWeekDays.map(day => (
                  <th key={day.toISOString()} className="border-b border-gray-200 p-2 text-center min-w-[120px]">
                    <div className="text-[10px] uppercase font-bold text-gray-400">{format(day, 'EEEE', { locale: ptBR })}</div>
                    <div className="text-lg font-black text-gray-800">{format(day, 'dd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, idx) => (
                <tr key={room.id} className="bg-white">
                  <td className="border-b border-r border-gray-200 p-3 text-xs font-bold text-gray-700 sticky left-0 bg-white z-10" style={{ borderLeft: `4px solid ${room.color}` }}>
                    {room.name}
                    <div className="text-[9px] font-normal text-gray-400 uppercase mt-0.5">
                      {room.type === 'General' ? 'Geral' : room.type}
                    </div>
                  </td>
                  {currentWeekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayAllocations = allocations.filter(a => a.date === dateStr && a.room_id === room.id);

                    return (
                      <td key={dateStr} className="border-b border-gray-200 p-2 align-top h-24 transition-colors hover:bg-gray-50">
                        <div className="flex flex-col gap-1.5 h-full">
                          {['MANHÃ', 'TARDE'].map(slot => {
                            const alloc = dayAllocations.find(a =>
                              a.shift === slot || a.shift === 'MANHÃ/TARDE'
                            );

                            if (!alloc) {
                              return (
                                <div key={slot} className="flex-1 rounded border border-dashed border-gray-100 bg-gray-50/50 flex items-center justify-center">
                                  <span className="text-[9px] text-gray-300 font-medium uppercase tracking-wider">Livre</span>
                                </div>
                              );
                            }

                            const isInterdicted = alloc && !alloc.doctor_id;
                            const isIntegral = !isInterdicted && alloc.shift === 'MANHÃ/TARDE';

                            return (
                              <div
                                key={slot}
                                className={`flex-1 p-1.5 rounded-lg border flex flex-col justify-center ${isInterdicted
                                  ? 'bg-red-50 border-red-100'
                                  : isIntegral
                                    ? 'bg-blue-50 border-blue-100'
                                    : slot === 'MANHÃ'
                                      ? 'bg-orange-50 border-orange-100'
                                      : 'bg-green-50 border-green-100'
                                  }`}
                              >
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`text-[9px] font-black uppercase px-1 rounded ${isInterdicted
                                    ? 'bg-red-100 text-red-700'
                                    : isIntegral
                                      ? 'bg-blue-100 text-blue-700'
                                      : slot === 'MANHÃ'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                    {isInterdicted ? 'X' : (isIntegral ? 'INT' : slot === 'MANHÃ' ? 'M' : 'T')}
                                  </span>
                                  <span className={`text-[10px] font-bold truncate ${isInterdicted
                                    ? 'text-red-900'
                                    : isIntegral
                                      ? 'text-blue-900'
                                      : slot === 'MANHÃ'
                                        ? 'text-orange-900'
                                        : 'text-green-900'
                                    }`}>
                                    {isInterdicted ? 'INTERDITADO' : formatDoctorName(alloc.doctor_name || '')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-between items-center text-[10px] text-gray-400 italic print:mt-4">
          <span>Documento de uso interno</span>
          <span>Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
    </div>
  );
}
