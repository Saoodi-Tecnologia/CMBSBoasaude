import { useState, useEffect, useCallback } from 'react';
import { Doctor, Room, Schedule } from '../types';
import { supabase } from '../../supabase';

const SCHEDULE_SELECT = `
  id,
  week_start_date,
  day_of_week,
  shift,
  time_slot,
  room:rooms(name, type),
  doctor:doctors(name, specialty)
`;

function formatSchedule(s: any): Schedule {
    const room = s.room || { name: 'Sala Removida', type: 'N/A' };
    const doctor = s.doctor || { name: 'Medico Removido', specialty: 'N/A' };
    return {
        ...s,
        room_name: room.name,
        room_type: room.type,
        doctor_name: doctor.name,
        doctor_specialty: doctor.specialty,
    };
}

export function useScheduleData(selectedDate: string) {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [disabledDays, setDisabledDays] = useState<number[]>([]);

    const fetchDoctors = useCallback(async () => {
        const { data, error } = await supabase.from('doctors').select('*');
        if (!error) setDoctors(data || []);
    }, []);

    const fetchRooms = useCallback(async () => {
        const { data, error } = await supabase.from('rooms').select('*');
        if (!error && data) {
            const sorted = [...data].sort((a: Room, b: Room) =>
                a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
            );
            setRooms(sorted);
        }
    }, []);

    const fetchSchedules = useCallback(async () => {
        const { data: schedulesData, error: scheduleError } = await supabase
            .from('schedules')
            .select(SCHEDULE_SELECT)
            .eq('week_start_date', selectedDate);

        if (scheduleError) {
            console.error('Error fetching schedules:', scheduleError);
            return;
        }

        const { data: disabledData, error: disabledError } = await supabase
            .from('disabled_days')
            .select('day_of_week')
            .eq('week_start_date', selectedDate);

        if (disabledError) {
            console.error('Error fetching disabled days:', disabledError);
        }

        setSchedules((schedulesData || []).map(formatSchedule));
        setDisabledDays((disabledData || []).map((d: any) => d.day_of_week));
    }, [selectedDate]);

    useEffect(() => {
        fetchDoctors();
        fetchRooms();
    }, [fetchDoctors, fetchRooms]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const addSchedule = async (payload: {
        week_start_date: string;
        day_of_week: number;
        room_id: string;
        doctor_id: string;
        shift: string;
        time_slot: string;
    }) => {
        const { error } = await supabase.from('schedules').insert([payload]);
        if (!error) fetchSchedules();
        else console.error('Error adding schedule:', error);
    };

    const deleteSchedule = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta alocacao?')) return;
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (!error) fetchSchedules();
    };

    const toggleDayDisabled = async (dayIndex: number) => {
        const isDisabled = disabledDays.includes(dayIndex);
        if (!isDisabled) {
            await supabase
                .from('disabled_days')
                .upsert(
                    { week_start_date: selectedDate, day_of_week: dayIndex },
                    { onConflict: 'week_start_date,day_of_week' }
                );
        } else {
            await supabase
                .from('disabled_days')
                .delete()
                .eq('week_start_date', selectedDate)
                .eq('day_of_week', dayIndex);
        }
        fetchSchedules();
    };

    const clearWeek = async (weekDate: string) => {
        await supabase.from('schedules').delete().eq('week_start_date', weekDate);
        await supabase.from('disabled_days').delete().eq('week_start_date', weekDate);
    };

    return {
        doctors,
        rooms,
        schedules,
        disabledDays,
        fetchSchedules,
        addSchedule,
        deleteSchedule,
        toggleDayDisabled,
        clearWeek,
    };
}
