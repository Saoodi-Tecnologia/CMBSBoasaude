import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSunday, getDay, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Doctor, Room, MonthlyAllocation } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Share2, Plus, Trash2, AlertCircle, Copy, Zap, Info, Users, RefreshCw, Filter, X, BarChart3, PieChart, TrendingUp, ShieldAlert, Link, Check, ExternalLink } from 'lucide-react';

import MonthlyHeader from '../components/monthly/MonthlyHeader';
import MonthlyDashboard from '../components/monthly/MonthlyDashboard';

export default function MonthlyManagement() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allocations, setAllocations] = useState<MonthlyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReplicating, setIsReplicating] = useState(false);

  const formatDoctorName = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0];
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  };

  // Form State
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedShift, setSelectedShift] = useState('MANHÃ');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-clear notifications after 10 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const getSuccessAlertConfig = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('removida') || lower.includes('excluída') || lower.includes('limpo')) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        iconBg: 'bg-red-200',
        iconColor: 'text-red-700',
        hoverBg: 'hover:bg-red-100',
        Icon: Trash2
      };
    }
    if (lower.includes('interdita')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        iconBg: 'bg-amber-200',
        iconColor: 'text-amber-700',
        hoverBg: 'hover:bg-amber-100',
        Icon: ShieldAlert
      };
    }
    if (lower.includes('trocado')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        iconBg: 'bg-blue-200',
        iconColor: 'text-blue-700',
        hoverBg: 'hover:bg-blue-100',
        Icon: RefreshCw
      };
    }
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-200',
      iconColor: 'text-emerald-700',
      hoverBg: 'hover:bg-emerald-100',
      Icon: Zap
    };
  };

  // Swap State
  const [swappingAlloc, setSwappingAlloc] = useState<(MonthlyAllocation & { x: number, y: number }) | null>(null);
  const [swapSearchTerm, setSwapSearchTerm] = useState('');

  // Filter State
  const [highlightFree, setHighlightFree] = useState(false);
  const [filterShift, setFilterShift] = useState<string | 'ALL'>('ALL');
  const [showReports, setShowReports] = useState(false);
  const [draggedAlloc, setDraggedAlloc] = useState<MonthlyAllocation | null>(null);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  // Quick Select State
  const [quickSelectContext, setQuickSelectContext] = useState<{
    date: string;
    roomId: string;
    shift: string;
    roomName: string;
    x: number;
    y: number;
  } | null>(null);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');

  // Month Transition State
  const [pendingMonthChange, setPendingMonthChange] = useState<Date | null>(null);
  const [showMonthTransitionModal, setShowMonthTransitionModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Space Key Tracking
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleInterdiction = async (date: string, roomId: string, shift: string, existingAlloc: MonthlyAllocation | undefined) => {
    if (existingAlloc) {
      const isCurrentlyInterdicted = !existingAlloc.doctor_id;
      if (isCurrentlyInterdicted) {
        // Remove Interdiction
        await fetch(`/api/monthly-allocations/${existingAlloc.id}`, { method: 'DELETE' });
        setSuccess('Interdição removida.');
      } else {
        // Overwrite existing allocation with Interdiction
        await fetch(`/api/monthly-allocations/${existingAlloc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctor_id: 'INTERDITADO' })
        });
        setSuccess('Turno interditado.');
      }
    } else {
      // Create Interdiction - send 'INTERDITADO' so server converts to null
      await fetch('/api/monthly-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, room_id: roomId, shift, doctor_id: 'INTERDITADO' })
      });
      setSuccess('Turno interditado.');
    }
    fetchAllocations();
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAllocations();
  }, [currentDate]);

  const fetchInitialData = async () => {
    const [roomsRes, doctorsRes] = await Promise.all([
      fetch('/api/rooms'),
      fetch('/api/doctors')
    ]);
    const roomsData = await roomsRes.json();
    const doctorsData = await doctorsRes.json();

    const sortedRooms = roomsData.sort((a: Room, b: Room) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    setRooms(sortedRooms);
    setDoctors(doctorsData);
  };

  const fetchAllocations = async () => {
    setLoading(true);
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const res = await fetch(`/api/monthly-allocations?month=${month}&year=${year}`);
    const data = await res.json();
    setAllocations(data);
    setLoading(false);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  }).filter(day => !isSunday(day));

  // Weekly View Logic
  const weeks = React.useMemo(() => {
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
  }, [currentDate]);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  useEffect(() => { setCurrentWeekIndex(0); }, [currentDate]);

  const currentWeekDays = weeks[currentWeekIndex] || [];

  const handleAddAllocation = async () => {
    if (selectedDays.length === 0 || !selectedRoom || !selectedDoctor) return;
    setError('');
    setSuccess('');

    let successCount = 0;
    let errorCount = 0;

    for (const day of selectedDays) {
      const res = await fetch('/api/monthly-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: day,
          room_id: selectedRoom,
          doctor_id: selectedDoctor,
          shift: selectedShift
        })
      });

      if (res.ok) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    if (successCount > 0) {
      fetchAllocations();
      setSelectedDoctor('');
      setSelectedDays([]);
      setSuccess(`${successCount} alocações realizadas com sucesso!${errorCount > 0 ? ` (${errorCount} falhas)` : ''}`);
      setIsAllocationModalOpen(false);
      setQuickSelectContext(null);
    } else if (errorCount > 0) {
      setError('Falha ao realizar alocações. Verifique conflitos.');
    }
  };

  const handleQuickSelect = async (doctorId: string) => {
    if (!quickSelectContext) return;

    const res = await fetch('/api/monthly-allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: quickSelectContext.date,
        room_id: quickSelectContext.roomId,
        doctor_id: doctorId,
        shift: quickSelectContext.shift
      })
    });

    if (res.status === 409) {
      setError('Esta sala já está ocupada neste dia e turno.');
      return;
    }

    if (res.ok) {
      fetchAllocations();
      setQuickSelectContext(null);
      setQuickSearchTerm('');
      setSuccess('Alocação realizada com sucesso!');
    }
  };

  const [confirmDeleteState, setConfirmDeleteState] = useState<{ id: string, x: number, y: number } | null>(null);

  const handleDeleteAllocation = (id: string, x: number, y: number) => {
    setConfirmDeleteState({ id, x, y });
  };

  const executeDeleteAllocation = async () => {
    if (!confirmDeleteState) return;
    await fetch(`/api/monthly-allocations/${confirmDeleteState.id}`, { method: 'DELETE' });
    fetchAllocations();
    setConfirmDeleteState(null);
    setSuccess('Alocação removida com sucesso!');
  };

  const handleSwapDoctor = async (targetDoctorId: string) => {
    if (!swappingAlloc) return;

    const res = await fetch(`/api/monthly-allocations/${swappingAlloc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_id: targetDoctorId })
    });

    if (res.ok) {
      fetchAllocations();
      setSwappingAlloc(null);
      setSwapSearchTerm('');
      setSuccess('Médico(a) trocado(a) com sucesso!');
    }
  };

  const handleDrop = async (date: string, roomId: string, shift: string, isCopy: boolean = false) => {
    if (!draggedAlloc) return;

    // If dropped on the same spot, do nothing
    if (draggedAlloc.date === date && draggedAlloc.room_id === roomId && draggedAlloc.shift === shift) {
      setDraggedAlloc(null);
      return;
    }

    if (isCopy) {
      const res = await fetch('/api/monthly-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          room_id: roomId,
          doctor_id: draggedAlloc.doctor_id,
          shift
        })
      });

      if (res.ok) {
        fetchAllocations();
        setSuccess('Alocação copiada com sucesso!');
      } else if (res.status === 409) {
        setError('O destino já possui uma alocação neste turno.');
      }
    } else {
      const res = await fetch(`/api/monthly-allocations/${draggedAlloc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          room_id: roomId,
          shift
        })
      });

      if (res.ok) {
        fetchAllocations();
        setSuccess('Alocação movida com sucesso!');
      } else if (res.status === 409) {
        setError('O destino já possui uma alocação neste turno.');
      }
    }

    setDraggedAlloc(null);
  };

  const handleReplicateDay = async (sourceDateStr: string) => {
    console.log(`Replicating day: ${sourceDateStr}`);
    const sourceDate = parseISO(sourceDateStr);
    const dayOfWeek = getDay(sourceDate);
    const sourceAllocations = allocations.filter(a => a.date === sourceDateStr);

    console.log(`Found ${sourceAllocations.length} allocations to replicate`);

    if (sourceAllocations.length === 0) {
      setError('Não há alocação neste dia para replicar.');
      return;
    }

    if (!confirm(`Deseja replicar as alocações de ${format(sourceDate, 'EEEE', { locale: ptBR })} para todos os outros dias iguais deste mês?`)) {
      return;
    }

    setIsReplicating(true);
    setError('');

    const targetDays = daysInMonth.filter(day =>
      getDay(day) === dayOfWeek && format(day, 'yyyy-MM-dd') !== sourceDateStr
    );

    console.log(`Target days: ${targetDays.map(d => format(d, 'yyyy-MM-dd')).join(', ')}`);

    const newAllocations = targetDays.flatMap(day =>
      sourceAllocations.map(source => ({
        date: format(day, 'yyyy-MM-dd'),
        room_id: source.room_id,
        doctor_id: source.doctor_id,
        shift: source.shift
      }))
    );

    console.log(`Prepared ${newAllocations.length} new allocations for bulk insert`);

    try {
      const res = await fetch('/api/monthly-allocations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations: newAllocations })
      });

      const data = await res.json();
      console.log('Bulk replication response:', data);

      if (res.ok) {
        setSuccess('Escala replicada com sucesso para o mês inteiro!');
        fetchAllocations();
      } else {
        setError('Erro ao replicar escala.');
      }
    } catch (err) {
      console.error('Error replicating:', err);
      setError('Erro de conexão ao replicar escala.');
    } finally {
      setIsReplicating(false);
    }
  };

  const handleSyncWeekly = async () => {
    if (!confirm('Deseja importar a escala semanal para este mês? Isso preencherá os espaços vazios baseados no mapa semanal.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/monthly-allocations/sync-from-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`${data.added} alocações importadas com sucesso!`);
        fetchAllocations();
      } else {
        setError('Erro ao sincronizar escala.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearMonth = async () => {
    if (!confirm('ATENÇÃO: Deseja apagar TODAS as alocações deste mês? Esta ação não pode ser desfeita.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/monthly-allocations/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        })
      });

      if (res.ok) {
        setSuccess('Mês limpo com sucesso!');
        fetchAllocations();
      } else {
        setError('Erro ao limpar mês.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const nextDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);

    // If we have allocations in the current month, ask the user what to do
    if (allocations.length > 0) {
      setPendingMonthChange(nextDate);
      setShowMonthTransitionModal(true);
    } else {
      setCurrentDate(nextDate);
    }
  };

  const executeMonthTransition = async (action: 'copy_and_clear' | 'clear_only' | 'keep') => {
    if (!pendingMonthChange) return;

    setLoading(true);
    try {
      if (action === 'copy_and_clear') {
        // 1. Copy to new month
        await fetch('/api/monthly-allocations/copy-month', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromMonth: currentDate.getMonth() + 1,
            fromYear: currentDate.getFullYear(),
            toMonth: pendingMonthChange.getMonth() + 1,
            toYear: pendingMonthChange.getFullYear()
          })
        });

        // 2. Clear current month
        await fetch('/api/monthly-allocations/clear', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          })
        });

        setSuccess('Alocações copiadas e mês anterior limpo!');
      } else if (action === 'clear_only') {
        // Just clear current month
        await fetch('/api/monthly-allocations/clear', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          })
        });
        setSuccess('Mês anterior limpo!');
      }

      // Finally move to next month
      setCurrentDate(pendingMonthChange);
    } catch (err) {
      setError('Erro ao processar transição de mês.');
    } finally {
      setLoading(false);
      setShowMonthTransitionModal(false);
      setPendingMonthChange(null);
    }
  };

  const getOccupancyRate = () => {
    const totalSlots = daysInMonth.length * rooms.length * 2; // Only Morning and Afternoon
    let occupiedSlots = 0;
    allocations.forEach(a => {
      if (a.shift === 'MANHÃ/TARDE') {
        occupiedSlots += 2;
      } else {
        occupiedSlots += 1;
      }
    });
    return Math.round((occupiedSlots / totalSlots) * 100) || 0;
  };

  const getDoctorStats = () => {
    const stats: Record<string, { name: string, count: number }> = {};
    allocations.forEach(a => {
      if (!a.doctor_id) return;
      if (!stats[a.doctor_id]) {
        stats[a.doctor_id] = { name: a.doctor_name || 'Desconhecido', count: 0 };
      }
      stats[a.doctor_id].count++;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  };

  const getRoomStats = () => {
    const stats: Record<string, { name: string, count: number, color: string }> = {};
    rooms.forEach(r => {
      stats[r.id] = { name: r.name, count: 0, color: r.color };
    });
    allocations.forEach(a => {
      if (stats[a.room_id]) {
        stats[a.room_id].count++;
      }
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  };

  return (
    <div className="space-y-6 pb-20">
      <MonthlyHeader
        currentDate={currentDate}
        handleMonthChange={handleMonthChange}
        showReports={showReports}
        setShowReports={setShowReports}
        setFilterShift={setFilterShift}
        setIsShareModalOpen={setIsShareModalOpen}
      />

      {showReports ? (
        <MonthlyDashboard
          getOccupancyRate={getOccupancyRate}
          currentWeekIndex={currentWeekIndex}
          setCurrentWeekIndex={setCurrentWeekIndex}
          weeksLength={weeks.length}
          currentWeekDays={currentWeekDays}
          filterShift={filterShift}
          setFilterShift={setFilterShift}
          allocations={allocations}
          doctors={doctors}
          rooms={rooms}
          formatDoctorName={formatDoctorName}
        />
      ) : (
        <>
          {/* Stats & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Ocupação Mensal</p>
                <p className="text-2xl font-bold text-gray-800">{getOccupancyRate()}%</p>
              </div>
            </div>

            {/* Availability Filter */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 font-bold uppercase flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros de Visão
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHighlightFree(!highlightFree)}
                  className={`flex-1 text-xs font-bold py-2.5 rounded-lg border transition-all ${highlightFree
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-500'
                    }`}
                >
                  Destacar Livres
                </button>
                <select
                  className="flex-1 text-xs font-bold py-2.5 px-2 rounded-lg border border-gray-200 outline-none cursor-pointer"
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                >
                  <option value="ALL">Todos Turnos</option>
                  <option value="MANHÃ">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="MANHÃ/TARDE">Integral (M/T)</option>
                </select>
              </div>
            </div>

            {/* Action Button */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
              <button
                onClick={() => {
                  setSelectedDays([]);
                  setSelectedRoom('');
                  setSelectedDoctor('');
                  setIsAllocationModalOpen(true);
                }}
                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-brand-primary/20 font-bold text-sm active:scale-95 w-full justify-center"
              >
                <Plus className="w-5 h-5" />
                Nova Alocação em Massa
              </button>
            </div>
          </div>



          {/* Monthly Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Week Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                disabled={currentWeekIndex === 0}
                className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-green-600 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Semana Anterior
              </button>

              <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                Semana {currentWeekIndex + 1} de {weeks.length}
              </span>

              <button
                onClick={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
                disabled={currentWeekIndex === weeks.length - 1}
                className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-green-600 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm"
              >
                Próxima Semana
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>


            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-5 text-left text-xs font-black text-gray-400 uppercase border-r border-gray-200 sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                      Consultórios
                    </th>
                    {currentWeekDays.map(day => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const hasAllocations = allocations.some(a => a.date === dayStr);

                      return (
                        <th key={day.toISOString()} className="p-3 text-center border-r border-gray-200 min-w-[130px] group relative">
                          <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">
                            {format(day, 'EEEE', { locale: ptBR }).split('-')[0]}
                          </div>
                          <div className="text-xl font-black text-gray-800">
                            {format(day, 'dd')}
                          </div>

                          {/* Replicate Button */}
                          {hasAllocations && (
                            <button
                              onClick={() => handleReplicateDay(dayStr)}
                              disabled={isReplicating}
                              title="Replicar este dia para o mês todo"
                              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm text-green-600 hover:bg-green-50 hover:border-green-200 transition-all opacity-0 group-hover:opacity-100 z-20 disabled:opacity-50"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                      <td className="p-5 text-sm font-bold text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10 shadow-[4px_0_10px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: room.color }}></div>
                          <span className="truncate">{room.name}</span>
                        </div>
                      </td>
                      {currentWeekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayAllocations = allocations.filter(a => a.date === dateStr && a.room_id === room.id);

                        return (
                          <td key={dateStr} className="p-2 border-r border-gray-100 align-top">
                            <div className="space-y-1.5">
                              {['MANHÃ', 'TARDE'].map(slot => {
                                if (filterShift === 'MANHÃ' && slot === 'TARDE') return null;
                                if (filterShift === 'TARDE' && slot === 'MANHÃ') return null;

                                // Find allocation for this specific slot
                                // An allocation for 'MANHÃ/TARDE' counts for both slots
                                const alloc = dayAllocations.find(a =>
                                  a.shift === slot || a.shift === 'MANHÃ/TARDE'
                                );

                                const isHighlighted = highlightFree && !alloc;

                                // Check if the same doctor is allocated to the other shift in the same room/day
                                const isSameDoctorFullDay = alloc && alloc.shift !== 'MANHÃ/TARDE' && dayAllocations.some(a =>
                                  a.id !== alloc.id && a.doctor_id === alloc.doctor_id
                                );

                                const isInterdicted = alloc && !alloc.doctor_id;
                                // isBlue = alloc do tipo M/T OU mesmo médico nos dois turnos (visualmente integral)
                                const isBlue = !isInterdicted && (alloc?.shift === 'MANHÃ/TARDE' || isSameDoctorFullDay);

                                // Filtro Integral(M/T): oculta apenas alocações que NÃO são integrais de nenhuma forma.
                                // Mantém: vagas livres, alocações M/T e mesmo médico nos dois turnos (isBlue).
                                if (filterShift === 'MANHÃ/TARDE' && alloc && !isBlue) return null;

                                return (
                                  <div
                                    key={slot}
                                    draggable={!!alloc && !isInterdicted}
                                    onDragStart={(e) => {
                                      if (alloc && !isInterdicted) {
                                        setDraggedAlloc(alloc);
                                        e.dataTransfer.effectAllowed = 'copyMove';
                                      }
                                    }}
                                    onDragEnd={() => setDraggedAlloc(null)}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      if (isInterdicted) return;
                                      if (e.ctrlKey || e.metaKey) {
                                        e.dataTransfer.dropEffect = 'copy';
                                      } else {
                                        e.dataTransfer.dropEffect = 'move';
                                      }
                                      if (!alloc) e.currentTarget.classList.add('bg-green-100', 'border-green-400');
                                    }}
                                    onDragLeave={(e) => {
                                      e.currentTarget.classList.remove('bg-green-100', 'border-green-400');
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      if (isInterdicted) return;
                                      e.currentTarget.classList.remove('bg-green-100', 'border-green-400');
                                      handleDrop(dateStr, room.id, slot, e.ctrlKey || e.metaKey);
                                    }}
                                    className={`text-[10px] p-1.5 rounded-lg border flex justify-between items-center group transition-all ${alloc
                                      ? isInterdicted
                                        ? 'bg-red-50 border-red-200 text-red-800 shadow-sm opacity-80 cursor-pointer'
                                        : isBlue
                                          ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm cursor-grab active:cursor-grabbing'
                                          : alloc.shift === 'MANHÃ'
                                            ? 'bg-orange-50 border-orange-200 text-orange-800 shadow-sm cursor-grab active:cursor-grabbing'
                                            : 'bg-green-50 border-green-200 text-green-800 shadow-sm cursor-grab active:cursor-grabbing'
                                      : isHighlighted
                                        ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-[0_0_10px_rgba(234,179,8,0.3)] scale-105 z-10 cursor-pointer'
                                        : 'bg-gray-50/40 border-dashed border-gray-200 text-gray-400 opacity-40 hover:opacity-100 hover:bg-white hover:border-solid cursor-pointer'
                                      } ${draggedAlloc && !alloc ? 'ring-2 ring-green-400 ring-dashed' : ''}`}
                                    onClick={(e) => {
                                      if (isSpacePressed) {
                                        handleInterdiction(dateStr, room.id, slot, alloc);
                                        return;
                                      }

                                      if (isInterdicted) {
                                        // If clicked normally on interdicted, maybe show alert or allow delete?
                                        // For now, let's allow delete via the trash icon, or just do nothing on main click.
                                        return;
                                      }

                                      if (!alloc) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setQuickSelectContext({
                                          date: dateStr,
                                          roomId: room.id,
                                          shift: slot,
                                          roomName: room.name,
                                          x: rect.left,
                                          y: rect.bottom
                                        });
                                        setQuickSearchTerm('');
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-1 overflow-hidden">
                                      <span className="font-black opacity-40 min-w-[12px]">
                                        {isInterdicted ? <X className="w-3 h-3" /> : (isBlue ? 'I' : slot[0])}
                                      </span>
                                      <span className="font-bold truncate">
                                        {alloc ? (isInterdicted ? 'INTERDITADO' : formatDoctorName(alloc.doctor_name)) : 'Livre'}
                                      </span>
                                    </div>
                                    {alloc && (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        {!isInterdicted && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              setSwappingAlloc({ ...alloc, x: rect.left, y: rect.bottom });
                                              setSwapSearchTerm('');
                                            }}
                                            title="Trocar Médico"
                                            className="text-blue-500 hover:text-blue-700 p-0.5"
                                          >
                                            <RefreshCw className="w-3 h-3" />
                                          </button>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            handleDeleteAllocation(alloc.id, rect.left, rect.bottom);
                                          }}
                                          className="text-red-400 hover:text-red-600 p-0.5"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
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
          </div>
        </>
      )}

      {/* Quick Select Popover (Menubar Style) */}
      {quickSelectContext && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setQuickSelectContext(null)}
          />
          <div
            className="fixed z-[100] bg-white rounded-lg shadow-lg border border-gray-200 w-[280px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: Math.min(quickSelectContext.y + 8, window.innerHeight - 300),
              left: Math.min(quickSelectContext.x, window.innerWidth - 300),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 px-2 pb-2">
                <span className="font-bold text-gray-700">{format(parseISO(quickSelectContext.date), "dd/MM", { locale: ptBR })}</span>
                <span>•</span>
                <span className="truncate max-w-[100px]">{quickSelectContext.roomName}</span>
                <span>•</span>
                <span>{quickSelectContext.shift === 'MANHÃ' ? 'M' : quickSelectContext.shift === 'TARDE' ? 'T' : 'M/T'}</span>
              </div>
              <input
                type="text"
                placeholder="Filtrar médico..."
                className="w-full bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                value={quickSearchTerm}
                onChange={(e) => setQuickSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
              {doctors
                .filter(doc => doc.id !== 'INTERDITADO')
                .filter(doc => doc.name.toLowerCase().includes(quickSearchTerm.toLowerCase()))
                .map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleQuickSelect(doc.id)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-green-50 hover:text-green-700 transition-colors flex items-center gap-2 group text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold group-hover:bg-green-200 group-hover:text-green-800 shrink-0">
                      {doc.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-gray-700 group-hover:text-green-800 truncate">{doc.name}</p>
                      <p className="text-[10px] text-gray-400 group-hover:text-green-600 truncate">{doc.specialty}</p>
                    </div>
                  </button>
                ))}

              {doctors.filter(doc => doc.name.toLowerCase().includes(quickSearchTerm.toLowerCase())).length === 0 && (
                <div className="text-center py-3 text-xs text-gray-400">
                  Nenhum médico encontrado
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Allocation Modal */}
      {isAllocationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-green-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Nova Alocação em Massa</h3>
                <p className="text-green-100 text-xs">Selecione múltiplos dias para alocar o mesmo médico</p>
              </div>
              <button onClick={() => setIsAllocationModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Calendar Grid */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase">Selecione os Dias</label>
                  <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    {selectedDays.length} dias selecionados
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDays.includes(dateStr);
                    const dayNum = format(day, 'd');

                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDays(prev => prev.filter(d => d !== dateStr));
                          } else {
                            setSelectedDays(prev => [...prev, dateStr]);
                          }
                        }}
                        className={`aspect-square rounded-xl text-sm font-bold transition-all flex flex-col items-center justify-center border-2 ${isSelected
                          ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20 scale-105 z-10'
                          : 'bg-white border-gray-100 text-gray-600 hover:border-green-200 hover:bg-green-50'
                          }`}
                      >
                        <span>{dayNum}</span>
                        <span className="text-[8px] opacity-60 font-normal uppercase">{format(day, 'EEE', { locale: ptBR })}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedDays(daysInMonth.map(d => format(d, 'yyyy-MM-dd')))}
                    className="text-xs text-green-600 hover:text-green-700 font-bold underline decoration-green-200 hover:decoration-green-600 transition-all"
                  >
                    Selecionar Todos
                  </button>
                  <span className="mx-2 text-gray-300">|</span>
                  <button
                    onClick={() => setSelectedDays([])}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-all"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Right: Form Fields */}
              <div className="space-y-6 flex flex-col justify-center">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Consultório</label>
                    <select
                      className="w-full border border-gray-200 bg-white rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      value={selectedRoom || ''}
                    >
                      <option value="">Selecione...</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Médico(a)</label>
                    <select
                      id="doctor-select-modal"
                      className="w-full border border-gray-200 bg-white rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      value={selectedDoctor}
                    >
                      <option value="">Selecione...</option>
                      {doctors
                        .filter(doc => doc.id !== 'INTERDITADO')
                        .map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Turno</label>
                    <select
                      className="w-full border border-gray-200 bg-white rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      onChange={(e) => setSelectedShift(e.target.value)}
                      value={selectedShift}
                    >
                      <option value="MANHÃ">MANHÃ</option>
                      <option value="TARDE">TARDE</option>
                      <option value="MANHÃ/TARDE">MANHÃ/TARDE (M/T)</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm font-semibold animate-shake">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsAllocationModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddAllocation}
                    disabled={selectedDays.length === 0 || !selectedRoom || !selectedDoctor}
                    className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 active:scale-95"
                  >
                    Confirmar ({selectedDays.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popover */}
      {confirmDeleteState && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setConfirmDeleteState(null)}
          />
          <div
            className="fixed z-[100] bg-white rounded-lg shadow-lg border border-gray-200 w-[220px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: Math.min(confirmDeleteState.y + 8, window.innerHeight - 150),
              left: Math.min(confirmDeleteState.x - 180, window.innerWidth - 230), // Align to left of button usually
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-red-50/50 border-b border-red-100">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <Trash2 className="w-3.5 h-3.5" />
                Confirmar Exclusão
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-600 mb-3">
                Deseja realmente remover esta alocação?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteState(null)}
                  className="flex-1 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold transition-colors"
                >
                  Não
                </button>
                <button
                  onClick={executeDeleteAllocation}
                  className="flex-1 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm shadow-red-600/20"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Month Transition Modal */}
      {showMonthTransitionModal && pendingMonthChange && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setShowMonthTransitionModal(false);
              setPendingMonthChange(null);
            }}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-white rounded-2xl shadow-xl border border-gray-100 w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Copy className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Cópia de Alocações</h3>
                  <p className="text-sm text-gray-500">O que deseja fazer com as alocações?</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Você está saindo de <strong>{format(currentDate, 'MMMM', { locale: ptBR })}</strong>.
                Deseja copiar as alocações para <strong>{format(pendingMonthChange, 'MMMM', { locale: ptBR })}</strong> e limpar o mês anterior?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => executeMonthTransition('copy_and_clear')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Sim, colar no próximo mês
                </button>

                <button
                  onClick={() => executeMonthTransition('clear_only')}
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Não, apenas avançar o mês limpo
                </button>

                <button
                  onClick={() => {
                    setShowMonthTransitionModal(false);
                    setPendingMonthChange(null);
                  }}
                  className="w-full py-3 px-4 text-gray-400 hover:text-gray-600 text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsShareModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white border-b border-gray-100 px-5 md:px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-gray-900">Compartilhar Mapa</h2>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700 flex items-center">
                  <Link className="w-4 h-4 mr-2 text-brand-primary" />
                  Link público do mês ({format(currentDate, 'MMMM yyyy', { locale: ptBR })})
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/share-monthly?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs text-gray-600 font-mono focus:outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/share-monthly?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`;
                        navigator.clipboard.writeText(url);
                        setSuccess('Link copiado para a área de transferência!');
                        setIsShareModalOpen(false);
                      }}
                      title="Copiar link"
                      className="flex-1 sm:flex-none p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center font-bold text-xs gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="sm:hidden">Copiar</span>
                    </button>
                    <a
                      href={`/share-monthly?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir em nova aba"
                      className="flex-1 sm:flex-none p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center font-bold text-xs gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="sm:hidden">Abrir</span>
                    </a>
                  </div>
                </div>
              </div>
              <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl p-4">
                <p className="text-xs text-brand-secondary font-semibold leading-relaxed">
                  Este link permite que qualquer pessoa visualize o cronograma mensal atualizado em tempo real sem precisar de senha.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-full md:w-auto px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating Alerts */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-3 pointer-events-none">
        {error && (
          <div className="pointer-events-auto flex items-center gap-3 text-red-800 bg-red-50 p-4 rounded-xl border border-red-200 shadow-xl shadow-black/5 text-sm font-bold animate-in slide-in-from-right-10 fade-in duration-300 max-w-sm">
            <div className="bg-red-200 p-2 rounded-lg shrink-0">
              <AlertCircle className="w-5 h-5 text-red-700" />
            </div>
            <p>{error}</p>
            <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-100 rounded-lg text-red-800 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (() => {
          const config = getSuccessAlertConfig(success);
          return (
            <div className={`pointer-events-auto flex items-center gap-3 ${config.text} ${config.bg} p-4 rounded-xl border ${config.border} shadow-xl shadow-black/5 text-sm font-bold animate-in slide-in-from-right-10 fade-in duration-300 max-w-sm`}>
              <div className={`${config.iconBg} p-2 rounded-lg shrink-0`}>
                <config.Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <p>{success}</p>
              <button onClick={() => setSuccess('')} className={`ml-auto p-1 ${config.hoverBg} rounded-lg ${config.text} opacity-50 hover:opacity-100 transition-opacity`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })()}
      </div>

      {/* Swap Popover (Menubar Style) */}
      {swappingAlloc && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setSwappingAlloc(null)}
          />
          <div
            className="fixed z-[100] bg-white rounded-lg shadow-lg border border-gray-200 w-[280px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: Math.min(swappingAlloc.y + 8, window.innerHeight - 300),
              left: Math.min(swappingAlloc.x, window.innerWidth - 300),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-gray-100 bg-blue-50/50">
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="text-xs font-medium text-blue-800">
                  <span className="font-bold">Trocar Médico</span>
                  <span className="mx-1">•</span>
                  <span className="text-blue-600/70">{swappingAlloc.doctor_name}</span>
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar substituto..."
                className="w-full bg-white border border-blue-100 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={swapSearchTerm}
                onChange={(e) => setSwapSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
              {doctors
                .filter(d => d.id !== 'INTERDITADO' && d.id !== swappingAlloc.doctor_id)
                .filter(doc => doc.name.toLowerCase().includes(swapSearchTerm.toLowerCase()))
                .map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleSwapDoctor(doc.id)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2 group text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold group-hover:bg-blue-200 group-hover:text-blue-800 shrink-0">
                      {doc.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-gray-700 group-hover:text-blue-800 truncate">{doc.name}</p>
                      <p className="text-[10px] text-gray-400 group-hover:text-blue-600 truncate">{doc.specialty}</p>
                    </div>
                  </button>
                ))}

              {doctors
                .filter(d => d.id !== swappingAlloc.doctor_id)
                .filter(doc => doc.name.toLowerCase().includes(swapSearchTerm.toLowerCase())).length === 0 && (
                  <div className="text-center py-3 text-xs text-gray-400">
                    Nenhum substituto encontrado
                  </div>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
