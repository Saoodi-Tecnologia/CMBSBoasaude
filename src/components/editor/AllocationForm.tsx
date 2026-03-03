import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Doctor, Room } from '../../types';

interface WeekDay {
    index: number;
    label: string;
    formattedDate: string;
}

interface AllocationFormProps {
    weekDays: WeekDay[];
    doctors: Doctor[];
    rooms: Room[];
    onAdd: (payload: {
        day: number;
        roomId: string;
        doctorId: string;
        shift: string;
        startTime: string;
        endTime: string;
    }) => void;
}

export default function AllocationForm({ weekDays, doctors, rooms, onAdd }: AllocationFormProps) {
    const [selectedDay, setSelectedDay] = useState<number>(weekDays[0]?.index ?? 1);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedShift, setSelectedShift] = useState('MANHA');
    const [startTime, setStartTime] = useState('07:00');
    const [endTime, setEndTime] = useState('13:00');

    const handleAdd = () => {
        if (!selectedRoom || !selectedDoctor) return;
        onAdd({
            day: selectedDay,
            roomId: selectedRoom,
            doctorId: selectedDoctor,
            shift: selectedShift,
            startTime,
            endTime,
        });
    };

    const inputClass =
        'mt-1 block w-full border border-gray-200 rounded p-2 text-sm focus:ring-1 focus:ring-brand-primary outline-none';
    const labelClass = 'block text-xs md:text-sm font-medium text-gray-700';

    return (
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Adicionar Alocacao</h2>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 md:gap-4 items-end">

                <div className="col-span-2 md:col-span-1">
                    <label className={labelClass}>Dia</label>
                    <select className={inputClass} value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))}>
                        {weekDays.map((day) => (
                            <option key={day.index} value={day.index}>
                                {day.label} ({day.formattedDate})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className={labelClass}>Sala</label>
                    <select className={inputClass} value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                        <option value="">Selecione...</option>
                        {rooms.map((room) => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className={labelClass}>Medico</label>
                    <select className={inputClass} value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                        <option value="">Selecione...</option>
                        {doctors.map((doc) => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className={labelClass}>Turno</label>
                    <select className={inputClass} value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)}>
                        <option value="MANHA">MANHA</option>
                        <option value="TARDE">TARDE</option>
                        <option value="M/T">M/T</option>
                    </select>
                </div>

                <div className="col-span-1 md:col-span-1">
                    <label className={labelClass}>Inicio</label>
                    <input type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div className="col-span-1 md:col-span-1">
                    <label className={labelClass}>Fim</label>
                    <input type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>

                <div className="col-span-2 md:col-span-1">
                    <button
                        onClick={handleAdd}
                        className="w-full bg-brand-primary text-white px-4 py-2 rounded hover:opacity-90 flex items-center justify-center transition-all text-sm font-bold"
                    >
                        <Plus className="w-5 h-5 mr-1 md:mr-2 flex-shrink-0" /> Adicionar
                    </button>
                </div>

            </div>
        </div>
    );
}
