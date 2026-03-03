import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Schedule } from '../types';
import { Printer } from 'lucide-react';
import ScheduleTable from '../components/ScheduleTable';
import PrintHeader from '../components/PrintHeader';

export default function SharedView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const weekParam = searchParams.get('week');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [disabledDays, setDisabledDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weekParam) {
      const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      navigate(`/share?week=${currentWeekStart}`, { replace: true });
      return;
    }

    const fetchSchedules = async () => {
      try {
        const res = await fetch(`/api/schedules?week_start_date=${weekParam}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSchedules(data.schedules);
        setDisabledDays(data.disabledDays);
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-start mb-8 print:mb-4">
          <div className="w-full md:w-auto">
            <PrintHeader startDate={weekDays[0].formattedDate} endDate={weekDays[5].formattedDate} />
          </div>
          <button
            onClick={() => window.print()}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 flex items-center no-print"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </button>
        </div>

        {weekDays.map((day) => {
          const daySchedules = schedules.filter((s) => s.day_of_week === day.index);
          const isDisabled = disabledDays.includes(day.index);

          // Sort schedules by Room Name for consistency
          daySchedules.sort((a, b) => (a.room_name || '').localeCompare(b.room_name || ''));

          return (
            <ScheduleTable
              key={day.index}
              schedules={daySchedules}
              disabled={isDisabled}
              dayLabel={day.label}
              formattedDate={day.formattedDate}
            />
          );
        })}
      </div>
    </div>
  );
}

