import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSunday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Share2 } from 'lucide-react';

import { useScheduleData } from '../hooks/useScheduleData';
import AllocationForm from '../components/editor/AllocationForm';
import DayCard from '../components/editor/DayCard';
import ShareModal from '../components/modals/ShareModal';
import ConfirmClearModal from '../components/modals/ConfirmClearModal';
import ChangeWeekModal from '../components/modals/ChangeWeekModal';
import { RefreshCw } from 'lucide-react';
import { Schedule } from '../types';

function buildWeekDays(selectedDate: string) {
  const weekStart = new Date(selectedDate + 'T12:00:00');
  return Array.from({ length: 6 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      index: i + 1,
      date,
      label: format(date, 'EEEE', { locale: ptBR }),
      formattedDate: format(date, 'dd/MM'),
      fullDate: format(date, 'dd/MM/yyyy'),
    };
  });
}

export default function MapEditor() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const baseDate = isSunday(today) ? addDays(today, 1) : today;
    return format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChangeWeekModalOpen, setIsChangeWeekModalOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const { doctors, rooms, schedules, disabledDays, addSchedule, updateSchedule, deleteSchedule, toggleDayDisabled, clearWeek, copyWeek, moveWeek } =
    useScheduleData(selectedDate);

  const weekDays = buildWeekDays(selectedDate);
  const shareUrl = `${window.location.origin}/share?week=${selectedDate}`;

  useEffect(() => {
    const isModalOpen = isShareModalOpen || isConfirmClearOpen || isChangeWeekModalOpen;
    document.body.classList.toggle('modal-open', isModalOpen);
    return () => document.body.classList.remove('modal-open');
  }, [isShareModalOpen, isConfirmClearOpen, isChangeWeekModalOpen]);

  const handleWeekChange = (value: string) => {
    if (!value) return;
    const date = new Date(value + 'T12:00:00');
    const newDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (newDate === selectedDate) return;
    // Removida a verificação e o ConfirmClearModal destrutivo que apagava a semana.
    // Agora o painel apenas avança para a semana solicitada para ser visualizada.
    setSelectedDate(newDate);
  };

  const handleConfirmClear = async () => {
    if (!pendingDate) return;
    setIsClearing(true);
    try {
      await clearWeek(selectedDate);
    } catch (err) {
      console.error('Error clearing week:', err);
    } finally {
      setSelectedDate(pendingDate);
      setPendingDate(null);
      setIsConfirmClearOpen(false);
      setIsClearing(false);
    }
  };

  const handleCopyWeek = async (newDate: string) => {
    setIsTransferring(true);
    try {
      await copyWeek(newDate);

      // Apaga a semana de 15 dias atrás (retrasada) e não a anterior (passada).
      const weekBeforeCurrent = format(addDays(new Date(selectedDate + 'T12:00:00'), -14), 'yyyy-MM-dd');
      await clearWeek(weekBeforeCurrent);

      setIsChangeWeekModalOpen(false);
      setSelectedDate(newDate);
    } catch (err) {
      console.error('Error copying week:', err);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAddSchedule = ({ day, roomId, doctorId, shift, startTime, endTime }: {
    day: number; roomId: string; doctorId: string; shift: string; startTime: string; endTime: string;
  }) => {
    addSchedule({
      week_start_date: selectedDate,
      day_of_week: day,
      room_id: roomId,
      doctor_id: doctorId,
      shift,
      time_slot: `${startTime} - ${endTime}`,
    });
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    document.getElementById('allocation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateSchedule = (id: string, { day, roomId, doctorId, shift, startTime, endTime }: {
    day: number; roomId: string; doctorId: string; shift: string; startTime: string; endTime: string;
  }) => {
    updateSchedule(id, {
      day_of_week: day,
      room_id: roomId,
      doctor_id: doctorId,
      shift,
      time_slot: `${startTime} - ${endTime}`,
    });
    setEditingSchedule(null);
  };

  return (
    <div className="space-y-8">

      {/* Header / Week Selection */}
      <div className="bg-white shadow rounded-lg p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerar Mapa Semanal</h1>
          <p className="text-sm text-gray-500">
            Semana de {weekDays[0].formattedDate} a {weekDays[5].formattedDate}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="date"
            className="w-full sm:w-auto border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
            value={selectedDate}
            onChange={(e) => handleWeekChange(e.target.value)}
          />
          <button
            onClick={() => setIsChangeWeekModalOpen(true)}
            title="Copiar ou Mover Semana"
            className="w-full sm:w-auto bg-blue-100 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-200 flex items-center justify-center transition-all font-bold text-sm shadow-lg shadow-brand-primary/20"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto bg-brand-primary text-white px-6 py-3 rounded-xl hover:opacity-90 flex items-center justify-center transition-all font-bold text-sm shadow-lg shadow-brand-primary/20"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Allocation Form */}
      <AllocationForm
        weekDays={weekDays}
        doctors={doctors}
        rooms={rooms}
        onAdd={handleAddSchedule}
        editingSchedule={editingSchedule}
        onUpdate={handleUpdateSchedule}
        onCancelEdit={() => setEditingSchedule(null)}
      />

      {/* Weekly View */}
      <div className="space-y-6">
        {weekDays.map((day) => (
          <DayCard
            key={day.index}
            day={day}
            schedules={schedules.filter((s) => s.day_of_week === day.index)}
            isDisabled={disabledDays.includes(day.index)}
            onToggleDisabled={toggleDayDisabled}
            onDeleteSchedule={deleteSchedule}
            onEditSchedule={handleEditSchedule}
          />
        ))}
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareUrl}
      />
      <ChangeWeekModal
        isOpen={isChangeWeekModalOpen}
        onClose={() => setIsChangeWeekModalOpen(false)}
        currentDate={selectedDate}
        onCopy={handleCopyWeek}
        isLoading={isTransferring}
      />
      <ConfirmClearModal
        isOpen={isConfirmClearOpen}
        onClose={() => { setPendingDate(null); setIsConfirmClearOpen(false); }}
        onConfirm={handleConfirmClear}
        isLoading={isClearing}
        currentWeekRange={`${weekDays[0].formattedDate} a ${weekDays[5].formattedDate}`}
      />

    </div>
  );
}
