import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Doctor, Room, Schedule } from '../types';
import { Share2, Trash2, Plus, CheckSquare, Square, X, Printer, Link, Copy, Check, ExternalLink } from 'lucide-react';
import ScheduleTable from '../components/ScheduleTable';
import PrintHeader from '../components/PrintHeader';
import { supabase } from '../../supabase';

export default function MapEditor() {
  const [selectedDate, setSelectedDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [disabledDays, setDisabledDays] = useState<number[]>([]);

  // Form State
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1=Monday
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedShift, setSelectedShift] = useState('MANHÃ');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('13:00');

  // Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Week change confirmation state
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Handle body class for printing
  useEffect(() => {
    if (isShareModalOpen || isConfirmClearOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isShareModalOpen, isConfirmClearOpen]);

  const shareUrl = `${window.location.origin}/share?week=${selectedDate}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Use a fixed time to avoid timezone issues when parsing YYYY-MM-DD
  const weekStart = new Date(selectedDate + 'T12:00:00');

  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      index: i + 1, // 1=Monday, 6=Saturday
      date: date,
      label: format(date, 'EEEE', { locale: ptBR }),
      formattedDate: format(date, 'dd/MM'),
      fullDate: format(date, 'dd/MM/yyyy'),
      labelUpper: format(date, 'EEEE', { locale: ptBR }).toUpperCase(),
    };
  });

  useEffect(() => {
    fetchDoctors();
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const fetchDoctors = async () => {
    const { data, error } = await supabase.from('doctors').select('*');
    if (!error) setDoctors(data || []);
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase.from('rooms').select('*');
    if (!error && data) {
      // Sort rooms naturally (e.g., Sala 1, Sala 2, Sala 10)
      const sortedRooms = data.sort((a: Room, b: Room) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      setRooms(sortedRooms);
    }
  };

  const fetchSchedules = async () => {
    // Fetch schedules with joins
    const { data: schedulesData, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        id,
        week_start_date,
        day_of_week,
        shift,
        time_slot,
        room:rooms(name, type),
        doctor:doctors(name, specialty)
      `)
      .eq('week_start_date', selectedDate);

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      return;
    }

    const formattedSchedules = (schedulesData || []).map(s => {
      const room = (s as any).room || { name: 'Sala Removida', type: 'N/A' };
      const doctor = (s as any).doctor || { name: 'Médico Removido', specialty: 'N/A' };

      return {
        ...s,
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
      .eq('week_start_date', selectedDate);

    if (disabledError) {
      console.error('Error fetching disabled days:', disabledError);
    }

    setSchedules(formattedSchedules as any);
    setDisabledDays((disabledDaysData || []).map(d => d.day_of_week));
  };

  const handleAddSchedule = async () => {
    if (!selectedRoom || !selectedDoctor) return;

    const { error } = await supabase
      .from('schedules')
      .insert([{
        week_start_date: selectedDate,
        day_of_week: selectedDay,
        room_id: selectedRoom,
        doctor_id: selectedDoctor,
        shift: selectedShift,
        time_slot: `${startTime} - ${endTime}`,
      }]);

    if (!error) fetchSchedules();
    else console.error('Error adding schedule:', error);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta alocacao?')) return;
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) fetchSchedules();
  };

  const toggleDayDisabled = async (dayIndex: number) => {
    const isDisabled = disabledDays.includes(dayIndex);
    if (!isDisabled) {
      await supabase
        .from('disabled_days')
        .upsert({ week_start_date: selectedDate, day_of_week: dayIndex }, { onConflict: 'week_start_date,day_of_week' });
    } else {
      await supabase
        .from('disabled_days')
        .delete()
        .eq('week_start_date', selectedDate)
        .eq('day_of_week', dayIndex);
    }
    fetchSchedules();
  };

  const handleWeekChange = (value: string) => {
    if (!value) return;
    const date = new Date(value + 'T12:00:00');
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    const newDate = format(monday, 'yyyy-MM-dd');
    if (newDate === selectedDate) return;
    // If there are any schedules or disabled days for the current week, ask for confirmation
    if (schedules.length > 0 || disabledDays.length > 0) {
      setPendingDate(newDate);
      setIsConfirmClearOpen(true);
    } else {
      setSelectedDate(newDate);
    }
  };

  const handleConfirmClear = async () => {
    if (!pendingDate) return;
    setIsClearing(true);
    try {
      // Clear schedules and disabled days for the current week
      await supabase.from('schedules').delete().eq('week_start_date', selectedDate);
      await supabase.from('disabled_days').delete().eq('week_start_date', selectedDate);
    } catch (err) {
      console.error('Error clearing week:', err);
    } finally {
      setSelectedDate(pendingDate);
      setPendingDate(null);
      setIsConfirmClearOpen(false);
      setIsClearing(false);
    }
  };


  const handleCancelClear = () => {
    setPendingDate(null);
    setIsConfirmClearOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header / Week Selection */}
      <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerar Mapa Semanal</h1>
          <p className="text-gray-500">
            Semana de {weekDays[0].formattedDate} a {weekDays[5].formattedDate}
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <input
            type="date"
            className="border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
            value={selectedDate}
            onChange={(e) => handleWeekChange(e.target.value)}
          />
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="bg-brand-primary text-white px-4 py-2 rounded hover:opacity-90 flex items-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Add Entry Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Adicionar Alocação</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Dia</label>
            <select
              className="mt-1 block w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
            >
              {weekDays.map((day) => (
                <option key={day.index} value={day.index}>
                  {day.label} ({day.formattedDate})
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Sala</label>
            <select
              className="mt-1 block w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              <option value="">Selecione...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Médico</label>
            <select
              className="mt-1 block w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">Selecione...</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Turno</label>
            <select
              className="mt-1 block w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
            >
              <option value="MANHÃ">MANHÃ</option>
              <option value="TARDE">TARDE</option>
              <option value="M/T">M/T</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Início</label>
            <input
              type="time"
              className="mt-1 block w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Fim</label>
            <input
              type="time"
              className="mt-1 block w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <button
              onClick={handleAddSchedule}
              className="w-full bg-brand-primary text-white px-4 py-2 rounded hover:opacity-90 flex items-center justify-center transition-all"
            >
              <Plus className="w-5 h-5 mr-2 flex-shrink-0" /> Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Weekly View (Editor) */}
      <div className="space-y-6">
        {weekDays.map((day) => {
          const daySchedules = schedules.filter((s) => s.day_of_week === day.index);
          const isDisabled = disabledDays.includes(day.index);

          return (
            <div key={day.index} className={`bg-white shadow rounded-lg overflow-hidden ${isDisabled ? 'opacity-60' : ''}`}>
              <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {day.label} - {day.fullDate}
                </h3>
                <button
                  onClick={() => toggleDayDisabled(day.index)}
                  className={`flex items-center text-sm ${isDisabled ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {isDisabled ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
                  {isDisabled ? 'Dia Desabilitado (Feriado)' : 'Marcar como Feriado'}
                </button>
              </div>

              {!isDisabled && (
                <div className="p-6">
                  {daySchedules.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhuma alocação registrada para este dia.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultório</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {daySchedules.map((schedule) => (
                            <tr key={schedule.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{
                                      backgroundColor: schedule.shift === 'MANHÃ' ? '#16a34a' : schedule.shift === 'TARDE' ? '#ea580c' : '#2563eb' // green, orange, blue
                                    }}
                                  />
                                  <span className="font-medium">{schedule.room_name}</span>
                                  <span className="text-gray-500 ml-1">- {schedule.shift}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{schedule.doctor_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.time_slot}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.doctor_specialty}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="text-red-600 hover:text-red-900"
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
        })}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Compartilhar Mapa</h2>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Link de Compartilhamento */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 flex items-center">
                  <Link className="w-4 h-4 mr-2 text-brand-primary" />
                  Link público da semana
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-600 font-mono focus:outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    title="Copiar link"
                    className={`p-2.5 rounded-lg transition-all flex border ${copied
                      ? 'bg-[rgba(116,165,52,0.1)] border-brand-secondary text-brand-secondary'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir em nova aba"
                    className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="bg-[rgba(116,165,52,0.1)] border border-brand-secondary/20 rounded-lg p-3">
                <p className="text-xs text-brand-secondary font-medium leading-relaxed">
                  Este link permite que qualquer pessoa visualize o cronograma atualizado em tempo real sem precisar de senha.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Week Clear Modal */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-white/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Trocar semana?</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Os dados de alocacao da semana atual serao apagados permanentemente do banco ao trocar para a nova semana. Essa acao nao pode ser desfeita.
              </p>
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs text-amber-800 font-medium">
                  Semana atual: {weekDays[0].formattedDate} a {weekDays[5].formattedDate}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCancelClear}
                disabled={isClearing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isClearing ? 'Apagando...' : 'Confirmar e trocar semana'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

