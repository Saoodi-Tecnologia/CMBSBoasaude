import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addDays, startOfWeek, isSunday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Schedule } from '../types';
import { Printer } from 'lucide-react';
import ScheduleTable from '../components/ScheduleTable';
import PrintHeader from '../components/PrintHeader';
import { supabase } from '../../supabase';

export default function SharedView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const weekParam = searchParams.get('week');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [disabledDays, setDisabledDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShift, setFilterShift] = useState('ALL');

  useEffect(() => {
    if (!weekParam) {
      const today = new Date();
      const baseDate = isSunday(today) ? addDays(today, 1) : today;
      const currentWeekStart = format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      navigate(`/share?week=${currentWeekStart}`, { replace: true });
      return;
    }

    const fetchSchedules = async () => {
      try {
        // Fetch schedules with joins
        const { data: schedulesData, error: scheduleError } = await supabase
          .from('schedules')
          .select(`
            id,
            week_start_date,
            day_of_week,
            room_id,
            doctor_id,
            shift,
            time_slot,
            room:rooms(name, type),
            doctor:doctors(name, specialty)
          `)
          .eq('week_start_date', weekParam);

        if (scheduleError) throw scheduleError;

        const formattedSchedules = (schedulesData || []).map(s => {
          const room = (s as any).room || { name: 'Sala Removida', type: 'N/A' };
          const doctor = (s as any).doctor || { name: 'Médico Removido', specialty: 'N/A' };

          return {
            ...s,
            room_id: s.room_id,
            doctor_id: s.doctor_id,
            room_name: room.name,
            room_type: room.type,
            doctor_name: doctor.name,
            doctor_specialty: doctor.specialty
          };
        });

        // Fetch disabled days
        const { data: disabledDaysData, error: disabledError } = await supabase
          .from('disabled_days')
          .select('day_of_week')
          .eq('week_start_date', weekParam);

        if (disabledError) throw disabledError;

        setSchedules(formattedSchedules as any);
        setDisabledDays((disabledDaysData || []).map(d => d.day_of_week));
      } catch (error) {
        console.error('Failed to fetch schedules', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
    const interval = setInterval(fetchSchedules, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [weekParam, navigate]);


  if (!weekParam) {
    return <div className="p-8 text-center">Redirecionando para a semana atual...</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Carregando mapa...</div>;
  }

  const weekStart = parseISO(weekParam);
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      index: i + 1,
      date: date,
      label: format(date, 'EEEE', { locale: ptBR }).toUpperCase(),
      formattedDate: format(date, 'dd/MM/yyyy'),
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8 font-sans print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-8">
        <div className="no-print flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 gap-4">
          <div className="w-full md:w-auto transform scale-90 md:scale-100 origin-center md:origin-left">
            <PrintHeader startDate={weekDays[0].formattedDate} endDate={weekDays[5].formattedDate} />
          </div>
          <div className="flex items-center gap-3 no-print">
            <select
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
            >
              <option value="ALL">Todos os Turnos</option>
              <option value="MANHÃ">Manhã</option>
              <option value="TARDE">Tarde</option>
              <option value="MANHÃ/TARDE">Integral</option>
            </select>
            <button
              onClick={() => window.print()}
              className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-sm transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Mapa
            </button>
          </div>
        </div>

        {weekDays.map((day) => {
          let daySchedules = schedules.filter((s) => s.day_of_week === day.index);
          const isDisabled = disabledDays.includes(day.index);

          // Apply shift filter
          if (filterShift !== 'ALL') {
            const isIntegral = filterShift === 'MANHÃ/TARDE' || filterShift === 'MANHA/TARDE';

            if (isIntegral) {
              // Filter Integral: Only records that are actually integral
              // OR doctors that appear in more than one entry for this room/day (simulating integral)
              const counts: Record<string, number> = {};
              daySchedules.forEach(s => {
                const key = `${s.room_id}-${s.doctor_id}`;
                counts[key] = (counts[key] || 0) + 1;
              });
              daySchedules = daySchedules.filter(s =>
                s.shift === 'MANHÃ/TARDE' || s.shift === 'MANHA/TARDE' || s.shift === 'M/T' || counts[`${s.room_id}-${s.doctor_id}`] > 1
              );
            } else {
              // Filter Manhã or Tarde: Include specific records OR integral ones
              const normalizedFilter = filterShift.replace('Ã', 'A');
              daySchedules = daySchedules.filter(s =>
                s.shift === filterShift || s.shift === normalizedFilter || s.shift === 'MANHÃ/TARDE' || s.shift === 'MANHA/TARDE' || s.shift === 'M/T'
              );
            }
          }

          // Sort schedules by Room Name for consistency
          daySchedules.sort((a, b) => (a.room_name || '').localeCompare(b.room_name || ''));

          return (
            <div key={day.index} className="print-day-page print-landscape-only">
              <ScheduleTable
                schedules={daySchedules}
                disabled={isDisabled}
                dayLabel={day.label}
                formattedDate={day.formattedDate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
